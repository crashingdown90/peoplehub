// @ai:ag - Created by Antigravity
// Application configuration constants

/**
 * Application configuration
 */
export const APP_CONFIG = {
    name: 'PeopleHub',
    description: 'Multi-tenant HR Management System',
    version: '1.0.0',
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    dateFormat: 'dd MMMM yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'dd MMMM yyyy HH:mm',
    currency: 'IDR',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
    pageSizeOptions: [10, 25, 50, 100],
} as const;

/**
 * File upload configuration
 */
export const FILE_UPLOAD = {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxSizeLabel: '5MB',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    allowedDocExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
} as const;

/**
 * Attendance configuration
 */
export const ATTENDANCE_CONFIG = {
    lateToleranceMinutes: 15,
    earlyLeaveToleranceMinutes: 15,
    minimumWorkHours: 8,
    overtimeMinimumMinutes: 30,
    geofenceDefaultRadius: 500, // meters
    photoRequired: true,
    locationRequired: true,
} as const;

/**
 * Leave configuration
 */
export const LEAVE_CONFIG = {
    defaultAnnualBalance: 12,
    minRequestDays: 1,
    maxRequestDays: 30,
    advanceNoticeDays: 3, // Minimum days before leave starts
    requiresAttachmentForDays: 3, // Require attachment if leave > N days
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    updateAge: 60 * 60, // 1 hour in seconds
    cookieName: 'peoplehub.session',
} as const;

/**
 * Toast notification configuration
 */
export const TOAST_CONFIG = {
    defaultDuration: 5000, // 5 seconds
    successDuration: 3000,
    errorDuration: 7000,
    position: 'top-right',
} as const;

/**
 * Debounce/throttle delays
 */
export const DEBOUNCE_DELAYS = {
    search: 300,
    input: 200,
    resize: 150,
    scroll: 100,
} as const;

/**
 * Animation durations
 */
export const ANIMATION_DURATIONS = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

/**
 * Breakpoints (matching Tailwind CSS)
 */
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

/**
 * Employment type labels in Indonesian
 */
export const EMPLOYMENT_TYPE_LABELS = {
    PERMANENT: 'Karyawan Tetap',
    CONTRACT: 'Kontrak',
    FREELANCE: 'Freelance',
} as const;

/**
 * Work mode labels in Indonesian
 */
export const WORK_MODE_LABELS = {
    WFO: 'Work From Office',
    WFH: 'Work From Home',
    HYBRID: 'Hybrid',
} as const;
