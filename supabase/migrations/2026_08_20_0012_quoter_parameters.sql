-- Quoter: parameters + parameter_audit + audit trigger
create table public.parameters (
  id              uuid primary key default gen_random_uuid(),
  operator_hourly_cost numeric(12,2) not null,
  margin_percentage    numeric(5,2) not null,
  margin_mode          public.margin_mode not null default 'on_cost',
  active_from          timestamptz not null default now(),
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index idx_parameters_active_unique
  on public.parameters (active) where active = true;

alter table public.parameters enable row level security;

create policy "public reads active parameters"
  on public.parameters for select
  using (active = true);

create policy "admin manages parameters"
  on public.parameters for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create table public.parameter_audit (
  id              uuid primary key default gen_random_uuid(),
  parameter_id    uuid not null references public.parameters(id) on delete cascade,
  user_id         uuid not null references public.users(id),
  action          text not null,
  previous_value  jsonb,
  new_value       jsonb,
  created_at      timestamptz not null default now()
);

create index idx_parameter_audit_parameter on public.parameter_audit(parameter_id);

alter table public.parameter_audit enable row level security;

create policy "admin reads parameter audit"
  on public.parameter_audit for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
        and u.status = 'active'
    )
  );

create or replace function public.audit_parameter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into parameter_audit (parameter_id, user_id, action, previous_value, new_value)
  values (
    coalesce(new.id, old.id),
    auth.uid(),
    case when tg_op = 'INSERT' then 'created'
         when tg_op = 'UPDATE' then 'updated'
         when tg_op = 'DELETE' then 'deactivated'
    end,
    case when tg_op = 'UPDATE' or tg_op = 'DELETE' then to_jsonb(old) else null end,
    case when tg_op = 'INSERT' or tg_op = 'UPDATE' then to_jsonb(new) else null end
  );
  return new;
end;
$$;

create trigger trg_audit_parameter
  after insert or update or delete on public.parameters
  for each row execute function public.audit_parameter();
