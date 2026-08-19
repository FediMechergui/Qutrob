// Unit tests for the Lisān al-ʿArab excerpt extraction (no network).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { cleanEntry, excerptOf, MAX_CHARS } = require("../enrich-lisan.js");

describe("cleanEntry", () => {
  it("strips Wikisource page markers, footnotes, bold and templates", () => {
    const raw =
      "'''الأَباءة''' لأجمة القصب <ص:24> والجمع أباء. (1 قوله «كذا» في الأصل.) {{ص}} [[تصنيف:لسان العرب]]";
    const out = cleanEntry(raw);
    expect(out).not.toMatch(/<ص:/);
    expect(out).not.toMatch(/'''/);
    expect(out).not.toMatch(/\{\{/);
    expect(out).not.toMatch(/قوله «كذا»/);
    expect(out).toContain("الأَباءة لأجمة القصب");
  });

  it("keeps verse hemistich separators readable", () => {
    expect(cleanEntry("صدر البيت*عجز البيت")).toBe("صدر البيت * عجز البيت");
  });
});

describe("excerptOf", () => {
  it("returns short entries unchanged", () => {
    expect(excerptOf("أَبَّخَه: لامه وعَذلَه.")).toBe("أَبَّخَه: لامه وعَذلَه.");
  });

  it("cuts long entries at a sentence boundary near the limit", () => {
    const sentence = "هذه جملة طويلة بعض الشيء تنتهي بنقطة.";
    const long = Array(20).fill(sentence).join(" ");
    const out = excerptOf(long);
    expect(out.length).toBeLessThanOrEqual(MAX_CHARS + 60);
    expect(out.endsWith(".") || out.endsWith("…")).toBe(true);
  });

  it("never exceeds the hard cap even for one giant sentence", () => {
    const giant = "كلمة ".repeat(200);
    const out = excerptOf(giant);
    expect(out.length).toBeLessThanOrEqual(MAX_CHARS + 1);
    expect(out.endsWith("…")).toBe(true);
  });
});
