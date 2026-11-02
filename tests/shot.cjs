// צילומי מסך: node tests/shot.cjs (מול vite preview על 4199)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:4199/';
const menu = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.route('**/appofapp-gh.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: menu }));
    p.on('pageerror', (e) => console.log('ERR', e.message));
    for (const [name, hash, scrolls] of [['home', '', [0, 900, 1800]], ['intro', '#/intro', [0, 1400, 2600]], ['a1', '#/t/a1?s=6', [0, 1100, 2000, 3000, 4200]], ['b3', '#/t/b3?s=15', [0]], ['gallery', '#/gallery', [0]], ['auth', '#/auth', [0]]]) {
      await p.goto(BASE + hash, { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      for (const y of scrolls) {
        await p.evaluate((y) => window.scrollTo(0, y), y);
        await p.waitForTimeout(250);
        await p.screenshot({ path: `${__dirname}/shots/${tag}-${name}-${y}.png` });
      }
    }
    await p.close();
  }
  await b.close();
})();
