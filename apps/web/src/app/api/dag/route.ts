// src/app/api/dag/route.ts
import { NextResponse } from 'next/server'
import { SupabaseDagRepository } from '@modules/quoter/infrastructure'
import { createGetActiveDagUseCase } from '@modules/quoter/application/use-cases'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const dagRepo = new SupabaseDagRepository(supabase)
    const getActiveDag = createGetActiveDagUseCase(dagRepo)
    const dag = await getActiveDag()
    return NextResponse.json({ data: dag }, { status: 200 })
  } catch (error) {
    console.error('Get DAG error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
