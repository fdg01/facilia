// modules/portal/domain/portal-repositories.ts
import type {
  ClientRequest, RequestEvent, Communication, EvidenceVisibility, ServiceEvent,
  ServiceSummary, CalendarVisit, EvidenceItem, ContractSummary, PaymentSummary,
  ExtendedDashboardData,
} from './portal-entities'

export interface RequestRepository {
  findByOrganization(organizationId: string): Promise<ClientRequest[]>
  findByIdAndOrganization(id: string, organizationId: string): Promise<ClientRequest | null>
  create(input: {
    organizationId: string
    createdBy: string
    type: string
    subject: string
    description: string
    priority: string
  }): Promise<ClientRequest>
}

export interface RequestEventRepository {
  findByRequest(requestId: string): Promise<RequestEvent[]>
  create(input: {
    requestId: string
    type: 'created' | 'comment' | 'status_change' | 'assigned' | 'resolved'
    author: string | null
    content: string | null
    previousStatus: string | null
    newStatus: string | null
  }): Promise<RequestEvent>
}

export interface CommunicationRepository {
  findByOrganization(organizationId: string): Promise<{ data: Communication[]; unread: number }>
  findByIdAndOrganization(id: string, organizationId: string): Promise<Communication | null>
  markAsRead(id: string): Promise<void>
}

export interface EvidenceVisibilityRepository {
  findByOrganization(organizationId: string): Promise<EvidenceVisibility[]>
}

export interface ServiceEventRepository {
  findByOrganization(organizationId: string, from?: Date, to?: Date): Promise<ServiceEvent[]>
  findByWorkOrder(workOrderId: string): Promise<ServiceEvent[]>
}

// Cross-module readers (read-only from operations module)
export interface ServiceReader {
  listByOrganization(organizationId: string): Promise<ServiceSummary[]>
  findByIdAndOrganization(id: string, organizationId: string): Promise<ServiceSummary | null>
}

export interface CalendarReader {
  listByOrganization(organizationId: string, from: Date, to: Date): Promise<CalendarVisit[]>
}

export interface EvidenceReader {
  listAuthorizedByOrganization(organizationId: string): Promise<EvidenceItem[]>
  findAuthorizedByIdAndOrganization(id: string, organizationId: string): Promise<EvidenceItem | null>
}

export interface ContractReader {
  listByOrganization(organizationId: string): Promise<ContractSummary[]>
  findByIdAndOrganization(id: string, organizationId: string): Promise<ContractSummary | null>
}

export interface PaymentReader {
  listByOrganization(organizationId: string): Promise<PaymentSummary[]>
  findByIdAndOrganization(id: string, organizationId: string): Promise<PaymentSummary | null>
}

export interface ExtendedDashboardRepository {
  getExtendedSummary(organizationId: string): Promise<ExtendedDashboardData>
}
