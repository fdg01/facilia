// src/app/api/portal/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabasePortalLeadRepository,
} from '@modules/portal/infrastructure'
import {
  SupabaseDagRepository,
  SupabaseVariableRepository,
  SupabaseConsumableRepository,
  SupabaseParameterRepository,
  SupabaseRuleRepository,
  SupabaseWelcomeGiftRepository,
  SupabaseLeadRepository,
} from '@modules/quoter/infrastructure'
import {
  createListMyLeadsUseCase,
  createCreateLeadPortalUseCase,
} from '@modules/portal/application/use-cases'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['draft', 'sent', 'accepted', 'lost', 'confirmed']).optional(),
})

const CreateLeadSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  selections: z.array(z.object({
    nodeId: z.string().uuid(),
    optionId: z.string().uuid().nullable().optional(),
    value: z.record(z.string(), z.unknown()).nullable().optional(),
  })).min(1),
  mainLine: z.enum(['clean', 'care', 'continuity']),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const leadRepo = new SupabasePortalLeadRepository(supabase)
    const listMyLeads = createListMyLeadsUseCase(leadRepo)

    const url = new URL(request.url)
    const parsed = ListQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const result = await listMyLeads(session.organizationId, parsed.data)
    return NextResponse.json({
      data: result.data,
      meta: { page: parsed.data.page, pageSize: parsed.data.pageSize, total: result.total },
    })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NO_SESSION') || error.message.includes('FORBIDDEN'))) {
      const status = error.message.includes('NO_SESSION') ? 401 : 403
      return NextResponse.json(
        { error: { code: error.message.includes('NO_SESSION') ? 'NO_SESSION' : 'FORBIDDEN', message: error.message } },
        { status },
      )
    }
    console.error('Portal list leads error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 leads per hour per user + IP
    const ip = getClientIp(request)
    const session = await requireClient()
    const rateLimit = checkRateLimit(`portal-leads:${session.userId}:${ip}`, RATE_LIMITS.leads)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intente más tarde.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      )
    }

    const body = await request.json()
    const parsed = CreateLeadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    // Use authenticated client for RLS-enforced insert
    const supabase = await createServerSupabaseClient()
    const serviceClient = createServiceRoleSupabaseClient()

    const createLead = createCreateLeadPortalUseCase(
      new SupabaseDagRepository(serviceClient),
      new SupabaseVariableRepository(serviceClient),
      new SupabaseConsumableRepository(serviceClient),
      new SupabaseParameterRepository(serviceClient),
      new SupabaseRuleRepository(serviceClient),
      new SupabaseWelcomeGiftRepository(serviceClient),
      new SupabaseLeadRepository(supabase), // Use authenticated client for RLS
      serviceClient,
    )

    const result = await createLead({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      selections: parsed.data.selections,
      mainLine: parsed.data.mainLine,
      userId: session.userId,
      organizationId: session.organizationId,
    })

    return NextResponse.json({ data: result.lead }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NO_SESSION') || error.message.includes('FORBIDDEN'))) {
      const status = error.message.includes('NO_SESSION') ? 401 : 403
      return NextResponse.json(
        { error: { code: error.message.includes('NO_SESSION') ? 'NO_SESSION' : 'FORBIDDEN', message: error.message } },
        { status },
      )
    }
    if (error instanceof Error && error.message === 'No active parameters found') {
      return NextResponse.json(
        { error: { code: 'NO_PARAMETERS', message: 'No hay parámetros de pricing activos' } },
        { status: 500 },
      )
    }
    console.error('Portal create lead error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
