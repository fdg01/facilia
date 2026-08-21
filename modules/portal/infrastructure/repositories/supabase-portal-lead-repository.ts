// modules/portal/infrastructure/repositories/supabase-portal-lead-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PortalLeadRepository } from '../../domain/repositories'
import type { LeadSummary, LeadDetail, LeadStatus, LeadSelection, LeadSnapshot } from '../../domain/types'

function mapRowToSummary(row: Record<string, unknown>): LeadSummary {
  return {
    id: row.id as string,
    number: row.number as string,
    status: row.status as LeadStatus,
    totalMonthly: Number(row.total_monthly ?? 0),
    totalPerVisit: Number(row.total_per_visit ?? 0),
    mainLine: (row.main_line ?? null) as LeadSummary['mainLine'],
    createdAt: new Date(row.created_at as string),
  }
}

function mapRowToDetail(
  leadRow: Record<string, unknown>,
  selections: Record<string, unknown>[],
  snapshot: Record<string, unknown> | null,
): LeadDetail {
  return {
    ...mapRowToSummary(leadRow),
    organizationId: (leadRow.organization_id ?? null) as string | null,
    userId: (leadRow.user_id ?? null) as string | null,
    name: leadRow.name as string,
    email: leadRow.email as string,
    phone: leadRow.phone as string,
    selections: selections.map((s) => ({
      nodeId: s.node_id as string,
      optionId: (s.option_id ?? null) as string | null,
      value: (s.value ?? null) as Record<string, unknown> | null,
    })) as LeadSelection[],
    snapshot: snapshot ? {
      detail: snapshot.detail as Record<string, unknown>,
      parameters: snapshot.parameters as Record<string, unknown>,
      dag: snapshot.dag as Record<string, unknown>,
    } : null,
    giftIncluded: Boolean(leadRow.gift_included),
    giftDescription: (leadRow.gift_description ?? null) as string | null,
    updatedAt: new Date(leadRow.updated_at as string),
  }
}

export class SupabasePortalLeadRepository implements PortalLeadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByOrganization(
    organizationId: string,
    filters: { page: number; pageSize: number; status?: LeadStatus },
  ): Promise<{ data: LeadSummary[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1

    let query = this.client
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)

    if (filters.status) query = query.eq('status', filters.status)

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, count, error } = await query
    if (error) throw error

    return {
      data: (data ?? []).map((r) => mapRowToSummary(r as unknown as Record<string, unknown>)),
      total: count ?? 0,
    }
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<LeadDetail | null> {
    const { data: leadData, error } = await this.client
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error
    if (!leadData) return null

    const [selRes, snapRes] = await Promise.all([
      this.client.from('lead_selections').select('*').eq('lead_id', id).order('sort_order'),
      this.client.from('lead_snapshots').select('*').eq('lead_id', id).maybeSingle(),
    ])

    if (selRes.error) throw selRes.error

    return mapRowToDetail(
      leadData as unknown as Record<string, unknown>,
      (selRes.data ?? []) as unknown as Record<string, unknown>[],
      snapRes.data as unknown as Record<string, unknown> | null,
    )
  }
}
