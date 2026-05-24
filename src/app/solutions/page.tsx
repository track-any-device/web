import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Solutions' };

const QUERY = gql`
  query Solutions {
    solutions {
      id title slug description icon_name
      gradient_from gradient_to cta_label cta_href
    }
  }
`;

interface Solution { id: string; title: string; slug: string; description: string; icon_name: string; gradient_from: string; gradient_to: string; cta_label: string; cta_href: string; }

export default async function SolutionsPage() {
  let items: Solution[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.solutions ?? [];
  } catch {}

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Solutions</h1>
      <p className="text-gray-500 mb-8">Industry-specific tracking and monitoring solutions.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(s => (
          <div key={s.id} id={s.slug}
            className="rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition">
            <div className="h-32 flex items-center justify-center text-4xl text-white"
              style={{ background: `linear-gradient(135deg, ${s.gradient_from ?? '#3b82f6'}, ${s.gradient_to ?? '#1d4ed8'})` }}>
              {s.icon_name ?? '⚙️'}
            </div>
            <div className="p-5">
              <h2 className="font-semibold text-gray-900 text-base">{s.title}</h2>
              {s.description && <p className="text-sm text-gray-500 mt-1 line-clamp-3">{s.description}</p>}
              {s.cta_href && (
                <a href={s.cta_href} className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline">
                  {s.cta_label ?? 'Learn more'} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
