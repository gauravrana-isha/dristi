import Badge from "../shared/Badge";

interface Account {
  author: string;
  platform: string;
  postCount: number;
  hateCount: number;
  misinfoCount: number;
  latestPostDate: number;
}

interface Props {
  accounts: Account[];
}

export default function TopAccounts({ accounts }: Props) {
  return (
    <ul className="space-y-2" aria-label="Top accounts list">
      {accounts.map((a) => (
        <li
          key={a.author}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div>
            <p className="font-medium text-sm">{a.author}</p>
            <div className="flex gap-2 mt-1">
              <Badge type="platform" value={a.platform} />
              <span className="text-xs text-gray-500">
                {a.postCount} posts · {a.hateCount}H / {a.misinfoCount}M
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(a.latestPostDate).toLocaleDateString()}
          </span>
        </li>
      ))}
      {accounts.length === 0 && (
        <p className="text-center text-gray-500 py-4 text-sm">No accounts yet</p>
      )}
    </ul>
  );
}
