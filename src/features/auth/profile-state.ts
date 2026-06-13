import type { Profile } from "@/db/schema";

import { AuthenticationError, AuthorizationError } from "./errors";

export function isActiveProfile(profile: Pick<Profile, "isActive"> | null | undefined) {
  return profile?.isActive === true;
}

export function assertActiveProfile<TProfile extends Pick<Profile, "isActive"> | null | undefined>(
  profile: TProfile
): Exclude<TProfile, null | undefined> {
  if (!profile) {
    throw new AuthenticationError("Authenticated user does not have an application profile.", "PROFILE_MISSING");
  }

  if (!isActiveProfile(profile)) {
    throw new AuthorizationError("Application profile is inactive.", "INACTIVE_PROFILE");
  }

  return profile as Exclude<TProfile, null | undefined>;
}
