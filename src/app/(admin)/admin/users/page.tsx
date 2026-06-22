import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { appRoleValues } from "@/db/schema/enums";
import { requirePermission } from "@/features/auth/guards";
import {
  createUserAction,
  resetUserPasswordAction,
  setUserActiveAction,
  updateUserNameAction,
  updateUserRoleAction
} from "@/features/users/manage-actions";
import { listTeamMembers } from "@/features/users/service";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";

export const metadata = {
  title: "Benutzer"
};

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | null, locale: AppLocale, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const profile = await requirePermission("users:manage");
  const { locale, t } = await getAdminContext();
  const u = t.users;
  const params = (await searchParams) ?? {};
  const okKey = typeof params.ok === "string" ? params.ok : null;
  const errorMessage = typeof params.error === "string" ? params.error : null;

  const okMessage =
    okKey === "role"
      ? u.okRole
      : okKey === "activated"
        ? u.okActivated
        : okKey === "deactivated"
          ? u.okDeactivated
          : okKey === "reset"
            ? u.okReset
            : okKey === "created"
              ? u.okCreated
              : okKey === "name"
                ? u.okName
                : null;

  const members = await listTeamMembers().catch(() => []);

  return (
    <AdminPageShell eyebrow={u.eyebrow} title={u.title}>
      {okMessage ? (
        <p className="form-feedback" role="status">
          {okMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{u.addHeading}</h2>
          <p>{u.addIntro}</p>
        </div>
        <form action={createUserAction} className="admin-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="new-user-first">{u.firstNameLabel}</label>
              <input id="new-user-first" name="firstName" required type="text" />
            </div>
            <div className="form-field">
              <label htmlFor="new-user-last">{u.lastNameLabel}</label>
              <input id="new-user-last" name="lastName" required type="text" />
            </div>
            <div className="form-field">
              <label htmlFor="new-user-email">{u.emailLabel}</label>
              <input id="new-user-email" name="email" required type="email" />
            </div>
            <div className="form-field">
              <label htmlFor="new-user-password">{u.passwordLabel}</label>
              <input id="new-user-password" minLength={8} name="password" required type="password" />
            </div>
            <div className="form-field">
              <label htmlFor="new-user-role">{u.colRole}</label>
              <select defaultValue="SALES" id="new-user-role" name="role">
                {appRoleValues.map((role) => (
                  <option key={role} value={role}>
                    {u.roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="button-base button-primary" type="submit">
            {u.addSubmit}
          </button>
        </form>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{u.heading}</h2>
          <p>{u.intro}</p>
        </div>

        {members.length === 0 ? (
          <p className="panel-empty">{u.empty}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{u.colName}</th>
                  <th>{u.colEmail}</th>
                  <th>{u.colRole}</th>
                  <th>{u.colStatus}</th>
                  <th>{u.colLastLogin}</th>
                  <th>{u.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.id === profile.id;

                  return (
                    <tr key={member.id}>
                      <td>
                        <form action={updateUserNameAction} className="inline-form">
                          <input type="hidden" name="userId" value={member.id} />
                          <input
                            aria-label={u.firstNameLabel}
                            defaultValue={member.firstName}
                            name="firstName"
                            type="text"
                          />
                          <input
                            aria-label={u.lastNameLabel}
                            defaultValue={member.lastName}
                            name="lastName"
                            type="text"
                          />
                          <button className="button-base button-ghost" type="submit">
                            {u.saveName}
                          </button>
                        </form>
                        {isSelf ? <span className="badge badge--muted">{u.youBadge}</span> : null}
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <form action={updateUserRoleAction} className="inline-form">
                          <input type="hidden" name="userId" value={member.id} />
                          <select name="role" defaultValue={member.role} aria-label={u.colRole}>
                            {appRoleValues.map((role) => (
                              <option key={role} value={role}>
                                {u.roleLabels[role]}
                              </option>
                            ))}
                          </select>
                          <button className="button-base button-ghost" type="submit">
                            {u.save}
                          </button>
                        </form>
                      </td>
                      <td>
                        <span className={member.isActive ? "badge badge--success" : "badge badge--muted"}>
                          {member.isActive ? u.active : u.inactive}
                        </span>
                      </td>
                      <td>{formatDate(member.lastLoginAt, locale, u.neverLoggedIn)}</td>
                      <td>
                        <div className="inline-actions">
                          {!isSelf ? (
                            <form action={setUserActiveAction} className="inline-form">
                              <input type="hidden" name="userId" value={member.id} />
                              <input type="hidden" name="isActive" value={member.isActive ? "false" : "true"} />
                              <button className="button-base button-ghost" type="submit">
                                {member.isActive ? u.deactivate : u.activate}
                              </button>
                            </form>
                          ) : null}
                          <form action={resetUserPasswordAction} className="inline-form">
                            <input type="hidden" name="userId" value={member.id} />
                            <button className="button-base button-ghost" type="submit">
                              {u.resetPassword}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
