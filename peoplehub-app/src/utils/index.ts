// @ai:ag - Created by Antigravity
// Barrel export for all utilities

// Class name utility
export { cn } from './cn';

// Date utilities
export {
    formatDate,
    formatTime,
    formatDateTime,
    formatDateForInput,
    formatTimeForInput,
    getDaysBetween,
    isWeekend,
    isWorkday,
    getWorkDaysInMonth,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    getRelativeTime,
    parseTimeToMinutes,
    formatMinutesToTime,
    calculateDuration,
    getPeriodString,
    formatPeriod,
} from './date';

// Currency utilities
export {
    formatCurrency,
    formatNumber,
    formatDecimal,
    parseCurrency,
    formatCompact,
    formatCurrencyInput,
    calculatePercentage,
    formatPercentage,
} from './currency';

// Validation utilities
export {
    validateEmail,
    validatePhone,
    normalizePhone,
    validateNIK,
    validateNPWP,
    formatNPWP,
    validatePassword,
    isRequired,
    minLength,
    maxLength,
    inRange,
    isFutureDate,
    isPastDate,
    validateFileSize,
    validateFileType,
} from './validation';

// Format utilities
export {
    getInitials,
    slugify,
    capitalize,
    capitalizeWords,
    truncate,
    normalizeWhitespace,
    formatPhoneDisplay,
    maskString,
    generateRandomString,
    pluralize,
    formatEmployeeNumber,
    stripHtml,
    highlightText,
} from './format';

// Common helpers
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

export function throttle<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => {
        delete result[key];
    });
    return result as Omit<T, K>;
}

/**
 * Extract error message from unknown error type
 * Useful for catch blocks where error type is unknown
 */
export function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        return String((err as { message: unknown }).message);
    }
    if (typeof err === 'string') return err;
    return fallback;
}
