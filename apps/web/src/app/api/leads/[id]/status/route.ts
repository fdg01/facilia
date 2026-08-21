// src/app/api/leads/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseLeadRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createChangeLeadStatusUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const StatusSchema = z.object({
  status: z.enum(['accepted', 'lost', 'confirmed', 'sent']),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const body = await request.json()
    const parsed = StatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Estado inválido' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const leadRepo = new SupabaseLeadRepository(serviceClient)
    const changeStatus = createChangeLeadStatusUseCase(leadRepo)
    const lead = await changeStatus({
      requester: sessionToUser(session),
      leadId: id,
      newStatus: parsed.data.status,
      notes: parsed.data.notes,
    })

    return NextResponse.json({ data: lead }, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: { code: error.message, message: 'No autorizado' } },
          { status: 403 },
        )
      }
      if (error.message === 'LEAD_NOT_FOUND') {
        return NextResponse.json(
          { error: { code: 'LEAD_NOT_FOUND', message: 'Lead no encontrado' } },
          { status: 404 },
        )
      }
      if (error.message === 'INVALID_TRANSITION') {
        return NextResponse.json(
          { error: { code: 'INVALID_TRANSITION', message: 'Transición de estado no permitida' } },
          { status: 400 },
        )
      }
    }
    console.error('Change lead status error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
