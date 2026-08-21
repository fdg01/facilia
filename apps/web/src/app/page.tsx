import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">FACILIA</h1>
        <p className="text-gray-600">Plataforma de Facility Services de CORE</p>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/cotizador"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
          >
            Cotizar servicio
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 transition"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
