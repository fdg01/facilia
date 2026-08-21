// modules/operations/application/use-cases/schedule-visits.ts
import type {
  OperationalPlanRepository, ScheduledServiceRepository, HolidayRepository,
} from '../../domain/repositories'
import { generateCalendar } from '../../domain/calendar'

interface ScheduleVisitsInput {
  readonly planId: string
  readonly fromDate: Date
  readonly toDate: Date
}

export function createScheduleVisitsUseCase(
  planRepo: OperationalPlanRepository,
  serviceRepo: ScheduledServiceRepository,
  holidayRepo: HolidayRepository,
) {
  return async function scheduleVisits(input: ScheduleVisitsInput): Promise<{ servicesGenerated: number }> {
    const plan = await planRepo.findById(input.planId)
    if (!plan) throw new Error('Plan not found')
    if (plan.status !== 'active') throw new Error('Plan must be active to schedule')

    const holidays = await holidayRepo.findAll()
    let totalGenerated = 0

    for (const activity of plan.activities) {
      const services = generateCalendar(
        activity,
        input.fromDate,
        input.toDate,
        holidays,
        plan.organizationId,
      )

      if (services.length > 0) {
        const created = await serviceRepo.createMany(
          services.map((s) => ({
            operationalPlanId: plan.id,
            organizationId: plan.organizationId,
            activity: s.activity,
            location: s.location,
            frequency: s.frequency,
            cronRule: s.cronRule,
            scheduledDate: s.scheduledDate,
            estimatedDurationMin: s.estimatedDurationMin,
          })),
        )
        totalGenerated += created
      }
    }

    return { servicesGenerated: totalGenerated }
  }
}
