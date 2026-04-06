import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateRawPost } from "./lib/schemas";

// --- Internal mutations for DB operations ---

export const insertPost = internalMutation({
  args: {
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
    ingested_at: v.number(),
    status: v.literal("pending_classification"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", args);
  },
});

export const checkDuplicate = internalMutation({
  args: { source_url: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_source_url", (q) => q.eq("source_url", args.source_url))
      .first();
    return existing !== null;
  },
});

export const recordScraperRun = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scraper_runs", args);
  },
});

export const recordScraperError = internalMutation({
  args: {
    platform: v.string(),
    error_type: v.string(),
    error_message: v.string(),
    context: v.optional(v.any()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scraper_errors", args);
  },
});

// --- HTTP Action: ingestPosts ---

export const ingestPosts = httpAction(async (ctx, request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate top-level shape: { posts: RawPost[] }
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).posts)
  ) {
    return new Response(
      JSON.stringify({ error: "Expected { posts: RawPost[] }" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const posts = (body as { posts: unknown[] }).posts;
  const startedAt = Date.now();

  let ingested = 0;
  let duplicates = 0;
  let rejected = 0;
  const errors: string[] = [];
  const newPostIds: string[] = [];
  let platform = "unknown";

  for (const rawPost of posts) {
    // Validate each post
    const validation = validateRawPost(rawPost);
    if (!validation.valid) {
      rejected++;
      const errorMsg = `Validation failed: ${validation.errors.join("; ")}`;
      errors.push(errorMsg);

      // Log validation error to scraper_errors
      const postObj = rawPost as Record<string, unknown>;
      await ctx.runMutation(internal.ingest.recordScraperError, {
        platform: typeof postObj.platform === "string" ? postObj.platform : "unknown",
        error_type: "validation_error",
        error_message: errorMsg,
        context: rawPost as any,
        timestamp: Date.now(),
      });
      continue;
    }

    const post = rawPost as {
      source_url: string;
      platform: "twitter" | "youtube" | "instagram" | "news";
      author: string;
      author_id?: string;
      content: string;
      post_timestamp: number;
      raw_metadata?: any;
    };

    // Track platform from first valid post
    if (platform === "unknown") {
      platform = post.platform;
    }

    // Check for duplicate by source_url
    const isDuplicate = await ctx.runMutation(internal.ingest.checkDuplicate, {
      source_url: post.source_url,
    });

    if (isDuplicate) {
      duplicates++;
      continue;
    }

    // Insert new post
    const insertArgs: {
      source_url: string;
      platform: "twitter" | "youtube" | "instagram" | "news";
      author: string;
      author_id?: string;
      content: string;
      post_timestamp: number;
      raw_metadata?: any;
      ingested_at: number;
      status: "pending_classification";
    } = {
      source_url: post.source_url,
      platform: post.platform,
      author: post.author,
      content: post.content,
      post_timestamp: post.post_timestamp,
      ingested_at: Date.now(),
      status: "pending_classification" as const,
    };

    if (post.author_id !== undefined) {
      insertArgs.author_id = post.author_id;
    }
    if (post.raw_metadata !== undefined) {
      insertArgs.raw_metadata = post.raw_metadata;
    }

    const postId = await ctx.runMutation(internal.ingest.insertPost, insertArgs);
    newPostIds.push(postId as unknown as string);
    ingested++;
  }

  // Determine run status
  let runStatus: "success" | "partial" | "failed";
  if (rejected === posts.length && posts.length > 0) {
    runStatus = "failed";
  } else if (rejected > 0) {
    runStatus = "partial";
  } else {
    runStatus = "success";
  }

  // Record scraper_run
  await ctx.runMutation(internal.ingest.recordScraperRun, {
    platform,
    post_count: ingested,
    duplicates_skipped: duplicates,
    status: runStatus,
    started_at: startedAt,
    completed_at: Date.now(),
    ...(errors.length > 0
      ? { error_message: errors.slice(0, 10).join(" | ") }
      : {}),
  });

  // Schedule classification for new posts if any were ingested
  if (ingested > 0) {
    await ctx.scheduler.runAfter(0, internal.classify.classifyBatch);
  }

  return new Response(
    JSON.stringify({ ingested, duplicates, rejected, errors }),
    { status: 200, headers: corsHeaders }
  );
});
