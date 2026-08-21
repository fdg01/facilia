// src/app/api/operations/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createCreateAdhocOrderUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const CreateOrderSchema = z.object({
  operationalPlanId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().min(1),
  scheduledDate: z.string(),
  estimatedDurationMin: z.number().int().positive(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseWorkOrderRepository(supabase)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const status = url.searchParams.get('status') as 'created' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'validated' | 'with_incidents' | 'cancelled' | undefined
    const organizationId = url.searchParams.get('organizationId') ?? undefined
    const employeeId = url.searchParams.get('employeeId') ?? undefined

    const result = await repo.list({ organizationId, status, employeeId, page, pageSize })
    return NextResponse.json({ data: result.data, meta: { page, pageSize, total: result.total } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const parsed = CreateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const orderRepo = new SupabaseWorkOrderRepository(serviceClient)
    const createOrder = createCreateAdhocOrderUseCase(orderRepo)

    const order = await createOrder({
      operationalPlanId: parsed.data.operationalPlanId,
      organizationId: session.organizationId ?? '',
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location,
      scheduledDate: new Date(parsed.data.scheduledDate),
      estimatedDurationMin: parsed.data.estimatedDurationMin,
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
