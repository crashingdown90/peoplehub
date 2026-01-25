// @ai:cx - Dashboard loading skeleton

import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
    return (
        <div className="space-y-6 p-6">
            {/* Page Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton variant="text" width={200} height={28} />
                    <Skeleton variant="text" width={300} height={16} />
                </div>
                <Skeleton variant="rect" width={120} height={40} />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton variant="text" width={80} height={14} />
                            <Skeleton variant="circle" width={40} height={40} />
                        </div>
                        <Skeleton variant="text" width={60} height={32} className="mt-2" />
                        <Skeleton variant="text" width={100} height={12} className="mt-1" />
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Chart Skeleton */}
                <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <Skeleton variant="text" width={150} height={20} className="mb-4" />
                    <Skeleton variant="rect" width="100%" height={250} />
                </div>

                {/* Activity Feed Skeleton */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <Skeleton variant="text" width={120} height={20} className="mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton variant="circle" width={32} height={32} />
                                <div className="flex-1 space-y-2">
                                    <Skeleton variant="text" width="80%" height={14} />
                                    <Skeleton variant="text" width="60%" height={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <div className="border-b border-[var(--color-border)] p-4">
                    <Skeleton variant="text" width={180} height={20} />
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton variant="circle" width={32} height={32} />
                            <Skeleton variant="text" width="30%" height={14} />
                            <Skeleton variant="text" width="20%" height={14} />
                            <Skeleton variant="text" width="15%" height={14} />
                            <Skeleton variant="rect" width={60} height={24} className="ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
