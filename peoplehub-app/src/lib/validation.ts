/**
 * Form validation schemas and utilities
 * Centralized validation logic for all forms in the application
 */

// Type definitions for validation
export interface ValidationRule {
    required?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    validate?: (value: unknown, formData?: Record<string, unknown>) => boolean | string;
}

export interface ValidationErrors {
    [key: string]: string;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
    email: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address',
    },
    phone: {
        value: /^(\+62|62|0)[0-9]{9,12}$/,
        message: 'Invalid phone number (use format: +62xxx or 08xxx)',
    },
    alphanumeric: {
        value: /^[a-zA-Z0-9]+$/,
        message: 'Only letters and numbers are allowed',
    },
    noSpecialChars: {
        value: /^[a-zA-Z0-9\s]+$/,
        message: 'Special characters are not allowed',
    },
    url: {
        value: /^https?:\/\/.+/,
        message: 'Invalid URL (must start with http:// or https://)',
    },
    nik: {
        value: /^[0-9]{16}$/,
        message: 'NIK must be exactly 16 digits',
    },
    npwp: {
        value: /^[0-9]{15}$/,
        message: 'NPWP must be exactly 15 digits',
    },
};

// Form validation schemas
export const formSchemas = {
    // Employee Registration
    employeeRegistration: {
        fullName: {
            required: 'Full name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
            maxLength: { value: 100, message: 'Name must not exceed 100 characters' },
        },
        email: {
            required: 'Email is required',
            pattern: VALIDATION_PATTERNS.email,
        },
        phone: {
            required: 'Phone number is required',
            pattern: VALIDATION_PATTERNS.phone,
        },
        nik: {
            required: 'NIK is required',
            pattern: VALIDATION_PATTERNS.nik,
        },
        birthDate: {
            required: 'Birth date is required',
            validate: (value: string) => {
                const age = new Date().getFullYear() - new Date(value).getFullYear();
                return age >= 17 || 'Must be at least 17 years old';
            },
        },
    },

    // Leave Request
    leaveRequest: {
        leaveType: {
            required: 'Leave type is required',
        },
        startDate: {
            required: 'Start date is required',
            validate: (value: string) => {
                const start = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return start >= today || 'Start date cannot be in the past';
            },
        },
        endDate: {
            required: 'End date is required',
            validate: (value: unknown, formData?: Record<string, unknown>) => {
                const startDate = formData?.startDate;
                if (typeof value !== 'string' || typeof startDate !== 'string') return 'Invalid date';
                const start = new Date(startDate);
                const end = new Date(value);
                return end >= start || 'End date must be after start date';
            },
        },
        reason: {
            required: 'Reason is required',
            minLength: { value: 10, message: 'Reason must be at least 10 characters' },
            maxLength: { value: 500, message: 'Reason must not exceed 500 characters' },
        },
    },

    // Attendance Clock In/Out
    attendance: {
        notes: {
            maxLength: { value: 200, message: 'Notes must not exceed 200 characters' },
        },
    },

    // Support Ticket
    supportTicket: {
        title: {
            required: 'Title is required',
            minLength: { value: 5, message: 'Title must be at least 5 characters' },
            maxLength: { value: 100, message: 'Title must not exceed 100 characters' },
        },
        category: {
            required: 'Category is required',
        },
        priority: {
            required: 'Priority is required',
        },
        description: {
            required: 'Description is required',
            minLength: { value: 20, message: 'Description must be at least 20 characters' },
            maxLength: { value: 1000, message: 'Description must not exceed 1000 characters' },
        },
    },

    // Webhook Configuration
    webhook: {
        name: {
            required: 'Webhook name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
        },
        url: {
            required: 'Webhook URL is required',
            pattern: VALIDATION_PATTERNS.url,
        },
        events: {
            validate: (value: string[]) =>
                value.length > 0 || 'At least one event must be selected',
        },
    },

    // Document Upload
    documentUpload: {
        file: {
            required: 'File is required',
            validate: (file: File) => {
                const maxSize = 10 * 1024 * 1024; // 10MB
                return file.size <= maxSize || 'File size must not exceed 10MB';
            },
        },
        category: {
            required: 'Category is required',
        },
    },
};

/**
 * Validate a single field
 */
export function validateField(
    value: unknown,
    rules: ValidationRule,
    formData?: Record<string, unknown>
): string | null {
    // Required validation
    if (rules.required) {
        const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
            return typeof rules.required === 'string' ? rules.required : 'This field is required';
        }
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
        return null;
    }

    // Get length for string or array values
    const valueLength = typeof value === 'string' ? value.length : (Array.isArray(value) ? value.length : 0);
    const stringValue = typeof value === 'string' ? value : String(value);

    // Min length validation
    if (rules.minLength && valueLength < rules.minLength.value) {
        return rules.minLength.message;
    }

    // Max length validation
    if (rules.maxLength && valueLength > rules.maxLength.value) {
        return rules.maxLength.message;
    }

    // Min value validation
    if (rules.min !== undefined && Number(value) < rules.min.value) {
        return rules.min.message;
    }

    // Max value validation
    if (rules.max !== undefined && Number(value) > rules.max.value) {
        return rules.max.message;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.value.test(stringValue)) {
        return rules.pattern.message;
    }

    // Custom validation
    if (rules.validate) {
        const result = rules.validate(value, formData);
        if (typeof result === 'string') {
            return result;
        }
        if (result === false) {
            return 'Validation failed';
        }
    }

    return null;
}

/**
 * Validate entire form
 */
export function validateForm(
    data: Record<string, unknown>,
    schema: Record<string, ValidationRule>
): ValidationErrors {
    const errors: ValidationErrors = {};

    for (const [field, rules] of Object.entries(schema)) {
        const error = validateField(data[field], rules, data);
        if (error) {
            errors[field] = error;
        }
    }

    return errors;
}

/**
 * Check if form has errors
 */
export function hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
}
