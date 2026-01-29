// @ai:ag - Created by Antigravity
// Employee data hook

'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmployeeWithRelations } from '@/types';

interface UseEmployeeOptions {
    initialData?: EmployeeWithRelations | null;
}

interface UseEmployeeReturn {
    employee: EmployeeWithRelations | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    updateProfile: (data: Partial<EmployeeWithRelations>) => Promise<boolean>;
}

/**
 * Hook to get and manage current employee data
 */
export function useEmployee(options: UseEmployeeOptions = {}): UseEmployeeReturn {
    const [employee, setEmployee] = useState<EmployeeWithRelations | null>(
        options.initialData ?? null
    );
    const [isLoading, setIsLoading] = useState(!options.initialData);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployee = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/employees/profile');
            const data = await response.json();

            if (data.success) {
                setEmployee(data.data);
            } else {
                setError(data.message || 'Failed to load employee');
            }
        } catch (err) {
            setError('Failed to load employee');
            console.error('Error loading employee:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProfile = useCallback(
        async (updateData: Partial<EmployeeWithRelations>): Promise<boolean> => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch('/api/employees/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                });

                const data = await response.json();

                if (data.success) {
                    setEmployee((prev) => (prev ? { ...prev, ...data.data } : data.data));
                    return true;
                } else {
                    setError(data.message || 'Failed to update profile');
                    return false;
                }
            } catch (err) {
                setError('Failed to update profile');
                console.error('Error updating profile:', err);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!options.initialData) {
            fetchEmployee();
        }
    }, [options.initialData, fetchEmployee]);

    return {
        employee,
        isLoading,
        error,
        refresh: fetchEmployee,
        updateProfile,
    };
}

export type { UseEmployeeReturn };
