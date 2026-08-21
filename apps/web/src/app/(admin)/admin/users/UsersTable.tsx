"use client";

import { apiUrl } from "@/lib/api-url"
import { useState } from "react";
import Link from "next/link";
import type { User, Organization } from "@modules/identity/domain/entities";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  employee: "Empleado",
  client: "Cliente",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

export default function UsersTable({
  users,
  organizations,
}: {
  users: User[];
  organizations: Organization[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition text-sm"
        >
          {showCreate ? "Cancelar" : "Crear usuario"}
        </button>
      </div>

      {showCreate && (
        <CreateUserForm
          organizations={organizations}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Rol</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Organización</th>
              <th className="text-left px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {statusLabels[user.status] ?? user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {user.organizationId ? user.organizationId.slice(0, 8) + "..." : "—"}
                </td>
                <td className="px-4 py-3">
                  <UserActions user={user} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserActions({ user }: { user: User }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex gap-2">
      <Link
        href={`/admin/users/${user.id}`}
        className="text-xs text-blue-600 hover:underline"
      >
        Editar
      </Link>
      {user.status === "active" && (
        <button
          onClick={async () => {
            if (!confirm(`¿Inactivar a ${user.firstName} ${user.lastName}?`)) return;
            await fetch(apiUrl(`/api/admin/users/${user.id}/deactivate`), { method: "POST" });
            window.location.reload();
          }}
          className="text-xs text-red-600 hover:underline"
        >
          Inactivar
        </button>
      )}
      <button
        onClick={() => setShowPassword(!showPassword)}
        className="text-xs text-blue-600 hover:underline"
      >
        Cambiar contraseña
      </button>
      {showPassword && <PasswordForm userId={user.id} onClose={() => setShowPassword(false)} />}
    </div>
  );
}

function PasswordForm({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex gap-1 items-center">
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        className="rounded border border-gray-300 px-2 py-1 text-xs"
      />
      <button
        onClick={async () => {
          setMsg(null);
          setError(null);
          const res = await fetch(apiUrl(`/api/admin/users/${userId}/password`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword: password }),
          });
          if (res.ok) {
            setMsg("Contraseña cambiada");
            setPassword("");
          } else {
            const data = await res.json();
            setError(data.error?.message || "Error");
          }
        }}
        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
      >
        Guardar
      </button>
      <button onClick={onClose} className="text-xs text-gray-500">
        ✕
      </button>
      {msg && <span className="text-xs text-green-600">{msg}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function CreateUserForm({
  organizations,
  onClose,
}: {
  organizations: Organization[];
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");
  const [phone, setPhone] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          role,
          phone: phone || undefined,
          temporaryPassword: tempPassword,
          organizationId: role === "client" ? organizationId : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Error al crear usuario");
        return;
      }

      window.location.reload();
    } catch {
      setError("Error al crear usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <h3 className="font-medium">Crear usuario</h3>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="employee">Empleado</option>
          <option value="client">Cliente</option>
        </select>
        <input
          type="password"
          placeholder="Contraseña temporal (min 8)"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          required
          minLength={8}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {role === "client" && (
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
            className="rounded border border-gray-300 px-3 py-2 text-sm col-span-2"
          >
            <option value="">Seleccionar organización...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

