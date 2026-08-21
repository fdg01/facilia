import {
  createServiceRoleSupabaseClient,
  SupabaseUserRepository,
  SupabaseOrganizationRepository,
} from "@modules/identity/infrastructure";
import { requireRole } from "@/lib/session";
import UsersTable from "./UsersTable";

export default async function UsersPage() {
  await requireRole("admin");

  const serviceClient = createServiceRoleSupabaseClient();
  const userRepo = new SupabaseUserRepository(serviceClient);
  const orgRepo = new SupabaseOrganizationRepository(serviceClient);
  const [result, orgs] = await Promise.all([
    userRepo.list({ page: 1, pageSize: 50 }),
    orgRepo.list(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
      </div>
      <UsersTable users={result.data} organizations={orgs} />
    </div>
  );
}
