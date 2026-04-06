import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTrackFilter } from "../hooks/useTrackFilter";
import StatsHero from "../components/panels/StatsHero";
import TrackToggle from "../components/shared/TrackToggle";
import Card from "../components/shared/Card";
import TimelineChart from "../components/charts/TimelineChart";
import PlatformChart from "../components/charts/PlatformChart";
import SeverityChart from "../components/charts/SeverityChart";
import ThemeChart from "../components/charts/ThemeChart";
import TopPosts from "../components/panels/TopPosts";
import TopAccounts from "../components/panels/TopAccounts";
import ActivityFeed from "../components/panels/ActivityFeed";

export default function DashboardPage() {
  const { track, setTrack } = useTrackFilter();
  const stats = useQuery(api.queries.dashboard.getDashboardStats);
  const timeline = useQuery(api.queries.timeline.getTimelineSeries, { category: track });
  const platforms = useQuery(api.queries.platforms.getPlatformBreakdown, { category: track });
  const themes = useQuery(api.queries.themes.getThemeBreakdown, { category: track });
  const posts = useQuery(api.queries.posts.getPostsByCategory, { category: track, limit: 10 });
  const accounts = useQuery(api.queries.accounts.getTopAccounts, { category: track, limit: 10 });
  const recentPosts = useQuery(api.queries.posts.getPostsByCategory, { limit: 20 });

  return (
    <div>
      {stats && (
        <StatsHero
          totalPosts={stats.totalPosts}
          classifiedPosts={stats.classifiedPosts}
          hatePosts={stats.hatePosts}
          misinfoPosts={stats.misinfoPosts}
          dateRange={stats.dateRange}
        />
      )}

      <div className="mb-6">
        <TrackToggle track={track} onChange={setTrack} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Timeline">
          <TimelineChart series={timeline?.series ?? []} />
        </Card>
        <Card title="Platform Breakdown">
          <PlatformChart platforms={platforms?.platforms ?? []} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Severity Distribution">
          <SeverityChart severities={[]} />
        </Card>
        <Card title="Theme Breakdown">
          <ThemeChart themes={themes?.themes ?? []} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Top Posts" className="lg:col-span-2">
          <TopPosts posts={posts?.posts ?? []} />
        </Card>
        <div className="space-y-6">
          <Card title="Top Accounts">
            <TopAccounts accounts={accounts ?? []} />
          </Card>
          <Card title="Recent Activity">
            <ActivityFeed posts={(recentPosts?.posts ?? []) as any} />
          </Card>
        </div>
      </div>
    </div>
  );
}
