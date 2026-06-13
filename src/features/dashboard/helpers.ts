export const dashboardPeriodValues = ["7", "30", "90"] as const;
export type DashboardPeriod = (typeof dashboardPeriodValues)[number];

export function parseDashboardPeriod(value: string | string[] | undefined): DashboardPeriod {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return dashboardPeriodValues.includes(rawValue as DashboardPeriod) ? (rawValue as DashboardPeriod) : "30";
}

export function getDashboardPeriodStart(period: DashboardPeriod, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - Number(period));
  return start;
}
