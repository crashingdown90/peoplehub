"use client";

// @ai:cx

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Clock, Calendar, Plane, Receipt, Target, CreditCard,
    User, Bell, LogOut, Menu, X, CheckCircle, Users, BarChart3, Megaphone
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
    role?: string;
}

const employeeMenus = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/attendance", label: "Kehadiran", icon: Clock },
    { href: "/leave", label: "Cuti", icon: Calendar },
    { href: "/travel", label: "Perjalanan", icon: Plane },
    { href: "/reimburse", label: "Reimburse", icon: Receipt },
    { href: "/kpi", label: "KPI", icon: Target },
    { href: "/payslips", label: "Slip Gaji", icon: CreditCard },
    { href: "/announcements", label: "Pengumuman", icon: Megaphone },
];

const adminMenus = [
    { href: "/approvals", label: "Approvals", icon: CheckCircle },
    { href: "/admin/employees", label: "Karyawan", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/registrations", label: "Registrasi", icon: Users },
];

export function RoleSidebar({ role = "EMPLOYEE" }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isAdmin = ["HRD", "SUPER_ADMIN", "MANAGER"].includes(role);

    const allMenus = [...employeeMenus, ...(isAdmin ? adminMenus : [])];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md md:hidden"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed left-0 top-0 z-40 h-screen w-64 transform bg-white shadow-lg transition-transform md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-4">
                        <span className="text-xl font-bold text-blue-600">PeopleHub</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {allMenus.map((menu) => {
                            const isActive = pathname === menu.href;
                            const Icon = menu.icon;

                            return (
                                <Link
                                    key={menu.href}
                                    href={menu.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-slate-600 hover:bg-slate-50"
                                        }
                  `}
                                >
                                    <Icon className="h-5 w-5" />
                                    {menu.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Section */}
                    <div className="border-t p-4 space-y-1">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${pathname === "/notifications"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50"
                                }
              `}
                        >
                            <Bell className="h-5 w-5" />
                            Notifikasi
                        </Link>
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${pathname === "/profile"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50"
                                }
              `}
                        >
                            <User className="h-5 w-5" />
                            Profile
                        </Link>
                        <form action="/api/auth/logout" method="POST">
                            <button
                                type="submit"
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5" />
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
