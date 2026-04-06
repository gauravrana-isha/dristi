import { query } from "../_generated/server";
import { v } from "convex/values";

export const getThemeBreakdown = query({
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

    // Group by theme — each post can have multiple themes
    const themeMap = new Map<string, number>();

    for (const post of posts) {
      if (post.themes && post.themes.length > 0) {
        for (const theme of post.themes) {
          themeMap.set(theme, (themeMap.get(theme) ?? 0) + 1);
        }
      }
    }

    // Sort by count descending
    const themes = Array.from(themeMap.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    return { themes };
  },
});
