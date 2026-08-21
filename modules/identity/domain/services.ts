// modules/identity/domain/services.ts
import type { User, Role } from './entities'

/**
 * An admin can deactivate another user but never themselves.
 */
export function canDeactivate(requester: User, target: User): boolean {
  if (requester.role !== 'admin') return false
  if (requester.id === target.id) return false
  return true
}

/**
 * Only an admin can change roles.
 */
export function canChangeRole(requester: User, _newRole: Role): boolean {
  if (requester.role !== 'admin') return false
  return true
}

/**
 * An admin cannot remove their own admin role
 * (would leave the system without admin access).
 */
export function canRemoveAdminRole(requester: User, target: User, newRole: Role): boolean {
  if (requester.role !== 'admin') return false
  if (requester.id === target.id && newRole !== 'admin') return false
  return true
}

export function isClient(user: User): boolean {
  return user.role === 'client'
}

export function canAccessOrganization(user: User, orgId: string): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'client') return user.organizationId === orgId
  return false
}

/**
 * A client must always have an organization.
 * An admin or employee must never have one.
 */
export function validateOrganizationAssignment(role: Role, organizationId: string | null): boolean {
  if (role === 'client') return organizationId !== null
  return organizationId === null
}

/**
 * Only an admin can create users.
 */
export function canCreateUser(requester: User): boolean {
  return requester.role === 'admin'
}

/**
 * Only an admin can change another user's password.
 */
export function canChangeOtherPassword(requester: User, _target: User): boolean {
  return requester.role === 'admin'
}

/**
 * A user can always change their own password.
 */
export function canChangeOwnPassword(requester: User, target: User): boolean {
  return requester.id === target.id
}
