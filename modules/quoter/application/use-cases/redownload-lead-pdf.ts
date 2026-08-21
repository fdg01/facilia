// modules/quoter/application/use-cases/redownload-lead-pdf.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadRepository } from '../../domain/repositories'
import { getSignedPdfUrl } from '../../infrastructure/pdf/quote-pdf'

export function createRedownloadLeadPdfUseCase(
  _leadRepo: LeadRepository,
  serviceClient: SupabaseClient,
) {
  return async function redownloadLeadPdf(leadId: string): Promise<string> {
    return getSignedPdfUrl(serviceClient, leadId)
  }
}
