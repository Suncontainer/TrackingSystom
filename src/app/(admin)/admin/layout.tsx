import type { ReactNode } from "react";

import { requireAdminProfileOrRedirect } from "@/features/auth/admin-guard";

export const dynamic = "force-dynamic";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminProfileOrRedirect();

  return children;
}
