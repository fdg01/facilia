// modules/identity/application/use-cases/list-users.ts
import type { User, UserRepository, UserFilters, Paginated } from '../../domain/repositories'
import { Errors } from '../errors'

export interface ListUsersRequest {
  readonly requester: User
  readonly filters: UserFilters
}

export function createListUsersUseCase(userRepo: UserRepository) {
  return async function listUsers(input: ListUsersRequest): Promise<Paginated<User>> {
    if (input.requester.role !== 'admin') throw Errors.forbidden()
    return userRepo.list(input.filters)
  }
}
