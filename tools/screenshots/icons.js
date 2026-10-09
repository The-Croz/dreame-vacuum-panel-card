// Writes icons.json: every mdi: icon the card uses, as SVG path data, from @mdi/js.
// Usage: node icons.js <path to unpacked @mdi/js package>
const fs = require('fs');
const path = require('path');
const mdi = require(path.resolve(process.argv[2], 'commonjs/mdi.js'));
const src = fs.readFileSync(path.join(__dirname, '../../dist/dreame-vacuum-panel-card.js'), 'utf8');
const names = [...new Set(src.match(/mdi:[a-z0-9-]+/g))];
const out = {};
for (const n of names) {
  const key = 'mdi' + n.slice(4).split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  if (mdi[key]) out[n] = mdi[key];
  else console.warn('missing', n);
}
// battery icons are built at runtime (mdi:battery-80, mdi:battery-charging-80, ...)
for (const k of Object.keys(mdi)) if (/^mdiBattery(Charging)?\d+$|^mdiBattery(Outline|Unknown)?$/.test(k)) out['mdi:' + k.slice(3).replace(/([A-Z0-9]+)/g, (m, g, i) => (i ? '-' : '') + g.toLowerCase()).replace(/([a-z])(\d)/g, '$1-$2')] = mdi[k];
fs.writeFileSync(path.join(__dirname, 'icons.json'), JSON.stringify(out));
console.log(Object.keys(out).length, 'icons');
