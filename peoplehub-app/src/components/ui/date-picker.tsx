"use client";

// @ai:cx - Date picker input wrapper

import { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
    value?: string;
    onChange: (value: string) => void;
    minDate?: string;
    maxDate?: string;
    className?: string;
    label?: string;
    helperText?: string;
}

export function DatePicker({ value, onChange, minDate, maxDate, className, label, helperText }: DatePickerProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <input
                type="date"
                value={value}
                onChange={handleChange}
                min={minDate}
                max={maxDate}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        </div>
    );
}
