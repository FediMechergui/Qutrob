import {
  buildHints,
  hintCost,
  spinCost,
  FREE_SPINS_PER_ROUND,
  ROOTS_DIFFICULTY_CONFIG,
} from "../scoring";

describe("buildHints", () => {
  it("is progressive: count → first letter → meanings", () => {
    const hints = buildHints({
      validRoots: ["كتب", "بتك"],
      meanings: { كتب: "الكتابة", بتك: "القطع" },
    });
    expect(hints[0].title).toBe("عدد الجذور");
    expect(hints[0].text).toContain("2");
    expect(hints[1].title).toBe("الحرف الأول");
    expect(hints[1].text).toContain("ك");
    expect(hints.slice(2).map((h) => h.title)).toEqual(["تلميح معنى", "تلميح معنى"]);
  });

  it("omits meaning hints for roots without an annotation", () => {
    const hints = buildHints({ validRoots: ["قطو"], meanings: {} });
    expect(hints).toHaveLength(2);
  });

  it("returns nothing for rounds with no valid roots", () => {
    expect(buildHints({ validRoots: [], meanings: {} })).toEqual([]);
  });
});

describe("hint and spin costs", () => {
  it("hint cost scales with difficulty and escalates per hint", () => {
    const easy = ROOTS_DIFFICULTY_CONFIG.easy;
    const hard = ROOTS_DIFFICULTY_CONFIG.hard;
    expect(hintCost(0, easy)).toBe(easy.hintCost);
    expect(hintCost(1, easy)).toBe(easy.hintCost * 2);
    expect(hintCost(0, hard)).toBeGreaterThan(hintCost(0, easy));
  });

  it("the first spin per round is free, later spins cost points", () => {
    const cfg = ROOTS_DIFFICULTY_CONFIG.medium;
    expect(FREE_SPINS_PER_ROUND).toBeGreaterThanOrEqual(1);
    expect(spinCost(0, cfg)).toBe(0);
    expect(spinCost(FREE_SPINS_PER_ROUND, cfg)).toBe(cfg.hintCost);
  });
});
