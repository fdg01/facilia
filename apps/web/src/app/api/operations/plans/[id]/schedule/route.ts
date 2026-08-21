// src/app/api/operations/plans/[id]/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseOperationalPlanRepository, SupabaseScheduledServiceRepository, SupabaseHolidayRepository,
} from '@modules/operations/infrastructure'
import { createScheduleVisitsUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const ScheduleSchema = z.object({
  fromDate: z.string(),
  toDate: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = ScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const scheduleVisits = createScheduleVisitsUseCase(
      new SupabaseOperationalPlanRepository(serviceClient),
      new SupabaseScheduledServiceRepository(serviceClient),
      new SupabaseHolidayRepository(serviceClient),
    )

    const result = await scheduleVisits({
      planId: id,
      fromDate: new Date(parsed.data.fromDate),
      toDate: new Date(parsed.data.toDate),
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
