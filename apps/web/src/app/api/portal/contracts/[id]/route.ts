// src/app/api/portal/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseContractReader } from '@modules/portal/infrastructure'
import { createGetContractUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const getContract = createGetContractUseCase(new SupabaseContractReader(supabase))
    const contract = await getContract(id, session.organizationId)
    if (!contract) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Contrato no encontrado' } }, { status: 404 })
    }
    return NextResponse.json({ data: contract })
  } catch (error) {
    return handleApiError(error)
  }
}
