"use client";

// @ai:cx - Leave balance widget for employee dashboard

import { cn } from "@/lib/utils";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LeaveBalance {
    type: string;
    balance: number;
    used: number;
    total: number;
    color?: string;
}

interface LeaveBalanceWidgetProps {
    balances: LeaveBalance[];
    className?: string;
}

const defaultColors = [
    "bg-[var(--color-accent)]",
    "bg-[var(--color-success)]",
    "bg-[var(--color-warning)]",
    "bg-[var(--color-info)]",
];

export function LeaveBalanceWidget({ balances, className }: LeaveBalanceWidgetProps) {
    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--color-accent)]" />
                    <h3 className="font-semibold text-[var(--color-text)]">Saldo Cuti</h3>
                </div>
                <Link href="/leave">
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">
                        Lihat Semua
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="mt-4 space-y-4">
                {balances.map((item, index) => {
                    const percentage = item.total > 0 ? (item.balance / item.total) * 100 : 0;
                    const colorClass = item.color || defaultColors[index % defaultColors.length];

                    return (
                        <div key={item.type}>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text)]">{item.type}</span>
                                <span className="font-semibold text-[var(--color-text)]">
                                    {item.balance} <span className="font-normal text-[var(--color-text-subtle)]">/ {item.total} hari</span>
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-bg)]">
                                <div
                                    className={cn("h-full rounded-full transition-all", colorClass)}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6">
                <Link href="/leave/request">
                    <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Ajukan Cuti
                    </Button>
                </Link>
            </div>
        </div>
    );
}

LeaveBalanceWidget.displayName = "LeaveBalanceWidget";
