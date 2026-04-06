import { describe, it, expect } from "vitest";
import {
  ClassificationResult,
  serializeClassificationResult,
  deserializeClassificationResult,
  validateRawPost,
  VALID_CATEGORIES,
  VALID_SEVERITIES,
  VALID_PLATFORMS,
  THEME_TAXONOMY,
  VALID_THEMES,
} from "./schemas";

// --- Constants ---

describe("exported constants", () => {
  it("VALID_CATEGORIES contains hate and misinfo", () => {
    expect(VALID_CATEGORIES).toEqual(["hate", "misinfo"]);
  });

  it("VALID_SEVERITIES contains four levels", () => {
    expect(VALID_SEVERITIES).toEqual(["low", "medium", "high", "critical"]);
  });

  it("VALID_PLATFORMS contains four platforms", () => {
    expect(VALID_PLATFORMS).toEqual(["twitter", "youtube", "instagram", "news"]);
  });

  it("THEME_TAXONOMY contains 10 predefined themes", () => {
    expect(THEME_TAXONOMY).toHaveLength(10);
    expect(THEME_TAXONOMY).toContain("personal_attack");
    expect(THEME_TAXONOMY).toContain("other");
  });

  it("VALID_THEMES is the same as THEME_TAXONOMY", () => {
    expect(VALID_THEMES).toBe(THEME_TAXONOMY);
  });
});

// --- serializeClassificationResult / deserializeClassificationResult ---

const validResult: ClassificationResult = {
  category: "hate",
  severity: "high",
  themes: ["personal_attack", "slur"],
  confidence: 0.85,
  reasoning: "Contains targeted slurs and personal attacks",
};

describe("serializeClassificationResult", () => {
  it("returns a valid JSON string", () => {
    const json = serializeClassificationResult(validResult);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("deserializeClassificationResult", () => {
  it("round-trips a valid ClassificationResult", () => {
    const json = serializeClassificationResult(validResult);
    const result = deserializeClassificationResult(json);
    expect(result).toEqual(validResult);
  });

  it("throws on invalid JSON", () => {
    expect(() => deserializeClassificationResult("not json")).toThrow("Invalid JSON string");
  });

  it("throws on non-object JSON", () => {
    expect(() => deserializeClassificationResult('"hello"')).toThrow("expected an object");
  });

  it("throws on invalid category", () => {
    const bad = { ...validResult, category: "spam" };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid category");
  });

  it("throws on invalid severity", () => {
    const bad = { ...validResult, severity: "extreme" };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid severity");
  });

  it("throws on empty themes array", () => {
    const bad = { ...validResult, themes: [] };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid themes");
  });

  it("throws on non-array themes", () => {
    const bad = { ...validResult, themes: "personal_attack" };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid themes");
  });

  it("throws on confidence out of range", () => {
    const bad = { ...validResult, confidence: 1.5 };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid confidence");
  });

  it("throws on negative confidence", () => {
    const bad = { ...validResult, confidence: -0.1 };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid confidence");
  });

  it("throws on empty reasoning", () => {
    const bad = { ...validResult, reasoning: "" };
    expect(() => deserializeClassificationResult(JSON.stringify(bad))).toThrow("Invalid reasoning");
  });

  it("accepts confidence at boundaries (0 and 1)", () => {
    const atZero = { ...validResult, confidence: 0 };
    expect(deserializeClassificationResult(JSON.stringify(atZero)).confidence).toBe(0);

    const atOne = { ...validResult, confidence: 1 };
    expect(deserializeClassificationResult(JSON.stringify(atOne)).confidence).toBe(1);
  });
});

// --- validateRawPost ---

const validPost = {
  source_url: "https://x.com/user/status/123",
  platform: "twitter",
  author: "testuser",
  content: "Some post content",
  post_timestamp: 1700000000000,
};

describe("validateRawPost", () => {
  it("accepts a valid RawPost", () => {
    const result = validateRawPost(validPost);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("rejects null input", () => {
    const result = validateRawPost(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("rejects array input", () => {
    const result = validateRawPost([]);
    expect(result.valid).toBe(false);
  });

  it("rejects missing source_url", () => {
    const { source_url: _, ...bad } = validPost;
    const result = validateRawPost(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("source_url"))).toBe(true);
  });

  it("rejects invalid platform", () => {
    const result = validateRawPost({ ...validPost, platform: "tiktok" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("platform"))).toBe(true);
  });

  it("rejects empty author", () => {
    const result = validateRawPost({ ...validPost, author: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("author"))).toBe(true);
  });

  it("rejects empty content", () => {
    const result = validateRawPost({ ...validPost, content: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("content"))).toBe(true);
  });

  it("rejects non-positive post_timestamp", () => {
    const result = validateRawPost({ ...validPost, post_timestamp: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("post_timestamp"))).toBe(true);
  });

  it("rejects negative post_timestamp", () => {
    const result = validateRawPost({ ...validPost, post_timestamp: -100 });
    expect(result.valid).toBe(false);
  });

  it("collects multiple errors", () => {
    const result = validateRawPost({ source_url: "", platform: "bad" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts all valid platforms", () => {
    for (const platform of ["twitter", "youtube", "instagram", "news"]) {
      const result = validateRawPost({ ...validPost, platform });
      expect(result.valid).toBe(true);
    }
  });
});
