# Flows — Keel

Sitemap and critical journeys (`PRD.md` §2). The diagram lives in the repo
as Mermaid, which GitHub renders, instead of in a separate FigJam file.

```mermaid
flowchart TD
  start([Visit /]) --> mode{Supabase configured?}
  mode -- no --> demo[/Demo: /w/atlas/overview/]
  mode -- yes --> session{Signed in?}
  session -- no --> login[/login: magic link/] --> callback[/auth/callback/] --> session
  session -- yes --> ws{Member of any workspace?}
  ws -- no --> onboarding[/onboarding: create workspace/]
  ws -- yes --> overview

  subgraph shell [Workspace shell /w/:slug — server checks membership under RLS]
    overview[Overview: KPIs, completion, velocity, workload, overdue]
    projects[Projects list] -->|New project| projectModal[[New project modal]]
    tasks[Tasks: Board or List + fuzzy search and filters]
    team[Team: members, roles, invitations]
    settings[Settings and billing]
    tasks -->|Add task / C| taskModal[[New task modal]] -->|lands in Todo| tasks
    tasks -->|click card| drawer[[Task drawer: status, assignee, description, subtasks, activity]]
    overview -->|overdue item| drawer
    overview -->|heatmap row| tasks
    team -->|Invite team| invite[[Invite modal]]
  end

  demo --> overview
  shell -.->|slug not yours or missing| noaccess[No-access screen]
```

## Journey paths

| Journey | Normal | Failure | Permission denied | Empty | Recovery |
|---|---|---|---|---|---|
| J1 create and move a task | Modal → Todo → drag → saved and synced | Card snaps back, toast explains | Non-member write rejected by RLS | "No tasks yet" and one create action | Retry from the toast; server state wins |
| J2 switch workspace | Switcher lists only your workspaces | Load error with Retry | Typed URL → no-access screen | No workspaces → onboarding | Switcher / "Back to your workspaces" |
| J3 edit in the drawer | Each field saves on change | Field rolls back, toast | Same as J1 | "No activity yet" | Retry from the toast |
| J4 invite a teammate | Admin records invite | Validation or conflict message | Member sees who can invite; DB rejects anyway | "No pending invitations" | Revoke and re-invite |
