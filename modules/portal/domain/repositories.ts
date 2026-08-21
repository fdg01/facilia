// modules/portal/domain/repositories.ts
import type {
  LeadSummary, LeadDetail, DashboardData, LeadStatus,
} from './types'

export interface PortalLeadRepository {
  listByOrganization(
    organizationId: string,
    filters: { page: number; pageSize: number; status?: LeadStatus },
  ): Promise<{ data: LeadSummary[]; total: number }>
  findByIdAndOrganization(id: string, organizationId: string): Promise<LeadDetail | null>
}

export interface PortalDashboardRepository {
  getSummary(organizationId: string): Promise<DashboardData>
}

export interface PdfService {
  generate(lead: LeadDetail): Promise<Buffer>
}
