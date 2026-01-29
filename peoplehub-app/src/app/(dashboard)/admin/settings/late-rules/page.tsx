"use client";

// @ai:cx - Redirect late rules settings to general settings

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LateRulesRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/settings/attendance");
    }, [router]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
            Mengalihkan ke Pengaturan Umum...
        </div>
    );
}
