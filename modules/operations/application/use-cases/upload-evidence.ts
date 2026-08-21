// modules/operations/application/use-cases/upload-evidence.ts
import type { EvidenceRepository, ExecutionRepository, AssignmentRepository, StorageRepository } from '../../domain/repositories'
import type { Evidence } from '../../domain/entities'
import { randomUUID } from 'crypto'

interface UploadUrlInput {
  readonly workOrderId: string
  readonly executionId: string
  readonly organizationId: string
  readonly employeeId: string
  readonly type: 'photo' | 'video' | 'customer_signature' | 'document'
  readonly fileName: string
  readonly contentType: string
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime',
]

export function createUploadEvidenceUseCase(
  evidenceRepo: EvidenceRepository,
  executionRepo: ExecutionRepository,
  assignRepo: AssignmentRepository,
  storageRepo: StorageRepository,
) {
  return async function getUploadUrl(input: UploadUrlInput): Promise<{
    signedUrl: string
    storagePath: string
    evidenceId: string
  }> {
    if (!ALLOWED_CONTENT_TYPES.includes(input.contentType)) {
      throw new Error('INVALID_CONTENT_TYPE')
    }

    // Validate employee is assigned to this order
    const assignments = await assignRepo.findByWorkOrder(input.workOrderId)
    const isAssigned = assignments.some(
      (a) => a.employeeId === input.employeeId && (a.status === 'accepted' || a.status === 'pending'),
    )
    if (!isAssigned) throw new Error('FORBIDDEN')

    // Construct storage path server-side
    const ext = input.fileName.split('.').pop() ?? 'bin'
    const storagePath = `evidence/${input.organizationId}/${input.workOrderId}/${randomUUID()}.${ext}`

    // Create evidence record
    const evidence = await evidenceRepo.create({
      executionId: input.executionId,
      workOrderId: input.workOrderId,
      organizationId: input.organizationId,
      type: input.type,
      storagePath,
      fileName: input.fileName,
      contentType: input.contentType,
    })

    // Generate signed upload URL (15 min expiry)
    const signedUrl = await storageRepo.createSignedUploadUrl(storagePath, input.contentType, 900)

    return { signedUrl, storagePath, evidenceId: evidence.id }
  }
}

interface ConfirmEvidenceInput {
  readonly evidenceId: string
  readonly sizeBytes: number
  readonly metadata?: Record<string, unknown>
}

export function createConfirmEvidenceUseCase(evidenceRepo: EvidenceRepository) {
  return async function confirmEvidence(input: ConfirmEvidenceInput): Promise<Evidence> {
    return evidenceRepo.updateMetadata(input.evidenceId, input.sizeBytes, input.metadata ?? {})
  }
}
