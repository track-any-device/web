import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const LOGIN_DOMAIN = process.env.LOGIN_DOMAIN ?? 'https://login.track-any-device.com'

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,

    providers: [
        {
            id:           'sso',
            name:         'TAD Account',
            type:         'oauth',
            clientId:     process.env.SSO_CLIENT_ID     ?? 'tad_web_portal',
            clientSecret: process.env.SSO_CLIENT_SECRET ?? 'tad_web_portal_secret',
            authorization: {
                url:    `${LOGIN_DOMAIN}/oauth/authorize`,
                params: { scope: 'openid profile email role fleet:read fleet:write' },
            },
            token:    `${LOGIN_DOMAIN}/oauth/token`,
            userinfo: `${LOGIN_DOMAIN}/api/sso/user`,
            profile(profile: Record<string, unknown>) {
                return {
                    id:    String(profile.id ?? profile.sub ?? ''),
                    name:  (profile.name   as string) ?? null,
                    email: (profile.email  as string) ?? null,
                    image: (profile.avatar as string) ?? null,
                }
            },
        },
    ],

    session: { strategy: 'jwt', maxAge: 86_400 },

    callbacks: {
        ...authConfig.callbacks,

        jwt({ token, account, profile }) {
            if (account?.access_token) {
                token.accessToken = account.access_token
                token.expiresAt   = account.expires_at
            }
            if (profile) {
                const p = profile as Record<string, unknown>
                token.role   = p.role
                token.avatar = p.avatar
            }
            return token
        },

        session({ session, token }) {
            return {
                ...session,
                accessToken: token.accessToken as string | undefined,
                user: {
                    ...session.user,
                    role:   token.role   as string | undefined,
                    avatar: token.avatar as string | undefined,
                },
            }
        },
    },
})

declare module 'next-auth' {
    interface Session {
        accessToken?: string
        user: {
            id?:     string | null
            name?:   string | null
            email?:  string | null
            image?:  string | null
            role?:   string | null
            avatar?: string | null
        }
    }
}
