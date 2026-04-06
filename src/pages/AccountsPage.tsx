import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Badge from "../components/shared/Badge";

export default function AccountsPage() {
  const accounts = useQuery(api.queries.accounts.getTopAccounts, { limit: 50 });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Top Accounts</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Accounts ranked by flagged posts">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500">
              <th className="pb-2">#</th>
              <th className="pb-2">Account</th>
              <th className="pb-2">Platform</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Hate</th>
              <th className="pb-2">Misinfo</th>
              <th className="pb-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {(accounts ?? []).map((a, i) => (
              <tr key={a.author} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-400">{i + 1}</td>
                <td className="py-2 font-medium">{a.author}</td>
                <td className="py-2"><Badge type="platform" value={a.platform} /></td>
                <td className="py-2 font-bold">{a.postCount}</td>
                <td className="py-2 text-danger">{a.hateCount}</td>
                <td className="py-2 text-warning">{a.misinfoCount}</td>
                <td className="py-2 text-xs text-gray-500">
                  {new Date(a.latestPostDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!accounts || accounts.length === 0) && (
          <p className="text-center text-gray-500 py-8 text-sm">No accounts yet</p>
        )}
      </div>
    </div>
  );
}
