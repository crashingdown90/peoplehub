import { NextResponse } from "next/server";

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
}

/**
 * Return a success response
 * @param data Data to return
 * @param status HTTP status code (default 200)
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Return an error response
 * @param code Error code
 * @param message Error message
 * @param status HTTP status code (default 400)
 * @param details Optional additional details
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiResponses = {
  unauthorized: (message = "Authentication required") => 
    errorResponse("UNAUTHORIZED", message, 401),
  
  forbidden: (message = "Access denied") => 
    errorResponse("FORBIDDEN", message, 403),
  
  notFound: (message = "Resource not found") => 
    errorResponse("NOT_FOUND", message, 404),
    
  badRequest: (message = "Invalid request", details?: unknown) => 
    errorResponse("BAD_REQUEST", message, 400, details),
    
  internalError: (message = "Internal server error") => 
    errorResponse("INTERNAL_ERROR", message, 500),
};
