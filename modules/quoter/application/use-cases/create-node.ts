// modules/quoter/application/use-cases/create-node.ts
import type { DagRepository, CreateNodeInput } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { DagNode } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createCreateNodeUseCase(dagRepo: DagRepository) {
  return async function createNode(requester: User, input: CreateNodeInput): Promise<DagNode> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return dagRepo.createNode(input)
  }
}
