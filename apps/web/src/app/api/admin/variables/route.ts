// src/app/api/admin/variables/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseVariableRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createCreateVariableUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const VariableSchema = z.object({
  type: z.enum(['environment', 'frequency']),
  code: z.string().min(1),
  label: z.string().min(1),
  performanceM2PerHour: z.number().optional(),
  supplyCostPerM2: z.number().optional(),
  visitsPerMonth: z.number().optional(),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseVariableRepository(serviceClient)
    const variables = await repo.list()
    return NextResponse.json({ data: variables }, { status: 200 })
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
    const parsed = VariableSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseVariableRepository(serviceClient)
    const createVariable = createCreateVariableUseCase(repo)
    const variable = await createVariable(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: variable }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Create variable error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
