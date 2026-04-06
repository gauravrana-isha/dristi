"""Instagram scraper using Apify — collects up to 60 posts per run."""

import os
import logging
import time
from base_scraper import BaseScraper
from models import RawPost

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

HASHTAGS = ["sadhguru", "ishafoundation", "jaggivasudev"]
MAX_POSTS_PER_RUN = 60


class InstagramScraper(BaseScraper):
    def __init__(self):
        super().__init__(platform="instagram")
        self.api_key = os.environ.get("APIFY_API_KEY", "")

    def scrape(self) -> list[dict]:
        if not self.api_key:
            logger.error("APIFY_API_KEY not set")
            return []

        try:
            from apify_client import ApifyClient
        except ImportError:
            logger.error("apify-client not installed")
            return []

        client = ApifyClient(self.api_key)
        all_posts: list[dict] = []

        for hashtag in HASHTAGS:
            if len(all_posts) >= MAX_POSTS_PER_RUN:
                break
            try:
                remaining = MAX_POSTS_PER_RUN - len(all_posts)
                run_input = {
                    "hashtags": [hashtag],
                    "resultsLimit": min(20, remaining),
                }
                run = client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
                dataset = client.dataset(run["defaultDatasetId"])
                items = list(dataset.iterate_items())
                all_posts.extend(items)
                logger.info(f"Hashtag '#{hashtag}': got {len(items)} posts")
            except Exception as e:
                logger.warning(f"Hashtag '#{hashtag}' failed: {e}")

        return all_posts[:MAX_POSTS_PER_RUN]

    def normalise(self, raw_item: dict) -> RawPost:
        caption = raw_item.get("caption", "") or ""
        url = raw_item.get("url", "") or raw_item.get("shortCode", "")
        if url and not url.startswith("http"):
            url = f"https://www.instagram.com/p/{url}/"
        owner = raw_item.get("ownerUsername", "") or raw_item.get("owner", {}).get("username", "unknown")
        timestamp = raw_item.get("timestamp", "")

        try:
            from datetime import datetime
            if isinstance(timestamp, str):
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                post_timestamp = int(dt.timestamp() * 1000)
            elif isinstance(timestamp, (int, float)):
                post_timestamp = int(timestamp * 1000) if timestamp < 1e12 else int(timestamp)
            else:
                post_timestamp = int(time.time() * 1000)
        except Exception:
            post_timestamp = int(time.time() * 1000)

        return RawPost(
            source_url=url if url else f"https://instagram.com/p/{hash(caption)}",
            platform="instagram",
            author=owner,
            content=caption,
            post_timestamp=post_timestamp,
            raw_metadata={
                "likes": raw_item.get("likesCount", 0),
                "comments": raw_item.get("commentsCount", 0),
                "is_video": raw_item.get("isVideo", False),
            },
        )


if __name__ == "__main__":
    scraper = InstagramScraper()
    scraper.run()
