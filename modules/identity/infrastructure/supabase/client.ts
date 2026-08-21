// modules/identity/infrastructure/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client (uses anon key).
 * Safe to use in Client Components.
 *
 * NOTE: We reference process.env.NEXT_PUBLIC_* directly (not via a helper)
 * so that Next.js can inline these values at build time.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createBrowserClient(url, anonKey)
}

/**
 * Admin/service-role Supabase client (bypasses RLS).
 * ONLY use server-side for admin operations and seed scripts.
 * NEVER expose to client.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Missing env var: SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Anonymous Supabase client for server-side use.
 * Uses the anon key — subject to RLS, like a browser client.
 * Useful for signInWithPassword so the service-role client's auth
 * state is not contaminated by the user session.
 *
 * Uses SUPABASE_URL (internal Docker network) instead of
 * NEXT_PUBLIC_SUPABASE_URL (browser-facing) so it works inside
 * the Next.js container.
 */
export function createServerAnonSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Missing env var: SUPABASE_URL')
  if (!anonKey) throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
