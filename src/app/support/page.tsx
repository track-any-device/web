import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Support' };

const DOCS = [
  { title: 'User Manual',       href: '/docs/user-manual',    description: 'Getting started with your TAD devices and the my portal.' },
  { title: 'TAD101 Protocol',   href: '/docs/tad101',         description: 'Universal device communication protocol documentation.' },
  { title: 'Tenant Manual',     href: '/docs/tenant-manual',  description: 'Managing fleets, beats, and incidents as an organization.' },
  { title: 'Tenant API',        href: '/docs/tenant-api',     description: 'REST API reference for tenant integrations.' },
  { title: 'JT808 Protocol',    href: '/docs/jt808',          description: 'JT/T 808 protocol support for compatible devices.' },
  { title: 'Engineers Manual',  href: '/docs/engineers-manual', description: 'Deep-dive technical reference for hardware engineers.' },
];

const CONTACT_METHODS = [
  {
    icon: '✉️',
    label: 'Email Support',
    value: 'support@track-any-device.com',
    href: 'mailto:support@track-any-device.com',
    description: 'General enquiries, billing, and account issues. Response within 24 hours.',
  },
  {
    icon: '🐛',
    label: 'Bug Reports',
    value: 'GitHub Issues',
    href: 'https://github.com/track-any-device',
    description: 'Found a bug? Open an issue on our GitHub organisation.',
  },
  {
    icon: '📖',
    label: 'Documentation',
    value: 'docs.track-any-device.com',
    href: '/docs',
    description: 'Browse the full platform documentation.',
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-16">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>Help &amp; Support</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Support</h1>
        <p className="text-lg max-w-xl" style={{ color: '#64748b' }}>
          Need help with your devices, account, or integration? We&apos;re here for you.
        </p>
      </div>

      {/* Contact methods */}
      <section>
        <h2 className="text-xl font-bold mb-5" style={{ color: '#f1f5f9' }}>Contact Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CONTACT_METHODS.map(m => (
            <a key={m.label} href={m.href}
              target={m.href.startsWith('http') ? '_blank' : undefined}
              rel={m.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="card-hover glass rounded-2xl p-6 block group">
              <div className="text-3xl mb-3">{m.icon}</div>
              <p className="font-semibold text-sm mb-0.5 group-hover:text-blue-400 transition-colors"
                style={{ color: '#e2e8f0' }}>{m.label}</p>
              <p className="text-xs font-medium mb-2" style={{ color: '#60a5fa' }}>{m.value}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{m.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Documentation */}
      <section>
        <h2 className="text-xl font-bold mb-5" style={{ color: '#f1f5f9' }}>Documentation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCS.map(doc => (
            <a key={doc.href} href={doc.href}
              className="card-hover glass rounded-xl px-5 py-4 flex items-start gap-4 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(37,99,235,0.15)' }}>
                <span style={{ color: '#60a5fa', fontSize: 16 }}>📄</span>
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-blue-400 transition-colors"
                  style={{ color: '#e2e8f0' }}>{doc.title}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{doc.description}</p>
              </div>
              <span className="ml-auto text-xs shrink-0 mt-0.5" style={{ color: '#475569' }}>→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="rounded-2xl p-6 flex items-center gap-4"
        style={{ background: 'rgba(6,78,59,0.2)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <span className="w-3 h-3 rounded-full bg-emerald-500 pulse-dot shrink-0" />
        <div>
          <p className="font-semibold text-sm" style={{ color: '#6ee7b7' }}>All Systems Operational</p>
          <p className="text-xs mt-0.5" style={{ color: '#064e3b' }}>
            Platform, API, and real-time services are running normally.
          </p>
        </div>
      </section>

    </div>
  );
}
