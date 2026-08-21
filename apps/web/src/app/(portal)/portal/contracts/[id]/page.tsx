// src/app/(portal)/portal/contracts/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseContractReader } from '@modules/portal/infrastructure'
import { createGetContractUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { ContractDetail } from '@modules/portal/presentation/components/ContractDetail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient()
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const getContract = createGetContractUseCase(new SupabaseContractReader(supabase))
  const contract = await getContract(id, session.organizationId)
  if (!contract) {
    return <div className="text-center text-gray-500 py-12">Contrato no encontrado</div>
  }
  return <ContractDetail contract={contract} />
}
