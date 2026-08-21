// modules/quoter/domain/engine.test.ts
import { describe, it, expect } from 'vitest'
import { calculateQuote } from './engine'
import type {
  DagNode, DagEdge, DagOption, DagSelection, Variable, Consumable,
  Parameter, Rule, WelcomeGift,
} from './entities'

function makeNode(overrides: Partial<DagNode>): DagNode {
  return {
    id: 'n1', code: 'n1', label: 'Node 1', description: null, type: 'option',
    line: null, priceType: 'no_price', basePrice: null,
    variableId: null, consumableId: null, ruleId: null, order: 0, active: true,
    ...overrides,
  }
}

function makeParameter(overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: 'p1', operatorHourlyCost: 100, marginPercentage: 30,
    marginMode: 'on_cost', activeFrom: new Date(), active: true,
    ...overrides,
  }
}

const emptyDag = { nodes: [] as DagNode[], edges: [] as DagEdge[], options: [] as DagOption[] }
const emptyExtras = {
  variables: [] as Variable[], consumables: [] as Consumable[],
  rules: [] as Rule[], welcomeGift: null as WelcomeGift | null,
}

describe('calculateQuote', () => {
  it('returns 0 for no selections', () => {
    const result = calculateQuote({
      dag: emptyDag, selections: [], parameter: makeParameter(), ...emptyExtras,
    })
    expect(result.totalMonthly).toBe(0)
    expect(result.totalPerVisit).toBe(0)
    expect(result.breakdown).toHaveLength(0)
  })

  it('calculates fixed price node', () => {
    const node = makeNode({ id: 'n1', priceType: 'fixed', basePrice: 500 })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: null }],
      parameter: makeParameter(),
      ...emptyExtras,
    })
    // 500 * 1.30 = 650
    expect(result.totalMonthly).toBe(650)
  })

  it('calculates per_m2 with variable and parameter', () => {
    const variable: Variable = {
      id: 'v1', type: 'environment', code: 'office', label: 'Office',
      performanceM2PerHour: 50, supplyCostPerM2: 10, visitsPerMonth: null, active: true,
    }
    const node = makeNode({
      id: 'n1', priceType: 'per_m2', variableId: 'v1',
    })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: { m2: 100 } }],
      variables: [variable],
      parameter: makeParameter({ operatorHourlyCost: 100 }),
      consumables: [], rules: [], welcomeGift: null,
    })
    // hours = 100/50 = 2, cost = 2*100 + 100*10 = 200 + 1000 = 1200
    // with 30% margin = 1200 * 1.30 = 1560
    expect(result.totalMonthly).toBe(1560)
  })

  it('applies margin on_final_price correctly', () => {
    const node = makeNode({ id: 'n1', priceType: 'fixed', basePrice: 700 })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: null }],
      parameter: makeParameter({ marginPercentage: 30, marginMode: 'on_final_price' }),
      ...emptyExtras,
    })
    // price = 700 / (1 - 0.30) = 700 / 0.70 = 1000
    expect(result.totalMonthly).toBe(1000)
  })

  it('calculates per_unit price', () => {
    const node = makeNode({ id: 'n1', priceType: 'per_unit', basePrice: 50 })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: { quantity: 12 } }],
      parameter: makeParameter({ marginPercentage: 0 }),
      ...emptyExtras,
    })
    // 12 * 50 = 600, no margin
    expect(result.totalMonthly).toBe(600)
  })

  it('sums consumable with fixed quantity', () => {
    const consumable: Consumable = {
      id: 'c1', code: 'coffee', label: 'Coffee Maker', description: null,
      quantityMode: 'fixed', fixedQuantity: 1, ruleId: null, unitPrice: 200,
      category: 'appliance', levels: null, active: true,
    }
    const node = makeNode({ id: 'n1', type: 'consumable', consumableId: 'c1', priceType: 'no_price' })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: null }],
      consumables: [consumable],
      parameter: makeParameter({ marginPercentage: 0 }),
      variables: [], rules: [], welcomeGift: null,
    })
    // 1 * 200 = 200
    expect(result.totalMonthly).toBe(200)
  })

  it('sums consumable with customer quantity', () => {
    const consumable: Consumable = {
      id: 'c1', code: 'dispenser', label: 'Dispenser', description: null,
      quantityMode: 'customer', fixedQuantity: null, ruleId: null, unitPrice: 30,
      category: 'supply', levels: null, active: true,
    }
    const node = makeNode({ id: 'n1', type: 'consumable', consumableId: 'c1', priceType: 'no_price' })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: { quantity: 5 } }],
      consumables: [consumable],
      parameter: makeParameter({ marginPercentage: 0 }),
      variables: [], rules: [], welcomeGift: null,
    })
    // 5 * 30 = 150
    expect(result.totalMonthly).toBe(150)
  })

  it('calculates total per visit dividing by visits per month', () => {
    const freqVariable: Variable = {
      id: 'v1', type: 'frequency', code: 'daily', label: 'Daily',
      performanceM2PerHour: null, supplyCostPerM2: null, visitsPerMonth: 22, active: true,
    }
    const freqNode = makeNode({ id: 'freq', variableId: 'v1' })
    const fixedNode = makeNode({ id: 'n1', priceType: 'fixed', basePrice: 440 })
    const result = calculateQuote({
      dag: { nodes: [freqNode, fixedNode], edges: [], options: [] },
      selections: [
        { nodeId: 'freq', optionId: null, value: null },
        { nodeId: 'n1', optionId: null, value: null },
      ],
      variables: [freqVariable],
      parameter: makeParameter({ marginPercentage: 0 }),
      consumables: [], rules: [], welcomeGift: null,
    })
    // total = 440, visits = 22, per visit = 440/22 = 20
    expect(result.totalMonthly).toBe(440)
    expect(result.totalPerVisit).toBe(20)
  })

  it('rounds to 2 decimals', () => {
    const node = makeNode({ id: 'n1', priceType: 'fixed', basePrice: 100 })
    const result = calculateQuote({
      dag: { nodes: [node], edges: [], options: [] },
      selections: [{ nodeId: 'n1', optionId: null, value: null }],
      parameter: makeParameter({ marginPercentage: 33 }),
      ...emptyExtras,
    })
    // 100 * 1.33 = 133.00
    expect(result.totalMonthly).toBe(133)
  })
})
