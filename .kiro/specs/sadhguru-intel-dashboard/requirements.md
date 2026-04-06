# Requirements Document

## Introduction

Sadhguru Intel is a full-stack threat intelligence dashboard that continuously monitors, collects, classifies, and visualises two categories of harmful online content related to Sadhguru and the Isha Foundation: coordinated hate attacks and misinformation campaigns. Modelled after the NCRI/CSOH anti-Indian hate network intelligence briefing (2025), the system is a research and documentation tool deployed on free-tier infrastructure (Vercel, Convex, Gemini Flash 2.0, GitHub Actions). It runs autonomously with no manual curation, scraping content from X, YouTube, Instagram/Facebook, and news media, classifying it via a two-stage AI pipeline, and presenting findings through a public-facing, mobile-responsive dashboard.

## Glossary

- **Dashboard**: The React + Vite frontend application that visualises threat intelligence data, deployed to Vercel.
- **Scraper**: A Python 3.11 script that collects content from a specific platform (X, YouTube, Instagram/Facebook, or news media) and normalises it into the RawPost schema.
- **Scraper_Scheduler**: The GitHub Actions cron-based workflow that triggers Scraper runs on defined schedules.
- **Classifier**: The two-stage pipeline that categorises ingested posts — Stage 1 is a keyword pre-filter, Stage 2 uses Gemini Flash 2.0 for AI classification.
- **Convex_Backend**: The Convex-powered serverless backend providing database storage, HTTP actions, mutation functions, and real-time subscriptions.
- **Ingest_Endpoint**: The Convex HTTP action at `/api/ingest` that receives normalised posts from Scrapers.
- **RawPost**: The normalised data schema that all Scrapers output, containing fields such as source_url, platform, author, content, timestamp, and raw metadata.
- **Classification_Result**: The structured JSON output from the Classifier containing category, severity, theme, confidence, and reasoning fields.
- **Hate_Track**: The content category covering coordinated personal attacks, slurs, dehumanising content, and targeted abuse directed at Sadhguru or Isha Foundation members.
- **Misinfo_Track**: The content category covering false or misleading claims including fabricated health allegations, cult narratives, fraud accusations, and coordinated smear campaigns.
- **Network_Map**: A force-directed graph visualisation (D3 or Sigma.js) showing relationships between accounts, content, and amplification patterns.
- **Admin_Panel**: The /admin route displaying scraper health, run history, error logs, and system status.
- **Severity_Level**: A classification scale (low, medium, high, critical) assigned to each post by the Classifier.
- **Theme**: A topical label (e.g., health allegations, cult narrative, fraud accusation, personal attack, slur) assigned by the Classifier.
- **Confidence_Score**: A numeric value between 0 and 1 indicating the Classifier's certainty in its classification.
- **Confidence_Threshold**: The minimum Confidence_Score (0.6) required for a Classification_Result to be stored.

## Requirements

### Requirement 1: X (Twitter) Scraping

**User Story:** As a researcher, I want the system to automatically collect posts from X (Twitter) matching threat-related keywords, so that I can monitor hate and misinformation campaigns on that platform.

#### Acceptance Criteria

1. WHEN the Scraper_Scheduler triggers the X scrape job, THE Scraper SHALL collect up to 500 posts per run using ntscraper with predefined keyword searches.
2. THE Scraper SHALL normalise each collected X post into the RawPost schema before submission.
3. WHEN the Scraper collects X posts, THE Scraper SHALL deduplicate posts by source_url within the current batch.
4. WHEN the Scraper completes normalisation, THE Scraper SHALL POST each batch of RawPost items to the Ingest_Endpoint.
5. THE Scraper_Scheduler SHALL trigger the X scrape job twice daily via GitHub Actions cron.
6. IF the X scrape job fails, THEN THE Scraper SHALL log the error details to standard output for GitHub Actions capture.

### Requirement 2: YouTube Scraping

**User Story:** As a researcher, I want the system to automatically collect YouTube videos and comments matching threat-related keywords, so that I can monitor hate and misinformation on YouTube.

#### Acceptance Criteria

1. WHEN the Scraper_Scheduler triggers the YouTube scrape job, THE Scraper SHALL collect up to 50 videos per run using the YouTube Data API v3.
2. THE Scraper SHALL normalise each collected YouTube item into the RawPost schema before submission.
3. WHEN the Scraper collects YouTube items, THE Scraper SHALL deduplicate items by source_url within the current batch.
4. WHEN the Scraper completes normalisation, THE Scraper SHALL POST each batch of RawPost items to the Ingest_Endpoint.
5. THE Scraper_Scheduler SHALL trigger the YouTube scrape job once daily via GitHub Actions cron.
6. IF the YouTube scrape job fails, THEN THE Scraper SHALL log the error details to standard output for GitHub Actions capture.

### Requirement 3: Instagram/Facebook Scraping

**User Story:** As a researcher, I want the system to automatically collect Instagram and Facebook posts matching threat-related keywords, so that I can monitor hate and misinformation on Meta platforms.

#### Acceptance Criteria

1. WHEN the Scraper_Scheduler triggers the Instagram/Facebook scrape job, THE Scraper SHALL collect up to 60 posts per run using the Apify Instagram Scraper.
2. THE Scraper SHALL normalise each collected Instagram/Facebook post into the RawPost schema before submission.
3. WHEN the Scraper collects Instagram/Facebook posts, THE Scraper SHALL deduplicate posts by source_url within the current batch.
4. WHEN the Scraper completes normalisation, THE Scraper SHALL POST each batch of RawPost items to the Ingest_Endpoint.
5. THE Scraper_Scheduler SHALL trigger the Instagram/Facebook scrape job every 3 days via GitHub Actions cron.
6. IF the Instagram/Facebook scrape job fails, THEN THE Scraper SHALL log the error details to standard output for GitHub Actions capture.

### Requirement 4: News & Media Scraping

**User Story:** As a researcher, I want the system to automatically collect news articles from NewsAPI, Google News RSS, and supplementary RSS feeds, so that I can monitor hate and misinformation in news media.

#### Acceptance Criteria

1. WHEN the Scraper_Scheduler triggers the news scrape job, THE Scraper SHALL collect up to 100 articles per run from NewsAPI, Google News RSS, and supplementary RSS feeds.
2. THE Scraper SHALL normalise each collected news article into the RawPost schema before submission.
3. WHEN the Scraper collects news articles, THE Scraper SHALL deduplicate articles by source_url within the current batch.
4. WHEN the Scraper completes normalisation, THE Scraper SHALL POST each batch of RawPost items to the Ingest_Endpoint.
5. THE Scraper_Scheduler SHALL trigger the news scrape job three times daily via GitHub Actions cron.
6. IF the news scrape job fails, THEN THE Scraper SHALL log the error details to standard output for GitHub Actions capture.

### Requirement 5: Data Ingestion

**User Story:** As a system operator, I want all scraped content to be ingested into the Convex database through a single endpoint, so that data flows consistently from all sources.

#### Acceptance Criteria

1. THE Ingest_Endpoint SHALL accept HTTP POST requests containing an array of RawPost items.
2. WHEN the Ingest_Endpoint receives a RawPost array, THE Convex_Backend SHALL validate each item against the RawPost schema.
3. WHEN the Ingest_Endpoint receives a valid RawPost, THE Convex_Backend SHALL deduplicate the post by source_url against existing records in the posts table.
4. WHEN a new unique RawPost is validated, THE Convex_Backend SHALL insert the post into the posts table with a status of "pending_classification".
5. IF the Ingest_Endpoint receives an invalid RawPost, THEN THE Convex_Backend SHALL reject the item and log the validation error to the scraper_errors table.
6. WHEN a batch ingestion completes, THE Convex_Backend SHALL record the run metadata (platform, post count, timestamp, status) in the scraper_runs table.

### Requirement 6: Two-Stage Classification Pipeline

**User Story:** As a researcher, I want every ingested post to be automatically classified by category, severity, theme, and confidence, so that I can analyse patterns without manual curation.

#### Acceptance Criteria

1. WHEN a new post is inserted with status "pending_classification", THE Classifier SHALL apply the Stage 1 keyword pre-filter synchronously.
2. WHEN the Stage 1 keyword pre-filter identifies a post as a candidate, THE Classifier SHALL send the post to Gemini Flash 2.0 for Stage 2 classification.
3. WHEN Gemini Flash 2.0 returns a Classification_Result, THE Classifier SHALL parse the JSON response and extract category, severity, theme, confidence, and reasoning fields.
4. WHEN the Classification_Result has a Confidence_Score at or above the Confidence_Threshold of 0.6, THE Convex_Backend SHALL store the Classification_Result in the posts table and update the post status to "classified".
5. WHEN the Classification_Result has a Confidence_Score below the Confidence_Threshold of 0.6, THE Convex_Backend SHALL mark the post status as "low_confidence" and store the Classification_Result for review.
6. THE Classifier SHALL process posts in batches of 20.
7. IF Gemini Flash 2.0 returns an error or times out, THEN THE Classifier SHALL retry with exponential backoff up to 3 attempts.
8. IF all retry attempts fail, THEN THE Classifier SHALL mark the post status as "classification_failed" and log the error to the scraper_errors table.
9. THE Classifier SHALL respect the Gemini Flash 2.0 free-tier rate limit of 15 requests per minute.
10. WHEN the Classifier completes classification of a post, THE Convex_Backend SHALL make the classified post available to Dashboard queries within 2 minutes of ingestion.

### Requirement 7: Classification Result Schema

**User Story:** As a researcher, I want classification results to follow a consistent structured format, so that downstream queries and visualisations work reliably.

#### Acceptance Criteria

1. THE Classifier SHALL produce a Classification_Result containing exactly these fields: category (Hate_Track or Misinfo_Track), severity (Severity_Level), theme (Theme string), confidence (Confidence_Score), and reasoning (free-text string).
2. THE Classifier SHALL assign exactly one category value per post: either "hate" for Hate_Track or "misinfo" for Misinfo_Track.
3. THE Classifier SHALL assign exactly one Severity_Level per post from the set: "low", "medium", "high", "critical".
4. THE Classifier SHALL assign one or more Theme labels per post from a predefined theme taxonomy.

### Requirement 8: Classification Result Serialisation (Round-Trip)

**User Story:** As a developer, I want Classification_Result objects to be reliably serialised to JSON and deserialised back, so that data integrity is maintained across the pipeline.

#### Acceptance Criteria

1. THE Classifier SHALL serialise each Classification_Result to a JSON string before storage.
2. THE Convex_Backend SHALL deserialise stored Classification_Result JSON strings back into structured objects for query responses.
3. FOR ALL valid Classification_Result objects, serialising to JSON then deserialising back SHALL produce an equivalent Classification_Result object (round-trip property).

### Requirement 9: RawPost Schema Serialisation (Round-Trip)

**User Story:** As a developer, I want RawPost objects to be reliably serialised and deserialised between Scrapers and the Convex backend, so that no data is lost during ingestion.

#### Acceptance Criteria

1. THE Scraper SHALL serialise each RawPost to JSON before POSTing to the Ingest_Endpoint.
2. THE Ingest_Endpoint SHALL deserialise received JSON payloads back into RawPost objects for validation.
3. FOR ALL valid RawPost objects, serialising to JSON then deserialising back SHALL produce an equivalent RawPost object (round-trip property).

### Requirement 10: Dashboard Main View

**User Story:** As a researcher, I want a main dashboard view that provides an at-a-glance summary of threat intelligence data, so that I can quickly assess the current landscape.

#### Acceptance Criteria

1. WHEN a user navigates to the root route (/), THE Dashboard SHALL display a hero section with a summary of total posts collected, posts classified, and the date range of data.
2. THE Dashboard SHALL display a track toggle allowing the user to switch between Hate_Track and Misinfo_Track views.
3. WHEN the user selects a track, THE Dashboard SHALL filter all displayed data to show only posts matching the selected track category.
4. THE Dashboard SHALL display a timeline chart (using Recharts) showing post volume over time for the selected track.
5. THE Dashboard SHALL display a platform breakdown showing the distribution of posts across X, YouTube, Instagram/Facebook, and news media.
6. THE Dashboard SHALL display a severity distribution showing the count of posts at each Severity_Level.
7. THE Dashboard SHALL display a theme breakdown showing the distribution of posts across Theme labels.
8. THE Dashboard SHALL display a top posts table listing the most recent or highest-severity posts.
9. THE Dashboard SHALL display a top accounts panel listing accounts with the highest volume of flagged content.
10. THE Dashboard SHALL display a recent activity feed that updates in real-time using Convex real-time subscriptions.

### Requirement 11: Hate Track View

**User Story:** As a researcher, I want a dedicated view for hate-related content, so that I can focus analysis on coordinated attacks and abuse.

#### Acceptance Criteria

1. WHEN a user navigates to /hate, THE Dashboard SHALL display all visualisations filtered to Hate_Track posts only.
2. THE Dashboard SHALL display the same set of charts and panels as the main view (timeline, platform breakdown, severity distribution, theme breakdown, top posts, top accounts) scoped to Hate_Track.

### Requirement 12: Misinfo Track View

**User Story:** As a researcher, I want a dedicated view for misinformation content, so that I can focus analysis on false claims and smear campaigns.

#### Acceptance Criteria

1. WHEN a user navigates to /misinfo, THE Dashboard SHALL display all visualisations filtered to Misinfo_Track posts only.
2. THE Dashboard SHALL display the same set of charts and panels as the main view (timeline, platform breakdown, severity distribution, theme breakdown, top posts, top accounts) scoped to Misinfo_Track.

### Requirement 13: Accounts View

**User Story:** As a researcher, I want a dedicated accounts view, so that I can identify top offending accounts and their activity patterns.

#### Acceptance Criteria

1. WHEN a user navigates to /accounts, THE Dashboard SHALL display a ranked list of accounts sorted by the number of flagged posts.
2. THE Dashboard SHALL display for each account: account name, platform, total flagged posts, category breakdown (Hate_Track vs Misinfo_Track), and most recent post date.

### Requirement 14: Network Map View

**User Story:** As a researcher, I want a network visualisation showing relationships between accounts and content amplification patterns, so that I can identify coordinated campaigns.

#### Acceptance Criteria

1. WHEN a user navigates to /network, THE Dashboard SHALL render a force-directed graph using D3 or Sigma.js.
2. THE Network_Map SHALL display nodes representing accounts and edges representing shared content, co-amplification, or thematic connections.
3. THE Network_Map SHALL render with at least 50 connected nodes when sufficient data exists in the database.
4. THE Network_Map SHALL allow the user to zoom, pan, and hover over nodes to see account details.

### Requirement 15: About Page

**User Story:** As a visitor, I want an about page explaining the purpose and methodology of the dashboard, so that I understand the context and limitations of the data.

#### Acceptance Criteria

1. WHEN a user navigates to /about, THE Dashboard SHALL display a static page describing the project purpose, methodology, data sources, and limitations.
2. THE Dashboard SHALL include a disclaimer stating that the tool is for research and documentation purposes only.

### Requirement 16: Admin Health Panel

**User Story:** As a system operator, I want an admin panel showing scraper health and system status, so that I can monitor autonomous operation.

#### Acceptance Criteria

1. WHEN a user navigates to /admin, THE Dashboard SHALL display the most recent scraper_runs for each platform with timestamp, post count, and status.
2. THE Admin_Panel SHALL display recent entries from the scraper_errors table.
3. THE Admin_Panel SHALL display the total number of posts in each classification status (pending_classification, classified, low_confidence, classification_failed).
4. THE Admin_Panel SHALL display the time elapsed since the last successful scraper run for each platform.

### Requirement 17: Convex Query Functions

**User Story:** As a frontend developer, I want well-defined Convex query functions, so that the Dashboard can fetch aggregated data efficiently.

#### Acceptance Criteria

1. THE Convex_Backend SHALL expose a getDashboardStats query returning total posts, classified posts, and date range.
2. THE Convex_Backend SHALL expose a getPostsByCategory query accepting a category parameter and returning paginated posts.
3. THE Convex_Backend SHALL expose a getTopAccounts query returning accounts ranked by flagged post count.
4. THE Convex_Backend SHALL expose a getTimelineSeries query returning post counts grouped by date and optionally filtered by category.
5. THE Convex_Backend SHALL expose a getThemeBreakdown query returning post counts grouped by Theme.
6. THE Convex_Backend SHALL expose a getPlatformBreakdown query returning post counts grouped by platform.
7. THE Convex_Backend SHALL expose a getRecentScraperRuns query returning the latest scraper_runs entries.

### Requirement 18: Responsive and Accessible UI

**User Story:** As a user on any device, I want the dashboard to be responsive and accessible, so that I can use it on mobile and desktop with assistive technologies.

#### Acceptance Criteria

1. THE Dashboard SHALL render all six routes correctly on viewports from 320px to 1920px width.
2. THE Dashboard SHALL use Tailwind CSS for all styling.
3. THE Dashboard SHALL include ARIA labels on all interactive elements.
4. THE Dashboard SHALL support dark mode as the default colour scheme.
5. THE Dashboard SHALL load the initial view in under 2 seconds on a standard 4G mobile connection.
6. THE Dashboard SHALL not set any cookies or use any tracking scripts.

### Requirement 19: Environment Configuration

**User Story:** As a developer, I want environment variables to be clearly separated by deployment context, so that secrets are managed securely across GitHub Actions, Vercel, and Convex.

#### Acceptance Criteria

1. THE Scraper_Scheduler SHALL read CONVEX_SITE_URL, CONVEX_DEPLOY_KEY, YOUTUBE_API_KEY, NEWSAPI_KEY, and APIFY_API_KEY from GitHub Actions secrets.
2. THE Dashboard SHALL read VITE_CONVEX_URL from Vercel environment variables at build time.
3. THE Convex_Backend SHALL read GEMINI_API_KEY from Convex environment variables.
4. THE system SHALL not commit any secret values to the repository.

### Requirement 20: Zero-Cost Operation

**User Story:** As a project owner, I want the entire system to operate within free-tier limits of all services, so that the monthly cost remains at ₹0.

#### Acceptance Criteria

1. THE Scraper_Scheduler SHALL operate within GitHub Actions free-tier limits (2,000 minutes/month for private repos, unlimited for public repos).
2. THE Classifier SHALL operate within Gemini Flash 2.0 free-tier limits (1,000,000 tokens/day, 15 requests/minute).
3. THE Convex_Backend SHALL operate within Convex free-tier limits.
4. THE Dashboard SHALL operate within Vercel free-tier limits.

### Requirement 21: Non-Goals

**User Story:** As a project stakeholder, I want explicit boundaries on what the system does not do, so that scope remains clear.

#### Acceptance Criteria

1. THE system SHALL not implement user authentication or access control.
2. THE system SHALL not provide manual content curation workflows.
3. THE system SHALL not generate takedown requests or legal documents.
4. THE system SHALL not scrape Reddit, Telegram, or WhatsApp.
5. THE system SHALL not implement real-time streaming ingestion (near-real-time batch processing is used instead).
6. THE system SHALL not collect or display personally identifiable information beyond public account names.
