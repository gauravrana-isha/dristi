import { query } from "../_generated/server";
import { v } from "convex/values";

export const getNetworkData = query({
  args: {
    category: v.optional(v.union(v.literal("hate"), v.literal("misinfo"), v.literal("neutral"), v.literal("positive"))),
  },
  handler: async (ctx, args) => {
    // 1. Fetch all classified posts, optionally filtered by category
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

    // 2. Build nodes from unique authors
    const authorMap = new Map<
      string,
      {
        platform: string;
        postCount: number;
        hasHate: boolean;
        hasMisinfo: boolean;
        themes: Set<string>;
      }
    >();

    for (const post of posts) {
      const existing = authorMap.get(post.author);
      if (existing) {
        existing.postCount += 1;
        if (post.category === "hate") existing.hasHate = true;
        if (post.category === "misinfo") existing.hasMisinfo = true;
        if (post.themes) {
          for (const theme of post.themes) {
            existing.themes.add(theme);
          }
        }
      } else {
        authorMap.set(post.author, {
          platform: post.platform,
          postCount: 1,
          hasHate: post.category === "hate",
          hasMisinfo: post.category === "misinfo",
          themes: new Set(post.themes ?? []),
        });
      }
    }

    const nodes = Array.from(authorMap.entries()).map(([author, data]) => {
      let category: "hate" | "misinfo" | "both";
      if (data.hasHate && data.hasMisinfo) {
        category = "both";
      } else if (data.hasHate) {
        category = "hate";
      } else {
        category = "misinfo";
      }

      return {
        id: author,
        label: author,
        platform: data.platform,
        postCount: data.postCount,
        category,
        size: Math.max(3, Math.sqrt(data.postCount) * 3),
      };
    });

    // 3. Build edges between authors who share themes
    const authors = Array.from(authorMap.entries());
    const edges: {
      id: string;
      source: string;
      target: string;
      weight: number;
      type: "shared_theme";
    }[] = [];

    for (let i = 0; i < authors.length; i++) {
      for (let j = i + 1; j < authors.length; j++) {
        const [authorA, dataA] = authors[i];
        const [authorB, dataB] = authors[j];

        // Count shared themes
        let sharedCount = 0;
        for (const theme of dataA.themes) {
          if (dataB.themes.has(theme)) {
            sharedCount++;
          }
        }

        if (sharedCount > 0) {
          edges.push({
            id: `${authorA}-${authorB}`,
            source: authorA,
            target: authorB,
            weight: sharedCount,
            type: "shared_theme",
          });
        }
      }
    }

    return { nodes, edges };
  },
});
