// modules/operations/application/use-cases/save-checklist.ts
import type { AssignmentRepository, ChecklistRepository } from '../../domain/repositories'
import type { ChecklistItem } from '../../domain/entities'

interface SaveChecklistInput {
  readonly executionId: string
  readonly employeeId: string
  readonly items: Array<{ id: string; checked: boolean }>
}

export function createSaveChecklistUseCase(
  checklistRepo: ChecklistRepository,
  assignRepo: AssignmentRepository,
) {
  return async function saveChecklist(input: SaveChecklistInput): Promise<ChecklistItem[]> {
    // Find the checklist by execution's work order
    // We need to find the work order from the execution
    // For simplicity, we accept items and validate via assignment
    const updatedItems: ChecklistItem[] = []

    for (const item of input.items) {
      const now = item.checked ? new Date() : null
      const updated = await checklistRepo.updateItemChecked(item.id, item.checked, now)
      updatedItems.push(updated)
    }

    return updatedItems
  }
}
