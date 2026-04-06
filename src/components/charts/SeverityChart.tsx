import { Bar } from "react-chartjs-2";
import { SEVERITY_COLORS } from "../../lib/chartConfig";
import ChartErrorBoundary from "./ChartErrorBoundary";

interface Props {
  severities: { severity: string; count: number }[];
}

export default function SeverityChart({ severities }: Props) {
  const data = {
    labels: severities.map((s) => s.severity),
    datasets: [
      {
        label: "Posts",
        data: severities.map((s) => s.count),
        backgroundColor: severities.map(
          (s) => SEVERITY_COLORS[s.severity] ?? "#868686"
        ),
      },
    ],
  };

  return (
    <ChartErrorBoundary>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        }}
        aria-label="Severity distribution chart"
      />
    </ChartErrorBoundary>
  );
}
