// modules/identity/application/use-cases/get-session.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Session } from '../../domain/entities'
import { Errors } from '../errors'

export function createGetSessionUseCase() {
  return async function getSession(supabase: SupabaseClient): Promise<Session | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!profile) return null
    if (profile.status === 'inactive') throw Errors.userInactive()

    return {
      userId: profile.id,
      authId: user.id,
      email: profile.email ?? user.email ?? '',
      firstName: profile.first_name ?? '',
      lastName: profile.last_name ?? '',
      role: profile.role,
      organizationId: profile.organization_id,
      status: profile.status,
      mustChangePassword: profile.must_change_password,
    }
  }
}
