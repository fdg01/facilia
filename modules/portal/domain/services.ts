// modules/portal/domain/services.ts
import type { User } from '../../identity/domain/entities'
import type { LeadStatus } from './types'

/**
 * Verifica si un cliente puede ver un lead.
 * Debe pertenecer a su organización.
 */
export function canViewLead(
  client: Pick<User, 'role' | 'status' | 'organizationId'>,
  lead: { organizationId: string | null },
): boolean {
  if (client.role !== 'client') return false
  if (client.status !== 'active') return false
  return client.organizationId === lead.organizationId
}

/**
 * Determina si un lead es de solo lectura para el cliente.
 * Solo se puede "editar" (en realidad re-armar) cuando está en draft.
 * sent, accepted, lost, confirmed → solo lectura.
 */
export function isReadOnly(status: LeadStatus): boolean {
  return status !== 'draft'
}

/**
 * Mapea estado a label y color para UI.
 * Los valores del enum son en inglés; los labels de UI en español.
 */
export function formatStatus(status: LeadStatus): {
  label: string
  color: 'navy' | 'orange' | 'blue' | 'green' | 'red'
} {
  const map: Record<LeadStatus, { label: string; color: 'navy' | 'orange' | 'blue' | 'green' | 'red' }> = {
    draft: { label: 'Borrador', color: 'navy' },
    sent: { label: 'Enviado', color: 'orange' },
    accepted: { label: 'Aceptado', color: 'blue' },
    lost: { label: 'Perdido', color: 'red' },
    confirmed: { label: 'Confirmado', color: 'green' },
  }
  return map[status]
}
