import type { Metadata } from 'next';
import ProfileClient from './profile-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Profile' };

export default function MyProfilePage() {
    return <ProfileClient />;
}
