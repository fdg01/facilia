// modules/quoter/application/use-cases/update-welcome-gift.ts
import type { WelcomeGiftRepository, UpdateWelcomeGiftInput } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { WelcomeGift } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createUpdateWelcomeGiftUseCase(welcomeGiftRepo: WelcomeGiftRepository) {
  return async function updateWelcomeGift(requester: User, input: UpdateWelcomeGiftInput): Promise<WelcomeGift> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return welcomeGiftRepo.update(input)
  }
}
