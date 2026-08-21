// src/app/api/admin/consumables/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseConsumableRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createEditConsumableUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const EditSchema = z.object({
  code: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  quantityMode: z.enum(['customer', 'fixed', 'calculated']).optional(),
  fixedQuantity: z.number().nullable().optional(),
  unitPrice: z.number().optional(),
  category: z.string().nullable().optional(),
  levels: z.array(z.object({ label: z.string(), price: z.number() })).nullable().optional(),
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
    const repo = new SupabaseConsumableRepository(serviceClient)
    const editConsumable = createEditConsumableUseCase(repo)
    const consumable = await editConsumable(sessionToUser(session), id, parsed.data)

    return NextResponse.json({ data: consumable }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Edit consumable error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
