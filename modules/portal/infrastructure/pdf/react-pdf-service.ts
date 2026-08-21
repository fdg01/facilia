// modules/portal/infrastructure/pdf/react-pdf-service.ts
import type { PdfService } from '../../domain/repositories'
import type { LeadDetail } from '../../domain/types'
import { generateQuotePdf } from '../../../quoter/infrastructure/pdf/quote-pdf'
import type { Lead } from '../../../quoter/domain/entities'

export class ReactPdfService implements PdfService {
  async generate(lead: LeadDetail): Promise<Buffer> {
    // Adapt LeadDetail to the shape expected by generateQuotePdf
    const adaptedLead: Lead = {
      id: lead.id,
      number: lead.number,
      status: lead.status,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      organizationId: lead.organizationId,
      userId: lead.userId,
      totalMonthly: lead.totalMonthly,
      totalPerVisit: lead.totalPerVisit,
      parametersSnapshot: lead.snapshot?.parameters ?? null,
      dagVersion: null,
      giftIncluded: lead.giftIncluded,
      giftDescription: lead.giftDescription,
      mainLine: lead.mainLine,
      notes: null,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }

    const breakdown = (lead.snapshot?.detail?.breakdown as unknown[]) ?? []
    const pdfBuffer = await generateQuotePdf({
      lead: adaptedLead,
      breakdown: breakdown as Parameters<typeof generateQuotePdf>[0]['breakdown'],
      giftDescription: lead.giftDescription,
    })

    return pdfBuffer
  }
}
