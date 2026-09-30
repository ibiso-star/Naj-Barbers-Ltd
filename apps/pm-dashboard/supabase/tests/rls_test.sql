-- RLS, grant, and trigger assertions. Each block raises on failure.
\set ON_ERROR_STOP on
set client_min_messages = warning;

-- Fixtures (as the superuser, bypassing RLS) ---------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ada@example.test',   '{"full_name":"Ada Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'mo@example.test',    '{"full_name":"Mo Member"}'),
  ('00000000-0000-0000-0000-00000000000c', 'olu@example.test',   '{"full_name":"Olu Outsider"}');

insert into public.workspaces (id, slug, name) values
  ('10000000-0000-0000-0000-000000000001', 'alpha', 'Alpha'),
  ('10000000-0000-0000-0000-000000000002', 'beta',  'Beta');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000c', 'admin');
insert into public.projects (id, workspace_id, key, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'WEB', 'Website'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'OPS', 'Beta ops');
insert into public.tasks (id, workspace_id, project_id, title) values
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Beta secret');

create function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  execute 'set role authenticated';
end $$;

-- T1 profile trigger ----------------------------------------------------------
do $$ begin
  if (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'Ada Admin' then
    raise exception 'T1 failed: profile not created from auth user';
  end if;
end $$;

-- T2 member sees own workspace only (J2 permission path, SEC-003) -----------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
do $$ begin
  if (select count(*) from public.workspaces) <> 1 then raise exception 'T2 failed: workspace leak'; end if;
  if exists (select 1 from public.tasks where title = 'Beta secret') then raise exception 'T2 failed: task leak'; end if;
  if exists (select 1 from public.profiles where email = 'olu@example.test') then raise exception 'T2 failed: profile leak'; end if;
end $$;

-- T3 member creates a task; server assigns number/creator/activity ----------
insert into public.tasks (id, workspace_id, project_id, title, status)
values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', 'Ship pricing page', 'todo');
do $$ declare t public.tasks; begin
  select * into t from public.tasks where id = '30000000-0000-0000-0000-000000000001';
  if t.number <> 1 then raise exception 'T3 failed: number %', t.number; end if;
  if t.created_by <> '00000000-0000-0000-0000-00000000000b' then raise exception 'T3 failed: created_by'; end if;
  if not exists (select 1 from public.task_activity where task_id = t.id and kind = 'created') then
    raise exception 'T3 failed: no created activity';
  end if;
end $$;

-- T4 moving to done stamps completed_at and logs a status change -------------
update public.tasks set status = 'done' where id = '30000000-0000-0000-0000-000000000001';
do $$ begin
  if (select completed_at from public.tasks where id = '30000000-0000-0000-0000-000000000001') is null then
    raise exception 'T4 failed: completed_at not set';
  end if;
  if not exists (select 1 from public.task_activity where kind = 'status' and to_value = 'done') then
    raise exception 'T4 failed: status activity missing';
  end if;
end $$;

-- T5 mass assignment is rejected by column grants (SEC-004) -----------------
do $$ begin
  begin
    update public.tasks set number = 99 where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'T5 failed: number was writable';
  exception when insufficient_privilege then null; end;
  begin
    update public.tasks set workspace_id = '10000000-0000-0000-0000-000000000002'
      where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'T5 failed: workspace_id was writable';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.task_activity (workspace_id, task_id, kind)
      values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'created');
    raise exception 'T5 failed: activity was client-writable';
  exception when insufficient_privilege then null; end;
end $$;

-- T6 cross-tenant writes are rejected (SEC-001/003) -------------------------
do $$ begin
  begin
    insert into public.tasks (workspace_id, title)
      values ('10000000-0000-0000-0000-000000000002', 'Injected');
    raise exception 'T6 failed: inserted into foreign workspace';
  exception when insufficient_privilege then null; end;
  update public.tasks set title = 'Pwned' where title = 'Beta secret';
  -- A project from another workspace cannot be attached (composite FK).
  begin
    update public.tasks set project_id = '20000000-0000-0000-0000-000000000002'
      where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'T6 failed: cross-workspace project attached';
  exception when foreign_key_violation then null; end;
  -- An outsider cannot be assigned (must be a member of this workspace).
  begin
    update public.tasks set assignee_id = '00000000-0000-0000-0000-00000000000c'
      where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'T6 failed: non-member assigned';
  exception when foreign_key_violation then null; end;
end $$;

-- T7 members cannot invite, change roles, or rename (J4) --------------------
do $$ begin
  begin
    insert into public.workspace_invitations (workspace_id, email)
      values ('10000000-0000-0000-0000-000000000001', 'new@example.test');
    raise exception 'T7 failed: member invited';
  exception when insufficient_privilege then null; end;
end $$;
update public.workspace_members set role = 'admin' where user_id = '00000000-0000-0000-0000-00000000000b';
update public.workspaces set name = 'Hijacked';
reset role;
do $$ begin
  if (select role from public.workspace_members where user_id = '00000000-0000-0000-0000-00000000000b') <> 'member' then
    raise exception 'T7 failed: member self-promoted';
  end if;
  if (select name from public.workspaces where slug = 'alpha') <> 'Alpha' then raise exception 'T7 failed: renamed'; end if;
  if (select title from public.tasks where id = '30000000-0000-0000-0000-000000000002') <> 'Beta secret' then
    raise exception 'T6 failed: cross-tenant update applied';
  end if;
end $$;

-- T8 admins can invite and rename; last admin is protected -------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.workspace_invitations (workspace_id, email, role)
  values ('10000000-0000-0000-0000-000000000001', 'new@example.test', 'member');
update public.workspaces set name = 'Alpha Studio' where slug = 'alpha';
do $$ begin
  begin
    update public.workspace_members set role = 'member' where user_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'T8 failed: last admin demoted';
  exception when raise_exception then null; end;
end $$;
reset role;
do $$ begin
  if (select name from public.workspaces where slug = 'alpha') <> 'Alpha Studio' then raise exception 'T8 failed: rename'; end if;
  if (select count(*) from public.workspace_invitations) <> 1 then raise exception 'T8 failed: invite'; end if;
end $$;

-- T9 create_workspace makes the caller admin ---------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select public.create_workspace('Mo''s side project', 'mo-side');
reset role;
do $$ begin
  if not exists (select 1 from public.workspace_members m join public.workspaces w on w.id = m.workspace_id
                 where w.slug = 'mo-side' and m.user_id = '00000000-0000-0000-0000-00000000000b' and m.role = 'admin') then
    raise exception 'T9 failed';
  end if;
end $$;

-- T11 server-side validation: CHECK constraints reject bad input (SEC-013)
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
do $$ begin
  begin
    insert into public.tasks (workspace_id, title) values ('10000000-0000-0000-0000-000000000001', repeat('x', 201));
    raise exception 'T11 failed: 201-char title accepted';
  exception when check_violation then null; end;
  begin
    insert into public.tasks (workspace_id, title) values ('10000000-0000-0000-0000-000000000001', '   ');
    raise exception 'T11 failed: blank title accepted';
  exception when check_violation then null; end;
  begin
    insert into public.tasks (workspace_id, title, status) values ('10000000-0000-0000-0000-000000000001', 'x', 'archived');
    raise exception 'T11 failed: unknown status accepted';
  exception when invalid_text_representation then null; end;
  begin
    insert into public.workspace_invitations (workspace_id, email) values ('10000000-0000-0000-0000-000000000001', 'not-an-email');
    raise exception 'T11 failed: invalid email accepted';
  exception when check_violation then null; end;
  begin
    insert into public.projects (workspace_id, key, name) values ('10000000-0000-0000-0000-000000000001', 'web1', 'Bad key');
    raise exception 'T11 failed: invalid project key accepted';
  exception when check_violation then null; end;
  begin
    insert into public.projects (workspace_id, key, name, budget_cents) values ('10000000-0000-0000-0000-000000000001', 'NEG', 'Negative', -1);
    raise exception 'T11 failed: negative budget accepted';
  exception when check_violation then null; end;
end $$;
reset role;

-- T10 anon sees nothing -------------------------------------------------------
set role anon;
do $$ begin
  begin
    perform count(*) from public.tasks;
    raise exception 'T10 failed: anon could read tasks';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select 'ALL RLS TESTS PASSED' as result;
