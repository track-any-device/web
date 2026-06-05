import { auth } from '@/auth'

/**
 * Thin wrapper around NextAuth's auth() that returns the shape expected
 * by server components: { token, user } or null when unauthenticated.
 *
 * All /my/* pages call this. The middleware already blocks unauthenticated
 * requests so null only occurs if the session expired mid-request.
 */
export async function getSession(): Promise<{
    token: string
    user?: Record<string, unknown>
} | null> {
    const session = await auth()
    if (!session?.accessToken) return null
    return {
        token: session.accessToken,
        user:  session.user as Record<string, unknown>,
    }
}
