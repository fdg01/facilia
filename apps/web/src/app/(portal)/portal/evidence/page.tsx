// src/app/(portal)/portal/evidence/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseEvidenceReader } from '@modules/portal/infrastructure'
import { createListEvidenceUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { EvidenceGallery } from '@modules/portal/presentation/components/EvidenceGallery'

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export default async function EvidencePage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listEvidence = createListEvidenceUseCase(
    new SupabaseEvidenceReader(supabase, generateSignedUrl),
  )
  const evidence = await listEvidence(session.organizationId)
  return <EvidenceGallery evidence={evidence} />
}
