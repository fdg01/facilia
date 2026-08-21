// modules/portal/application/use-cases/portal-complete-use-cases.ts
import type {
  RequestRepository, RequestEventRepository, CommunicationRepository,
  EvidenceVisibilityRepository, ServiceEventRepository,
  ServiceReader, CalendarReader, EvidenceReader, ContractReader, PaymentReader,
  ExtendedDashboardRepository,
} from '../../domain/portal-repositories'
import type {
  ClientRequest, Communication, ServiceSummary, CalendarVisit,
  EvidenceItem, ContractSummary, PaymentSummary, ServiceEvent,
  ExtendedDashboardData,
} from '../../domain/portal-entities'
import { validateNewRequest } from '../../domain/portal-services'

export function createCreateRequestUseCase(
  requestRepo: RequestRepository,
  eventRepo: RequestEventRepository,
) {
  return async function createRequest(
    input: { type: string; subject: string; description: string; priority?: string },
    user: { id: string; organizationId: string },
  ): Promise<ClientRequest> {
    const validation = validateNewRequest(input)
    if (!validation.valid) {
      throw new Error(validation.error ?? 'VALIDATION_ERROR')
    }

    const request = await requestRepo.create({
      organizationId: user.organizationId,
      createdBy: user.id,
      type: input.type,
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? 'normal',
    })

    await eventRepo.create({
      requestId: request.id,
      type: 'created',
      author: user.id,
      content: `Solicitud ${input.type} creada: ${input.subject}`,
      previousStatus: null,
      newStatus: 'open',
    })

    return request
  }
}

export function createListRequestsUseCase(requestRepo: RequestRepository) {
  return async function listRequests(organizationId: string): Promise<ClientRequest[]> {
    return requestRepo.findByOrganization(organizationId)
  }
}

export function createGetRequestUseCase(requestRepo: RequestRepository, eventRepo: RequestEventRepository) {
  return async function getRequest(
    id: string,
    organizationId: string,
  ): Promise<{ request: ClientRequest; events: Awaited<ReturnType<typeof eventRepo.findByRequest>> } | null> {
    const request = await requestRepo.findByIdAndOrganization(id, organizationId)
    if (!request) return null
    const events = await eventRepo.findByRequest(id)
    return { request, events }
  }
}

export function createListCommunicationsUseCase(commRepo: CommunicationRepository) {
  return async function listCommunications(
    organizationId: string,
  ): Promise<{ data: Communication[]; unread: number }> {
    return commRepo.findByOrganization(organizationId)
  }
}

export function createReadCommunicationUseCase(commRepo: CommunicationRepository) {
  return async function readCommunication(
    id: string,
    organizationId: string,
  ): Promise<Communication | null> {
    const comm = await commRepo.findByIdAndOrganization(id, organizationId)
    if (!comm) return null
    if (!comm.read) {
      await commRepo.markAsRead(id)
    }
    return { ...comm, read: true, readAt: new Date() }
  }
}

export function createListServicesUseCase(serviceReader: ServiceReader) {
  return async function listServices(organizationId: string): Promise<ServiceSummary[]> {
    return serviceReader.listByOrganization(organizationId)
  }
}

export function createGetServiceUseCase(
  serviceReader: ServiceReader,
  eventRepo: ServiceEventRepository,
) {
  return async function getService(
    id: string,
    organizationId: string,
  ): Promise<{ service: ServiceSummary; events: ServiceEvent[] } | null> {
    const service = await serviceReader.findByIdAndOrganization(id, organizationId)
    if (!service) return null
    const events = await eventRepo.findByOrganization(organizationId)
    const serviceEvents = events.filter(
      (e) => e.workOrderId === id || e.contractId === service.contractId,
    )
    return { service, events: serviceEvents }
  }
}

export function createListCalendarUseCase(calendarReader: CalendarReader) {
  return async function listCalendar(
    organizationId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarVisit[]> {
    return calendarReader.listByOrganization(organizationId, from, to)
  }
}

export function createListEvidenceUseCase(evidenceReader: EvidenceReader) {
  return async function listEvidence(organizationId: string): Promise<EvidenceItem[]> {
    return evidenceReader.listAuthorizedByOrganization(organizationId)
  }
}

export function createGetEvidenceUseCase(evidenceReader: EvidenceReader) {
  return async function getEvidence(
    id: string,
    organizationId: string,
  ): Promise<EvidenceItem | null> {
    return evidenceReader.findAuthorizedByIdAndOrganization(id, organizationId)
  }
}

export function createListContractsUseCase(contractReader: ContractReader) {
  return async function listContracts(organizationId: string): Promise<ContractSummary[]> {
    return contractReader.listByOrganization(organizationId)
  }
}

export function createGetContractUseCase(contractReader: ContractReader) {
  return async function getContract(
    id: string,
    organizationId: string,
  ): Promise<ContractSummary | null> {
    return contractReader.findByIdAndOrganization(id, organizationId)
  }
}

export function createListPaymentsUseCase(paymentReader: PaymentReader) {
  return async function listPayments(organizationId: string): Promise<PaymentSummary[]> {
    return paymentReader.listByOrganization(organizationId)
  }
}

export function createGetPaymentUseCase(paymentReader: PaymentReader) {
  return async function getPayment(
    id: string,
    organizationId: string,
  ): Promise<PaymentSummary | null> {
    return paymentReader.findByIdAndOrganization(id, organizationId)
  }
}

export function createGetExtendedDashboardUseCase(dashboardRepo: ExtendedDashboardRepository) {
  return async function getExtendedDashboard(organizationId: string): Promise<ExtendedDashboardData> {
    return dashboardRepo.getExtendedSummary(organizationId)
  }
}
