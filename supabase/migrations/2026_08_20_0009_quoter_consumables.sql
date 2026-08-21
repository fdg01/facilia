-- Quoter: consumables table
create table public.consumables (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  label         text not null,
  description   text,
  quantity_mode public.quantity_mode not null default 'customer',
  fixed_quantity integer,
  rule_id       uuid references public.rules(id),
  unit_price    numeric(12,2) not null,
  category      text,
  levels        jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.consumables enable row level security;

create policy "public reads active consumables"
  on public.consumables for select
  using (active = true);

create policy "admin manages consumables"
  on public.consumables for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
