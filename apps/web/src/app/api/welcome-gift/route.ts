// src/app/api/welcome-gift/route.ts
import { NextResponse } from 'next/server'
import { SupabaseWelcomeGiftRepository } from '@modules/quoter/infrastructure'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseWelcomeGiftRepository(supabase)
    const gift = await repo.getActive()
    return NextResponse.json({ data: gift }, { status: 200 })
  } catch (error) {
    console.error('Get welcome gift error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
