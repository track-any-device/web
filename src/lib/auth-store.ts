const TOKEN_KEY = 'tad_token'
const USER_KEY  = 'tad_user'

export interface AuthUser {
    id?: number | string
    name?: string
    email?: string
    sub?: string
    role?: string | string[]
}

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
}

export function setAuth(token: string, user?: Record<string, unknown>): void {
    localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}
