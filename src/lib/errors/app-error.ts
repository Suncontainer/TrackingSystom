export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT");
    this.name = "ConflictError";
  }
}
