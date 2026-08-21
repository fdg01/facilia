-- Portal: RLS policy for client to create leads in their own organization
-- Plan 03 — Portal del Cliente (fase mínima)

-- A client can create leads associated with their own organization
-- The WITH CHECK clause ensures organization_id matches the user's org
create policy "client creates leads in own organization"
  on public.leads for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'client'
        and u.status = 'active'
        and u.organization_id = leads.organization_id
    )
  );

-- A client can insert lead_selections for leads in their organization
create policy "client creates selections for own leads"
  on public.lead_selections for insert
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_selections.lead_id
        and exists (
          select 1 from public.users u
          where u.id = auth.uid()
            and u.role = 'client'
            and u.status = 'active'
            and u.organization_id = l.organization_id
        )
    )
  );

-- A client can insert lead_snapshots for leads in their organization
create policy "client creates snapshots for own leads"
  on public.lead_snapshots for insert
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_snapshots.lead_id
        and exists (
          select 1 from public.users u
          where u.id = auth.uid()
            and u.role = 'client'
            and u.status = 'active'
            and u.organization_id = l.organization_id
        )
    )
  );
