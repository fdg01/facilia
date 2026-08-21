// modules/quoter/application/use-cases/create-consumable.ts
import type { ConsumableRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Consumable, ConsumableLevel } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

type CreateConsumableInput = {
  code: string
  label: string
  description?: string | null
  quantityMode?: Consumable['quantityMode']
  fixedQuantity?: number | null
  ruleId?: string | null
  unitPrice: number
  category?: string | null
  levels?: ConsumableLevel[] | null
}

export function createCreateConsumableUseCase(consumableRepo: ConsumableRepository) {
  return async function createConsumable(requester: User, input: CreateConsumableInput): Promise<Consumable> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return consumableRepo.save(input)
  }
}
