// modules/quoter/application/use-cases/create-edge.ts
import type { DagRepository, CreateEdgeInput } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { DagEdge } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createCreateEdgeUseCase(dagRepo: DagRepository) {
  return async function createEdge(requester: User, input: CreateEdgeInput): Promise<DagEdge> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    try {
      return await dagRepo.createEdge(input)
    } catch (error) {
      if (error instanceof Error && error.message.includes('DAG_INVALID')) {
        throw new Error('DAG_INVALID')
      }
      throw error
    }
  }
}
