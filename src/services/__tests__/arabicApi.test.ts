import {
  generateRoundData,
  ARABIC_PROVERBS,
  getDatabaseStats,
} from "../arabicApi";
import {
  isValidRoot,
  hasAnnotation,
  getLisanExcerpt,
  LISAN_ONLY_ROOTS,
  ROOTS_BY_DIFFICULTY,
} from "../../data/arabicDatabase";

describe("generateRoundData", () => {
  it("produces a well-formed round", () => {
    const round = generateRoundData("easy");

    expect(round.letters).toHaveLength(3);
    expect(round.permutations.length).toBeGreaterThanOrEqual(1);
    expect(round.permutations.length).toBeLessThanOrEqual(6);
    expect(round.validRoots.length).toBeGreaterThanOrEqual(1);
    expect(round.usedKey).toHaveLength(3);
    expect(round.validRoots).toContain(round.usedKey);

    // Every valid root must be offered as an option
    for (const root of round.validRoots) {
      expect(round.permutations).toContain(root);
    }
  });

  it("never offers the same option twice (repeated-letter roots)", () => {
    for (let i = 0; i < 200; i++) {
      const round = generateRoundData("hard");
      expect(new Set(round.permutations).size).toBe(round.permutations.length);
    }
  });

  it("marks only real roots as valid, and marks every valid permutation", () => {
    for (let i = 0; i < 50; i++) {
      const round = generateRoundData("medium");
      for (const p of round.permutations) {
        expect(round.validRoots.includes(p)).toBe(isValidRoot(p));
      }
    }
  });

  it("easy rounds come from annotated easy roots (difficulty drives selection)", () => {
    const easy = new Set(ROOTS_BY_DIFFICULTY.easy);
    for (let i = 0; i < 30; i++) {
      const round = generateRoundData("easy");
      expect(easy.has(round.usedKey)).toBe(true);
      expect(round.hasExplanation).toBe(true);
      expect(round.difficulty).toBe("easy");
    }
  });

  it("hard rounds reach rarer Lisān-only roots once annotated hard roots are used", () => {
    const used = new Set<string>(ROOTS_BY_DIFFICULTY.hard);
    const lisanOnly = new Set(LISAN_ONLY_ROOTS);
    const round = generateRoundData("hard", used);
    expect(lisanOnly.has(round.usedKey)).toBe(true);
    expect(hasAnnotation(round.usedKey)).toBe(false);
    // hasExplanation is true exactly when Lisān's own text is available
    expect(round.hasExplanation).toBe(!!getLisanExcerpt(round.usedKey));
    // Validity is still asserted, and the message cites Lisān
    expect(round.validRoots).toContain(round.usedKey);
    expect(round.successMessages[round.usedKey]).toContain("لسان العرب");
  });

  it("provides an explanation for annotated source roots", () => {
    for (let i = 0; i < 20; i++) {
      const round = generateRoundData("medium");
      if (hasAnnotation(round.usedKey)) {
        const hasContent =
          (round.meanings[round.usedKey] || "").length > 0 ||
          (round.successMessages[round.usedKey] || "").length > 0;
        expect(hasContent).toBe(true);
      }
    }
  });

  it("does not repeat used roots", () => {
    const used = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const round = generateRoundData("easy", used);
      expect(used.has(round.usedKey)).toBe(false);
      used.add(round.usedKey);
    }
  });

  it("recovers gracefully when every root has been used", () => {
    const everything = new Set<string>([
      ...ROOTS_BY_DIFFICULTY.easy,
      ...ROOTS_BY_DIFFICULTY.medium,
      ...ROOTS_BY_DIFFICULTY.hard,
      ...LISAN_ONLY_ROOTS,
    ]);
    const round = generateRoundData("easy", everything);
    expect(round.validRoots.length).toBeGreaterThanOrEqual(1);
  });
});

describe("ARABIC_PROVERBS", () => {
  it("are real proverbs, not fact titles", () => {
    expect(ARABIC_PROVERBS.length).toBeGreaterThanOrEqual(10);
    for (const proverb of ARABIC_PROVERBS) {
      expect(proverb.text.length).toBeGreaterThan(0);
      expect(proverb.meaning.length).toBeGreaterThan(0);
    }
    // The old bug surfaced أحسنت.json titles such as this one as "proverbs"
    expect(ARABIC_PROVERBS.map((p) => p.text)).not.toContain("المسواك في الإسلام");
  });
});

describe("getDatabaseStats", () => {
  it("reports the merged universe", () => {
    const s = getDatabaseStats();
    expect(s.totalRoots).toBeGreaterThanOrEqual(6529);
    expect(s.annotatedRoots + s.lisanOnlyRoots).toBeLessThanOrEqual(s.totalRoots);
  });
});
