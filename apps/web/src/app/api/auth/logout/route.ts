// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogoutUseCase } from '@modules/identity/application/use-cases'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const logout = createLogoutUseCase()
    await logout(supabase)
    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
