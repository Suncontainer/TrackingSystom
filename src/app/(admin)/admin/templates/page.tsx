import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { listEmailTemplates } from "@/features/templates/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Vorlagen"
};

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  await requirePermission("templates:manage");
  const { t } = await getAdminContext();
  const tp = t.templates;
  const params = (await searchParams) ?? {};
  const templates = await listEmailTemplates().catch(() => []);

  return (
    <AdminPageShell eyebrow={tp.eyebrow} title={tp.title}>
      {params.updated === "1" ? (
        <p className="form-feedback" role="status">
          {tp.flashUpdated}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{tp.heading}</h2>
          <p>{tp.intro}</p>
        </div>
        {templates.length === 0 ? (
          <p className="panel-empty">{tp.empty}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{tp.colName}</th>
                  <th>{tp.colSubject}</th>
                  <th>{tp.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{template.subjectDe}</td>
                    <td>
                      <Link className="row-action" href={routes.admin.templateEdit(template.id)}>
                        {tp.editAction}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
