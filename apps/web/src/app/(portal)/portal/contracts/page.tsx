// src/app/(portal)/portal/contracts/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabaseContractReader } from '@modules/portal/infrastructure'
import { createListContractsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { ContractList } from '@modules/portal/presentation/components/ContractList'

export default async function ContractsPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listContracts = createListContractsUseCase(new SupabaseContractReader(supabase))
  const contracts = await listContracts(session.organizationId)
  return <ContractList contracts={contracts} />
}
