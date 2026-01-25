// @ai:ag - Created by Antigravity
// API response and request types

import { PaginationParams } from './common.types';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    stack?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * API request with pagination
 */
export interface PaginatedRequest extends PaginationParams {
    search?: string;
    filters?: Record<string, string | string[] | boolean | number>;
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest {
    ids: string[];
    action: string;
    data?: Record<string, unknown>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
    success: boolean;
    processed: number;
    failed: number;
    errors?: Array<{
        id: string;
        error: string;
    }>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
    success: boolean;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
}

/**
 * Generic mutation result
 */
export interface MutationResult<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}
