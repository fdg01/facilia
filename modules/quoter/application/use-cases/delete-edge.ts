// modules/quoter/application/use-cases/delete-edge.ts
import type { DagRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import { canEditDag } from '../../domain/services'

export function createDeleteEdgeUseCase(dagRepo: DagRepository) {
  return async function deleteEdge(requester: User, id: string): Promise<void> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return dagRepo.deleteEdge(id)
  }
}
