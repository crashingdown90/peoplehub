"use client";

// @ai:cx - Leave request page - redirects to main leave page with form open

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LeaveRequestPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to main leave page
        // The leave page already has the request form functionality
        router.replace("/leave");
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
    );
}
