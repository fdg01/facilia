// modules/identity/domain/repositories.ts
import type { User, UserStatus, Organization, Role } from './entities'

export type { User, UserStatus, Organization, Role }

export interface UserFilters {
  readonly role?: Role
  readonly organizationId?: string
  readonly status?: UserStatus
  readonly page?: number
  readonly pageSize?: number
}

export interface Paginated<T> {
  readonly data: T[]
  readonly meta: {
    readonly page: number
    readonly pageSize: number
    readonly total: number
  }
}

export interface CreateUserInput {
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly role: Role
  readonly organizationId?: string
  readonly phone?: string
  readonly temporaryPassword: string
}

export interface UpdateUserInput {
  readonly firstName?: string
  readonly lastName?: string
  readonly phone?: string
  readonly status?: UserStatus
  readonly role?: Role
  readonly organizationId?: string | null
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByAuthId(authId: string): Promise<User | null>
  list(filters: UserFilters): Promise<Paginated<User>>
  save(user: User): Promise<User>
  updateStatus(id: string, status: UserStatus): Promise<User>
  update(id: string, input: UpdateUserInput): Promise<User>
  setMustChangePassword(id: string, value: boolean): Promise<void>
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>
  list(): Promise<Organization[]>
  save(org: Organization): Promise<Organization>
}

export interface AuthRepository {
  createAuthUser(email: string, password: string, metadata: Record<string, unknown>): Promise<string>
  changePassword(authId: string, newPassword: string): Promise<void>
  verifyCredentials(email: string, password: string): Promise<string | null>
  invalidateSessions(authId: string): Promise<void>
  adminSetPassword(authId: string, newPassword: string): Promise<void>
}
