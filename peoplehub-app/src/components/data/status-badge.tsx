"use client";

// @ai:cx - Status badge for approval/attendance

import { cn } from "@/lib/utils";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY";

interface StatusBadgeProps {
    status: ApprovalStatus | AttendanceStatus | string;
    size?: "sm" | "md" | "lg";
}

const colorMap: Record<string, string> = {
    PENDING: "bg-orange-50 text-orange-700 border border-orange-200",
    LATE: "bg-orange-50 text-orange-700 border border-orange-200",
    APPROVED: "bg-green-50 text-green-700 border border-green-200",
    PRESENT: "bg-green-50 text-green-700 border border-green-200",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
    ABSENT: "bg-red-50 text-red-700 border border-red-200",
    CANCELLED: "bg-slate-100 text-slate-700 border border-slate-200",
    LEAVE: "bg-blue-50 text-blue-700 border border-blue-200",
    HOLIDAY: "bg-blue-50 text-blue-700 border border-blue-200",
};

const sizeMap = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-3.5 py-1.5",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const normalized = status?.toString().toUpperCase() || "";
    const tone = colorMap[normalized] || "bg-slate-50 text-slate-700 border border-slate-200";

    return (
        <span className={cn("inline-flex rounded-full font-semibold capitalize", tone, sizeMap[size])}>
            {status.toString().replace("_", " ").toLowerCase()}
        </span>
    );
}
