// modules/portal/domain/portal-services.ts
import type { ClientRequest, RequestType, RequestPriority } from './portal-entities'

export function validateNewRequest(input: {
  type: string
  subject: string
  description: string
  priority?: string
}): { valid: boolean; error?: string } {
  const validTypes: RequestType[] = ['extra_service', 'inquiry', 'complaint']
  if (!validTypes.includes(input.type as RequestType)) {
    return { valid: false, error: 'Tipo de solicitud inválido' }
  }
  if (input.subject.length < 5 || input.subject.length > 200) {
    return { valid: false, error: 'El asunto debe tener entre 5 y 200 caracteres' }
  }
  if (input.description.length < 10 || input.description.length > 2000) {
    return { valid: false, error: 'La descripción debe tener entre 10 y 2000 caracteres' }
  }
  const validPriorities: RequestPriority[] = ['low', 'normal', 'high', 'urgent']
  if (input.priority && !validPriorities.includes(input.priority as RequestPriority)) {
    return { valid: false, error: 'Prioridad inválida' }
  }
  return { valid: true }
}

export function canClientReadRequest(request: ClientRequest, organizationId: string): boolean {
  return request.organizationId === organizationId
}

export function isCommunicationUnread(comm: { read: boolean }): boolean {
  return !comm.read
}

export function filterAuthorizedEvidence<T extends { id: string }>(
  evidence: T[],
  visibility: Array<{ evidenceId: string; organizationId: string }>,
  organizationId: string,
): T[] {
  const authorizedIds = new Set(
    visibility
      .filter((v) => v.organizationId === organizationId)
      .map((v) => v.evidenceId),
  )
  return evidence.filter((e) => authorizedIds.has(e.id))
}
