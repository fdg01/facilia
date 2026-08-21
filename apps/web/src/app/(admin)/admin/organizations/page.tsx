import {
  createServiceRoleSupabaseClient,
  SupabaseOrganizationRepository,
} from "@modules/identity/infrastructure";
import { requireRole } from "@/lib/session";
import OrganizationsList from "./OrganizationsList";

export default async function OrganizationsPage() {
  await requireRole("admin");

  const serviceClient = createServiceRoleSupabaseClient();
  const orgRepo = new SupabaseOrganizationRepository(serviceClient);
  const orgs = await orgRepo.list();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Organizaciones</h1>
      <OrganizationsList orgs={orgs} />
    </div>
  );
}
