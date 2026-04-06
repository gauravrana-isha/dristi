// Validation schemas and serialisation helpers for RawPost and ClassificationResult

// --- Constants ---

export const VALID_CATEGORIES = ["hate", "misinfo"] as const;
export type Category = (typeof VALID_CATEGORIES)[number];

export const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof VALID_SEVERITIES)[number];

export const VALID_PLATFORMS = ["twitter", "youtube", "instagram", "news"] as const;
export type Platform = (typeof VALID_PLATFORMS)[number];

export const THEME_TAXONOMY = [
  "personal_attack",
  "slur",
  "cult_allegation",
  "health_misinfo",
  "legal_allegations",
  "financial_fraud",
  "coordinated_amplification",
  "satire",
  "criticism",
  "other",
] as const;

export const VALID_THEMES = THEME_TAXONOMY;

// --- ClassificationResult ---

export interface ClassificationResult {
  category: Category;
  severity: Severity;
  themes: string[];
  confidence: number;
  reasoning: string;
}

export function serializeClassificationResult(
  result: ClassificationResult
): string {
  return JSON.stringify(result);
}

export function deserializeClassificationResult(
  json: string
): ClassificationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON string");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid ClassificationResult: expected an object");
  }

  const obj = parsed as Record<string, unknown>;

  if (
    !VALID_CATEGORIES.includes(obj.category as Category)
  ) {
    throw new Error(
      `Invalid category: ${JSON.stringify(obj.category)}. Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  if (
    !VALID_SEVERITIES.includes(obj.severity as Severity)
  ) {
    throw new Error(
      `Invalid severity: ${JSON.stringify(obj.severity)}. Must be one of: ${VALID_SEVERITIES.join(", ")}`
    );
  }

  if (
    !Array.isArray(obj.themes) ||
    obj.themes.length === 0 ||
    !obj.themes.every((t: unknown) => typeof t === "string")
  ) {
    throw new Error(
      "Invalid themes: must be a non-empty array of strings"
    );
  }

  if (
    typeof obj.confidence !== "number" ||
    obj.confidence < 0 ||
    obj.confidence > 1
  ) {
    throw new Error(
      `Invalid confidence: ${JSON.stringify(obj.confidence)}. Must be a number in [0, 1]`
    );
  }

  if (typeof obj.reasoning !== "string" || obj.reasoning.length === 0) {
    throw new Error(
      "Invalid reasoning: must be a non-empty string"
    );
  }

  return {
    category: obj.category as Category,
    severity: obj.severity as Severity,
    themes: obj.themes as string[],
    confidence: obj.confidence as number,
    reasoning: obj.reasoning as string,
  };
}

// --- RawPost Validation ---

export function validateRawPost(
  data: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { valid: false, errors: ["Input must be a non-null object"] };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.source_url !== "string" || obj.source_url.length === 0) {
    errors.push("source_url must be a non-empty string");
  }

  if (!VALID_PLATFORMS.includes(obj.platform as Platform)) {
    errors.push(
      `platform must be one of: ${VALID_PLATFORMS.join(", ")}`
    );
  }

  if (typeof obj.author !== "string" || obj.author.length === 0) {
    errors.push("author must be a non-empty string");
  }

  if (typeof obj.content !== "string" || obj.content.length === 0) {
    errors.push("content must be a non-empty string");
  }

  if (typeof obj.post_timestamp !== "number" || obj.post_timestamp <= 0) {
    errors.push("post_timestamp must be a positive number");
  }

  return { valid: errors.length === 0, errors };
}
