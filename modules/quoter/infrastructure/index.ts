// modules/quoter/infrastructure/index.ts
export { SupabaseDagRepository } from './repositories/supabase-dag-repository'
export { SupabaseVariableRepository } from './repositories/supabase-variable-repository'
export { SupabaseConsumableRepository } from './repositories/supabase-consumable-repository'
export { SupabaseParameterRepository } from './repositories/supabase-parameter-repository'
export { SupabaseRuleRepository } from './repositories/supabase-rule-repository'
export { SupabaseWelcomeGiftRepository } from './repositories/supabase-welcome-gift-repository'
export { SupabaseLeadRepository } from './repositories/supabase-lead-repository'

export { generateQuotePdf, uploadLeadPdf, getSignedPdfUrl } from './pdf/quote-pdf'

// Re-export from identity for convenience
export { createServiceRoleSupabaseClient } from '@modules/identity/infrastructure'
