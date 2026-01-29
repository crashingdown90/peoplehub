// @ai:ag - Created by Antigravity
// Component-related types

import { ReactNode } from 'react';

// ==========================================
// BUTTON TYPES
// ==========================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// ==========================================
// INPUT TYPES
// ==========================================

export type InputType =
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local';

export interface InputFieldProps {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

// ==========================================
// FORM TYPES
// ==========================================

export interface FormFieldConfig {
    name: string;
    label: string;
    type: InputType | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
    };
}

// ==========================================
// TABLE TYPES
// ==========================================

// Note: TableColumn is defined in common.types.ts

export interface TableAction<T> {
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    variant?: ButtonVariant;
    show?: (row: T) => boolean;
    disabled?: (row: T) => boolean;
}

// ==========================================
// MODAL TYPES
// ==========================================

export interface ModalSize {
    sm: 'max-w-sm';
    md: 'max-w-md';
    lg: 'max-w-lg';
    xl: 'max-w-xl';
    full: 'max-w-full';
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: keyof ModalSize;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    children: ReactNode;
    footer?: ReactNode;
}

// ==========================================
// CARD TYPES
// ==========================================

export interface CardProps {
    title?: string;
    description?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    className?: string;
    children: ReactNode;
}

// ==========================================
// BADGE TYPES
// ==========================================

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

export interface BadgeProps {
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    dot?: boolean;
    children: ReactNode;
}

// ==========================================
// DROPDOWN TYPES
// ==========================================

export interface DropdownItem {
    label: string;
    value: string;
    icon?: ReactNode;
    disabled?: boolean;
    destructive?: boolean;
    separator?: boolean;
    onClick?: () => void;
}

export interface DropdownMenuProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
}

// ==========================================
// TABS TYPES
// ==========================================

export interface TabItem {
    id: string;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
    badge?: string | number;
    content: ReactNode;
}

export interface TabsProps {
    tabs: TabItem[];
    defaultTab?: string;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'pills' | 'underline';
}

// ==========================================
// AVATAR TYPES
// ==========================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: AvatarSize;
    status?: 'online' | 'offline' | 'busy' | 'away';
    className?: string;
}

// ==========================================
// SKELETON TYPES
// ==========================================

export interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    circle?: boolean;
    count?: number;
    className?: string;
}

// ==========================================
// EMPTY STATE TYPES
// ==========================================

export interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// ==========================================
// STAT CARD TYPES
// ==========================================

export interface StatCardProps {
    label: string;
    value: string | number;
    change?: {
        value: number;
        trend: 'up' | 'down' | 'neutral';
    };
    icon?: ReactNode;
    description?: string;
}
