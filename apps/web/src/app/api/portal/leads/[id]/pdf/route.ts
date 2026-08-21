// src/app/api/portal/leads/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePortalLeadRepository, ReactPdfService } from '@modules/portal/infrastructure'
import { createGenerateLeadPdfUseCase } from '@modules/portal/application/use-cases'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const ip = getClientIp(request)
    const session = await requireClient()

    // Rate limiting: 5 PDF generations per hour per user
    const rateLimit = checkRateLimit(`portal-pdf:${session.userId}:${ip}`, RATE_LIMITS.leads)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intente más tarde.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      )
    }

    const supabase = await createServerSupabaseClient()
    const leadRepo = new SupabasePortalLeadRepository(supabase)
    const pdfService = new ReactPdfService()
    const generatePdf = createGenerateLeadPdfUseCase(leadRepo, pdfService)

    const pdfBuffer = await generatePdf(id, session.organizationId)
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="presupuesto.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Lead not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Cotización no encontrada' } },
        { status: 404 },
      )
    }
    if (error instanceof Error && (error.message.includes('NO_SESSION') || error.message.includes('FORBIDDEN'))) {
      const status = error.message.includes('NO_SESSION') ? 401 : 403
      return NextResponse.json(
        { error: { code: error.message.includes('NO_SESSION') ? 'NO_SESSION' : 'FORBIDDEN', message: error.message } },
        { status },
      )
    }
    console.error('Portal PDF error:', error)
    return NextResponse.json(
      { error: { code: 'PDF_ERROR', message: 'No se pudo generar el PDF' } },
      { status: 500 },
    )
  }
}
