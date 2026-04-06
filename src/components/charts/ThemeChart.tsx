import { Bar } from "react-chartjs-2";
import { CHART_COLORS } from "../../lib/chartConfig";
import ChartErrorBoundary from "./ChartErrorBoundary";

interface Props {
  themes: { theme: string; count: number }[];
}

export default function ThemeChart({ themes }: Props) {
  const data = {
    labels: themes.map((t) => t.theme.replace(/_/g, " ")),
    datasets: [
      {
        label: "Posts",
        data: themes.map((t) => t.count),
        backgroundColor: CHART_COLORS.primary + "99",
        borderColor: CHART_COLORS.primary,
        borderWidth: 1,
      },
    ],
  };

  return (
    <ChartErrorBoundary>
      <Bar
        data={data}
        options={{
          indexAxis: "y",
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } },
        }}
        aria-label="Theme breakdown chart"
      />
    </ChartErrorBoundary>
  );
}
