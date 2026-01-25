// @ai:ag - Created by Antigravity
// Unit tests for validation utilities

import {
    validateEmail,
    validatePhone,
    validateNIK,
    validateNPWP,
    validatePassword,
    sanitizeInput,
} from '@/utils/validation';

describe('Validation Utilities', () => {
    describe('validateEmail', () => {
        it('should return true for valid emails', () => {
            expect(validateEmail('user@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.id')).toBe(true);
            expect(validateEmail('user+tag@example.com')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('invalid@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('user@domain')).toBe(false);
            expect(validateEmail('')).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should return true for valid Indonesian phone numbers', () => {
            expect(validatePhone('08123456789')).toBe(true);
            expect(validatePhone('081234567890')).toBe(true);
            expect(validatePhone('+6281234567890')).toBe(true);
            expect(validatePhone('6281234567890')).toBe(true);
        });

        it('should return false for invalid phone numbers', () => {
            expect(validatePhone('123')).toBe(false);
            expect(validatePhone('abcdefghij')).toBe(false);
            expect(validatePhone('')).toBe(false);
        });
    });

    describe('validateNIK', () => {
        it('should return true for 16-digit NIK', () => {
            expect(validateNIK('1234567890123456')).toBe(true);
        });

        it('should return false for invalid NIK', () => {
            expect(validateNIK('123456789012345')).toBe(false); // 15 digits
            expect(validateNIK('12345678901234567')).toBe(false); // 17 digits
            expect(validateNIK('abcdefghijklmnop')).toBe(false); // letters
            expect(validateNIK('')).toBe(false);
        });
    });

    describe('validateNPWP', () => {
        it('should return true for valid NPWP formats', () => {
            expect(validateNPWP('12.345.678.9-012.345')).toBe(true);
            expect(validateNPWP('123456789012345')).toBe(true); // 15 digits only
        });

        it('should return false for invalid NPWP', () => {
            expect(validateNPWP('1234567890')).toBe(false);
            expect(validateNPWP('')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should validate password requirements', () => {
            // Valid: 8+ chars, uppercase, lowercase, number
            const result = validatePassword('Password123');
            expect(result.isValid).toBe(true);
        });

        it('should return errors for weak passwords', () => {
            // Too short
            const shortResult = validatePassword('Pass1');
            expect(shortResult.isValid).toBe(false);
            expect(shortResult.errors.length).toBeGreaterThan(0);

            // No uppercase
            const noUpperResult = validatePassword('password123');
            expect(noUpperResult.isValid).toBe(false);

            // No number
            const noNumberResult = validatePassword('Password');
            expect(noNumberResult.isValid).toBe(false);
        });
    });

    describe('sanitizeInput', () => {
        it('should remove HTML tags', () => {
            const result = sanitizeInput('<script>alert("xss")</script>Hello');
            expect(result).not.toContain('<script>');
            expect(result).toContain('Hello');
        });

        it('should trim whitespace', () => {
            const result = sanitizeInput('  hello world  ');
            expect(result).toBe('hello world');
        });

        it('should handle empty strings', () => {
            expect(sanitizeInput('')).toBe('');
        });
    });
});
