import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Command Registry – TAD101 | Track Any Device' };

type Command = { name: string; label: string; params: Record<string, string> };
type Category = 'tracking' | 'device' | 'system';

const CATEGORY_LABEL: Record<Category, string> = {
    tracking: 'Tracking',
    device:   'Device control',
    system:   'System',
};

const commands: Record<Category, Command[]> = {
    tracking: [
        { name: 'tad101.track.start',  label: 'Start tracking',  params: { interval: 'seconds' } },
        { name: 'tad101.track.stop',   label: 'Stop tracking',   params: {} },
        { name: 'tad101.track.once',   label: 'One-shot report', params: {} },
    ],
    device: [
        { name: 'tad101.ping',         label: 'Ping device',     params: {} },
        { name: 'tad101.reboot',       label: 'Reboot device',   params: {} },
    ],
    system: [
        { name: 'tad101.config.set',   label: 'Set config key',  params: { key: 'string', value: 'string' } },
        { name: 'tad101.config.get',   label: 'Get config key',  params: { key: 'string' } },
    ],
};

const categories = Object.keys(commands) as Category[];

export default function CommandsPage() {
    return (
        <>
<p>
                TAD101 is a strict superset of every other driver's commands.
                Every entry here can be sent over the live WebSocket; commands
                with a GSM equivalent will also fall back to SMS when the device
                record has a <code>gsm_number</code> and the stream is
                unavailable.
            </p>

            {categories.map((category) => (
                <section key={category} className="not-prose mt-8 first:mt-0">
                    <h2 className="mb-3 text-xl font-semibold text-neutral-900">
                        {CATEGORY_LABEL[category] ?? category}
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2">Command</th>
                                    <th className="px-3 py-2">Label</th>
                                    <th className="px-3 py-2">Parameters</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commands[category].map((cmd) => (
                                    <tr
                                        key={cmd.name}
                                        className="border-t border-neutral-100"
                                    >
                                        <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                                            {cmd.name}
                                        </td>
                                        <td className="px-3 py-2">
                                            {cmd.label}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-neutral-500">
                                            {Object.keys(cmd.params).length ===
                                            0 ? (
                                                <em>none</em>
                                            ) : (
                                                Object.entries(cmd.params).map(
                                                    ([k]) => (
                                                        <code
                                                            key={k}
                                                            className="mr-1 rounded bg-neutral-100 px-1"
                                                        >
                                                            {k}
                                                        </code>
                                                    ),
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </>
    );
}
