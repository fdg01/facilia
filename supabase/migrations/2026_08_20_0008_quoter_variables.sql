-- Quoter: variables table
create table public.variables (
  id            uuid primary key default gen_random_uuid(),
  type          public.variable_type not null,
  code          text not null unique,
  label         text not null,
  performance_m2_per_hour numeric(8,2),
  supply_cost_per_m2      numeric(8,2),
  visits_per_month        integer,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.variables enable row level security;

create policy "public reads active variables"
  on public.variables for select
  using (active = true);

create policy "admin manages variables"
  on public.variables for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
