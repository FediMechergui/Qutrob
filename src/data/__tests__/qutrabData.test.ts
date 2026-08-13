import {
  QUTRAB_TRIANGLES,
  generateQutrabRound,
  getTrianglesByDifficulty,
} from "../qutrabData";

describe("QUTRAB_TRIANGLES data", () => {
  it("has unique ids", () => {
    const ids = QUTRAB_TRIANGLES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every triangle has all three vocalizations with meanings", () => {
    for (const t of QUTRAB_TRIANGLES) {
      for (const key of ["fatha", "damma", "kasra"] as const) {
        expect(t[key].word.length).toBeGreaterThan(0);
        expect(t[key].meaning.length).toBeGreaterThan(0);
      }
    }
  });

  it("filters by difficulty", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const triangles = getTrianglesByDifficulty(difficulty);
      expect(triangles.length).toBeGreaterThan(0);
      for (const t of triangles) {
        expect(t.difficulty).toBe(difficulty);
      }
    }
  });
});

describe("generateQutrabRound", () => {
  it("returns a triangle with shuffled words and meanings for all 3 harakat", () => {
    const round = generateQutrabRound();
    const wordKeys = round.words.map((w) => w.key).sort();
    const meaningKeys = round.meanings.map((m) => m.key).sort();
    expect(wordKeys).toEqual(["damma", "fatha", "kasra"]);
    expect(meaningKeys).toEqual(["damma", "fatha", "kasra"]);
  });

  it("excludes already-used triangles", () => {
    const used = new Set<number>();
    // Draw every triangle once; no repeats should occur
    for (let i = 0; i < QUTRAB_TRIANGLES.length; i++) {
      const round = generateQutrabRound(undefined, used);
      expect(used.has(round.triangle.id)).toBe(false);
      used.add(round.triangle.id);
    }
    expect(used.size).toBe(QUTRAB_TRIANGLES.length);
  });

  it("resets gracefully when all triangles are used", () => {
    const used = new Set<number>(QUTRAB_TRIANGLES.map((t) => t.id));
    const round = generateQutrabRound(undefined, used);
    expect(round.triangle).toBeDefined();
  });
});
