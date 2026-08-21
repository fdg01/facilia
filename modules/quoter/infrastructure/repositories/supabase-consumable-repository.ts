// modules/quoter/infrastructure/repositories/supabase-consumable-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ConsumableRepository } from '../../domain/repositories'
import type { Consumable, ConsumableLevel } from '../../domain/entities'
import { mapDbConsumableToDomain } from '../supabase/mappers'

export class SupabaseConsumableRepository implements ConsumableRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Consumable[]> {
    const { data, error } = await this.client
      .from('consumables')
      .select('*')
      .order('code')

    if (error) throw error
    return (data ?? []).map(mapDbConsumableToDomain)
  }

  async save(consumable: { id?: string; code: string; label: string; description?: string | null; quantityMode?: Consumable['quantityMode']; fixedQuantity?: number | null; ruleId?: string | null; unitPrice: number; category?: string | null; levels?: ConsumableLevel[] | null }): Promise<Consumable> {
    const { data, error } = await this.client
      .from('consumables')
      .insert({
        id: consumable.id,
        code: consumable.code,
        label: consumable.label,
        description: consumable.description ?? null,
        quantity_mode: consumable.quantityMode,
        fixed_quantity: consumable.fixedQuantity ?? null,
        rule_id: consumable.ruleId ?? null,
        unit_price: consumable.unitPrice,
        category: consumable.category ?? null,
        levels: consumable.levels ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbConsumableToDomain(data)
  }

  async update(id: string, input: Partial<Consumable>): Promise<Consumable> {
    const updates: Record<string, unknown> = {}
    if (input.code !== undefined) updates.code = input.code
    if (input.label !== undefined) updates.label = input.label
    if (input.description !== undefined) updates.description = input.description
    if (input.quantityMode !== undefined) updates.quantity_mode = input.quantityMode
    if (input.fixedQuantity !== undefined) updates.fixed_quantity = input.fixedQuantity
    if (input.unitPrice !== undefined) updates.unit_price = input.unitPrice
    if (input.category !== undefined) updates.category = input.category
    if (input.levels !== undefined) updates.levels = input.levels
    if (input.active !== undefined) updates.active = input.active

    const { data, error } = await this.client
      .from('consumables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbConsumableToDomain(data)
  }
}
