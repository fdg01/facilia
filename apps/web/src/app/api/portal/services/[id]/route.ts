// src/app/api/portal/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseServiceReader, SupabaseServiceEventRepository } from '@modules/portal/infrastructure'
import { createGetServiceUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const getService = createGetServiceUseCase(
      new SupabaseServiceReader(supabase),
      new SupabaseServiceEventRepository(supabase),
    )
    const result = await getService(id, session.organizationId)
    if (!result) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
