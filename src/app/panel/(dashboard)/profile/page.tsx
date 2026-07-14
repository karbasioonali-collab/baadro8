import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { ProfileForm } from "@/components/panel/ProfileForm";

export default async function PanelProfilePage() {
  const session = await getCustomerSession();
  const user = await prisma.user.findUnique({ where: { id: session!.userId } });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <ProfileForm
        mobile={user?.mobile ?? ""}
        name={user?.name ?? ""}
        email={user?.email ?? ""}
      />
    </div>
  );
}
