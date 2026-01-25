/**
 * Custom Error Classes for PeopleHub HRIS
 * 
 * Centralized error definitions for consistent error handling
 * across the application.
 */

/**
 * Base application error
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
    }
}

export class SessionExpiredError extends AppError {
    constructor(message: string = 'Session has expired') {
        super(message, 'SESSION_EXPIRED', 401);
    }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 'VALIDATION_ERROR', 400, details);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404);
    }
}

export class DuplicateEntryError extends AppError {
    constructor(field: string) {
        super(`${field} already exists`, 'DUPLICATE_ENTRY', 409);
    }
}

// ============================================================================
// Attendance Specific Errors
// ============================================================================

export class AlreadyClockedInError extends AppError {
    constructor(clockInTime: string) {
        super(
            `Anda sudah clock in hari ini pada ${clockInTime}`,
            'ALREADY_CLOCKED_IN',
            422,
            { clockInTime }
        );
    }
}

export class FaceDetectionError extends AppError {
    constructor(message: string = 'Wajah tidak terdeteksi', details?: unknown) {
        super(message, 'FACE_DETECTION_FAILED', 422, details);
    }
}

export class LivenessValidationError extends AppError {
    constructor(score: number, requiredScore: number = 0.80) {
        super(
            'Verifikasi liveness gagal. Silakan coba lagi.',
            'LIVENESS_FAILED',
            422,
            { livenessScore: score, requiredScore }
        );
    }
}

export class GeofenceViolationError extends AppError {
    constructor(distance: number, allowedRadius: number) {
        super(
            `Lokasi Anda di luar area kantor (${distance}m dari kantor)`,
            'GEOFENCE_VIOLATION',
            422,
            { distanceMeters: distance, allowedRadiusMeters: allowedRadius }
        );
    }
}

export class EmployeeInactiveError extends AppError {
    constructor() {
        super('Status karyawan tidak aktif', 'EMPLOYEE_INACTIVE', 403);
    }
}

export class NotWorkDayError extends AppError {
    constructor(message: string = 'Clock in hanya diizinkan pada hari kerja') {
        super(message, 'NOT_WORK_DAY', 422);
    }
}

export class OutsideClockInWindowError extends AppError {
    constructor(message: string) {
        super(message, 'OUTSIDE_CLOCK_IN_WINDOW', 422);
    }
}

// ============================================================================
// File Upload Errors
// ============================================================================

export class PhotoUploadError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 'PHOTO_UPLOAD_FAILED', 422, details);
    }
}

export class FileTooLargeError extends AppError {
    constructor(size: number, maxSize: number) {
        super(
            `Ukuran foto terlalu besar (${Math.round(size / 1024)}KB). Maksimal ${Math.round(maxSize / 1024)}KB`,
            'FILE_TOO_LARGE',
            422,
            { sizeBytes: size, maxSizeBytes: maxSize }
        );
    }
}

export class InvalidFileTypeError extends AppError {
    constructor(type: string, allowedTypes: string[]) {
        super(
            `Format file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`,
            'INVALID_FILE_TYPE',
            422,
            { fileType: type, allowedTypes }
        );
    }
}

// ============================================================================
// Leave & Request Errors
// ============================================================================

export class InsufficientBalanceError extends AppError {
    constructor(requestedDays: number, remainingBalance: number) {
        super(
            'Saldo cuti tidak mencukupi',
            'INSUFFICIENT_BALANCE',
            422,
            { requestedDays, remainingBalance }
        );
    }
}

export class PendingApprovalError extends AppError {
    constructor(message: string = 'Masih ada request yang pending approval') {
        super(message, 'PENDING_APPROVAL', 422);
    }
}

export class InvalidStatusError extends AppError {
    constructor(message: string) {
        super(message, 'INVALID_STATUS', 422);
    }
}

// ============================================================================
// System Errors
// ============================================================================

export class RateLimitError extends AppError {
    constructor(retryAfter?: number) {
        super(
            'Terlalu banyak request. Silakan coba lagi nanti.',
            'RATE_LIMITED',
            429,
            retryAfter ? { retryAfter } : undefined
        );
    }
}

export class MaintenanceModeError extends AppError {
    constructor() {
        super(
            'Sistem sedang dalam maintenance. Silakan coba lagi nanti.',
            'MAINTENANCE_MODE',
            503
        );
    }
}

export class InternalError extends AppError {
    constructor(message: string = 'Terjadi kesalahan pada server') {
        super(message, 'INTERNAL_ERROR', 500);
    }
}
