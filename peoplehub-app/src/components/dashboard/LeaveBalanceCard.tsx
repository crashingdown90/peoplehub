// @ai:ag - Leave Balance Card showing remaining leave days

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";

interface LeaveType {
    type: string;
    label: string;
    total: number;
    used: number;
    remaining: number;
    color: string;
}

interface LeaveBalanceCardProps {
    leaveTypes: LeaveType[];
    onRequestLeave?: () => void;
}

export function LeaveBalanceCard({
    leaveTypes,
    onRequestLeave,
}: LeaveBalanceCardProps) {
    const totalRemaining = leaveTypes.reduce((sum, t) => sum + t.remaining, 0);
    const totalUsed = leaveTypes.reduce((sum, t) => sum + t.used, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Saldo Cuti
                    </CardTitle>
                    {onRequestLeave && (
                        <Button size="sm" onClick={onRequestLeave}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajukan
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalRemaining}</p>
                        <p className="text-xs text-blue-700 mt-1">Sisa Hari</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-600">{totalUsed}</p>
                        <p className="text-xs text-slate-700 mt-1">Terpakai</p>
                    </div>
                </div>

                {/* Leave Types */}
                <div className="space-y-3 pt-3 border-t">
                    {leaveTypes.map((leaveType) => {
                        const percentage = (leaveType.used / leaveType.total) * 100;

                        return (
                            <div key={leaveType.type}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">
                                        {leaveType.label}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {leaveType.remaining}/{leaveType.total} hari
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${leaveType.color}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                        <strong>Catatan:</strong> Cuti tahunan akan hangus pada akhir tahun.
                        Gunakan dengan bijak!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
