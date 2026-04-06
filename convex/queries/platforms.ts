import { query } from "../_generated/server";
import { v } from "convex/values";

export const getPlatformBreakdown = query({
  args: {
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"))),
  },
  handler: async (ctx, args) => {
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

    // Group by platform
    const platformMap = new Map<string, number>();

    for (const post of posts) {
      platformMap.set(post.platform, (platformMap.get(post.platform) ?? 0) + 1);
    }

    // Sort by count descending
    const platforms = Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    return { platforms };
  },
});
