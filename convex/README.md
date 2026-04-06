# Convex Backend

This directory contains the Convex backend for Sadhguru Intel Dashboard.

## Setup

1. Run `npx convex dev` to initialise and connect to your Convex deployment
2. This will auto-generate the `convex/_generated/` directory
3. Set your `VITE_CONVEX_URL` in `.env.local` to the deployment URL provided by Convex

## Structure

- `schema.ts` — Table definitions (posts, scraper_runs, scraper_errors)
- `http.ts` — HTTP action router (POST /api/ingest)
- `ingest.ts` — Ingest mutation + validation logic
- `classify.ts` — Classification internal action (Stage 1 + Stage 2)
- `queries/` — Query functions for the dashboard
- `lib/` — Shared utilities (keywords, Gemini client, schemas)
