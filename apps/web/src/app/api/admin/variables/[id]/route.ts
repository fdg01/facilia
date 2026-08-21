// src/app/api/admin/variables/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseVariableRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createEditVariableUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const EditSchema = z.object({
  code: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  performanceM2PerHour: z.number().nullable().optional(),
  supplyCostPerM2: z.number().nullable().optional(),
  visitsPerMonth: z.number().nullable().optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params
    const body = await request.json()
    const parsed = EditSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } }, { status: 400 })
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseVariableRepository(serviceClient)
    const editVariable = createEditVariableUseCase(repo)
    const variable = await editVariable(sessionToUser(session), id, parsed.data)

    return NextResponse.json({ data: variable }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Edit variable error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
