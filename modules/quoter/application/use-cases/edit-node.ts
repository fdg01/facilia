// modules/quoter/application/use-cases/edit-node.ts
import type { DagRepository, EditNodeInput } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { DagNode } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createEditNodeUseCase(dagRepo: DagRepository) {
  return async function editNode(requester: User, id: string, input: EditNodeInput): Promise<DagNode> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return dagRepo.editNode(id, input)
  }
}
