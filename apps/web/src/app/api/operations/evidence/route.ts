// src/app/api/operations/evidence/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseEvidenceRepository } from '@modules/operations/infrastructure'
import { createConfirmEvidenceUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const ConfirmSchema = z.object({
  evidenceId: z.string().uuid(),
  sizeBytes: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireEmployee()
    const body = await request.json()
    const parsed = ConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const confirmEvidence = createConfirmEvidenceUseCase(new SupabaseEvidenceRepository(supabase))
    const evidence = await confirmEvidence({
      evidenceId: parsed.data.evidenceId,
      sizeBytes: parsed.data.sizeBytes,
      metadata: parsed.data.metadata,
    })

    return NextResponse.json({ data: evidence })
  } catch (error) {
    return handleApiError(error)
  }
}
