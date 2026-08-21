// src/app/api/operations/indicators/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseIndicatorsRepository } from '@modules/operations/infrastructure'
import { createCalculateIndicatorsUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId') ?? undefined
    const employeeId = url.searchParams.get('employeeId') ?? undefined
    const fromDate = url.searchParams.get('fromDate') ?? undefined
    const toDate = url.searchParams.get('toDate') ?? undefined

    const calculateIndicators = createCalculateIndicatorsUseCase(new SupabaseIndicatorsRepository(supabase))
    const indicators = await calculateIndicators({
      organizationId,
      employeeId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    })

    return NextResponse.json({ data: indicators })
  } catch (error) {
    return handleApiError(error)
  }
}
