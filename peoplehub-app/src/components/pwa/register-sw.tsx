"use client";

// @ai:cx - Registers service worker for PWA

import { useEffect } from "react";

export function RegisterSW() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker
            .register("/sw.js")
            .catch((err) => console.error("SW registration failed", err));
    }, []);

    return null;
}
