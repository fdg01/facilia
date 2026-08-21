// src/app/(operations)/operations/contracts/[id]/page.tsx
import ContractDetail from './ContractDetail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContractDetail contractId={id} />
}
