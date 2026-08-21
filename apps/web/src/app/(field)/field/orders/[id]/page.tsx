// src/app/(field)/field/orders/[id]/page.tsx
import OrderExecution from './OrderExecution'

export default async function FieldOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderExecution orderId={id} />
}
