# Indonesian translation

The app is written in English. Indonesian is laid over it at run time from the
dictionaries in `src/i18n/id/*.json` (`"English text": "Teks Indonesia"`), one
file per topic. Text with no entry is shown in English, so a topic can be
translated a bit at a time.

- `src/i18n/translate.ts` looks text up (exact, other case, `{0}` slots, one sentence of a longer text).
- `src/i18n/dom.ts` runs every piece of text on the page through it.
- `src/i18n/LanguageButton.tsx` is the EN/ID button in the header.

## Translating more

```bash
node scripts/i18n/extract.cjs
```

lists every piece of text in the source, grouped by topic, into
`scripts/i18n/work/en/<group>.txt`, and what is still untranslated into
`scripts/i18n/work/todo/<group>.txt`. Each line is `number|English text`.

Write the translations to `scripts/i18n/work/id/<group>.txt`, one
`number|Teks Indonesia` per line with the same numbers. Leave a line out to
keep it in English (names, code, CSS values). Keep `{0}`, `{1}` slots as they
are; a slot that only holds a plural "s" can be dropped. Then:

```bash
node scripts/i18n/build.cjs
```

merges them into `src/i18n/id/<group>.json`. The numbers are only valid for
the extraction they came from, so extract, translate and build in one go.
`work/` is not committed.

Text the extractor does not find can be added by hand to `src/i18n/id/_extra.json`.

## Status

Every topic and capstone is translated, plus the interface and the home page.

What `extract.cjs` still lists as untranslated (about 400 of 5,800 strings) is
left in English on purpose: technical terms (Hot key, Fencing tokens, Token
bucket, Dispatch, Gateway, ...), proper names, units and code such as CSS
values and storage keys. If a term should be Indonesian after all, add it to
`src/i18n/id/_extra.json` or to the topic's file.

To check the result, set `localStorage.lang = "id"` (or press the EN/ID button),
open a few topics and look for English text or labels that are cut off. Short
labels inside the 3D scenes are the likeliest to be too wide.
