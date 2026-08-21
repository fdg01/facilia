// modules/portal/presentation/session.ts
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireRoleFromClient } from '../../identity/presentation/session'
import type { Session } from '../../identity/domain/entities'

/**
 * Require a client session. Throws if not authenticated or not a client.
 * The caller provides the server-side supabase client (with cookies for RLS).
 */
export async function requireClientSession(supabase: SupabaseClient): Promise<Session> {
  return requireRoleFromClient(supabase, 'client')
}
