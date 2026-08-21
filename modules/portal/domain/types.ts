// modules/portal/domain/types.ts
export type LeadStatus = 'draft' | 'sent' | 'accepted' | 'lost' | 'confirmed'

export type ServiceLine = 'clean' | 'care' | 'continuity'

export interface LeadSummary {
  readonly id: string
  readonly number: string
  readonly status: LeadStatus
  readonly totalMonthly: number
  readonly totalPerVisit: number
  readonly mainLine: ServiceLine | null
  readonly createdAt: Date
}

export interface LeadSelection {
  readonly nodeId: string
  readonly optionId: string | null
  readonly value: Record<string, unknown> | null
}

export interface LeadSnapshot {
  readonly detail: Record<string, unknown>
  readonly parameters: Record<string, unknown>
  readonly dag: Record<string, unknown>
}

export interface LeadDetail extends LeadSummary {
  readonly organizationId: string | null
  readonly userId: string | null
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly selections: LeadSelection[]
  readonly snapshot: LeadSnapshot | null
  readonly giftIncluded: boolean
  readonly giftDescription: string | null
  readonly updatedAt: Date
}

export interface DashboardData {
  readonly totalLeads: number
  readonly recentLeads: LeadSummary[]
  readonly pendingLeads: number
}
