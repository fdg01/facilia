// modules/operations/infrastructure/repositories/supabase-checklist-evidence-incident-holiday-repositories.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ChecklistRepository, EvidenceRepository, IncidentRepository, HolidayRepository, IndicatorsRepository,
} from '../../domain/repositories'
import type { Checklist, ChecklistItem, Evidence, Incident, Holiday, IncidentSeverity } from '../../domain/entities'

function mapRowToChecklist(row: Record<string, unknown>): Checklist {
  return {
    id: row.id as string,
    workOrderId: row.work_order_id as string,
    organizationId: row.organization_id as string,
    title: row.title as string,
    createdAt: new Date(row.created_at as string),
  }
}

function mapRowToItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    checklistId: row.checklist_id as string,
    description: row.description as string,
    required: row.required as boolean,
    checked: row.checked as boolean,
    checkedAt: row.checked_at ? new Date(row.checked_at as string) : null,
    sortOrder: (row.sort_order ?? 0) as number,
  }
}

export class SupabaseChecklistRepository implements ChecklistRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    workOrderId: string; organizationId: string; title: string;
    items: Array<{ description: string; required: boolean }>
  }): Promise<Checklist> {
    const { data, error } = await this.client.from('checklists').insert({
      work_order_id: input.workOrderId,
      organization_id: input.organizationId,
      title: input.title,
    }).select().single()
    if (error) throw error
    const checklist = mapRowToChecklist(data as unknown as Record<string, unknown>)

    if (input.items.length > 0) {
      const itemRows = input.items.map((item, i) => ({
        checklist_id: checklist.id,
        description: item.description,
        required: item.required,
        sort_order: i,
      }))
      const { error: itemError } = await this.client.from('checklist_items').insert(itemRows)
      if (itemError) throw itemError
    }

    return checklist
  }

  async findByWorkOrder(workOrderId: string): Promise<Checklist[]> {
    const { data, error } = await this.client.from('checklists').select('*').eq('work_order_id', workOrderId)
    if (error) throw error
    return (data ?? []).map((r) => mapRowToChecklist(r as unknown as Record<string, unknown>))
  }

  async findItems(checklistId: string): Promise<ChecklistItem[]> {
    const { data, error } = await this.client.from('checklist_items').select('*').eq('checklist_id', checklistId).order('sort_order')
    if (error) throw error
    return (data ?? []).map((r) => mapRowToItem(r as unknown as Record<string, unknown>))
  }

  async updateItemChecked(itemId: string, checked: boolean, checkedAt: Date | null): Promise<ChecklistItem> {
    const { data, error } = await this.client.from('checklist_items')
      .update({ checked, checked_at: checkedAt?.toISOString() ?? null })
      .eq('id', itemId).select().single()
    if (error) throw error
    return mapRowToItem(data as unknown as Record<string, unknown>)
  }

  async listItemsByWorkOrder(workOrderId: string): Promise<ChecklistItem[]> {
    const checklists = await this.findByWorkOrder(workOrderId)
    const allItems: ChecklistItem[] = []
    for (const c of checklists) {
      const items = await this.findItems(c.id)
      allItems.push(...items)
    }
    return allItems
  }
}

function mapRowToEvidence(row: Record<string, unknown>): Evidence {
  return {
    id: row.id as string,
    executionId: row.execution_id as string,
    workOrderId: row.work_order_id as string,
    organizationId: row.organization_id as string,
    type: row.type as Evidence['type'],
    storagePath: row.storage_path as string,
    fileName: row.file_name as string,
    contentType: row.content_type as string,
    sizeBytes: (row.size_bytes ?? null) as number | null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: new Date(row.created_at as string),
  }
}

export class SupabaseEvidenceRepository implements EvidenceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    executionId: string; workOrderId: string; organizationId: string;
    type: string; storagePath: string; fileName: string; contentType: string
  }): Promise<Evidence> {
    const { data, error } = await this.client.from('evidence').insert({
      execution_id: input.executionId,
      work_order_id: input.workOrderId,
      organization_id: input.organizationId,
      type: input.type,
      storage_path: input.storagePath,
      file_name: input.fileName,
      content_type: input.contentType,
    }).select().single()
    if (error) throw error
    return mapRowToEvidence(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<Evidence | null> {
    const { data, error } = await this.client.from('evidence').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToEvidence(data as unknown as Record<string, unknown>)
  }

  async findByWorkOrder(workOrderId: string): Promise<Evidence[]> {
    const { data, error } = await this.client.from('evidence').select('*').eq('work_order_id', workOrderId).order('created_at')
    if (error) throw error
    return (data ?? []).map((r) => mapRowToEvidence(r as unknown as Record<string, unknown>))
  }

  async updateMetadata(id: string, sizeBytes: number, metadata: Record<string, unknown>): Promise<Evidence> {
    const { data, error } = await this.client.from('evidence')
      .update({ size_bytes: sizeBytes, metadata })
      .eq('id', id).select().single()
    if (error) throw error
    return mapRowToEvidence(data as unknown as Record<string, unknown>)
  }
}

function mapRowToIncident(row: Record<string, unknown>): Incident {
  return {
    id: row.id as string,
    workOrderId: row.work_order_id as string,
    executionId: (row.execution_id ?? null) as string | null,
    organizationId: row.organization_id as string,
    reportedBy: row.reported_by as string,
    severity: row.severity as IncidentSeverity,
    title: row.title as string,
    description: row.description as string,
    status: row.status as Incident['status'],
    resolution: (row.resolution ?? null) as string | null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseIncidentRepository implements IncidentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    workOrderId: string; executionId: string | null; organizationId: string;
    reportedBy: string; severity: IncidentSeverity; title: string; description: string
  }): Promise<Incident> {
    const { data, error } = await this.client.from('incidents').insert({
      work_order_id: input.workOrderId,
      execution_id: input.executionId,
      organization_id: input.organizationId,
      reported_by: input.reportedBy,
      severity: input.severity,
      title: input.title,
      description: input.description,
    }).select().single()
    if (error) throw error
    return mapRowToIncident(data as unknown as Record<string, unknown>)
  }

  async findByWorkOrder(workOrderId: string): Promise<Incident[]> {
    const { data, error } = await this.client.from('incidents').select('*').eq('work_order_id', workOrderId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToIncident(r as unknown as Record<string, unknown>))
  }

  async list(filters: { organizationId?: string; status?: string; page: number; pageSize: number }): Promise<{ data: Incident[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    let query = this.client.from('incidents').select('*', { count: 'exact' })
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.status) query = query.eq('status', filters.status)
    query = query.range(from, to).order('created_at', { ascending: false })
    const { data, count, error } = await query
    if (error) throw error
    return { data: (data ?? []).map((r) => mapRowToIncident(r as unknown as Record<string, unknown>)), total: count ?? 0 }
  }

  async updateStatus(id: string, status: string, resolution?: string): Promise<Incident> {
    const updateData: Record<string, unknown> = { status }
    if (resolution !== undefined) {
      updateData.resolution = resolution
      updateData.resolved_at = new Date().toISOString()
    }
    const { data, error } = await this.client.from('incidents').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return mapRowToIncident(data as unknown as Record<string, unknown>)
  }
}

function mapRowToHoliday(row: Record<string, unknown>): Holiday {
  return {
    id: row.id as string,
    date: new Date(row.date as string),
    description: row.description as string,
    scope: row.scope as Holiday['scope'],
    organizationId: (row.organization_id ?? null) as string | null,
    createdAt: new Date(row.created_at as string),
  }
}

export class SupabaseHolidayRepository implements HolidayRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    date: Date; description: string; scope: string; organizationId: string | null
  }): Promise<Holiday> {
    const { data, error } = await this.client.from('holidays').insert({
      date: input.date.toISOString().split('T')[0],
      description: input.description,
      scope: input.scope,
      organization_id: input.organizationId,
    }).select().single()
    if (error) throw error
    return mapRowToHoliday(data as unknown as Record<string, unknown>)
  }

  async list(filters: { fromDate?: Date; toDate?: Date; organizationId?: string }): Promise<Holiday[]> {
    let query = this.client.from('holidays').select('*')
    if (filters.fromDate) query = query.gte('date', filters.fromDate.toISOString().split('T')[0])
    if (filters.toDate) query = query.lte('date', filters.toDate.toISOString().split('T')[0])
    query = query.order('date')
    const { data, error } = await query
    if (error) throw error
    let holidays = (data ?? []).map((r) => mapRowToHoliday(r as unknown as Record<string, unknown>))
    if (filters.organizationId) {
      holidays = holidays.filter((h) => h.scope !== 'organization' || h.organizationId === filters.organizationId)
    }
    return holidays
  }

  async findAll(): Promise<Holiday[]> {
    const { data, error } = await this.client.from('holidays').select('*').order('date')
    if (error) throw error
    return (data ?? []).map((r) => mapRowToHoliday(r as unknown as Record<string, unknown>))
  }
}

export class SupabaseIndicatorsRepository implements IndicatorsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async calculate(filters: {
    organizationId?: string; employeeId?: string; fromDate?: Date; toDate?: Date
  }) {
    let query = this.client.from('work_orders').select('*').eq('status', 'validated')
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.fromDate) query = query.gte('scheduled_date', filters.fromDate.toISOString().split('T')[0])
    if (filters.toDate) query = query.lte('scheduled_date', filters.toDate.toISOString().split('T')[0])
    const { data, error } = await query
    if (error) throw error

    const orders = data ?? []
    const completedOrders = orders.length
    const totalActual = orders.reduce((sum, o) => sum + (o.actual_duration_min ?? 0), 0)
    const totalEstimated = orders.reduce((sum, o) => sum + (o.estimated_duration_min ?? 0), 0)
    const slaMetCount = orders.filter((o) => o.sla_met === true).length

    // Incidents count
    let incidentQuery = this.client.from('incidents').select('*', { count: 'exact', head: true })
    if (filters.organizationId) incidentQuery = incidentQuery.eq('organization_id', filters.organizationId)
    const { count: ordersWithIncidents } = await incidentQuery

    return {
      avgActualDurationMin: completedOrders > 0 ? Math.round(totalActual / completedOrders) : 0,
      avgEstimatedDurationMin: completedOrders > 0 ? Math.round(totalEstimated / completedOrders) : 0,
      slaCompliancePct: completedOrders > 0 ? Math.round((slaMetCount / completedOrders) * 100) : 0,
      completedOrders,
      ordersWithIncidents: ordersWithIncidents ?? 0,
      performanceByEmployee: [],
    }
  }
}
