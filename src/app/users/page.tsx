import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

const USERS_QUERY = gql`
  query Users {
    users {
      id
      name
      email
      role
    }
  }
`;

export const metadata = {
  title: 'Users — Track Any Device',
};

export default async function UsersPage() {
  let users: User[] = [];
  let error: string | null = null;

  try {
    const client = makeServerClient();
    const { data } = await client.query<{ users: User[] }>({ query: USERS_QUERY });
    users = data.users ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load users.';
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Users</h1>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">{error}</p>
      )}

      {!error && users.length === 0 && (
        <p className="text-gray-400 text-sm">No users found.</p>
      )}

      {users.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-400">{user.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.role ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {user.role}
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
