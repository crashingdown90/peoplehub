"use client";

// @ai:cx - Dashboard header with notifications and user menu

import Link from "next/link";
import { useMemo } from "react";
import { Bell, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/providers";

interface HeaderProps {
    onMenuToggle?: () => void;
    showSearch?: boolean;
}

export function Header({ onMenuToggle, showSearch = true }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount } = useNotifications({ autoFetch: true, pollingInterval: 30000 });

    const displayName = useMemo(() => user?.employee?.fullName || user?.email || "Pengguna", [user]);

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 backdrop-blur transition-colors">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Toggle sidebar"
                    onClick={onMenuToggle}
                    className="rounded-lg p-2 text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <Link href="/dashboard" className="text-lg font-semibold text-[var(--color-accent)]">
                    PeopleHub
                </Link>
                {showSearch && (
                    <div className="hidden w-72 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-subtle)] shadow-sm transition hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 md:flex">
                        <Search className="h-4 w-4" />
                        <input
                            type="search"
                            placeholder="Cari..."
                            className="w-full bg-transparent focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />

                <Link
                    href="/notifications"
                    className="relative rounded-lg p-2 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-border)]"
                    aria-label="Notifikasi"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-xs font-semibold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Link>

                <Link
                    href="/settings"
                    className="hidden rounded-lg p-2 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-border)] md:inline-flex"
                    aria-label="Pengaturan"
                >
                    <Settings className="h-5 w-5" />
                </Link>

                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 shadow-sm">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-sm leading-tight md:block">
                        <p className="font-semibold text-[var(--color-text)]">{displayName}</p>
                        <p className="text-xs text-[var(--color-text-subtle)]">{user?.role || "-"}</p>
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-border)]"
            aria-label={resolvedTheme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
        >
            {resolvedTheme === "light" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    );
}

function UserDropdown() {
    return (
        <div className="relative">
            <details className="group">
                <summary className="list-none cursor-pointer rounded-lg p-1 text-[var(--color-text-subtle)] transition hover:bg-[var(--color-border)]">
                    <User className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]"
                    >
                        Profil
                    </Link>
                    <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-border)]"
                    >
                        Pengaturan
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="block w-full px-4 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
                        >
                            Keluar
                        </button>
                    </form>
                </div>
            </details>
        </div>
    );
}
