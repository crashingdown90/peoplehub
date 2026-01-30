"use client";

// @ai:cx - Sidebar navigation with permissions

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
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
    ChevronDown,
    Megaphone,
    Clock,
    Shield,
    Building2,
    FileText,
    Calendar,
    CreditCard,
    Plane,
    Banknote,
    Target,
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

export function Sidebar({ collapsed = false }: SidebarProps) {
    const pathname = usePathname();
    const { can, canAny } = usePermission();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
        // Personnel Management group
        {
            label: "Manajemen Karyawan",
            icon: Users,
            permission: PERMISSIONS.EMPLOYEES_VIEW,
            children: [
                { label: "List Karyawan", href: "/admin/employees", icon: Users },
                { label: "Kelola KPI", href: "/admin/kpi", icon: Target, permission: PERMISSIONS.KPI_MANAGE },
                { label: "Jenis Cuti", href: "/admin/settings/leave-types", icon: CalendarRange },
                { label: "Hari Libur", href: "/admin/settings/holidays", icon: Calendar },
                { label: "Laporan Kehadiran", href: "/admin/attendance-report", icon: ClipboardList },
                { label: "Pengaturan Umum", href: "/admin/settings/attendance", icon: Settings },
            ],
        },
        // Dedicated Shift Management group - to make it very obvious
        {
            label: "Manajemen Shift",
            icon: Clock,
            permission: PERMISSIONS.EMPLOYEES_VIEW,
            children: [
                { 
                    label: "Template Shift", 
                    href: "/admin/shifts", 
                    icon: Clock,
                    permission: PERMISSIONS.ORG_MANAGE_SHIFTS 
                },
                { 
                    label: "Atur Shift Karyawan", 
                    href: "/admin/shifts/assign", 
                    icon: Users,
                    permission: PERMISSIONS.ORG_MANAGE_SHIFTS
                },
            ],
        },
        {
            label: "Approval",
            icon: ClipboardList,
            permission: [PERMISSIONS.LEAVE_APPROVE, PERMISSIONS.ADMIN_REGISTRATIONS],
            children: [
                { label: "Cuti", href: "/approvals", icon: CalendarRange },
                { label: "Perubahan Bank", href: "/admin/approvals/bank-changes", icon: CreditCard },
                { label: "Registrasi", href: "/admin/registrations", icon: ShieldCheck },
            ],
        },
        { label: "Kehadiran", href: "/attendance", icon: Clock },
        { label: "Cuti", href: "/leave", icon: Calendar, permission: PERMISSIONS.LEAVE_VIEW_OWN },
        { label: "Perjalanan", href: "/travel", icon: Plane, permission: PERMISSIONS.TRAVEL_VIEW_OWN },
        { label: "Reimburse", href: "/reimburse", icon: Banknote, permission: PERMISSIONS.REIMBURSE_VIEW_OWN },
        { label: "KPI", href: "/kpi", icon: Target, permission: PERMISSIONS.KPI_VIEW_OWN },
        { label: "Slip Gaji", href: "/payslips", icon: Landmark, permission: [PERMISSIONS.PAYROLL_VIEW_OWN, PERMISSIONS.PAYROLL_VIEW_ALL] },
        { label: "Kelola Pengumuman", href: "/admin/announcements", icon: Megaphone, permission: PERMISSIONS.ANNOUNCEMENTS_CREATE },
        { label: "Laporan", href: "/reports", icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
        { label: "Pengaturan", href: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
    ], []);

    const visibleMenus = useMemo(() => {
        return menus.filter((item) => {
            if (!item.permission) return true;
            return Array.isArray(item.permission) ? canAny(item.permission) : can(item.permission);
        });
    }, [menus, canAny, can]);

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <aside className={cn(
            "flex h-screen flex-col border-r border-(--color-border) bg-(--color-surface) shadow-sm transition-all duration-200",
            collapsed ? "w-16" : "w-64"
        )}>
            <div className="flex items-center px-6 py-6 h-16">
                <span className={cn("text-xl font-bold text-(--color-accent)", collapsed && "hidden")}>
                    PeopleHub
                </span>
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
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-(--color-border)",
                                        isActive ? "bg-(--color-accent)/10 text-(--color-accent)" : "text-(--color-text)"
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
                                        {item.children
                                            .filter(child => {
                                                if (!child.permission) return true;
                                                return Array.isArray(child.permission) ? canAny(child.permission) : can(child.permission);
                                            })
                                            .map((child) => {
                                                const childActive = child.href ? pathname.startsWith(child.href) : false;
                                                const ChildIcon = child.icon;
                                                return (
                                                    <Link
                                                        key={child.label}
                                                        href={child.href || "#"}
                                                        className={cn(
                                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-(--color-border)",
                                                            childActive ? "text-(--color-accent)" : "text-(--color-text-subtle)"
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
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-(--color-border)",
                                active ? "bg-(--color-accent)/10 text-(--color-accent)" : "text-(--color-text)"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {!collapsed && (
                                <span className="flex flex-1 items-center justify-between gap-2">
                                    {item.label}
                                    {Boolean(item.badge && item.badge > 0) && (
                                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-error) px-1.5 text-[10px] font-bold text-white shadow-sm">
                                            {Number(item.badge) > 99 ? "99+" : item.badge}
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
