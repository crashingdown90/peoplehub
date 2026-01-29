// @ai:cl - Service layer shared types

/**
 * Standard service response wrapper
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  meta?: ResponseMeta;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Create success response
 */
export function success<T>(data: T, meta?: ResponseMeta): ServiceResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Create error response
 */
export function error(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ServiceResponse<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Create paginated response
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ServiceResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",

  // Business logic errors
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  OUTSIDE_GEOFENCE: "OUTSIDE_GEOFENCE",
  ALREADY_CLOCKED_IN: "ALREADY_CLOCKED_IN",
  NOT_CLOCKED_IN: "NOT_CLOCKED_IN",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  CANNOT_MODIFY: "CANNOT_MODIFY",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
