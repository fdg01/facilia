// src/app/api/operations/orders/[id]/assign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseAssignmentRepository, SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createAssignPersonnelUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const AssignSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1),
  crewRoles: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = AssignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const assignUseCase = createAssignPersonnelUseCase(
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseWorkOrderRepository(serviceClient),
    )

    const assignments = await assignUseCase({
      workOrderId: id,
      organizationId: session.organizationId ?? '',
      employeeIds: parsed.data.employeeIds,
      crewRoles: parsed.data.crewRoles,
    })

    return NextResponse.json({ data: assignments })
  } catch (error) {
    return handleApiError(error)
  }
}
