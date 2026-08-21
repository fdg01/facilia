// src/app/api/admin/dag/edges/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseDagRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createDeleteEdgeUseCase } from '@modules/quoter/application/use-cases'
import { requireRole, sessionToUser } from '@/lib/session'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const dagRepo = new SupabaseDagRepository(serviceClient)
    const deleteEdge = createDeleteEdgeUseCase(dagRepo)
    await deleteEdge(sessionToUser(session), id)

    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: { code: error.message, message: 'No autorizado' } }, { status: 403 })
    }
    console.error('Delete edge error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } }, { status: 500 })
  }
}
