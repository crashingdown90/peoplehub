// @ai:ag - Created by Antigravity
// Unit tests for useModal hook

import { renderHook, act } from '@testing-library/react';
import { useModal, useConfirmModal } from '@/hooks/useModal';

describe('useModal Hook', () => {
    describe('useModal', () => {
        it('should initialize as closed', () => {
            const { result } = renderHook(() => useModal());
            expect(result.current.isOpen).toBe(false);
            expect(result.current.data).toBeNull();
        });

        it('should initialize as open when specified', () => {
            const { result } = renderHook(() => useModal(true));
            expect(result.current.isOpen).toBe(true);
        });

        it('should open modal', () => {
            const { result } = renderHook(() => useModal());

            act(() => {
                result.current.open();
            });

            expect(result.current.isOpen).toBe(true);
        });

        it('should open modal with data', () => {
            const { result } = renderHook(() => useModal<{ id: number }>());

            act(() => {
                result.current.open({ id: 123 });
            });

            expect(result.current.isOpen).toBe(true);
            expect(result.current.data).toEqual({ id: 123 });
        });

        it('should close modal', () => {
            const { result } = renderHook(() => useModal(true));

            act(() => {
                result.current.close();
            });

            expect(result.current.isOpen).toBe(false);
        });

        it('should toggle modal', () => {
            const { result } = renderHook(() => useModal());

            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(true);

            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(false);
        });

        it('should set data', () => {
            const { result } = renderHook(() => useModal<string>());

            act(() => {
                result.current.setData('test');
            });

            expect(result.current.data).toBe('test');
        });
    });

    describe('useConfirmModal', () => {
        it('should initialize as closed', () => {
            const { result } = renderHook(() => useConfirmModal());
            expect(result.current.isOpen).toBe(false);
        });

        it('should open with options', () => {
            const onConfirm = jest.fn();
            const { result } = renderHook(() => useConfirmModal());

            act(() => {
                result.current.open({
                    title: 'Confirm Delete',
                    message: 'Are you sure?',
                    onConfirm,
                });
            });

            expect(result.current.isOpen).toBe(true);
            expect(result.current.title).toBe('Confirm Delete');
            expect(result.current.message).toBe('Are you sure?');
        });

        it('should use default labels', () => {
            const { result } = renderHook(() => useConfirmModal());

            act(() => {
                result.current.open({
                    title: 'Test',
                    message: 'Test',
                    onConfirm: jest.fn(),
                });
            });

            expect(result.current.confirmLabel).toBe('Konfirmasi');
            expect(result.current.cancelLabel).toBe('Batal');
        });

        it('should call onConfirm when confirmed', () => {
            const onConfirm = jest.fn();
            const { result } = renderHook(() => useConfirmModal());

            act(() => {
                result.current.open({
                    title: 'Test',
                    message: 'Test',
                    onConfirm,
                });
            });

            act(() => {
                result.current.confirm();
            });

            expect(onConfirm).toHaveBeenCalled();
            expect(result.current.isOpen).toBe(false);
        });

        it('should close on close', () => {
            const { result } = renderHook(() => useConfirmModal());

            act(() => {
                result.current.open({
                    title: 'Test',
                    message: 'Test',
                    onConfirm: jest.fn(),
                });
            });

            act(() => {
                result.current.close();
            });

            expect(result.current.isOpen).toBe(false);
        });
    });
});
