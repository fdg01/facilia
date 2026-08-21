// src/app/api/portal/communications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCommunicationRepository } from '@modules/portal/infrastructure'
import { createReadCommunicationUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const readCommunication = createReadCommunicationUseCase(new SupabaseCommunicationRepository(supabase))
    const communication = await readCommunication(id, session.organizationId)
    if (!communication) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Comunicación no encontrada' } }, { status: 404 })
    }
    return NextResponse.json({ data: communication })
  } catch (error) {
    return handleApiError(error)
  }
}
