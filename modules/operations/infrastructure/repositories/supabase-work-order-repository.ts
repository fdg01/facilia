// modules/operations/infrastructure/repositories/supabase-work-order-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkOrderRepository } from '../../domain/repositories'
import type { WorkOrder, WorkOrderStatus } from '../../domain/entities'
import { generateWorkOrderNumber } from '../../domain/value-objects'

function mapRowToOrder(row: Record<string, unknown>): WorkOrder {
  return {
    id: row.id as string,
    scheduledServiceId: (row.scheduled_service_id ?? null) as string | null,
    operationalPlanId: (row.operational_plan_id ?? null) as string | null,
    organizationId: row.organization_id as string,
    number: row.number as string,
    title: row.title as string,
    description: (row.description ?? null) as string | null,
    location: row.location as string,
    scheduledDate: new Date(row.scheduled_date as string),
    timeWindow: null,
    estimatedDurationMin: row.estimated_duration_min as number,
    status: row.status as WorkOrderStatus,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    finishedAt: row.finished_at ? new Date(row.finished_at as string) : null,
    actualDurationMin: (row.actual_duration_min ?? null) as number | null,
    slaMet: (row.sla_met ?? null) as boolean | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseWorkOrderRepository implements WorkOrderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getNextNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data, error } = await this.client.rpc('nextval', { seq_name: 'work_order_number_seq' })
    if (error) {
      const { count } = await this.client.from('work_orders').select('*', { count: 'exact', head: true })
      return generateWorkOrderNumber(year, (count ?? 0) + 1)
    }
    return generateWorkOrderNumber(year, Number(data))
  }

  async create(input: {
    scheduledServiceId: string | null; operationalPlanId: string | null;
    organizationId: string; number: string; title: string; description: string | null;
    location: string; scheduledDate: Date; estimatedDurationMin: number
  }): Promise<WorkOrder> {
    const { data, error } = await this.client.from('work_orders').insert({
      scheduled_service_id: input.scheduledServiceId,
      operational_plan_id: input.operationalPlanId,
      organization_id: input.organizationId,
      number: input.number,
      title: input.title,
      description: input.description,
      location: input.location,
      scheduled_date: input.scheduledDate.toISOString().split('T')[0],
      estimated_duration_min: input.estimatedDurationMin,
    }).select().single()
    if (error) throw error
    return mapRowToOrder(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await this.client.from('work_orders').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToOrder(data as unknown as Record<string, unknown>)
  }

  async list(filters: {
    organizationId?: string; status?: WorkOrderStatus; employeeId?: string;
    fromDate?: Date; toDate?: Date; page: number; pageSize: number
  }): Promise<{ data: WorkOrder[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    let query = this.client.from('work_orders').select('*', { count: 'exact' })
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.fromDate) query = query.gte('scheduled_date', filters.fromDate.toISOString().split('T')[0])
    if (filters.toDate) query = query.lte('scheduled_date', filters.toDate.toISOString().split('T')[0])
    if (filters.employeeId) {
      query = query.in('id', (
        await this.client.from('assignments').select('work_order_id').eq('employee_id', filters.employeeId)
      ).data?.map((r) => r.work_order_id) ?? [])
    }
    query = query.range(from, to).order('scheduled_date', { ascending: false })
    const { data, count, error } = await query
    if (error) throw error
    return { data: (data ?? []).map((r) => mapRowToOrder(r as unknown as Record<string, unknown>)), total: count ?? 0 }
  }

  async updateStatus(id: string, status: WorkOrderStatus): Promise<WorkOrder> {
    const { data, error } = await this.client.from('work_orders').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return mapRowToOrder(data as unknown as Record<string, unknown>)
  }

  async updateTiming(id: string, updates: {
    startedAt?: Date | null; finishedAt?: Date | null; actualDurationMin?: number | null; slaMet?: boolean | null
  }): Promise<WorkOrder> {
    const updateData: Record<string, unknown> = {}
    if (updates.startedAt !== undefined) updateData.started_at = updates.startedAt?.toISOString() ?? null
    if (updates.finishedAt !== undefined) updateData.finished_at = updates.finishedAt?.toISOString() ?? null
    if (updates.actualDurationMin !== undefined) updateData.actual_duration_min = updates.actualDurationMin
    if (updates.slaMet !== undefined) updateData.sla_met = updates.slaMet
    const { data, error } = await this.client.from('work_orders').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return mapRowToOrder(data as unknown as Record<string, unknown>)
  }
}
