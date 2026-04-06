const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-success/10 text-success-700 dark:text-success-400",
  medium: "bg-warning/10 text-warning-700 dark:text-warning-400",
  high: "bg-danger/10 text-danger-700 dark:text-danger-400",
  critical: "bg-primary/10 text-primary-700 dark:text-primary-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-info/10 text-info",
  youtube: "bg-danger/10 text-danger",
  instagram: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  news: "bg-warning/10 text-warning",
};

interface Props {
  type: "severity" | "platform";
  value: string;
}

export default function Badge({ type, value }: Props) {
  const colors =
    type === "severity"
      ? SEVERITY_COLORS[value] ?? "bg-gray-100 text-gray-600"
      : PLATFORM_COLORS[value] ?? "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors}`}
      aria-label={`${type}: ${value}`}
    >
      {value}
    </span>
  );
}
