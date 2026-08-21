-- Quoter: dag_nodes, dag_options, dag_edges
create table public.dag_nodes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  label         text not null,
  description   text,
  type          public.node_type not null,
  line          public.service_line,
  price_type    public.node_price_type not null default 'no_price',
  base_price    numeric(12,2),
  variable_id   uuid references public.variables(id),
  consumable_id uuid references public.consumables(id),
  rule_id       uuid references public.rules(id),
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.dag_nodes enable row level security;

create policy "public reads active nodes"
  on public.dag_nodes for select
  using (active = true);

create policy "admin manages nodes"
  on public.dag_nodes for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.dag_options (
  id          uuid primary key default gen_random_uuid(),
  node_id     uuid not null references public.dag_nodes(id) on delete cascade,
  code        text not null,
  label       text not null,
  description text,
  price_type  public.node_price_type not null default 'no_price',
  base_price  numeric(12,2),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(node_id, code)
);

alter table public.dag_options enable row level security;

create policy "public reads active options"
  on public.dag_options for select
  using (active = true);

create policy "admin manages options"
  on public.dag_options for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.dag_edges (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references public.dag_nodes(id) on delete cascade,
  target_id    uuid not null references public.dag_nodes(id) on delete cascade,
  condition    jsonb,
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint chk_no_self_loop check (source_id <> target_id)
);

create index idx_dag_edges_source on public.dag_edges(source_id);
create index idx_dag_edges_target on public.dag_edges(target_id);

alter table public.dag_edges enable row level security;

create policy "public reads active edges"
  on public.dag_edges for select
  using (active = true);

create policy "admin manages edges"
  on public.dag_edges for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );
