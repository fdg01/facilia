// src/app/api/portal/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  SupabaseRequestRepository, SupabaseRequestEventRepository,
} from '@modules/portal/infrastructure'
import { createGetRequestUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const getRequest = createGetRequestUseCase(
      new SupabaseRequestRepository(supabase),
      new SupabaseRequestEventRepository(supabase),
    )
    const result = await getRequest(id, session.organizationId)
    if (!result) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Solicitud no encontrada' } }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
