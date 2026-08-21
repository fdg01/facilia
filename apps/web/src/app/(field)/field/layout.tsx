// src/app/(field)/field/layout.tsx
import { redirect } from 'next/navigation'
import { requireEmployee } from '@/lib/operations-session'

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireEmployee()
  } catch {
    redirect('/login')
  }
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-navy/10 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-display font-bold text-lg text-navy">FACILIA</span>
            <span className="text-orange text-xl">.</span>
            <span className="text-navy/60 text-xs font-medium ml-1">Campo</span>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">{children}</main>
    </div>
  )
}
