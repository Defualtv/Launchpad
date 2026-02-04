export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Limit errors
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  JOB_LIMIT_EXCEEDED: 'JOB_LIMIT_EXCEEDED',
  AI_GENERATION_LIMIT_EXCEEDED: 'AI_GENERATION_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  AI_ERROR: 'AI_ERROR',
  
  // Cron errors
  INVALID_CRON_SECRET: 'INVALID_CRON_SECRET',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function createError(code: ErrorCode, message: string, statusCode: number = 400, details?: Record<string, unknown>): AppError {
  return new AppError(code, message, statusCode, details);
}

export function handleError(error: unknown): { code: string; message: string; statusCode: number; details?: Record<string, unknown> } {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }
  
  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      statusCode: 500,
    };
  }
  
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}

export function errorResponse(error: unknown) {
  const { code, message, statusCode, details } = handleError(error);
  return Response.json({ error: { code, message, details } }, { status: statusCode });
}

export function successResponse<T>(data: T, statusCode: number = 200) {
  return Response.json({ data }, { status: statusCode });
}
