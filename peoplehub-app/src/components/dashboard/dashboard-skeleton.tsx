"use client";

// @ai:cx - Dashboard skeleton for loading state

import { Skeleton } from "@/components/ui";

interface DashboardSkeletonProps {
    /** Variant for future role-specific layouts */
    variant?: "employee" | "hrd" | "manager" | "finance";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardSkeleton({ variant = "employee" }: DashboardSkeletonProps) {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton variant="text" width="200px" height="28px" />
                    <Skeleton variant="text" width="150px" height="16px" className="mt-2" />
                </div>
                <Skeleton variant="rect" width="120px" height="40px" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton variant="text" width="80px" height="16px" />
                            <Skeleton variant="circle" width="24px" height="24px" />
                        </div>
                        <div className="mt-3">
                            <Skeleton variant="text" width="100px" height="32px" />
                            <Skeleton variant="text" width="60px" height="14px" className="mt-2" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts / Widgets skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Chart skeleton */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <Skeleton variant="text" width="150px" height="20px" />
                    <div className="mt-4 h-[200px]">
                        <Skeleton variant="rect" width="100%" height="100%" />
                    </div>
                </div>

                {/* Widget skeleton */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <Skeleton variant="text" width="120px" height="20px" />
                    <div className="mt-4 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton variant="circle" width="40px" height="40px" />
                                <div className="flex-1">
                                    <Skeleton variant="text" width="80%" height="16px" />
                                    <Skeleton variant="text" width="50%" height="12px" className="mt-1" />
                                </div>
                                <Skeleton variant="rect" width="60px" height="24px" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <Skeleton variant="text" width="180px" height="20px" />
                    <Skeleton variant="rect" width="100px" height="32px" />
                </div>
                <div className="mt-4">
                    <TableSkeleton rows={5} />
                </div>
            </div>
        </div>
    );
}

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="space-y-2">
            {/* Header row */}
            <div className="flex gap-4 border-b border-slate-200 pb-3">
                {[...Array(columns)].map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="text"
                        width={i === 0 ? "30%" : "15%"}
                        height="14px"
                    />
                ))}
            </div>

            {/* Data rows */}
            {[...Array(rows)].map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4 py-3">
                    {[...Array(columns)].map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            variant={colIndex === columns - 1 ? "rect" : "text"}
                            width={colIndex === 0 ? "30%" : colIndex === columns - 1 ? "60px" : "15%"}
                            height={colIndex === columns - 1 ? "28px" : "16px"}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

interface CardSkeletonProps {
    showIcon?: boolean;
    showDescription?: boolean;
}

export function CardSkeleton({ showIcon = true, showDescription = true }: CardSkeletonProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <Skeleton variant="text" width="80px" height="16px" />
                {showIcon && <Skeleton variant="circle" width="24px" height="24px" />}
            </div>
            <div className="mt-3">
                <Skeleton variant="text" width="100px" height="32px" />
                {showDescription && (
                    <Skeleton variant="text" width="60px" height="14px" className="mt-2" />
                )}
            </div>
        </div>
    );
}

DashboardSkeleton.displayName = "DashboardSkeleton";
TableSkeleton.displayName = "TableSkeleton";
CardSkeleton.displayName = "CardSkeleton";
