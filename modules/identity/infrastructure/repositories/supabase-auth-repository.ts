// modules/identity/infrastructure/repositories/supabase-auth-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthRepository } from '../../domain/repositories'
import { createServerAnonSupabaseClient } from '../supabase/client'

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly serviceClient: SupabaseClient,
  ) {}

  async createAuthUser(email: string, password: string, metadata: Record<string, unknown>): Promise<string> {
    const { data, error } = await this.serviceClient.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true,
    })

    if (error) throw error
    if (!data.user) throw new Error('Failed to create auth user')
    return data.user.id
  }

  async changePassword(authId: string, newPassword: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.updateUserById(authId, {
      password: newPassword,
    })

    if (error) throw error
  }

  async verifyCredentials(email: string, password: string): Promise<string | null> {
    // Use a separate anon client so signInWithPassword does not contaminate
    // the service-role client's auth state (which would make subsequent
    // queries from the service client use the user's JWT instead of the
    // service role key, bypassing RLS bypass).
    const anonClient = createServerAnonSupabaseClient()
    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) return null
    return data.user.id
  }

  async invalidateSessions(authId: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.signOut(authId, 'global')
    if (error) throw error
  }

  async adminSetPassword(authId: string, newPassword: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.updateUserById(authId, {
      password: newPassword,
    })

    if (error) throw error
  }
}
