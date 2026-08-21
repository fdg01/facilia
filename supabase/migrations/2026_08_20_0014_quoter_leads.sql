-- Quoter: leads, lead_selections, lead_snapshots + lead number sequence
create sequence public.lead_number_seq start 1;

create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique,
  status          public.lead_status not null default 'draft',
  name            text not null,
  email           text not null,
  phone           text not null,
  organization_id uuid references public.organizations(id),
  user_id         uuid references public.users(id),
  total_monthly   numeric(12,2),
  total_per_visit numeric(12,2),
  parameters_snapshot jsonb,
  dag_version     text,
  gift_included   boolean not null default true,
  gift_description text,
  main_line       public.service_line,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_organization on public.leads(organization_id);
create index idx_leads_email on public.leads(email);

alter table public.leads enable row level security;

create policy "client sees own leads"
  on public.leads for select
  using (
    user_id = auth.uid()
    or (
      exists (
        select 1 from public.users u
        where u.id = auth.uid()
          and u.role = 'client'
          and u.status = 'active'
          and u.organization_id = leads.organization_id
      )
    )
  );

create policy "admin sees all leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create policy "admin modifies lead"
  on public.leads for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.lead_selections (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  node_id     uuid not null references public.dag_nodes(id),
  option_id   uuid references public.dag_options(id),
  value       jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_lead_selections_lead on public.lead_selections(lead_id);

alter table public.lead_selections enable row level security;

create policy "client sees selections of own leads"
  on public.lead_selections for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_selections.lead_id
        and (l.user_id = auth.uid()
             or exists (
               select 1 from public.users u
               where u.id = auth.uid()
                 and u.role = 'client'
                 and u.status = 'active'
                 and u.organization_id = l.organization_id
             ))
    )
  );

create policy "admin sees all selections"
  on public.lead_selections for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.lead_snapshots (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  detail      jsonb not null,
  parameters  jsonb not null,
  dag         jsonb not null,
  created_at  timestamptz not null default now()
);

alter table public.lead_snapshots enable row level security;

create policy "client sees snapshot of own leads"
  on public.lead_snapshots for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_snapshots.lead_id
        and (l.user_id = auth.uid()
             or exists (
               select 1 from public.users u
               where u.id = auth.uid()
                 and u.role = 'client'
                 and u.status = 'active'
                 and u.organization_id = l.organization_id
             ))
    )
  );

create policy "admin sees all snapshots"
  on public.lead_snapshots for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

-- Storage bucket for lead PDFs
insert into storage.buckets (id, name, public) values ('leads', 'leads', false)
on conflict (id) do nothing;
