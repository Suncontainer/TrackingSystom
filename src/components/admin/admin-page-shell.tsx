import { Gauge, LogOut, Mail, Settings, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SunContainerLogo } from "@/components/brand/logo";
import { routes } from "@/config/routes";
import { signOutAction } from "@/features/auth/actions";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function AdminPageShell({ eyebrow, title, children }: AdminPageShellProps) {
  return (
    <main className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <SunContainerLogo variant="horizontal-light" decorative />
          <nav className="admin-nav" aria-label="Admin Navigation">
            <Link href={routes.admin.home}>
              <Gauge size={18} aria-hidden="true" />
              Dashboard
            </Link>
            <Link href={routes.admin.orders}>
              <ShoppingBag size={18} aria-hidden="true" />
              Aufträge
            </Link>
            <Link href={routes.admin.emails}>
              <Mail size={18} aria-hidden="true" />
              E-Mails
            </Link>
            <Link href={routes.admin.users}>
              <Users size={18} aria-hidden="true" />
              Benutzer
            </Link>
            <Link href={routes.admin.settings}>
              <Settings size={18} aria-hidden="true" />
              Einstellungen
            </Link>
          </nav>
          <form action={signOutAction} className="admin-sidebar__footer">
            <button className="button-base button-ghost admin-logout" type="submit">
              <LogOut size={18} aria-hidden="true" />
              Abmelden
            </button>
          </form>
        </aside>
        <section className="admin-content" aria-labelledby="admin-page-title">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="admin-page-title" className="font-heading">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </main>
  );
}
