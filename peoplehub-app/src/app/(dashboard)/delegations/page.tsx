// @ai:ag - Created by Antigravity
// Delegations Page - Manage approval delegations
'use client';

import React, { useState } from 'react';
import { DelegationForm } from '@/components/approval';
import type { Delegation, DelegationFormData } from '@/types/delegation.types';

// Mock data - replace with actual API calls
const MOCK_DELEGATIONS: Delegation[] = [
    {
        id: '1',
        tenantId: 'tenant-1',
        delegatorId: 'user-1',
        delegatorName: 'John Doe',
        delegatorEmail: 'john@company.com',
        delegateeId: 'user-2',
        delegateeName: 'Jane Smith',
        delegateeEmail: 'jane@company.com',
        startDate: '2026-01-25',
        endDate: '2026-01-30',
        approvalTypes: ['LEAVE', 'ATTENDANCE_CORRECTION'],
        reason: 'Cuti tahunan - perjalanan keluarga',
        isActive: true,
        createdAt: '2026-01-20T10:00:00Z',
    },
];

const MOCK_APPROVERS = [
    { id: 'user-2', name: 'Jane Smith', email: 'jane@company.com', role: 'Manager' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob@company.com', role: 'HRD' },
    { id: 'user-4', name: 'Alice Brown', email: 'alice@company.com', role: 'Manager' },
];

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Get status badge color
 */
function getStatusBadge(delegation: Delegation): { label: string; color: string } {
    const endDate = new Date(delegation.endDate);
    const now = new Date();

    if (!delegation.isActive) {
        return { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-700' };
    }

    if (endDate < now) {
        return { label: 'Berakhir', color: 'bg-gray-100 text-gray-600' };
    }

    const startDate = new Date(delegation.startDate);
    if (startDate > now) {
        return { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700' };
    }

    return { label: 'Aktif', color: 'bg-green-100 text-green-700' };
}

/**
 * Approval type badge
 */
function ApprovalTypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        LEAVE: 'Cuti',
        ATTENDANCE_CORRECTION: 'Koreksi Absensi',
        TRAVEL: 'Perjalanan',
        EXPENSE: 'Expense',
        OVERTIME: 'Lembur',
        LETTER: 'Surat',
        ALL: 'Semua',
    };

    return (
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
            {labels[type] || type}
        </span>
    );
}

export default function DelegationsPage() {
    const [delegations, setDelegations] = useState<Delegation[]>(MOCK_DELEGATIONS);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'given' | 'received'>('given');

    const handleCreateDelegation = async (data: DelegationFormData) => {
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newDelegation: Delegation = {
                id: `delegation-${Date.now()}`,
                tenantId: 'tenant-1',
                delegatorId: 'user-1',
                delegatorName: 'Current User',
                delegateeId: data.delegateeId,
                delegateeName: MOCK_APPROVERS.find((a) => a.id === data.delegateeId)?.name,
                delegateeEmail: MOCK_APPROVERS.find((a) => a.id === data.delegateeId)?.email,
                startDate: data.startDate.toISOString().split('T')[0],
                endDate: data.endDate.toISOString().split('T')[0],
                approvalTypes: data.approvalTypes,
                reason: data.reason,
                isActive: true,
                createdAt: new Date().toISOString(),
            };

            setDelegations((prev) => [newDelegation, ...prev]);
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelDelegation = (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin membatalkan delegasi ini?')) {
            setDelegations((prev) =>
                prev.map((d) => (d.id === id ? { ...d, isActive: false, cancelledAt: new Date().toISOString() } : d))
            );
        }
    };

    const filteredDelegations = delegations.filter((d) => {
        if (activeTab === 'given') {
            return d.delegatorId === 'user-1'; // Current user
        }
        return d.delegateeId === 'user-1'; // Received delegations
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Delegasi Approval</h1>
                    <p className="text-gray-500 mt-1">
                        Kelola delegasi wewenang approval Anda
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Delegasi
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('given')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'given'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Delegasi Diberikan
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'received'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Delegasi Diterima
                </button>
            </div>

            {/* Content */}
            {filteredDelegations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {activeTab === 'given'
                            ? 'Belum ada delegasi diberikan'
                            : 'Belum ada delegasi diterima'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                        {activeTab === 'given'
                            ? 'Buat delegasi untuk mengalihkan wewenang approval Anda'
                            : 'Anda belum menerima delegasi dari siapapun'}
                    </p>
                    {activeTab === 'given' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Buat Delegasi Pertama
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredDelegations.map((delegation) => {
                        const status = getStatusBadge(delegation);

                        return (
                            <div
                                key={delegation.id}
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                                            </span>
                                        </div>

                                        {/* Person */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-700">
                                                    {(activeTab === 'given'
                                                        ? delegation.delegateeName
                                                        : delegation.delegatorName
                                                    )?.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {activeTab === 'given'
                                                        ? `Ke: ${delegation.delegateeName}`
                                                        : `Dari: ${delegation.delegatorName}`}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {activeTab === 'given'
                                                        ? delegation.delegateeEmail
                                                        : delegation.delegatorEmail}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Approval Types */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {delegation.approvalTypes.map((type) => (
                                                <ApprovalTypeBadge key={type} type={type} />
                                            ))}
                                        </div>

                                        {/* Reason */}
                                        <p className="text-sm text-gray-600">
                                            <span className="text-gray-400">Alasan:</span> {delegation.reason}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {activeTab === 'given' && delegation.isActive && (
                                        <button
                                            onClick={() => handleCancelDelegation(delegation.id)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                        >
                                            Batalkan
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !isSubmitting && setShowForm(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Buat Delegasi Baru</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Delegasikan wewenang approval Anda ke orang lain
                            </p>
                        </div>
                        <div className="p-6">
                            <DelegationForm
                                availableApprovers={MOCK_APPROVERS}
                                onSubmit={handleCreateDelegation}
                                onCancel={() => setShowForm(false)}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
