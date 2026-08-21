// src/app/api/portal/evidence/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseEvidenceReader } from '@modules/portal/infrastructure'
import { createListEvidenceUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listEvidence = createListEvidenceUseCase(
      new SupabaseEvidenceReader(supabase, generateSignedUrl),
    )
    const evidence = await listEvidence(session.organizationId)
    return NextResponse.json({ data: evidence })
  } catch (error) {
    return handleApiError(error)
  }
}
