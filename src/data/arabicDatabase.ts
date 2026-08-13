// Comprehensive Arabic Roots Database - Roots from ابدذر.json, ز الى ع.json, and القطوف.json
// This database contains real Arabic trilateral roots (جذور ثلاثية)

// Import the JSON databases
import rootsData from "../../ابدذر.json";
import rootsDataExtended from "../../ز الى ع.json";
import qutufData from "../../القطوف.json";
import { shuffle } from "../utils/random";

// All 28 Arabic letters for random generation
export const ARABIC_LETTERS = [
  "ا",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "ه",
  "و",
  "ي",
];

// Letters that work well as first letter (more common in roots)
export const STRONG_FIRST_LETTERS = [
  "ب",
  "ت",
  "ج",
  "ح",
  "خ",
  "د",
  "ر",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "ه",
  "و",
];

// Letters that work well as middle letter
export const STRONG_MIDDLE_LETTERS = [
  "ا",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ط",
  "ع",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "ه",
  "و",
  "ي",
];

// Type for root info from JSON
export interface RootInfo {
  meaning: string;
  hint: string;
  examples: string;
  difficulty: "easy" | "medium" | "hard";
  successMessage: string;
  poetryExample?: string;
}

// Helper function to convert root format: "أ ب ب" -> "أبب"
// Exported so round generation applies the exact same normalization
// that was used to build the database.
export function normalizeRoot(root: string): string {
  return root.replace(/\s+/g, "").replace(/هـ/g, "ه");
}

// Helper function to map difficulty level
function mapDifficulty(level: string): "easy" | "medium" | "hard" {
  if (level.includes("سهل") || level.includes("🟢")) return "easy";
  if (level.includes("متوسط") || level.includes("🟡")) return "medium";
  if (level.includes("صعب") || level.includes("🔴")) return "hard";
  return "medium"; // default
}

// Build the roots database from JSON
function buildRootsDatabase(): Record<string, RootInfo> {
  const database: Record<string, RootInfo> = {};

  // Type for JSON root entry
  type JsonRootEntry = {
    الجذر: string;
    "الشرح المختصر"?: string;
    التلميح?: string;
    "أمثلة توضيحية"?: string;
    المستوى?: string;
    "أحسنت!"?: string;
    "أحسنت! "?: string;
    "الأمثلة الشعرية"?: string;
  };

  // Process first JSON file (ابدذر.json)
  const jsonRoots = (
    rootsData as {
      Feuil1: Array<JsonRootEntry>;
    }
  ).Feuil1;

  for (const root of jsonRoots) {
    const normalizedRoot = normalizeRoot(root["الجذر"]);

    // Skip if root doesn't have 3 letters after normalization
    if (normalizedRoot.length !== 3) continue;

    database[normalizedRoot] = {
      meaning: root["الشرح المختصر"] || "",
      hint: root["التلميح"] || root["الشرح المختصر"] || "",
      examples: root["أمثلة توضيحية"] || "",
      difficulty: mapDifficulty(root["المستوى"] || ""),
      successMessage:
        root["أحسنت! "] ||
        root["أحسنت!"] ||
        `أحسنت! '${root["الجذر"]}' هو جذر صحيح.`,
      poetryExample:
        root["الأمثلة الشعرية"] !== "-" ? root["الأمثلة الشعرية"] : undefined,
    };
  }

  // Process second JSON file (ز الى ع.json)
  const jsonRootsExtended = (
    rootsDataExtended as {
      Feuil1: Array<JsonRootEntry>;
    }
  ).Feuil1;

  for (const root of jsonRootsExtended) {
    const normalizedRoot = normalizeRoot(root["الجذر"]);

    // Skip if root doesn't have 3 letters after normalization
    if (normalizedRoot.length !== 3) continue;

    // Only add if not already in database (avoid duplicates)
    if (!database[normalizedRoot]) {
      database[normalizedRoot] = {
        meaning: root["الشرح المختصر"] || "",
        hint: root["التلميح"] || root["الشرح المختصر"] || "",
        examples: root["أمثلة توضيحية"] || "",
        difficulty: mapDifficulty(root["المستوى"] || ""),
        successMessage:
          root["أحسنت!"] ||
          root["أحسنت! "] ||
          `أحسنت! '${root["الجذر"]}' هو جذر صحيح.`,
        poetryExample:
          root["الأمثلة الشعرية"] !== "-" ? root["الأمثلة الشعرية"] : undefined,
      };
    }
  }

  // Process القطوف.json - the main comprehensive database with ALL difficulty levels
  // This ensures roots from any difficulty can appear in any round
  try {
    const qutufEntries: any[] = (qutufData as any)?.Feuil1 || [];
    for (const entry of qutufEntries) {
      if (!entry || !entry["الجذر"]) continue;

      const normalizedRoot = normalizeRoot(entry["الجذر"]);

      // Skip if root doesn't have 3 letters after normalization
      if (normalizedRoot.length !== 3) continue;

      // Only add if not already in database (avoid duplicates)
      if (!database[normalizedRoot]) {
        database[normalizedRoot] = {
          meaning: entry["الشرح المختصر"] || entry["التحليل النهائي"] || "",
          hint: entry["التلميح"] || entry["الشرح المختصر"] || "",
          examples: entry["أمثلة توضيحية"] || "",
          difficulty: mapDifficulty(entry["المستوى"] || ""),
          successMessage:
            entry["التحليل النهائي"] ||
            `أحسنت! '${entry["الجذر"]}' هو جذر صحيح.`,
          poetryExample:
            entry["الأمثلة الشعرية"] && entry["الأمثلة الشعرية"] !== "-"
              ? entry["الأمثلة الشعرية"]
              : undefined,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load roots from القطوف.json:", e);
  }

  return database;
}

// Build database once at module load
export const VALID_ARABIC_ROOTS: Record<string, RootInfo> =
  buildRootsDatabase();

// Get all valid roots as a Set for quick lookup
export const VALID_ROOTS_SET = new Set(Object.keys(VALID_ARABIC_ROOTS));

// Function to check if a root is valid
export function isValidRoot(root: string): boolean {
  return VALID_ROOTS_SET.has(root);
}

// Function to get root info
export function getRootInfo(root: string) {
  return VALID_ARABIC_ROOTS[root] || null;
}

// Generate all 6 permutations of 3 letters
export function generateAllPermutations(
  letters: [string, string, string]
): string[] {
  const [a, b, c] = letters;
  return [a + b + c, a + c + b, b + a + c, b + c + a, c + a + b, c + b + a];
}

// Find valid roots from permutations
export function findValidRoots(letters: [string, string, string]): string[] {
  const permutations = generateAllPermutations(letters);
  return permutations.filter((p) => isValidRoot(p));
}

// Get a letter set that has at least one valid root
export function getLettersWithValidRoots(
  difficulty: "easy" | "medium" | "hard",
  minValidRoots: number = 1,
  maxValidRoots: number = 3
): [string, string, string] | null {
  // Get roots of the specified difficulty
  const rootsOfDifficulty = Object.entries(VALID_ARABIC_ROOTS)
    .filter(([_, info]) => info.difficulty === difficulty)
    .map(([root]) => root);

  if (rootsOfDifficulty.length === 0) return null;

  // Try to find a good letter combination
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomRoot =
      rootsOfDifficulty[Math.floor(Math.random() * rootsOfDifficulty.length)];
    const letters: [string, string, string] = [
      randomRoot[0],
      randomRoot[1],
      randomRoot[2],
    ];

    // Shuffle the letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

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
