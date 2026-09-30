-- The seed loads with triggers (and so FK checks) disabled; prove it still
-- satisfies every relationship the constraints would have enforced.
\set ON_ERROR_STOP on
do $$ begin
  if exists (select 1 from public.tasks t left join public.workspace_members m
             on m.workspace_id = t.workspace_id and m.user_id = t.assignee_id
             where t.assignee_id is not null and m.user_id is null) then
    raise exception 'seed: task assignee is not a workspace member';
  end if;
  if exists (select 1 from public.tasks t join public.projects p on p.id = t.project_id
             where p.workspace_id <> t.workspace_id) then
    raise exception 'seed: task project in another workspace';
  end if;
  if exists (select 1 from public.projects p left join public.workspace_members m
             on m.workspace_id = p.workspace_id and m.user_id = p.lead_id
             where p.lead_id is not null and m.user_id is null) then
    raise exception 'seed: project lead is not a member';
  end if;
  if exists (select 1 from public.subtasks s join public.tasks t on t.id = s.task_id
             where t.workspace_id <> s.workspace_id) then
    raise exception 'seed: subtask workspace mismatch';
  end if;
  if exists (select 1 from public.workspace_members m left join public.profiles p on p.id = m.user_id where p.id is null) then
    raise exception 'seed: member without profile';
  end if;
  if exists (select 1 from public.workspaces w where w.task_counter < (select coalesce(max(number), 0) from public.tasks t where t.workspace_id = w.id)) then
    raise exception 'seed: task counter behind existing numbers';
  end if;
end $$;
