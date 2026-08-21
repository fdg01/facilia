import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/profile");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <ProfileForm session={session} />
    </div>
  );
}
