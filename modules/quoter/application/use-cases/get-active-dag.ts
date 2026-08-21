// modules/quoter/application/use-cases/get-active-dag.ts
import type { DagRepository } from '../../domain/repositories'

export function createGetActiveDagUseCase(dagRepo: DagRepository) {
  return async function getActiveDag() {
    return dagRepo.getActiveDag()
  }
}
