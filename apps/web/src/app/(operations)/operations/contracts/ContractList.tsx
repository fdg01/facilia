'use client'

import { apiUrl } from "@/lib/api-url"
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Contract {
  id: string
  number: string
  status: string
  startDate: string
  endDate: string | null
  organizationId: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-navy/10 text-navy',
  ended: 'bg-gray-200 text-gray-700',
}

const statusLabels: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  ended: 'Finalizado',
}

export default function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/operations/contracts?page=1&pageSize=50'))
        const data = await res.json()
        setContracts(data.data ?? [])
      } catch {
        setContracts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-navy/60">Cargando contratos...</div>

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Contratos</h1>
      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-navy/60">
          No hay contratos. Crea uno desde un lead confirmado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Número</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Inicio</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Fin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-navy/2">
                  <td className="px-4 py-3 text-sm font-medium text-navy">{c.number}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] ?? 'bg-gray-100'}`}>
                      {statusLabels[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy/70">{c.startDate?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{c.endDate?.split('T')[0] ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/operations/contracts/${c.id}`} className="text-sm text-navy/60 hover:text-navy">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

