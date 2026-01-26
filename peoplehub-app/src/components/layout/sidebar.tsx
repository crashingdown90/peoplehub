"use client";

// @ai:cx - Sidebar navigation with permissions

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS, type Permission } from "@/constants/permissions";
import {
    Home,
    Users,
    ClipboardList,
    CalendarRange,
    Landmark,
    ShieldCheck,
    BarChart3,
    Settings,
    Menu,
    ChevronDown,
    Bell,
    Megaphone,
    Clock,
    Shield,
    Building2,
    FileText,
    Calendar,
    Timer,
} from "lucide-react";

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

interface MenuItem {
    label: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: Permission | Permission[];
    children?: MenuItem[];
    badge?: number;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { can, canAny } = usePermission();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread announcement count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await fetch("/api/announcements/unread-count");
                const data = await res.json();
                if (data.success) {
                    setUnreadCount(data.data.count);
                }
            } catch (err) {
                // Silent fail
            }
        };

        fetchUnreadCount();
        // Refresh every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const menus = useMemo<MenuItem[]>(() => [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        // Super Admin Menu - only visible to SUPER_ADMIN
        {
            label: "Super Admin",
            icon: Shield,
            permission: PERMISSIONS.SUPER_ADMIN_ACCESS,
            children: [
                { label: "Dashboard", href: "/dashboard/superadmin", icon: Home },
                { label: "Tenants", href: "/admin/superadmin/tenants", icon: Building2 },
                { label: "Users", href: "/admin/superadmin/users", icon: Users },
                { label: "Audit Logs", href: "/admin/superadmin/audit-logs", icon: FileText },
            ],
        },
        // HRD Menu
        {
            label: "HRD",
            icon: Users,
            permission: PERMISSIONS.EMPLOYEES_VIEW,
            children: [
                { label: "Dashboard HRD", href: "/dashboard/hrd", icon: Home },
                { label: "Karyawan", href: "/admin/employees", icon: Users },
                { label: "Jenis Cuti", href: "/admin/settings/leave-types", icon: CalendarRange },
                { label: "Hari Libur", href: "/admin/settings/holidays", icon: Calendar },
                { label: "Shift Kerja", href: "/admin/shifts", icon: Clock },
                { label: "Aturan Terlambat", href: "/admin/settings/late-rules", icon: Timer },
            ],
        },
        {
            label: "Approval",
            icon: ClipboardList,
            permission: [PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.ADMIN_REGISTRATIONS],
            children: [
                { label: "Cuti", href: "/approvals", icon: CalendarRange },
                { label: "Registrasi", href: "/admin/registrations", icon: ShieldCheck },
            ],
        },
        { label: "Kehadiran", href: "/attendance", icon: Clock },
        { label: "Pengumuman", href: "/announcements", icon: Megaphone, badge: unreadCount },
        { label: "Kelola Pengumuman", href: "/admin/announcements", icon: Bell, permission: PERMISSIONS.ANNOUNCEMENTS_CREATE },
        { label: "Payroll", href: "/payslips", icon: Landmark, permission: [PERMISSIONS.PAYROLL_VIEW_OWN, PERMISSIONS.PAYROLL_VIEW_ALL] },
        { label: "Laporan", href: "/reports", icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
        { label: "Pengaturan", href: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
    ], [unreadCount]);

    const visibleMenus = menus.filter((item) => {
        if (!item.permission) return true;
        return Array.isArray(item.permission) ? canAny(item.permission) : can(item.permission);
    });

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <aside className={cn(
            "flex h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-200",
            collapsed ? "w-16" : "w-64"
        )}>
            <div className="flex items-center justify-between px-4 py-4">
                <span className={cn("text-lg font-semibold text-[var(--color-accent)]", collapsed && "hidden")}>PeopleHub</span>
                <button
                    type="button"
                    aria-label="Toggle sidebar"
                    onClick={onToggle}
                    className="rounded-lg p-2 text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-2">
                {visibleMenus.map((item) => {
                    const Icon = item.icon;
                    if (item.children && item.children.length > 0) {
                        const open = openGroups[item.label] || false;
                        const isActive = item.children.some((child) => child.href && pathname.startsWith(child.href));
                        return (
                            <div key={item.label}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(item.label)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]",
                                        isActive ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text)]"
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="h-5 w-5" />
                                        {!collapsed && item.label}
                                    </span>
                                    {!collapsed && <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />}
                                </button>
                                {!collapsed && open && (
                                    <div className="ml-8 mt-1 space-y-1">
                                        {item.children.map((child) => {
                                            const childActive = child.href ? pathname.startsWith(child.href) : false;
                                            const ChildIcon = child.icon;
                                            return (
                                                <Link
                                                    key={child.label}
                                                    href={child.href || "#"}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--color-border)]",
                                                        childActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-subtle)]"
                                                    )}
                                                >
                                                    <ChildIcon className="h-4 w-4" />
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const active = item.href ? pathname.startsWith(item.href) : false;
                    return (
                        <Link
                            key={item.label}
                            href={item.href || "#"}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]",
                                active ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text)]"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {!collapsed && (
                                <span className="flex flex-1 items-center justify-between">
                                    {item.label}
                                    {item.badge && item.badge > 0 && (
                                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                                            {item.badge > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                </span>
                            )}
                            {collapsed && item.badge && item.badge > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                                    {item.badge > 9 ? "9+" : item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
