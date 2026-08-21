// modules/portal/application/use-cases/create-lead-portal.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DagRepository, VariableRepository, ConsumableRepository,
  ParameterRepository, RuleRepository, WelcomeGiftRepository, LeadRepository,
} from '../../../quoter/domain/repositories'
import type { DagSelection, ServiceLine, Lead } from '../../../quoter/domain/entities'
import { calculateQuote } from '../../../quoter/domain/engine'
import { generateQuotePdf, uploadLeadPdf } from '../../../quoter/infrastructure/pdf/quote-pdf'

interface CreateLeadPortalInput {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly selections: DagSelection[]
  readonly mainLine: ServiceLine
  readonly userId: string
  readonly organizationId: string
}

export function createCreateLeadPortalUseCase(
  dagRepo: DagRepository,
  variableRepo: VariableRepository,
  consumableRepo: ConsumableRepository,
  parameterRepo: ParameterRepository,
  ruleRepo: RuleRepository,
  welcomeGiftRepo: WelcomeGiftRepository,
  leadRepo: LeadRepository,
  serviceClient: SupabaseClient,
) {
  return async function createLeadPortal(input: CreateLeadPortalInput): Promise<{
    lead: Lead
    pdfUrl: string
  }> {
    const [dag, variables, consumables, parameters, rules, welcomeGift] = await Promise.all([
      dagRepo.getActiveDag(),
      variableRepo.list(),
      consumableRepo.list(),
      parameterRepo.getActive(),
      ruleRepo.list(),
      welcomeGiftRepo.getActive(),
    ])

    if (!parameters) throw new Error('No active parameters found')

    const result = calculateQuote({
      dag,
      selections: input.selections,
      variables: variables.filter((v) => v.active),
      consumables: consumables.filter((c) => c.active),
      parameter: parameters,
      rules: rules.filter((r) => r.active),
      welcomeGift,
    })

    const giftIncluded = welcomeGift?.active ?? false
    const giftDescription = welcomeGift?.description ?? null

    // Save lead with organization_id and user_id from session
    const lead = await leadRepo.save(
      {
        name: input.name,
        email: input.email,
        phone: input.phone,
        selections: input.selections,
        mainLine: input.mainLine,
        totalMonthly: result.totalMonthly,
        totalPerVisit: result.totalPerVisit,
        parametersSnapshot: {
          operatorHourlyCost: parameters.operatorHourlyCost,
          marginPercentage: parameters.marginPercentage,
          marginMode: parameters.marginMode,
        },
        dagVersion: '1',
        giftIncluded,
        giftDescription,
        userId: input.userId,
        organizationId: input.organizationId,
      },
      {
        detail: { breakdown: result.breakdown },
        parameters: {
          operatorHourlyCost: parameters.operatorHourlyCost,
          marginPercentage: parameters.marginPercentage,
          marginMode: parameters.marginMode,
        },
        dag: { nodes: dag.nodes.length, edges: dag.edges.length },
      },
    )

    // Generate and upload PDF
    const pdfBuffer = await generateQuotePdf({
      lead,
      breakdown: result.breakdown,
      giftDescription,
    })

    await uploadLeadPdf(serviceClient, lead.id, pdfBuffer)

    return { lead, pdfUrl: '' }
  }
}
