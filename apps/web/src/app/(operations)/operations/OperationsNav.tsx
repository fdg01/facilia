// src/app/(operations)/operations/OperationsNav.tsx
import Link from 'next/link'

export default function OperationsNav() {
  const links = [
    { href: '/operations', label: 'Dashboard' },
    { href: '/operations/contracts', label: 'Contratos' },
    { href: '/operations/orders', label: 'Órdenes' },
    { href: '/operations/calendar', label: 'Calendario' },
    { href: '/operations/indicators', label: 'Indicadores' },
    { href: '/operations/holidays', label: 'Feriados' },
  ]
  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="px-3 py-2 text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 rounded-lg transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
