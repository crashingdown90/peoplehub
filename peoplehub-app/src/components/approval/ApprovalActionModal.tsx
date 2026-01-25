// @ai:ag - Created by Antigravity
// Approval Action Modal component for approve/reject actions
'use client';

import React, { useState } from 'react';

export interface ApprovalActionModalProps {
    /**
     * Whether modal is open
     */
    isOpen: boolean;

    /**
     * Close modal callback
     */
    onClose: () => void;

    /**
     * Request ID
     */
    requestId: string;

    /**
     * Request type for display
     */
    requestType: string;

    /**
     * Title/name of the request
     */
    requestTitle: string;

    /**
     * Approve callback
     */
    onApprove: (comment?: string) => Promise<void>;

    /**
     * Reject callback
     */
    onReject: (reason: string) => Promise<void>;

    /**
     * Whether approval is in progress
     */
    isLoading?: boolean;
}

/**
 * Approval Action Modal Component
 * 
 * Modal dialog for approving or rejecting requests with:
 * - Action selection (Approve/Reject)
 * - Optional comment for approve
 * - Required reason for reject (min 10 chars)
 * - Confirmation step
 * - Loading state
 */
export function ApprovalActionModal({
    isOpen,
    onClose,
    requestId,
    requestType,
    requestTitle,
    onApprove,
    onReject,
    isLoading = false,
}: ApprovalActionModalProps) {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClose = () => {
        if (!isLoading) {
            setAction(null);
            setComment('');
            setError(null);
            setShowConfirm(false);
            onClose();
        }
    };

    const handleSubmit = async () => {
        setError(null);

        try {
            if (action === 'approve') {
                await onApprove(comment || undefined);
            } else if (action === 'reject') {
                if (comment.trim().length < 10) {
                    setError('Alasan penolakan minimal 10 karakter');
                    return;
                }
                await onReject(comment);
            }
            handleClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
        }
    };

    const handleProceed = () => {
        if (action === 'reject' && comment.trim().length < 10) {
            setError('Alasan penolakan minimal 10 karakter');
            return;
        }
        setShowConfirm(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Approval Action
                        </h2>
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {requestType} - {requestTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        ID: {requestId}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {/* Confirmation view */}
                    {showConfirm ? (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${action === 'approve' ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {action === 'approve' ? (
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-medium ${action === 'approve' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {action === 'approve' ? 'Setujui Pengajuan?' : 'Tolak Pengajuan?'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Aksi ini tidak dapat dibatalkan
                                        </p>
                                    </div>
                                </div>

                                {comment && (
                                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">
                                            {action === 'approve' ? 'Catatan:' : 'Alasan Penolakan:'}
                                        </p>
                                        <p className="text-sm text-gray-700">{comment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Action selection */}
                            {!action && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setAction('approve')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-700">Setujui</span>
                                    </button>

                                    <button
                                        onClick={() => setAction('reject')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-700">Tolak</span>
                                    </button>
                                </div>
                            )}

                            {/* Comment/reason input */}
                            {action && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <button
                                            onClick={() => setAction(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className={`font-medium ${action === 'approve' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {action === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
                                        </span>
                                    </div>

                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {action === 'approve' ? 'Catatan (opsional)' : 'Alasan Penolakan *'}
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => {
                                            setComment(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder={
                                            action === 'approve'
                                                ? 'Tambahkan catatan jika diperlukan...'
                                                : 'Berikan alasan penolakan (min. 10 karakter)...'
                                        }
                                        rows={3}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${error
                                                ? 'border-red-300 focus:ring-red-200'
                                                : 'border-gray-300 focus:ring-blue-200'
                                            }`}
                                    />
                                    {action === 'reject' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {comment.length}/10 karakter minimum
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    {showConfirm ? (
                        <>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isLoading}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${action === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {isLoading && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
                            </button>
                        </>
                    ) : action ? (
                        <>
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleProceed}
                                disabled={isLoading}
                                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${action === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                Lanjutkan
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Batal
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApprovalActionModal;
