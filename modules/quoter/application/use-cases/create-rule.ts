// modules/quoter/application/use-cases/create-rule.ts
import type { RuleRepository } from '../../domain/repositories'
import type { User } from '../../../identity/domain/entities'
import type { Rule } from '../../domain/entities'
import { canEditDag } from '../../domain/services'

type CreateRuleInput = {
  code: string
  label: string
  description?: string | null
  type: string
  expression: Record<string, unknown>
}

export function createCreateRuleUseCase(ruleRepo: RuleRepository) {
  return async function createRule(requester: User, input: CreateRuleInput): Promise<Rule> {
    if (!canEditDag(requester)) throw new Error('FORBIDDEN')
    return ruleRepo.save(input)
  }
}
