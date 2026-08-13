import {
  VALID_ARABIC_ROOTS,
  isValidRoot,
  getRootInfo,
  generateAllPermutations,
  findValidRoots,
  getRandomLetters,
  getLettersWithValidRoots,
  ARABIC_LETTERS,
} from "../arabicDatabase";

describe("roots database construction", () => {
  it("builds a non-trivial database from the JSON sources", () => {
    expect(Object.keys(VALID_ARABIC_ROOTS).length).toBeGreaterThan(1000);
  });

  it("normalizes every root to exactly 3 letters", () => {
    for (const root of Object.keys(VALID_ARABIC_ROOTS)) {
      expect(root).toHaveLength(3);
      expect(root).not.toMatch(/\s/);
    }
  });

  it("assigns a valid difficulty to every root", () => {
    for (const info of Object.values(VALID_ARABIC_ROOTS)) {
      expect(["easy", "medium", "hard"]).toContain(info.difficulty);
    }
  });

  it("validates known roots and rejects garbage", () => {
    // أبد (eternity) exists in all three source files
    expect(isValidRoot("أبد")).toBe(true);
    expect(isValidRoot("ذأب")).toBe(true);
    expect(isValidRoot("قققق")).toBe(false);
    expect(isValidRoot("")).toBe(false);
  });

  it("returns info with a success message for valid roots", () => {
    const info = getRootInfo("أبد");
    expect(info).not.toBeNull();
    expect(info!.successMessage.length).toBeGreaterThan(0);
  });
});

describe("generateAllPermutations", () => {
  it("generates exactly 6 permutations for distinct letters", () => {
    const perms = generateAllPermutations(["ك", "ت", "ب"]);
    expect(perms).toHaveLength(6);
    expect(new Set(perms).size).toBe(6);
    expect(perms).toContain("كتب");
    expect(perms).toContain("بتك");
  });

  it("every permutation uses exactly the input letters", () => {
    const letters: [string, string, string] = ["س", "م", "ع"];
    for (const perm of generateAllPermutations(letters)) {
      expect(perm).toHaveLength(3);
      expect([...perm].sort()).toEqual([...letters].sort());
    }
  });
});

describe("findValidRoots", () => {
  it("only returns roots that are valid permutations", () => {
    const letters: [string, string, string] = ["ك", "ت", "ب"];
    const valid = findValidRoots(letters);
    const perms = generateAllPermutations(letters);
    for (const root of valid) {
      expect(perms).toContain(root);
      expect(isValidRoot(root)).toBe(true);
    }
  });
});

describe("letter generation", () => {
  it("getRandomLetters returns 3 distinct Arabic letters", () => {
    for (let i = 0; i < 20; i++) {
      const letters = getRandomLetters();
      expect(letters).toHaveLength(3);
      expect(new Set(letters).size).toBe(3);
      for (const letter of letters) {
        expect(ARABIC_LETTERS).toContain(letter);
      }
    }
  });

  it("getLettersWithValidRoots yields letters with at least one valid root", () => {
    const letters = getLettersWithValidRoots("easy", 1, 6);
    expect(letters).not.toBeNull();
    // The fallback path can rarely return letters outside constraints, but
    // the letters always come from a real root, so validity holds.
    expect(findValidRoots(letters!).length).toBeGreaterThanOrEqual(1);
  });
});
