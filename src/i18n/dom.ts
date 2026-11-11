// Lays a translation over the page as it is drawn: every piece of text and
// every label read by screen readers goes through `translate` when it appears
// or changes. Text with no translation is left alone, so a half-finished
// dictionary shows the rest in English.
//
// React keeps working: it still owns every node, and when it writes new text
// that text is translated in turn.

const ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt']
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'])

export function translatePage(translate: (text: string) => string) {
  // What we last wrote into each node, to tell our own changes from React's.
  const written = new WeakMap<Node, string>()

  const skipped = (node: Node | null) => {
    for (let el = node instanceof Element ? node : node?.parentElement; el; el = el.parentElement) {
      if (SKIP.has(el.tagName) || el.hasAttribute('data-no-translate')) return true
    }
    return false
  }

  const text = (node: Text) => {
    const now = node.data
    if (written.get(node) === now) return
    const next = translate(now)
    if (next === now) return
    written.set(node, next)
    node.data = next
  }

  const attributes = (el: Element) => {
    for (const name of ATTRIBUTES) {
      const now = el.getAttribute(name)
      if (!now) continue
      const next = translate(now)
      if (next !== now) el.setAttribute(name, next)
    }
  }

  const tree = (root: Node) => {
    if (skipped(root)) return
    if (root instanceof Text) return text(root)
    if (!(root instanceof Element)) return
    attributes(root)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node instanceof Element && (SKIP.has(node.tagName) || node.hasAttribute('data-no-translate'))
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    })
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node instanceof Text) text(node)
      else attributes(node as Element)
    }
  }

  const title = () => {
    const next = translate(document.title)
    if (next !== document.title) document.title = next
  }

  new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === 'childList') change.addedNodes.forEach(tree)
      else if (change.type === 'characterData') {
        if (change.target instanceof Text && !skipped(change.target)) text(change.target)
      } else if (change.target instanceof Element && !skipped(change.target)) attributes(change.target)
    }
  }).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRIBUTES,
  })
  tree(document.body)

  const head = document.querySelector('title')
  if (head) new MutationObserver(title).observe(head, { childList: true, characterData: true, subtree: true })
  title()
}
