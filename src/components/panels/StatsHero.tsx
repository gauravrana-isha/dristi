import Card from "../shared/Card";

interface Props {
  totalPosts: number;
  classifiedPosts: number;
  hatePosts: number;
  misinfoPosts: number;
  dateRange: { from: number | null; to: number | null };
}

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StatsHero({ totalPosts, classifiedPosts, hatePosts, misinfoPosts, dateRange }: Props) {
  const stats = [
    { label: "Total Posts", value: totalPosts, color: "text-primary" },
    { label: "Classified", value: classifiedPosts, color: "text-success" },
    { label: "Hate Posts", value: hatePosts, color: "text-danger" },
    { label: "Misinfo Posts", value: misinfoPosts, color: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
        </Card>
      ))}
      <Card className="col-span-2 md:col-span-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Data range: {formatDate(dateRange.from)} — {formatDate(dateRange.to)}
        </p>
      </Card>
    </div>
  );
}
