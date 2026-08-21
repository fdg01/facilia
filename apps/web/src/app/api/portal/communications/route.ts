// src/app/api/portal/communications/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCommunicationRepository } from '@modules/portal/infrastructure'
import { createListCommunicationsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listCommunications = createListCommunicationsUseCase(new SupabaseCommunicationRepository(supabase))
    const result = await listCommunications(session.organizationId)
    return NextResponse.json({ data: result.data, meta: { unread: result.unread } })
  } catch (error) {
    return handleApiError(error)
  }
}
