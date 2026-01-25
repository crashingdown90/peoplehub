"use client";

// @ai:cx - Dashboard layout wrapper

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
            <div className={cn("flex flex-1 flex-col", collapsed ? "ml-16" : "ml-64")}>
                <Header onMenuToggle={() => setCollapsed((p) => !p)} />
                <main className="flex-1 px-4 py-4 md:px-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
