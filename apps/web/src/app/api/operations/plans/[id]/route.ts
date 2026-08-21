// src/app/api/operations/plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseOperationalPlanRepository } from '@modules/operations/infrastructure'
import { handleApiError } from '@/lib/api-helpers'

const PatchPlanSchema = z.object({
  activities: z.array(z.object({
    activity: z.string(),
    description: z.string(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'special_rule']),
    cronRule: z.string().nullable().default(null),
    location: z.string(),
    estimatedDurationMin: z.number().int().positive(),
  })).optional(),
  status: z.enum(['draft', 'active', 'suspended', 'closed']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseOperationalPlanRepository(supabase)
    const plan = await repo.findById(id)
    if (!plan) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan no encontrado' } }, { status: 404 })
    }
    return NextResponse.json({ data: plan })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = PatchPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseOperationalPlanRepository(supabase)

    if (parsed.data.activities) {
      await repo.updateActivities(id, parsed.data.activities)
    }
    if (parsed.data.status) {
      await repo.updateStatus(id, parsed.data.status)
    }

    const updated = await repo.findById(id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
