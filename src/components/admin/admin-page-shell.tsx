import { Contact, Gauge, LogOut, Mail, Settings, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { SunContainerLogo } from "@/components/brand/logo";
import { routes } from "@/config/routes";
import { signOutAction } from "@/features/auth/actions";
import { getAdminContext } from "@/i18n/get-admin-locale";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export async function AdminPageShell({ eyebrow, title, children }: AdminPageShellProps) {
  const { t } = await getAdminContext();

  return (
    <main className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__top">
            <SunContainerLogo variant="horizontal-light" decorative />
            <AdminLocaleToggle switchTo={t.switchToLocale} switchLabel={t.switchLabel} languageLabel={t.nav.language} />
          </div>
          <nav className="admin-nav" aria-label={t.nav.aria}>
            <Link href={routes.admin.home}>
              <Gauge size={18} aria-hidden="true" />
              {t.nav.dashboard}
            </Link>
            <Link href={routes.admin.orders}>
              <ShoppingBag size={18} aria-hidden="true" />
              {t.nav.orders}
            </Link>
            <Link href={routes.admin.emails}>
              <Mail size={18} aria-hidden="true" />
              {t.nav.emails}
            </Link>
            <Link href={routes.admin.users}>
              <Users size={18} aria-hidden="true" />
              {t.nav.users}
            </Link>
            <Link href={routes.admin.sellers}>
              <Contact size={18} aria-hidden="true" />
              {t.nav.sellers}
            </Link>
            <Link href={routes.admin.settings}>
              <Settings size={18} aria-hidden="true" />
              {t.nav.settings}
            </Link>
          </nav>
          <form action={signOutAction} className="admin-sidebar__footer">
            <button className="button-base button-ghost admin-logout" type="submit">
              <LogOut size={18} aria-hidden="true" />
              {t.nav.logout}
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
