// @ai:ag - Created by Antigravity
// Delegation Form component for creating new delegations
'use client';

import React, { useState } from 'react';
import type { ApprovalType, DelegationFormData } from '@/types/delegation.types';

interface DelegationFormProps {
    /**
     * Available approvers to delegate to
     */
    availableApprovers: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
    }>;

    /**
     * On submit callback
     */
    onSubmit: (data: DelegationFormData) => Promise<void>;

    /**
     * On cancel callback
     */
    onCancel: () => void;

    /**
     * Whether form is submitting
     */
    isSubmitting?: boolean;
}

const APPROVAL_TYPE_OPTIONS: { value: ApprovalType; label: string }[] = [
    { value: 'LEAVE', label: 'Cuti' },
    { value: 'ATTENDANCE_CORRECTION', label: 'Koreksi Absensi' },
    { value: 'TRAVEL', label: 'Perjalanan Dinas' },
    { value: 'EXPENSE', label: 'Expense / Reimburse' },
    { value: 'OVERTIME', label: 'Lembur' },
    { value: 'LETTER', label: 'Surat-surat' },
    { value: 'ALL', label: 'Semua Jenis' },
];

/**
 * Format date for input
 */
function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Delegation Form Component
 */
export function DelegationForm({
    availableApprovers,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: DelegationFormProps) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [formData, setFormData] = useState<DelegationFormData>({
        delegateeId: '',
        startDate: tomorrow,
        endDate: tomorrow,
        approvalTypes: [],
        reason: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.delegateeId) {
            newErrors.delegateeId = 'Pilih penerima delegasi';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Pilih tanggal mulai';
        } else if (formData.startDate < today) {
            newErrors.startDate = 'Tanggal mulai tidak boleh di masa lalu';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Pilih tanggal selesai';
        } else if (formData.endDate < formData.startDate) {
            newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai';
        }

        if (formData.approvalTypes.length === 0) {
            newErrors.approvalTypes = 'Pilih minimal satu jenis approval';
        }

        if (!formData.reason.trim()) {
            newErrors.reason = 'Berikan alasan delegasi';
        } else if (formData.reason.trim().length < 10) {
            newErrors.reason = 'Alasan minimal 10 karakter';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            await onSubmit(formData);
        } catch {
            // Error handled by parent
        }
    };

    const handleApprovalTypeToggle = (type: ApprovalType) => {
        setFormData((prev) => {
            const newTypes = prev.approvalTypes.includes(type)
                ? prev.approvalTypes.filter((t) => t !== type)
                : [...prev.approvalTypes, type];

            // If 'ALL' is selected, clear others
            if (type === 'ALL' && !prev.approvalTypes.includes('ALL')) {
                return { ...prev, approvalTypes: ['ALL'] };
            }

            // If selecting specific type while 'ALL' is selected, remove 'ALL'
            if (type !== 'ALL' && prev.approvalTypes.includes('ALL')) {
                return { ...prev, approvalTypes: [type] };
            }

            return { ...prev, approvalTypes: newTypes };
        });
        setErrors((prev) => ({ ...prev, approvalTypes: '' }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delegatee Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delegasikan Ke <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.delegateeId}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, delegateeId: e.target.value }));
                        setErrors((prev) => ({ ...prev, delegateeId: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.delegateeId
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-blue-200'
                        }`}
                >
                    <option value="">Pilih penerima delegasi...</option>
                    {availableApprovers.map((approver) => (
                        <option key={approver.id} value={approver.id}>
                            {approver.name} - {approver.role} ({approver.email})
                        </option>
                    ))}
                </select>
                {errors.delegateeId && (
                    <p className="text-sm text-red-600 mt-1">{errors.delegateeId}</p>
                )}
            </div>

            {/* Period Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formatDateForInput(formData.startDate)}
                        min={formatDateForInput(today)}
                        onChange={(e) => {
                            const date = new Date(e.target.value);
                            setFormData((prev) => ({ ...prev, startDate: date }));
                            setErrors((prev) => ({ ...prev, startDate: '' }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.startDate
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-300 focus:ring-blue-200'
                            }`}
                    />
                    {errors.startDate && (
                        <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formatDateForInput(formData.endDate)}
                        min={formatDateForInput(formData.startDate)}
                        onChange={(e) => {
                            const date = new Date(e.target.value);
                            setFormData((prev) => ({ ...prev, endDate: date }));
                            setErrors((prev) => ({ ...prev, endDate: '' }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.endDate
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-300 focus:ring-blue-200'
                            }`}
                    />
                    {errors.endDate && (
                        <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
                    )}
                </div>
            </div>

            {/* Approval Types */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Approval yang Didelegasikan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {APPROVAL_TYPE_OPTIONS.map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${formData.approvalTypes.includes(option.value)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                } ${option.value === 'ALL' ? 'col-span-2' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={formData.approvalTypes.includes(option.value)}
                                onChange={() => handleApprovalTypeToggle(option.value)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
                {errors.approvalTypes && (
                    <p className="text-sm text-red-600 mt-1">{errors.approvalTypes}</p>
                )}
            </div>

            {/* Reason */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Delegasi <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, reason: e.target.value }));
                        setErrors((prev) => ({ ...prev, reason: '' }));
                    }}
                    placeholder="Jelaskan alasan delegasi (contoh: cuti, perjalanan dinas, dll)..."
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.reason
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-blue-200'
                        }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                    {formData.reason.length}/10 karakter minimum
                </p>
                {errors.reason && (
                    <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    )}
                    Buat Delegasi
                </button>
            </div>
        </form>
    );
}

export default DelegationForm;
