// src/app/api/portal/evidence/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseEvidenceReader } from '@modules/portal/infrastructure'
import { createGetEvidenceUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const getEvidence = createGetEvidenceUseCase(
      new SupabaseEvidenceReader(supabase, generateSignedUrl),
    )
    const evidence = await getEvidence(id, session.organizationId)
    if (!evidence) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Evidencia no encontrada o no autorizada' } }, { status: 404 })
    }
    return NextResponse.json({ data: evidence })
  } catch (error) {
    return handleApiError(error)
  }
}
