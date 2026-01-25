// @ai:ag - Created by Antigravity
// Form hook for managing form state and validation

'use client';

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
    initialValues: T;
    schema?: z.ZodSchema<T>;
    onSubmit?: (values: T) => Promise<void> | void;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

interface UseFormReturn<T> {
    values: T;
    errors: FormErrors<T>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
    setValue: <K extends keyof T>(field: K, value: T[K]) => void;
    setValues: (values: Partial<T>) => void;
    setError: (field: keyof T, message: string) => void;
    clearError: (field: keyof T) => void;
    clearErrors: () => void;
    handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBlur: (field: keyof T) => () => void;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    reset: () => void;
    validate: () => boolean;
    getFieldProps: (field: keyof T) => {
        value: T[keyof T];
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
        onBlur: () => void;
        name: string;
    };
}

/**
 * Hook for managing form state with Zod validation
 */
export function useForm<T extends Record<string, unknown>>(
    options: UseFormOptions<T>
): UseFormReturn<T> {
    const {
        initialValues,
        schema,
        onSubmit,
        validateOnChange = false,
        validateOnBlur = true,
    } = options;

    const [values, setValuesState] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if form has been modified
    const isDirty = useMemo(() => {
        return JSON.stringify(values) !== JSON.stringify(initialValues);
    }, [values, initialValues]);

    // Validate single field
    const validateField = useCallback(
        (field: keyof T, value: unknown): string | undefined => {
            if (!schema) return undefined;

            try {
                const partialSchema = z.object({ [field]: (schema as z.ZodObject<z.ZodRawShape>).shape[field as string] });
                partialSchema.parse({ [field]: value });
                return undefined;
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return err.issues[0]?.message;
                }
                return undefined;
            }
        },
        [schema]
    );

    // Validate all fields
    const validate = useCallback((): boolean => {
        if (!schema) return true;

        try {
            schema.parse(values);
            setErrors({});
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                const newErrors: FormErrors<T> = {};
                err.issues.forEach((issue) => {
                    const field = issue.path[0] as keyof T;
                    if (!newErrors[field]) {
                        newErrors[field] = issue.message;
                    }
                });
                setErrors(newErrors);
            }
            return false;
        }
    }, [schema, values]);

    // Check if form is valid
    const isValid = useMemo(() => {
        if (!schema) return true;
        try {
            schema.parse(values);
            return true;
        } catch {
            return false;
        }
    }, [schema, values]);

    // Set single field value
    const setValue = useCallback(
        <K extends keyof T>(field: K, value: T[K]) => {
            setValuesState((prev) => ({ ...prev, [field]: value }));

            if (validateOnChange) {
                const error = validateField(field, value);
                setErrors((prev) => ({
                    ...prev,
                    [field]: error,
                }));
            }
        },
        [validateOnChange, validateField]
    );

    // Set multiple values
    const setValues = useCallback((newValues: Partial<T>) => {
        setValuesState((prev) => ({ ...prev, ...newValues }));
    }, []);

    // Set error for field
    const setError = useCallback((field: keyof T, message: string) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    }, []);

    // Clear error for field
    const clearError = useCallback((field: keyof T) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    // Clear all errors
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Handle input change
    const handleChange = useCallback(
        (field: keyof T) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                const value = e.target.type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : e.target.value;
                setValue(field, value as T[keyof T]);
            },
        [setValue]
    );

    // Handle input blur
    const handleBlur = useCallback(
        (field: keyof T) => () => {
            setTouched((prev) => ({ ...prev, [field]: true }));

            if (validateOnBlur) {
                const error = validateField(field, values[field]);
                setErrors((prev) => ({
                    ...prev,
                    [field]: error,
                }));
            }
        },
        [validateOnBlur, validateField, values]
    );

    // Handle form submit
    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();

            // Mark all fields as touched
            const allTouched: Partial<Record<keyof T, boolean>> = {};
            Object.keys(values).forEach((key) => {
                allTouched[key as keyof T] = true;
            });
            setTouched(allTouched);

            // Validate
            if (!validate()) {
                return;
            }

            // Submit
            if (onSubmit) {
                setIsSubmitting(true);
                try {
                    await onSubmit(values);
                } finally {
                    setIsSubmitting(false);
                }
            }
        },
        [values, validate, onSubmit]
    );

    // Reset form
    const reset = useCallback(() => {
        setValuesState(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    // Get field props for input
    const getFieldProps = useCallback(
        (field: keyof T) => ({
            value: values[field],
            onChange: handleChange(field),
            onBlur: handleBlur(field),
            name: field as string,
        }),
        [values, handleChange, handleBlur]
    );

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isDirty,
        setValue,
        setValues,
        setError,
        clearError,
        clearErrors,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        validate,
        getFieldProps,
    };
}

export type { UseFormOptions, UseFormReturn, FormErrors };
