import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function GET() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com'));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
