// src/app/api/admin/dag/nodes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDagRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createEditNodeUseCase, createDeleteNodeUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const EditNodeSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['root', 'category', 'option', 'input', 'consumable', 'extra', 'closing']).optional(),
  line: z.enum(['clean', 'care', 'continuity']).nullable().optional(),
  priceType: z.enum(['fixed', 'per_m2', 'per_unit', 'calculated', 'no_price']).optional(),
  basePrice: z.number().nullable().optional(),
  variableId: z.string().uuid().nullable().optional(),
  consumableId: z.string().uuid().nullable().optional(),
  ruleId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().optional(),
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
    const parsed = EditNodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const editNode = createEditNodeUseCase(dagRepo)
    const node = await editNode(sessionToUser(session), id, parsed.data)

    return NextResponse.json({ data: node }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Edit node error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const deleteNode = createDeleteNodeUseCase(dagRepo)
    await deleteNode(sessionToUser(session), id)

    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Delete node error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
