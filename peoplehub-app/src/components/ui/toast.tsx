"use client";

// @ai:cx - Toast provider and hook

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    push: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((message: string, variant: ToastVariant = "info") => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast harus digunakan di dalam <ToastProvider>");
    }
    return ctx;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
    const tone: Record<ToastVariant, { icon: ReactNode; bg: string; text: string }> = {
        success: { icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-green-50 border-green-200", text: "text-green-800" },
        error: { icon: <AlertCircle className="h-4 w-4" />, bg: "bg-red-50 border-red-200", text: "text-red-800" },
        info: { icon: <Info className="h-4 w-4" />, bg: "bg-blue-50 border-blue-200", text: "text-blue-800" },
        warning: { icon: <TriangleAlert className="h-4 w-4" />, bg: "bg-orange-50 border-orange-200", text: "text-orange-800" },
    };

    const t = tone[toast.variant];

    return (
        <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 shadow-md", t.bg, t.text)}>
            <div className="mt-0.5">{t.icon}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button aria-label="Tutup" onClick={onClose} className="text-slate-500 hover:text-slate-700">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
