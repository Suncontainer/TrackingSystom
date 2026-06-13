import { timingSafeEqual } from "node:crypto";

export function isAuthorizedCronRequest(headers: Headers, secret: string | undefined) {
  if (!secret) {
    return false;
  }

  const authorization = headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

  if (!token) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);

  if (tokenBuffer.length !== secretBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, secretBuffer);
}
