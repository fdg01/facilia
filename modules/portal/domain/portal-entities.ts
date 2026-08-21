// modules/portal/domain/portal-entities.ts
export type RequestType = 'extra_service' | 'inquiry' | 'complaint'
export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type CommunicationType = 'info' | 'visit_scheduled' | 'service_completed' | 'incident' | 'payment' | 'custom'
export type ServiceEventType = 'visit_completed' | 'product_delivered' | 'incident_reported' | 'service_started' | 'service_paused' | 'service_resumed' | 'evidence_added'

export interface ClientRequest {
  readonly id: string
  readonly organizationId: string
  readonly createdBy: string
  readonly type: RequestType
  readonly subject: string
  readonly description: string
  readonly status: RequestStatus
  readonly priority: RequestPriority
  readonly assignedTo: string | null
  readonly resolution: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly resolvedAt: Date | null
}

export interface RequestEvent {
  readonly id: string
  readonly requestId: string
  readonly type: 'created' | 'comment' | 'status_change' | 'assigned' | 'resolved'
  readonly author: string | null
  readonly content: string | null
  readonly previousStatus: string | null
  readonly newStatus: string | null
  readonly createdAt: Date
}

export interface Communication {
  readonly id: string
  readonly organizationId: string
  readonly sentBy: string | null
  readonly subject: string
  readonly body: string
  readonly type: CommunicationType
  readonly read: boolean
  readonly createdAt: Date
  readonly readAt: Date | null
}

export interface EvidenceVisibility {
  readonly id: string
  readonly evidenceId: string
  readonly organizationId: string
  readonly authorizedBy: string
  readonly authorizedAt: Date
}

export interface ServiceEvent {
  readonly id: string
  readonly organizationId: string
  readonly workOrderId: string | null
  readonly contractId: string | null
  readonly type: ServiceEventType
  readonly description: string
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: Date
}

// Read-only views from operations module
export interface ServiceSummary {
  readonly id: string
  readonly contractId: string
  readonly line: 'clean' | 'care' | 'continuity' | null
  readonly description: string
  readonly frequency: string | null
  readonly scope: string | null
  readonly schedule: string | null
  readonly status: 'active' | 'paused' | 'ended'
  readonly nextVisit: string | null
}

export interface CalendarVisit {
  readonly id: string
  readonly date: string
  readonly timeWindow: string | null
  readonly status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  readonly serviceDescription: string
  readonly employeeName: string | null
}

export interface EvidenceItem {
  readonly id: string
  readonly type: 'photo' | 'video' | 'customer_signature' | 'document'
  readonly description: string
  readonly workOrderId: string
  readonly date: string
  readonly signedUrl: string
}

export interface ContractSummary {
  readonly id: string
  readonly number: string
  readonly status: 'active' | 'suspended' | 'ended'
  readonly startDate: string
  readonly endDate: string | null
  readonly scope: string | null
}

export interface PaymentSummary {
  readonly id: string
  readonly date: string
  readonly concept: string
  readonly amount: number
  readonly status: 'paid' | 'pending' | 'overdue'
}

export interface ExtendedDashboardData {
  readonly totalLeads: number
  readonly recentLeads: ReadonlyArray<{ id: string; number: string; status: string; createdAt: Date }>
  readonly pendingLeads: number
  readonly activeServices: number
  readonly nextVisit: string | null
  readonly openRequests: number
  readonly unreadCommunications: number
}
