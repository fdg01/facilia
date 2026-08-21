// modules/portal/presentation/components/VisitCalendar.tsx
import Link from 'next/link'
import type { CalendarVisit } from '../../domain/portal-entities'

interface VisitCalendarProps {
  visits: CalendarVisit[]
  fromDate: Date
  toDate: Date
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-200 text-gray-600 border-gray-300',
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export function VisitCalendar({ visits, fromDate, toDate }: VisitCalendarProps) {
  // Group visits by date
  const visitsByDate = visits.reduce<Record<string, CalendarVisit[]>>((acc, v) => {
    const date = v.date.split('T')[0]
    acc[date] = acc[date] ?? []
    acc[date].push(v)
    return acc
  }, {})

  const fromStr = fromDate.toISOString().split('T')[0]
  const toStr = toDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Calendario de visitas</h1>
        <Link
          href={`/portal/calendar?from=${fromStr}&to=${toStr}`}
          className="text-sm text-blue-600 hover:underline"
        >
          {fromStr} → {toStr}
        </Link>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No hay visitas programadas en este período
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(visitsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayVisits]) => (
              <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="font-semibold text-sm text-gray-700 mb-3">
                  {new Date(date + 'T00:00:00').toLocaleDateString('es-UY', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <div className="space-y-2">
                  {dayVisits.map((v) => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${statusColors[v.status] ?? 'bg-gray-100 border-gray-200'}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{v.serviceDescription}</p>
                        {v.timeWindow && <p className="text-xs opacity-75">{v.timeWindow}</p>}
                      </div>
                      <span className="text-xs font-medium">
                        {statusLabels[v.status] ?? v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
