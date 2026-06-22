import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { TemplateEditForm } from "@/components/templates/template-edit-form";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { getEmailTemplate } from "@/features/templates/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Vorlage bearbeiten"
};

type TemplateEditPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  await requirePermission("templates:manage");
  const { templateId } = await params;
  const { t } = await getAdminContext();
  const tp = t.templates;
  const template = await getEmailTemplate(templateId);

  if (!template) {
    notFound();
  }

  return (
    <AdminPageShell eyebrow={tp.editEyebrow} title={template.name}>
      <div className="admin-section">
        <Link className="row-action" href={routes.admin.templates}>
          ← {tp.back}
        </Link>
      </div>
      <TemplateEditForm dict={tp} template={template} />
    </AdminPageShell>
  );
}
