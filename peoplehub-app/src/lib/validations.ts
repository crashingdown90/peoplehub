// @ai:ag - Refactored by Antigravity
// Legacy validations file - Re-exports from @/validations for backward compatibility

// Re-export all validation schemas from centralized location
export {
    // Auth schemas
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    type RegisterInput,
    type LoginInput,
    type ForgotPasswordInput,
    type ResetPasswordInput,

    // Employee schemas
    updateProfileSchema,
    type UpdateProfileInput,

    // Leave schemas
    leaveRequestSchema,
    type LeaveRequestInput,

    // Attendance schemas
    clockInSchema,
    attendanceCorrectionSchema,
    type ClockInInput,
    type AttendanceCorrectionInput,
} from '@/validations';
