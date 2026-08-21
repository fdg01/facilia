// modules/quoter/domain/services.ts
import type { User } from '../../identity/domain/entities'
import type { Lead, LeadStatus } from './entities'

export function canEditDag(user: User): boolean {
  return user.role === 'admin'
}

export function canViewCommercialPanel(user: User): boolean {
  return user.role === 'admin'
}

const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'lost'],
  accepted: ['confirmed', 'lost'],
  lost: ['sent'],
  confirmed: [],
}

export function canChangeLeadStatus(user: User, lead: Lead, newStatus: LeadStatus): boolean {
  if (!canViewCommercialPanel(user)) return false
  return allowedTransitions[lead.status]?.includes(newStatus) ?? false
}

export function canAssociateOrganization(user: User): boolean {
  return user.role === 'admin'
}

export function generateLeadNumber(year: number, consecutive: number): string {
  const consecutiveStr = consecutive.toString().padStart(6, '0')
  return `FAC-${year}-${consecutiveStr}`
}
