"use client";

// @ai:cx - Modal overlay component with close controls

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: ModalSize;
}

const sizeClass: Record<ModalSize, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div
                className={`w-full rounded-xl bg-white shadow-2xl ${sizeClass[size]} animate-in fade-in zoom-in`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup dialog"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}
