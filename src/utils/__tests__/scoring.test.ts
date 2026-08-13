import {
  calculateRootsRoundScore,
  calculateQutrabRoundScore,
  difficultyForLevel,
  ROOTS_DIFFICULTY_CONFIG,
  QUTRAB_DIFFICULTY_CONFIG,
} from "../scoring";

describe("calculateRootsRoundScore", () => {
  const basePoints = 10;

  it("awards base points per correct root", () => {
    const result = calculateRootsRoundScore({
      validRoots: ["كتب", "بتك"],
      selectedRoots: new Set(["كتب", "بتك"]),
      basePoints,
      streak: 0,
    });
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(0);
    expect(result.missed).toBe(0);
    expect(result.pointsEarned).toBe(20);
    expect(result.isPerfect).toBe(true);
  });

  it("penalizes incorrect selections and missed roots", () => {
    const result = calculateRootsRoundScore({
      validRoots: ["كتب", "بتك"],
      selectedRoots: new Set(["كتب", "تبك"]),
      basePoints,
      streak: 0,
    });
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.missed).toBe(1);
    // 10 - 5 (incorrect) - 2 (missed) = 3
    expect(result.pointsEarned).toBe(3);
    expect(result.isPerfect).toBe(false);
  });

  it("never returns negative points", () => {
    const result = calculateRootsRoundScore({
      validRoots: ["كتب"],
      selectedRoots: new Set(["تبك", "بكت", "تكب"]),
      basePoints,
      streak: 0,
    });
    expect(result.pointsEarned).toBe(0);
  });

  it("adds a streak bonus proportional to the streak", () => {
    const withoutStreak = calculateRootsRoundScore({
      validRoots: ["كتب"],
      selectedRoots: new Set(["كتب"]),
      basePoints,
      streak: 0,
    });
    const withStreak = calculateRootsRoundScore({
      validRoots: ["كتب"],
      selectedRoots: new Set(["كتب"]),
      basePoints,
      streak: 5,
    });
    expect(withStreak.pointsEarned).toBe(
      withoutStreak.pointsEarned + Math.floor(5 * basePoints * 0.1)
    );
  });

  it("is not perfect when nothing correct is selected", () => {
    const result = calculateRootsRoundScore({
      validRoots: ["كتب"],
      selectedRoots: new Set<string>(),
      basePoints,
      streak: 0,
    });
    expect(result.isPerfect).toBe(false);
  });
});

describe("calculateQutrabRoundScore", () => {
  it("awards base points per correct match", () => {
    const result = calculateQutrabRoundScore({
      correctMatches: 3,
      basePoints: 10,
      streak: 0,
    });
    expect(result.pointsEarned).toBe(30);
    expect(result.isPerfect).toBe(true);
  });

  it("adds streak bonus and detects imperfect rounds", () => {
    const result = calculateQutrabRoundScore({
      correctMatches: 2,
      basePoints: 10,
      streak: 4,
    });
    expect(result.pointsEarned).toBe(20 + Math.floor(4 * 10 * 0.1));
    expect(result.isPerfect).toBe(false);
  });
});

describe("difficultyForLevel", () => {
  it("progresses easy -> medium -> hard with level", () => {
    expect(difficultyForLevel(1)).toBe("easy");
    expect(difficultyForLevel(3)).toBe("easy");
    expect(difficultyForLevel(4)).toBe("medium");
    expect(difficultyForLevel(6)).toBe("medium");
    expect(difficultyForLevel(7)).toBe("hard");
    expect(difficultyForLevel(100)).toBe("hard");
  });
});

describe("difficulty configs", () => {
  it("harder difficulties award more points", () => {
    for (const config of [ROOTS_DIFFICULTY_CONFIG, QUTRAB_DIFFICULTY_CONFIG]) {
      expect(config.easy.basePoints).toBeLessThan(config.medium.basePoints);
      expect(config.medium.basePoints).toBeLessThan(config.hard.basePoints);
    }
  });
});
