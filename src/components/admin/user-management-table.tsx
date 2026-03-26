import type { Charity, UserProfile } from "@/lib/types";

interface UserManagementTableProps {
  users: UserProfile[];
  charities: Charity[];
  getMatchCount: (user: UserProfile) => number;
}

export function UserManagementTable({
  users,
  charities,
  getMatchCount,
}: UserManagementTableProps) {
  return (
    <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
        User management
      </p>
      <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-5 py-4 font-medium">User</th>
              <th className="px-5 py-4 font-medium">Plan</th>
              <th className="px-5 py-4 font-medium">Charity</th>
              <th className="px-5 py-4 font-medium">Matches</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-950">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </td>
                <td className="px-5 py-4 capitalize text-slate-700">
                  {user.subscription.plan}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {charities.find((charity) => charity.id === user.charityId)?.name ??
                    "Unassigned"}
                </td>
                <td className="px-5 py-4 text-slate-700">{getMatchCount(user)}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {user.subscription.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
