// lib/supabase-server.ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Derive the Supabase storage key (cookie name prefix) from a URL.
 * Matches the logic in @supabase/supabase-js:
 *   `sb-${hostname.split('.')[0]}-auth-token`
 */
function deriveStorageKey(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return `sb-${hostname.split('.')[0]}-auth-token`
  } catch {
    return 'sb-auth-token'
  }
}

/**
 * Server-side Supabase client (uses anon key + user cookies for RLS).
 * Use in Server Components and Server Actions.
 *
 * Uses SUPABASE_URL (internal Docker network) for API calls so the
 * server container can actually reach Supabase. The storageKey is
 * derived from NEXT_PUBLIC_SUPABASE_URL so the cookie name matches
 * what the browser client sets.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
  const storageKey = deriveStorageKey(publicUrl)

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          })
        } catch {
          // Called from a Server Component — cookies can't be set.
        }
      },
    },
    auth: {
      storageKey,
    },
  })
}
