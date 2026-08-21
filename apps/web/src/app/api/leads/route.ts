// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseDagRepository,
  SupabaseVariableRepository,
  SupabaseConsumableRepository,
  SupabaseParameterRepository,
  SupabaseRuleRepository,
  SupabaseWelcomeGiftRepository,
  SupabaseLeadRepository,
  createServiceRoleSupabaseClient,
} from '@modules/quoter/infrastructure'
import { createConfirmLeadUseCase, createListLeadsUseCase } from '@modules/quoter/application/use-cases'
import { getSession, requireRole } from '@/lib/session'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const LeadSchema = z.object({
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 leads per hour per IP
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit(`leads:${ip}`, RATE_LIMITS.leads)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intente más tarde.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      )
    }

    const body = await request.json()
    const parsed = LeadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const session = await getSession()

    const confirmLead = createConfirmLeadUseCase(
      new SupabaseDagRepository(serviceClient),
      new SupabaseVariableRepository(serviceClient),
      new SupabaseConsumableRepository(serviceClient),
      new SupabaseParameterRepository(serviceClient),
      new SupabaseRuleRepository(serviceClient),
      new SupabaseWelcomeGiftRepository(serviceClient),
      new SupabaseLeadRepository(serviceClient),
      serviceClient,
    )

    const result = await confirmLead({
      ...parsed.data,
      userId: session?.userId ?? null,
    })

    return NextResponse.json({
      data: {
        number: result.lead.number,
        totalMonthly: result.lead.totalMonthly,
        totalPerVisit: result.lead.totalPerVisit,
        pdfUrl: result.pdfUrl,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Confirm lead error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole('admin')

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const line = url.searchParams.get('line')
    const filters = {
      status: status as 'draft' | 'sent' | 'accepted' | 'lost' | 'confirmed' | undefined,
      line: line as 'clean' | 'care' | 'continuity' | undefined,
      organizationId: url.searchParams.get('organizationId') ?? undefined,
      page: parseInt(url.searchParams.get('page') ?? '1'),
      pageSize: parseInt(url.searchParams.get('pageSize') ?? '20'),
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const leadRepo = new SupabaseLeadRepository(serviceClient)
    const listLeads = createListLeadsUseCase(leadRepo)
    const result = await listLeads(filters)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json(
        { error: { code: error.message, message: 'No autorizado' } },
        { status: 403 },
      )
    }
    console.error('List leads error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
