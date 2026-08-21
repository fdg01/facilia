// src/app/api/portal/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  SupabaseRequestRepository, SupabaseRequestEventRepository,
} from '@modules/portal/infrastructure'
import {
  createCreateRequestUseCase, createListRequestsUseCase,
} from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

const CreateRequestSchema = z.object({
  type: z.enum(['extra_service', 'inquiry', 'complaint']),
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
})

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listRequests = createListRequestsUseCase(new SupabaseRequestRepository(supabase))
    const requests = await listRequests(session.organizationId)
    return NextResponse.json({ data: requests })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireClient()
    const body = await request.json()
    const parsed = CreateRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const createRequest = createCreateRequestUseCase(
      new SupabaseRequestRepository(supabase),
      new SupabaseRequestEventRepository(supabase),
    )

    const newRequest = await createRequest(
      {
        type: parsed.data.type,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
      },
      { id: session.userId, organizationId: session.organizationId },
    )

    return NextResponse.json({ data: newRequest }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
