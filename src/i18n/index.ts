import { Translator, type Dictionary } from './translate'

// The language the app is shown in. English is what the code is written in;
// any other language is laid over it from a dictionary (see ./translate).
//
// The choice is read once, when the page loads, and changing it reloads the
// page. That keeps `t` a plain function that can be called from anywhere.

export const LANGUAGES = [
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'id', short: 'ID', name: 'Bahasa Indonesia' },
] as const

export type Lang = (typeof LANGUAGES)[number]['id']

const KEY = 'lang'

function saved(): Lang {
  try {
    const value = localStorage.getItem(KEY)
    if (LANGUAGES.some((l) => l.id === value)) return value as Lang
  } catch {
    // Storage can be blocked; the app then stays in English.
  }
  return 'en'
}

export const lang: Lang = saved()

let translator: Translator | null = null

// Load the dictionary for the chosen language. Call before the first render.
export async function loadLanguage(): Promise<void> {
  document.documentElement.lang = lang
  if (lang === 'en') return
  try {
    const { default: dictionaries } = (await import('./id')) as { default: Dictionary[] }
    translator = new Translator(dictionaries)
    const { translatePage } = await import('./dom')
    translatePage(t)
  } catch {
    // Without its dictionary the app is still usable, in English.
  }
}

// Text in the chosen language. Text with no translation comes back as it is.
export function t(text: string): string {
  return translator ? translator.translate(text) : text
}

export function setLanguage(next: Lang) {
  if (next === lang) return
  try {
    localStorage.setItem(KEY, next)
  } catch {
    return
  }
  window.location.reload()
}
