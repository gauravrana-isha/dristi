// Stage 1 keyword lists and pre-filter logic for the classification pipeline

/** Subject keywords — text must mention at least one to be a candidate */
export const SUBJECT_KEYWORDS = [
  "sadhguru",
  "isha foundation",
  "jaggi vasudev",
  "isha yoga",
] as const;

/** Signal words indicating potential hate content */
export const HATE_SIGNAL_WORDS = [
  "cult",
  "fraud",
  "arrested",
  "criminal",
  "scam",
  "fake guru",
  "charlatan",
  "conman",
  "predator",
  "abuse",
] as const;

/** Signal words indicating potential misinformation content */
export const MISINFO_SIGNAL_WORDS = [
  "mercury",
  "poison",
  "lawsuit",
  "murder",
  "suicide",
  "cult escape",
  "abuse",
  "trafficking",
  "money laundering",
  "tax evasion",
] as const;

/**
 * Case-insensitive check whether text contains any subject keyword.
 */
export function containsSubjectKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return SUBJECT_KEYWORDS.some((kw) => lower.includes(kw));
}

export interface KeywordPreFilterResult {
  isCandidate: boolean;
  track: "hate" | "misinfo" | null;
}

/**
 * Stage 1 keyword pre-filter.
 *
 * 1. If text contains no subject keyword → { isCandidate: false, track: null }
 * 2. If text contains a hate signal word → { isCandidate: true, track: "hate" }
 * 3. If text contains a misinfo signal word → { isCandidate: true, track: "misinfo" }
 * 4. Subject keyword present but no signal words → { isCandidate: true, track: null }
 */
export function keywordPreFilter(text: string): KeywordPreFilterResult {
  if (!containsSubjectKeyword(text)) {
    return { isCandidate: false, track: null };
  }

  const lower = text.toLowerCase();

  if (HATE_SIGNAL_WORDS.some((w) => lower.includes(w))) {
    return { isCandidate: true, track: "hate" };
  }

  if (MISINFO_SIGNAL_WORDS.some((w) => lower.includes(w))) {
    return { isCandidate: true, track: "misinfo" };
  }

  return { isCandidate: true, track: null };
}
