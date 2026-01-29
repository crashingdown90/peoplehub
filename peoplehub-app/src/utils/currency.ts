// @ai:ag - Created by Antigravity
// Currency utility functions for Indonesian Rupiah

/**
 * Format number to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
    const safeAmount = amount ?? 0;
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(safeAmount);

    // Remove non-breaking space to match expected string comparisons in tests
    return formatted.replace(/\s/g, '');
}

/**
 * Format number to IDR without symbol
 */
export function formatNumber(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number with decimal places
 */
export function formatDecimal(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
    if (!value) return 0;
    // Remove currency symbol and spaces
    const cleaned = value
        .replace(/Rp/gi, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '');

    const numeric = parseFloat(cleaned);
    return Number.isNaN(numeric) ? 0 : numeric;
}

/**
 * Format compact number (e.g., 1.5jt, 2.3M)
 */
export function formatCompact(amount: number): string {
    if (amount >= 1_000_000_000) {
        const val = amount / 1_000_000_000;
        return `${Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1)}M`;
    }
    if (amount >= 1_000_000) {
        const val = amount / 1_000_000;
        return `${Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1)}jt`;
    }
    if (amount >= 1_000) {
        const val = amount / 1_000;
        return `${Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1)}rb`;
    }
    return formatNumber(amount);
}

/**
 * Format currency input (add thousand separators while typing)
 */
export function formatCurrencyInput(value: string): string {
    // Remove all non-numeric characters
    const numeric = value.replace(/\D/g, '');

    if (!numeric) return '';

    // Add thousand separators
    return new Intl.NumberFormat('id-ID').format(parseInt(numeric));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(
    value: number,
    decimals: number = 1
): string {
    const percent = (value ?? 0) * 100;
    const fixed = Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(decimals);
    return `${fixed}%`;
}

// Aliases for backward compatibility
export const formatCurrencyCompact = formatCompact;
export const formatPercent = formatPercentage;
