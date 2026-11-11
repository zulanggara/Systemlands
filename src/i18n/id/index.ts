import type { Dictionary } from '../translate'

// Every Indonesian dictionary, one file per topic. They load together, as one
// chunk, and only when Indonesian is chosen.
const files = import.meta.glob<Dictionary>('./*.json', { eager: true, import: 'default' })

export default Object.values(files)
