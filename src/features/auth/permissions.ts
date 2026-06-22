import type { AppRole } from "@/db/schema";

import { AuthorizationError } from "./errors";

export const appPermissions = [
  "admin:access",
  "audit:read-all",
  "dashboard:read",
  "emails:read",
  "emails:retry",
  "emails:send-optional",
  "notes:create",
  "notes:read",
  "orders:archive",
  "orders:create",
  "orders:override-status",
  "orders:read",
  "orders:regenerate-tracking-link",
  "orders:update",
  "sellers:manage",
  "settings:update",
  "templates:manage",
  "users:manage"
] as const;

export type AppPermission = (typeof appPermissions)[number];

export const mutationPermissions = [
  "emails:retry",
  "emails:send-optional",
  "notes:create",
  "orders:archive",
  "orders:create",
  "orders:override-status",
  "orders:regenerate-tracking-link",
  "orders:update",
  "sellers:manage",
  "settings:update",
  "templates:manage",
  "users:manage"
] as const satisfies readonly AppPermission[];

export const rolePermissionMap = {
  SUPER_ADMIN: appPermissions,
  ADMIN: [
    "admin:access",
    "dashboard:read",
    "emails:read",
    "emails:retry",
    "emails:send-optional",
    "notes:create",
    "notes:read",
    "orders:create",
    "orders:read",
    "orders:update",
    "sellers:manage",
    "templates:manage"
  ],
  SALES: ["admin:access", "dashboard:read", "notes:create", "notes:read", "orders:read"],
  READ_ONLY: ["admin:access", "dashboard:read", "emails:read", "orders:read"]
} as const satisfies Record<AppRole, readonly AppPermission[]>;

export function hasPermission(role: AppRole, permission: AppPermission) {
  return (rolePermissionMap[role] as readonly AppPermission[]).includes(permission);
}

export function isMutationPermission(permission: AppPermission) {
  return (mutationPermissions as readonly AppPermission[]).includes(permission);
}

export function assertCan(role: AppRole, permission: AppPermission) {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(
      `${role} does not have ${permission} permission.`,
      "PERMISSION_REQUIRED"
    );
  }
}
