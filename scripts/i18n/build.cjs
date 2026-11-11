// Zip work/en/<group>.json with work/id/<group>.txt ("N|terjemahan" lines) into src/i18n/id/<group>.json.
// Run extract.cjs first, in the same session: the line numbers are only valid for that extraction.
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../src/i18n/id');
const WORK = path.join(__dirname, 'work');
let total = 0, done = 0, bad = 0;
for (const f of fs.readdirSync(WORK + '/en').filter(f => f.endsWith('.json'))) {
  const g = f.replace('.json', '');
  const en = JSON.parse(fs.readFileSync(`${WORK}/en/${f}`, 'utf8'));
  total += en.length;
  if (!fs.existsSync(`${WORK}/id/${g}.txt`)) continue;
  // Merge into what is already translated, so a group can be done in several passes.
  const dict = fs.existsSync(`${OUT}/${g}.json`) ? JSON.parse(fs.readFileSync(`${OUT}/${g}.json`, 'utf8')) : {};
  for (const line of fs.readFileSync(`${WORK}/id/${g}.txt`, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const m = /^(\d+)\|(.*)$/.exec(line);
    if (!m) { console.log(`${g}: bad line: ${line.slice(0, 60)}`); bad++; continue; }
    const key = en[Number(m[1]) - 1];
    if (key === undefined) { console.log(`${g}: no source ${m[1]}`); bad++; continue; }
    let val = m[2].replace(/\\n/g, '\n');
    // keep the source's leading/trailing spaces
    val = key.match(/^\s*/)[0] + val.trim() + key.match(/\s*$/)[0];
    const slots = s => (s.match(/\{\d+\}/g) || []).sort().join();
    if ((val.match(/\{\d+\}/g) || []).some(x => !key.includes(x))) { console.log(`${g} ${m[1]}: slots differ: ${key} => ${val}`); bad++; continue; }
    if (val !== key) dict[key] = val;
    done++;
  }
  fs.writeFileSync(`${OUT}/${g}.json`, JSON.stringify(dict, null, 2) + '\n');
}
console.log(`translated ${done}/${total}, problems ${bad}`);
