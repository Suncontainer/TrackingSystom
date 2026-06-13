import { describe, expect, it } from "vitest";

import { AuthenticationError, AuthorizationError } from "@/features/auth/errors";
import {
  appPermissions,
  assertCan,
  hasPermission,
  isMutationPermission,
  mutationPermissions,
  rolePermissionMap
} from "@/features/auth/permissions";
import { assertActiveProfile, isActiveProfile } from "@/features/auth/profile-state";

describe("authorization matrix", () => {
  it("grants every approved permission to super admins", () => {
    expect(rolePermissionMap.SUPER_ADMIN).toEqual(appPermissions);

    for (const permission of appPermissions) {
      expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("allows admin mutations but blocks protected super-admin operations", () => {
    expect(hasPermission("ADMIN", "orders:create")).toBe(true);
    expect(hasPermission("ADMIN", "orders:update")).toBe(true);
    expect(hasPermission("ADMIN", "orders:archive")).toBe(false);
    expect(hasPermission("ADMIN", "orders:override-status")).toBe(false);
    expect(hasPermission("ADMIN", "users:manage")).toBe(false);
  });

  it("restricts sales to assigned-order read and note capabilities", () => {
    expect(hasPermission("SALES", "orders:read")).toBe(true);
    expect(hasPermission("SALES", "notes:create")).toBe(true);
    expect(hasPermission("SALES", "orders:update")).toBe(false);
    expect(hasPermission("SALES", "emails:send-optional")).toBe(false);
  });

  it("rejects read-only mutations", () => {
    expect(hasPermission("READ_ONLY", "orders:read")).toBe(true);
    expect(isMutationPermission("orders:create")).toBe(true);
    expect(isMutationPermission("orders:read")).toBe(false);
    expect(() => assertCan("READ_ONLY", "orders:create")).toThrow(AuthorizationError);

    for (const permission of mutationPermissions) {
      expect(hasPermission("READ_ONLY", permission)).toBe(false);
    }
  });
});

describe("active profile checks", () => {
  it("requires a profile row for authenticated employees", () => {
    expect(() => assertActiveProfile(null)).toThrow(AuthenticationError);
  });

  it("rejects inactive profiles", () => {
    expect(isActiveProfile({ isActive: false })).toBe(false);
    expect(() => assertActiveProfile({ isActive: false })).toThrow(AuthorizationError);
  });

  it("allows active profiles", () => {
    const profile = { isActive: true };

    expect(isActiveProfile(profile)).toBe(true);
    expect(assertActiveProfile(profile)).toBe(profile);
  });
});
