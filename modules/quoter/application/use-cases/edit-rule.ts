// modules/quoter/application/use-cases/edit-rule.ts
import type { RuleRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Rule } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

export function createEditRuleUseCase(ruleRepo: RuleRepository) {
  return async function editRule(requester: User, id: string, input: Partial<Rule>): Promise<Rule> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return ruleRepo.update(id, input)
  }
}
