import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  if (session.role !== "admin") {
    redirect("/login?redirect=/admin");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-navy/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-display font-bold text-lg text-navy">
            FACILIA<span className="text-orange">.</span>
            <span className="text-navy/60 text-sm font-medium ml-2">Admin</span>
          </span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-navy/80 hover:text-orange transition-colors">
              Inicio
            </Link>
            <Link href="/admin/users" className="text-navy/80 hover:text-orange transition-colors">
              Usuarios
            </Link>
            <Link href="/admin/organizations" className="text-navy/80 hover:text-orange transition-colors">
              Organizaciones
            </Link>
            <Link href="/admin/configuracion" className="text-navy/80 hover:text-orange transition-colors">
              Configuración
            </Link>
            <Link href="/admin/dag" className="text-navy/80 hover:text-orange transition-colors">
              DAG
            </Link>
            <Link href="/admin/leads" className="text-navy/80 hover:text-orange transition-colors">
              Leads
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-navy/60">
            {session.firstName} {session.lastName}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const supabase = await createServerSupabaseClient();
        await supabase.auth.signOut();
        redirect("/login");
      }}
    >
      <button
        type="submit"
        className="text-navy/60 hover:text-orange text-sm transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
