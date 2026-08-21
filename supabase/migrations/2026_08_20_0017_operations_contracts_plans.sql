-- Operations: contracts + operational_plans + scheduled_services + holidays
create table public.contracts (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  number          text not null unique,
  signed_date     date not null default current_date,
  start_date      date not null,
  end_date        date,
  status          text not null default 'active',
  lead_snapshot   jsonb not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_contracts_organization on public.contracts(organization_id);
create index idx_contracts_lead on public.contracts(lead_id);

alter table public.contracts enable row level security;

create policy "admin manages contracts"
  on public.contracts for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.operational_plans (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null references public.contracts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  version         int not null default 1,
  status          text not null default 'draft',
  activities      jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_plan_per_contract unique (contract_id, version)
);

create index idx_plans_contract on public.operational_plans(contract_id);
create index idx_plans_organization on public.operational_plans(organization_id);

alter table public.operational_plans enable row level security;

create policy "admin manages operational plans"
  on public.operational_plans for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.scheduled_services (
  id              uuid primary key default gen_random_uuid(),
  operational_plan_id uuid not null references public.operational_plans(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  activity        text not null,
  location        text,
  frequency       public.service_frequency not null,
  cron_rule       text,
  scheduled_date  date not null,
  time_window     tstzrange,
  estimated_duration_min int not null default 60,
  status          text not null default 'pending',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_services_plan on public.scheduled_services(operational_plan_id);
create index idx_services_date on public.scheduled_services(scheduled_date);
create index idx_services_organization on public.scheduled_services(organization_id);

alter table public.scheduled_services enable row level security;

create policy "admin manages scheduled services"
  on public.scheduled_services for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.holidays (
  id              uuid primary key default gen_random_uuid(),
  date            date not null,
  description     text not null,
  scope           text not null default 'national',
  organization_id uuid references public.organizations(id),
  created_at      timestamptz not null default now(),
  constraint chk_holiday_scope check (
    (scope = 'organization' and organization_id is not null)
    or (scope in ('national','departmental') and organization_id is null)
  )
);

create index idx_holidays_date on public.holidays(date);

alter table public.holidays enable row level security;

create policy "admin manages holidays"
  on public.holidays for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
