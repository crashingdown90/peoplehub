"use client";

// @ai:cx - Bottom navigation for mobile devices

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Clock,
    Calendar,
    FileText,
    User,
    Users,
    CheckSquare,
    Bell,
    Receipt,
    BarChart3,
    Wallet
} from "lucide-react";

export type UserRole = "employee" | "manager" | "hrd" | "finance" | "it";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
    employee: [
        { label: "Home", href: "/dashboard", icon: Home },
        { label: "Absen", href: "/attendance", icon: Clock },
        { label: "Cuti", href: "/leave", icon: Calendar },
        { label: "Slip", href: "/payslips", icon: FileText },
        { label: "Profil", href: "/profile", icon: User },
    ],
    manager: [
        { label: "Home", href: "/dashboard", icon: Home },
        { label: "Tim", href: "/admin/employees", icon: Users },
        { label: "Approval", href: "/approvals", icon: CheckSquare },
        { label: "Notif", href: "/notifications", icon: Bell },
        { label: "Profil", href: "/profile", icon: User },
    ],
    hrd: [
        { label: "Home", href: "/dashboard", icon: Home },
        { label: "Karyawan", href: "/admin/employees", icon: Users },
        { label: "Approval", href: "/approvals", icon: CheckSquare },
        { label: "Laporan", href: "/reports", icon: BarChart3 },
        { label: "Profil", href: "/profile", icon: User },
    ],
    finance: [
        { label: "Home", href: "/dashboard", icon: Home },
        { label: "Payroll", href: "/admin/payroll", icon: Wallet },
        { label: "Reimburse", href: "/reimburse", icon: Receipt },
        { label: "Laporan", href: "/reports", icon: BarChart3 },
        { label: "Profil", href: "/profile", icon: User },
    ],
    it: [
        { label: "Home", href: "/dashboard", icon: Home },
        { label: "Users", href: "/admin/employees", icon: Users },
        { label: "Security", href: "/settings", icon: CheckSquare },
        { label: "Laporan", href: "/reports", icon: BarChart3 },
        { label: "Profil", href: "/profile", icon: User },
    ],
};

interface BottomNavigationProps {
    role?: UserRole;
    className?: string;
}

export function BottomNavigation({ role = "employee", className }: BottomNavigationProps) {
    const pathname = usePathname();
    const items = navItemsByRole[role];

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 pb-safe md:hidden",
                className
            )}
        >
            <div className="flex items-center justify-around">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                                isActive
                                    ? "text-[var(--color-accent)]"
                                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

BottomNavigation.displayName = "BottomNavigation";
