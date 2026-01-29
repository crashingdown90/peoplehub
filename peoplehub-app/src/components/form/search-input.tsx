"use client";

// @ai:cx - Debounced search input

import { useEffect, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    loading?: boolean;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = "Cari...",
    debounceMs = 300,
    loading,
    className,
}: SearchInputProps) {
    const [internal, setInternal] = useState(value);
    const debounced = useDebounce(internal, debounceMs);

    useEffect(() => {
        onChange(debounced);
    }, [debounced, onChange]);

    useEffect(() => {
        setInternal(value);
    }, [value]);

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100",
                className
            )}
        >
            <Search className="h-4 w-4 text-slate-500" />
            <input
                value={internal}
                onChange={(e) => setInternal(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent focus:outline-none"
            />
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : (
                internal && (
                    <button
                        type="button"
                        aria-label="Hapus pencarian"
                        onClick={() => setInternal("")}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )
            )}
        </div>
    );
}
