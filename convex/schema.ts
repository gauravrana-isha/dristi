import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    // Source data (from RawPost)
    source_url: v.string(),
    platform: v.union(
      v.literal("twitter"),
      v.literal("youtube"),
      v.literal("instagram"),
      v.literal("news")
    ),
    author: v.string(),
    author_id: v.optional(v.string()),
    content: v.string(),
    post_timestamp: v.number(),
    raw_metadata: v.optional(v.any()),

    // Classification result
    status: v.union(
      v.literal("pending_classification"),
      v.literal("classified"),
      v.literal("low_confidence"),
      v.literal("classification_failed"),
      v.literal("irrelevant")
    ),
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"), v.literal("neutral"), v.literal("positive"))),
    severity: v.optional(
      v.union(
        v.literal("none"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    themes: v.optional(v.array(v.string())),
    confidence: v.optional(v.number()),
    reasoning: v.optional(v.string()),

    // Metadata
    ingested_at: v.number(),
    classified_at: v.optional(v.number()),
  })
    .index("by_source_url", ["source_url"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_platform", ["platform"])
    .index("by_category_severity", ["category", "severity"])
    .index("by_author", ["author"])
    .index("by_post_timestamp", ["post_timestamp"]),

  scraper_runs: defineTable({
    platform: v.string(),
    post_count: v.number(),
    duplicates_skipped: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ),
    started_at: v.number(),
    completed_at: v.number(),
    error_message: v.optional(v.string()),
  })
    .index("by_platform", ["platform"])
    .index("by_completed_at", ["completed_at"]),

  scraper_errors: defineTable({
    platform: v.string(),
    error_type: v.string(),
    error_message: v.string(),
    context: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_platform", ["platform"])
    .index("by_timestamp", ["timestamp"]),
});
