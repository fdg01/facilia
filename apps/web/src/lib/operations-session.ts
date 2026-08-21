// lib/operations-session.ts
import 'server-only'
import { createServerSupabaseClient } from './supabase-server'
import { requireAdminSession, requireEmployeeSession } from '@modules/operations/presentation/session'
import type { Session } from '@modules/identity/domain/entities'

export async function requireAdmin(): Promise<Session> {
  const supabase = await createServerSupabaseClient()
  return requireAdminSession(supabase)
}

export async function requireEmployee(): Promise<Session> {
  const supabase = await createServerSupabaseClient()
  return requireEmployeeSession(supabase)
}
