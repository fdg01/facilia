// src/app/(portal)/portal/calendar/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCalendarReader } from '@modules/portal/infrastructure'
import { createListCalendarUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { VisitCalendar } from '@modules/portal/presentation/components/VisitCalendar'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await requireClient()
  const params = await searchParams
  const now = new Date()
  const from = params.from ? new Date(params.from) : now
  const to = params.to
    ? new Date(params.to)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const supabase = await createServerSupabaseClient()
  const listCalendar = createListCalendarUseCase(new SupabaseCalendarReader(supabase))
  const visits = await listCalendar(session.organizationId, from, to)
  return <VisitCalendar visits={visits} fromDate={from} toDate={to} />
}
