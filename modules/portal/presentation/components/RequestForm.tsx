'use client'

// modules/portal/presentation/components/RequestForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function RequestForm() {
  const router = useRouter()
  const [type, setType] = useState('extra_service')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, description, priority }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.message ?? 'Error al crear solicitud')
        return
      }
      router.push('/portal/requests')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/portal/requests" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a solicitudes
      </Link>
      <h1 className="text-2xl font-bold">Nueva solicitud</h1>
      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="extra_service">Servicio extra</option>
            <option value="inquiry">Consulta</option>
            <option value="complaint">Reclamo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            minLength={5}
            maxLength={200}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Resumen de tu solicitud"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={10}
            maxLength={2000}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Describe tu solicitud en detalle"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
