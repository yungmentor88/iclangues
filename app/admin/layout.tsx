import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin — IClangues",
  // The admin area must never be indexed.
  robots: { index: false, follow: false, nocache: true },
};

// Admin screens read live data and are user-specific; never prerender them.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate every /admin/* route in one place. Redirects non-admins to /login.
  const admin = await requireAdmin();

  return <AdminShell email={admin.email} name={admin.fullName}>{children}</AdminShell>;
}
