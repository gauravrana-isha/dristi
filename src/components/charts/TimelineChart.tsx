import { Line } from "react-chartjs-2";
import { CHART_COLORS } from "../../lib/chartConfig";
import ChartErrorBoundary from "./ChartErrorBoundary";

interface Props {
  series: { date: string; count: number }[];
}

export default function TimelineChart({ series }: Props) {
  const data = {
    labels: series.map((s) => s.date),
    datasets: [
      {
        label: "Posts",
        data: series.map((s) => s.count),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primary + "33",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <ChartErrorBoundary>
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        }}
        aria-label="Timeline chart showing post volume over time"
      />
    </ChartErrorBoundary>
  );
}
