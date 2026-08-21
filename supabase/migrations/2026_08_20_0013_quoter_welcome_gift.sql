-- Quoter: welcome_gift table
create table public.welcome_gift (
  id            uuid primary key default gen_random_uuid(),
  description   text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index idx_welcome_gift_active_unique
  on public.welcome_gift (active) where active = true;

alter table public.welcome_gift enable row level security;

create policy "public reads active welcome gift"
  on public.welcome_gift for select
  using (active = true);

create policy "admin manages welcome gift"
  on public.welcome_gift for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
