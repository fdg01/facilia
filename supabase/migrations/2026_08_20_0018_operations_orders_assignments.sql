-- Operations: work_orders + assignments + executions
create table public.work_orders (
  id                  uuid primary key default gen_random_uuid(),
  scheduled_service_id uuid references public.scheduled_services(id) on delete set null,
  operational_plan_id uuid references public.operational_plans(id) on delete cascade,
  organization_id     uuid not null references public.organizations(id) on delete restrict,
  number              text not null unique,
  title               text not null,
  description         text,
  location            text not null,
  scheduled_date      date not null,
  time_window         tstzrange,
  estimated_duration_min int not null default 60,
  status              public.work_order_status not null default 'created',
  started_at          timestamptz,
  finished_at         timestamptz,
  actual_duration_min int,
  sla_met             boolean,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_work_orders_status on public.work_orders(status);
create index idx_work_orders_date on public.work_orders(scheduled_date);
create index idx_work_orders_organization on public.work_orders(organization_id);
create index idx_work_orders_service on public.work_orders(scheduled_service_id);

alter table public.work_orders enable row level security;

create policy "admin sees all work orders"
  on public.work_orders for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees assigned work orders"
  on public.work_orders for select
  using (
    exists (
      select 1 from public.assignments a
      where a.work_order_id = work_orders.id
        and a.employee_id = auth.uid()
    )
  );

create policy "admin creates work orders"
  on public.work_orders for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "admin updates work orders"
  on public.work_orders for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.assignments (
  id              uuid primary key default gen_random_uuid(),
  work_order_id   uuid not null references public.work_orders(id) on delete cascade,
  employee_id     uuid not null references public.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  crew_role       text default 'worker',
  status          text not null default 'pending',
  accepted_at     timestamptz,
  rejected_at     timestamptz,
  rejection_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_assignments_work_order on public.assignments(work_order_id);
create index idx_assignments_employee on public.assignments(employee_id);

alter table public.assignments enable row level security;

create policy "admin sees all assignments"
  on public.assignments for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees own assignments"
  on public.assignments for select
  using (employee_id = auth.uid());

create policy "admin manages assignments"
  on public.assignments for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.executions (
  id              uuid primary key default gen_random_uuid(),
  work_order_id   uuid not null references public.work_orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  employee_id     uuid not null references public.users(id) on delete restrict,
  observations    text,
  progress        int not null default 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_executions_work_order on public.executions(work_order_id);
create index idx_executions_employee on public.executions(employee_id);

alter table public.executions enable row level security;

create policy "admin sees all executions"
  on public.executions for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "employee sees own executions"
  on public.executions for select
  using (employee_id = auth.uid());
