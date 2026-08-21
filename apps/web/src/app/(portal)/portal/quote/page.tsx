// src/app/(portal)/portal/quote/page.tsx
import { requireClient } from '@/lib/portal-session'
import { QuoterPortal } from './QuoterPortal'

export default async function PortalQuotePage() {
  const session = await requireClient()
  return <QuoterPortal userName={session.firstName} userEmail={session.email} />
}
