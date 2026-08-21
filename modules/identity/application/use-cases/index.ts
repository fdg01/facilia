// modules/identity/application/use-cases/index.ts
export { createLoginUseCase } from './login'
export type { LoginInput, LoginOutput } from './login'

export { createChangeOwnPasswordUseCase } from './change-own-password'
export type { ChangeOwnPasswordInput } from './change-own-password'

export { createAdminChangePasswordUseCase } from './admin-change-password'
export type { AdminChangePasswordInput } from './admin-change-password'

export { createCreateUserUseCase } from './create-user'
export type { CreateUserRequest } from './create-user'

export { createDeactivateUserUseCase } from './deactivate-user'
export type { DeactivateUserRequest } from './deactivate-user'

export { createListUsersUseCase } from './list-users'
export type { ListUsersRequest } from './list-users'

export { createEditUserUseCase } from './edit-user'
export type { EditUserRequest } from './edit-user'

export { createCreateOrganizationUseCase } from './create-organization'
export type { CreateOrganizationInput } from './create-organization'

export { createListOrganizationsUseCase } from './list-organizations'

export { createGetSessionUseCase } from './get-session'

export { createLogoutUseCase } from './logout'
