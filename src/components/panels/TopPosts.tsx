import Badge from "../shared/Badge";

interface Post {
  _id: string;
  source_url: string;
  platform: string;
  author: string;
  content: string;
  severity?: string;
  themes?: string[];
  post_timestamp: number;
}

interface Props {
  posts: Post[];
}

export default function TopPosts({ posts }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Top posts table">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400">
            <th className="pb-2">Platform</th>
            <th className="pb-2">Content</th>
            <th className="pb-2">Author</th>
            <th className="pb-2">Severity</th>
            <th className="pb-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2"><Badge type="platform" value={p.platform} /></td>
              <td className="py-2 max-w-xs truncate">
                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  {p.content.slice(0, 80)}…
                </a>
              </td>
              <td className="py-2 text-gray-600 dark:text-gray-400">{p.author}</td>
              <td className="py-2">{p.severity && <Badge type="severity" value={p.severity} />}</td>
              <td className="py-2 text-gray-500 text-xs">
                {new Date(p.post_timestamp).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <p className="text-center text-gray-500 py-8 text-sm">No posts yet</p>
      )}
    </div>
  );
}
