// src/app/api/quote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SupabaseDagRepository,
  SupabaseVariableRepository,
  SupabaseConsumableRepository,
  SupabaseParameterRepository,
  SupabaseRuleRepository,
  SupabaseWelcomeGiftRepository,
} from '@modules/quoter/infrastructure'
import { createQuoteUseCase } from '@modules/quoter/application/use-cases'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const QuoteSchema = z.object({
  selections: z.array(z.object({
    nodeId: z.string().uuid(),
    optionId: z.string().uuid().nullable().optional(),
    value: z.record(z.string(), z.unknown()).nullable().optional(),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 50 quotes per hour per IP
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit(`quote:${ip}`, RATE_LIMITS.quote)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intente más tarde.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      )
    }

    const body = await request.json()
    const parsed = QuoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Selecciones inválidas', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const quote = createQuoteUseCase(
      new SupabaseDagRepository(supabase),
      new SupabaseVariableRepository(supabase),
      new SupabaseConsumableRepository(supabase),
      new SupabaseParameterRepository(supabase),
      new SupabaseRuleRepository(supabase),
      new SupabaseWelcomeGiftRepository(supabase),
    )

    const result = await quote({ selections: parsed.data.selections })
    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No active parameters found') {
      return NextResponse.json(
        { error: { code: 'NO_PARAMETERS', message: 'No hay parámetros de pricing activos' } },
        { status: 500 },
      )
    }
    console.error('Quote error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
