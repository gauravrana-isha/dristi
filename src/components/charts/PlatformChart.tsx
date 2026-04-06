import { Doughnut } from "react-chartjs-2";
import { PLATFORM_COLORS } from "../../lib/chartConfig";
import ChartErrorBoundary from "./ChartErrorBoundary";

interface Props {
  platforms: { platform: string; count: number }[];
}

export default function PlatformChart({ platforms }: Props) {
  const data = {
    labels: platforms.map((p) => p.platform),
    datasets: [
      {
        data: platforms.map((p) => p.count),
        backgroundColor: platforms.map(
          (p) => PLATFORM_COLORS[p.platform] ?? "#868686"
        ),
      },
    ],
  };

  return (
    <ChartErrorBoundary>
      <Doughnut
        data={data}
        options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        aria-label="Platform breakdown chart"
      />
    </ChartErrorBoundary>
  );
}
