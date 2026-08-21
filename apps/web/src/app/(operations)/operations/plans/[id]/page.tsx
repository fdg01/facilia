// src/app/(operations)/operations/plans/[id]/page.tsx
import OperationalPlanEditor from './OperationalPlanEditor'

export default async function PlanEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OperationalPlanEditor planId={id} />
}
