// modules/quoter/infrastructure/repositories/supabase-parameter-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ParameterRepository, UpdateParameterInput } from '../../domain/repositories'
import type { Parameter, ParameterAudit } from '../../domain/entities'
import { mapDbParameterToDomain, mapDbAuditToDomain } from '../supabase/mappers'

export class SupabaseParameterRepository implements ParameterRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActive(): Promise<Parameter | null> {
    const { data, error } = await this.client
      .from('parameters')
      .select('*')
      .eq('active', true)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbParameterToDomain(data)
  }

  async update(input: UpdateParameterInput, _userId: string): Promise<Parameter> {
    // Deactivate previous active parameter
    const { error: deactivateError } = await this.client
      .from('parameters')
      .update({ active: false })
      .eq('active', true)

    if (deactivateError) throw deactivateError

    // Insert new parameter
    const { data, error } = await this.client
      .from('parameters')
      .insert({
        operator_hourly_cost: input.operatorHourlyCost,
        margin_percentage: input.marginPercentage,
        margin_mode: input.marginMode,
        active: true,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbParameterToDomain(data)
  }

  async listAudit(parameterId?: string): Promise<ParameterAudit[]> {
    let query = this.client
      .from('parameter_audit')
      .select('*')
      .order('created_at', { ascending: false })

    if (parameterId) {
      query = query.eq('parameter_id', parameterId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data ?? []).map(mapDbAuditToDomain)
  }
}
