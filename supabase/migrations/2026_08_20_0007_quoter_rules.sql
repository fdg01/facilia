-- Quoter: rules table (referenced by dag_nodes and consumables)
create table public.rules (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  label       text not null,
  description text,
  type        text not null,
  expression  jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.rules enable row level security;

create policy "public reads active rules"
  on public.rules for select
  using (active = true);

create policy "admin manages rules"
  on public.rules for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
