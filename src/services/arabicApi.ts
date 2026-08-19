// Arabic Roots round generation
//
// Questions are drawn from the full valid-root universe (Lisān al-ʿArab ∪
// annotated entries). Difficulty now genuinely shapes what the player sees:
//   easy   → roots annotated 🟢 سهل
//   medium → roots annotated 🟡 متوسط
//   hard   → roots annotated 🔴 صعب, then rarer Lisān-only roots
// with graceful fallback to neighbouring tiers once a tier is exhausted.

import {
  generateAllPermutations,
  getRootInfo,
  findValidRoots,
  getRandomLetters,
  getLettersWithValidRoots,
  hasAnnotation,
  normalizeRoot,
  ROOTS_BY_DIFFICULTY,
  LISAN_ONLY_ROOTS,
  VALID_ARABIC_ROOTS,
  VALID_ROOTS_SET,
  Difficulty as DbDifficulty,
} from "../data/arabicDatabase";
import { shuffle, pickRandom } from "../utils/random";

// Re-exported so screens keep a single import path for proverbs
export { ARABIC_PROVERBS } from "../data/proverbs";

// Types
export type Difficulty = DbDifficulty;

export interface RootValidationResult {
  root: string;
  isValid: boolean;
  meaning?: string;
  hint?: string;
  examples?: string;
  difficulty?: Difficulty;
  successMessage?: string;
  poetryExample?: string;
}

export interface LetterSetResult {
  letters: [string, string, string];
  validRoots: RootValidationResult[];
  totalPermutations: string[];
}

export interface RoundData {
  letters: [string, string, string];
  permutations: string[];
  validRoots: string[];
  meanings: { [key: string]: string };
  successMessages: { [key: string]: string };
  poetryExamples: { [key: string]: string };
  // Difficulty of the source root (annotated tier, or "hard" for Lisān-only)
  difficulty?: Difficulty;
  // Normalized key of the source root, used to avoid repeating questions
  usedKey: string;
  // Whether the source root has a hand-written explanation
  hasExplanation: boolean;
}

// Number of option slots in the grid
const OPTION_SLOTS = 6;

// Pool order per requested difficulty. Hard rounds exhaust annotated hard
// roots before dipping into the rarer Lisān-only vocabulary; easy rounds never
// reach Lisān-only roots while any annotated root remains.
const POOL_ORDER: Record<Difficulty, Array<Difficulty | "lisan">> = {
  easy: ["easy", "medium", "hard", "lisan"],
  medium: ["medium", "easy", "hard", "lisan"],
  hard: ["hard", "lisan", "medium", "easy"],
};

function poolFor(tier: Difficulty | "lisan"): string[] {
  return tier === "lisan" ? LISAN_ONLY_ROOTS : ROOTS_BY_DIFFICULTY[tier];
}

/** Pick the source root for a round, honouring difficulty and used-set. */
function pickSourceRoot(
  difficulty: Difficulty,
  usedRoots?: Set<string>
): string {
  for (const tier of POOL_ORDER[difficulty]) {
    const candidates = poolFor(tier).filter(
      (r) => !usedRoots || !usedRoots.has(r)
    );
    if (candidates.length > 0) return pickRandom(candidates)!;
  }
  // Everything has been used: reset within the preferred tier
  for (const tier of POOL_ORDER[difficulty]) {
    const pool = poolFor(tier);
    if (pool.length > 0) return pickRandom(pool)!;
  }
  // Absolute fallback (should never happen with bundled data)
  return getRandomLetters().join("");
}

/** Build the per-root explanation maps for a set of valid roots. */
function buildExplanations(validRoots: string[]) {
  const meanings: { [key: string]: string } = {};
  const successMessages: { [key: string]: string } = {};
  const poetryExamples: { [key: string]: string } = {};

  for (const root of validRoots) {
    const info = getRootInfo(root);
    if (!info) continue;
    if (info.meaning) meanings[root] = info.meaning;
    successMessages[root] = info.successMessage;
    if (info.poetryExample) poetryExamples[root] = info.poetryExample;
  }
  return { meanings, successMessages, poetryExamples };
}

/**
 * Generate round data.
 *
 * @param difficulty  Session difficulty (drives which roots are asked).
 * @param usedRoots   Normalized roots already used this session (no repeats).
 */
export function generateRoundData(
  difficulty: Difficulty,
  usedRoots?: Set<string>
): RoundData {
  const sourceRoot = normalizeRoot(pickSourceRoot(difficulty, usedRoots));
  const letters: [string, string, string] = [
    sourceRoot[0],
    sourceRoot[1],
    sourceRoot[2],
  ];

  // Distinct permutations (3 or 1 for roots with repeated letters)
  const allPermutations = generateAllPermutations(letters);
  const validRootsList = allPermutations.filter((p) => VALID_ROOTS_SET.has(p));

  // Options: every valid root + random invalid permutations up to 6 slots
  const invalid = shuffle(
    allPermutations.filter((p) => !validRootsList.includes(p))
  );
  const slotsRemaining = Math.max(0, OPTION_SLOTS - validRootsList.length);
  const permutations = shuffle([
    ...validRootsList,
    ...invalid.slice(0, slotsRemaining),
  ]);

  const { meanings, successMessages, poetryExamples } =
    buildExplanations(validRootsList);

  const sourceInfo = getRootInfo(sourceRoot);

  return {
    letters,
    permutations,
    validRoots: validRootsList,
    meanings,
    successMessages,
    poetryExamples,
    difficulty: sourceInfo?.difficulty ?? difficulty,
    usedKey: sourceRoot,
    hasExplanation: hasAnnotation(sourceRoot),
  };
}

// Validate a single root
export async function validateRoot(
  root: string
): Promise<RootValidationResult> {
  const info = getRootInfo(root);

  if (info) {
    return {
      root,
      isValid: true,
      meaning: info.meaning,
      hint: info.hint,
      examples: info.examples,
      difficulty: info.difficulty,
      successMessage: info.successMessage,
      poetryExample: info.poetryExample,
    };
  }

  return { root, isValid: false };
}

// Get success message for a root
export function getSuccessMessage(root: string): string | null {
  const info = getRootInfo(root);
  return info?.successMessage || null;
}

// Get hint for a root
export function getHint(root: string): string | null {
  const info = getRootInfo(root);
  return info?.hint || null;
}

// Validate multiple roots
export async function validateRoots(
  roots: string[]
): Promise<RootValidationResult[]> {
  return Promise.all(roots.map((root) => validateRoot(root)));
}

// Get a letter set for a specific difficulty level
export async function getLetterSetForDifficulty(
  difficulty: Difficulty
): Promise<LetterSetResult> {
  const constraints = {
    easy: { minValidRoots: 1, maxValidRoots: 2 },
    medium: { minValidRoots: 1, maxValidRoots: 3 },
    hard: { minValidRoots: 1, maxValidRoots: 4 },
  };

  const { minValidRoots, maxValidRoots } = constraints[difficulty];

  let letters = getLettersWithValidRoots(difficulty, minValidRoots, maxValidRoots);
  if (!letters) {
    letters = getRandomLetters();
  }

  const totalPermutations = generateAllPermutations(letters);
  const validRootStrings = findValidRoots(letters);
  const validRoots = await validateRoots(validRootStrings);

  return { letters, validRoots, totalPermutations };
}

// Get a completely new random letter set (for rotation)
export async function getNewRandomLetterSet(): Promise<LetterSetResult> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const letters = getRandomLetters();
    const validRootStrings = findValidRoots(letters);

    if (validRootStrings.length > 0 && validRootStrings.length <= 4) {
      const validRoots = await validateRoots(validRootStrings);
      return {
        letters,
        validRoots,
        totalPermutations: generateAllPermutations(letters),
      };
    }
  }
  return getLetterSetForDifficulty("easy");
}

// Get statistics about the database
export function getDatabaseStats() {
  const stats = {
    totalRoots: VALID_ROOTS_SET.size,
    annotatedRoots: Object.keys(VALID_ARABIC_ROOTS).length,
    lisanOnlyRoots: LISAN_ONLY_ROOTS.length,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
  };

  Object.values(VALID_ARABIC_ROOTS).forEach((info) => {
    stats.byDifficulty[info.difficulty]++;
  });

  return stats;
}
