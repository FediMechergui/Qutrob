// Guards the data pipeline itself: normalisation rules and that the committed
// generated files are in sync with the build script.
import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build, normalizeRoot, normalizeDifficulty } = require("../build-data.js");

describe("normalizeRoot", () => {
  it("strips spaces, tashkeel, tatweel and parentheses", () => {
    expect(normalizeRoot("أ ب د")).toBe("أبد");
    expect(normalizeRoot("د وَر")).toBe("دور");
    expect(normalizeRoot("أ ب (أبوة)")).toBe("أب");
    expect(normalizeRoot("ر ن ـا")).toBe("رنا");
  });

  it("unifies hamza forms and هـ", () => {
    expect(normalizeRoot("س و ء")).toBe("سوأ");
    expect(normalizeRoot("إ ب ل")).toBe("أبل");
    expect(normalizeRoot("ق ر آ")).toBe("قرأ");
    expect(normalizeRoot("هـ د ي")).toBe("هدي");
  });

  it("handles garbage input", () => {
    expect(normalizeRoot(undefined)).toBe("");
    expect(normalizeRoot(null)).toBe("");
    expect(normalizeRoot(42)).toBe("");
  });
});

describe("normalizeDifficulty", () => {
  it("maps every observed spelling to a canonical tier", () => {
    expect(normalizeDifficulty("🟢 سهل")).toBe("easy");
    expect(normalizeDifficulty("سهل")).toBe("easy");
    expect(normalizeDifficulty("🟡 متوسط")).toBe("medium");
    expect(normalizeDifficulty("🔴 صعب")).toBe("hard");
    expect(normalizeDifficulty("🔴  صعب")).toBe("hard");
    expect(normalizeDifficulty("🢂")).toBeNull();
    expect(normalizeDifficulty(undefined)).toBeNull();
  });
});

describe("generated data is in sync with the build", () => {
  it("re-running the build reproduces the committed outputs", () => {
    const outDir = path.resolve(__dirname, "..", "..", "src", "data", "generated");
    const before = {
      roots: fs.readFileSync(path.join(outDir, "roots.json"), "utf8"),
      entries: fs.readFileSync(path.join(outDir, "rootEntries.json"), "utf8"),
      aliases: fs.readFileSync(path.join(outDir, "rootAliases.json"), "utf8"),
      excerpts: fs.readFileSync(path.join(outDir, "lisanExcerpts.json"), "utf8"),
    };
    build();
    const after = {
      roots: fs.readFileSync(path.join(outDir, "roots.json"), "utf8"),
      entries: fs.readFileSync(path.join(outDir, "rootEntries.json"), "utf8"),
      aliases: fs.readFileSync(path.join(outDir, "rootAliases.json"), "utf8"),
      excerpts: fs.readFileSync(path.join(outDir, "lisanExcerpts.json"), "utf8"),
    };
    expect(after).toEqual(before);
  });
});
