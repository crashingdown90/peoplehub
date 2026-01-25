import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Clock } from "lucide-react";

export interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    timestamp?: string;
    status: "completed" | "current" | "pending";
    actor?: string;
}

export interface TimelineProps {
    items: TimelineItem[];
    orientation?: "vertical" | "horizontal";
    className?: string;
}

const statusIcons = {
    completed: <CheckCircle className="h-5 w-5" />,
    current: <Clock className="h-5 w-5" />,
    pending: <Circle className="h-5 w-5" />,
};

const statusColors = {
    completed: "text-[var(--color-success)] bg-[var(--color-success-bg)]",
    current: "text-[var(--color-warning)] bg-[var(--color-warning-bg)]",
    pending: "text-[var(--color-text-muted)] bg-[var(--color-bg)]",
};

const lineColors = {
    completed: "bg-[var(--color-success)]",
    current: "bg-[var(--color-warning)]",
    pending: "bg-[var(--color-border)]",
};

export function Timeline({ items, orientation = "vertical", className }: TimelineProps) {
    if (orientation === "horizontal") {
        return (
            <div className={cn("flex items-start", className)}>
                {items.map((item, index) => (
                    <div key={item.id} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                            {index > 0 && (
                                <div
                                    className={cn(
                                        "h-0.5 flex-1",
                                        lineColors[items[index - 1].status]
                                    )}
                                />
                            )}
                            <div
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-surface)]",
                                    statusColors[item.status]
                                )}
                            >
                                {statusIcons[item.status]}
                            </div>
                            {index < items.length - 1 && (
                                <div
                                    className={cn("h-0.5 flex-1", lineColors[item.status])}
                                />
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <p className="text-sm font-medium text-[var(--color-text)]">
                                {item.title}
                            </p>
                            {item.actor && (
                                <p className="text-xs text-[var(--color-text-subtle)]">
                                    {item.actor}
                                </p>
                            )}
                            {item.timestamp && (
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                    {item.timestamp}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Vertical orientation (default)
    return (
        <div className={cn("relative", className)}>
            {items.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Connecting line */}
                    {index < items.length - 1 && (
                        <div
                            className={cn(
                                "absolute left-[19px] top-10 h-full w-0.5",
                                lineColors[item.status]
                            )}
                        />
                    )}

                    {/* Icon */}
                    <div
                        className={cn(
                            "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            statusColors[item.status]
                        )}
                    >
                        {statusIcons[item.status]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                        <p className="font-medium text-[var(--color-text)]">{item.title}</p>
                        {item.description && (
                            <p className="mt-0.5 text-sm text-[var(--color-text-subtle)]">
                                {item.description}
                            </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            {item.timestamp && <span>{item.timestamp}</span>}
                            {item.timestamp && item.actor && <span>•</span>}
                            {item.actor && <span>oleh {item.actor}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

Timeline.displayName = "Timeline";
