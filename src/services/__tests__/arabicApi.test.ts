import { generateRoundData, ARABIC_PROVERBS } from "../arabicApi";
import { isValidRoot } from "../../data/arabicDatabase";

describe("generateRoundData", () => {
  it("produces a well-formed round", () => {
    const round = generateRoundData("easy");

    expect(round.letters).toHaveLength(3);
    expect(round.permutations.length).toBeGreaterThanOrEqual(1);
    expect(round.permutations.length).toBeLessThanOrEqual(6);
    expect(round.validRoots.length).toBeGreaterThanOrEqual(1);
    expect(round.usedKey.length).toBeGreaterThan(0);

    // Every valid root must be offered as an option
    for (const root of round.validRoots) {
      expect(round.permutations).toContain(root);
    }
  });

  it("marks only real roots as valid", () => {
    for (let i = 0; i < 10; i++) {
      const round = generateRoundData("medium");
      for (const root of round.validRoots) {
        expect(isValidRoot(root)).toBe(true);
      }
    }
  });

  it("provides a meaning or success message for the primary root", () => {
    for (let i = 0; i < 5; i++) {
      const round = generateRoundData("easy");
      const primary = round.usedKey;
      if (round.validRoots.includes(primary)) {
        const hasContent =
          (round.meanings[primary] || "").length > 0 ||
          (round.successMessages[primary] || "").length > 0;
        expect(hasContent).toBe(true);
      }
    }
  });

  it("does not repeat used roots", () => {
    const used = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const round = generateRoundData("easy", used);
      expect(used.has(round.usedKey)).toBe(false);
      used.add(round.usedKey);
    }
  });
});

describe("ARABIC_PROVERBS", () => {
  it("provides at least 5 proverbs with text", () => {
    expect(ARABIC_PROVERBS.length).toBeGreaterThanOrEqual(5);
    for (const proverb of ARABIC_PROVERBS) {
      expect(proverb.text.length).toBeGreaterThan(0);
    }
  });
});
