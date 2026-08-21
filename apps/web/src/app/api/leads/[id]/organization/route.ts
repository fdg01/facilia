// src/app/api/leads/[id]/organization/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseLeadRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createAssociateLeadOrgUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const OrgSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const body = await request.json()
    const parsed = OrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Organización inválida' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const leadRepo = new SupabaseLeadRepository(serviceClient)
    const associateOrg = createAssociateLeadOrgUseCase(leadRepo)
    const lead = await associateOrg({
      requester: sessionToUser(session),
      leadId: id,
      organizationId: parsed.data.organizationId,
    })

    return NextResponse.json({ data: lead }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json(
        { error: { code: error.message, message: 'No autorizado' } },
        { status: 403 },
      )
    }
    console.error('Associate lead org error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
