import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Card from "../components/shared/Card";

export default function AdminPage() {
  const runs = useQuery(api.queries.admin.getRecentScraperRuns, { limit: 10 });
  const errors = useQuery(api.queries.admin.getScraperErrors, { limit: 10 });
  const classStats = useQuery(api.queries.admin.getClassificationStats);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">⚙️ Admin Health Panel</h2>

      {classStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Pending", value: classStats.pending, color: "text-gray-500" },
            { label: "Classified", value: classStats.classified, color: "text-success" },
            { label: "Low Confidence", value: classStats.lowConfidence, color: "text-warning" },
            { label: "Failed", value: classStats.failed, color: "text-danger" },
            { label: "Irrelevant", value: classStats.irrelevant, color: "text-gray-400" },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Scraper Runs">
          <div className="space-y-2">
            {(runs?.runs ?? []).map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50 text-sm"
              >
                <span className="font-medium">{r.platform}</span>
                <span className={r.status === "success" ? "text-success" : r.status === "failed" ? "text-danger" : "text-warning"}>
                  {r.status}
                </span>
                <span className="text-xs text-gray-500">
                  {r.post_count} posts · {new Date(r.completed_at).toLocaleString()}
                </span>
              </div>
            ))}
            {(!runs || runs.runs.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No runs yet</p>
            )}
          </div>
        </Card>

        <Card title="Recent Errors">
          <div className="space-y-2">
            {(errors?.errors ?? []).map((e) => (
              <div
                key={e._id}
                className="p-2 rounded bg-danger/5 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-danger">{e.error_type}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {e.error_message}
                </p>
              </div>
            ))}
            {(!errors || errors.errors.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No errors</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
