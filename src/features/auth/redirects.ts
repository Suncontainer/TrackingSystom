import { routes } from "@/config/routes";

export function sanitizeAuthNextPath(value: string | null, fallback = routes.admin.home) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
