import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canViewAdminPanel, getUserRole } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !canViewAdminPanel(session.user as Record<string, unknown>)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar user={session.user} role={getUserRole(session.user as Record<string, unknown>)} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
