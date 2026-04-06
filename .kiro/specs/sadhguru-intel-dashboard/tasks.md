# Implementation Plan: Sadhguru Intel Dashboard

## Overview

Incremental build of the threat intelligence pipeline: Convex schema & backend first, then Python scrapers, then React dashboard, then GitHub Actions wiring. Each task builds on the previous, ensuring no orphaned code. Property-based tests (fast-check for TypeScript, Hypothesis for Python) validate correctness properties from the design.

## Tasks

- [x] 1. Project scaffolding and core configuration
  - [x] 1.1 Initialise React + Vite + TypeScript project and install dependencies
    - Create Vite project with React-TS template
    - Install: `convex`, `react-router-dom`, `sigma`, `graphology`, `chart.js`, `fast-check` (dev), `vitest` (dev), `@testing-library/react` (dev)
    - Install Tailwind CSS and configure `tailwind.config.js` with UX4G color tokens, Noto Sans font, and `preflight: false`
    - Copy UX4G 2.0.8 CSS/JS/fonts into `public/ux4g/` and reference in `index.html` (ux4g-min.css, ux4g-chart.js, Noto Sans font)
    - Set up `index.html` load order: UX4G CSS → Tailwind → UX4G Chart.js
    - _Requirements: 18.2, 18.4_

  - [x] 1.2 Initialise Convex backend
    - Run `npx convex init` and configure project
    - Create `convex/` directory structure matching design (`schema.ts`, `http.ts`, `ingest.ts`, `classify.ts`, `queries/`, `lib/`)
    - Create `.env.local` with `VITE_CONVEX_URL` placeholder
    - _Requirements: 19.2, 19.3_

  - [x] 1.3 Create Python scrapers directory and base dependencies
    - Create `scrapers/` directory with `requirements.txt` (ntscraper, google-api-python-client, feedparser, requests, apify-client, hypothesis)
    - Create `scrapers/models.py` with `RawPost` dataclass exactly as specified in design
    - _Requirements: 19.1_

- [x] 2. Convex schema and data models
  - [x] 2.1 Implement Convex schema with all tables and indexes
    - Create `convex/schema.ts` with `posts`, `scraper_runs`, and `scraper_errors` tables exactly as specified in design
    - Define all indexes: `by_source_url`, `by_status`, `by_category`, `by_platform`, `by_category_severity`, `by_author`, `by_post_timestamp` on posts; `by_platform`, `by_completed_at` on scraper_runs; `by_platform`, `by_timestamp` on scraper_errors
    - _Requirements: 5.2, 5.3, 5.4, 7.1_

  - [x] 2.2 Implement validation schemas and serialisation helpers
    - Create `convex/lib/schemas.ts` with `ClassificationResult` interface, `serializeClassificationResult()`, and `deserializeClassificationResult()` functions as specified in design
    - Add RawPost validation function that checks required fields and types
    - _Requirements: 7.1, 8.1, 8.2, 8.3, 5.2_

  - [ ]* 2.3 Write property test: Classification_Result round-trip (Property 2)
    - **Property 2: Classification_Result Serialisation Round-Trip**
    - Use fast-check to generate arbitrary valid ClassificationResult objects (category ∈ {"hate","misinfo"}, severity ∈ {"low","medium","high","critical"}, non-empty themes, confidence ∈ [0,1], non-empty reasoning)
    - Assert `deserializeClassificationResult(serializeClassificationResult(x))` deep-equals `x`
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 2.4 Write property test: Classification_Result structural invariants (Property 8)
    - **Property 8: Classification_Result Structural Invariants**
    - Use fast-check to generate valid ClassificationResult objects
    - Assert: category is "hate" or "misinfo", severity is one of the four values, themes is non-empty array, confidence ∈ [0,1], reasoning is non-empty string
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ]* 2.5 Write property test: Ingest validation accepts valid, rejects invalid (Property 5)
    - **Property 5: Ingest Validation Accepts Valid and Rejects Invalid**
    - Use fast-check to generate dicts with/without required fields (source_url, platform, author, content, post_timestamp)
    - Assert validation accepts iff all required fields present with correct types
    - **Validates: Requirements 5.2, 5.5**

- [x] 3. Convex ingest endpoint and mutations
  - [x] 3.1 Implement HTTP action router and ingest endpoint
    - Create `convex/http.ts` with httpRouter and POST `/api/ingest` route
    - Create `convex/ingest.ts` with ingestPosts HTTP action: parse JSON body, validate each RawPost, deduplicate by source_url against DB, insert new posts with status "pending_classification", record scraper_run metadata, return `{ingested, duplicates, rejected, errors}`
    - Handle error cases: invalid JSON (400), schema validation failure (partial success 200), duplicate source_url (skip silently)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4. Classification pipeline
  - [x] 4.1 Implement keyword pre-filter (Stage 1)
    - Create `convex/lib/keywords.ts` with predefined keyword lists for hate and misinfo tracks
    - Implement `keywordPreFilter(text: string): boolean` function that returns true if text contains any keyword
    - _Requirements: 6.1_

  - [x] 4.2 Implement Gemini Flash 2.0 API client
    - Create `convex/lib/gemini.ts` with `classifyPost(content: string): Promise<ClassificationResult>` function
    - Build prompt that instructs Gemini to return JSON with category, severity, themes, confidence, reasoning
    - Read GEMINI_API_KEY from Convex environment variables
    - _Requirements: 6.2, 6.3, 19.3_

  - [x] 4.3 Implement classification internal action
    - Create `convex/classify.ts` with scheduled internal action
    - Fetch batch of 20 posts with status "pending_classification"
    - Apply Stage 1 keyword pre-filter; mark non-matches as "irrelevant"
    - Send candidates to Gemini with 4-second minimum delay between calls (15 req/min rate limit)
    - Parse response, apply confidence threshold (>= 0.6 → "classified", < 0.6 → "low_confidence")
    - Implement exponential backoff retry (2s, 4s, 8s) up to 3 attempts on Gemini errors
    - Mark failed posts as "classification_failed" and log to scraper_errors
    - Schedule next batch if more pending posts exist
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ]* 4.4 Write property test: Keyword pre-filter consistency (Property 6)
    - **Property 6: Keyword Pre-Filter Consistency**
    - Use fast-check to generate strings with/without injected keywords
    - Assert: text containing a keyword → true; text with no keywords → false
    - **Validates: Requirements 6.1**

  - [ ]* 4.5 Write property test: Confidence threshold determines status (Property 7)
    - **Property 7: Confidence Threshold Determines Classification Status**
    - Use fast-check to generate confidence values in [0, 1]
    - Assert: confidence >= 0.6 → "classified"; confidence < 0.6 → "low_confidence"; exactly 0.6 → "classified"
    - **Validates: Requirements 6.4, 6.5**

- [x] 5. Checkpoint — Convex backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Convex query functions
  - [x] 6.1 Implement dashboard and post query functions
    - Create `convex/queries/dashboard.ts` with `getDashboardStats` query (total posts, classified posts, date range)
    - Create `convex/queries/posts.ts` with `getPostsByCategory` query (paginated, filterable by category and severity)
    - _Requirements: 17.1, 17.2_

  - [x] 6.2 Implement aggregation query functions
    - Create `convex/queries/accounts.ts` with `getTopAccounts` query (ranked by flagged post count, with category breakdown)
    - Create `convex/queries/timeline.ts` with `getTimelineSeries` query (post counts grouped by date, filterable by category)
    - Create `convex/queries/themes.ts` with `getThemeBreakdown` query (post counts grouped by theme)
    - Create `convex/queries/platforms.ts` with `getPlatformBreakdown` query (post counts grouped by platform)
    - _Requirements: 17.3, 17.4, 17.5, 17.6_

  - [x] 6.3 Implement admin query functions
    - Create `convex/queries/admin.ts` with `getRecentScraperRuns`, `getScraperErrors`, and `getClassificationStats` queries
    - _Requirements: 17.7, 16.1, 16.2, 16.3_

  - [x] 6.4 Implement network data query function
    - Create `convex/queries/network.ts` with `getNetworkData` query returning nodes (accounts) and edges (shared themes, co-amplification, temporal clusters)
    - _Requirements: 14.1, 14.2_

- [x] 7. Python scrapers
  - [x] 7.1 Implement BaseScraper abstract class
    - Create `scrapers/base_scraper.py` with abstract `scrape()` and `normalise()` methods, concrete `dedup_batch()` and `post_batch()` and `run()` methods as specified in design
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property test: RawPost round-trip (Property 1)
    - **Property 1: RawPost Serialisation Round-Trip**
    - Use Hypothesis to generate arbitrary valid RawPost objects
    - Assert `RawPost.from_json(raw_post.to_json())` equals original
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 7.3 Write property test: Batch deduplication preserves uniqueness (Property 4)
    - **Property 4: Batch Deduplication Preserves Uniqueness**
    - Use Hypothesis to generate lists of RawPost objects (with potential duplicate source_urls)
    - Assert: all source_urls in output are unique, output length <= input length, every output item exists in input
    - **Validates: Requirements 1.3, 2.3, 3.3, 4.3**

  - [x] 7.4 Implement X (Twitter) scraper
    - Create `scrapers/x_scraper.py` extending BaseScraper
    - Use ntscraper to collect up to 500 posts per run with predefined keyword searches
    - Implement `normalise()` to convert ntscraper output to RawPost
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 7.5 Implement YouTube scraper
    - Create `scrapers/youtube_scraper.py` extending BaseScraper
    - Use YouTube Data API v3 to collect up to 50 videos per run
    - Implement `normalise()` to convert API response to RawPost
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 7.6 Implement Instagram/Facebook scraper
    - Create `scrapers/instagram_scraper.py` extending BaseScraper
    - Use Apify Instagram Scraper to collect up to 60 posts per run
    - Implement `normalise()` to convert Apify output to RawPost
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 7.7 Implement News scraper
    - Create `scrapers/news_scraper.py` extending BaseScraper
    - Use NewsAPI + Google News RSS + supplementary RSS feeds to collect up to 100 articles per run
    - Implement `normalise()` to convert each source format to RawPost
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ]* 7.8 Write property test: Scraper normalisation produces valid RawPost (Property 3)
    - **Property 3: Scraper Normalisation Produces Valid RawPost**
    - Use Hypothesis to generate platform-specific raw item dicts with minimum required fields
    - Assert normalise() produces RawPost with non-empty source_url, valid platform, non-empty author, non-empty content, positive post_timestamp
    - **Validates: Requirements 1.2, 2.2, 3.2, 4.2**

- [x] 8. Checkpoint — Scrapers and backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. React frontend — layout and routing
  - [x] 9.1 Set up React Router and app layout shell
    - Create `src/App.tsx` with React Router routes for all 7 pages: `/`, `/hate`, `/misinfo`, `/accounts`, `/network`, `/about`, `/admin`
    - Create `src/components/layout/Layout.tsx` shell with sidebar + content area
    - Create `src/components/layout/Sidebar.tsx` with navigation links to all routes
    - Create `src/components/layout/Header.tsx` with track toggle integration
    - Set up Convex provider in `src/main.tsx`
    - Apply dark mode as default (`dark` class on `<html>`)
    - _Requirements: 18.1, 18.4, 18.6_

  - [x] 9.2 Create shared UI components
    - Create `src/components/shared/TrackToggle.tsx` — Hate/Misinfo track switcher
    - Create `src/components/shared/Card.tsx` — UX4G card wrapper component
    - Create `src/components/shared/Badge.tsx` — Severity/platform badge component
    - Create `src/hooks/useTrackFilter.ts` — Track toggle state management hook
    - Create `src/hooks/usePagination.ts` — Pagination state hook
    - Add ARIA labels on all interactive elements
    - _Requirements: 10.2, 10.3, 18.3_

- [x] 10. React frontend — chart components
  - [x] 10.1 Create Chart.js configuration and chart components
    - Create `src/lib/chartConfig.ts` with UX4G color tokens, Noto Sans font defaults, platform/severity color maps as specified in design
    - Create `src/components/charts/TimelineChart.tsx` — line chart for post volume over time
    - Create `src/components/charts/PlatformChart.tsx` — doughnut chart for platform distribution
    - Create `src/components/charts/SeverityChart.tsx` — bar chart for severity distribution
    - Create `src/components/charts/ThemeChart.tsx` — horizontal bar chart for theme breakdown
    - Wrap each chart in error boundary with "Chart unavailable" fallback
    - _Requirements: 10.4, 10.5, 10.6, 10.7_

- [x] 11. React frontend — panel components
  - [x] 11.1 Create dashboard panel components
    - Create `src/components/panels/StatsHero.tsx` — summary cards (total posts, classified, date range)
    - Create `src/components/panels/TopPosts.tsx` — table of recent/high-severity posts
    - Create `src/components/panels/TopAccounts.tsx` — ranked account list
    - Create `src/components/panels/ActivityFeed.tsx` — real-time feed using Convex subscription
    - _Requirements: 10.1, 10.8, 10.9, 10.10_

- [x] 12. React frontend — pages
  - [x] 12.1 Implement DashboardPage (/ route)
    - Create `src/pages/DashboardPage.tsx` composing StatsHero, TrackToggle, TimelineChart, PlatformChart, SeverityChart, ThemeChart, TopPosts, TopAccounts, ActivityFeed
    - Wire all components to Convex queries with track filter
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [x] 12.2 Implement HateTrackPage and MisinfoTrackPage
    - Create `src/pages/HateTrackPage.tsx` — same layout as DashboardPage, pre-filtered to category "hate"
    - Create `src/pages/MisinfoTrackPage.tsx` — same layout as DashboardPage, pre-filtered to category "misinfo"
    - _Requirements: 11.1, 11.2, 12.1, 12.2_

  - [x] 12.3 Implement AccountsPage
    - Create `src/pages/AccountsPage.tsx` with ranked account list showing: account name, platform, total flagged posts, category breakdown, most recent post date
    - _Requirements: 13.1, 13.2_

  - [x] 12.4 Implement NetworkPage with Sigma.js
    - Create `src/components/network/NetworkGraph.tsx` using Sigma.js + graphology for force-directed graph
    - Create `src/pages/NetworkPage.tsx` rendering NetworkGraph with zoom, pan, hover interactions
    - Display nodes (accounts) and edges (shared themes, co-amplification, temporal clusters)
    - Render at least 50 connected nodes when sufficient data exists
    - Wrap in error boundary with fallback message
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 12.5 Implement AboutPage
    - Create `src/pages/AboutPage.tsx` with static content: project purpose, methodology, data sources, limitations, and research disclaimer
    - _Requirements: 15.1, 15.2_

  - [x] 12.6 Implement AdminPage
    - Create `src/pages/AdminPage.tsx` displaying: recent scraper_runs per platform, scraper_errors, classification status counts, time since last successful run per platform
    - Wire to admin Convex queries
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 12.7 Write property test: Track filtering returns only matching category (Property 9)
    - **Property 9: Track Filtering Returns Only Matching Category**
    - Use fast-check to generate lists of posts with random categories and a selected filter category
    - Assert: every post in filtered result has matching category; count equals original count of that category
    - **Validates: Requirements 10.3, 11.1, 12.1**

  - [ ]* 12.8 Write property test: Account ranking is sorted descending (Property 10)
    - **Property 10: Account Ranking Is Sorted Descending**
    - Use fast-check to generate lists of accounts with random flagged post counts
    - Assert: ranking output is sorted in non-increasing order; contains same accounts as input
    - **Validates: Requirements 13.1**

- [x] 13. Checkpoint — Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. GitHub Actions workflows and deployment configuration
  - [x] 14.1 Create GitHub Actions scraper workflows
    - Create `.github/workflows/scrape-x.yml` — cron `"0 6,18 * * *"` (twice daily), Python 3.11 setup, install requirements, run x_scraper.py with secrets (CONVEX_SITE_URL)
    - Create `.github/workflows/scrape-youtube.yml` — cron `"0 12 * * *"` (once daily), run youtube_scraper.py with secrets (CONVEX_SITE_URL, YOUTUBE_API_KEY)
    - Create `.github/workflows/scrape-instagram.yml` — cron `"0 9 */3 * *"` (every 3 days), run instagram_scraper.py with secrets (CONVEX_SITE_URL, APIFY_API_KEY)
    - Create `.github/workflows/scrape-news.yml` — cron `"0 4,12,20 * * *"` (three times daily), run news_scraper.py with secrets (CONVEX_SITE_URL, NEWSAPI_KEY)
    - Each workflow: checkout → setup Python 3.11 → install deps → run scraper → capture logs
    - _Requirements: 1.5, 2.5, 3.5, 4.5, 19.1, 20.1_

  - [x] 14.2 Create environment configuration documentation
    - Create `.env.example` listing all required environment variables per context (GitHub Actions secrets, Vercel env vars, Convex env vars) with placeholder values
    - Ensure no secret values are committed
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 15. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Python property tests use Hypothesis; TypeScript property tests use fast-check
- UX4G 2.0.8 provides Chart.js via `ux4g-chart.js` — no separate Chart.js npm install needed for runtime, but types may be needed for dev
- The system has no authentication (Requirement 21.1) — all routes are public
