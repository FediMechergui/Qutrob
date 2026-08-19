// Arabic Roots Database
//
// Built at module load from the generated data produced by
// `scripts/build-data.js` (run `npm run build:data`):
//
//   roots.json        – every valid triliteral root: the complete Lisān al-ʿArab
//                       inventory (lisan345, 6,529 roots) ∪ the project's own
//                       annotated roots ∪ ي/و spelling aliases.
//   rootEntries.json  – rich annotations (meaning, hint, examples, difficulty,
//                       success message, poetry) for ~3,500 roots, de-duplicated.
//   rootAliases.json  – alias spelling → canonical Lisān spelling (بكي → بكو).
//   lisanExcerpts.json – opening excerpt of the root's entry in Lisān al-ʿArab
//                       (ar.wikisource), produced by scripts/enrich-lisan.js.
//
// Validity ("is this permutation a real root?") is answered by roots.json, so
// a player is never penalised for picking a genuine root that merely lacks an
// annotation. Explanations come in two layers: the hand-written annotation
// when one exists, otherwise the dictionary's own words from Lisān.

import generatedRoots from "./generated/roots.json";
import generatedEntries from "./generated/rootEntries.json";
import generatedAliases from "./generated/rootAliases.json";
import generatedExcerpts from "./generated/lisanExcerpts.json";
import { shuffle } from "../utils/random";

// All 28 Arabic letters as they appear in roots (hamza as أ; bare ا is never a radical)
export const ARABIC_LETTERS = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص",
  "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
];

export type Difficulty = "easy" | "medium" | "hard";

/** Where a root's explanation comes from. */
export type RootInfoSource = "annotated" | "lisan" | "none";

// Type for root info
export interface RootInfo {
  meaning: string;
  hint: string;
  examples: string;
  difficulty: Difficulty;
  successMessage: string;
  poetryExample?: string;
  source: RootInfoSource;
  // true when the root is attested in Lisān but has no hand-written annotation
  isLisanOnly?: boolean;
}

// Helper function to convert root format: "أ ب ب" -> "أبب"
// Mirrors the normalisation in scripts/build-data.js so lookups always match.
export function normalizeRoot(root: string): string {
  return (root || "")
    .replace(/\([^)]*\)|\)|\(/g, "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, "")
    .replace(/هـ/g, "ه")
    .replace(/[إآءؤئ]/g, "أ")
    .trim();
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type GeneratedEntry = {
  meaning: string;
  hint: string;
  examples: string;
  difficulty: Difficulty;
  successMessage: string;
  poetryExample: string;
};

const ENTRIES = generatedEntries as Record<string, GeneratedEntry>;
const ALIASES = generatedAliases as Record<string, string>;
const EXCERPTS = generatedExcerpts as Record<string, string>;

/** Every valid triliteral root (canonical + aliases). */
export const VALID_ROOTS_SET: ReadonlySet<string> = new Set(
  generatedRoots as string[]
);

/** Rich hand-written annotations keyed by canonical root. */
export const VALID_ARABIC_ROOTS: Record<string, RootInfo> = (() => {
  const db: Record<string, RootInfo> = {};
  for (const [root, e] of Object.entries(ENTRIES)) {
    db[root] = {
      meaning: e.meaning,
      hint: e.hint || e.meaning,
      examples: e.examples,
      difficulty: e.difficulty,
      successMessage:
        e.successMessage || `أحسنت! "${root}" جذر صحيح.`,
      poetryExample: e.poetryExample || undefined,
      source: "annotated",
    };
  }
  return db;
})();

/** Opening excerpt of the root's Lisān al-ʿArab entry, when transcribed. */
export function getLisanExcerpt(root: string): string | undefined {
  const key = canonicalRoot(root);
  return EXCERPTS[key] || EXCERPTS[normalizeRoot(root)] || undefined;
}

/** Roots grouped by annotated difficulty (used for level-appropriate questions). */
export const ROOTS_BY_DIFFICULTY: Record<Difficulty, string[]> = (() => {
  const byDiff: Record<Difficulty, string[]> = { easy: [], medium: [], hard: [] };
  for (const [root, info] of Object.entries(VALID_ARABIC_ROOTS)) {
    byDiff[info.difficulty].push(root);
  }
  return byDiff;
})();

/** Roots attested in Lisān that have no annotation (rarer vocabulary). */
export const LISAN_ONLY_ROOTS: string[] = (generatedRoots as string[]).filter(
  (r) => !ENTRIES[r] && !ALIASES[r]
);

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Resolve an alias spelling (بكي) to its canonical key (بكو). */
export function canonicalRoot(root: string): string {
  const n = normalizeRoot(root);
  return ALIASES[n] || n;
}

// Function to check if a root is valid
export function isValidRoot(root: string): boolean {
  return VALID_ROOTS_SET.has(root);
}

/**
 * Get info for a root, in order of preference:
 *   1. the hand-written annotation;
 *   2. an entry synthesised from the root's own Lisān al-ʿArab excerpt;
 *   3. a minimal, honest entry for roots attested in Lisān but not transcribed —
 *      validity is confirmed without inventing a meaning.
 */
export function getRootInfo(root: string): RootInfo | null {
  const key = canonicalRoot(root);
  const info = VALID_ARABIC_ROOTS[key];
  if (info) return info;
  if (!VALID_ROOTS_SET.has(key) && !VALID_ROOTS_SET.has(root)) return null;

  const excerpt = getLisanExcerpt(key);
  if (excerpt) {
    return {
      meaning: excerpt,
      hint: "",
      examples: "",
      difficulty: "hard",
      successMessage: `أحسنت! "${root}" جذر صحيح. جاء في لسان العرب: ${excerpt}`,
      source: "lisan",
      isLisanOnly: true,
    };
  }
  return {
    meaning: "",
    hint: "",
    examples: "",
    difficulty: "hard",
    successMessage: `أحسنت! "${root}" جذر صحيح ورد في لسان العرب.`,
    source: "none",
    isLisanOnly: true,
  };
}

/** Whether the root has a hand-written annotation (meaning/analysis). */
export function hasAnnotation(root: string): boolean {
  return !!VALID_ARABIC_ROOTS[canonicalRoot(root)];
}

// ---------------------------------------------------------------------------
// Permutations
// ---------------------------------------------------------------------------

/**
 * Generate the distinct permutations of 3 letters. For distinct letters this is
 * 6; for roots with a repeated letter (أبب, أسس…) it is 3; for a tripled letter
 * it is 1. De-duplicating here is what prevents the same option appearing twice
 * in the grid.
 */
export function generateAllPermutations(
  letters: [string, string, string]
): string[] {
  const [a, b, c] = letters;
  const all = [a + b + c, a + c + b, b + a + c, b + c + a, c + a + b, c + b + a];
  return Array.from(new Set(all));
}

// Find valid roots from permutations
export function findValidRoots(letters: [string, string, string]): string[] {
  return generateAllPermutations(letters).filter((p) => isValidRoot(p));
}

// ---------------------------------------------------------------------------
// Letter selection helpers
// ---------------------------------------------------------------------------

// Get a letter set that has at least one valid root
export function getLettersWithValidRoots(
  difficulty: Difficulty,
  minValidRoots: number = 1,
  maxValidRoots: number = 3
): [string, string, string] | null {
  const rootsOfDifficulty = ROOTS_BY_DIFFICULTY[difficulty];
  if (rootsOfDifficulty.length === 0) return null;

  // Try to find a good letter combination
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomRoot =
      rootsOfDifficulty[Math.floor(Math.random() * rootsOfDifficulty.length)];
    const letters = shuffle([randomRoot[0], randomRoot[1], randomRoot[2]]) as [
      string,
      string,
      string
    ];

    const validRoots = findValidRoots(letters);
    if (
      validRoots.length >= minValidRoots &&
      validRoots.length <= maxValidRoots
    ) {
      return letters;
    }
  }

  // Fallback: just return letters from a random root
  const randomRoot =
    rootsOfDifficulty[Math.floor(Math.random() * rootsOfDifficulty.length)];
  return [randomRoot[0], randomRoot[1], randomRoot[2]];
}

// Get completely random letters (may or may not have valid roots)
export function getRandomLetters(): [string, string, string] {
  const shuffled = shuffle(ARABIC_LETTERS);
  return [shuffled[0], shuffled[1], shuffled[2]];
}
