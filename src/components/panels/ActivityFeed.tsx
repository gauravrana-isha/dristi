import Badge from "../shared/Badge";

interface Post {
  _id: string;
  platform: string;
  author: string;
  content: string;
  category?: string;
  severity?: string;
  ingested_at: number;
}

interface Props {
  posts: Post[];
}

export default function ActivityFeed({ posts }: Props) {
  return (
    <div className="space-y-2" aria-label="Recent activity feed" role="feed">
      {posts.map((p) => (
        <div
          key={p._id}
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm"
          role="article"
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge type="platform" value={p.platform} />
            {p.severity && <Badge type="severity" value={p.severity} />}
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(p.ingested_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 truncate">{p.content}</p>
          <p className="text-xs text-gray-500 mt-1">@{p.author}</p>
        </div>
      ))}
      {posts.length === 0 && (
        <p className="text-center text-gray-500 py-4 text-sm">Waiting for data…</p>
      )}
    </div>
  );
}
