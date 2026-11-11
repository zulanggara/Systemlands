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

Translated: the interface, the home page, and the topics load-balancing,
caching, cdn, autoscaling, replication, sharding, consistent-hashing, cap,
queues, pubsub, rate-limiting, circuit-breakers, fan-out, real-time, presence,
adaptive-streaming, consensus, idempotency, locking, chunking-dedupe.

Still in English: bloom-filters, geospatial, transactions, and the capstones
(url-shortener, notifications, web-crawler, news-feed, chat, video-streaming,
key-value-store, payments, ride-sharing, twitter-timeline, youtube, dropbox,
whatsapp).

## Prompt to continue

```text
Lanjutkan terjemahan bahasa Indonesia di repo ini. Baca scripts/i18n/README.md dulu.

1. Jalankan `npm ci` lalu `node scripts/i18n/extract.cjs` untuk melihat grup mana
   yang masih punya string belum diterjemahkan.
2. Untuk tiap grup yang belum selesai (mulai dari bloom-filters, geospatial,
   transactions, lalu capstone: url-shortener, notifications, web-crawler,
   news-feed, chat, video-streaming, key-value-store, payments, ride-sharing,
   twitter-timeline, youtube, dropbox, whatsapp, dan sisa di common/core):
   baca scripts/i18n/work/todo/<grup>.txt, tulis terjemahannya ke
   scripts/i18n/work/id/<grup>.txt dengan format `nomor|teks Indonesia`
   (nomor sama dengan sumbernya), lalu jalankan `node scripts/i18n/build.cjs`.
3. Gaya terjemahan, ikuti yang sudah ada di src/i18n/id/*.json: bahasa Indonesia
   yang ringkas dan natural, sapaan "kamu". Istilah teknis tetap bahasa Inggris
   (cache, server, database, queue, load balancer, shard, replica, leader,
   follower, request, read/write, retry, timeout, hit/miss, crash, dan
   sejenisnya). Pertahankan slot {0}, {1}. Lewati baris yang bukan teks untuk
   pembaca (nama orang/produk, nilai CSS, key, kode).
4. Kerjakan 2-3 grup per putaran, commit dan push tiap putaran supaya progres
   tidak hilang.
5. Setelah semua selesai: `npm run lint`, `npm test`, `npm run build`, lalu buka
   beberapa topik dengan bahasa ID (localStorage `lang` = `id`) dan periksa teks
   yang masih Inggris atau label yang terpotong. Perbarui bagian Status di
   scripts/i18n/README.md.
```
