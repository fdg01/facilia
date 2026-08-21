// src/app/api/admin/dag/edges/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDagRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createCreateEdgeUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

const EdgeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  condition: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin')
    const body = await request.json()
    const parsed = EdgeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const createEdge = createCreateEdgeUseCase(dagRepo)
    const edge = await createEdge(sessionToUser(session), parsed.data)

    return NextResponse.json({ data: edge }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
      }
      if (error.message === 'DAG_INVALID') {
        return NextResponse.json(
          { error: { code: 'DAG_INVALID', message: 'La arista crea un ciclo' } },
          { status: 400 },
        )
      }
    }
    console.error('Create edge error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
