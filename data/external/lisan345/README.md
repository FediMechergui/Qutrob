# lisan345 — Lisān al-ʿArab root inventory

`lisan3.csv` is vendored unchanged from the open **lisan345** dataset:

> Elmaz, Orhan. 2026. *Lisan345*. http://github.com/git85hub/lisan345

It lists every **triliteral root (6,529)** attested in Ibn Manẓūr's *Lisān al-ʿArab*
(digitised edition at https://alwaraq.net/book-view/89), with the root in Arabic
(`LAB_ar`), a transliteration, and per-consonant phonetic coding.

The game uses only the `LAB_ar` column as the **ground truth for root validity**:
a permutation of three letters is a real root if and only if it appears here
(or in the project's own annotated entries). This replaces the earlier approach
of treating "not in our hand-written files" as "not a root", which wrongly
penalised common roots such as فهم، فكر، فرح، جمع، بحث.

Hamza is written consistently as `أ` in every position (e.g. سوء → سوأ), which
matches the normalisation in `scripts/build-data.js`.

Fetched: 2026-08-19.
