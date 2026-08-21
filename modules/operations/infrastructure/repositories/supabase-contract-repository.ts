// modules/operations/infrastructure/repositories/supabase-contract-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContractRepository, LeadSnapshotRepository } from '../../domain/repositories'
import type { Contract } from '../../domain/entities'
import { generateContractNumber } from '../../domain/value-objects'

function mapRowToContract(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    organizationId: row.organization_id as string,
    number: row.number as string,
    signedDate: new Date(row.signed_date as string),
    startDate: new Date(row.start_date as string),
    endDate: row.end_date ? new Date(row.end_date as string) : null,
    status: row.status as Contract['status'],
    leadSnapshot: row.lead_snapshot as Record<string, unknown>,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class SupabaseContractRepository implements ContractRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getNextNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const seq = await this.getNextNumberSeq()
    return generateContractNumber(year, seq)
  }

  async getNextNumberSeq(): Promise<number> {
    const { data, error } = await this.client.rpc('nextval', { seq_name: 'contract_number_seq' })
    if (error) {
      const { count } = await this.client.from('contracts').select('*', { count: 'exact', head: true })
      return (count ?? 0) + 1
    }
    return Number(data)
  }

  async create(input: {
    leadId: string; organizationId: string; number: string; signedDate: Date;
    startDate: Date; endDate: Date | null; leadSnapshot: Record<string, unknown>
  }): Promise<Contract> {
    const { data, error } = await this.client.from('contracts').insert({
      lead_id: input.leadId,
      organization_id: input.organizationId,
      number: input.number,
      signed_date: input.signedDate.toISOString().split('T')[0],
      start_date: input.startDate.toISOString().split('T')[0],
      end_date: input.endDate ? input.endDate.toISOString().split('T')[0] : null,
      lead_snapshot: input.leadSnapshot,
    }).select().single()
    if (error) throw error
    return mapRowToContract(data as unknown as Record<string, unknown>)
  }

  async findById(id: string): Promise<Contract | null> {
    const { data, error } = await this.client.from('contracts').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToContract(data as unknown as Record<string, unknown>)
  }

  async list(filters: { organizationId?: string; status?: string; page: number; pageSize: number }): Promise<{ data: Contract[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    let query = this.client.from('contracts').select('*', { count: 'exact' })
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.status) query = query.eq('status', filters.status)
    query = query.range(from, to).order('created_at', { ascending: false })
    const { data, count, error } = await query
    if (error) throw error
    return { data: (data ?? []).map((r) => mapRowToContract(r as unknown as Record<string, unknown>)), total: count ?? 0 }
  }

  async updateStatus(id: string, status: string): Promise<Contract> {
    const { data, error } = await this.client.from('contracts').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return mapRowToContract(data as unknown as Record<string, unknown>)
  }
}

export class SupabaseLeadSnapshotRepository implements LeadSnapshotRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByLeadId(leadId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.client
      .from('lead_snapshots')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return data as Record<string, unknown>
  }

  async findLeadByIdAndOrganization(leadId: string, organizationId: string) {
    const { data, error } = await this.client
      .from('leads')
      .select('id, status, organization_id')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const { data: snapData } = await this.client
      .from('lead_snapshots')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle()

    return {
      id: data.id as string,
      status: data.status as string,
      organizationId: data.organization_id as string | null,
      snapshot: snapData as Record<string, unknown> | null,
    }
  }
}
