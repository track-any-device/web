'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Smartphone, ShoppingBag, AlertTriangle, MapPin, LogOut,
} from 'lucide-react';

interface Props {
    children: ReactNode;
    user: { name?: string; email?: string; role?: string | string[] } | null;
}

const NAV = [
    { href: '/my/devices',    label: 'My Devices',   icon: Smartphone    },
    { href: '/my/beats',      label: 'My Beats',     icon: MapPin        },
    { href: '/my/incidents',  label: 'My Incidents', icon: AlertTriangle },
    { href: '/my/orders',     label: 'My Orders',    icon: ShoppingBag   },
];

export default function MyShell({ children, user }: Props) {
    const pathname = usePathname();

    return (
        <div className="flex bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)]">
            {/* Sidebar — sticky, height fills below the 4rem (h-16) top nav */}
            <aside className="w-60 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col sticky top-16 h-[calc(100vh-4rem)] self-start">
                {/* Portal header */}
                <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
                    <Link href="/my"
                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                        My Portal
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
                    {user && (
                        <div className="px-3 py-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                    )}
                    <Link
                        href="/api/auth/logout"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}
