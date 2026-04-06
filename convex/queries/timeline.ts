import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Returns the Monday of the ISO week containing the given date.
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Shift so Monday = 0
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return formatDate(d);
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const getTimelineSeries = query({
  args: {
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"))),
    granularity: v.optional(v.union(v.literal("day"), v.literal("week"))),
  },
  handler: async (ctx, args) => {
    const granularity = args.granularity ?? "day";

    // Fetch classified posts, optionally filtered by category
    let posts;
    if (args.category) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      posts = posts.filter((p) => p.status === "classified");
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "classified"))
        .collect();
    }

    // Group by date bucket
    const bucketMap = new Map<string, number>();

    for (const post of posts) {
      const date = new Date(post.post_timestamp);
      const key =
        granularity === "week" ? getWeekStart(date) : formatDate(date);

      bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
    }

    // Sort by date ascending
    const series = Array.from(bucketMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { series };
  },
});
