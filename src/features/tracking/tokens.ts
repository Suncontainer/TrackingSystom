import { jwtVerify, SignJWT } from "jose";

export const trackingTokenPurpose = "customer-tracking";

const algorithm = "HS256";

export type TrackingTokenPayload = {
  orderId: string;
  tokenVersion: number;
  purpose: typeof trackingTokenPurpose;
};

type RawTrackingClaims = {
  sub?: string;
  ver?: number;
  purpose?: string;
};

function getSigningKey(secret: string) {
  if (!secret.trim()) {
    throw new Error("TRACKING_LINK_SECRET is required for tracking links.");
  }

  return Buffer.from(secret, "utf8");
}

export async function createTrackingToken(
  payload: Pick<TrackingTokenPayload, "orderId" | "tokenVersion">,
  secret: string
) {
  return new SignJWT({
    ver: payload.tokenVersion,
    purpose: trackingTokenPurpose
  })
    .setProtectedHeader({ alg: algorithm })
    .setSubject(payload.orderId)
    .setIssuedAt()
    .sign(getSigningKey(secret));
}

export async function verifyTrackingToken(token: string, secret: string): Promise<TrackingTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<RawTrackingClaims>(token, getSigningKey(secret), {
      algorithms: [algorithm]
    });

    if (
      !payload.sub ||
      payload.purpose !== trackingTokenPurpose ||
      typeof payload.ver !== "number" ||
      !Number.isInteger(payload.ver) ||
      payload.ver < 1
    ) {
      return null;
    }

    return {
      orderId: payload.sub,
      purpose: trackingTokenPurpose,
      tokenVersion: payload.ver
    };
  } catch {
    return null;
  }
}

export function isTrackingTokenVersionCurrent(payload: TrackingTokenPayload, currentVersion: number) {
  return payload.tokenVersion === currentVersion;
}
