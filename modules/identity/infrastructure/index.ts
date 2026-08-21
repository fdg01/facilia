// modules/identity/infrastructure/index.ts
export { SupabaseUserRepository } from './repositories/supabase-user-repository'
export { SupabaseOrganizationRepository } from './repositories/supabase-organization-repository'
export { SupabaseAuthRepository } from './repositories/supabase-auth-repository'
export {
  createBrowserSupabaseClient,
  createServiceRoleSupabaseClient,
  createServerAnonSupabaseClient,
} from './supabase/client'
