import Tooltip from '../core/Tooltip'
import { LANGUAGES, lang, setLanguage } from './index'

// Switches the language. With two languages a press goes straight to the
// other one; the button names the language it switches to.
export default function LanguageButton() {
  const other = LANGUAGES.find((l) => l.id !== lang)!
  return (
    <Tooltip text={other.name} className="inline-flex">
      <button
        data-no-translate
        onClick={() => setLanguage(other.id)}
        lang={other.id}
        className="inline-flex items-center rounded-full border border-line px-2 py-1.5 font-mono text-[11px] leading-[15px] font-semibold text-muted transition hover:text-fg"
        aria-label={`${other.name} (${other.short})`}
      >
        {other.short}
      </button>
    </Tooltip>
  )
}
