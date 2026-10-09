// Takes the README screenshots into docs/images. Run from the repo root:
//   (cd tools/screenshots && python3 make-map.py)       draws the made-up floor plan
//   npm pack @mdi/js && tar xzf mdi-js-*.tgz && node tools/screenshots/icons.js package
//   PLAYWRIGHT=<path to playwright> node tools/screenshots/shoot.js
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/images');
const SHOTS = [
  ['desktop-light-clean', 1440, 900, 'scene=clean'],
  ['desktop-dark-clean', 1440, 900, 'scene=idle&theme=dark'],
  ['desktop-light-zone', 1440, 900, 'scene=zone'],
  ['desktop-light-care', 1440, 900, 'scene=care'],
  ['desktop-light-settings', 1440, 900, 'scene=settings&cat=dock'],
  ['tablet-light-clean', 834, 1194, 'scene=tablet'],
  ['phone-dark-clean', 390, 844, 'scene=phone&theme=dark'],
  ['phone-dark-dock', 390, 844, 'scene=dock&theme=dark'],
  ['phone-dark-care', 390, 844, 'scene=care&theme=dark'],
  ['phone-dark-settings', 390, 844, 'scene=settings&theme=dark'],
  ['phone-dark-settings-dock', 390, 844, 'scene=settings&cat=dock&theme=dark'],
];

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  for (const [name, w, h, query] of SHOTS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: query.includes('dark') ? 'dark' : 'light' });
    page.on('pageerror', (e) => console.error(name, e.message));
    await page.goto(`http://localhost:${port}/tools/screenshots/harness.html?${query}`);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    await page.close();
    console.log('saved', name);
  }
  await browser.close();
  server.close();
});
