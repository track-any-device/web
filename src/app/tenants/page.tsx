import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  color_scheme: string | null;
}

const TENANTS_QUERY = gql`
  query Tenants {
    tenants {
      id
      name
      slug
      color_scheme
    }
  }
`;

export const metadata = {
  title: 'Tenants — Track Any Device',
};

export default async function TenantsPage() {
  let tenants: Tenant[] = [];
  let error: string | null = null;

  try {
    const client = makeServerClient();
    const { data } = await client.query<{ tenants: Tenant[] }>({ query: TENANTS_QUERY });
    tenants = data.tenants ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load tenants.';
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Tenants</h1>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">{error}</p>
      )}

      {!error && tenants.length === 0 && (
        <p className="text-gray-400 text-sm">No tenants found.</p>
      )}

      {tenants.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Colour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400">{tenant.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-6 py-4 text-gray-600">{tenant.slug}</td>
                  <td className="px-6 py-4">
                    {tenant.color_scheme ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: tenant.color_scheme }}
                        />
                        <span className="text-gray-500 font-mono text-xs">{tenant.color_scheme}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
