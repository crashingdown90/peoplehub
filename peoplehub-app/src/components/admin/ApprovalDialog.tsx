// @ai:ag - Approval Dialog for confirming approve/reject actions

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ApprovalDialogProps {
    type: "approve" | "reject";
    employeeName: string;
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export function ApprovalDialog({
    type,
    employeeName,
    onConfirm,
    onCancel,
    isProcessing = false,
}: ApprovalDialogProps) {
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = () => {
        if (type === "reject") {
            if (!rejectReason.trim()) {
                setError("Alasan penolakan wajib diisi");
                return;
            }
            if (rejectReason.trim().length < 10) {
                setError("Alasan penolakan minimal 10 karakter");
                return;
            }
        }

        setError(null);
        onConfirm(type === "reject" ? rejectReason : undefined);
    };

    const isApprove = type === "approve";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div
                        className={`rounded-full p-3 ${isApprove ? "bg-green-100" : "bg-red-100"
                            }`}
                    >
                        {isApprove ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                    {isApprove ? "Setujui Registrasi?" : "Tolak Registrasi?"}
                </h3>

                {/* Message */}
                <p className="text-sm text-slate-600 text-center mb-6">
                    {isApprove ? (
                        <>
                            Anda akan menyetujui registrasi <strong>{employeeName}</strong>.
                            <br />
                            User akan menerima email dan dapat login ke sistem.
                        </>
                    ) : (
                        <>
                            Anda akan menolak registrasi <strong>{employeeName}</strong>.
                            <br />
                            User akan menerima email dengan alasan penolakan.
                        </>
                    )}
                </p>

                {/* Reject Reason Input */}
                {!isApprove && (
                    <div className="mb-6 space-y-2">
                        <Label htmlFor="reason">
                            Alasan Penolakan <span className="text-red-600">*</span>
                        </Label>
                        <textarea
                            id="reason"
                            value={rejectReason}
                            onChange={(e) => {
                                setRejectReason(e.target.value);
                                setError(null);
                            }}
                            placeholder="Masukkan alasan penolakan yang jelas dan profesional..."
                            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                            rows={4}
                            disabled={isProcessing}
                        />
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                        <p className="text-xs text-slate-500">
                            Minimal 10 karakter
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onCancel}
                        disabled={isProcessing}
                    >
                        Batal
                    </Button>
                    <Button
                        className={`flex-1 ${!isApprove ? "bg-red-600 hover:bg-red-700" : ""}`}
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <span className="mr-2">Memproses...</span>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </>
                        ) : isApprove ? (
                            "Ya, Setujui"
                        ) : (
                            "Ya, Tolak"
                        )}
                    </Button>
                </div>

                {/* Warning */}
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-900">
                        <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan. Pastikan keputusan Anda sudah tepat.
                    </p>
                </div>
            </div>
        </div>
    );
}
