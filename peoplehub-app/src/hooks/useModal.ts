// @ai:ag - Created by Antigravity
// Modal state hook

'use client';

import { useState, useCallback } from 'react';

interface UseModalReturn<T = unknown> {
    isOpen: boolean;
    data: T | null;
    open: (data?: T) => void;
    close: () => void;
    toggle: () => void;
    setData: (data: T | null) => void;
}

/**
 * Hook for managing modal state
 */
export function useModal<T = unknown>(initialOpen = false): UseModalReturn<T> {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [data, setData] = useState<T | null>(null);

    const open = useCallback((modalData?: T) => {
        if (modalData !== undefined) {
            setData(modalData);
        }
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // Optional: Clear data on close
        // setData(null);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return {
        isOpen,
        data,
        open,
        close,
        toggle,
        setData,
    };
}

/**
 * Hook for managing confirmation modal
 */
interface UseConfirmModalReturn {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    isDestructive: boolean;
    onConfirm: (() => void) | null;
    open: (options: ConfirmModalOptions) => void;
    close: () => void;
    confirm: () => void;
}

interface ConfirmModalOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
}

export function useConfirmModal(): UseConfirmModalReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [confirmLabel, setConfirmLabel] = useState('Konfirmasi');
    const [cancelLabel, setCancelLabel] = useState('Batal');
    const [isDestructive, setIsDestructive] = useState(false);
    const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

    const open = useCallback((options: ConfirmModalOptions) => {
        setTitle(options.title);
        setMessage(options.message);
        setConfirmLabel(options.confirmLabel ?? 'Konfirmasi');
        setCancelLabel(options.cancelLabel ?? 'Batal');
        setIsDestructive(options.isDestructive ?? false);
        setOnConfirmCallback(() => options.onConfirm);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setOnConfirmCallback(null);
    }, []);

    const confirm = useCallback(() => {
        if (onConfirmCallback) {
            onConfirmCallback();
        }
        close();
    }, [onConfirmCallback, close]);

    return {
        isOpen,
        title,
        message,
        confirmLabel,
        cancelLabel,
        isDestructive,
        onConfirm: onConfirmCallback,
        open,
        close,
        confirm,
    };
}

export type { UseModalReturn, UseConfirmModalReturn, ConfirmModalOptions };
