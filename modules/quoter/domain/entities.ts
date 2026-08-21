// modules/quoter/domain/entities.ts
export type ServiceLine = 'clean' | 'care' | 'continuity'
export type NodeType = 'root' | 'category' | 'option' | 'input' | 'consumable' | 'extra' | 'closing'
export type NodePriceType = 'fixed' | 'per_m2' | 'per_unit' | 'calculated' | 'no_price'
export type LeadStatus = 'draft' | 'sent' | 'accepted' | 'lost' | 'confirmed'
export type MarginMode = 'on_cost' | 'on_final_price'
export type QuantityMode = 'customer' | 'fixed' | 'calculated'
export type VariableType = 'environment' | 'frequency'

export interface DagNode {
  readonly id: string
  readonly code: string
  readonly label: string
  readonly description: string | null
  readonly type: NodeType
  readonly line: ServiceLine | null
  readonly priceType: NodePriceType
  readonly basePrice: number | null
  readonly variableId: string | null
  readonly consumableId: string | null
  readonly ruleId: string | null
  readonly order: number
  readonly active: boolean
}

export interface DagEdge {
  readonly id: string
  readonly sourceId: string
  readonly targetId: string
  readonly condition: Record<string, unknown> | null
  readonly order: number
  readonly active: boolean
}

export interface DagOption {
  readonly id: string
  readonly nodeId: string
  readonly code: string
  readonly label: string
  readonly description: string | null
  readonly priceType: NodePriceType
  readonly basePrice: number | null
  readonly order: number
  readonly active: boolean
}

export interface Variable {
  readonly id: string
  readonly type: VariableType
  readonly code: string
  readonly label: string
  readonly performanceM2PerHour: number | null
  readonly supplyCostPerM2: number | null
  readonly visitsPerMonth: number | null
  readonly active: boolean
}

export interface ConsumableLevel {
  readonly label: string
  readonly price: number
}

export interface Consumable {
  readonly id: string
  readonly code: string
  readonly label: string
  readonly description: string | null
  readonly quantityMode: QuantityMode
  readonly fixedQuantity: number | null
  readonly ruleId: string | null
  readonly unitPrice: number
  readonly category: string | null
  readonly levels: ConsumableLevel[] | null
  readonly active: boolean
}

export interface Parameter {
  readonly id: string
  readonly operatorHourlyCost: number
  readonly marginPercentage: number
  readonly marginMode: MarginMode
  readonly activeFrom: Date
  readonly active: boolean
}

export interface ParameterAudit {
  readonly id: string
  readonly parameterId: string
  readonly userId: string
  readonly action: string
  readonly previousValue: Record<string, unknown> | null
  readonly newValue: Record<string, unknown> | null
  readonly createdAt: Date
}

export interface Rule {
  readonly id: string
  readonly code: string
  readonly label: string
  readonly description: string | null
  readonly type: string
  readonly expression: Record<string, unknown>
  readonly active: boolean
}

export interface WelcomeGift {
  readonly id: string
  readonly description: string
  readonly active: boolean
}

export interface Lead {
  readonly id: string
  readonly number: string
  readonly status: LeadStatus
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly organizationId: string | null
  readonly userId: string | null
  readonly totalMonthly: number | null
  readonly totalPerVisit: number | null
  readonly parametersSnapshot: Record<string, unknown> | null
  readonly dagVersion: string | null
  readonly giftIncluded: boolean
  readonly giftDescription: string | null
  readonly mainLine: ServiceLine | null
  readonly notes: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface DagSelection {
  readonly nodeId: string
  readonly optionId?: string | null
  readonly value?: Record<string, unknown> | null
}

export interface BreakdownItem {
  readonly nodeId: string
  readonly label: string
  readonly priceType: NodePriceType
  readonly amount: number
  readonly detail: string | null
}

export interface QuoteResult {
  readonly totalMonthly: number
  readonly totalPerVisit: number
  readonly breakdown: BreakdownItem[]
}

export interface LeadSnapshot {
  readonly detail: Record<string, unknown>
  readonly parameters: Record<string, unknown>
  readonly dag: Record<string, unknown>
}

export interface LeadWithDetail extends Lead {
  readonly selections: DagSelection[]
  readonly snapshot: LeadSnapshot | null
}
