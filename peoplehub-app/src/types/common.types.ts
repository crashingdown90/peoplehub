// @ai:ag - Created by Antigravity
// Common type definitions for PeopleHub

/**
 * Generic select option for dropdowns
 */
export interface SelectOption<T = string> {
    value: T;
    label: string;
    disabled?: boolean;
}

/**
 * Date range for filters and pickers
 */
export interface DateRange {
    startDate: Date | string;
    endDate: Date | string;
}

/**
 * Pagination params
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Base entity with common fields
 */
export interface BaseEntity {
    id: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
}

/**
 * With tenant ID
 */
export interface TenantEntity extends BaseEntity {
    tenantId: string;
}

/**
 * Filter base type
 */
export interface FilterParams {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T) => React.ReactNode;
}

/**
 * Modal state
 */
export interface ModalState {
    isOpen: boolean;
    data?: unknown;
}

/**
 * Toast notification
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}
