import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
    providers: [],

    trustHost: true,

    pages: {
        signIn: '/api/auth/signin/sso',
        // Custom static page — not a NextAuth handler route.
        // This breaks the redirect loop: if NextAuth itself fails,
        // it lands here instead of looping back into the auth handler.
        error: '/auth/error',
    },

    callbacks: {
        authorized({ auth }) {
            if (!auth) return false
            // Passport token expired — force re-login cleanly (one redirect, no loop)
            if ((auth as { error?: string }).error === 'TokenExpired') return false
            return true
        },
    },
}
