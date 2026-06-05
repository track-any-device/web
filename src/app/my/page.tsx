import { redirect } from 'next/navigation';

export const runtime = 'edge';

// /my is no longer a dashboard — redirect straight to devices
export default function MyIndexPage() {
    redirect('/my/devices');
}
