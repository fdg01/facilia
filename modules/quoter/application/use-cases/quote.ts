// modules/quoter/application/use-cases/quote.ts
import type { DagRepository, VariableRepository, ConsumableRepository, ParameterRepository, RuleRepository, WelcomeGiftRepository } from '../../domain/repositories'
import type { DagSelection, QuoteResult } from '../../domain/entities'
import { calculateQuote } from '../../domain/engine'

interface QuoteInput {
  readonly selections: DagSelection[]
}

export function createQuoteUseCase(
  dagRepo: DagRepository,
  variableRepo: VariableRepository,
  consumableRepo: ConsumableRepository,
  parameterRepo: ParameterRepository,
  ruleRepo: RuleRepository,
  welcomeGiftRepo: WelcomeGiftRepository,
) {
  return async function quote(input: QuoteInput): Promise<QuoteResult> {
    const [dag, variables, consumables, parameters, rules, welcomeGift] = await Promise.all([
      dagRepo.getActiveDag(),
      variableRepo.list(),
      consumableRepo.list(),
      parameterRepo.getActive(),
      ruleRepo.list(),
      welcomeGiftRepo.getActive(),
    ])

    if (!parameters) throw new Error('No active parameters found')

    return calculateQuote({
      dag,
      selections: input.selections,
      variables: variables.filter((v) => v.active),
      consumables: consumables.filter((c) => c.active),
      parameter: parameters,
      rules: rules.filter((r) => r.active),
      welcomeGift,
    })
  }
}
