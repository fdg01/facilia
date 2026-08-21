// modules/identity/presentation/session.ts
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Session, User } from '../domain/entities'
import { Errors } from '../application/errors'
import { createGetSessionUseCase } from '../application/use-cases/get-session'

const getSessionUseCase = createGetSessionUseCase()

/**
 * Get the current session from a Supabase client.
 * Returns null if not authenticated.
 * The caller provides the server-side supabase client (with cookies for RLS).
 */
export async function getSessionFromClient(supabase: SupabaseClient): Promise<Session | null> {
  return getSessionUseCase(supabase)
}

/**
 * Require a session or throw if not authenticated.
 */
export async function requireSessionFromClient(supabase: SupabaseClient): Promise<Session> {
  const session = await getSessionFromClient(supabase)
  if (!session) throw Errors.noSession()
  return session
}

/**
 * Require a specific role.
 */
export async function requireRoleFromClient(
  supabase: SupabaseClient,
  ...roles: Session['role'][]
): Promise<Session> {
  const session = await requireSessionFromClient(supabase)
  if (!roles.includes(session.role)) throw Errors.forbidden()
  return session
}

/**
 * Convert a Session to a User-like object for use cases that require a User requester.
 * Session has the same fields as User except createdAt/updatedAt which are not needed
 * for authorization checks.
 */
export function sessionToUser(session: Session): User {
  return {
    id: session.userId,
    authId: session.authId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    role: session.role,
    status: session.status,
    organizationId: session.organizationId,
    phone: null,
    mustChangePassword: session.mustChangePassword,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}
