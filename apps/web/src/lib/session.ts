// lib/session.ts
import 'server-only'
import { createServerSupabaseClient } from './supabase-server'
import {
  getSessionFromClient,
  requireSessionFromClient,
  requireRoleFromClient,
  sessionToUser,
} from '@modules/identity/presentation/session'
import type { Session } from '@modules/identity/domain/entities'

export async function getSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient()
  return getSessionFromClient(supabase)
}

export async function requireSession(): Promise<Session> {
  const supabase = await createServerSupabaseClient()
  return requireSessionFromClient(supabase)
}

export async function requireRole(...roles: Session['role'][]): Promise<Session> {
  const supabase = await createServerSupabaseClient()
  return requireRoleFromClient(supabase, ...roles)
}

export { sessionToUser }
