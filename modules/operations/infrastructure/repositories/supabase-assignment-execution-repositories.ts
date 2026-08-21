// modules/operations/infrastructure/repositories/supabase-assignment-execution-repositories.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AssignmentRepository, ExecutionRepository } from '../../domain/repositories'
import type { Assignment, Execution } from '../../domain/entities'

function mapRowToAssignment(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string,
    workOrderId: row.work_order_id as string,
    employeeId: row.employee_id as string,
    organizationId: row.organization_id as string,
    crewRole: (row.crew_role ?? 'worker') as string,
    status: row.status as Assignment['status'],
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
    rejectedAt: row.rejected_at ? new Date(row.rejected_at as string) : null,
    rejectionReason: (row.rejection_reason ?? null) as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseAssignmentRepository implements AssignmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    workOrderId: string; employeeId: string; organizationId: string; crewRole: string
  }): Promise<Assignment> {
    const { data, error } = await this.client.from('assignments').insert({
      work_order_id: input.workOrderId,
      employee_id: input.employeeId,
      organization_id: input.organizationId,
      crew_role: input.crewRole,
    }).select().single()
    if (error) throw error
    return mapRowToAssignment(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<Assignment | null> {
    const { data, error } = await this.client.from('assignments').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToAssignment(data as unknown as Record<string, unknown>)
  }

  async findByWorkOrder(workOrderId: string): Promise<Assignment[]> {
    const { data, error } = await this.client.from('assignments').select('*').eq('work_order_id', workOrderId).order('created_at')
    if (error) throw error
    return (data ?? []).map((r) => mapRowToAssignment(r as unknown as Record<string, unknown>))
  }

  async findByEmployee(employeeId: string): Promise<Assignment[]> {
    const { data, error } = await this.client.from('assignments').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToAssignment(r as unknown as Record<string, unknown>))
  }

  async updateStatus(id: string, status: string, updates?: {
    acceptedAt?: Date; rejectedAt?: Date; rejectionReason?: string
  }): Promise<Assignment> {
    const updateData: Record<string, unknown> = { status }
    if (updates?.acceptedAt) updateData.accepted_at = updates.acceptedAt.toISOString()
    if (updates?.rejectedAt) updateData.rejected_at = updates.rejectedAt.toISOString()
    if (updates?.rejectionReason !== undefined) updateData.rejection_reason = updates.rejectionReason
    const { data, error } = await this.client.from('assignments').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return mapRowToAssignment(data as unknown as Record<string, unknown>)
  }
}

function mapRowToExecution(row: Record<string, unknown>): Execution {
  return {
    id: row.id as string,
    workOrderId: row.work_order_id as string,
    organizationId: row.organization_id as string,
    employeeId: row.employee_id as string,
    observations: (row.observations ?? null) as string | null,
    progress: (row.progress ?? 0) as number,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseExecutionRepository implements ExecutionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: {
    workOrderId: string; organizationId: string; employeeId: string
  }): Promise<Execution> {
    const { data, error } = await this.client.from('executions').insert({
      work_order_id: input.workOrderId,
      organization_id: input.organizationId,
      employee_id: input.employeeId,
      started_at: new Date().toISOString(),
    }).select().single()
    if (error) throw error
    return mapRowToExecution(data as unknown as Record<string, unknown>)
  }

  async findByWorkOrder(workOrderId: string): Promise<Execution | null> {
    const { data, error } = await this.client.from('executions').select('*').eq('work_order_id', workOrderId).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToExecution(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<Execution | null> {
    const { data, error } = await this.client.from('executions').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToExecution(data as unknown as Record<string, unknown>)
  }

  async update(id: string, updates: {
    observations?: string | null; progress?: number; completedAt?: Date | null
  }): Promise<Execution> {
    const updateData: Record<string, unknown> = {}
    if (updates.observations !== undefined) updateData.observations = updates.observations
    if (updates.progress !== undefined) updateData.progress = updates.progress
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt?.toISOString() ?? null
    const { data, error } = await this.client.from('executions').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return mapRowToExecution(data as unknown as Record<string, unknown>)
  }
}
