// @ai:cl - Centralized locale constants for consistent formatting

/**
 * Default locale for the application (Indonesian)
 */
export const DEFAULT_LOCALE = 'id-ID';

/**
 * Date format options for various contexts
 */
export const DATE_FORMAT = {
    /** Full date: Senin, 1 Januari 2024 */
    FULL: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    } as Intl.DateTimeFormatOptions,

    /** Long date: 1 Januari 2024 */
    LONG: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    } as Intl.DateTimeFormatOptions,

    /** Short date: 1 Jan 2024 */
    SHORT: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    } as Intl.DateTimeFormatOptions,

    /** Date with time: 1 Jan 2024, 14:30 */
    WITH_TIME: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    } as Intl.DateTimeFormatOptions,

    /** Time only: 14:30 */
    TIME_ONLY: {
        hour: '2-digit',
        minute: '2-digit',
    } as Intl.DateTimeFormatOptions,

    /** ISO date: 2024-01-01 */
    ISO: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    } as Intl.DateTimeFormatOptions,
};

/**
 * Format a date using the default locale
 */
export function formatDate(
    date: Date | string,
    format: keyof typeof DATE_FORMAT = 'LONG'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMAT[format]);
}

/**
 * Format a date with time using the default locale
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMAT.WITH_TIME);
}

/**
 * Currency format options
 */
export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
};

/**
 * Format a number as Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
    return amount.toLocaleString(DEFAULT_LOCALE, CURRENCY_FORMAT);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
    return num.toLocaleString(DEFAULT_LOCALE);
}
