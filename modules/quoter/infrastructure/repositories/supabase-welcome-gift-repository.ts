// modules/quoter/infrastructure/repositories/supabase-welcome-gift-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { WelcomeGiftRepository, UpdateWelcomeGiftInput } from '../../domain/repositories'
import type { WelcomeGift } from '../../domain/entities'
import { mapDbWelcomeGiftToDomain } from '../supabase/mappers'

export class SupabaseWelcomeGiftRepository implements WelcomeGiftRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActive(): Promise<WelcomeGift | null> {
    const { data, error } = await this.client
      .from('welcome_gift')
      .select('*')
      .eq('active', true)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbWelcomeGiftToDomain(data)
  }

  async update(input: UpdateWelcomeGiftInput): Promise<WelcomeGift> {
    if (input.active) {
      // Deactivate previous active gift
      await this.client
        .from('welcome_gift')
        .update({ active: false })
        .eq('active', true)
    }

    const { data, error } = await this.client
      .from('welcome_gift')
      .insert({
        description: input.description,
        active: input.active,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbWelcomeGiftToDomain(data)
  }
}
