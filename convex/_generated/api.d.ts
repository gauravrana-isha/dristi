/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as classify from "../classify.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_keywords from "../lib/keywords.js";
import type * as lib_schemas from "../lib/schemas.js";
import type * as queries_accounts from "../queries/accounts.js";
import type * as queries_admin from "../queries/admin.js";
import type * as queries_dashboard from "../queries/dashboard.js";
import type * as queries_network from "../queries/network.js";
import type * as queries_platforms from "../queries/platforms.js";
import type * as queries_posts from "../queries/posts.js";
import type * as queries_themes from "../queries/themes.js";
import type * as queries_timeline from "../queries/timeline.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  classify: typeof classify;
  http: typeof http;
  ingest: typeof ingest;
  "lib/gemini": typeof lib_gemini;
  "lib/keywords": typeof lib_keywords;
  "lib/schemas": typeof lib_schemas;
  "queries/accounts": typeof queries_accounts;
  "queries/admin": typeof queries_admin;
  "queries/dashboard": typeof queries_dashboard;
  "queries/network": typeof queries_network;
  "queries/platforms": typeof queries_platforms;
  "queries/posts": typeof queries_posts;
  "queries/themes": typeof queries_themes;
  "queries/timeline": typeof queries_timeline;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
