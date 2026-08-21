// modules/operations/presentation/session.ts
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireRoleFromClient } from '../../identity/presentation/session'
import type { Session } from '../../identity/domain/entities'

export async function requireAdminSession(supabase: SupabaseClient): Promise<Session> {
  return requireRoleFromClient(supabase, 'admin')
}

export async function requireEmployeeSession(supabase: SupabaseClient): Promise<Session> {
  return requireRoleFromClient(supabase, 'employee')
}
