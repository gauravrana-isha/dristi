"""X (Twitter) scraper using ntscraper — collects up to 500 posts per run."""

import logging
import time
from base_scraper import BaseScraper
from models import RawPost

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PRIMARY_KEYWORDS = ["sadhguru", "isha foundation", "jaggi vasudev"]
HATE_COMBOS = ["cult", "fraud", "arrested", "criminal", "scam", "fake guru"]
MISINFO_COMBOS = ["mercury", "poison", "lawsuit", "murder", "suicide", "cult escape", "abuse"]

MAX_POSTS_PER_RUN = 500


class XScraper(BaseScraper):
    def __init__(self):
        super().__init__(platform="twitter")

    def _build_queries(self) -> list[str]:
        queries = list(PRIMARY_KEYWORDS)
        for kw in PRIMARY_KEYWORDS[:1]:  # combine with first keyword to stay within limits
            for signal in HATE_COMBOS:
                queries.append(f"{kw} {signal}")
            for signal in MISINFO_COMBOS:
                queries.append(f"{kw} {signal}")
        return queries

    def scrape(self) -> list[dict]:
        try:
            from ntscraper import Nitter
        except ImportError:
            logger.error("ntscraper not installed. Run: pip install ntscraper")
            return []

        scraper = Nitter()
        all_tweets: list[dict] = []
        queries = self._build_queries()

        for query in queries:
            if len(all_tweets) >= MAX_POSTS_PER_RUN:
                break
            try:
                remaining = MAX_POSTS_PER_RUN - len(all_tweets)
                tweets = scraper.get_tweets(query, mode="term", number=min(50, remaining))
                if tweets and "tweets" in tweets:
                    all_tweets.extend(tweets["tweets"])
                    logger.info(f"Query '{query}': got {len(tweets['tweets'])} tweets")
                time.sleep(2)  # rate limiting
            except Exception as e:
                logger.warning(f"Query '{query}' failed: {e}")

        return all_tweets[:MAX_POSTS_PER_RUN]

    def normalise(self, raw_item: dict) -> RawPost:
        text = raw_item.get("text", "")
        link = raw_item.get("link", "")
        user = raw_item.get("user", {})
        username = user.get("username", "unknown") if isinstance(user, dict) else str(user)
        stats = raw_item.get("stats", {})

        # Parse timestamp — ntscraper returns date as string
        date_str = raw_item.get("date", "")
        try:
            from datetime import datetime
            dt = datetime.strptime(date_str, "%b %d, %Y · %I:%M %p UTC")
            post_timestamp = int(dt.timestamp() * 1000)
        except Exception:
            post_timestamp = int(time.time() * 1000)

        return RawPost(
            source_url=link if link else f"https://x.com/status/{hash(text)}",
            platform="twitter",
            author=username,
            content=text,
            post_timestamp=post_timestamp,
            raw_metadata={
                "likes": stats.get("likes", 0),
                "retweets": stats.get("retweets", 0),
                "comments": stats.get("comments", 0),
            },
        )


if __name__ == "__main__":
    scraper = XScraper()
    scraper.run()
