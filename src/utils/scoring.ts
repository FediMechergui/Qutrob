// Pure scoring logic for both game modes.
// Kept free of React Native imports so it is directly unit-testable.

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultySettings {
  nameAr: string;
  roundsPerLevel: number;
  basePoints: number;
  hintCost: number;
}

export const ROOTS_DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  easy: { nameAr: "سهل", roundsPerLevel: 3, basePoints: 10, hintCost: 5 },
  medium: { nameAr: "متوسط", roundsPerLevel: 4, basePoints: 15, hintCost: 10 },
  hard: { nameAr: "صعب", roundsPerLevel: 5, basePoints: 25, hintCost: 15 },
};

// Re-rolling the letter wheel: the first spin per round is free, further spins
// cost the difficulty's hint cost (closes the "spin until easy" exploit).
export const FREE_SPINS_PER_ROUND = 1;

export function spinCost(
  spinsUsedThisRound: number,
  config: DifficultySettings
): number {
  return spinsUsedThisRound < FREE_SPINS_PER_ROUND ? 0 : config.hintCost;
}

// Progressive hints: count → first letter of a valid root → meaning of a valid
// root (one per valid root). Cost escalates with the hint index.
export function hintCost(hintIndex: number, config: DifficultySettings): number {
  return config.hintCost * (hintIndex + 1);
}

export interface Hint {
  title: string;
  text: string;
  meaning?: string;
}

export function buildHints(params: {
  validRoots: string[];
  meanings: { [root: string]: string };
}): Hint[] {
  const { validRoots, meanings } = params;
  const hints: Hint[] = [];
  if (validRoots.length === 0) return hints;

  hints.push({
    title: "عدد الجذور",
    text: `عدد الجذور الصحيحة بين الخيارات: ${validRoots.length}`,
  });

  hints.push({
    title: "الحرف الأول",
    text: `أحد الجذور الصحيحة يبدأ بحرف «${validRoots[0][0]}»`,
  });

  for (const root of validRoots) {
    if (meanings[root]) {
      hints.push({
        title: "تلميح معنى",
        text: meanings[root],
        meaning: "هذا المعنى يشير إلى أحد الجذور الصحيحة",
      });
    }
  }

  return hints;
}

export const QUTRAB_DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  easy: { nameAr: "سهل", roundsPerLevel: 5, basePoints: 10, hintCost: 0 },
  medium: { nameAr: "متوسط", roundsPerLevel: 7, basePoints: 15, hintCost: 0 },
  hard: { nameAr: "صعب", roundsPerLevel: 10, basePoints: 25, hintCost: 0 },
};

// Difficulty progression for the roots game: levels 1-3 easy, 4-6 medium, 7+ hard
export function difficultyForLevel(level: number): Difficulty {
  if (level <= 3) return "easy";
  if (level <= 6) return "medium";
  return "hard";
}

export interface RootsRoundResult {
  pointsEarned: number;
  correct: number;
  incorrect: number;
  missed: number;
  streakBonus: number;
  isPerfect: boolean;
}

export function calculateRootsRoundScore(params: {
  validRoots: string[];
  selectedRoots: Set<string>;
  basePoints: number;
  streak: number;
}): RootsRoundResult {
  const { validRoots, selectedRoots, basePoints, streak } = params;

  let correct = 0;
  let incorrect = 0;
  selectedRoots.forEach((root) => {
    if (validRoots.includes(root)) correct++;
    else incorrect++;
  });
  const missed = validRoots.length - correct;

  const correctPoints = correct * basePoints;
  const incorrectPenalty = incorrect * Math.floor(basePoints / 2);
  const missedPenalty = missed * Math.floor(basePoints / 4);
  const streakBonus = streak > 0 ? Math.floor(streak * basePoints * 0.1) : 0;

  const pointsEarned = Math.max(
    0,
    correctPoints - incorrectPenalty - missedPenalty + streakBonus
  );

  return {
    pointsEarned,
    correct,
    incorrect,
    missed,
    streakBonus,
    isPerfect: incorrect === 0 && missed === 0 && correct > 0,
  };
}

export interface QutrabRoundResult {
  pointsEarned: number;
  correct: number;
  streakBonus: number;
  isPerfect: boolean;
}

export function calculateQutrabRoundScore(params: {
  correctMatches: number;
  basePoints: number;
  streak: number;
}): QutrabRoundResult {
  const { correctMatches, basePoints, streak } = params;
  const streakBonus = streak > 0 ? Math.floor(streak * basePoints * 0.1) : 0;
  return {
    pointsEarned: correctMatches * basePoints + streakBonus,
    correct: correctMatches,
    streakBonus,
    isPerfect: correctMatches === 3,
  };
}
