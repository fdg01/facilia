// modules/identity/infrastructure/repositories/supabase-organization-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationRepository } from '../../domain/repositories'
import type { Organization } from '../../domain/entities'
import { mapDbOrgToDomain } from '../supabase/mappers'

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Organization | null> {
    const { data, error } = await this.client
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbOrgToDomain(data)
  }

  async list(): Promise<Organization[]> {
    const { data, error } = await this.client
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapDbOrgToDomain)
  }

  async save(org: Organization): Promise<Organization> {
    const { data, error } = await this.client
      .from('organizations')
      .insert({
        id: org.id,
        name: org.name,
        tax_id: org.taxId,
        email: org.email,
        phone: org.phone,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbOrgToDomain(data)
  }
}
