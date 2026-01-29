// @ai:ag - Correction List component showing pending correction requests

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Eye, Trash2 } from "lucide-react";

interface CorrectionRequest {
    id: string;
    date: string;
    type: "CLOCK_IN" | "CLOCK_OUT" | "BOTH";
    clockInTime?: string;
    clockOutTime?: string;
    reason: string;
    proofUrl?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
}

interface CorrectionListProps {
    corrections: CorrectionRequest[];
    onView?: (correction: CorrectionRequest) => void;
    onCancel?: (id: string) => void;
}

export function CorrectionList({ corrections, onView, onCancel }: CorrectionListProps) {
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const handleCancel = async (id: string) => {
        if (!confirm("Yakin ingin membatalkan request koreksi ini?")) return;

        setCancellingId(id);
        try {
            await onCancel?.(id);
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Menunggu</Badge>;
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700 border-green-200">Disetujui</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "CLOCK_IN":
                return "Clock In";
            case "CLOCK_OUT":
                return "Clock Out";
            case "BOTH":
                return "Clock In & Out";
            default:
                return type;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (timeStr: string) => {
        return timeStr;
    };

    if (corrections.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Belum ada request koreksi</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {corrections.map((correction) => (
                <Card key={correction.id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-base">{formatDate(correction.date)}</CardTitle>
                                <p className="text-xs text-slate-500 mt-1">
                                    Diajukan {new Date(correction.createdAt).toLocaleDateString("id-ID")}
                                </p>
                            </div>
                            {getStatusBadge(correction.status)}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {/* Type */}
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700">Tipe:</span>
                            <span className="text-slate-600">{getTypeLabel(correction.type)}</span>
                        </div>

                        {/* Times */}
                        {correction.clockInTime && (
                            <div className="text-sm">
                                <span className="font-medium text-slate-700">Clock In:</span>{" "}
                                <span className="text-slate-600">{formatTime(correction.clockInTime)}</span>
                            </div>
                        )}
                        {correction.clockOutTime && (
                            <div className="text-sm">
                                <span className="font-medium text-slate-700">Clock Out:</span>{" "}
                                <span className="text-slate-600">{formatTime(correction.clockOutTime)}</span>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="text-sm">
                            <p className="font-medium text-slate-700 mb-1">Alasan:</p>
                            <p className="text-slate-600 text-xs bg-slate-50 p-2 rounded">
                                {correction.reason}
                            </p>
                        </div>

                        {/* Proof */}
                        {correction.proofUrl && (
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <a
                                    href={correction.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Lihat Bukti Pendukung
                                </a>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {correction.status === "REJECTED" && correction.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-red-700 mb-1">Alasan Penolakan:</p>
                                <p className="text-xs text-red-600">{correction.rejectionReason}</p>
                            </div>
                        )}

                        {/* Approved Info */}
                        {correction.status === "APPROVED" && correction.reviewedAt && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-xs text-green-700">
                                    Disetujui pada {new Date(correction.reviewedAt).toLocaleDateString("id-ID")}
                                    {correction.reviewedBy && ` oleh ${correction.reviewedBy}`}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                            {onView && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onView(correction)}
                                    className="flex-1"
                                >
                                    <Eye className="mr-2 h-3 w-3" />
                                    Detail
                                </Button>
                            )}

                            {correction.status === "PENDING" && onCancel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancel(correction.id)}
                                    disabled={cancellingId === correction.id}
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    {cancellingId === correction.id ? (
                                        <>Membatalkan...</>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            Batalkan
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
