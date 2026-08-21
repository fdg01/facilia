// src/app/api/portal/contracts/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseContractReader } from '@modules/portal/infrastructure'
import { createListContractsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listContracts = createListContractsUseCase(new SupabaseContractReader(supabase))
    const contracts = await listContracts(session.organizationId)
    return NextResponse.json({ data: contracts })
  } catch (error) {
    return handleApiError(error)
  }
}
