-- Keel — initial schema.
--
-- Tenancy model (PRD.md §5): every tenant table carries workspace_id and is
-- protected by row-level security keyed on workspace membership. The client
-- also filters by the active workspace, but RLS is the security boundary.
--
-- Mass-assignment protection (SEC-004): table-wide INSERT/UPDATE is revoked
-- from the `authenticated` role and re-granted column by column, so server-
-- owned fields (ids of other rows, numbers, audit columns, roles) cannot be
-- written from the browser even when an RLS policy would allow the row.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.workspace_role as enum ('admin', 'member');
create type public.task_status    as enum ('backlog', 'todo', 'in_progress', 'done');
create type public.task_priority  as enum ('low', 'medium', 'high');
create type public.project_status as enum ('planned', 'active', 'paused', 'completed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '' check (char_length(full_name) <= 80),
  created_at  timestamptz not null default now()
);

create table public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$'),
  name         text not null check (char_length(name) between 1 and 80),
  plan         text not null default 'free' check (plan in ('free', 'team', 'business')),
  -- Per-workspace counter for human-readable task numbers; advanced by trigger.
  task_counter integer not null default 0,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         public.workspace_role not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

create table public.workspace_invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  role         public.workspace_role not null default 'member',
  invited_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  -- PRD.md §5: invitations are personal data and expire after 30 days.
  expires_at   timestamptz not null default now() + interval '30 days',
  accepted_at  timestamptz
);
create unique index workspace_invitations_pending_uniq
  on public.workspace_invitations (workspace_id, lower(email)) where accepted_at is null;

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  key          text not null check (key ~ '^[A-Z]{2,5}$'),
  name         text not null check (char_length(name) between 1 and 80),
  description  text not null default '' check (char_length(description) <= 2000),
  status       public.project_status not null default 'planned',
  lead_id      uuid,
  budget_cents bigint not null default 0 check (budget_cents between 0 and 100000000000),
  color        text not null default '#3987e5' check (color ~ '^#[0-9a-f]{6}$'),
  start_date   date,
  target_date  date,
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, key),
  -- Composite key so child rows can prove they belong to the same workspace.
  unique (id, workspace_id),
  -- The lead must be a member of this workspace (not merely any user).
  foreign key (workspace_id, lead_id)
    references public.workspace_members (workspace_id, user_id) on delete set null (lead_id),
  check (target_date is null or start_date is null or target_date >= start_date)
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid,
  number       integer not null default 0,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text not null default '' check (char_length(description) <= 10000),
  status       public.task_status not null default 'todo',
  priority     public.task_priority not null default 'medium',
  assignee_id  uuid,
  due_date     date,
  -- Fractional ordering within a column: a move writes one row, not the column.
  position     double precision not null default 0,
  completed_at timestamptz,
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, number),
  unique (id, workspace_id),
  foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id) on delete set null (project_id),
  foreign key (workspace_id, assignee_id)
    references public.workspace_members (workspace_id, user_id) on delete set null (assignee_id)
);
create index tasks_workspace_status_idx on public.tasks (workspace_id, status, position);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_assignee_idx on public.tasks (workspace_id, assignee_id);

create table public.subtasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  task_id      uuid not null,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  done         boolean not null default false,
  position     double precision not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (task_id, workspace_id)
    references public.tasks (id, workspace_id) on delete cascade
);
create index subtasks_task_idx on public.subtasks (task_id, position);

-- Append-only; written only by triggers below, never by clients.
create table public.task_activity (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null,
  task_id      uuid not null,
  actor_id     uuid references public.profiles (id) on delete set null,
  kind         text not null check (kind in (
                 'created', 'status', 'assignee', 'priority', 'due_date',
                 'title', 'project', 'description', 'subtask_added', 'subtask_completed')),
  from_value   text,
  to_value     text,
  created_at   timestamptz not null default now(),
  foreign key (task_id, workspace_id)
    references public.tasks (id, workspace_id) on delete cascade
);
create index task_activity_task_idx on public.task_activity (task_id, created_at desc);
create index task_activity_workspace_idx on public.task_activity (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Authorisation helpers
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so policies on workspace_members can call them without
-- recursing into their own RLS. search_path is pinned to avoid hijacking.

create function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create function public.is_workspace_admin(ws uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

create function public.shares_workspace_with(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Every auth user gets a profile; the name comes from sign-up metadata if any.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- Server-owned task fields: number, creator, completion timestamp.
create function public.tasks_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.workspaces
       set task_counter = task_counter + 1
     where id = new.workspace_id
    returning task_counter into new.number;
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.updated_at := now();
  end if;

  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;
create trigger tasks_before_write before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

create function public.tasks_log_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, to_value)
    values (new.workspace_id, new.id, actor, 'created', new.status::text);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'status', old.status::text, new.status::text);
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'assignee', old.assignee_id::text, new.assignee_id::text);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'priority', old.priority::text, new.priority::text);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'due_date', old.due_date::text, new.due_date::text);
  end if;
  if new.title is distinct from old.title then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'title', old.title, new.title);
  end if;
  if new.project_id is distinct from old.project_id then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, from_value, to_value)
    values (new.workspace_id, new.id, actor, 'project', old.project_id::text, new.project_id::text);
  end if;
  if new.description is distinct from old.description then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind)
    values (new.workspace_id, new.id, actor, 'description');
  end if;
  return new;
end;
$$;
create trigger tasks_log_activity after insert or update on public.tasks
  for each row execute function public.tasks_log_activity();

create function public.subtasks_log_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, to_value)
    values (new.workspace_id, new.task_id, auth.uid(), 'subtask_added', new.title);
  elsif new.done and not old.done then
    insert into public.task_activity (workspace_id, task_id, actor_id, kind, to_value)
    values (new.workspace_id, new.task_id, auth.uid(), 'subtask_completed', new.title);
  end if;
  return new;
end;
$$;
create trigger subtasks_log_activity after insert or update on public.subtasks
  for each row execute function public.subtasks_log_activity();

-- A workspace must always keep at least one admin (J4 recovery path).
create function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    -- Cascading workspace deletes remove every member; allow those.
    if not exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
      return coalesce(new, old);
    end if;
    if not exists (
      select 1 from public.workspace_members m
      where m.workspace_id = old.workspace_id and m.role = 'admin' and m.user_id <> old.user_id
    ) then
      raise exception 'A workspace needs at least one admin' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger workspace_members_protect_last_admin
  before update or delete on public.workspace_members
  for each row execute function public.protect_last_admin();

-- Creating a workspace also makes the caller its first admin, atomically.
create function public.create_workspace(p_name text, p_slug text)
returns public.workspaces language plpgsql security definer set search_path = '' as $$
declare
  ws public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  insert into public.workspaces (name, slug, created_by)
  values (btrim(p_name), lower(btrim(p_slug)), auth.uid())
  returning * into ws;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws.id, auth.uid(), 'admin');
  return ws;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.workspaces            enable row level security;
alter table public.workspace_members     enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.projects              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.subtasks              enable row level security;
alter table public.task_activity         enable row level security;

create policy "profiles: self or teammates can read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_workspace_with(id));
create policy "profiles: self can update" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces: members can read" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces: admins can update" on public.workspaces
  for update to authenticated
  using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
create policy "workspaces: admins can delete" on public.workspaces
  for delete to authenticated using (public.is_workspace_admin(id));

create policy "members: teammates can read" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members: admins can change roles" on public.workspace_members
  for update to authenticated
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy "members: admins remove, anyone leaves" on public.workspace_members
  for delete to authenticated
  using (public.is_workspace_admin(workspace_id) or user_id = auth.uid());

create policy "invitations: members can read" on public.workspace_invitations
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "invitations: admins can create" on public.workspace_invitations
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id) and invited_by = auth.uid());
create policy "invitations: admins can revoke" on public.workspace_invitations
  for delete to authenticated using (public.is_workspace_admin(workspace_id));

create policy "projects: members can read" on public.projects
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "projects: members can create" on public.projects
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "projects: members can update" on public.projects
  for update to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "projects: admins can delete" on public.projects
  for delete to authenticated using (public.is_workspace_admin(workspace_id));

create policy "tasks: members can read" on public.tasks
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "tasks: members can create" on public.tasks
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "tasks: members can update" on public.tasks
  for update to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "tasks: members can delete" on public.tasks
  for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "subtasks: members can read" on public.subtasks
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "subtasks: members can create" on public.subtasks
  for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "subtasks: members can update" on public.subtasks
  for update to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "subtasks: members can delete" on public.subtasks
  for delete to authenticated using (public.is_workspace_member(workspace_id));

create policy "activity: members can read" on public.task_activity
  for select to authenticated using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Column-level grants (SEC-004)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke insert, update, delete on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

grant update (full_name) on public.profiles to authenticated;
grant update (name) on public.workspaces to authenticated;
grant delete on public.workspaces to authenticated;
grant update (role) on public.workspace_members to authenticated;
grant delete on public.workspace_members to authenticated;
grant insert (workspace_id, email, role, invited_by) on public.workspace_invitations to authenticated;
grant delete on public.workspace_invitations to authenticated;
grant insert (id, workspace_id, key, name, description, status, lead_id, budget_cents, color, start_date, target_date)
  on public.projects to authenticated;
grant update (name, description, status, lead_id, budget_cents, color, start_date, target_date)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant insert (id, workspace_id, project_id, title, description, status, priority, assignee_id, due_date, position)
  on public.tasks to authenticated;
grant update (project_id, title, description, status, priority, assignee_id, due_date, position)
  on public.tasks to authenticated;
grant delete on public.tasks to authenticated;
grant insert (id, workspace_id, task_id, title, done, position) on public.subtasks to authenticated;
grant update (title, done, position) on public.subtasks to authenticated;
grant delete on public.subtasks to authenticated;

revoke execute on function public.create_workspace(text, text) from public, anon;
grant execute on function public.create_workspace(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (F4): broadcast row changes; Realtime applies the RLS above.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.tasks, public.projects, public.subtasks,
                public.task_activity, public.workspace_members;
  end if;
end;
$$;
