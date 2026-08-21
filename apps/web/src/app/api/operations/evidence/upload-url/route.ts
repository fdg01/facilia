// src/app/api/operations/evidence/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseEvidenceRepository, SupabaseExecutionRepository,
  SupabaseAssignmentRepository, SupabaseStorageRepository,
} from '@modules/operations/infrastructure'
import { createUploadEvidenceUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const UploadUrlSchema = z.object({
  workOrderId: z.string().uuid(),
  executionId: z.string().uuid(),
  type: z.enum(['photo', 'video', 'customer_signature', 'document']),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmployee()
    const body = await request.json()
    const parsed = UploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const getUploadUrl = createUploadEvidenceUseCase(
      new SupabaseEvidenceRepository(serviceClient),
      new SupabaseExecutionRepository(serviceClient),
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseStorageRepository(serviceClient),
    )

    const result = await getUploadUrl({
      workOrderId: parsed.data.workOrderId,
      executionId: parsed.data.executionId,
      organizationId: session.organizationId ?? '',
      employeeId: session.userId,
      type: parsed.data.type,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
