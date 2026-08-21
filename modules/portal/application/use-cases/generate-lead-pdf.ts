// modules/portal/application/use-cases/generate-lead-pdf.ts
import type { PortalLeadRepository, PdfService } from '../../domain/repositories'

export function createGenerateLeadPdfUseCase(
  leadRepo: PortalLeadRepository,
  pdfService: PdfService,
) {
  return async function generateLeadPdf(id: string, organizationId: string): Promise<Buffer> {
    const lead = await leadRepo.findByIdAndOrganization(id, organizationId)
    if (!lead) {
      throw new Error('Lead not found')
    }
    return pdfService.generate(lead)
  }
}
