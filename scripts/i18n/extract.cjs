// Pull every piece of text a learner can see out of the source, grouped by topic.
const ts = require('typescript');
const fs = require('fs'), path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const WORK = path.join(__dirname, 'work');
const files = execSync('git ls-files src', { cwd: ROOT }).toString().trim().split('\n')
  .filter(f => /\.tsx?$/.test(f) && !/\.test\.|vite-env|src\/i18n\//.test(f));
const SKIP_ATTR = /^(className|class|d|key|id|viewBox|fill|stroke|href|type|role|points|transform|mask|filter|clipPath|strokeLinecap|strokeLinejoin|strokeDasharray|textAnchor|dominantBaseline|fontFamily|as|src|rel|target|name|htmlFor|style|tone|kind|variant|size|align|side|mode|lang|inputMode|autoComplete|preserveAspectRatio|gradientUnits|maskUnits|offset|stopColor|x|y|dx|dy|rx|ry|cx|cy|r|width|height|opacity|values|dur|begin|repeatCount|attributeName|calcMode|keyTimes|keySplines|xmlns|method|enterKeyHint)$/;
const SKIP_PROP = /^(className|class|id|key|kind|type|tone|color|fill|stroke|icon|font|fontFamily|d|href|path|route|page|topic|track|level|state|status|mode|variant|event|shape|side|align|anchor|transform|transition|animation|cursor|display|position|background|border|filter|easing)$/;
const codey = s => /^(var\(|#[0-9a-f]{3,8}$|rgba?\(|hsl|url\(|translate|rotate|scale\(|M[\d. -]|[a-z]+(-[a-z0-9]+)+$|[a-z]+([A-Z][a-z]+)+$|[a-z0-9_]+$|https?:|\/|\.\/)/.test(s.trim()) && !/\s[a-z]+\s/.test(s);
const classy = s => /(^|\s)(flex|grid|hidden|block|inline|absolute|relative|fixed|sticky|text-|bg-|border|rounded|px-|py-|p-\d|m-\d|mx-|my-|gap-|w-|h-|min-|max-|items-|justify-|font-|opacity-|transition|shadow|z-\d|top-|left-|right-|bottom-|pointer-events|cursor-|overflow|shrink|grow|sm:|md:|lg:|hover:|dark:|stroke-|fill-|tag-in|animate-|truncate|uppercase|tracking-|leading-|whitespace-|select-none|ring-|inset-|translate-|rotate-|scale-|origin-|duration-|ease-|space-|divide-|sr-only|underline|italic|tabular-nums|backdrop-)/.test(s) && !/[.!?]$/.test(s.trim());
const out = {}; const single = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const list = [];
  const ctx = n => {
    // The nearest thing that says what this string is for.
    let p = n.parent;
    while (p && (ts.isConditionalExpression(p) || ts.isParenthesizedExpression(p) || (ts.isBinaryExpression(p) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.PlusToken].includes(p.operatorToken.kind)))) p = p.parent;
    return p;
  };
  const push = (text, n, k) => {
    const p = ctx(n);
    if (!p) return;
    if (ts.isJsxAttribute(p) && SKIP_ATTR.test(p.name.getText())) return;
    if (ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent) && SKIP_ATTR.test(p.parent.name.getText())) return;
    if (ts.isPropertyAssignment(p) && p.initializer !== undefined && SKIP_PROP.test(p.name.getText().replace(/['"]/g, ''))) return;
    if (ts.isPropertyAssignment(p) && p.name === n) return;
    if (ts.isBinaryExpression(p)) return; // comparisons
    if (ts.isCaseClause(p) || ts.isElementAccessExpression(p) || ts.isTypeOfExpression(p)) return;
    if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
      const callee = p.expression.getText();
      if (/^(console\.|Error|TypeError|require|import|document\.|window\.|localStorage|sessionStorage|.*\.(getItem|setItem|removeItem|addEventListener|removeEventListener|querySelector|querySelectorAll|getElementById|createElement|createElementNS|setAttribute|getAttribute|hasAttribute|startsWith|endsWith|includes|indexOf|split|join|replace|replaceAll|match|test|padStart|padEnd|has|get|set|delete|add|classList\..*|toLocaleString|toFixed|closest|matches|getContext|collection|doc)$|matchMedia|createElement|describe|it|test|expect|RegExp|Symbol|fetch|URL|CustomEvent|Event|dispatchEvent)/.test(callee)) return;
    }
    if (codey(text) && !/^[A-Z][a-z]+$/.test(text.trim()) && k !== 'j') { if (/^[a-z]+$/.test(text.trim())) { /* single lowercase word: decide below */ } else return; }
    if (classy(text)) return;
    const bare = text.replace(/\{\d+\}/g, '').trim();
    if (!/[A-Za-z]{2,}/.test(bare)) return;
    if (/^[a-z]+$/.test(bare) && !/\{\d+\}/.test(text)) {
      // A lone lowercase word is text only where text is expected.
      const where = ts.isPropertyAssignment(p) ? p.name.getText() : ts.isJsxAttribute(p) ? p.name.getText() : ts.isTemplateSpan(p) ? '`' : ts.isReturnStatement(p) || ts.isArrowFunction(p) ? 'ret' : ts.isJsxExpression(p) ? 'jsx' : k === 'j' ? 'jsx' : ts.SyntaxKind[p.kind];
      (single[where] ||= new Set()).add(bare);
      if (!/^(text|label|says|name|title|value|unit|caption|sub|goal|win|`|jsx|note|hint|why|what|verb|noun|word|short|long|body|lead|status)$/.test(where)) return;
    }
    list.push({ k, t: text });
  };
  const visit = n => {
    if (ts.isImportDeclaration(n) || (ts.isExportDeclaration(n) && n.moduleSpecifier)) return;
    if (ts.isTypeNode(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n)) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) push(n.text, n, 's');
    else if (ts.isTemplateExpression(n)) {
      let t = n.head.text; n.templateSpans.forEach((s, i) => { t += '{' + i + '}' + s.literal.text; });
      push(t, n, 't');
      n.templateSpans.forEach(s => visit(s.expression));
      return;
    } else if (ts.isJsxText(n)) {
      const t = n.text.replace(/\s+/g, ' ').trim();
      if (t) push(t.replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&').replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&rarr;/g, '→').replace(/&larr;/g, '←').replace(/&middot;/g, '·').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&times;/g, '×').replace(/&gt;/g, '>').replace(/&lt;/g, '<'), n, 'j');
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (list.length) out[f] = list;
}
// Group by topic; text used by more than one group is shared.
const groupOf = f => f.startsWith('src/topics/') && f.split('/').length > 3 ? f.split('/')[2] : 'core';
const seenIn = new Map();
for (const f in out) for (const e of out[f]) { const g = groupOf(f); if (!seenIn.has(e.t)) seenIn.set(e.t, new Set()); seenIn.get(e.t).add(g); }
const groups = {};
for (const f in out) for (const e of out[f]) {
  const g = seenIn.get(e.t).size > 1 ? 'common' : groupOf(f);
  (groups[g] ||= []);
  if (!groups[g].includes(e.t)) groups[g].push(e.t);
}
fs.mkdirSync(WORK + '/en', { recursive: true });
fs.mkdirSync(WORK + '/todo', { recursive: true });
// What is already translated, in any dictionary.
const DICTS = path.join(ROOT, 'src/i18n/id');
const done = new Set();
for (const f of fs.readdirSync(DICTS).filter(f => f.endsWith('.json'))) for (const k of Object.keys(JSON.parse(fs.readFileSync(path.join(DICTS, f), 'utf8')))) done.add(k);
let left = 0;
let tot = 0, n = 0;
for (const g in groups) {
  fs.writeFileSync(`${WORK}/en/${g}.json`, JSON.stringify(groups[g], null, 0));
  fs.writeFileSync(`${WORK}/en/${g}.txt`, groups[g].map((s, i) => `${i + 1}|${s.replace(/\n/g, '\\n')}`).join('\n') + '\n');
  // todo/<group>.txt: only the lines still without a translation, with the same numbers.
  const todo = groups[g].map((s, i) => [i + 1, s]).filter(([, s]) => !done.has(s));
  fs.writeFileSync(`${WORK}/todo/${g}.txt`, todo.map(([i, s]) => `${i}|${s.replace(/\n/g, '\\n')}`).join('\n') + '\n');
  const c = groups[g].reduce((a, s) => a + s.length, 0); tot += c; n += groups[g].length; left += todo.length;
  console.log(g.padEnd(20), 'strings', String(groups[g].length).padStart(4), ' untranslated', String(todo.length).padStart(4));
}
console.log('TOTAL', n, 'strings,', left, 'untranslated');
if (process.argv[2]) for (const k in single) console.log('  ', k, [...single[k]].slice(0, 60).join(' '));
