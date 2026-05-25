import { cookies } from 'next/headers';

export const SSO_CLIENT_ID     = process.env.SSO_CLIENT_ID     ?? 'tci_web_12mMfRVHC8MMDNZZ0E5HwWteehdREJHb';
export const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET ?? '';
export const SSO_REDIRECT_URI  = process.env.SSO_REDIRECT_URI  ?? 'https://track-any-device.com/sso/callback';
export const SSO_AUTH_URL      = process.env.SSO_AUTH_URL      ?? 'https://login.track-any-device.com/oauth/authorize';
export const SSO_TOKEN_URL     = process.env.SSO_TOKEN_URL     ?? 'https://login.track-any-device.com/oauth/token';
export const SSO_USERINFO_URL  = process.env.SSO_USERINFO_URL  ?? 'https://login.track-any-device.com/oauth/userinfo';

export const SESSION_COOKIE  = 'tad_session';
export const STATE_COOKIE    = 'tad_oauth_state';

export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     SSO_CLIENT_ID,
    redirect_uri:  SSO_REDIRECT_URI,
    scope:         'openid profile email',
    state,
  });
  return `${SSO_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in?: number; refresh_token?: string } | null> {
  try {
    const res = await fetch(SSO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  SSO_REDIRECT_URI,
        client_id:     SSO_CLIENT_ID,
        client_secret: SSO_CLIENT_SECRET,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getUserInfo(accessToken: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(SSO_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ token: string; user?: Record<string, unknown> } | null> {
  const jar  = await cookies();
  const raw  = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function encodeSession(data: { token: string; user?: Record<string, unknown> }): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
