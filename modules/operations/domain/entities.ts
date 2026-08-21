// modules/operations/domain/entities.ts
export type ServiceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'special_rule'
export type WorkOrderStatus = 'created' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'validated' | 'with_incidents' | 'cancelled'
export type EvidenceType = 'photo' | 'video' | 'customer_signature' | 'document'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ContractStatus = 'active' | 'suspended' | 'ended'
export type PlanStatus = 'draft' | 'active' | 'suspended' | 'closed'
export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'reassigned'
export type IncidentStatus = 'open' | 'in_review' | 'resolved'
export type ScheduledServiceStatus = 'pending' | 'generated' | 'skipped'

export interface Contract {
  readonly id: string
  readonly leadId: string
  readonly organizationId: string
  readonly number: string
  readonly signedDate: Date
  readonly startDate: Date
  readonly endDate: Date | null
  readonly status: ContractStatus
  readonly leadSnapshot: Readonly<Record<string, unknown>>
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface PlanActivity {
  readonly activity: string
  readonly description: string
  readonly frequency: ServiceFrequency
  readonly cronRule: string | null
  readonly location: string
  readonly estimatedDurationMin: number
}

export interface OperationalPlan {
  readonly id: string
  readonly contractId: string
  readonly organizationId: string
  readonly version: number
  readonly status: PlanStatus
  readonly activities: ReadonlyArray<PlanActivity>
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface ScheduledService {
  readonly id: string
  readonly operationalPlanId: string
  readonly organizationId: string
  readonly activity: string
  readonly location: string | null
  readonly frequency: ServiceFrequency
  readonly cronRule: string | null
  readonly scheduledDate: Date
  readonly timeWindow: { start: Date; end: Date } | null
  readonly estimatedDurationMin: number
  readonly status: ScheduledServiceStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Holiday {
  readonly id: string
  readonly date: Date
  readonly description: string
  readonly scope: 'national' | 'departmental' | 'organization'
  readonly organizationId: string | null
  readonly createdAt: Date
}

export interface WorkOrder {
  readonly id: string
  readonly scheduledServiceId: string | null
  readonly operationalPlanId: string | null
  readonly organizationId: string
  readonly number: string
  readonly title: string
  readonly description: string | null
  readonly location: string
  readonly scheduledDate: Date
  readonly timeWindow: { start: Date; end: Date } | null
  readonly estimatedDurationMin: number
  readonly status: WorkOrderStatus
  readonly startedAt: Date | null
  readonly finishedAt: Date | null
  readonly actualDurationMin: number | null
  readonly slaMet: boolean | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Assignment {
  readonly id: string
  readonly workOrderId: string
  readonly employeeId: string
  readonly organizationId: string
  readonly crewRole: string
  readonly status: AssignmentStatus
  readonly acceptedAt: Date | null
  readonly rejectedAt: Date | null
  readonly rejectionReason: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Execution {
  readonly id: string
  readonly workOrderId: string
  readonly organizationId: string
  readonly employeeId: string
  readonly observations: string | null
  readonly progress: number
  readonly startedAt: Date | null
  readonly completedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface Checklist {
  readonly id: string
  readonly workOrderId: string
  readonly organizationId: string
  readonly title: string
  readonly createdAt: Date
}

export interface ChecklistItem {
  readonly id: string
  readonly checklistId: string
  readonly description: string
  readonly required: boolean
  readonly checked: boolean
  readonly checkedAt: Date | null
  readonly sortOrder: number
}

export interface Evidence {
  readonly id: string
  readonly executionId: string
  readonly workOrderId: string
  readonly organizationId: string
  readonly type: EvidenceType
  readonly storagePath: string
  readonly fileName: string
  readonly contentType: string
  readonly sizeBytes: number | null
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
}

export interface Incident {
  readonly id: string
  readonly workOrderId: string
  readonly executionId: string | null
  readonly organizationId: string
  readonly reportedBy: string
  readonly severity: IncidentSeverity
  readonly title: string
  readonly description: string
  readonly status: IncidentStatus
  readonly resolution: string | null
  readonly resolvedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date
}
