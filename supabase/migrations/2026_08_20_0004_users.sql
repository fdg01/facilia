-- Table: users
-- Plan 01 · Identity module · ADR-002 (no super_admin, must_change_password)
--
-- Linked to auth.users via auth_id (= auth.users.id).
-- The handle_new_user trigger inserts a row into public.users automatically
-- when a record is created in auth.users.

create table if not exists public.users (
  id                   uuid primary key default gen_random_uuid(),
  auth_id              uuid unique references auth.users(id) on delete cascade,
  email                text not null unique,
  first_name           text not null,
  last_name            text not null,
  role                 public.user_role not null,
  status               public.user_status not null default 'active',
  organization_id      uuid references public.organizations(id),
  phone                text,
  must_change_password boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- a client always has an organization
  constraint chk_client_has_org check (
    (role = 'client' and organization_id is not null)
    or (role <> 'client')
  ),
  -- an admin or employee never has an organization
  constraint chk_non_client_no_org check (
    not (role <> 'client' and organization_id is not null)
  )
);

-- Trigger updated_at
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;

-- each user sees their own profile
create policy "user sees own profile"
  on public.users for select
  using (id = auth.uid());

-- admin sees all users
create policy "admin sees all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

-- a client sees other users in their organization (read-only)
create policy "client sees users in own organization"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'client'
        and u.status = 'active'
        and u.organization_id = users.organization_id
    )
  );

-- only admin can modify users
create policy "admin modifies users"
  on public.users for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

-- a user can update their own profile (first_name, last_name, phone)
-- Note: this policy allows UPDATE but the application layer restricts which fields
create policy "user edits own profile"
  on public.users for update
  using (id = auth.uid());

-- only admin can insert users (creation is done via service role,
-- but this policy covers direct insertion)
create policy "admin creates users"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
