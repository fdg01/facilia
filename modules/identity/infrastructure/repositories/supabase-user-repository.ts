// modules/identity/infrastructure/repositories/supabase-user-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRepository, UserFilters, Paginated, CreateUserInput, UpdateUserInput } from '../../domain/repositories'
import type { User, UserStatus } from '../../domain/entities'
import { mapDbUserToDomain } from '../supabase/mappers'

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbUserToDomain(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbUserToDomain(data)
  }

  async findByAuthId(authId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapDbUserToDomain(data)
  }

  async list(filters: UserFilters): Promise<Paginated<User>> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.client
      .from('users')
      .select('*', { count: 'exact' })

    if (filters.role) query = query.eq('role', filters.role)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data ?? []).map(mapDbUserToDomain),
      meta: {
        page,
        pageSize,
        total: count ?? 0,
      },
    }
  }

  async save(user: User): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        id: user.id,
        auth_id: user.authId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        status: user.status,
        organization_id: user.organizationId,
        phone: user.phone,
        must_change_password: user.mustChangePassword,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbUserToDomain(data)
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbUserToDomain(data)
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const updates: Record<string, unknown> = {}
    if (input.firstName !== undefined) updates.first_name = input.firstName
    if (input.lastName !== undefined) updates.last_name = input.lastName
    if (input.phone !== undefined) updates.phone = input.phone
    if (input.status !== undefined) updates.status = input.status
    if (input.role !== undefined) updates.role = input.role
    if (input.organizationId !== undefined) updates.organization_id = input.organizationId

    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbUserToDomain(data)
  }

  async setMustChangePassword(id: string, value: boolean): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ must_change_password: value })
      .eq('id', id)

    if (error) throw error
  }
}
