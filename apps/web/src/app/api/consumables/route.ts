// src/app/api/consumables/route.ts
import { NextResponse } from 'next/server'
import { SupabaseConsumableRepository } from '@modules/quoter/infrastructure'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseConsumableRepository(supabase)
    const consumables = await repo.list()
    return NextResponse.json({ data: consumables }, { status: 200 })
  } catch (error) {
    console.error('Get consumables error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
