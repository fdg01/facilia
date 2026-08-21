// src/app/api/portal/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCalendarReader } from '@modules/portal/infrastructure'
import { createListCalendarUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await requireClient()
    const url = new URL(request.url)
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')

    const from = fromParam ? new Date(fromParam) : new Date()
    const to = toParam ? new Date(toParam) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Fechas inválidas' } }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const listCalendar = createListCalendarUseCase(new SupabaseCalendarReader(supabase))
    const visits = await listCalendar(session.organizationId, from, to)
    return NextResponse.json({ data: visits })
  } catch (error) {
    return handleApiError(error)
  }
}
