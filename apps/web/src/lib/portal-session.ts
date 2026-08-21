// lib/portal-session.ts
import 'server-only'
import { createServerSupabaseClient } from './supabase-server'
import { requireClientSession } from '@modules/portal/presentation/session'
import type { Session } from '@modules/identity/domain/entities'

/**
 * A client session that is guaranteed to have an organizationId.
 * Clients without an organization are rejected.
 */
export type ClientSession = Omit<Session, 'organizationId'> & {
  organizationId: string
}

/**
 * Require a client session with a valid organization.
 * Throws if not authenticated, not a client, or has no organization.
 */
export async function requireClient(): Promise<ClientSession> {
  const supabase = await createServerSupabaseClient()
  const session = await requireClientSession(supabase)
  if (!session.organizationId) {
    throw new Error('NO_ORGANIZATION')
  }
  return session as ClientSession
}
