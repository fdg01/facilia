// src/app/api/operations/evidence/[id]/signature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseEvidenceRepository, SupabaseExecutionRepository,
  SupabaseAssignmentRepository, SupabaseStorageRepository,
} from '@modules/operations/infrastructure'
import { createRegisterCustomerSignatureUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const SignatureSchema = z.object({
  workOrderId: z.string().uuid(),
  signatureBase64: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    await params
    const body = await request.json()
    const parsed = SignatureSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const registerSignature = createRegisterCustomerSignatureUseCase(
      new SupabaseEvidenceRepository(serviceClient),
      new SupabaseExecutionRepository(serviceClient),
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseStorageRepository(serviceClient),
    )

    const evidence = await registerSignature({
      workOrderId: parsed.data.workOrderId,
      organizationId: session.organizationId ?? '',
      employeeId: session.userId,
      signatureBase64: parsed.data.signatureBase64,
    })

    return NextResponse.json({ data: evidence }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
