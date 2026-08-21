// modules/quoter/application/use-cases/delete-node.ts
import type { DagRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import { canEditDag } from '../../domain/services'

export function createDeleteNodeUseCase(dagRepo: DagRepository) {
  return async function deleteNode(requester: User, id: string): Promise<void> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return dagRepo.deleteNode(id)
  }
}
