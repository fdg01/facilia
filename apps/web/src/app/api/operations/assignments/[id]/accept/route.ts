// src/app/api/operations/assignments/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseAssignmentRepository, SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createAcceptAssignmentUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    const { id } = await params
    const serviceClient = createServiceRoleSupabaseClient()
    const acceptAssignment = createAcceptAssignmentUseCase(
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseWorkOrderRepository(serviceClient),
    )
    const assignment = await acceptAssignment(id, session.userId)
    return NextResponse.json({ data: assignment })
  } catch (error) {
    return handleApiError(error)
  }
}
