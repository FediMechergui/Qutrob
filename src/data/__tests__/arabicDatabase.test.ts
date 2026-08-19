import {
  VALID_ARABIC_ROOTS,
  VALID_ROOTS_SET,
  LISAN_ONLY_ROOTS,
  ROOTS_BY_DIFFICULTY,
  isValidRoot,
  getRootInfo,
  canonicalRoot,
  normalizeRoot,
  hasAnnotation,
  generateAllPermutations,
  findValidRoots,
  getRandomLetters,
  getLettersWithValidRoots,
  ARABIC_LETTERS,
} from "../arabicDatabase";
import stats from "../generated/stats.json";

const RADICAL = /^[أبتثجحخدذرزسشصضطظعغفقكلمنهوي]{3}$/;

describe("roots universe (Lisān ∪ annotated)", () => {
  it("loads the full Lisān al-ʿArab triliteral inventory", () => {
    // lisan345 ships 6,529 triliteral roots; we must have at least those
    expect(VALID_ROOTS_SET.size).toBeGreaterThanOrEqual(6529);
    expect((stats as any).lisanRoots).toBe(6529);
  });

  it("keeps a substantial annotated layer on top", () => {
    expect(Object.keys(VALID_ARABIC_ROOTS).length).toBeGreaterThan(3000);
    expect(LISAN_ONLY_ROOTS.length).toBeGreaterThan(2000);
  });

  it("every root is exactly three radicals (no bare alif, no tashkeel, no spaces)", () => {
    for (const root of VALID_ROOTS_SET) {
      expect(root).toMatch(RADICAL);
    }
  });

  it("validates common roots that the old hand-written files were missing", () => {
    // Previously marked WRONG: فهم فكر فرح فعل فقد جمع فرق بحث
    for (const root of ["فهم", "فكر", "فرح", "فعل", "فقد", "جمع", "فرق", "بحث"]) {
      expect(isValidRoot(root)).toBe(true);
    }
  });

  it("covers every letter as first radical with real breadth", () => {
    const byFirst: Record<string, number> = {};
    for (const r of VALID_ROOTS_SET) byFirst[r[0]] = (byFirst[r[0]] || 0) + 1;
    for (const letter of ARABIC_LETTERS) {
      expect(byFirst[letter] || 0).toBeGreaterThanOrEqual(30);
    }
    // ف was the glaring hole (4 roots); now hundreds
    expect(byFirst["ف"]).toBeGreaterThan(200);
  });

  it("rejects garbage", () => {
    expect(isValidRoot("قققق")).toBe(false);
    expect(isValidRoot("")).toBe(false);
    expect(isValidRoot("ابج")).toBe(false); // bare alif is not a radical
  });

  it("assigns a valid difficulty to every annotated root", () => {
    for (const info of Object.values(VALID_ARABIC_ROOTS)) {
      expect(["easy", "medium", "hard"]).toContain(info.difficulty);
    }
    expect(ROOTS_BY_DIFFICULTY.easy.length).toBeGreaterThan(500);
    expect(ROOTS_BY_DIFFICULTY.medium.length).toBeGreaterThan(500);
    expect(ROOTS_BY_DIFFICULTY.hard.length).toBeGreaterThan(500);
  });
});

describe("normalisation & aliases", () => {
  it("normalizeRoot strips spaces, tashkeel, parentheses and unifies hamza", () => {
    expect(normalizeRoot("أ ب د")).toBe("أبد");
    expect(normalizeRoot("د وَر")).toBe("دور");
    expect(normalizeRoot("أ ب (أبوة)")).toBe("أب");
    expect(normalizeRoot("س و ء")).toBe("سوأ");
    expect(normalizeRoot("هـ د ي")).toBe("هدي");
  });

  it("resolves ي/و spelling aliases to the Lisān key and treats both as valid", () => {
    // Lisān lists defective roots under their etymological radical (بكو);
    // the annotated files used بكي. Both must be accepted.
    expect(isValidRoot("بكو")).toBe(true);
    expect(isValidRoot("بكي")).toBe(true);
    expect(canonicalRoot("بكي")).toBe("بكو");
    expect(getRootInfo("بكي")).toEqual(getRootInfo("بكو"));
  });
});

describe("getRootInfo", () => {
  it("returns a full annotation for annotated roots", () => {
    const info = getRootInfo("أبد");
    expect(info).not.toBeNull();
    expect(info!.successMessage.length).toBeGreaterThan(0);
    expect(info!.isLisanOnly).toBeFalsy();
    expect(hasAnnotation("أبد")).toBe(true);
  });

  it("returns an honest minimal entry for Lisān-only roots (never invents a meaning)", () => {
    const root = LISAN_ONLY_ROOTS[0];
    const info = getRootInfo(root);
    expect(info).not.toBeNull();
    expect(info!.isLisanOnly).toBe(true);
    expect(info!.meaning).toBe("");
    expect(info!.successMessage).toContain("لسان العرب");
    expect(hasAnnotation(root)).toBe(false);
  });

  it("returns null for invalid roots", () => {
    expect(getRootInfo("قققق")).toBeNull();
  });
});

describe("generateAllPermutations", () => {
  it("generates exactly 6 distinct permutations for distinct letters", () => {
    const perms = generateAllPermutations(["ك", "ت", "ب"]);
    expect(perms).toHaveLength(6);
    expect(new Set(perms).size).toBe(6);
    expect(perms).toContain("كتب");
    expect(perms).toContain("بتك");
  });

  it("de-duplicates permutations for roots with a repeated letter (grid bug)", () => {
    // أبب → only 3 distinct arrangements; previously shown as 6 with duplicates
    expect(generateAllPermutations(["أ", "ب", "ب"]).sort()).toEqual(
      ["أبب", "بأب", "ببأ"].sort()
    );
    expect(generateAllPermutations(["د", "د", "د"])).toEqual(["ددد"]);
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
    expect(valid.length).toBeGreaterThan(0);
    for (const root of valid) {
      expect(perms).toContain(root);
      expect(isValidRoot(root)).toBe(true);
    }
  });
});

describe("letter generation", () => {
  it("getRandomLetters returns 3 distinct radical letters (never bare alif)", () => {
    for (let i = 0; i < 30; i++) {
      const letters = getRandomLetters();
      expect(letters).toHaveLength(3);
      expect(new Set(letters).size).toBe(3);
      for (const letter of letters) {
        expect(ARABIC_LETTERS).toContain(letter);
        expect(letter).not.toBe("ا");
      }
    }
  });

  it("getLettersWithValidRoots yields letters with at least one valid root", () => {
    const letters = getLettersWithValidRoots("easy", 1, 6);
    expect(letters).not.toBeNull();
    expect(findValidRoots(letters!).length).toBeGreaterThanOrEqual(1);
  });
});
