// modules/operations/application/use-cases/create-contract.ts
import type { ContractRepository, LeadSnapshotRepository } from '../../domain/repositories'
import type { Contract } from '../../domain/entities'
import { generateContractNumber } from '../../domain/value-objects'

interface CreateContractInput {
  readonly leadId: string
  readonly organizationId: string
  readonly startDate: Date
  readonly endDate: Date | null
}

export function createCreateContractUseCase(
  contractRepo: ContractRepository,
  leadSnapshotRepo: LeadSnapshotRepository,
) {
  return async function createContract(input: CreateContractInput): Promise<Contract> {
    const snapshot = await leadSnapshotRepo.findByLeadId(input.leadId)
    if (!snapshot) {
      throw new Error('Lead snapshot not found')
    }

    const year = new Date().getFullYear()
    const seq = await contractRepo.getNextNumberSeq()
    const number = generateContractNumber(year, seq)

    return contractRepo.create({
      leadId: input.leadId,
      organizationId: input.organizationId,
      number,
      signedDate: new Date(),
      startDate: input.startDate,
      endDate: input.endDate,
      leadSnapshot: snapshot,
    })
  }
}
