// @ai:ag - Created by Antigravity
// Validation utility functions

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (Indonesian format)
 */
const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

/**
 * NIK validation regex (16 digits)
 */
const NIK_REGEX = /^\d{16}$/;

/**
 * NPWP validation regex (15 digits with dots and dashes)
 */
const NPWP_REGEX = /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/;
const NPWP_DIGITS_ONLY_REGEX = /^\d{15}$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate Indonesian phone number
 */
export function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '');
    return PHONE_REGEX.test(cleaned);
}

/**
 * Normalize phone number to +62 format
 */
export function normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s-]/g, '');

    if (cleaned.startsWith('0')) {
        cleaned = '+62' + cleaned.slice(1);
    } else if (cleaned.startsWith('62')) {
        cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+62')) {
        cleaned = '+62' + cleaned;
    }

    return cleaned;
}

/**
 * Validate NIK (Nomor Induk Kependudukan)
 */
export function validateNIK(nik: string): boolean {
    const cleaned = nik.replace(/\s/g, '');
    return NIK_REGEX.test(cleaned);
}

/**
 * Validate NPWP format
 */
export function validateNPWP(npwp: string): boolean {
    const trimmed = npwp.trim();
    return NPWP_REGEX.test(trimmed) || NPWP_DIGITS_ONLY_REGEX.test(trimmed.replace(/\s/g, ''));
}

/**
 * Format NPWP with dots and dashes
 */
export function formatNPWP(npwp: string): string {
    const digits = npwp.replace(/\D/g, '');

    if (digits.length !== 15) return npwp;

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12, 15)}`;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Minimal 8 karakter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Harus mengandung huruf kapital');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Harus mengandung huruf kecil');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Harus mengandung angka');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate required field
 */
export function isRequired(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * Validate minimum length
 */
export function minLength(value: string, min: number): boolean {
    return value.length >= min;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string, max: number): boolean {
    return value.length <= max;
}

/**
 * Validate number range
 */
export function inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Validate date is in future
 */
export function isFutureDate(date: Date | string): boolean {
    return new Date(date) > new Date();
}

/**
 * Validate date is in past
 */
export function isPastDate(date: Date | string): boolean {
    return new Date(date) < new Date();
}

/**
 * Validate file size
 */
export function validateFileSize(
    file: File,
    maxSizeBytes: number
): boolean {
    return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function validateFileType(
    file: File,
    allowedTypes: string[]
): boolean {
    return allowedTypes.includes(file.type);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
