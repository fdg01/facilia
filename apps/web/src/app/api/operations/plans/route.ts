// src/app/api/operations/plans/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseOperationalPlanRepository } from '@modules/operations/infrastructure'
import { createCreateOperationalPlanUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const ActivitySchema = z.object({
  activity: z.string().min(1),
  description: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'special_rule']),
  cronRule: z.string().nullable().default(null),
  location: z.string().min(1),
  estimatedDurationMin: z.number().int().positive(),
})

const CreatePlanSchema = z.object({
  contractId: z.string().uuid(),
  activities: z.array(ActivitySchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const parsed = CreatePlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const planRepo = new SupabaseOperationalPlanRepository(serviceClient)
    const createPlan = createCreateOperationalPlanUseCase(planRepo)

    const plan = await createPlan({
      contractId: parsed.data.contractId,
      organizationId: session.organizationId ?? '',
      activities: parsed.data.activities,
    })

    return NextResponse.json({ data: plan }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
