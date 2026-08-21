// src/app/(portal)/portal/leads/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePortalLeadRepository } from '@modules/portal/infrastructure'
import { createListMyLeadsUseCase } from '@modules/portal/application/use-cases'
import { LeadList } from '@modules/portal/presentation/components/LeadList'
import Link from 'next/link'

export default async function PortalLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const leadRepo = new SupabasePortalLeadRepository(supabase)
  const listMyLeads = createListMyLeadsUseCase(leadRepo)

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const status = params.status as 'draft' | 'sent' | 'accepted' | 'lost' | 'confirmed' | undefined

  const result = await listMyLeads(session.organizationId, { page, pageSize, status })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Mis cotizaciones</h1>
        <Link
          href="/portal/quote"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-white text-sm font-medium hover:bg-orange-700 transition"
        >
          + Nueva cotización
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/portal/leads"
          className={`px-3 py-1.5 rounded-lg text-sm ${!status ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
        >
          Todas
        </Link>
        {(['sent', 'accepted', 'lost', 'confirmed'] as const).map((s) => (
          <Link
            key={s}
            href={`/portal/leads?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm ${status === s ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            {s === 'sent' ? 'Enviadas' : s === 'accepted' ? 'Aceptadas' : s === 'lost' ? 'Perdidas' : 'Confirmadas'}
          </Link>
        ))}
      </div>

      <LeadList leads={result.data} emptyMessage="Aún no tenés cotizaciones. Armá la primera." />

      {/* Pagination */}
      {result.total > pageSize && (
        <div className="flex items-center justify-center gap-4 pt-4">
          {page > 1 && (
            <Link
              href={`/portal/leads?page=${page - 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Página {page} de {Math.ceil(result.total / pageSize)}
          </span>
          {page * pageSize < result.total && (
            <Link
              href={`/portal/leads?page=${page + 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
