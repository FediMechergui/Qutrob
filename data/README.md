# Data sources

These files are **inputs** to `scripts/build-data.js`; the app never imports them
directly. Run `npm run build:data` after editing any of them to regenerate
`src/data/generated/*.json`, which is what the app bundles.

| File | Role |
|------|------|
| `القطوف.json` | Main annotated root database (meaning, hint, examples, difficulty, poetry, analysis). Sheet `Feuil1` only; `Feuil2`/`Feuil3` are broken export artefacts and are ignored. |
| `ابدذر.json` | Annotated roots أ–ذ (older volume). |
| `ز الى ع.json` | Annotated roots ذ–ع (older volume). |
| `external/lisan345/lisan3.csv` | Complete triliteral root inventory of Lisān al-ʿArab (see its README). Ground truth for validity. |
| `أحسنت.json` | Educational facts shown as «هل تعلم» in success popups. Bundled as-is. |
| `win.json` | Knowledge cards (currently unused). |

The build step:

1. Normalises every root (strips spaces/tashkeel/parentheses, `هـ`→`ه`, all hamza forms → `أ`).
2. Keeps triliteral roots only (quadriliterals are counted but not yet used by the game).
3. De-duplicates the annotated entries, preferring the row with the most filled fields,
   and normalises the 7 inconsistent difficulty spellings to `easy|medium|hard`.
4. Emits:
   * `roots.json` — sorted array of every valid triliteral root (lisan345 ∪ annotated).
   * `rootEntries.json` — `{ root: { meaning, hint, examples, difficulty, successMessage, poetryExample } }`.
   * `stats.json` — counts used by tests and the README.
