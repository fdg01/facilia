// modules/quoter/infrastructure/repositories/supabase-lead-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadRepository, LeadFilters, Paginated, CreateLeadInput } from '../../domain/repositories'
import type { Lead, LeadWithDetail, LeadStatus, DagSelection, LeadSnapshot } from '../../domain/entities'
import { mapDbLeadToDomain, mapDbSelectionToDomain, mapDbSnapshotToDomain } from '../supabase/mappers'
import { generateLeadNumber } from '../../domain/services'

export class SupabaseLeadRepository implements LeadRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getNextNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data, error } = await this.client.rpc('nextval', { seq_name: 'lead_number_seq' })
    if (error) {
      // Fallback: query count
      const { count } = await this.client
        .from('leads')
        .select('*', { count: 'exact', head: true })
      return generateLeadNumber(year, (count ?? 0) + 1)
    }
    return generateLeadNumber(year, Number(data))
  }

  async save(lead: CreateLeadInput, snapshot: LeadSnapshot): Promise<Lead> {
    const number = await this.getNextNumber()

    const { data, error } = await this.client
      .from('leads')
      .insert({
        number,
        status: 'sent',
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        user_id: lead.userId ?? null,
        organization_id: lead.organizationId ?? null,
        total_monthly: lead.totalMonthly,
        total_per_visit: lead.totalPerVisit,
        parameters_snapshot: lead.parametersSnapshot,
        dag_version: lead.dagVersion,
        gift_included: lead.giftIncluded,
        gift_description: lead.giftDescription,
        main_line: lead.mainLine,
      })
      .select()
      .single()

    if (error) throw error
    const savedLead = mapDbLeadToDomain(data)

    // Save selections
    if (lead.selections.length > 0) {
      const selectionRows = lead.selections.map((s, i) => ({
        lead_id: savedLead.id,
        node_id: s.nodeId,
        option_id: s.optionId,
        value: s.value,
        sort_order: i,
      }))
      const { error: selError } = await this.client
        .from('lead_selections')
        .insert(selectionRows)
      if (selError) throw selError
    }

    // Save snapshot
    const { error: snapError } = await this.client
      .from('lead_snapshots')
      .insert({
        lead_id: savedLead.id,
        detail: snapshot.detail,
        parameters: snapshot.parameters,
        dag: snapshot.dag,
      })
    if (snapError) throw snapError

    return savedLead
  }

  async findById(id: string): Promise<LeadWithDetail | null> {
    const { data: leadData, error } = await this.client
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!leadData) return null

    const [selRes, snapRes] = await Promise.all([
      this.client.from('lead_selections').select('*').eq('lead_id', id).order('sort_order'),
      this.client.from('lead_snapshots').select('*').eq('lead_id', id).maybeSingle(),
    ])

    if (selRes.error) throw selRes.error

    return {
      ...mapDbLeadToDomain(leadData),
      selections: (selRes.data ?? []).map(mapDbSelectionToDomain),
      snapshot: snapRes.data ? mapDbSnapshotToDomain(snapRes.data) : null,
    }
  }

  async list(filters: LeadFilters): Promise<Paginated<Lead>> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.client
      .from('leads')
      .select('*', { count: 'exact' })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.line) query = query.eq('main_line', filters.line)
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.fromDate) query = query.gte('created_at', filters.fromDate.toISOString())
    if (filters.toDate) query = query.lte('created_at', filters.toDate.toISOString())

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: (data ?? []).map(mapDbLeadToDomain),
      meta: { page, pageSize, total: count ?? 0 },
    }
  }

  async updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead> {
    const updates: Record<string, unknown> = { status }
    if (notes !== undefined) updates.notes = notes

    const { data, error } = await this.client
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbLeadToDomain(data)
  }

  async associateOrganization(id: string, organizationId: string): Promise<Lead> {
    const { data, error } = await this.client
      .from('leads')
      .update({ organization_id: organizationId })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbLeadToDomain(data)
  }
}
