#!/usr/bin/env node
/*
 * Data build pipeline.
 *
 * Reads the raw annotated root files in ./data plus the lisan345 root inventory,
 * cleans and merges them, and writes the compact JSON the app bundles into
 * ./src/data/generated. Run with `npm run build:data`.
 *
 * Pure Node, no dependencies — keep it that way so it runs anywhere.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(ROOT, "src", "data", "generated");

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const TASHKEEL = /[ً-ْٰـ]/g; // harakat, shadda, sukun, dagger alif, tatweel
const PARENS = /\([^)]*\)|\)|\(/g;

/** Normalise a root string to its bare 3-letter key. */
function normalizeRoot(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(PARENS, "")
    .replace(TASHKEEL, "")
    .replace(/\s+/g, "")
    .replace(/هـ/g, "ه")
    .replace(/[إآءؤئ]/g, "أ")
    .replace(/ٱ/g, "ا")
    .trim();
}

/** Map the many spellings of difficulty labels to a canonical value. */
function normalizeDifficulty(label) {
  const s = (label || "").toString();
  if (s.includes("سهل") || s.includes("🟢")) return "easy";
  if (s.includes("متوسط") || s.includes("🟡")) return "medium";
  if (s.includes("صعب") || s.includes("🔴")) return "hard";
  return null;
}

function clean(s) {
  if (s === undefined || s === null) return "";
  const t = String(s).trim();
  return t === "-" ? "" : t;
}

// ---------------------------------------------------------------------------
// Load sources
// ---------------------------------------------------------------------------

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

function loadLisanRoots() {
  const csv = fs
    .readFileSync(path.join(DATA, "external", "lisan345", "lisan3.csv"), "utf8")
    .replace(/^﻿/, "");
  const roots = new Set();
  csv
    .split(/\r?\n/)
    .slice(1)
    .forEach((line) => {
      const root = normalizeRoot(line.split(",")[0]);
      if (root.length === 3) roots.add(root);
    });
  return roots;
}

/**
 * Convert one raw annotated row to a canonical entry. Different source files
 * use slightly different column names for the success message.
 */
function toEntry(row) {
  const meaning = clean(row["الشرح المختصر"]) || clean(row["التحليل النهائي"]);
  return {
    meaning,
    hint: clean(row["التلميح"]) || meaning,
    examples: clean(row["أمثلة توضيحية"]),
    difficulty: normalizeDifficulty(row["المستوى"]),
    successMessage:
      clean(row["التحليل النهائي"]) ||
      clean(row["أحسنت! "]) ||
      clean(row["أحسنت!"]) ||
      "",
    poetryExample: clean(row["الأمثلة الشعرية"]),
  };
}

/**
 * Reconcile an annotated root with the Lisān inventory.
 *
 * Lisān al-ʿArab lists weak roots under their etymological radical (بكو, غنو,
 * فوت) whereas the annotated files sometimes use the surface spelling
 * (بكي/بكى, غنى, فات). Returns the canonical key, plus whether the original
 * spelling should remain a valid alias:
 *   - bare alif (فات) and alif maqsura (بكى) are orthographic, never radicals → no alias
 *   - a genuine ي/و final- or middle-radical variant (بكي ↔ بكو) → keep alias
 * Returns null when no Lisān counterpart exists (treated as noise).
 */
function canonicalize(root, lisan) {
  if (lisan.has(root)) return { key: root, alias: null };

  const tries = [];
  if (root.includes("ا")) {
    tries.push({ key: root.replace("ا", "و"), alias: false });
    tries.push({ key: root.replace("ا", "ي"), alias: false });
  }
  if (root.endsWith("ى")) {
    tries.push({ key: root.slice(0, 2) + "ي", alias: false });
    tries.push({ key: root.slice(0, 2) + "و", alias: false });
  }
  if (root.endsWith("ي")) tries.push({ key: root.slice(0, 2) + "و", alias: true });
  if (root.endsWith("و")) tries.push({ key: root.slice(0, 2) + "ي", alias: true });
  if (root[1] === "ي") tries.push({ key: root[0] + "و" + root[2], alias: true });
  if (root[1] === "و") tries.push({ key: root[0] + "ي" + root[2], alias: true });

  for (const t of tries) {
    if (lisan.has(t.key)) return { key: t.key, alias: t.alias ? root : null };
  }
  return null;
}

/** Richness score used to pick the best row when a root is duplicated. */
function richness(entry) {
  let score = 0;
  if (entry.meaning) score += 3;
  if (entry.successMessage) score += 3;
  if (entry.poetryExample) score += 2;
  if (entry.examples) score += 1;
  if (entry.hint) score += 1;
  if (entry.difficulty) score += 1;
  return score;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  const sources = [
    { name: "القطوف.json", rows: loadJson("القطوف.json").Feuil1 || [] },
    { name: "ابدذر.json", rows: loadJson("ابدذر.json").Feuil1 || [] },
    { name: "ز الى ع.json", rows: loadJson("ز الى ع.json").Feuil1 || [] },
  ];

  const lisan = loadLisanRoots();
  const entries = {};
  const aliases = {};
  const droppedRoots = new Set();
  const stats = {
    sources: {},
    duplicatesResolved: 0,
    conflictingDifficulty: 0,
    nonTriliteralSkipped: 0,
    invalidRowsSkipped: 0,
    rekeyedToLisanForm: 0,
    droppedNotInLisan: 0,
  };

  for (const { name, rows } of sources) {
    let used = 0;
    for (const row of rows) {
      if (!row || typeof row !== "object" || !row["الجذر"]) {
        stats.invalidRowsSkipped++;
        continue;
      }
      const rawRoot = normalizeRoot(row["الجذر"]);
      if (rawRoot.length !== 3) {
        stats.nonTriliteralSkipped++;
        continue;
      }
      const canon = canonicalize(rawRoot, lisan);
      if (!canon) {
        droppedRoots.add(rawRoot);
        continue;
      }
      const root = canon.key;
      if (root !== rawRoot) stats.rekeyedToLisanForm++;
      if (canon.alias) aliases[canon.alias] = root;
      const entry = toEntry(row);
      const existing = entries[root];
      if (!existing) {
        entries[root] = entry;
        used++;
        continue;
      }
      stats.duplicatesResolved++;
      if (
        existing.difficulty &&
        entry.difficulty &&
        existing.difficulty !== entry.difficulty
      ) {
        stats.conflictingDifficulty++;
      }
      // Keep the richer row, but fill any holes from the other one.
      const [keep, other] =
        richness(entry) > richness(existing) ? [entry, existing] : [existing, entry];
      for (const k of Object.keys(keep)) {
        if (!keep[k] && other[k]) keep[k] = other[k];
      }
      entries[root] = keep;
    }
    stats.sources[name] = { rows: rows.length, newRoots: used };
  }

  // Roots lacking a difficulty label default to medium.
  let defaultedDifficulty = 0;
  for (const e of Object.values(entries)) {
    if (!e.difficulty) {
      e.difficulty = "medium";
      defaultedDifficulty++;
    }
  }
  stats.defaultedDifficulty = defaultedDifficulty;

  // Valid root universe = lisan345 ∪ reconciled annotated roots ∪ ي/و aliases.
  const annotated = new Set(Object.keys(entries));
  const roots = [
    ...new Set([...lisan, ...annotated, ...Object.keys(aliases)]),
  ].sort();

  stats.droppedNotInLisan = droppedRoots.size;
  stats.droppedSample = [...droppedRoots].slice(0, 30);
  stats.aliases = Object.keys(aliases).length;
  stats.lisanRoots = lisan.size;
  stats.annotatedRoots = annotated.size;
  stats.lisanOnly = [...lisan].filter((r) => !annotated.has(r)).length;
  stats.totalRoots = roots.length;
  stats.byDifficulty = { easy: 0, medium: 0, hard: 0 };
  for (const e of Object.values(entries)) stats.byDifficulty[e.difficulty]++;
  stats.withPoetry = Object.values(entries).filter((e) => e.poetryExample).length;

  const byFirstLetter = {};
  for (const r of roots) byFirstLetter[r[0]] = (byFirstLetter[r[0]] || 0) + 1;
  stats.byFirstLetter = byFirstLetter;

  // ---------------------------------------------------------------------------
  // Write outputs
  // ---------------------------------------------------------------------------
  fs.mkdirSync(OUT, { recursive: true });
  const write = (name, obj) =>
    fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj), "utf8");

  write("roots.json", roots);
  write("rootEntries.json", entries);
  write("rootAliases.json", aliases);
  write("stats.json", stats);

  return stats;
}

if (require.main === module) {
  const stats = build();
  const { byFirstLetter, ...summary } = stats;
  console.log(JSON.stringify(summary, null, 2));
  console.log(
    "first-letter coverage:",
    Object.entries(byFirstLetter)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(" ")
  );
}

module.exports = { build, normalizeRoot, normalizeDifficulty };
