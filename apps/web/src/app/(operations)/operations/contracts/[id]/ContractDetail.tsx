'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api-url'

interface Contract {
  id: string
  number: string
  status: string
  startDate: string
  endDate: string | null
  leadId: string
  organizationId: string
}

export default function ContractDetail({ contractId }: { contractId: string }) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl(`/api/operations/contracts/${contractId}`))
        const data = await res.json()
        setContract(data.data)
      } catch {
        setContract(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contractId])

  if (loading) return <div className="text-navy/60">Cargando contrato...</div>
  if (!contract) return <div className="text-red-600">Contrato no encontrado</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/operations/contracts" className="text-navy/60 hover:text-navy">← Volver</Link>
        <h1 className="font-display font-bold text-2xl text-navy">{contract.number}</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-navy/60">Estado</dt>
            <dd className="font-medium text-navy">{contract.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Fecha de inicio</dt>
            <dd className="font-medium text-navy">{contract.startDate?.split('T')[0]}</dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Fecha de fin</dt>
            <dd className="font-medium text-navy">{contract.endDate?.split('T')[0] ?? 'Indefinido'}</dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Lead</dt>
            <dd className="font-medium text-navy">{contract.leadId}</dd>
          </div>
        </dl>
      </div>
      <div className="flex gap-3">
        <Link
          href={`/operations/plans/new?contractId=${contract.id}`}
          className="px-4 py-2 bg-orange text-white font-medium rounded-xl hover:bg-orange/90 transition-colors"
        >
          Crear Plan Operativo
        </Link>
      </div>
    </div>
  )
}
