import { httpRouter } from "convex/server";
import { ingestPosts } from "./ingest";

const http = httpRouter();

http.route({
  path: "/api/ingest",
  method: "POST",
  handler: ingestPosts,
});

export default http;
