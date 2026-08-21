// modules/portal/infrastructure/repositories/supabase-service-event-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceEventRepository, EvidenceVisibilityRepository } from '../../domain/portal-repositories'
import type { ServiceEvent, EvidenceVisibility } from '../../domain/portal-entities'

function mapRowToEvent(row: Record<string, unknown>): ServiceEvent {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    workOrderId: (row.work_order_id ?? null) as string | null,
    contractId: (row.contract_id ?? null) as string | null,
    type: row.type as ServiceEvent['type'],
    description: row.description as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: new Date(row.created_at as string),
  }
}

export class SupabaseServiceEventRepository implements ServiceEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOrganization(organizationId: string, from?: Date, to?: Date): Promise<ServiceEvent[]> {
    let query = this.client
      .from('service_events')
      .select('*')
      .eq('organization_id', organizationId)
    if (from) query = query.gte('created_at', from.toISOString())
    if (to) query = query.lte('created_at', to.toISOString())
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((r) => mapRowToEvent(r as unknown as Record<string, unknown>))
  }

  async findByWorkOrder(workOrderId: string): Promise<ServiceEvent[]> {
    const { data, error } = await this.client
      .from('service_events')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToEvent(r as unknown as Record<string, unknown>))
  }
}

export class SupabaseEvidenceVisibilityRepository implements EvidenceVisibilityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOrganization(organizationId: string): Promise<EvidenceVisibility[]> {
    const { data, error } = await this.client
      .from('evidence_visibility')
      .select('*')
      .eq('organization_id', organizationId)
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id as string,
      evidenceId: r.evidence_id as string,
      organizationId: r.organization_id as string,
      authorizedBy: r.authorized_by as string,
      authorizedAt: new Date(r.authorized_at as string),
    }))
  }
}
