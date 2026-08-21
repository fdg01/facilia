// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Use SUPABASE_URL (internal Docker network) for API calls,
  // but derive the storageKey from NEXT_PUBLIC_SUPABASE_URL so
  // the cookie name matches what the browser client sets.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
  const storageKey = deriveStorageKey(publicUrl)

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
    auth: {
      storageKey,
    },
  })

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const protectedPrefixes = [
    '/facilia/admin',
    '/facilia/operations',
    '/facilia/field',
    '/facilia/portal',
  ]

  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix))

  // Not authenticated → redirect to login
  if (isProtected && !user) {
    const redirectUrl = new URL('/facilia/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Authenticated but must change password → redirect to /change-password
  // (skip if already on /change-password or /login or API routes)
  const authPaths = ['/facilia/login', '/facilia/change-password']
  const isOnAuthPath = authPaths.some((p) => path.startsWith(p))
  const isApiRoute = path.startsWith('/facilia/api/')

  if (isProtected && user && !isOnAuthPath && !isApiRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('must_change_password, status')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profile?.status === 'inactive') {
      // Force logout inactive users
      await supabase.auth.signOut()
      const redirectUrl = new URL('/facilia/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (profile?.must_change_password) {
      const redirectUrl = new URL('/facilia/change-password', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/facilia/admin/:path*',
    '/facilia/operations/:path*',
    '/facilia/field/:path*',
    '/facilia/portal/:path*',
  ],
}
