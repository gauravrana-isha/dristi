import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import NetworkGraph from "../components/network/NetworkGraph";
import ChartErrorBoundary from "../components/charts/ChartErrorBoundary";

export default function NetworkPage() {
  const data = useQuery(api.queries.network.getNetworkData, {});

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">🕸️ Network Map</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Accounts connected by shared themes. Node size = post count, color = category.
      </p>
      <ChartErrorBoundary>
        <NetworkGraph nodes={data?.nodes ?? []} edges={data?.edges ?? []} />
      </ChartErrorBoundary>
    </div>
  );
}
