"""YouTube scraper using Data API v3 — collects up to 50 videos per run."""

import os
import logging
import time
from base_scraper import BaseScraper
from models import RawPost

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

KEYWORDS = [
    "sadhguru",
    "isha foundation",
    "jaggi vasudev",
    "sadhguru exposed",
    "isha foundation exposed",
    "jaggi vasudev controversy",
]
MAX_VIDEOS_PER_RUN = 50


class YouTubeScraper(BaseScraper):
    def __init__(self):
        super().__init__(platform="youtube")
        self.api_key = os.environ.get("YOUTUBE_API_KEY", "")

    def scrape(self) -> list[dict]:
        if not self.api_key:
            logger.error("YOUTUBE_API_KEY not set")
            return []

        try:
            from googleapiclient.discovery import build
        except ImportError:
            logger.error("google-api-python-client not installed")
            return []

        youtube = build("youtube", "v3", developerKey=self.api_key)
        all_videos: list[dict] = []

        for keyword in KEYWORDS:
            if len(all_videos) >= MAX_VIDEOS_PER_RUN:
                break
            try:
                remaining = MAX_VIDEOS_PER_RUN - len(all_videos)
                search_resp = youtube.search().list(
                    q=keyword, part="snippet", type="video",
                    maxResults=min(10, remaining), order="date",
                ).execute()

                video_ids = [item["id"]["videoId"] for item in search_resp.get("items", [])]
                if not video_ids:
                    continue

                stats_resp = youtube.videos().list(
                    id=",".join(video_ids), part="snippet,statistics",
                ).execute()

                all_videos.extend(stats_resp.get("items", []))
                logger.info(f"Keyword '{keyword}': got {len(video_ids)} videos")
                time.sleep(1)
            except Exception as e:
                logger.warning(f"Keyword '{keyword}' failed: {e}")

        return all_videos[:MAX_VIDEOS_PER_RUN]

    def normalise(self, raw_item: dict) -> RawPost:
        snippet = raw_item.get("snippet", {})
        stats = raw_item.get("statistics", {})
        video_id = raw_item.get("id", "")

        title = snippet.get("title", "")
        description = snippet.get("description", "")[:500]
        channel = snippet.get("channelTitle", "unknown")
        published = snippet.get("publishedAt", "")

        # Parse ISO timestamp
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
            post_timestamp = int(dt.timestamp() * 1000)
        except Exception:
            post_timestamp = int(time.time() * 1000)

        return RawPost(
            source_url=f"https://www.youtube.com/watch?v={video_id}",
            platform="youtube",
            author=channel,
            content=f"{title}\n\n{description}",
            post_timestamp=post_timestamp,
            raw_metadata={
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            },
        )


if __name__ == "__main__":
    scraper = YouTubeScraper()
    scraper.run()
