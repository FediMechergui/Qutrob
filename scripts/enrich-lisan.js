#!/usr/bin/env node
/*
 * Enrichment stage: Lisān al-ʿArab excerpts from ar.wikisource.
 *
 * The Arabic Wikisource hosts Ibn Manẓūr's لسان العرب as ~99 range pages
 * ("لسان العرب/أبا-أصر" …) with one `== root ==` section per root. This script
 * downloads them through the MediaWiki API, indexes the sections by
 * normalised root, and writes a concise opening excerpt for every root that
 * has no hand-written annotation. The excerpt is the dictionary's own words —
 * sourced, public domain, no generation involved.
 *
 * Output: data/enrichment/lisan-excerpts.json  { root: { excerpt, page } }
 * Run:    npm run enrich:lisan   (re-running refreshes the cache)
 *
 * Pure Node ≥18 (global fetch), no dependencies.
 */
const fs = require("fs");
const path = require("path");
const { normalizeRoot } = require("./build-data.js");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "enrichment", "lisan-excerpts.json");
const CACHE_DIR = path.join(ROOT, "data", "enrichment", ".wikisource-cache");
const UA = "QutrobEnrich/1.0 (https://github.com/FediMechergui/Qutrob; fedimechergui03@gmail.com)";
const API = "https://ar.wikisource.org/w/api.php";
const MAX_CHARS = 280;

async function mw(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) {
    u.searchParams.set(k, v);
  }
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${u}`);
  return res.json();
}

async function listPages() {
  const titles = [];
  let cont;
  do {
    const j = await mw({
      action: "query", list: "allpages", apprefix: "لسان العرب/", apnamespace: "0",
      aplimit: "500", ...(cont ? { apcontinue: cont } : {}),
    });
    titles.push(...j.query.allpages.map((p) => p.title));
    cont = j.continue?.apcontinue;
  } while (cont);
  return titles;
}

async function fetchPage(title) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, encodeURIComponent(title) + ".txt");
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf8");
  const j = await mw({ action: "query", prop: "revisions", rvprop: "content", rvslots: "main", titles: title });
  const page = j.query.pages[0];
  const txt = page?.revisions?.[0]?.slots?.main?.content || "";
  fs.writeFileSync(cacheFile, txt, "utf8");
  return txt;
}

/** Strip wiki/OCR artefacts from a Lisān section and return plain prose. */
function cleanEntry(raw) {
  return raw
    .replace(/<ص:\d+>/g, " ")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/\(\d+\s[^)]*\)/g, " ") // editorial footnotes "(1 قوله …)"
    .replace(/@/g, "")
    .replace(/^[:;#*]+\s*/gm, "")
    .replace(/\s*\*\s*/g, " * ") // verse hemistich separator
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** First sentence(s) of an entry, cut at a sentence boundary near MAX_CHARS. */
function excerptOf(text) {
  const flat = text.replace(/\n+/g, " ").trim();
  if (!flat) return "";
  if (flat.length <= MAX_CHARS) return flat;
  const sentences = flat.split(/(?<=[.؟!])\s+/);
  let out = "";
  for (const s of sentences) {
    if (out && (out + " " + s).length > MAX_CHARS) break;
    out = out ? out + " " + s : s;
    if (out.length >= MAX_CHARS * 0.6) break;
  }
  if (out.length > MAX_CHARS + 60) {
    const cut = out.lastIndexOf(" ", MAX_CHARS);
    out = out.slice(0, cut > 80 ? cut : MAX_CHARS) + "…";
  }
  return out;
}

async function main() {
  const titles = await listPages();
  console.log(`wikisource: ${titles.length} Lisān pages`);

  const index = {}; // root → { excerpt, page }
  let sections = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const txt = await fetchPage(title);
    // Two section formats occur on Wikisource: "== root ==" headers, and
    // "@root: …" markers at the start of a line.
    const usesAt = /^@[^\s:@]{2,6}\s*:/m.test(txt);
    const parts = usesAt
      ? txt.split(/^@([^\s:@]{2,6})\s*:/m)
      : txt.split(/^==\s*([^=\n]+?)\s*==\s*$/m);
    // parts = [preamble, header1, body1, header2, body2, …]
    for (let p = 1; p < parts.length; p += 2) {
      const header = parts[p];
      const body = parts[p + 1] || "";
      const root = normalizeRoot(header);
      if (root.length < 2 || root.length > 5) continue;
      sections++;
      if (index[root]) continue; // keep the first occurrence
      const excerpt = excerptOf(cleanEntry(body));
      if (excerpt.length < 20) continue;
      index[root] = { excerpt, page: title };
    }
    process.stdout.write(`\r  ${i + 1}/${titles.length} pages, ${Object.keys(index).length} roots indexed`);
    await new Promise((r) => setTimeout(r, 150)); // be polite
  }
  console.log(`\nindexed ${Object.keys(index).length} roots from ${sections} sections`);

  // Keep only roots the game can use (triliteral) and sort for a stable diff
  const sorted = Object.fromEntries(
    Object.entries(index).filter(([r]) => r.length === 3).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 0), "utf8");
  console.log(`wrote ${Object.keys(sorted).length} triliteral excerpts → ${path.relative(ROOT, OUT)}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { cleanEntry, excerptOf, MAX_CHARS };
