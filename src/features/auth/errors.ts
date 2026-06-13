export type AuthenticationErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_UNCONFIGURED"
  | "PROFILE_MISSING";

export type AuthorizationErrorCode =
  | "INACTIVE_PROFILE"
  | "ORDER_ACCESS_REQUIRED"
  | "PERMISSION_REQUIRED"
  | "ROLE_REQUIRED";

export class AuthenticationError extends Error {
  readonly code: AuthenticationErrorCode;

  constructor(message: string, code: AuthenticationErrorCode = "AUTH_REQUIRED") {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  readonly code: AuthorizationErrorCode;

  constructor(message: string, code: AuthorizationErrorCode = "PERMISSION_REQUIRED") {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}
