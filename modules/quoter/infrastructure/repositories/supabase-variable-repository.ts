// modules/quoter/infrastructure/repositories/supabase-variable-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VariableRepository } from '../../domain/repositories'
import type { Variable } from '../../domain/entities'
import { mapDbVariableToDomain } from '../supabase/mappers'

export class SupabaseVariableRepository implements VariableRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Variable[]> {
    const { data, error } = await this.client
      .from('variables')
      .select('*')
      .order('code')

    if (error) throw error
    return (data ?? []).map(mapDbVariableToDomain)
  }

  async save(variable: { id?: string; type: Variable['type']; code: string; label: string; performanceM2PerHour?: number | null; supplyCostPerM2?: number | null; visitsPerMonth?: number | null }): Promise<Variable> {
    const { data, error } = await this.client
      .from('variables')
      .insert({
        id: variable.id,
        type: variable.type,
        code: variable.code,
        label: variable.label,
        performance_m2_per_hour: variable.performanceM2PerHour ?? null,
        supply_cost_per_m2: variable.supplyCostPerM2 ?? null,
        visits_per_month: variable.visitsPerMonth ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbVariableToDomain(data)
  }

  async update(id: string, input: Partial<Variable>): Promise<Variable> {
    const updates: Record<string, unknown> = {}
    if (input.code !== undefined) updates.code = input.code
    if (input.label !== undefined) updates.label = input.label
    if (input.performanceM2PerHour !== undefined) updates.performance_m2_per_hour = input.performanceM2PerHour
    if (input.supplyCostPerM2 !== undefined) updates.supply_cost_per_m2 = input.supplyCostPerM2
    if (input.visitsPerMonth !== undefined) updates.visits_per_month = input.visitsPerMonth
    if (input.active !== undefined) updates.active = input.active

    const { data, error } = await this.client
      .from('variables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbVariableToDomain(data)
  }
}
