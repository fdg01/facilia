// modules/operations/application/use-cases/manage-holidays.ts
import type { HolidayRepository } from '../../domain/repositories'
import type { Holiday } from '../../domain/entities'

interface CreateHolidayInput {
  readonly date: Date
  readonly description: string
  readonly scope: 'national' | 'departmental' | 'organization'
  readonly organizationId: string | null
}

export function createManageHolidaysUseCase(holidayRepo: HolidayRepository) {
  return {
    async create(input: CreateHolidayInput): Promise<Holiday> {
      if (input.scope === 'organization' && !input.organizationId) {
        throw new Error('Organization holiday requires organizationId')
      }
      if (input.scope !== 'organization' && input.organizationId) {
        throw new Error('National/departmental holidays must not have organizationId')
      }
      return holidayRepo.create(input)
    },

    async list(filters: { fromDate?: Date; toDate?: Date; organizationId?: string }): Promise<Holiday[]> {
      return holidayRepo.list(filters)
    },
  }
}
