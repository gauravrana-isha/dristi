import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Card from "../components/shared/Card";
import TimelineChart from "../components/charts/TimelineChart";
import PlatformChart from "../components/charts/PlatformChart";
import ThemeChart from "../components/charts/ThemeChart";
import TopPosts from "../components/panels/TopPosts";
import TopAccounts from "../components/panels/TopAccounts";

export default function MisinfoTrackPage() {
  const timeline = useQuery(api.queries.timeline.getTimelineSeries, { category: "misinfo" });
  const platforms = useQuery(api.queries.platforms.getPlatformBreakdown, { category: "misinfo" });
  const themes = useQuery(api.queries.themes.getThemeBreakdown, { category: "misinfo" });
  const posts = useQuery(api.queries.posts.getPostsByCategory, { category: "misinfo", limit: 20 });
  const accounts = useQuery(api.queries.accounts.getTopAccounts, { category: "misinfo", limit: 10 });

  return (
    <div>
      <h2 className="text-xl font-bold text-warning mb-6">🟠 Misinfo Track</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Timeline"><TimelineChart series={timeline?.series ?? []} /></Card>
        <Card title="Platform Breakdown"><PlatformChart platforms={platforms?.platforms ?? []} /></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Theme Breakdown"><ThemeChart themes={themes?.themes ?? []} /></Card>
        <Card title="Top Accounts"><TopAccounts accounts={accounts ?? []} /></Card>
      </div>
      <Card title="Posts"><TopPosts posts={posts?.posts ?? []} /></Card>
    </div>
  );
}
