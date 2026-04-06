import { query } from "../_generated/server";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allPosts = await ctx.db.query("posts").collect();

    const totalPosts = allPosts.length;
    const classifiedPosts = allPosts.filter(
      (p) => p.status === "classified"
    ).length;
    const hatePosts = allPosts.filter((p) => p.category === "hate").length;
    const misinfoPosts = allPosts.filter((p) => p.category === "misinfo").length;

    let from: number | null = null;
    let to: number | null = null;

    if (totalPosts > 0) {
      const timestamps = allPosts.map((p) => p.post_timestamp);
      from = Math.min(...timestamps);
      to = Math.max(...timestamps);
    }

    return {
      totalPosts,
      classifiedPosts,
      hatePosts,
      misinfoPosts,
      dateRange: { from, to },
    };
  },
});
