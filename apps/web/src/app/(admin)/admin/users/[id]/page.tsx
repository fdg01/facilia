import { notFound } from "next/navigation";
import {
  createServiceRoleSupabaseClient,
  SupabaseUserRepository,
  SupabaseOrganizationRepository,
} from "@modules/identity/infrastructure";
import { requireRole } from "@/lib/session";
import EditUserForm from "./EditUserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;

  const serviceClient = createServiceRoleSupabaseClient();
  const userRepo = new SupabaseUserRepository(serviceClient);
  const orgRepo = new SupabaseOrganizationRepository(serviceClient);

  const user = await userRepo.findById(id);
  if (!user) notFound();

  const orgs = await orgRepo.list();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Editar usuario</h1>
      <EditUserForm user={user} organizations={orgs} />
    </div>
  );
}
