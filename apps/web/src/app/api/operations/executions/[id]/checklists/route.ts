// src/app/api/operations/executions/[id]/checklists/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseChecklistRepository, SupabaseAssignmentRepository } from '@modules/operations/infrastructure'
import { createSaveChecklistUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const ChecklistSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    checked: z.boolean(),
  })),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    const { id } = await params
    const body = await request.json()
    const parsed = ChecklistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const saveChecklist = createSaveChecklistUseCase(
      new SupabaseChecklistRepository(supabase),
      new SupabaseAssignmentRepository(supabase),
    )

    const items = await saveChecklist({
      executionId: id,
      employeeId: session.userId,
      items: parsed.data.items,
    })

    return NextResponse.json({ data: items })
  } catch (error) {
    return handleApiError(error)
  }
}
