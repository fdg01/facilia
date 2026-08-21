// src/app/(portal)/portal/services/[id]/visits/[orderId]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseCalendarReader, SupabaseEvidenceReader } from '@modules/portal/infrastructure'
import { VisitDetail } from '@modules/portal/presentation/components/VisitDetail'

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.storage.from('evidence').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>
}) {
  const session = await requireClient()
  const { id, orderId } = await params
  const supabase = await createServerSupabaseClient()

  // Get calendar visits for this organization and find the one matching orderId
  const calendarReader = new SupabaseCalendarReader(supabase)
  const today = new Date()
  const from = new Date(today.getFullYear() - 1, 0, 1)
  const to = new Date(today.getFullYear() + 1, 12, 31)
  const visits = await calendarReader.listByOrganization(session.organizationId, from, to)
  const visit = visits.find((v) => v.id === orderId) ?? null

  // Get authorized evidence for this organization
  const evidenceReader = new SupabaseEvidenceReader(supabase, generateSignedUrl)
  const allEvidence = await evidenceReader.listAuthorizedByOrganization(session.organizationId)
  const visitEvidence = allEvidence.filter((e) => e.workOrderId === orderId)

  return <VisitDetail serviceId={id} visit={visit} evidence={visitEvidence} />
}
