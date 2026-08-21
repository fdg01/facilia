// modules/quoter/application/use-cases/edit-consumable.ts
import type { ConsumableRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Consumable } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createEditConsumableUseCase(consumableRepo: ConsumableRepository) {
  return async function editConsumable(requester: User, id: string, input: Partial<Consumable>): Promise<Consumable> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return consumableRepo.update(id, input)
  }
}
