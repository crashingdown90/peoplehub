// @ai:ag - Registration Detail Modal for admin to review employee registration

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    X,
    User,
    Mail,
    Phone,
    Briefcase,
    Building,
    CreditCard,
    FileImage,
    Calendar
} from "lucide-react";
import Image from "next/image";

interface Registration {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;

    // Optional fields
    department?: string;
    position?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    ktpImageUrl?: string;
    photoImageUrl?: string;
}

interface RegistrationDetailModalProps {
    registration: Registration;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isProcessing?: boolean;
}

export function RegistrationDetailModal({
    registration,
    onClose,
    onApprove,
    onReject,
    isProcessing = false,
}: RegistrationDetailModalProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const statusColors = {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        APPROVED: "bg-green-100 text-green-800 border-green-200",
        REJECTED: "bg-red-100 text-red-800 border-red-200",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Detail Registrasi</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Terdaftar pada {formatDate(registration.createdAt)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge
                            className={`${statusColors[registration.status]} border`}
                        >
                            {registration.status}
                        </Badge>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            disabled={isProcessing}
                        >
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <section>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                Informasi Pribadi
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                                <DetailItem
                                    icon={<User className="h-4 w-4" />}
                                    label="Nama Lengkap"
                                    value={registration.fullName}
                                />
                                <DetailItem
                                    icon={<Mail className="h-4 w-4" />}
                                    label="Email"
                                    value={registration.email}
                                />
                                <DetailItem
                                    icon={<Phone className="h-4 w-4" />}
                                    label="Nomor Telepon"
                                    value={registration.phone}
                                />
                                <DetailItem
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Tanggal Registrasi"
                                    value={formatDate(registration.createdAt)}
                                />
                            </div>
                        </section>

                        {/* Employment Information */}
                        {(registration.department || registration.position) && (
                            <section>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                                    Informasi Pekerjaan
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                                    {registration.department && (
                                        <DetailItem
                                            icon={<Building className="h-4 w-4" />}
                                            label="Departemen"
                                            value={registration.department}
                                        />
                                    )}
                                    {registration.position && (
                                        <DetailItem
                                            icon={<Briefcase className="h-4 w-4" />}
                                            label="Jabatan"
                                            value={registration.position}
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Bank Information */}
                        {(registration.bankName || registration.accountNumber) && (
                            <section>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                                    Informasi Rekening Bank
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                                    {registration.bankName && (
                                        <DetailItem
                                            icon={<Building className="h-4 w-4" />}
                                            label="Nama Bank"
                                            value={registration.bankName}
                                        />
                                    )}
                                    {registration.accountNumber && (
                                        <DetailItem
                                            icon={<CreditCard className="h-4 w-4" />}
                                            label="Nomor Rekening"
                                            value={registration.accountNumber}
                                        />
                                    )}
                                    {registration.accountName && (
                                        <DetailItem
                                            icon={<User className="h-4 w-4" />}
                                            label="Nama Pemilik Rekening"
                                            value={registration.accountName}
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Documents */}
                        {(registration.ktpImageUrl || registration.photoImageUrl) && (
                            <section>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                    <FileImage className="h-5 w-5 mr-2 text-blue-600" />
                                    Dokumen
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {registration.ktpImageUrl && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 mb-2">Foto KTP</p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Image
                                                    src={registration.ktpImageUrl}
                                                    alt="KTP"
                                                    width={400}
                                                    height={250}
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {registration.photoImageUrl && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 mb-2">Pas Foto</p>
                                            <div className="border rounded-lg overflow-hidden max-w-xs">
                                                <Image
                                                    src={registration.photoImageUrl}
                                                    alt="Foto"
                                                    width={300}
                                                    height={400}
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                {registration.status === "PENDING" && (
                    <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Tutup
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => onReject(registration.id)}
                            disabled={isProcessing}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Tolak
                        </Button>
                        <Button
                            onClick={() => onApprove(registration.id)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="mr-2">Memproses...</span>
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Setujui
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <div className="text-slate-500 mt-0.5">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-900">{value}</p>
            </div>
        </div>
    );
}
