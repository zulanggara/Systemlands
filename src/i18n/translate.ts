// Turns the app's English text into another language from a dictionary of
// "English text" -> "translated text". Nothing here knows about the DOM.
//
// A key with slots ("{0} lost", "Cache · {0}/{1}") stands for text built at
// run time: the slots match whatever was put there, and the same slots in the
// translation say where each piece goes.

export type Dictionary = Record<string, string>

interface Pattern {
  test: RegExp
  to: string
}

const SLOT = /\{(\d+)\}/g
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Sentence ends: a full stop, then a space and a capital. Used to translate a
// text that is shown one sentence at a time.
const SENTENCE_END = /(?<=[.!?]["”’)]?)\s+(?=[A-Z“"(])/
const MAX_CACHE = 4000

export class Translator {
  private exact = new Map<string, string>()
  private folded = new Map<string, string>()
  private patterns: Pattern[] = []
  private cache = new Map<string, string | null>()

  constructor(dictionaries: Dictionary[]) {
    const patterns: { key: string; to: string; weight: number }[] = []
    for (const dict of dictionaries) {
      for (const [key, to] of Object.entries(dict)) {
        if (!to || to === key) continue
        if (SLOT.test(key)) {
          SLOT.lastIndex = 0
          // What is left once the slots are out. Too little and the pattern
          // would match almost anything.
          const weight = key.replace(SLOT, '').replace(/[^\p{L}]/gu, '').length
          if (weight >= 3) patterns.push({ key, to, weight })
          continue
        }
        this.add(key, to)
      }
    }
    // The most specific pattern gets the first try.
    patterns.sort((a, b) => b.weight - a.weight)
    this.patterns = patterns.map(({ key, to }) => ({
      test: new RegExp(
        '^' + key.split(SLOT).map((part, i) => (i % 2 ? '(.*?)' : escape(part))).join('') + '$',
        's',
      ),
      to,
    }))
    // A translation with the same number of sentences as its source also
    // translates each sentence on its own.
    for (const [key, to] of [...this.exact]) {
      const from = key.split(SENTENCE_END)
      if (from.length < 2) continue
      const into = to.split(SENTENCE_END)
      if (into.length !== from.length) continue
      from.forEach((sentence, i) => {
        if (!this.exact.has(sentence)) this.add(sentence, into[i])
      })
    }
  }

  private add(key: string, to: string) {
    this.exact.set(key, to)
    const low = key.toLowerCase()
    if (!this.folded.has(low)) this.folded.set(low, to)
  }

  // The translation of `text`, or `text` itself when there is none.
  translate(text: string): string {
    const core = text.trim()
    if (core.length < 2 || !/\p{L}{2}/u.test(core)) return text
    let found = this.cache.get(core)
    if (found === undefined) {
      found = this.lookup(core) ?? this.byPattern(core)
      if (this.cache.size >= MAX_CACHE) this.cache.clear()
      this.cache.set(core, found)
    }
    if (found === null) return text
    return core.length === text.length ? found : text.replace(core, () => found)
  }

  private lookup(text: string): string | null {
    const hit = this.exact.get(text)
    if (hit !== undefined) return hit
    // Same words in another case: labels are often shown in capitals, and
    // names are lowered to sit inside a sentence.
    const other = this.folded.get(text.toLowerCase())
    if (other === undefined) return null
    if (text === text.toUpperCase()) return other.toUpperCase()
    if (text === text.toLowerCase()) return other.toLowerCase()
    if (text[0] === text[0].toUpperCase()) return other[0].toUpperCase() + other.slice(1)
    return other[0].toLowerCase() + other.slice(1)
  }

  private byPattern(text: string): string | null {
    for (const { test, to } of this.patterns) {
      const m = test.exec(text)
      if (!m) continue
      return to.replace(SLOT, (_all, n) => {
        const piece = m[Number(n) + 1] ?? ''
        return this.lookup(piece.trim()) ?? piece
      })
    }
    return null
  }
}
