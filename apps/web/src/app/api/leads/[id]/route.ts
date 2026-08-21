// src/app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseLeadRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createGetLeadUseCase } from '@modules/quoter/application/use-cases'
import { requireRole } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const leadRepo = new SupabaseLeadRepository(serviceClient)
    const getLead = createGetLeadUseCase(leadRepo)
    const lead = await getLead(id)

    if (!lead) {
      return NextResponse.json(
        { error: { code: 'LEAD_NOT_FOUND', message: 'Lead no encontrado' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: lead }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json(
        { error: { code: error.message, message: 'No autorizado' } },
        { status: 403 },
      )
    }
    console.error('Get lead error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
