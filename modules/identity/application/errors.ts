// modules/identity/application/errors.ts

export class IdentityError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'IdentityError'
  }
}

export const Errors = {
  invalidCredentials: () => new IdentityError('AUTH_INVALID', 'Credenciales inválidas', 401),
  userInactive: () => new IdentityError('AUTH_INACTIVE', 'Usuario inactivo', 403),
  noSession: () => new IdentityError('NO_SESSION', 'No hay sesión activa', 401),
  forbidden: () => new IdentityError('FORBIDDEN', 'No tiene permisos para esta acción', 403),
  userNotFound: () => new IdentityError('USER_NOT_FOUND', 'Usuario no encontrado', 404),
  organizationNotFound: () => new IdentityError('ORG_NOT_FOUND', 'Organización no encontrada', 404),
  emailExists: () => new IdentityError('EMAIL_EXISTS', 'El email ya está registrado', 409),
  invalidOrganization: () => new IdentityError('INVALID_ORG', 'Asignación de organización inválida', 400),
  cannotDeactivateSelf: () => new IdentityError('CANNOT_DEACTIVATE_SELF', 'No puede inactivarse a sí mismo', 403),
  cannotRemoveOwnAdmin: () => new IdentityError('CANNOT_REMOVE_OWN_ADMIN', 'No puede quitarse su propio rol admin', 403),
  passwordTooShort: () => new IdentityError('PASSWORD_TOO_SHORT', 'La contraseña debe tener al menos 8 caracteres', 400),
  mustChangePassword: () => new IdentityError('MUST_CHANGE_PASSWORD', 'Debe cambiar su contraseña', 403),
}
