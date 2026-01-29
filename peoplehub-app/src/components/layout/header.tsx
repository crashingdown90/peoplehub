"use client";

// @ai:cx - Dashboard header with notifications and user menu

import Link from "next/link";
import { useMemo } from "react";
import { Bell, Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
    onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount } = useNotifications({ autoFetch: true, pollingInterval: 30000 });

    const displayName = useMemo(() => user?.employee?.fullName || user?.email || "Pengguna", [user]);

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-(--color-border) bg-(--color-surface)/90 px-4 py-3 backdrop-blur transition-colors">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Toggle sidebar"
                    onClick={onMenuToggle}
                    className="rounded-lg p-2 text-(--color-text-subtle) hover:bg-(--color-border)"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href="/notifications"
                    className="relative rounded-lg p-2 text-(--color-text-subtle) transition hover:bg-(--color-border)"
                    aria-label="Notifikasi"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-(--color-error) px-1 text-xs font-semibold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Link>


                <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 shadow-sm">
                    <Avatar className="h-8 w-8">
                        {user?.photoUrl ? (
                            <AvatarImage src={user.photoUrl} alt={displayName} />
                        ) : null}
                        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-sm leading-tight md:block">
                        <p className="font-semibold text-(--color-text)">{displayName}</p>
                        <p className="text-xs text-(--color-text-subtle)">{user?.role || "-"}</p>
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}

function UserDropdown() {
    return (
        <div className="relative">
            <details className="group">
                <summary className="list-none cursor-pointer rounded-lg p-1 text-(--color-text-subtle) transition hover:bg-(--color-border)">
                    <User className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg">
                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-border)"
                    >
                        Profil
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="block w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-(--color-error-bg)"
                        >
                            Keluar
                        </button>
                    </form>
                </div>
            </details>
        </div>
    );
}
