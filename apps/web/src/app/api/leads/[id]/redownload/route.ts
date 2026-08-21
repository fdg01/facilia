// src/app/api/leads/[id]/redownload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseLeadRepository, createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { createRedownloadLeadPdfUseCase } from '@modules/quoter/application/use-cases'
import { requireRole } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole('admin')
    const { id } = await params

    const serviceClient = createServiceRoleSupabaseClient()
    const leadRepo = new SupabaseLeadRepository(serviceClient)
    const redownload = createRedownloadLeadPdfUseCase(leadRepo, serviceClient)
    const pdfUrl = await redownload(id)

    return NextResponse.json({ data: { pdfUrl } }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'NO_SESSION' || error.message === 'FORBIDDEN')) {
      return NextResponse.json(
        { error: { code: error.message, message: 'No autorizado' } },
        { status: 403 },
      )
    }
    console.error('Redownload lead PDF error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 },
    )
  }
}
