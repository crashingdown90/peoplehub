"use client";

// @ai:cx - Mobile header with hamburger menu

import { cn } from "@/lib/utils";
import { Menu, X, Bell, Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface MobileHeaderProps {
    title?: string;
    showSearch?: boolean;
    showNotifications?: boolean;
    notificationCount?: number;
    onMenuToggle?: (isOpen: boolean) => void;
    className?: string;
}

export function MobileHeader({
    title = "PeopleHub",
    showSearch = false,
    showNotifications = true,
    notificationCount = 0,
    onMenuToggle,
    className
}: MobileHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        const newState = !isMenuOpen;
        setIsMenuOpen(newState);
        onMenuToggle?.(newState);
    };

    return (
        <>
            {/* Mobile Header - visible only on mobile */}
            <header
                className={cn(
                    "sticky top-0 z-40 w-full border-b border-[var(--color-border)]",
                    "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
                    "md:hidden",
                    className
                )}
            >
                <div className="flex h-14 items-center justify-between px-4">
                    {/* Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMenuToggle}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="h-9 w-9 p-0"
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Title/Logo */}
                    <Link href="/dashboard" className="flex items-center">
                        <h1 className="text-lg font-semibold text-[var(--color-text)]">
                            {title}
                        </h1>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {showSearch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Search"
                                className="h-9 w-9 p-0"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        )}

                        {showNotifications && (
                            <Link href="/notifications">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Notifications"
                                    className="relative h-9 w-9 p-0"
                                >
                                    <Bell className="h-5 w-5" />
                                    {notificationCount > 0 && (
                                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={handleMenuToggle}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Sidebar Menu */}
            <aside
                className={cn(
                    "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64",
                    "transform bg-white shadow-lg transition-transform duration-300 ease-in-out",
                    "md:hidden",
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <nav className="flex flex-col space-y-1 p-4">
                    {/* Navigation items will be rendered by parent component */}
                    {/* This is just the container */}
                    <div id="mobile-menu-content" />
                </nav>
            </aside>
        </>
    );
}

MobileHeader.displayName = "MobileHeader";
