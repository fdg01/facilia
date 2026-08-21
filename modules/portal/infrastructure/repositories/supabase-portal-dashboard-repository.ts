// modules/portal/infrastructure/repositories/supabase-portal-dashboard-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PortalDashboardRepository } from '../../domain/repositories'
import type { DashboardData, LeadSummary, LeadStatus } from '../../domain/types'

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

export class SupabasePortalDashboardRepository implements PortalDashboardRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSummary(organizationId: string): Promise<DashboardData> {
    // Total leads count
    const { count: totalLeads, error: totalError } = await this.client
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (totalError) throw totalError

    // Pending leads (status = 'sent')
    const { count: pendingLeads, error: pendingError } = await this.client
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')

    if (pendingError) throw pendingError

    // Recent leads (last 5)
    const { data: recentData, error: recentError } = await this.client
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    return {
      totalLeads: totalLeads ?? 0,
      pendingLeads: pendingLeads ?? 0,
      recentLeads: (recentData ?? []).map((r) => mapRowToSummary(r as unknown as Record<string, unknown>)),
    }
  }
}
