// src/app/(operations)/operations/layout.tsx
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/operations-session'
import OperationsNav from './OperationsNav'

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-navy">FACILIA</span>
            <span className="text-orange text-2xl">.</span>
            <span className="text-navy/60 text-sm font-medium ml-2">Operaciones</span>
          </div>
          <OperationsNav />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
