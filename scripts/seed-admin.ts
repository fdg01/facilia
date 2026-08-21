/**
 * Seed: Initial admin
 *
 * Creates the first admin user when the system starts for the first time.
 * Credentials come from environment variables:
 *   - SEED_ADMIN_EMAIL
 *   - SEED_ADMIN_PASSWORD
 *   - SEED_ADMIN_FIRST_NAME
 *   - SEED_ADMIN_LAST_NAME
 *
 * The script is idempotent: if an admin already exists, it does nothing.
 * The created admin has must_change_password = true (ADR-002).
 *
 * Usage: npx tsx scripts/seed-admin.ts
 *
 * Requires:
 *   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SEED_ADMIN_EMAIL
 *   - SEED_ADMIN_PASSWORD
 *   - SEED_ADMIN_FIRST_NAME
 *   - SEED_ADMIN_LAST_NAME
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const seedEmail = process.env.SEED_ADMIN_EMAIL
const seedPassword = process.env.SEED_ADMIN_PASSWORD
const seedFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin'
const seedLastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Initial'

function fail(msg: string): never {
  console.error(`[seed] ERROR: ${msg}`)
  process.exit(1)
}

if (!supabaseUrl) fail('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
if (!serviceRoleKey) fail('Missing SUPABASE_SERVICE_ROLE_KEY')
if (!seedEmail) fail('Missing SEED_ADMIN_EMAIL')
if (!seedPassword) fail('Missing SEED_ADMIN_PASSWORD')
if (seedPassword.length < 8) fail('SEED_ADMIN_PASSWORD must be at least 8 characters')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedAdmin(): Promise<void> {
  // 1. Check if an admin already exists
  const { data: existingAdmins, error: queryError } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'admin')
    .limit(1)

  if (queryError) {
    fail(`Could not query existing users: ${queryError.message}`)
  }

  if (existingAdmins && existingAdmins.length > 0) {
    console.log(`[seed] Admin already exists: ${existingAdmins[0].email}. Nothing to do.`)
    return
  }

  // 2. Create the auth.users entry via service role
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: seedEmail,
    password: seedPassword,
    email_confirm: true,
    user_metadata: {
      first_name: seedFirstName,
      last_name: seedLastName,
      role: 'admin',
    },
  })

  if (authError) {
    fail(`Could not create auth user: ${authError.message}`)
  }

  const authId = authData.user.id

  // 3. The handle_new_user trigger inserts into public.users automatically,
  //    but we need to update role, must_change_password and first/last name.
  const { error: updateError } = await supabase
    .from('users')
    .update({
      first_name: seedFirstName,
      last_name: seedLastName,
      role: 'admin',
      must_change_password: true,
    })
    .eq('auth_id', authId)

  if (updateError) {
    fail(`Could not update seed user: ${updateError.message}`)
  }

  console.log(`[seed] Initial admin created: ${seedEmail}`)
  console.log('[seed] must_change_password = true (forced change on first login)')
}

seedAdmin().catch((err) => {
  fail(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
})
