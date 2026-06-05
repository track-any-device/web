'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAuthToken, getAuthUser, clearAuth, type AuthUser } from '@/lib/auth-store'

interface AuthState {
    token: string | null
    user: AuthUser | null
    loading: boolean
    logout: () => void
}

export function useAuth(): AuthState {
    const [token, setToken]     = useState<string | null>(null)
    const [user, setUser]       = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setToken(getAuthToken())
        setUser(getAuthUser())
        setLoading(false)

        function onStorage(e: StorageEvent) {
            if (e.key === 'tad_token')  setToken(getAuthToken())
            if (e.key === 'tad_user')   setUser(getAuthUser())
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const logout = useCallback(() => {
        clearAuth()
        window.location.href = '/api/auth/logout'
    }, [])

    return { token, user, loading, logout }
}
