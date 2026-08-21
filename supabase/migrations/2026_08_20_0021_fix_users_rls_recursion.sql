-- Fix: infinite recursion in RLS policies for public.users
--
-- The original policies (migration 0004) queried public.users from within
-- policies ON public.users, causing infinite recursion when an authenticated
-- user tries to read the table.
--
-- Fix: replace the subqueries with SECURITY DEFINER functions that bypass
-- RLS, so the policy can check the caller's role/organization without
-- re-entering the policy on the same table.

-- ── Helper functions (SECURITY DEFINER, bypass RLS) ──────────

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select u.status
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.organization_id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

-- ── Drop recursive policies ──────────────────────────────────

drop policy if exists "user sees own profile" on public.users;
drop policy if exists "admin sees all users" on public.users;
drop policy if exists "client sees users in own organization" on public.users;
drop policy if exists "admin modifies users" on public.users;
drop policy if exists "user edits own profile" on public.users;
drop policy if exists "admin creates users" on public.users;

-- ── Recreate policies using the helper functions ─────────────

-- each user sees their own profile
create policy "user sees own profile"
  on public.users for select
  using (auth_id = auth.uid());

-- admin sees all users
create policy "admin sees all users"
  on public.users for select
  using (
    public.current_user_role() = 'admin'
    and public.current_user_status() = 'active'
  );

-- a client sees other users in their organization (read-only)
create policy "client sees users in own organization"
  on public.users for select
  using (
    public.current_user_role() = 'client'
    and public.current_user_status() = 'active'
    and organization_id = public.current_user_organization_id()
  );

-- only admin can modify users
create policy "admin modifies users"
  on public.users for update
  using (
    public.current_user_role() = 'admin'
    and public.current_user_status() = 'active'
  )
  with check (
    public.current_user_role() = 'admin'
    and public.current_user_status() = 'active'
  );

-- a user can update their own profile (first_name, last_name, phone)
create policy "user edits own profile"
  on public.users for update
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- only admin can insert users
create policy "admin creates users"
  on public.users for insert
  with check (
    public.current_user_role() = 'admin'
    and public.current_user_status() = 'active'
  );
