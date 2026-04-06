import { describe, it, expect } from "vitest";
import {
  SUBJECT_KEYWORDS,
  HATE_SIGNAL_WORDS,
  MISINFO_SIGNAL_WORDS,
  containsSubjectKeyword,
  keywordPreFilter,
} from "./keywords";

// --- Keyword arrays ---

describe("keyword arrays", () => {
  it("SUBJECT_KEYWORDS has 4 entries", () => {
    expect(SUBJECT_KEYWORDS).toHaveLength(4);
  });

  it("HATE_SIGNAL_WORDS has 10 entries", () => {
    expect(HATE_SIGNAL_WORDS).toHaveLength(10);
  });

  it("MISINFO_SIGNAL_WORDS has 10 entries", () => {
    expect(MISINFO_SIGNAL_WORDS).toHaveLength(10);
  });
});

// --- containsSubjectKeyword ---

describe("containsSubjectKeyword", () => {
  it("returns true when text contains 'sadhguru'", () => {
    expect(containsSubjectKeyword("I saw Sadhguru speak today")).toBe(true);
  });

  it("returns true for 'isha foundation' (case-insensitive)", () => {
    expect(containsSubjectKeyword("The ISHA FOUNDATION event")).toBe(true);
  });

  it("returns true for 'jaggi vasudev'", () => {
    expect(containsSubjectKeyword("Jaggi Vasudev is trending")).toBe(true);
  });

  it("returns true for 'isha yoga'", () => {
    expect(containsSubjectKeyword("Isha Yoga center opened")).toBe(true);
  });

  it("returns false when no subject keyword is present", () => {
    expect(containsSubjectKeyword("Random text about nothing")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(containsSubjectKeyword("")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(containsSubjectKeyword("SADHGURU")).toBe(true);
    expect(containsSubjectKeyword("sadhguru")).toBe(true);
    expect(containsSubjectKeyword("SaDhGuRu")).toBe(true);
  });
});

// --- keywordPreFilter ---

describe("keywordPreFilter", () => {
  it("returns not candidate when no subject keyword", () => {
    const result = keywordPreFilter("Just a random tweet about cats");
    expect(result).toEqual({ isCandidate: false, track: null });
  });

  it("returns hate track when subject + hate signal word", () => {
    const result = keywordPreFilter("Sadhguru is a fraud and a scam artist");
    expect(result).toEqual({ isCandidate: true, track: "hate" });
  });

  it("returns misinfo track when subject + misinfo signal word", () => {
    const result = keywordPreFilter("Sadhguru mercury poison allegations");
    expect(result).toEqual({ isCandidate: true, track: "misinfo" });
  });

  it("returns candidate with null track when subject keyword but no signal words", () => {
    const result = keywordPreFilter("Sadhguru gave a wonderful talk today");
    expect(result).toEqual({ isCandidate: true, track: null });
  });

  it("prioritises hate over misinfo when both present", () => {
    // "abuse" appears in both lists; hate is checked first
    const result = keywordPreFilter("Sadhguru cult abuse mercury poison");
    expect(result).toEqual({ isCandidate: true, track: "hate" });
  });

  it("handles case-insensitive signal words", () => {
    const result = keywordPreFilter("ISHA FOUNDATION is a CULT");
    expect(result).toEqual({ isCandidate: true, track: "hate" });
  });

  it("detects multi-word signal phrases", () => {
    const result = keywordPreFilter("Jaggi Vasudev fake guru exposed");
    expect(result).toEqual({ isCandidate: true, track: "hate" });
  });

  it("detects multi-word misinfo phrases", () => {
    const result = keywordPreFilter("Isha Yoga money laundering investigation");
    expect(result).toEqual({ isCandidate: true, track: "misinfo" });
  });

  it("returns not candidate for empty string", () => {
    const result = keywordPreFilter("");
    expect(result).toEqual({ isCandidate: false, track: null });
  });
});
