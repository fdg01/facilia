// src/app/api/variables/route.ts
import { NextResponse } from 'next/server'
import { SupabaseVariableRepository } from '@modules/quoter/infrastructure'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseVariableRepository(supabase)
    const variables = await repo.list()
    return NextResponse.json({ data: variables }, { status: 200 })
  } catch (error) {
    console.error('Get variables error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
