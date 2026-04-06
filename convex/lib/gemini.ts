// Gemini Flash 2.0 API client for post classification

import type { ClassificationResult } from "./schemas";
import { deserializeClassificationResult } from "./schemas";

/** Gemini Flash 2.0 REST API endpoint */
export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Build the classification prompt for Gemini.
 */
function buildPrompt(content: string, platform: string): string {
  return `You are a content analyst reviewing online posts about Sadhguru (Jaggi Vasudev) and the Isha Foundation.

Classify the following post strictly as JSON with no other text:

Post: "${content}"
Platform: "${platform}"

{
  "category": "hate" | "misinfo",
  "severity": "low" | "medium" | "high" | "critical",
  "themes": ["theme1", "theme2"],
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}

Valid themes: personal_attack, slur, cult_allegation, health_misinfo, legal_allegations, financial_fraud, coordinated_amplification, satire, criticism, other

Severity scale:
- low: mild negative opinion
- medium: personal criticism
- high: false factual claim or targeted attack
- critical: coordinated campaign, severe slur, incitement, threats, or viral misinfo`;
}

/**
 * Classify a post using the Gemini Flash 2.0 REST API.
 *
 * @param content  - The post text to classify
 * @param platform - The platform the post came from (e.g. "twitter", "youtube")
 * @param apiKey   - Gemini API key
 * @returns A validated ClassificationResult
 * @throws On API failure, invalid response structure, or validation failure
 */
export async function classifyPost(
  content: string,
  platform: string,
  apiKey: string
): Promise<ClassificationResult> {
  const prompt = buildPrompt(content, platform);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown");
    throw new Error(
      `Gemini API error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();

  // Extract generated text from the Gemini response structure
  const generatedText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof generatedText !== "string") {
    throw new Error(
      `Gemini API returned unexpected response structure: ${JSON.stringify(data)}`
    );
  }

  // Validate through deserializeClassificationResult (handles JSON parse + schema validation)
  return deserializeClassificationResult(generatedText);
}
