// modules/operations/infrastructure/repositories/supabase-plan-and-service-repositories.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  OperationalPlanRepository, ScheduledServiceRepository,
} from '../../domain/repositories'
import type { OperationalPlan, ScheduledService, PlanActivity } from '../../domain/entities'

function mapRowToPlan(row: Record<string, unknown>): OperationalPlan {
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    organizationId: row.organization_id as string,
    version: row.version as number,
    status: row.status as OperationalPlan['status'],
    activities: (row.activities as PlanActivity[]) ?? [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseOperationalPlanRepository implements OperationalPlanRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    contractId: string; organizationId: string; activities: PlanActivity[]
  }): Promise<OperationalPlan> {
    const { data, error } = await this.client.from('operational_plans').insert({
      contract_id: input.contractId,
      organization_id: input.organizationId,
      activities: input.activities,
    }).select().single()
    if (error) throw error
    return mapRowToPlan(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<OperationalPlan | null> {
    const { data, error } = await this.client.from('operational_plans').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToPlan(data as unknown as Record<string, unknown>)
  }

  async updateActivities(id: string, activities: PlanActivity[]): Promise<OperationalPlan> {
    const { data, error } = await this.client.from('operational_plans').update({ activities }).eq('id', id).select().single()
    if (error) throw error
    return mapRowToPlan(data as unknown as Record<string, unknown>)
  }

  async updateStatus(id: string, status: string): Promise<OperationalPlan> {
    const { data, error } = await this.client.from('operational_plans').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return mapRowToPlan(data as unknown as Record<string, unknown>)
  }

  async listByContract(contractId: string): Promise<OperationalPlan[]> {
    const { data, error } = await this.client.from('operational_plans').select('*').eq('contract_id', contractId).order('version', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToPlan(r as unknown as Record<string, unknown>))
  }
}

function mapRowToService(row: Record<string, unknown>): ScheduledService {
  return {
    id: row.id as string,
    operationalPlanId: row.operational_plan_id as string,
    organizationId: row.organization_id as string,
    activity: row.activity as string,
    location: (row.location ?? null) as string | null,
    frequency: row.frequency as ScheduledService['frequency'],
    cronRule: (row.cron_rule ?? null) as string | null,
    scheduledDate: new Date(row.scheduled_date as string),
    timeWindow: null,
    estimatedDurationMin: row.estimated_duration_min as number,
    status: row.status as ScheduledService['status'],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseScheduledServiceRepository implements ScheduledServiceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async createMany(services: Array<{
    operationalPlanId: string; organizationId: string; activity: string;
    location: string | null; frequency: string; cronRule: string | null;
    scheduledDate: Date; estimatedDurationMin: number
  }>): Promise<number> {
    if (services.length === 0) return 0
    const rows = services.map((s) => ({
      operational_plan_id: s.operationalPlanId,
      organization_id: s.organizationId,
      activity: s.activity,
      location: s.location,
      frequency: s.frequency,
      cron_rule: s.cronRule,
      scheduled_date: s.scheduledDate.toISOString().split('T')[0],
      estimated_duration_min: s.estimatedDurationMin,
    }))
    const { data, error } = await this.client.from('scheduled_services').insert(rows).select('id')
    if (error) throw error
    return data?.length ?? 0
  }

  async findByPlanAndDateRange(planId: string, fromDate: Date, toDate: Date): Promise<ScheduledService[]> {
    const { data, error } = await this.client
      .from('scheduled_services')
      .select('*')
      .eq('operational_plan_id', planId)
      .gte('scheduled_date', fromDate.toISOString().split('T')[0])
      .lte('scheduled_date', toDate.toISOString().split('T')[0])
      .order('scheduled_date')
    if (error) throw error
    return (data ?? []).map((r) => mapRowToService(r as unknown as Record<string, unknown>))
  }

  async findById(id: string): Promise<ScheduledService | null> {
    const { data, error } = await this.client.from('scheduled_services').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToService(data as unknown as Record<string, unknown>)
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client.from('scheduled_services').update({ status }).eq('id', id)
    if (error) throw error
  }
}
