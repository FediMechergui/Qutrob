// Arabic Roots Validation API Service
// This service provides word validation using multiple approaches

import qutufData from "../../القطوف.json";
import ahsantJson from "../../أحسنت.json";
import winJson from "../../win.json";
import {
  getRandomLetters,
  getLettersWithValidRoots,
  generateAllPermutations,
  getRootInfo,
  findValidRoots,
  normalizeRoot,
  VALID_ARABIC_ROOTS,
} from "../data/arabicDatabase";
import { shuffle } from "../utils/random";

// Types
export type Difficulty = "easy" | "medium" | "hard";

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
  difficulty?: Difficulty;
  // Normalized key of the source entry, used to avoid repeating questions
  usedKey: string;
}

// Arabic proverbs for level completion
// Build proverbs from القطوف.json when available; fall back to a small default list
const DEFAULT_PROVERBS = [
  {
    text: "العلم نور والجهل ظلام",
    meaning: "العلم يضيء طريق الإنسان بينما الجهل يحجب الرؤية",
  },
  { text: "من جد وجد ومن زرع حصد", meaning: "من يعمل بجد يحقق ما يريد" },
  { text: "الصبر مفتاح الفرج", meaning: "الصبر يؤدي إلى النجاح والراحة" },
  { text: "القلم أقوى من السيف", meaning: "الكلمة والعلم أقوى من القوة" },
  { text: "خير الكلام ما قل ودل", meaning: "أفضل الكلام المختصر المعبر" },
  { text: "اطلبوا العلم ولو في الصين", meaning: "اسعوا للعلم مهما كان بعيداً" },
  {
    text: "العقل السليم في الجسم السليم",
    meaning: "صحة الجسم تؤثر على صحة العقل",
  },
  { text: "الحكمة ضالة المؤمن", meaning: "المؤمن يبحث عن الحكمة أينما وجدها" },
  { text: "رب كلمة قالت لصاحبها دعني", meaning: "الكلمة لها تأثير كبير" },
  {
    text: "اللغة العربية بحر لا ينضب",
    meaning: "اللغة العربية غنية جداً بمفرداتها",
  },
];

export const ARABIC_PROVERBS: { text: string; meaning?: string }[] = (() => {
  try {
    const ahsantData = Array.isArray(ahsantJson) ? ahsantJson : [];
    if (!ahsantData || ahsantData.length === 0) return DEFAULT_PROVERBS;

    // Map entries from أحسنت.json to proverb-like objects
    const mapped = ahsantData
      .map((item: any) => {
        const text = (item?.title || "").toString().trim();
        const meaning = Array.isArray(item?.content)
          ? item.content.join("\n").trim()
          : (item?.content || "").toString().trim();
        return text ? { text, meaning } : null;
      })
      .filter(Boolean) as { text: string; meaning?: string }[];

    // If we got fewer than 5, fallback to defaults
    if (!mapped || mapped.length < 5) return DEFAULT_PROVERBS;

    // Return the first 10 mapped proverbs (or fewer if not available)
    return mapped.slice(0, Math.min(10, mapped.length));
  } catch (e) {
    console.warn(
      "ARABIC_PROVERBS: failed to build from أحسنت.json, using defaults",
      e
    );
    return DEFAULT_PROVERBS;
  }
})();

// Generate round data - picks from ALL entries regardless of difficulty
// This allows mixed difficulty roots to appear in the same round
// Returns 6 options (all possible permutations when needed)
// usedRoots: Set of root strings that have already been used (to avoid repeats)
export function generateRoundData(difficulty: Difficulty, usedRoots?: Set<string>): RoundData {
  // Try to source the round from القطوف.json - pick from ALL entries regardless of difficulty
  try {
    const allEntries: any[] = (qutufData as any)?.Feuil1 || [];

    // MIXED DIFFICULTY: Pick from ALL entries, not filtered by difficulty.
    // Only entries whose normalized root has exactly 3 letters are playable
    // (the same rule used when building the validation database), and
    // already-used roots are excluded to prevent repeats.
    const isPlayable = (e: any) =>
      e && e["الجذر"] && normalizeRoot(e["الجذر"] as string).length === 3;

    let candidates = allEntries.filter((e) => {
      if (!isPlayable(e)) return false;
      if (usedRoots && usedRoots.size > 0) {
        return !usedRoots.has(normalizeRoot(e["الجذر"] as string));
      }
      return true;
    });

    // If all entries have been used, reset and allow all
    if (candidates.length === 0) {
      candidates = allEntries.filter(isPlayable);
    }

    // Shuffle candidates for random order
    const shuffled = shuffle(candidates);

    // Pick a random entry from ANY difficulty
    const entry = shuffled[0];

    // Parse root letters from the "الجذر" field. Example: "أ ب ب"
    // Uses the shared normalization so letters always match the database key.
    let letters: [string, string, string] | null = null;
    let primaryRoot: string | null = null;
    if (entry && entry["الجذر"]) {
      const normalized = normalizeRoot(entry["الجذر"] as string);
      if (normalized.length === 3) {
        primaryRoot = normalized;
        letters = [normalized[0], normalized[1], normalized[2]];
      }
    }

    // Fallback to existing generator for letters if parsing failed
    if (!letters) {
      letters = getRandomLetters();
    }

    const allPermutations = generateAllPermutations(
      letters as [string, string, string]
    );

    // Always include any valid roots for these letters regardless of the
    // difficulty of the chosen entry. This allows roots from other
    // difficulty levels that happen to match the letters to appear in the
    // same round.
    const globalValidRoots = findValidRoots(
      letters as [string, string, string]
    );
    const mergedSet = new Set<string>();
    if (primaryRoot) mergedSet.add(primaryRoot);
    globalValidRoots.forEach((r) => mergedSet.add(r));
    const validRootsList: string[] = Array.from(mergedSet);

    // Build selected permutations: include valid roots and pad with others to 6
    let selectedPermutations: string[] = [...validRootsList];
    const invalidPermutations = allPermutations.filter(
      (p) => !selectedPermutations.includes(p)
    );
    const shuffledInvalid = shuffle(invalidPermutations);
    const slotsRemaining = Math.max(0, 6 - selectedPermutations.length);
    selectedPermutations = shuffle([
      ...selectedPermutations,
      ...shuffledInvalid.slice(0, slotsRemaining),
    ]);

    const meanings: { [key: string]: string } = {};
    const successMessages: { [key: string]: string } = {};
    const poetryExamples: { [key: string]: string } = {};

    // For each valid root, try to source meanings/messages from the
    // selected entry first (if it matches), then from the full القطوف.json
    // dataset, and finally fall back to the local DB `getRootInfo`.
    validRootsList.forEach((root: string) => {
      let filled = false;

      // If primaryRoot matches, use the selected entry's fields
      if (primaryRoot && root === primaryRoot && entry) {
        meanings[root] =
          entry["الشرح المختصر"] || entry["التحليل النهائي"] || "";
        successMessages[root] = entry["التحليل النهائي"] || "أحسنت!";
        if (entry["الأمثلة الشعرية"])
          poetryExamples[root] = entry["الأمثلة الشعرية"];
        filled = true;
      }

      if (!filled) {
        // Try to find a matching entry anywhere in the dataset (not only
        // the filtered candidates) to get a meaning regardless of difficulty.
        const allEntriesAny: any[] = (qutufData as any)?.Feuil1 || [];
        const match = allEntriesAny.find((e) => {
          const g =
            e && e["الجذر"] ? normalizeRoot(e["الجذر"] as string) : null;
          return g === root;
        });
        if (match) {
          meanings[root] =
            match["الشرح المختصر"] || match["التحليل النهائي"] || "";
          successMessages[root] = match["التحليل النهائي"] || "أحسنت!";
          if (match["الأمثلة الشعرية"])
            poetryExamples[root] = match["الأمثلة الشعرية"];
          filled = true;
        }
      }

      if (!filled) {
        const info = getRootInfo(root);
        if (info) {
          meanings[root] = info.meaning;
          successMessages[root] = info.successMessage || "أحسنت!";
          if (info.poetryExample) poetryExamples[root] = info.poetryExample;
        }
      }
    });

    // Determine difficulty from entry if present
    let entryDifficulty: Difficulty | undefined = undefined;
    if (entry && entry["المستوى"]) {
      const lvl = entry["المستوى"] as string;
      if (lvl.includes("سهل")) entryDifficulty = "easy";
      else if (lvl.includes("متوسط")) entryDifficulty = "medium";
      else if (lvl.includes("صعب")) entryDifficulty = "hard";
    }

    return {
      letters: letters as [string, string, string],
      permutations: selectedPermutations,
      validRoots: validRootsList,
      meanings,
      successMessages,
      poetryExamples,
      difficulty: entryDifficulty,
      usedKey: primaryRoot || (letters as string[]).join(""),
    };
  } catch (e) {
    // On error, fallback to previous behavior
    console.warn("generateRoundData: error using القطوف.json, falling back", e);
    let letters = getRandomLetters();
    const allPermutations = generateAllPermutations(letters);
    const validRootsList = findValidRoots(letters);

    let selectedPermutations: string[] = [...validRootsList];
    const invalidPermutations = allPermutations.filter(
      (p) => !validRootsList.includes(p)
    );
    const shuffledInvalid = shuffle(invalidPermutations);
    const slotsRemaining = Math.max(0, 6 - selectedPermutations.length);
    selectedPermutations = shuffle([
      ...selectedPermutations,
      ...shuffledInvalid.slice(0, slotsRemaining),
    ]);

    const meanings: { [key: string]: string } = {};
    const successMessages: { [key: string]: string } = {};
    const poetryExamples: { [key: string]: string } = {};

    validRootsList.forEach((root: string) => {
      const info = getRootInfo(root);
      if (info) {
        meanings[root] = info.meaning;
        successMessages[root] = info.successMessage;
        if (info.poetryExample) {
          poetryExamples[root] = info.poetryExample;
        }
      }
    });

    return {
      letters,
      permutations: selectedPermutations,
      validRoots: validRootsList,
      meanings,
      successMessages,
      poetryExamples,
      usedKey: letters.join(""),
    };
  }
}

// Validate a single root
export async function validateRoot(
  root: string
): Promise<RootValidationResult> {
  // Check against our database
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

  return {
    root,
    isValid: false,
  };
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
export async function validateRoots(roots: string[]): Promise<RootValidationResult[]> {
  return Promise.all(roots.map(root => validateRoot(root)));
}

// Get a letter set for a specific difficulty level
export async function getLetterSetForDifficulty(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<LetterSetResult> {
  // Define constraints based on difficulty
  const constraints = {
    easy: { minValidRoots: 1, maxValidRoots: 2 },
    medium: { minValidRoots: 1, maxValidRoots: 3 },
    hard: { minValidRoots: 1, maxValidRoots: 4 },
  };
  
  const { minValidRoots, maxValidRoots } = constraints[difficulty];
  
  // Get letters that have valid roots
  let letters = getLettersWithValidRoots(difficulty, minValidRoots, maxValidRoots);
  
  // If no good set found, get random letters
  if (!letters) {
    letters = getRandomLetters();
  }
  
  const totalPermutations = generateAllPermutations(letters);
  const validRootStrings = findValidRoots(letters);
  const validRoots = await validateRoots(validRootStrings);
  
  return {
    letters,
    validRoots,
    totalPermutations,
  };
}

// Get a completely new random letter set (for rotation)
export async function getNewRandomLetterSet(): Promise<LetterSetResult> {
  // Try to get letters with at least one valid root
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
  
  // Fallback: use easy difficulty
  return getLetterSetForDifficulty('easy');
}

// Get letter sets for a full level
export async function getLevelLetterSets(
  level: number,
  questionsPerLevel: number = 5
): Promise<LetterSetResult[]> {
  const letterSets: LetterSetResult[] = [];
  
  // Determine difficulty based on level
  let difficulty: 'easy' | 'medium' | 'hard';
  if (level <= 3) {
    difficulty = 'easy';
  } else if (level <= 6) {
    difficulty = 'medium';
  } else {
    difficulty = 'hard';
  }
  
  // Generate unique letter sets
  const usedLetterCombos = new Set<string>();
  
  for (let i = 0; i < questionsPerLevel; i++) {
    let letterSet: LetterSetResult;
    let attempts = 0;
    
    do {
      letterSet = await getLetterSetForDifficulty(difficulty);
      attempts++;
    } while (
      usedLetterCombos.has(letterSet.letters.join('')) && 
      attempts < 20
    );
    
    usedLetterCombos.add(letterSet.letters.join(''));
    letterSets.push(letterSet);
  }
  
  return letterSets;
}

// External API integration (for future use when a good API is available)
// This is a placeholder that can be connected to a real Arabic dictionary API
export async function validateRootExternal(root: string): Promise<RootValidationResult | null> {
  try {
    // Placeholder for external API
    // In the future, this could connect to:
    // - Arabic morphological analyzers
    // - Dictionary APIs
    // - NLP services
    
    // For now, fall back to local database
    return validateRoot(root);
  } catch (error) {
    console.error('External API error:', error);
    return null;
  }
}

// Get statistics about the database
export function getDatabaseStats() {
  const stats = {
    totalRoots: Object.keys(VALID_ARABIC_ROOTS).length,
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
  };
  
  Object.values(VALID_ARABIC_ROOTS).forEach(info => {
    stats.byDifficulty[info.difficulty]++;
  });
  
  return stats;
}
