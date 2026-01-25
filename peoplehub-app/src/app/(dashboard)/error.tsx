"use client";

// @ai:cx - Dashboard error boundary

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-[var(--color-error-bg)] p-4">
                        <AlertTriangle className="h-10 w-10 text-[var(--color-error)]" />
                    </div>
                </div>

                <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">
                    Gagal Memuat Halaman
                </h2>
                <p className="mb-6 text-sm text-[var(--color-text-subtle)]">
                    Terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button onClick={reset} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
