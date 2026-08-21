// src/app/api/operations/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/operations-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const repo = new SupabaseWorkOrderRepository(supabase)
    const order = await repo.findById(id)
    if (!order) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Orden no encontrada' } }, { status: 404 })
    }
    return NextResponse.json({ data: order })
  } catch (error) {
    return handleApiError(error)
  }
}
