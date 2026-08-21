// src/app/api/operations/holidays/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseHolidayRepository } from '@modules/operations/infrastructure'
import { createManageHolidaysUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const CreateHolidaySchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  scope: z.enum(['national', 'departmental', 'organization']),
  organizationId: z.string().uuid().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const url = new URL(request.url)
    const fromDate = url.searchParams.get('fromDate') ?? undefined
    const toDate = url.searchParams.get('toDate') ?? undefined
    const organizationId = url.searchParams.get('organizationId') ?? undefined

    const manageHolidays = createManageHolidaysUseCase(new SupabaseHolidayRepository(supabase))
    const holidays = await manageHolidays.list({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      organizationId,
    })

    return NextResponse.json({ data: holidays })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const parsed = CreateHolidaySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const manageHolidays = createManageHolidaysUseCase(new SupabaseHolidayRepository(supabase))
    const holiday = await manageHolidays.create({
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      scope: parsed.data.scope,
      organizationId: parsed.data.organizationId ?? session.organizationId ?? null,
    })

    return NextResponse.json({ data: holiday }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
