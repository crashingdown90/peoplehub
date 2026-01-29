"use client";

// @ai:cx - Stats grid wrapper

import { ReactNode } from "react";
import { StatsCard } from "./stats-card";

interface StatsGridProps {
    items: Array<{
        title: string;
        value: string | number;
        icon?: ReactNode;
        trend?: { value: number; direction: "up" | "down" | "neutral" };
        description?: string;
        loading?: boolean;
    }>;
}

export function StatsGrid({ items }: StatsGridProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item, idx) => (
                <StatsCard key={item.title + idx} {...item} />
            ))}
        </div>
    );
}
