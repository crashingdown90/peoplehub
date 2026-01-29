// @ai:ag - Created by Antigravity
// String formatting utility functions

/**
 * Get initials from name
 */
export function getInitials(name: string, maxLength: number = 2): string {
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, maxLength);
}

/**
 * Convert string to slug
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter (preserves rest of string)
 */
export function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Capitalize each word
 */
export function capitalizeWords(text: string): string {
    return text.split(' ').map(capitalize).join(' ');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Remove extra whitespace
 */
export function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Format as +62 8XX-XXXX-XXXX
    if (digits.startsWith('62')) {
        const local = digits.slice(2);
        if (local.length >= 10) {
            return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
        }
    }

    // Format as 08XX-XXXX-XXXX
    if (digits.startsWith('0')) {
        if (digits.length >= 10) {
            return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
        }
    }

    return phone;
}

/**
 * Mask sensitive data (e.g., bank account)
 */
export function maskString(
    text: string,
    visibleStart = 4,
    visibleEnd = 4,
    maskChar = '*'
): string {
    if (text.length <= visibleStart + visibleEnd) return text;

    const start = text.slice(0, visibleStart);
    const end = text.slice(-visibleEnd);
    const masked = maskChar.repeat(text.length - visibleStart - visibleEnd);

    return start + masked + end;
}

/**
 * Generate random string
 */
export function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Pluralize Indonesian word (simple version)
 */
export function pluralize(word: string, count: number): string {
    // Indonesian doesn't have plural forms, but we can use "X item"
    return count === 1 ? word : word;
}

/**
 * Format employee number
 */
export function formatEmployeeNumber(branchCode: string, sequence: number): string {
    return `${branchCode}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Extract text content from HTML
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Highlight search term in text
 */
export function highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}
