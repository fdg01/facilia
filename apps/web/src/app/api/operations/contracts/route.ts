// src/app/api/operations/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseContractRepository, SupabaseLeadSnapshotRepository } from '@modules/operations/infrastructure'
import { createCreateContractUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const CreateContractSchema = z.object({
  leadId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseContractRepository(supabase)

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const status = url.searchParams.get('status') ?? undefined
    const organizationId = url.searchParams.get('organizationId') ?? undefined

    const result = await repo.list({ organizationId, status, page, pageSize })
    return NextResponse.json({ data: result.data, meta: { page, pageSize, total: result.total } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const parsed = CreateContractSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const contractRepo = new SupabaseContractRepository(serviceClient)
    const leadSnapshotRepo = new SupabaseLeadSnapshotRepository(serviceClient)

    // Verify lead is confirmed
    const leadInfo = await leadSnapshotRepo.findLeadByIdAndOrganization(parsed.data.leadId, session.organizationId ?? '')
    if (!leadInfo || leadInfo.status !== 'confirmed') {
      return NextResponse.json(
        { error: { code: 'LEAD_NOT_CONFIRMED', message: 'El lead no está confirmado' } },
        { status: 403 },
      )
    }

    const createContract = createCreateContractUseCase(contractRepo, leadSnapshotRepo)
    const contract = await createContract({
      leadId: parsed.data.leadId,
      organizationId: leadInfo.organizationId ?? session.organizationId ?? '',
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    })

    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
