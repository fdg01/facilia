// modules/quoter/infrastructure/supabase/mappers.ts
import type {
  DagNode, DagEdge, DagOption, Variable, Consumable, Parameter,
  ParameterAudit, Rule, WelcomeGift, Lead, DagSelection, LeadSnapshot,
  ConsumableLevel, NodeType, NodePriceType, ServiceLine, VariableType,
  QuantityMode, MarginMode, LeadStatus,
} from '../../domain/entities'

interface DbNode {
  id: string; code: string; label: string; description: string | null;
  type: NodeType; line: ServiceLine | null; price_type: NodePriceType;
  base_price: number | null; variable_id: string | null;
  consumable_id: string | null; rule_id: string | null;
  sort_order: number; active: boolean;
}

interface DbEdge {
  id: string; source_id: string; target_id: string;
  condition: Record<string, unknown> | null; sort_order: number; active: boolean;
}

interface DbOption {
  id: string; node_id: string; code: string; label: string;
  description: string | null; price_type: NodePriceType;
  base_price: number | null; sort_order: number; active: boolean;
}

interface DbVariable {
  id: string; type: VariableType; code: string; label: string;
  performance_m2_per_hour: number | null; supply_cost_per_m2: number | null;
  visits_per_month: number | null; active: boolean;
}

interface DbConsumable {
  id: string; code: string; label: string; description: string | null;
  quantity_mode: QuantityMode; fixed_quantity: number | null;
  rule_id: string | null; unit_price: number; category: string | null;
  levels: ConsumableLevel[] | null; active: boolean;
}

interface DbParameter {
  id: string; operator_hourly_cost: number; margin_percentage: number;
  margin_mode: MarginMode; active_from: string; active: boolean;
}

interface DbAudit {
  id: string; parameter_id: string; user_id: string; action: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null; created_at: string;
}

interface DbRule {
  id: string; code: string; label: string; description: string | null;
  type: string; expression: Record<string, unknown>; active: boolean;
}

interface DbWelcomeGift {
  id: string; description: string; active: boolean;
}

interface DbLead {
  id: string; number: string; status: LeadStatus; name: string;
  email: string; phone: string; organization_id: string | null;
  user_id: string | null; total_monthly: number | null;
  total_per_visit: number | null;
  parameters_snapshot: Record<string, unknown> | null;
  dag_version: string | null; gift_included: boolean;
  gift_description: string | null; main_line: ServiceLine | null;
  notes: string | null; created_at: string; updated_at: string;
}

interface DbSelection {
  node_id: string; option_id: string | null;
  value: Record<string, unknown> | null;
}

interface DbSnapshot {
  detail: Record<string, unknown>; parameters: Record<string, unknown>;
  dag: Record<string, unknown>;
}

export function mapDbNodeToDomain(data: DbNode): DagNode {
  return {
    id: data.id, code: data.code, label: data.label,
    description: data.description, type: data.type, line: data.line,
    priceType: data.price_type, basePrice: data.base_price,
    variableId: data.variable_id, consumableId: data.consumable_id,
    ruleId: data.rule_id, order: data.sort_order, active: data.active,
  }
}

export function mapDbEdgeToDomain(data: DbEdge): DagEdge {
  return {
    id: data.id, sourceId: data.source_id, targetId: data.target_id,
    condition: data.condition, order: data.sort_order, active: data.active,
  }
}

export function mapDbOptionToDomain(data: DbOption): DagOption {
  return {
    id: data.id, nodeId: data.node_id, code: data.code, label: data.label,
    description: data.description, priceType: data.price_type,
    basePrice: data.base_price, order: data.sort_order, active: data.active,
  }
}

export function mapDbVariableToDomain(data: DbVariable): Variable {
  return {
    id: data.id, type: data.type, code: data.code, label: data.label,
    performanceM2PerHour: data.performance_m2_per_hour,
    supplyCostPerM2: data.supply_cost_per_m2,
    visitsPerMonth: data.visits_per_month, active: data.active,
  }
}

export function mapDbConsumableToDomain(data: DbConsumable): Consumable {
  return {
    id: data.id, code: data.code, label: data.label,
    description: data.description, quantityMode: data.quantity_mode,
    fixedQuantity: data.fixed_quantity, ruleId: data.rule_id,
    unitPrice: data.unit_price, category: data.category,
    levels: data.levels, active: data.active,
  }
}

export function mapDbParameterToDomain(data: DbParameter): Parameter {
  return {
    id: data.id, operatorHourlyCost: data.operator_hourly_cost,
    marginPercentage: data.margin_percentage, marginMode: data.margin_mode,
    activeFrom: new Date(data.active_from), active: data.active,
  }
}

export function mapDbAuditToDomain(data: DbAudit): ParameterAudit {
  return {
    id: data.id, parameterId: data.parameter_id, userId: data.user_id,
    action: data.action, previousValue: data.previous_value,
    newValue: data.new_value, createdAt: new Date(data.created_at),
  }
}

export function mapDbRuleToDomain(data: DbRule): Rule {
  return {
    id: data.id, code: data.code, label: data.label,
    description: data.description, type: data.type,
    expression: data.expression, active: data.active,
  }
}

export function mapDbWelcomeGiftToDomain(data: DbWelcomeGift): WelcomeGift {
  return { id: data.id, description: data.description, active: data.active }
}

export function mapDbLeadToDomain(data: DbLead): Lead {
  return {
    id: data.id, number: data.number, status: data.status,
    name: data.name, email: data.email, phone: data.phone,
    organizationId: data.organization_id, userId: data.user_id,
    totalMonthly: data.total_monthly, totalPerVisit: data.total_per_visit,
    parametersSnapshot: data.parameters_snapshot, dagVersion: data.dag_version,
    giftIncluded: data.gift_included, giftDescription: data.gift_description,
    mainLine: data.main_line, notes: data.notes,
    createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at),
  }
}

export function mapDbSelectionToDomain(data: DbSelection): DagSelection {
  return { nodeId: data.node_id, optionId: data.option_id, value: data.value }
}

export function mapDbSnapshotToDomain(data: DbSnapshot): LeadSnapshot {
  return { detail: data.detail, parameters: data.parameters, dag: data.dag }
}
