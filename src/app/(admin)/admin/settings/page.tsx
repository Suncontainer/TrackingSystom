import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requireActiveProfile } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import {
  changeOwnPasswordAction,
  updateDefaultsAction,
  updateOwnProfileAction,
  updateSenderAction
} from "@/features/settings/actions";
import { getAppSettings } from "@/features/settings/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Einstellungen"
};

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const profile = await requireActiveProfile();
  const { t } = await getAdminContext();
  const s = t.settings;
  const canManageSystem = hasPermission(profile.role, "settings:update");
  const settings = canManageSystem ? await getAppSettings() : null;

  const params = (await searchParams) ?? {};
  const okKey = typeof params.ok === "string" ? params.ok : null;
  const errorMessage = typeof params.error === "string" ? params.error : null;

  const okMessage =
    okKey === "profile"
      ? s.account.okProfile
      : okKey === "password"
        ? s.account.okPassword
        : okKey === "defaults"
          ? s.defaults.ok
          : okKey === "sender"
            ? s.sender.ok
            : null;

  return (
    <AdminPageShell eyebrow={s.eyebrow} title={s.title}>
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
          <h2 className="font-heading">{s.account.heading}</h2>
          <p>{s.account.intro}</p>
        </div>
        <form action={updateOwnProfileAction} className="admin-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="firstName">{s.account.firstName}</label>
              <input defaultValue={profile.firstName} id="firstName" name="firstName" required type="text" />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">{s.account.lastName}</label>
              <input defaultValue={profile.lastName} id="lastName" name="lastName" required type="text" />
            </div>
          </div>
          <button className="button-base button-primary" type="submit">
            {s.account.saveProfile}
          </button>
        </form>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{s.account.passwordHeading}</h2>
          <p>{s.account.passwordIntro}</p>
        </div>
        <form action={changeOwnPasswordAction} className="admin-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="password">{s.account.newPassword}</label>
              <input id="password" minLength={10} name="password" required type="password" />
            </div>
            <div className="form-field">
              <label htmlFor="passwordConfirm">{s.account.confirmPassword}</label>
              <input id="passwordConfirm" minLength={10} name="passwordConfirm" required type="password" />
            </div>
          </div>
          <button className="button-base button-primary" type="submit">
            {s.account.changePassword}
          </button>
        </form>
      </section>

      {canManageSystem && settings ? (
        <>
          <section className="admin-card admin-section">
            <div className="section-heading">
              <h2 className="font-heading">{s.defaults.heading}</h2>
              <p>{s.defaults.intro}</p>
            </div>
            <form action={updateDefaultsAction} className="admin-form">
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="defaultCustomerLanguage">{s.defaults.language}</label>
                  <select
                    defaultValue={settings.defaultCustomerLanguage}
                    id="defaultCustomerLanguage"
                    name="defaultCustomerLanguage"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="orderNumberPrefix">{s.defaults.orderPrefix}</label>
                  <input
                    defaultValue={settings.orderNumberPrefix}
                    id="orderNumberPrefix"
                    name="orderNumberPrefix"
                    required
                    type="text"
                  />
                  <p className="field-hint">{s.defaults.orderPrefixHint}</p>
                </div>
              </div>
              <button className="button-base button-primary" type="submit">
                {s.defaults.save}
              </button>
            </form>
          </section>

          <section className="admin-card admin-section">
            <div className="section-heading">
              <h2 className="font-heading">{s.sender.heading}</h2>
              <p>{s.sender.intro}</p>
            </div>
            <form action={updateSenderAction} className="admin-form">
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="emailFromName">{s.sender.fromName}</label>
                  <input
                    defaultValue={settings.emailFromName}
                    id="emailFromName"
                    name="emailFromName"
                    required
                    type="text"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="emailFromAddress">{s.sender.fromEmail}</label>
                  <input
                    defaultValue={settings.emailFromAddress}
                    id="emailFromAddress"
                    name="emailFromAddress"
                    placeholder="orders@example.com"
                    type="email"
                  />
                </div>
              </div>
              <button className="button-base button-primary" type="submit">
                {s.sender.save}
              </button>
            </form>
          </section>
        </>
      ) : null}
    </AdminPageShell>
  );
}
