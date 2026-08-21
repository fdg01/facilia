-- Table: organizations
-- Plan 01 · Identity module

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tax_id      text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger updated_at
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- RLS
alter table public.organizations enable row level security;

-- admin manages organizations (all operations)
create policy "admin manages organizations"
  on public.organizations for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

-- a client sees only their organization (read-only)
create policy "client sees own organization"
  on public.organizations for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'client'
        and u.status = 'active'
        and u.organization_id = organizations.id
    )
  );
