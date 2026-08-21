import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy">Panel de Administración</h1>
        <a
          href="/facilia/cotizador"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 font-display text-sm font-semibold text-white shadow-card hover:bg-orange-700 transition-colors"
        >
          Ver cotizador público
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="block rounded-2xl border border-navy-100 bg-white p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-navy">Usuarios</h2>
          <p className="text-sm text-navy/60 mt-1">
            Gestionar usuarios del sistema
          </p>
        </Link>
        <Link
          href="/admin/organizations"
          className="block rounded-2xl border border-navy-100 bg-white p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-navy">Organizaciones</h2>
          <p className="text-sm text-navy/60 mt-1">
            Gestionar organizaciones cliente
          </p>
        </Link>
        <Link
          href="/admin/dag"
          className="block rounded-2xl border border-navy-100 bg-white p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-navy">Editor de DAG</h2>
          <p className="text-sm text-navy/60 mt-1">
            Configurar el flujo del cotizador visual
          </p>
        </Link>
        <Link
          href="/admin/configuracion"
          className="block rounded-2xl border border-navy-100 bg-white p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-navy">Configuración</h2>
          <p className="text-sm text-navy/60 mt-1">
            Variables, insumos, parámetros, reglas y regalo de bienvenida
          </p>
        </Link>
        <Link
          href="/admin/leads"
          className="block rounded-2xl border border-navy-100 bg-white p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-navy">Panel Comercial</h2>
          <p className="text-sm text-navy/60 mt-1">
            Ver y gestionar leads y presupuestos
          </p>
        </Link>
        <a
          href="/facilia/cotizador"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-orange-100 bg-orange-50 p-6 shadow-card hover:shadow-soft transition"
        >
          <h2 className="font-display font-semibold text-lg text-orange">Cotizador público</h2>
          <p className="text-sm text-navy/60 mt-1">
            Abrir la página de cotización que ven los clientes
          </p>
        </a>
      </div>
    </div>
  );
}
