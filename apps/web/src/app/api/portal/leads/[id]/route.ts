// src/app/api/portal/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePortalLeadRepository } from '@modules/portal/infrastructure'
import { createGetLeadUseCase } from '@modules/portal/application/use-cases'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const leadRepo = new SupabasePortalLeadRepository(supabase)
    const getLead = createGetLeadUseCase(leadRepo)

    const lead = await getLead(id, session.organizationId)

    if (!lead) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cotización no encontrada' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: lead })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NO_SESSION') || error.message.includes('FORBIDDEN'))) {
      const status = error.message.includes('NO_SESSION') ? 401 : 403
      return NextResponse.json(
        { error: { code: error.message.includes('NO_SESSION') ? 'NO_SESSION' : 'FORBIDDEN', message: error.message } },
        { status },
      )
    }
    console.error('Portal get lead error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
