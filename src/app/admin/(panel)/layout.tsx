import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminContext();

  if (!context) {
    redirect("/admin/login?error=Usuário+sem+permissão+administrativa");
  }

  return <AdminShell>{children}</AdminShell>;
}
