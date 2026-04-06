export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-6">About Sadhguru Intel</h2>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Purpose</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Sadhguru Intel is a threat intelligence dashboard that monitors, collects, classifies,
          and visualises harmful online content related to Sadhguru and the Isha Foundation.
          It tracks two categories: coordinated hate attacks and misinformation campaigns.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Methodology</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Content is collected from X (Twitter), YouTube, Instagram, and news media using
          automated scrapers running on scheduled intervals. Each post passes through a
          two-stage classification pipeline: a keyword pre-filter followed by AI classification
          using Google Gemini Flash 2.0. Posts are categorised by type, severity, and theme.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Data Sources</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
          <li>X (Twitter) — via keyword search scraping</li>
          <li>YouTube — via YouTube Data API v3</li>
          <li>Instagram — via Apify Instagram Scraper</li>
          <li>News — via NewsAPI, Google News RSS, and supplementary RSS feeds</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Limitations</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
          <li>AI classification may produce false positives or negatives</li>
          <li>Data collection is near-real-time (scheduled), not live streaming</li>
          <li>Platform API limitations may affect coverage</li>
          <li>Only English-language content is currently classified</li>
        </ul>
      </section>

      <section className="p-4 bg-warning/10 rounded-lg border border-warning/20">
        <p className="text-sm text-warning-700 dark:text-warning-400 font-medium">
          Disclaimer: This tool is for research and documentation purposes only.
          It is not a counter-attack platform and does not facilitate takedown requests,
          legal action, or identification of private individuals.
        </p>
      </section>
    </div>
  );
}
