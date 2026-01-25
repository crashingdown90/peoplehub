// @ai:ag - Created by Antigravity
// Unit tests for currency utilities

import {
    formatCurrency,
    formatCurrencyCompact,
    parseCurrency,
    formatPercent,
} from '@/utils/currency';

describe('Currency Utilities', () => {
    describe('formatCurrency', () => {
        it('should format with Rupiah symbol', () => {
            const result = formatCurrency(5000000);
            expect(result).toContain('Rp');
        });

        it('should format with thousand separators', () => {
            const result = formatCurrency(5000000);
            // Should contain dots as thousand separator (Indonesian format)
            expect(result).toMatch(/5[.,]000[.,]000/);
        });

        it('should handle negative numbers', () => {
            const result = formatCurrency(-5000000);
            expect(result).toContain('-');
        });

        it('should handle zero', () => {
            const result = formatCurrency(0);
            expect(result).toContain('0');
        });

        it('should handle null/undefined gracefully', () => {
            expect(formatCurrency(null as unknown as number)).toBe('Rp0');
            expect(formatCurrency(undefined as unknown as number)).toBe('Rp0');
        });
    });

    describe('formatCurrencyCompact', () => {
        it('should format thousands as K', () => {
            const result = formatCurrencyCompact(5000);
            expect(result.toLowerCase()).toMatch(/5\s*rb|5\s*k|5\.000/i);
        });

        it('should format millions as Jt', () => {
            const result = formatCurrencyCompact(5000000);
            expect(result.toLowerCase()).toMatch(/5\s*jt|5\s*m|5\.000\.000/i);
        });

        it('should format billions as M', () => {
            const result = formatCurrencyCompact(5000000000);
            expect(result.toLowerCase()).toMatch(/5\s*m|5\s*b|5\.000\.000\.000/i);
        });
    });

    describe('parseCurrency', () => {
        it('should parse formatted currency string', () => {
            expect(parseCurrency('Rp5.000.000')).toBe(5000000);
        });

        it('should parse currency with comma', () => {
            expect(parseCurrency('Rp5,000,000')).toBe(5000000);
        });

        it('should handle plain numbers', () => {
            expect(parseCurrency('5000000')).toBe(5000000);
        });

        it('should return 0 for invalid input', () => {
            expect(parseCurrency('')).toBe(0);
            expect(parseCurrency('invalid')).toBe(0);
        });
    });

    describe('formatPercent', () => {
        it('should format as percentage', () => {
            const result = formatPercent(0.75);
            expect(result).toContain('75');
            expect(result).toContain('%');
        });

        it('should handle decimals', () => {
            const result = formatPercent(0.754);
            expect(result).toMatch(/75[,.]?4?%/);
        });

        it('should handle zero', () => {
            const result = formatPercent(0);
            expect(result).toBe('0%');
        });

        it('should handle values > 1', () => {
            const result = formatPercent(1.5);
            expect(result).toContain('150');
        });
    });
});
