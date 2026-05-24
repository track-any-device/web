import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Changelog – TAD101 | Track Any Device' };

const entries = [
    { date: '2024-05-01', version: '1.0.0', author: 'TAD Team', change: 'Initial release of TAD101 protocol specification.' },
    { date: '2024-06-01', version: '1.0.1', author: 'TAD Team', change: 'Added raspberry-pi guide and systemd service example.' },
];

export default function ChangelogPage() {
    return (
        <>
<p>
                Every change to TAD101, its driver, sensors, or commands is
                recorded here.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Version</th>
                        <th>Author</th>
                        <th>Change</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e) => (
                        <tr key={`${e.date}-${e.version}`}>
                            <td>{e.date}</td>
                            <td>
                                <code>{e.version}</code>
                            </td>
                            <td>{e.author}</td>
                            <td>{e.change}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
