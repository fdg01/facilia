// src/app/api/parameters/active/route.ts
import { NextResponse } from 'next/server'
import { SupabaseParameterRepository } from '@modules/quoter/infrastructure'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseParameterRepository(supabase)
    const parameter = await repo.getActive()
    if (!parameter) {
      return NextResponse.json(
        { error: { code: 'NO_ACTIVE_PARAMETER', message: 'No hay parámetros activos' } },
        { status: 404 },
      )
    }
    return NextResponse.json({ data: parameter }, { status: 200 })
  } catch (error) {
    console.error('Get active parameter error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
