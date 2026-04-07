import { query } from "../_generated/server";
import { v } from "convex/values";

export const getTopAccounts = query({
  args: {
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"), v.literal("neutral"), v.literal("positive"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Fetch all classified posts, optionally filtered by category
    let posts;
    if (args.category) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      // Further filter to classified status only
      posts = posts.filter((p) => p.status === "classified");
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "classified"))
        .collect();
    }

    // Aggregate by author
    const accountMap = new Map<
      string,
      {
        author: string;
        platform: string;
        postCount: number;
        hateCount: number;
        misinfoCount: number;
        latestPostDate: number;
      }
    >();

    for (const post of posts) {
      const existing = accountMap.get(post.author);
      if (existing) {
        existing.postCount += 1;
        if (post.category === "hate") existing.hateCount += 1;
        if (post.category === "misinfo") existing.misinfoCount += 1;
        if (post.post_timestamp > existing.latestPostDate) {
          existing.latestPostDate = post.post_timestamp;
        }
      } else {
        accountMap.set(post.author, {
          author: post.author,
          platform: post.platform,
          postCount: 1,
          hateCount: post.category === "hate" ? 1 : 0,
          misinfoCount: post.category === "misinfo" ? 1 : 0,
          latestPostDate: post.post_timestamp,
        });
      }
    }

    // Sort by postCount descending and apply limit
    const accounts = Array.from(accountMap.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit);

    return accounts;
  },
});
