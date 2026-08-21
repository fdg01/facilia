// modules/quoter/domain/repositories.ts
import type {
  DagNode, DagEdge, DagOption, Variable, Consumable, Parameter,
  ParameterAudit, Rule, WelcomeGift, Lead, LeadWithDetail, DagSelection, LeadSnapshot,
  LeadStatus, ServiceLine, ConsumableLevel,
} from './entities'

export interface CreateNodeInput {
  readonly code: string
  readonly label: string
  readonly description?: string
  readonly type: DagNode['type']
  readonly line?: ServiceLine
  readonly priceType?: DagNode['priceType']
  readonly basePrice?: number
  readonly variableId?: string
  readonly consumableId?: string
  readonly ruleId?: string
  readonly sortOrder?: number
}

export interface EditNodeInput {
  readonly label?: string
  readonly description?: string
  readonly type?: DagNode['type']
  readonly line?: ServiceLine | null
  readonly priceType?: DagNode['priceType']
  readonly basePrice?: number | null
  readonly variableId?: string | null
  readonly consumableId?: string | null
  readonly ruleId?: string | null
  readonly sortOrder?: number
  readonly active?: boolean
}

export interface CreateEdgeInput {
  readonly sourceId: string
  readonly targetId: string
  readonly condition?: Record<string, unknown>
  readonly sortOrder?: number
}

export interface DagRepository {
  getActiveDag(): Promise<{ nodes: DagNode[]; edges: DagEdge[]; options: DagOption[] }>
  createNode(input: CreateNodeInput): Promise<DagNode>
  editNode(id: string, input: EditNodeInput): Promise<DagNode>
  deleteNode(id: string): Promise<void>
  createEdge(input: CreateEdgeInput): Promise<DagEdge>
  deleteEdge(id: string): Promise<void>
}

export interface VariableRepository {
  list(): Promise<Variable[]>
  save(variable: { id?: string; type: Variable['type']; code: string; label: string; performanceM2PerHour?: number | null; supplyCostPerM2?: number | null; visitsPerMonth?: number | null }): Promise<Variable>
  update(id: string, input: Partial<Variable>): Promise<Variable>
}

export interface ConsumableRepository {
  list(): Promise<Consumable[]>
  save(consumable: { id?: string; code: string; label: string; description?: string | null; quantityMode?: Consumable['quantityMode']; fixedQuantity?: number | null; ruleId?: string | null; unitPrice: number; category?: string | null; levels?: ConsumableLevel[] | null }): Promise<Consumable>
  update(id: string, input: Partial<Consumable>): Promise<Consumable>
}

export interface UpdateParameterInput {
  readonly operatorHourlyCost: number
  readonly marginPercentage: number
  readonly marginMode: Parameter['marginMode']
}

export interface ParameterRepository {
  getActive(): Promise<Parameter | null>
  update(input: UpdateParameterInput, userId: string): Promise<Parameter>
  listAudit(parameterId?: string): Promise<ParameterAudit[]>
}

export interface RuleRepository {
  list(): Promise<Rule[]>
  save(rule: { id?: string; code: string; label: string; description?: string | null; type: string; expression: Record<string, unknown> }): Promise<Rule>
  update(id: string, input: Partial<Rule>): Promise<Rule>
}

export interface UpdateWelcomeGiftInput {
  readonly description: string
  readonly active: boolean
}

export interface WelcomeGiftRepository {
  getActive(): Promise<WelcomeGift | null>
  update(input: UpdateWelcomeGiftInput): Promise<WelcomeGift>
}

export interface LeadFilters {
  readonly status?: LeadStatus
  readonly line?: ServiceLine
  readonly organizationId?: string
  readonly fromDate?: Date
  readonly toDate?: Date
  readonly page?: number
  readonly pageSize?: number
}

export interface Paginated<T> {
  readonly data: T[]
  readonly meta: { readonly page: number; readonly pageSize: number; readonly total: number }
}

export interface CreateLeadInput {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly selections: DagSelection[]
  readonly mainLine: ServiceLine
  readonly totalMonthly: number
  readonly totalPerVisit: number
  readonly parametersSnapshot: Record<string, unknown>
  readonly dagVersion: string
  readonly giftIncluded: boolean
  readonly giftDescription: string | null
  readonly userId?: string | null
  readonly organizationId?: string | null
}

export interface LeadRepository {
  save(lead: CreateLeadInput, snapshot: LeadSnapshot): Promise<Lead>
  findById(id: string): Promise<LeadWithDetail | null>
  list(filters: LeadFilters): Promise<Paginated<Lead>>
  updateStatus(id: string, status: LeadStatus, notes?: string): Promise<Lead>
  associateOrganization(id: string, organizationId: string): Promise<Lead>
  getNextNumber(): Promise<string>
}
