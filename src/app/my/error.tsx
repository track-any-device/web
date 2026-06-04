'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MyError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[my portal error]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-96 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Something went wrong
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Could not load your dashboard. This is usually a temporary issue.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try again
                </button>
                <Link
                    href="/api/auth/logout"
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Sign out
                </Link>
            </div>
            {error.digest && (
                <p className="mt-4 text-xs text-gray-400">Ref: {error.digest}</p>
            )}
        </div>
    );
}
