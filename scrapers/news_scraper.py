"""News scraper using NewsAPI + Google News RSS + supplementary RSS feeds."""

import os
import logging
import time
import requests as req
from base_scraper import BaseScraper
from models import RawPost

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

KEYWORDS = ["Sadhguru", "Isha Foundation", "Jaggi Vasudev"]
MAX_ARTICLES_PER_RUN = 100

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
SUPPLEMENTARY_RSS = [
    "https://www.opindia.com/feed/",
    "https://thewire.in/feed",
]


class NewsScraper(BaseScraper):
    def __init__(self):
        super().__init__(platform="news")
        self.newsapi_key = os.environ.get("NEWSAPI_KEY", "")

    def _fetch_newsapi(self) -> list[dict]:
        if not self.newsapi_key:
            logger.warning("NEWSAPI_KEY not set, skipping NewsAPI")
            return []

        articles: list[dict] = []
        for keyword in KEYWORDS:
            if len(articles) >= 40:
                break
            try:
                resp = req.get(
                    "https://newsapi.org/v2/everything",
                    params={"q": keyword, "pageSize": 20, "sortBy": "publishedAt", "language": "en"},
                    headers={"X-Api-Key": self.newsapi_key},
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                for article in data.get("articles", []):
                    article["_source_type"] = "newsapi"
                    articles.append(article)
                logger.info(f"NewsAPI '{keyword}': got {len(data.get('articles', []))} articles")
            except Exception as e:
                logger.warning(f"NewsAPI '{keyword}' failed: {e}")
        return articles

    def _fetch_google_rss(self) -> list[dict]:
        try:
            import feedparser
        except ImportError:
            logger.error("feedparser not installed")
            return []

        articles: list[dict] = []
        for keyword in KEYWORDS:
            if len(articles) >= 30:
                break
            try:
                url = GOOGLE_NEWS_RSS.format(query=keyword.replace(" ", "+"))
                feed = feedparser.parse(url)
                for entry in feed.entries[:10]:
                    articles.append({
                        "_source_type": "google_rss",
                        "title": entry.get("title", ""),
                        "description": entry.get("summary", ""),
                        "url": entry.get("link", ""),
                        "source": {"name": entry.get("source", {}).get("title", "Google News")},
                        "publishedAt": entry.get("published", ""),
                        "author": entry.get("author", None),
                    })
                logger.info(f"Google RSS '{keyword}': got {min(10, len(feed.entries))} articles")
            except Exception as e:
                logger.warning(f"Google RSS '{keyword}' failed: {e}")
        return articles

    def _fetch_supplementary_rss(self) -> list[dict]:
        try:
            import feedparser
        except ImportError:
            return []

        articles: list[dict] = []
        for rss_url in SUPPLEMENTARY_RSS:
            try:
                feed = feedparser.parse(rss_url)
                kw_lower = [k.lower() for k in KEYWORDS]
                for entry in feed.entries[:20]:
                    title = entry.get("title", "").lower()
                    summary = entry.get("summary", "").lower()
                    if any(kw in title or kw in summary for kw in kw_lower):
                        articles.append({
                            "_source_type": "rss",
                            "title": entry.get("title", ""),
                            "description": entry.get("summary", ""),
                            "url": entry.get("link", ""),
                            "source": {"name": feed.feed.get("title", rss_url)},
                            "publishedAt": entry.get("published", ""),
                            "author": entry.get("author", None),
                        })
                logger.info(f"RSS '{rss_url}': checked {len(feed.entries)} entries")
            except Exception as e:
                logger.warning(f"RSS '{rss_url}' failed: {e}")
        return articles

    def scrape(self) -> list[dict]:
        all_articles: list[dict] = []
        all_articles.extend(self._fetch_newsapi())
        all_articles.extend(self._fetch_google_rss())
        all_articles.extend(self._fetch_supplementary_rss())
        return all_articles[:MAX_ARTICLES_PER_RUN]

    def normalise(self, raw_item: dict) -> RawPost:
        title = raw_item.get("title", "")
        description = raw_item.get("description", "") or ""
        url = raw_item.get("url", "")
        source = raw_item.get("source", {})
        source_name = source.get("name", "unknown") if isinstance(source, dict) else str(source)
        author = raw_item.get("author") or source_name
        published = raw_item.get("publishedAt", "")

        try:
            from datetime import datetime
            if isinstance(published, str) and published:
                dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
                post_timestamp = int(dt.timestamp() * 1000)
            else:
                post_timestamp = int(time.time() * 1000)
        except Exception:
            post_timestamp = int(time.time() * 1000)

        content = f"{title}\n\n{description}" if description else title

        return RawPost(
            source_url=url if url else f"https://news.example.com/{hash(title)}",
            platform="news",
            author=author,
            content=content,
            post_timestamp=post_timestamp,
            raw_metadata={
                "source_name": source_name,
                "source_type": raw_item.get("_source_type", "unknown"),
            },
        )


if __name__ == "__main__":
    scraper = NewsScraper()
    scraper.run()
