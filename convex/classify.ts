// Convex classification internal action — two-stage classification pipeline
// Stage 1: Keyword pre-filter (local)
// Stage 2: Gemini Flash 2.0 API classification

import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { keywordPreFilter } from "./lib/keywords";
import { classifyPost } from "./lib/gemini";

// --- Helper ---

/** Simple sleep helper wrapping setTimeout */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Internal queries ---

/** Count posts with status "pending_classification" */
export const countPendingPosts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "pending_classification"))
      .collect();
    return pending.length;
  },
});

/** Fetch up to 20 posts with status "pending_classification" */
export const fetchPendingBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "pending_classification"))
      .take(20);
    return posts;
  },
});


// --- Internal mutations ---

/** Update a post with classification result and new status */
export const updatePostClassification = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(v.literal("classified"), v.literal("low_confidence")),
    category: v.union(v.literal("hate"), v.literal("misinfo")),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    themes: v.array(v.string()),
    confidence: v.number(),
    reasoning: v.string(),
    classified_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { postId, ...fields } = args;
    await ctx.db.patch(postId, fields);
  },
});

/** Mark a post as "irrelevant" */
export const markPostIrrelevant = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { status: "irrelevant" });
  },
});

/** Mark a post as "classification_failed" */
export const markPostFailed = internalMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { status: "classification_failed" });
  },
});

/** Log a classification error to scraper_errors */
export const logClassificationError = internalMutation({
  args: {
    platform: v.string(),
    error_type: v.string(),
    error_message: v.string(),
    context: v.optional(v.any()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scraper_errors", args);
  },
});

/** Reset all classification_failed posts back to pending so they can be retried */
export const retryFailedPosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const failed = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "classification_failed"))
      .collect();
    for (const post of failed) {
      await ctx.db.patch(post._id, { status: "pending_classification" });
    }
    return { reset: failed.length };
  },
});

// --- Main classification action ---

/** Minimum delay between Gemini API calls (ms) — respects 15 req/min rate limit */
const GEMINI_CALL_DELAY_MS = 4000;

/** Debug action: test Gemini connection with a simple prompt */
export const testGeminiConnection = internalAction({
  args: {},
  handler: async (_ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (globalThis as any).process?.env ?? {};
    const projectId = env.GCP_PROJECT_ID;
    const region = env.GCP_REGION;
    const serviceAccountKey = env.GCP_SERVICE_ACCOUNT_KEY;
    const apiKey = env.GEMINI_API_KEY;

    console.log(`GCP_PROJECT_ID: ${projectId ? "SET" : "NOT SET"}`);
    console.log(`GCP_REGION: ${region ? "SET" : "NOT SET"}`);
    console.log(`GCP_SERVICE_ACCOUNT_KEY: ${serviceAccountKey ? "SET (" + serviceAccountKey.length + " chars)" : "NOT SET"}`);
    console.log(`GEMINI_API_KEY: ${apiKey ? "SET" : "NOT SET"}`);

    try {
      const result = await classifyPost(
        "Sadhguru is a fraud and a cult leader",
        "twitter",
        projectId && region && serviceAccountKey
          ? { mode: "vertex", projectId, region, serviceAccountKey }
          : { mode: "aistudio", apiKey }
      );
      console.log("SUCCESS:", JSON.stringify(result));
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("FAILED:", msg);
      return { error: msg };
    }
  },
});

/** Max retry attempts for Gemini API errors */
const MAX_RETRIES = 3;

/** Exponential backoff delays (ms) for retries */
const BACKOFF_DELAYS = [2000, 4000, 8000];

/**
 * classifyBatch — internal action that processes up to 20 pending posts.
 *
 * 1. Fetches up to 20 posts with status "pending_classification"
 * 2. Applies Stage 1 keyword pre-filter
 * 3. Non-candidates → marked "irrelevant"
 * 4. Candidates → sent to Gemini Flash 2.0 with rate limiting
 * 5. Results stored based on confidence threshold
 * 6. Schedules next batch if more pending posts exist
 */
export const classifyBatch = internalAction({
  args: {},
  handler: async (ctx) => {
    // Read config from Convex environment variables
    // Supports Vertex AI (GCP_PROJECT_ID + GCP_REGION + GCP_SERVICE_ACCOUNT_KEY)
    // or AI Studio (GEMINI_API_KEY)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (globalThis as any).process?.env ?? {};
    const projectId = env.GCP_PROJECT_ID as string | undefined;
    const region = env.GCP_REGION as string | undefined;
    const serviceAccountKey = env.GCP_SERVICE_ACCOUNT_KEY as string | undefined;
    const apiKey = env.GEMINI_API_KEY as string | undefined;

    const useVertex = !!(projectId && region && serviceAccountKey);

    if (!useVertex && !apiKey) {
      console.error("No Gemini config found. Set either GCP_PROJECT_ID+GCP_REGION+GCP_SERVICE_ACCOUNT_KEY (Vertex AI) or GEMINI_API_KEY (AI Studio)");
      return;
    }

    const geminiConfig = useVertex
      ? { mode: "vertex" as const, projectId, region, serviceAccountKey }
      : { mode: "aistudio" as const, apiKey };

    // Fetch batch of pending posts
    const posts = await ctx.runQuery(internal.classify.fetchPendingBatch);

    if (posts.length === 0) {
      console.log("classifyBatch: no pending posts to process");
      return;
    }

    console.log(`classifyBatch: processing ${posts.length} posts`);

    let geminiCallCount = 0;

    for (const post of posts) {
      // Stage 1: Keyword pre-filter
      const filterResult = keywordPreFilter(post.content);

      if (!filterResult.isCandidate) {
        // Not a candidate — mark as irrelevant
        await ctx.runMutation(internal.classify.markPostIrrelevant, {
          postId: post._id,
        });
        console.log(`Post ${post._id}: marked irrelevant (no keyword match)`);
        continue;
      }

      // Stage 2: Gemini Flash 2.0 classification with retry logic
      let classified = false;
      let lastError = "unknown";

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Enforce minimum delay between Gemini calls
          if (geminiCallCount > 0) {
            await sleep(GEMINI_CALL_DELAY_MS);
          }

          const result = await classifyPost(post.content, post.platform, geminiConfig);
          geminiCallCount++;

          // Determine status based on confidence threshold
          const status: "classified" | "low_confidence" =
            result.confidence >= 0.6 ? "classified" : "low_confidence";

          // Update post with classification result
          await ctx.runMutation(internal.classify.updatePostClassification, {
            postId: post._id,
            status,
            category: result.category,
            severity: result.severity,
            themes: result.themes,
            confidence: result.confidence,
            reasoning: result.reasoning,
            classified_at: Date.now(),
          });

          console.log(
            `Post ${post._id}: ${status} (confidence: ${result.confidence}, category: ${result.category})`
          );
          classified = true;
          break;
        } catch (error) {
          lastError =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Post ${post._id}: Gemini error (attempt ${attempt + 1}/${MAX_RETRIES}): ${lastError}`
          );

          // Apply exponential backoff before retry
          if (attempt < MAX_RETRIES - 1) {
            await sleep(BACKOFF_DELAYS[attempt]);
          }
        }
      }

      // All retries failed — mark as classification_failed and log error
      if (!classified) {
        await ctx.runMutation(internal.classify.markPostFailed, {
          postId: post._id,
        });

        await ctx.runMutation(internal.classify.logClassificationError, {
          platform: post.platform,
          error_type: "classification_failed",
          error_message: `Gemini error: ${lastError}`,
          context: { postId: post._id, source_url: post.source_url },
          timestamp: Date.now(),
        });

        console.error(
          `Post ${post._id}: all retries exhausted, marked classification_failed`
        );
      }
    }

    // Check if there are more pending posts and schedule next batch
    const remainingCount = await ctx.runQuery(internal.classify.countPendingPosts);
    if (remainingCount > 0) {
      console.log(
        `classifyBatch: ${remainingCount} posts still pending, scheduling next batch`
      );
      await ctx.scheduler.runAfter(0, internal.classify.classifyBatch);
    } else {
      console.log("classifyBatch: all pending posts processed");
    }
  },
});
