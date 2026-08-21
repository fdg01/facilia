// modules/identity/infrastructure/supabase/mappers.ts
import type { User, Organization, Role, UserStatus } from '../../domain/entities'

interface DbUser {
  id: string
  auth_id: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  role: Role
  status: UserStatus
  organization_id: string | null
  phone: string | null
  must_change_password: boolean
  created_at: string
  updated_at: string
}

interface DbOrganization {
  id: string
  name: string
  tax_id: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export function mapDbUserToDomain(row: DbUser): User {
  if (!row.auth_id) throw new Error(`User ${row.id} has no auth_id`)
  if (!row.email) throw new Error(`User ${row.id} has no email`)
  return {
    id: row.id,
    authId: row.auth_id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    role: row.role,
    status: row.status,
    organizationId: row.organization_id,
    phone: row.phone,
    mustChangePassword: row.must_change_password,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapDbOrgToDomain(row: DbOrganization): Organization {
  return {
    id: row.id,
    name: row.name,
    taxId: row.tax_id,
    email: row.email,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}
