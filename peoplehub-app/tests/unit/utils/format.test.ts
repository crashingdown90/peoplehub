// @ai:ag - Created by Antigravity
// Unit tests for format utilities

import { getInitials, slugify, truncate, maskString, capitalize } from '@/utils/format';

describe('Format Utilities', () => {
    describe('getInitials', () => {
        it('should return initials from full name', () => {
            expect(getInitials('John Doe')).toBe('JD');
            expect(getInitials('Ahmad Budi Cahyono')).toBe('AB');
        });

        it('should handle single name', () => {
            expect(getInitials('John')).toBe('J');
        });

        it('should handle empty string', () => {
            expect(getInitials('')).toBe('');
        });

        it('should handle max length', () => {
            expect(getInitials('John Doe', 1)).toBe('J');
            expect(getInitials('John Doe', 3)).toBe('JD');
        });
    });

    describe('slugify', () => {
        it('should convert to lowercase kebab-case', () => {
            expect(slugify('Hello World')).toBe('hello-world');
            expect(slugify('My Blog Post')).toBe('my-blog-post');
        });

        it('should handle special characters', () => {
            expect(slugify('Hello! World?')).toBe('hello-world');
            expect(slugify('Price: $100')).toBe('price-100');
        });

        it('should handle multiple spaces', () => {
            expect(slugify('hello   world')).toBe('hello-world');
        });

        it('should handle leading/trailing dashes', () => {
            expect(slugify('--hello--')).toBe('hello');
        });
    });

    describe('truncate', () => {
        it('should truncate long text', () => {
            const result = truncate('This is a very long text', 10);
            expect(result.length).toBeLessThanOrEqual(13); // 10 + '...'
            expect(result.endsWith('...')).toBe(true);
        });

        it('should not truncate short text', () => {
            const result = truncate('Short', 10);
            expect(result).toBe('Short');
        });

        it('should handle empty string', () => {
            expect(truncate('', 10)).toBe('');
        });

        it('should use custom suffix', () => {
            const result = truncate('Hello world', 5, '…');
            expect(result).toContain('…');
        });
    });

    describe('maskString', () => {
        it('should mask middle part of string', () => {
            const result = maskString('1234567890', 2, 2);
            expect(result.startsWith('12')).toBe(true);
            expect(result.endsWith('90')).toBe(true);
            expect(result).toContain('*');
        });

        it('should mask email', () => {
            const result = maskString('user@example.com', 2, 4);
            expect(result.startsWith('us')).toBe(true);
            expect(result.endsWith('.com')).toBe(true);
        });

        it('should handle short strings', () => {
            const result = maskString('hi', 1, 1);
            expect(result).toBe('hi');
        });
    });

    describe('capitalize', () => {
        it('should capitalize first letter', () => {
            expect(capitalize('hello')).toBe('Hello');
            expect(capitalize('world')).toBe('World');
        });

        it('should handle empty string', () => {
            expect(capitalize('')).toBe('');
        });

        it('should handle already capitalized', () => {
            expect(capitalize('Hello')).toBe('Hello');
        });

        it('should handle all caps', () => {
            expect(capitalize('HELLO')).toBe('HELLO');
        });
    });
});
