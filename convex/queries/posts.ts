import { query } from "../_generated/server";
import { v } from "convex/values";

export const getPostsByCategory = query({
  args: {
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"), v.literal("neutral"), v.literal("positive"))),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let postsQuery;

    if (args.category && args.severity) {
      // Use the composite index for category + severity
      postsQuery = ctx.db
        .query("posts")
        .withIndex("by_category_severity", (q) =>
          q.eq("category", args.category!).eq("severity", args.severity!)
        );
    } else if (args.category) {
      postsQuery = ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category!));
    } else {
      postsQuery = ctx.db.query("posts");
    }

    const allMatched = await postsQuery.collect();

    // Sort by post_timestamp descending
    allMatched.sort((a, b) => b.post_timestamp - a.post_timestamp);

    // Apply limit
    const posts = allMatched.slice(0, limit);

    return {
      posts,
      totalCount: allMatched.length,
      hasMore: allMatched.length > limit,
    };
  },
});
