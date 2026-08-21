// modules/portal/infrastructure/index.ts
export { SupabasePortalLeadRepository } from './repositories/supabase-portal-lead-repository'
export { SupabasePortalDashboardRepository } from './repositories/supabase-portal-dashboard-repository'
export { ReactPdfService } from './pdf/react-pdf-service'
export { SupabaseRequestRepository, SupabaseRequestEventRepository } from './repositories/supabase-request-repository'
export { SupabaseCommunicationRepository } from './repositories/supabase-communication-repository'
export { SupabaseServiceEventRepository, SupabaseEvidenceVisibilityRepository } from './repositories/supabase-service-event-repository'
export {
  SupabaseServiceReader, SupabaseCalendarReader, SupabaseEvidenceReader,
  SupabaseContractReader, SupabasePaymentReader, SupabaseExtendedDashboardRepository,
} from './repositories/supabase-cross-module-readers'
