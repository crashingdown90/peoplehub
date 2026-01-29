"use client";

// @ai:cx - Global error boundary for app-level errors

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error to monitoring service
        console.error("Global error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] p-4">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-[var(--color-error-bg)] p-4">
                        <AlertTriangle className="h-12 w-12 text-[var(--color-error)]" />
                    </div>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
                    Terjadi Kesalahan
                </h1>
                <p className="mb-6 text-[var(--color-text-subtle)]">
                    Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke halaman utama.
                </p>

                {error.digest && (
                    <p className="mb-4 text-xs text-[var(--color-text-muted)]">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button onClick={reset} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/dashboard" className="gap-2">
                            <Home className="h-4 w-4" />
                            Kembali ke Dashboard
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
