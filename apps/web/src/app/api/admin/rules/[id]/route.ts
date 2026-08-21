// src/app/api/admin/rules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseRuleRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createEditRuleUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const EditSchema = z.object({
  code: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.string().optional(),
  expression: z.record(z.string(), z.unknown()).optional(),
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
    const repo = new SupabaseRuleRepository(serviceClient)
    const editRule = createEditRuleUseCase(repo)
    const rule = await editRule(sessionToUser(session), id, parsed.data)

    return NextResponse.json({ data: rule }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Edit rule error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
