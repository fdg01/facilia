// src/app/api/admin/consumables/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseConsumableRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createCreateConsumableUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const ConsumableSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  quantityMode: z.enum(['customer', 'fixed', 'calculated']).optional(),
  fixedQuantity: z.number().optional(),
  ruleId: z.string().uuid().optional(),
  unitPrice: z.number(),
  category: z.string().optional(),
  levels: z.array(z.object({ label: z.string(), price: z.number() })).optional(),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseConsumableRepository(serviceClient)
    const consumables = await repo.list()
    return NextResponse.json({ data: consumables }, { status: 200 })
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
    const parsed = ConsumableSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseConsumableRepository(serviceClient)
    const createConsumable = createCreateConsumableUseCase(repo)
    const consumable = await createConsumable(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: consumable }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Create consumable error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
