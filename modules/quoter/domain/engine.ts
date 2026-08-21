// modules/quoter/domain/engine.ts
import type {
  DagNode, DagEdge, DagOption, DagSelection, Variable, Consumable,
  Parameter, Rule, WelcomeGift, QuoteResult, BreakdownItem, NodePriceType,
} from './entities'

interface CalculateInput {
  readonly dag: { nodes: DagNode[]; edges: DagEdge[]; options: DagOption[] }
  readonly selections: DagSelection[]
  readonly variables: Variable[]
  readonly consumables: Consumable[]
  readonly parameter: Parameter
  readonly rules: Rule[]
  readonly welcomeGift: WelcomeGift | null
}

export function calculateQuote(input: CalculateInput): QuoteResult {
  if (input.selections.length === 0) {
    return { totalMonthly: 0, totalPerVisit: 0, breakdown: [] }
  }

  const activeNodes = resolveActiveNodes(input.dag, input.selections)
  const baseCost = calculateBaseCost(activeNodes, input.selections, input.variables, input.parameter)
  const consumablesCost = calculateConsumables(activeNodes, input.selections, input.consumables, input.rules)
  const totalCost = baseCost.total + consumablesCost.total
  const finalPrice = applyMargin(totalCost, input.parameter)
  const visitsPerMonth = getVisitsPerMonth(input.dag.nodes, input.selections, input.variables)
  const totalMonthly = round(finalPrice)
  const totalPerVisit = visitsPerMonth > 0 ? round(finalPrice / visitsPerMonth) : 0

  return {
    totalMonthly,
    totalPerVisit,
    breakdown: [...baseCost.breakdown, ...consumablesCost.breakdown],
  }
}

function resolveActiveNodes(
  dag: { nodes: DagNode[]; edges: DagEdge[]; options: DagOption[] },
  selections: DagSelection[],
): DagNode[] {
  const selectedNodeIds = new Set(selections.map((s) => s.nodeId))
  return dag.nodes.filter((n) => selectedNodeIds.has(n.id) && n.active)
}

function calculateBaseCost(
  activeNodes: DagNode[],
  selections: DagSelection[],
  variables: Variable[],
  parameter: Parameter,
): { total: number; breakdown: BreakdownItem[] } {
  let total = 0
  const breakdown: BreakdownItem[] = []

  for (const node of activeNodes) {
    const selection = selections.find((s) => s.nodeId === node.id)
    const amount = calculateNodePrice(node, selection, variables, parameter)
    if (amount > 0) {
      total += amount
      breakdown.push({
        nodeId: node.id,
        label: node.label,
        priceType: node.priceType,
        amount: round(amount),
        detail: buildDetail(node, selection),
      })
    }
  }

  return { total, breakdown }
}

function calculateNodePrice(
  node: DagNode,
  selection: DagSelection | undefined,
  variables: Variable[],
  parameter: Parameter,
): number {
  switch (node.priceType) {
    case 'fixed':
      return node.basePrice ?? 0
    case 'per_m2': {
      const m2 = getNumericValue(selection, 'm2')
      if (m2 <= 0) return 0
      const variable = variables.find((v) => v.id === node.variableId)
      const performance = variable?.performanceM2PerHour ?? 1
      const supplyCost = variable?.supplyCostPerM2 ?? 0
      const hours = m2 / performance
      return hours * parameter.operatorHourlyCost + m2 * supplyCost
    }
    case 'per_unit': {
      const qty = getNumericValue(selection, 'quantity')
      return qty * (node.basePrice ?? 0)
    }
    case 'calculated':
      return node.basePrice ?? 0
    case 'no_price':
      return 0
  }
}

function calculateConsumables(
  activeNodes: DagNode[],
  selections: DagSelection[],
  consumables: Consumable[],
  _rules: Rule[],
): { total: number; breakdown: BreakdownItem[] } {
  let total = 0
  const breakdown: BreakdownItem[] = []

  for (const node of activeNodes) {
    if (node.type !== 'consumable' || !node.consumableId) continue
    const consumable = consumables.find((c) => c.id === node.consumableId)
    if (!consumable) continue

    const selection = selections.find((s) => s.nodeId === node.id)
    const quantity = getConsumableQuantity(consumable, selection)
    const levelPrice = getLevelPrice(consumable, selection)
    const unitPrice = levelPrice !== null ? levelPrice : consumable.unitPrice
    const amount = quantity * unitPrice

    total += amount
    breakdown.push({
      nodeId: node.id,
      label: consumable.label,
      priceType: 'per_unit',
      amount: round(amount),
      detail: `${quantity} x ${unitPrice}`,
    })
  }

  return { total, breakdown }
}

function getConsumableQuantity(consumable: Consumable, selection: DagSelection | undefined): number {
  if (consumable.quantityMode === 'fixed') return consumable.fixedQuantity ?? 1
  if (consumable.quantityMode === 'customer') return getNumericValue(selection, 'quantity') || 1
  return getNumericValue(selection, 'quantity') || 1
}

function getLevelPrice(consumable: Consumable, selection: DagSelection | undefined): number | null {
  if (!consumable.levels || !selection?.value) return null
  const levelLabel = selection.value['level'] as string | undefined
  if (!levelLabel) return null
  const level = consumable.levels.find((l) => l.label === levelLabel)
  return level?.price ?? null
}

function getVisitsPerMonth(nodes: DagNode[], selections: DagSelection[], variables: Variable[]): number {
  for (const sel of selections) {
    const node = nodes.find((n) => n.id === sel.nodeId)
    if (!node?.variableId) continue
    const variable = variables.find((v) => v.id === node.variableId)
    if (variable?.type === 'frequency' && variable.visitsPerMonth) {
      return variable.visitsPerMonth
    }
  }
  return 1
}

function applyMargin(cost: number, parameter: Parameter): number {
  if (parameter.marginMode === 'on_cost') {
    return cost * (1 + parameter.marginPercentage / 100)
  }
  return cost / (1 - parameter.marginPercentage / 100)
}

function getNumericValue(selection: DagSelection | undefined, key: string): number {
  if (!selection?.value) return 0
  const v = selection.value[key]
  return typeof v === 'number' ? v : 0
}

function buildDetail(node: DagNode, selection: DagSelection | undefined): string | null {
  if (!selection?.value) return null
  const entries = Object.entries(selection.value)
  if (entries.length === 0) return null
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
