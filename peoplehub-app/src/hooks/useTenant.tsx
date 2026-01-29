// @ai:ag - Created by Antigravity
// Tenant context hook

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantBranding } from '@/types';

interface TenantContextValue {
    tenant: Tenant | null;
    branding: TenantBranding | null;
    isLoading: boolean;
    error: string | null;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
    children: ReactNode;
    initialTenant?: Tenant | null;
}

/**
 * Tenant provider component
 */
export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
    const [tenant, setTenant] = useState<Tenant | null>(initialTenant ?? null);
    const [isLoading, setIsLoading] = useState(!initialTenant);
    const [error, setError] = useState<string | null>(null);

    const branding = tenant?.branding ?? null;

    const refreshTenant = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/tenant');
            const data = await response.json();

            if (data.success) {
                setTenant(data.data);
            } else {
                setError(data.message || 'Failed to load tenant');
            }
        } catch (err) {
            setError('Failed to load tenant');
            console.error('Error loading tenant:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!initialTenant) {
            refreshTenant();
        }
    }, [initialTenant]);

    const contextValue: TenantContextValue = {
        tenant,
        branding,
        isLoading,
        error,
        refreshTenant,
    };

    return (
        <TenantContext.Provider value={contextValue}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * Hook to access tenant context
 */
export function useTenant(): TenantContextValue {
    const context = useContext(TenantContext);

    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }

    return context;
}

export type UseTenantReturn = ReturnType<typeof useTenant>;
