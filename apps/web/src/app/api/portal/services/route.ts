// src/app/api/portal/services/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseServiceReader } from '@modules/portal/infrastructure'
import { createListServicesUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listServices = createListServicesUseCase(new SupabaseServiceReader(supabase))
    const services = await listServices(session.organizationId)
    return NextResponse.json({ data: services })
  } catch (error) {
    return handleApiError(error)
  }
}
