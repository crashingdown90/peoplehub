"use client";

// @ai:cx - Dashboard layout wrapper

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-(--color-bg) transition-colors">
            <div className="sticky top-0 h-screen">
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
            </div>
            <div className="flex flex-1 flex-col min-w-0">
                <Header onMenuToggle={() => setCollapsed((p) => !p)} />
                <main className="flex-1 px-4 py-6 md:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
