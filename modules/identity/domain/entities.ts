// modules/identity/domain/entities.ts

export type Role = 'admin' | 'employee' | 'client'
export type UserStatus = 'active' | 'inactive'

export interface User {
  readonly id: string
  readonly authId: string
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly role: Role
  readonly status: UserStatus
  readonly organizationId: string | null
  readonly phone: string | null
  readonly mustChangePassword: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Organization {
  readonly id: string
  readonly name: string
  readonly taxId: string | null
  readonly email: string | null
  readonly phone: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Session {
  readonly userId: string
  readonly authId: string
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly role: Role
  readonly organizationId: string | null
  readonly status: UserStatus
  readonly mustChangePassword: boolean
}
