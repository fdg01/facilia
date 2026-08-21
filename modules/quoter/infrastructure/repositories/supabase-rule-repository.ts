// modules/quoter/infrastructure/repositories/supabase-rule-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RuleRepository } from '../../domain/repositories'
import type { Rule } from '../../domain/entities'
import { mapDbRuleToDomain } from '../supabase/mappers'

export class SupabaseRuleRepository implements RuleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Rule[]> {
    const { data, error } = await this.client
      .from('rules')
      .select('*')
      .order('code')

    if (error) throw error
    return (data ?? []).map(mapDbRuleToDomain)
  }

  async save(rule: { id?: string; code: string; label: string; description?: string | null; type: string; expression: Record<string, unknown> }): Promise<Rule> {
    const { data, error } = await this.client
      .from('rules')
      .insert({
        id: rule.id,
        code: rule.code,
        label: rule.label,
        description: rule.description ?? null,
        type: rule.type,
        expression: rule.expression,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbRuleToDomain(data)
  }

  async update(id: string, input: Partial<Rule>): Promise<Rule> {
    const updates: Record<string, unknown> = {}
    if (input.code !== undefined) updates.code = input.code
    if (input.label !== undefined) updates.label = input.label
    if (input.description !== undefined) updates.description = input.description
    if (input.type !== undefined) updates.type = input.type
    if (input.expression !== undefined) updates.expression = input.expression
    if (input.active !== undefined) updates.active = input.active

    const { data, error } = await this.client
      .from('rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbRuleToDomain(data)
  }
}
