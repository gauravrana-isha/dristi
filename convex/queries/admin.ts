import { query } from "../_generated/server";
import { v } from "convex/values";

export const getRecentScraperRuns = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const runs = await ctx.db
      .query("scraper_runs")
      .withIndex("by_completed_at")
      .order("desc")
      .take(limit);

    return { runs };
  },
});

export const getScraperErrors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const errors = await ctx.db
      .query("scraper_errors")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return { errors };
  },
});

export const getClassificationStats = query({
  args: {},
  handler: async (ctx) => {
    const pending = (
      await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "pending_classification"))
        .collect()
    ).length;

    const classified = (
      await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "classified"))
        .collect()
    ).length;

    const lowConfidence = (
      await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "low_confidence"))
        .collect()
    ).length;

    const failed = (
      await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "classification_failed"))
        .collect()
    ).length;

    const irrelevant = (
      await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "irrelevant"))
        .collect()
    ).length;

    return { pending, classified, lowConfidence, failed, irrelevant };
  },
});
