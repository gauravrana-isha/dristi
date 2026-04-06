from abc import ABC, abstractmethod
import os
import logging
import requests
from models import RawPost

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    def __init__(self, platform: str):
        self.platform = platform
        self.convex_site_url = os.environ.get("CONVEX_SITE_URL", "")

    @abstractmethod
    def scrape(self) -> list[dict]:
        """Collect raw items from platform. Returns platform-specific dicts."""
        ...

    @abstractmethod
    def normalise(self, raw_item: dict) -> RawPost:
        """Convert platform-specific dict to RawPost."""
        ...

    def dedup_batch(self, posts: list[RawPost]) -> list[RawPost]:
        """Remove duplicates by source_url within batch."""
        seen = set()
        result = []
        for p in posts:
            if p.source_url not in seen:
                seen.add(p.source_url)
                result.append(p)
        return result

    def post_batch(self, posts: list[RawPost]) -> dict:
        """POST batch to Convex Ingest Endpoint."""
        if not self.convex_site_url:
            raise ValueError("CONVEX_SITE_URL environment variable not set")
        resp = requests.post(
            f"{self.convex_site_url}/api/ingest",
            json={"posts": [p.to_dict() for p in posts]},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    def run(self):
        """Full scrape pipeline: scrape → normalise → dedup → post."""
        logger.info(f"[{self.platform}] Starting scrape...")
        try:
            raw_items = self.scrape()
            logger.info(f"[{self.platform}] Collected {len(raw_items)} raw items")

            posts = []
            for item in raw_items:
                try:
                    posts.append(self.normalise(item))
                except Exception as e:
                    logger.warning(f"[{self.platform}] Failed to normalise item: {e}")

            posts = self.dedup_batch(posts)
            logger.info(f"[{self.platform}] {len(posts)} unique posts after dedup")

            if posts:
                result = self.post_batch(posts)
                logger.info(f"[{self.platform}] Ingest result: {result}")
                return result
            else:
                logger.info(f"[{self.platform}] No posts to ingest")
                return {"ingested": 0, "duplicates": 0, "rejected": 0}
        except Exception as e:
            logger.error(f"[{self.platform}] Scrape failed: {e}")
            raise
