// modules/quoter/application/use-cases/confirm-lead.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DagRepository, VariableRepository, ConsumableRepository, ParameterRepository, RuleRepository, WelcomeGiftRepository, LeadRepository } from '../../domain/repositories'
import type { DagSelection, ServiceLine, Lead } from '../../domain/entities'
import { calculateQuote } from '../../domain/engine'
import { generateQuotePdf, uploadLeadPdf, getSignedPdfUrl } from '../../infrastructure/pdf/quote-pdf'

interface ConfirmLeadInput {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly selections: DagSelection[]
  readonly mainLine: ServiceLine
  readonly userId?: string | null
  readonly organizationId?: string | null
}

export function createConfirmLeadUseCase(
  dagRepo: DagRepository,
  variableRepo: VariableRepository,
  consumableRepo: ConsumableRepository,
  parameterRepo: ParameterRepository,
  ruleRepo: RuleRepository,
  welcomeGiftRepo: WelcomeGiftRepository,
  leadRepo: LeadRepository,
  serviceClient: SupabaseClient,
) {
  return async function confirmLead(input: ConfirmLeadInput): Promise<{
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
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
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
    const pdfUrl = await getSignedPdfUrl(serviceClient, lead.id)

    return { lead, pdfUrl }
  }
}
