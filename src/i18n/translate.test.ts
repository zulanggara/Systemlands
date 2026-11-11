import { describe, expect, it } from 'vitest'
import { Translator } from './translate'

const t = new Translator([
  {
    Cache: 'Tembolok',
    'It starts empty.': 'Awalnya kosong.',
    'A cache remembers answers. It starts empty.': 'Cache mengingat jawaban. Awalnya kosong.',
    '{0} lost': '{0} hilang',
    'Queue · {0}/{1}': 'Antrean · {0}/{1}',
    '{0} shard{1}': '{0} shard',
    'The {0} comes first.': '{0} lebih dulu.',
  },
])

describe('Translator', () => {
  it('translates known text and leaves the rest alone', () => {
    expect(t.translate('It starts empty.')).toBe('Awalnya kosong.')
    expect(t.translate('Never seen before.')).toBe('Never seen before.')
    expect(t.translate('42')).toBe('42')
  })

  it('keeps the spaces around the text', () => {
    expect(t.translate('  It starts empty. ')).toBe('  Awalnya kosong. ')
  })

  it('follows the case of the text it is given', () => {
    expect(t.translate('CACHE')).toBe('TEMBOLOK')
    expect(t.translate('cache')).toBe('tembolok')
  })

  it('fills the slots of text built at run time', () => {
    expect(t.translate('3 lost')).toBe('3 hilang')
    expect(t.translate('Queue · 4/20')).toBe('Antrean · 4/20')
    expect(t.translate('2 shards')).toBe('2 shard')
    expect(t.translate('1 shard')).toBe('1 shard')
  })

  it('translates what goes into a slot', () => {
    expect(t.translate('The cache comes first.')).toBe('tembolok lebih dulu.')
  })

  it('translates one sentence of a longer text', () => {
    expect(t.translate('A cache remembers answers.')).toBe('Cache mengingat jawaban.')
  })
})
