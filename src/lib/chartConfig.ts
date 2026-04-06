import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

Chart.defaults.font.family = '"Noto Sans", sans-serif';
Chart.defaults.color = "#9B9B9B";
Chart.defaults.borderColor = "rgba(255,255,255,0.08)";

export const CHART_COLORS = {
  primary: "#613AF5",
  danger: "#B7131A",
  warning: "#B77224",
  success: "#3C9718",
  info: "#00AAFF",
  purple: "#6f42c1",
  pink: "#d63384",
  teal: "#20c997",
};

export const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#00AAFF",
  youtube: "#B7131A",
  instagram: "#d63384",
  news: "#B77224",
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: "#3C9718",
  medium: "#B77224",
  high: "#B7131A",
  critical: "#613AF5",
};
