// src/app/(public)/cotizador/page.tsx
import { QuoterDag } from './QuoterDag'

export default function QuoterPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-50/60 to-paper">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(11,42,97,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(217,116,0,0.08) 0%, transparent 50%)'
        }} />
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display font-bold text-lg text-navy tracking-wide">
              FACILIA<span className="text-orange">.</span>
            </span>
            <span className="text-navy/40 text-sm">Cotizador</span>
          </div>
          <h1 className="font-display font-bold text-navy leading-tight" style={{ fontSize: 'clamp(22px, 4vw, 38px)' }}>
            Armá tu presupuesto
            <span className="text-orange"> al instante</span>
          </h1>
          <p className="text-ink/80 mt-3 max-w-lg text-base">
            Elegí tu línea de servicio, personalizá las opciones y mirá el precio en vivo.
          </p>
        </div>
      </section>

      {/* Cotizador */}
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 pb-32 md:pb-12">
        <QuoterDag />
      </div>
    </main>
  )
}
