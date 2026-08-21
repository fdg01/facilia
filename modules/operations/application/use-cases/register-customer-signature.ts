// modules/operations/application/use-cases/register-customer-signature.ts
import type {
  EvidenceRepository, ExecutionRepository, AssignmentRepository, StorageRepository,
} from '../../domain/repositories'
import type { Evidence } from '../../domain/entities'
import { randomUUID } from 'crypto'

interface SignatureInput {
  readonly workOrderId: string
  readonly organizationId: string
  readonly employeeId: string
  readonly signatureBase64: string
}

export function createRegisterCustomerSignatureUseCase(
  evidenceRepo: EvidenceRepository,
  executionRepo: ExecutionRepository,
  assignRepo: AssignmentRepository,
  storageRepo: StorageRepository,
) {
  return async function registerSignature(input: SignatureInput): Promise<Evidence> {
    // Validate assignment
    const assignments = await assignRepo.findByWorkOrder(input.workOrderId)
    const isAssigned = assignments.some(
      (a) => a.employeeId === input.employeeId && (a.status === 'accepted' || a.status === 'pending'),
    )
    if (!isAssigned) throw new Error('FORBIDDEN')

    // Get or create execution
    let execution = await executionRepo.findByWorkOrder(input.workOrderId)
    if (!execution) {
      execution = await executionRepo.create({
        workOrderId: input.workOrderId,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
      })
    }

    // Upload signature to storage server-side
    const storagePath = `evidence/${input.organizationId}/${input.workOrderId}/${randomUUID()}.png`
    const buffer = Buffer.from(input.signatureBase64, 'base64')
    await storageRepo.uploadBuffer(storagePath, buffer, 'image/png')

    // Create evidence record
    return evidenceRepo.create({
      executionId: execution.id,
      workOrderId: input.workOrderId,
      organizationId: input.organizationId,
      type: 'customer_signature',
      storagePath,
      fileName: 'signature.png',
      contentType: 'image/png',
    })
  }
}
