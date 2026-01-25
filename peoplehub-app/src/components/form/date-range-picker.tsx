"use client";

// @ai:cx - Date range picker wrapper

import { DatePicker } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onChange: (range: { startDate: string; endDate: string }) => void;
    minDate?: string;
    maxDate?: string;
    className?: string;
}

export function DateRangePicker({ startDate = "", endDate = "", onChange, minDate, maxDate, className }: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2 md:grid-cols-2", className)}>
            <DatePicker
                label="Mulai"
                value={startDate}
                onChange={(val) => onChange({ startDate: val, endDate })}
                minDate={minDate}
                maxDate={maxDate}
            />
            <DatePicker
                label="Selesai"
                value={endDate}
                onChange={(val) => onChange({ startDate, endDate: val })}
                minDate={minDate || startDate}
                maxDate={maxDate}
            />
        </div>
    );
}
