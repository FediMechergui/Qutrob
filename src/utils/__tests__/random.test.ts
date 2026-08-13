import { shuffle, pickRandom } from "../random";

describe("shuffle", () => {
  it("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input);
    expect([...result].sort()).toEqual([...input].sort());
    expect(input).toEqual([1, 2, 3, 4, 5]); // input not mutated
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces different orderings (statistically)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const orderings = new Set<string>();
    for (let i = 0; i < 50; i++) {
      orderings.add(shuffle(input).join(","));
    }
    // 50 shuffles of 8 elements yielding a single ordering is ~impossible
    expect(orderings.size).toBeGreaterThan(1);
  });
});

describe("pickRandom", () => {
  it("returns undefined for empty arrays", () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it("returns an element of the array", () => {
    const input = ["a", "b", "c"];
    for (let i = 0; i < 20; i++) {
      expect(input).toContain(pickRandom(input));
    }
  });
});
