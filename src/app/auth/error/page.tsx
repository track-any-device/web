import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in — Track Any Device' };

const MESSAGES: Record<string, string> = {
    Configuration:        'The authentication service is temporarily unavailable.',
    AccessDenied:         'You do not have permission to access this resource.',
    Verification:         'The sign-in link has expired. Please request a new one.',
    TokenExpired:         'Your session has expired. Please sign in again.',
    OAuthSignin:          'Could not start the sign-in flow. Please try again.',
    OAuthCallback:        'Could not complete sign-in. Please try again.',
    OAuthCreateAccount:   'Could not create your account. Please try again.',
    OAuthAccountNotLinked:'This account is already linked to another user.',
    Default:              'An unexpected error occurred. Please try again.',
};

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const message = MESSAGES[error ?? ''] ?? MESSAGES.Default;

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Sign-in failed
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                    {error && (
                        <p className="mt-1 text-xs text-gray-400 font-mono">
                            code: {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                        href="/api/auth/signin/sso"
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}
                    >
                        Try again
                    </a>
                    <a
                        href="/"
                        className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Go home
                    </a>
                </div>
            </div>
        </div>
    );
}
