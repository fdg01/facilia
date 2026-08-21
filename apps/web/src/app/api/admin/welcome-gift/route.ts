// src/app/api/admin/welcome-gift/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseWelcomeGiftRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createUpdateWelcomeGiftUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const GiftSchema = z.object({
  description: z.string().min(1),
  active: z.boolean(),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseWelcomeGiftRepository(serviceClient)
    const gift = await repo.getActive()
    return NextResponse.json({ data: gift }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole('admin')
    const body = await request.json()
    const parsed = GiftSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseWelcomeGiftRepository(serviceClient)
    const updateGift = createUpdateWelcomeGiftUseCase(repo)
    const gift = await updateGift(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: gift }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Update welcome gift error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
