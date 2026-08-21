// src/app/(portal)/portal/layout.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/portal')
  }

  // Admin → redirect to admin panel
  if (session.role === 'admin') {
    redirect('/admin')
  }

  // Employee → redirect (no portal access)
  if (session.role === 'employee') {
    redirect('/login?redirect=/portal&error=forbidden')
  }

  // Must be client
  if (session.role !== 'client') {
    redirect('/login?redirect=/portal&error=forbidden')
  }

  if (session.mustChangePassword) {
    redirect('/change-password')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur bg-white/85">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">
            FACILIA <span className="inline-block w-2 h-2 rounded-full bg-orange-500 align-middle" />
          </span>
          <nav className="hidden md:flex gap-4 text-sm">
            <Link href="/portal" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/portal/services" className="text-gray-600 hover:text-gray-900">
              Servicios
            </Link>
            <Link href="/portal/calendar" className="text-gray-600 hover:text-gray-900">
              Calendario
            </Link>
            <Link href="/portal/evidence" className="text-gray-600 hover:text-gray-900">
              Evidencias
            </Link>
            <Link href="/portal/contracts" className="text-gray-600 hover:text-gray-900">
              Contratos
            </Link>
            <Link href="/portal/payments" className="text-gray-600 hover:text-gray-900">
              Pagos
            </Link>
            <Link href="/portal/requests" className="text-gray-600 hover:text-gray-900">
              Solicitudes
            </Link>
            <Link href="/portal/communications" className="text-gray-600 hover:text-gray-900">
              Comunicaciones
            </Link>
            <Link href="/portal/leads" className="text-gray-600 hover:text-gray-900">
              Mis Cotizaciones
            </Link>
            <Link href="/portal/quote" className="text-gray-600 hover:text-gray-900">
              Nueva Cotización
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden md:inline text-gray-600">
            {session.firstName} {session.lastName}
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden flex gap-4 px-4 py-2 bg-white border-b border-gray-200 text-sm overflow-x-auto">
        <Link href="/portal" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Dashboard
        </Link>
        <Link href="/portal/services" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Servicios
        </Link>
        <Link href="/portal/calendar" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Calendario
        </Link>
        <Link href="/portal/evidence" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Evidencias
        </Link>
        <Link href="/portal/contracts" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Contratos
        </Link>
        <Link href="/portal/payments" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Pagos
        </Link>
        <Link href="/portal/requests" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Solicitudes
        </Link>
        <Link href="/portal/communications" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Comunicaciones
        </Link>
        <Link href="/portal/leads" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Cotizaciones
        </Link>
        <Link href="/portal/quote" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
          Nueva
        </Link>
      </nav>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  )
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        const supabase = await createServerSupabaseClient()
        await supabase.auth.signOut()
        redirect('/login')
      }}
    >
      <button
        type="submit"
        className="text-gray-600 hover:text-gray-900 text-sm"
      >
        Cerrar sesión
      </button>
    </form>
  )
}
