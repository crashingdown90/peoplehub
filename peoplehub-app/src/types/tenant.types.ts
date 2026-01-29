// @ai:ag - Created by Antigravity
// Tenant related types

import { TenantEntity } from './common.types';

/**
 * Tenant branding configuration
 */
export interface TenantBranding {
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
    tagline?: string;
}

/**
 * Tenant data
 */
export interface Tenant {
    id: string;
    name: string;
    domain?: string | null;
    branding?: TenantBranding | null;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Tenant with stats
 */
export interface TenantWithStats extends Tenant {
    _count?: {
        users: number;
        employees: number;
        branches: number;
        departments: number;
    };
}

/**
 * Branch data
 */
export interface Branch extends TenantEntity {
    code: string;
    name: string;
    address?: string | null;
    city?: string | null;
    timezone: string;
    latitude?: number | null;
    longitude?: number | null;
    geofenceRadiusMeters?: number | null;
    isActive: boolean;
}

/**
 * Department data
 */
export interface Department extends TenantEntity {
    branchId?: string | null;
    code: string;
    name: string;
    isActive: boolean;
    branch?: Branch | null;
}

/**
 * Position data
 */
export interface Position extends TenantEntity {
    code: string;
    name: string;
    level: number;
    isActive: boolean;
}

/**
 * Shift data
 */
export interface Shift extends TenantEntity {
    name: string;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    breakMinutes: number;
    isFlexible: boolean;
    isActive: boolean;
}

/**
 * Create/Update tenant request
 */
export interface CreateTenantRequest {
    name: string;
    domain?: string;
    branding?: TenantBranding;
}

export interface UpdateTenantRequest extends Partial<CreateTenantRequest> {
    isActive?: boolean;
}
