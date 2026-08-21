// src/app/api/admin/dag/nodes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDagRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createCreateNodeUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const NodeSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['root', 'category', 'option', 'input', 'consumable', 'extra', 'closing']),
  line: z.enum(['clean', 'care', 'continuity']).optional(),
  priceType: z.enum(['fixed', 'per_m2', 'per_unit', 'calculated', 'no_price']).optional(),
  basePrice: z.number().optional(),
  variableId: z.string().uuid().optional(),
  consumableId: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  sortOrder: z.number().optional(),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const dag = await dagRepo.getActiveDag()
    return NextResponse.json({ data: dag.nodes }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin')
    const body = await request.json()
    const parsed = NodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const createNode = createCreateNodeUseCase(dagRepo)
    const node = await createNode(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: node }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Create node error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
