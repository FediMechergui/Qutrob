import {
  QUTRAB_TRIANGLES,
  generateQutrabRound,
  getTrianglesByDifficulty,
} from "../qutrabData";

const HARAKAT = ["fatha", "damma", "kasra"] as const;
const TASHKEEL = /[ً-ْ]/;

describe("QUTRAB_TRIANGLES data", () => {
  it("has a meaningful corpus (canonical Qutrub + classics)", () => {
    expect(QUTRAB_TRIANGLES.length).toBeGreaterThanOrEqual(30);
    expect(QUTRAB_TRIANGLES.filter((t) => t.source === "qutrub").length).toBeGreaterThanOrEqual(20);
  });

  it("has unique ids and unique base words", () => {
    const ids = QUTRAB_TRIANGLES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bases = QUTRAB_TRIANGLES.map((t) => t.base);
    expect(new Set(bases).size).toBe(bases.length);
  });

  it("every triangle has three vocalised, distinct words with meanings", () => {
    for (const t of QUTRAB_TRIANGLES) {
      const words = HARAKAT.map((k) => t[k].word);
      expect(new Set(words).size).toBe(3);
      for (const key of HARAKAT) {
        expect(t[key].word).toMatch(TASHKEEL); // actually vocalised
        expect(t[key].meaning.length).toBeGreaterThan(0);
      }
    }
  });

  it("the first letter carries the haraka the key claims", () => {
    const mark = { fatha: "َ", damma: "ُ", kasra: "ِ" };
    for (const t of QUTRAB_TRIANGLES) {
      for (const key of HARAKAT) {
        const w = t[key].word;
        // first radical then optional shadda then the haraka
        const afterFirst = w.slice(1, 3);
        expect(afterFirst).toContain(mark[key]);
      }
    }
  });

  it("canonical triangles carry their verse from نظم مثلث قطرب", () => {
    for (const t of QUTRAB_TRIANGLES.filter((t) => t.source === "qutrub")) {
      expect((t.verse || "").length).toBeGreaterThan(10);
    }
  });

  it("every difficulty tier is populated", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const triangles = getTrianglesByDifficulty(difficulty);
      expect(triangles.length).toBeGreaterThanOrEqual(5);
      for (const t of triangles) expect(t.difficulty).toBe(difficulty);
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

  it("prefers the requested difficulty tier while it has unused triangles", () => {
    const used = new Set<number>();
    const easyCount = getTrianglesByDifficulty("easy").length;
    for (let i = 0; i < easyCount; i++) {
      const round = generateQutrabRound("easy", used);
      expect(round.triangle.difficulty).toBe("easy");
      used.add(round.triangle.id);
    }
    // Tier exhausted → falls back to the next tier rather than repeating
    const next = generateQutrabRound("easy", used);
    expect(used.has(next.triangle.id)).toBe(false);
    expect(next.triangle.difficulty).toBe("medium");
  });

  it("excludes already-used triangles until all are used", () => {
    const used = new Set<number>();
    for (let i = 0; i < QUTRAB_TRIANGLES.length; i++) {
      const round = generateQutrabRound(undefined, used);
      expect(used.has(round.triangle.id)).toBe(false);
      used.add(round.triangle.id);
    }
    expect(used.size).toBe(QUTRAB_TRIANGLES.length);
  });

  it("resets gracefully when all triangles are used", () => {
    const used = new Set<number>(QUTRAB_TRIANGLES.map((t) => t.id));
    const round = generateQutrabRound("hard", used);
    expect(round.triangle).toBeDefined();
  });
});
