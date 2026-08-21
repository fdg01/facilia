// src/app/api/operations/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseContractRepository } from '@modules/operations/infrastructure'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseContractRepository(supabase)
    const contract = await repo.findById(id)
    if (!contract) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Contrato no encontrado' } }, { status: 404 })
    }
    return NextResponse.json({ data: contract })
  } catch (error) {
    return handleApiError(error)
  }
}
