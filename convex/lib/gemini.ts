// Gemini Flash 2.0 API client for post classification
// Supports both Vertex AI (GCP) and Google AI Studio (API key) modes

import type { ClassificationResult } from "./schemas";
import { deserializeClassificationResult } from "./schemas";

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
 * Get an OAuth2 access token from a GCP service account key JSON.
 * The key JSON is passed as a string (stored in Convex env var).
 */
async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  const now = Math.floor(Date.now() / 1000);

  // Build JWT header and claim set
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedToken = `${encode(header)}.${encode(claimSet)}`;

  // Import the private key and sign
  const pemContents = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResp.ok) {
    throw new Error(`OAuth token exchange failed: ${await tokenResp.text()}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

/**
 * Classify a post using Gemini Flash 2.0.
 *
 * Supports two modes based on env vars:
 * - Vertex AI: set GCP_PROJECT_ID, GCP_REGION, GCP_SERVICE_ACCOUNT_KEY
 * - AI Studio: set GEMINI_API_KEY
 */
export async function classifyPost(
  content: string,
  platform: string,
  config: {
    mode: "vertex" | "aistudio";
    apiKey?: string;
    projectId?: string;
    region?: string;
    serviceAccountKey?: string;
  }
): Promise<ClassificationResult> {
  const prompt = buildPrompt(content, platform);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  let response: Response;

  if (config.mode === "vertex") {
    if (!config.projectId || !config.region || !config.serviceAccountKey) {
      throw new Error("Vertex AI requires GCP_PROJECT_ID, GCP_REGION, and GCP_SERVICE_ACCOUNT_KEY");
    }

    const accessToken = await getAccessToken(config.serviceAccountKey);
    const url = `https://${config.region}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}/publishers/google/models/gemini-2.0-flash:generateContent`;

    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });
  } else {
    if (!config.apiKey) {
      throw new Error("AI Studio mode requires GEMINI_API_KEY");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.apiKey}`;
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown");
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof generatedText !== "string") {
    throw new Error(`Unexpected response structure: ${JSON.stringify(data)}`);
  }

  return deserializeClassificationResult(generatedText);
}
