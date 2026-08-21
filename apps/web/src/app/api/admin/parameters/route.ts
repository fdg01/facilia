// src/app/api/admin/parameters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseParameterRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createUpdateParameterUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const ParameterSchema = z.object({
  operatorHourlyCost: z.number(),
  marginPercentage: z.number(),
  marginMode: z.enum(['on_cost', 'on_final_price']),
})

export async function GET() {
  try {
    await requireRole('admin')
    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseParameterRepository(serviceClient)
    const [active, audit] = await Promise.all([
      repo.getActive(),
      repo.listAudit(),
    ])
    return NextResponse.json({ data: { active, audit } }, { status: 200 })
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
    const parsed = ParameterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const repo = new SupabaseParameterRepository(serviceClient)
    const updateParameter = createUpdateParameterUseCase(repo)
    const parameter = await updateParameter(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: parameter }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Update parameter error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
