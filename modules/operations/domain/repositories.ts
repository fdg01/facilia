// modules/operations/domain/repositories.ts
import type {
  Contract, OperationalPlan, ScheduledService, WorkOrder, Assignment,
  Execution, Checklist, ChecklistItem, Evidence, Incident, Holiday,
  PlanActivity, WorkOrderStatus, IncidentSeverity,
} from './entities'

export interface ContractRepository {
  create(input: {
    leadId: string
    organizationId: string
    number: string
    signedDate: Date
    startDate: Date
    endDate: Date | null
    leadSnapshot: Record<string, unknown>
  }): Promise<Contract>
  findById(id: string): Promise<Contract | null>
  list(filters: {
    organizationId?: string
    status?: string
    page: number
    pageSize: number
  }): Promise<{ data: Contract[]; total: number }>
  updateStatus(id: string, status: string): Promise<Contract>
  getNextNumber(): Promise<string>
  getNextNumberSeq(): Promise<number>
}

export interface LeadSnapshotRepository {
  findByLeadId(leadId: string): Promise<Record<string, unknown> | null>
  findLeadByIdAndOrganization(leadId: string, organizationId: string): Promise<{
    id: string
    status: string
    organizationId: string | null
    snapshot: Record<string, unknown> | null
  } | null>
}

export interface OperationalPlanRepository {
  create(input: {
    contractId: string
    organizationId: string
    activities: PlanActivity[]
  }): Promise<OperationalPlan>
  findById(id: string): Promise<OperationalPlan | null>
  updateActivities(id: string, activities: PlanActivity[]): Promise<OperationalPlan>
  updateStatus(id: string, status: string): Promise<OperationalPlan>
  listByContract(contractId: string): Promise<OperationalPlan[]>
}

export interface ScheduledServiceRepository {
  createMany(services: Array<{
    operationalPlanId: string
    organizationId: string
    activity: string
    location: string | null
    frequency: string
    cronRule: string | null
    scheduledDate: Date
    estimatedDurationMin: number
  }>): Promise<number>
  findByPlanAndDateRange(planId: string, fromDate: Date, toDate: Date): Promise<ScheduledService[]>
  findById(id: string): Promise<ScheduledService | null>
  updateStatus(id: string, status: string): Promise<void>
}

export interface WorkOrderRepository {
  create(input: {
    scheduledServiceId: string | null
    operationalPlanId: string | null
    organizationId: string
    number: string
    title: string
    description: string | null
    location: string
    scheduledDate: Date
    estimatedDurationMin: number
  }): Promise<WorkOrder>
  findById(id: string): Promise<WorkOrder | null>
  list(filters: {
    organizationId?: string
    status?: WorkOrderStatus
    employeeId?: string
    fromDate?: Date
    toDate?: Date
    page: number
    pageSize: number
  }): Promise<{ data: WorkOrder[]; total: number }>
  updateStatus(id: string, status: WorkOrderStatus): Promise<WorkOrder>
  updateTiming(id: string, updates: {
    startedAt?: Date | null
    finishedAt?: Date | null
    actualDurationMin?: number | null
    slaMet?: boolean | null
  }): Promise<WorkOrder>
  getNextNumber(): Promise<string>
}

export interface AssignmentRepository {
  create(input: {
    workOrderId: string
    employeeId: string
    organizationId: string
    crewRole: string
  }): Promise<Assignment>
  findById(id: string): Promise<Assignment | null>
  findByWorkOrder(workOrderId: string): Promise<Assignment[]>
  findByEmployee(employeeId: string): Promise<Assignment[]>
  updateStatus(id: string, status: string, updates?: {
    acceptedAt?: Date
    rejectedAt?: Date
    rejectionReason?: string
  }): Promise<Assignment>
}

export interface ExecutionRepository {
  create(input: {
    workOrderId: string
    organizationId: string
    employeeId: string
  }): Promise<Execution>
  findByWorkOrder(workOrderId: string): Promise<Execution | null>
  findById(id: string): Promise<Execution | null>
  update(id: string, updates: {
    observations?: string | null
    progress?: number
    completedAt?: Date | null
  }): Promise<Execution>
}

export interface ChecklistRepository {
  create(input: {
    workOrderId: string
    organizationId: string
    title: string
    items: Array<{ description: string; required: boolean }>
  }): Promise<Checklist>
  findByWorkOrder(workOrderId: string): Promise<Checklist[]>
  findItems(checklistId: string): Promise<ChecklistItem[]>
  updateItemChecked(itemId: string, checked: boolean, checkedAt: Date | null): Promise<ChecklistItem>
  listItemsByWorkOrder(workOrderId: string): Promise<ChecklistItem[]>
}

export interface EvidenceRepository {
  create(input: {
    executionId: string
    workOrderId: string
    organizationId: string
    type: string
    storagePath: string
    fileName: string
    contentType: string
  }): Promise<Evidence>
  findById(id: string): Promise<Evidence | null>
  findByWorkOrder(workOrderId: string): Promise<Evidence[]>
  updateMetadata(id: string, sizeBytes: number, metadata: Record<string, unknown>): Promise<Evidence>
}

export interface IncidentRepository {
  create(input: {
    workOrderId: string
    executionId: string | null
    organizationId: string
    reportedBy: string
    severity: IncidentSeverity
    title: string
    description: string
  }): Promise<Incident>
  findByWorkOrder(workOrderId: string): Promise<Incident[]>
  list(filters: { organizationId?: string; status?: string; page: number; pageSize: number }): Promise<{ data: Incident[]; total: number }>
  updateStatus(id: string, status: string, resolution?: string): Promise<Incident>
}

export interface HolidayRepository {
  create(input: {
    date: Date
    description: string
    scope: string
    organizationId: string | null
  }): Promise<Holiday>
  list(filters: { fromDate?: Date; toDate?: Date; organizationId?: string }): Promise<Holiday[]>
  findAll(): Promise<Holiday[]>
}

export interface StorageRepository {
  createSignedUploadUrl(storagePath: string, contentType: string, expiresInSec: number): Promise<string>
  uploadBuffer(storagePath: string, buffer: Buffer, contentType: string): Promise<void>
  createSignedDownloadUrl(storagePath: string, expiresInSec: number): Promise<string>
}

export interface IndicatorsRepository {
  calculate(filters: {
    organizationId?: string
    employeeId?: string
    fromDate?: Date
    toDate?: Date
  }): Promise<{
    avgActualDurationMin: number
    avgEstimatedDurationMin: number
    slaCompliancePct: number
    completedOrders: number
    ordersWithIncidents: number
    performanceByEmployee: Array<{
      employeeId: string
      employeeName: string
      completedOrders: number
      avgDurationMin: number
      slaCompliancePct: number
    }>
  }>
}
