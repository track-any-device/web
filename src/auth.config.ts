import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-compatible auth config — used only by the middleware.
 * No providers here (OAuth provider uses Node crypto internally).
 * The middleware only needs to check whether a session cookie exists.
 */
export const authConfig: NextAuthConfig = {
    providers: [],

    trustHost: true,

    pages: {
        signIn: '/api/auth/signin/sso',
        error:  '/api/auth/error',
    },

    callbacks: {
        authorized({ auth }) {
            return !!auth
        },
    },
}
