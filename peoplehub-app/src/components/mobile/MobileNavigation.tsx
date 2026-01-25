'use client';

import { Home, User, Bell, FileText, Settings, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileNavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

export function MobileNavigation() {
    const pathname = usePathname();

    const navItems: MobileNavItem[] = [
        {
            href: '/dashboard',
            label: 'Home',
            icon: <Home className="h-5 w-5" />,
        },
        {
            href: '/attendance',
            label: 'Attendance',
            icon: <FileText className="h-5 w-5" />,
        },
        {
            href: '/notifications',
            label: 'Notifications',
            icon: <Bell className="h-5 w-5" />,
        },
        {
            href: '/profile',
            label: 'Profile',
            icon: <User className="h-5 w-5" />,
        },
        {
            href: '/menu',
            label: 'Menu',
            icon: <Menu className="h-5 w-5" />,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom md:hidden z-50">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1',
                                isActive
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-100'
                            )}
                        >
                            {item.icon}
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
