-- Operations: checklists + checklist_items + evidence + incidents + storage bucket
create table public.checklists (
  id              uuid primary key default gen_random_uuid(),
  work_order_id   uuid not null references public.work_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  title           text not null,
  created_at      timestamptz not null default now()
);

create index idx_checklists_work_order on public.checklists(work_order_id);

alter table public.checklists enable row level security;

create policy "admin sees all checklists"
  on public.checklists for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees checklists of assigned orders"
  on public.checklists for select
  using (
    exists (
      select 1 from public.assignments a
      where a.work_order_id = checklists.work_order_id
        and a.employee_id = auth.uid()
    )
  );

create table public.checklist_items (
  id              uuid primary key default gen_random_uuid(),
  checklist_id    uuid not null references public.checklists(id) on delete cascade,
  description     text not null,
  required        boolean not null default true,
  checked         boolean not null default false,
  checked_at      timestamptz,
  sort_order      int not null default 0
);

create index idx_checklist_items_checklist on public.checklist_items(checklist_id);

alter table public.checklist_items enable row level security;

create policy "admin sees all checklist items"
  on public.checklist_items for select
  using (
    exists (
      select 1 from public.checklists c
      join public.users u on u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
      where c.id = checklist_items.checklist_id
    )
  );

create policy "employee sees checklist items of assigned orders"
  on public.checklist_items for select
  using (
    exists (
      select 1 from public.checklists c
      join public.assignments a on a.work_order_id = c.work_order_id
      where c.id = checklist_items.checklist_id
        and a.employee_id = auth.uid()
    )
  );

create table public.evidence (
  id              uuid primary key default gen_random_uuid(),
  execution_id    uuid not null references public.executions(id) on delete cascade,
  work_order_id   uuid not null references public.work_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  type            public.evidence_type not null,
  storage_path    text not null,
  file_name       text not null,
  content_type    text not null,
  size_bytes      bigint,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);

create index idx_evidence_execution on public.evidence(execution_id);
create index idx_evidence_work_order on public.evidence(work_order_id);
create index idx_evidence_organization on public.evidence(organization_id);

alter table public.evidence enable row level security;

create policy "admin sees all evidence"
  on public.evidence for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees evidence of assigned orders"
  on public.evidence for select
  using (
    exists (
      select 1 from public.assignments a
      where a.work_order_id = evidence.work_order_id
        and a.employee_id = auth.uid()
    )
  );

create table public.incidents (
  id              uuid primary key default gen_random_uuid(),
  work_order_id   uuid not null references public.work_orders(id) on delete cascade,
  execution_id    uuid references public.executions(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  reported_by     uuid not null references public.users(id) on delete restrict,
  severity        public.incident_severity not null,
  title           text not null,
  description     text not null,
  status          text not null default 'open',
  resolution      text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_incidents_work_order on public.incidents(work_order_id);
create index idx_incidents_status on public.incidents(status);
create index idx_incidents_organization on public.incidents(organization_id);

alter table public.incidents enable row level security;

create policy "admin sees all incidents"
  on public.incidents for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees incidents of assigned orders"
  on public.incidents for select
  using (
    exists (
      select 1 from public.assignments a
      where a.work_order_id = incidents.work_order_id
        and a.employee_id = auth.uid()
    )
  );

-- Storage bucket for evidence (private, access via signed URLs)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "employee uploads evidence to assigned orders"
  on storage.objects for insert
  with check (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'employee'
        and u.status = 'active'
    )
  );

create policy "admin reads all evidence"
  on storage.objects for select
  using (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee reads evidence of assigned orders"
  on storage.objects for select
  using (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'employee'
        and u.status = 'active'
    )
  );
