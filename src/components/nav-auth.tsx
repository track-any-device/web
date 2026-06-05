'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface Props {
    user: { name?: string; email?: string } | null;
}

export default function NavAuth({ user }: Props) {
    const pathname  = usePathname();
    const isMyPage  = pathname.startsWith('/my');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    if (!user) {
        return (
            <a href="/api/auth/login"
                className="px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all glow-blue"
                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                Get Started
            </a>
        );
    }

    const initial = (user.name ?? user.email ?? 'U')[0].toUpperCase();
    const label   = user.name ?? user.email ?? '';

    return (
        <div className="flex items-center gap-3">

            {/* User dropdown */}
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-muted"
                    aria-expanded={open}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                        {initial}
                    </div>
                    <span className="hidden sm:block text-sm text-muted-foreground max-w-[120px] truncate">
                        {label}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {open && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg z-50 overflow-hidden"
                        style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                        <Link href="/my/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                        </Link>
                        <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                        <a href="/api/auth/logout"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </a>
                    </div>
                )}
            </div>

            {/* My Devices CTA — hidden when already inside the My portal */}
            {!isMyPage && (
                <Link href="/my/devices"
                    className="px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all glow-blue"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    My Devices
                </Link>
            )}
        </div>
    );
}
