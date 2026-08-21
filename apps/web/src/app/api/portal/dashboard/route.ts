// src/app/api/portal/dashboard/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePortalDashboardRepository } from '@modules/portal/infrastructure'
import { createGetDashboardUseCase } from '@modules/portal/application/use-cases'

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const dashboardRepo = new SupabasePortalDashboardRepository(supabase)
    const getDashboard = createGetDashboardUseCase(dashboardRepo)

    const data = await getDashboard(session.organizationId)
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NO_SESSION') || error.message.includes('FORBIDDEN'))) {
      const status = error.message.includes('NO_SESSION') ? 401 : 403
      return NextResponse.json(
        { error: { code: error.message.includes('NO_SESSION') ? 'NO_SESSION' : 'FORBIDDEN', message: error.message } },
        { status },
      )
    }
    console.error('Portal dashboard error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
