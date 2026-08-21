// modules/identity/application/use-cases/logout.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export function createLogoutUseCase() {
  return async function logout(supabase: SupabaseClient): Promise<void> {
    await supabase.auth.signOut()
  }
}
