"use client";

// @ai:cx - Approval queue widget for HRD/Manager dashboard

import { cn } from "@/lib/utils";
import { ClipboardList, ChevronRight, Check, X, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface ApprovalItem {
    id: string;
    type: "leave" | "correction" | "travel" | "reimburse" | "overtime";
    employeeName: string;
    employeePhoto?: string;
    description: string;
    submittedAt: string;
    status: "pending" | "in_review";
}

interface ApprovalQueueProps {
    items: ApprovalItem[];
    onApprove?: (ids: string[]) => void;
    onReject?: (ids: string[]) => void;
    className?: string;
}

const typeLabels: Record<string, string> = {
    leave: "Cuti",
    correction: "Koreksi",
    travel: "Perjalanan",
    reimburse: "Reimburse",
    overtime: "Lembur",
};

const typeColors: Record<string, string> = {
    leave: "bg-blue-100 text-blue-700",
    correction: "bg-yellow-100 text-yellow-700",
    travel: "bg-purple-100 text-purple-700",
    reimburse: "bg-green-100 text-green-700",
    overtime: "bg-orange-100 text-orange-700",
};

export function ApprovalQueue({ items, onApprove, onReject, className }: ApprovalQueueProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map((i) => i.id));
        }
    };

    const handleApprove = () => {
        if (onApprove && selectedIds.length > 0) {
            onApprove(selectedIds);
            setSelectedIds([]);
        }
    };

    const handleReject = () => {
        if (onReject && selectedIds.length > 0) {
            onReject(selectedIds);
            setSelectedIds([]);
        }
    };

    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white", className)}>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[var(--color-accent)]" />
                    <h3 className="font-semibold text-[var(--color-text)]">Antrean Approval</h3>
                    <Badge variant="secondary" className="ml-2">
                        {items.length}
                    </Badge>
                </div>
                <Link href="/approvals">
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">
                        Lihat Semua
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="h-12 w-12 text-[var(--color-text-muted)]" />
                    <p className="mt-3 text-sm text-[var(--color-text-subtle)]">
                        Tidak ada pengajuan yang perlu diproses
                    </p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-slate-100">
                        {items.slice(0, 5).map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                            >
                                <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={() => toggleSelect(item.id)}
                                />
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-text-subtle)]">
                                    {item.employeePhoto ? (
                                        <Image
                                            src={item.employeePhoto}
                                            alt={item.employeeName}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium">
                                            {item.employeeName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[var(--color-text)] truncate">
                                            {item.employeeName}
                                        </span>
                                        <span className={cn(
                                            "rounded-full px-2 py-0.5 text-xs font-medium",
                                            typeColors[item.type]
                                        )}>
                                            {typeLabels[item.type]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-subtle)] truncate">
                                        {item.description}
                                    </p>
                                </div>
                                <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                                    {item.submittedAt}
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-success)]">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-error)]">
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Link href={`/approvals/${item.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedIds.length === items.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-sm text-[var(--color-text-subtle)]">
                                    {selectedIds.length} dipilih
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleReject}>
                                    <X className="mr-1 h-4 w-4" />
                                    Tolak
                                </Button>
                                <Button size="sm" onClick={handleApprove}>
                                    <Check className="mr-1 h-4 w-4" />
                                    Setujui
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

ApprovalQueue.displayName = "ApprovalQueue";
