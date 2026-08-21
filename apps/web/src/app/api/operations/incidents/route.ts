// src/app/api/operations/incidents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseIncidentRepository, SupabaseWorkOrderRepository,
  SupabaseAssignmentRepository, SupabaseExecutionRepository,
} from '@modules/operations/infrastructure'
import { createRegisterIncidentUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const IncidentSchema = z.object({
  workOrderId: z.string().uuid(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1),
  description: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    await requireEmployee()
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseIncidentRepository(supabase)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const status = url.searchParams.get('status') ?? undefined
    const organizationId = url.searchParams.get('organizationId') ?? undefined

    const result = await repo.list({ organizationId, status, page, pageSize })
    return NextResponse.json({ data: result.data, meta: { page, pageSize, total: result.total } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireEmployee()
    const body = await request.json()
    const parsed = IncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const registerIncident = createRegisterIncidentUseCase(
      new SupabaseIncidentRepository(serviceClient),
      new SupabaseWorkOrderRepository(serviceClient),
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseExecutionRepository(serviceClient),
    )

    const incident = await registerIncident({
      workOrderId: parsed.data.workOrderId,
      organizationId: session.organizationId ?? '',
      employeeId: session.userId,
      severity: parsed.data.severity,
      title: parsed.data.title,
      description: parsed.data.description,
    })

    return NextResponse.json({ data: incident }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
