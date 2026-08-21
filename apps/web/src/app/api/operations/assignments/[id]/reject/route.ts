// src/app/api/operations/assignments/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseAssignmentRepository, SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createRejectAssignmentUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const RejectSchema = z.object({
  rejectionReason: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    const { id } = await params
    const body = await request.json()
    const parsed = RejectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const rejectAssignment = createRejectAssignmentUseCase(
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseWorkOrderRepository(serviceClient),
    )
    const assignment = await rejectAssignment(id, session.userId, parsed.data.rejectionReason)
    return NextResponse.json({ data: assignment })
  } catch (error) {
    return handleApiError(error)
  }
}
