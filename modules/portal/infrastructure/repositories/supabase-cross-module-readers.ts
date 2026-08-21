// modules/portal/infrastructure/repositories/supabase-cross-module-readers.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ServiceReader, CalendarReader, EvidenceReader, ContractReader, PaymentReader,
  ExtendedDashboardRepository,
} from '../../domain/portal-repositories'
import type {
  ServiceSummary, CalendarVisit, EvidenceItem, ContractSummary, PaymentSummary,
  ExtendedDashboardData,
} from '../../domain/portal-entities'

export class SupabaseServiceReader implements ServiceReader {
  constructor(private readonly client: SupabaseClient) {}

  async listByOrganization(organizationId: string): Promise<ServiceSummary[]> {
    // Services are derived from operational_plans + contracts
    const { data, error } = await this.client
      .from('operational_plans')
      .select(`
        id, contract_id, organization_id, status, activities,
        contracts!inner(id, number, status, start_date, end_date, lead_snapshot)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
    if (error) throw error

    return (data ?? []).map((row) => {
      const contract = row.contracts as unknown as Record<string, unknown>
      const activities = (row.activities as unknown as Array<Record<string, unknown>>) ?? []
      const firstActivity = activities[0] ?? {}
      const snapshot = (contract.lead_snapshot as Record<string, unknown>) ?? {}
      return {
        id: row.id as string,
        contractId: row.contract_id as string,
        line: (snapshot.mainLine ?? null) as ServiceSummary['line'],
        description: (firstActivity.activity as string) ?? 'Servicio',
        frequency: (firstActivity.frequency as string) ?? null,
        scope: (firstActivity.description as string) ?? null,
        schedule: null,
        status: 'active' as const,
        nextVisit: null,
      }
    })
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<ServiceSummary | null> {
    const { data, error } = await this.client
      .from('operational_plans')
      .select(`
        id, contract_id, organization_id, status, activities,
        contracts!inner(id, number, status, start_date, end_date, lead_snapshot)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const contract = data.contracts as unknown as Record<string, unknown>
    const activities = (data.activities as unknown as Array<Record<string, unknown>>) ?? []
    const firstActivity = activities[0] ?? {}
    const snapshot = (contract.lead_snapshot as Record<string, unknown>) ?? {}
    return {
      id: data.id as string,
      contractId: data.contract_id as string,
      line: (snapshot.mainLine ?? null) as ServiceSummary['line'],
      description: (firstActivity.activity as string) ?? 'Servicio',
      frequency: (firstActivity.frequency as string) ?? null,
      scope: (firstActivity.description as string) ?? null,
      schedule: null,
      status: 'active' as const,
      nextVisit: null,
    }
  }
}

export class SupabaseCalendarReader implements CalendarReader {
  constructor(private readonly client: SupabaseClient) {}

  async listByOrganization(organizationId: string, from: Date, to: Date): Promise<CalendarVisit[]> {
    const { data, error } = await this.client
      .from('work_orders')
      .select('id, scheduled_date, status, title, estimated_duration_min')
      .eq('organization_id', organizationId)
      .gte('scheduled_date', from.toISOString().split('T')[0])
      .lte('scheduled_date', to.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
    if (error) throw error

    return (data ?? []).map((row) => {
      const statusMap: Record<string, CalendarVisit['status']> = {
        created: 'scheduled',
        assigned: 'scheduled',
        accepted: 'scheduled',
        in_progress: 'in_progress',
        completed: 'completed',
        validated: 'completed',
        with_incidents: 'in_progress',
        cancelled: 'cancelled',
      }
      return {
        id: row.id as string,
        date: row.scheduled_date as string,
        timeWindow: null,
        status: statusMap[row.status as string] ?? 'scheduled',
        serviceDescription: row.title as string,
        employeeName: null,
      }
    })
  }
}

export class SupabaseEvidenceReader implements EvidenceReader {
  constructor(
    private readonly client: SupabaseClient,
    private readonly generateSignedUrl: (storagePath: string) => Promise<string>,
  ) {}

  async listAuthorizedByOrganization(organizationId: string): Promise<EvidenceItem[]> {
    // Join evidence with evidence_visibility to get only authorized evidence
    const { data, error } = await this.client
      .from('evidence_visibility')
      .select(`
        evidence_id,
        evidence!inner(id, type, storage_path, file_name, work_order_id, created_at)
      `)
      .eq('organization_id', organizationId)
    if (error) throw error

    const items: EvidenceItem[] = []
    for (const row of data ?? []) {
      const evidence = row.evidence as unknown as Record<string, unknown>
      const storagePath = evidence.storage_path as string
      let signedUrl = ''
      try {
        signedUrl = await this.generateSignedUrl(storagePath)
      } catch {
        signedUrl = ''
      }
      items.push({
        id: evidence.id as string,
        type: evidence.type as EvidenceItem['type'],
        description: evidence.file_name as string,
        workOrderId: evidence.work_order_id as string,
        date: new Date(evidence.created_at as string).toISOString(),
        signedUrl,
      })
    }
    return items
  }

  async findAuthorizedByIdAndOrganization(id: string, organizationId: string): Promise<EvidenceItem | null> {
    const { data, error } = await this.client
      .from('evidence_visibility')
      .select(`
        evidence_id,
        evidence!inner(id, type, storage_path, file_name, work_order_id, created_at)
      `)
      .eq('organization_id', organizationId)
      .eq('evidence_id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const evidence = data.evidence as unknown as Record<string, unknown>
    const storagePath = evidence.storage_path as string
    let signedUrl = ''
    try {
      signedUrl = await this.generateSignedUrl(storagePath)
    } catch {
      signedUrl = ''
    }
    return {
      id: evidence.id as string,
      type: evidence.type as EvidenceItem['type'],
      description: evidence.file_name as string,
      workOrderId: evidence.work_order_id as string,
      date: new Date(evidence.created_at as string).toISOString(),
      signedUrl,
    }
  }
}

export class SupabaseContractReader implements ContractReader {
  constructor(private readonly client: SupabaseClient) {}

  async listByOrganization(organizationId: string): Promise<ContractSummary[]> {
    const { data, error } = await this.client
      .from('contracts')
      .select('id, number, status, start_date, end_date, lead_snapshot')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error

    return (data ?? []).map((row) => {
      const snapshot = (row.lead_snapshot as Record<string, unknown>) ?? {}
      return {
        id: row.id as string,
        number: row.number as string,
        status: row.status as ContractSummary['status'],
        startDate: row.start_date as string,
        endDate: (row.end_date ?? null) as string | null,
        scope: (snapshot.mainLine as string) ?? null,
      }
    })
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<ContractSummary | null> {
    const { data, error } = await this.client
      .from('contracts')
      .select('id, number, status, start_date, end_date, lead_snapshot')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const snapshot = (data.lead_snapshot as Record<string, unknown>) ?? {}
    return {
      id: data.id as string,
      number: data.number as string,
      status: data.status as ContractSummary['status'],
      startDate: data.start_date as string,
      endDate: (data.end_date ?? null) as string | null,
      scope: (snapshot.mainLine as string) ?? null,
    }
  }
}

export class SupabasePaymentReader implements PaymentReader {
  constructor(private readonly client: SupabaseClient) {}

  async listByOrganization(_organizationId: string): Promise<PaymentSummary[]> {
    // No payments table exists yet — return empty until billing module is built
    return []
  }

  async findByIdAndOrganization(_id: string, _organizationId: string): Promise<PaymentSummary | null> {
    return null
  }
}

export class SupabaseExtendedDashboardRepository implements ExtendedDashboardRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getExtendedSummary(organizationId: string): Promise<ExtendedDashboardData> {
    // Leads count
    const { count: totalLeads } = await this.client
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const { count: pendingLeads } = await this.client
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'sent'])

    // Active services (operational plans in active state)
    const { count: activeServices } = await this.client
      .from('operational_plans')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    // Open requests
    const { count: openRequests } = await this.client
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'open')

    // Unread communications
    const { count: unreadCommunications } = await this.client
      .from('communications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('read', false)

    // Next visit
    const today = new Date().toISOString().split('T')[0]
    const { data: nextOrder } = await this.client
      .from('work_orders')
      .select('scheduled_date')
      .eq('organization_id', organizationId)
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    return {
      totalLeads: totalLeads ?? 0,
      recentLeads: [],
      pendingLeads: pendingLeads ?? 0,
      activeServices: activeServices ?? 0,
      nextVisit: nextOrder?.scheduled_date ?? null,
      openRequests: openRequests ?? 0,
      unreadCommunications: unreadCommunications ?? 0,
    }
  }
}
