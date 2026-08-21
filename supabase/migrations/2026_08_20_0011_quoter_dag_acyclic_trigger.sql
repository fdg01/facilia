-- Quoter: DAG acyclicity validation trigger
create or replace function public.validate_dag_acyclic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source uuid := coalesce(new.source_id, old.source_id);
  v_target uuid := coalesce(new.target_id, old.target_id);
  v_cycle boolean;
begin
  with recursive reachable as (
    select target_id from dag_edges where source_id = v_target and active = true
    union
    select e.target_id
    from dag_edges e
    join reachable r on e.source_id = r.target_id
    where e.active = true
  )
  select exists(select 1 from reachable where target_id = v_source) into v_cycle;

  if v_cycle then
    raise exception 'DAG_INVALID: edge % -> % creates a cycle', v_source, v_target;
  end if;

  return new;
end;
$$;

create trigger trg_validate_dag_acyclic
  before insert or update on public.dag_edges
  for each row execute function public.validate_dag_acyclic();
