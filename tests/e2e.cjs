// בדיקת קצה לקצה: npm run build && node tests/e2e.cjs (מריץ vite preview בעצמו)
// Supabase מדומה: הגלריה מקבלת עבודה אחת, וההתחברות לא נשלחת לשרת אמיתי.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const BASE = 'http://localhost:4198/';
const menu = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
const fails = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };
const SUB = [{ id: 'x1', user_id: 'u1', session_id: 'a', topic_id: '1', description: 'קולקציה בהשראת חוף אשדוד', image_url: BASE + 'slides/a1/06.webp', created_at: '2026-03-08T20:49:48Z' }];

async function mock(p) {
  await p.route('**/appofapp-gh.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: menu }));
  await p.route('**/*.supabase.co/rest/v1/student_submissions**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUB) }));
  await p.route('**/*.supabase.co/rest/v1/profiles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ user_id: 'u1', display_name: 'נועה' }]) }));
  await p.route('**/*.supabase.co/auth/**', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' }) }));
}

(async () => {
  const srv = spawn('npx', ['vite', 'preview', '--port', '4198', '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await mock(p);
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(BASE, { waitUntil: 'networkidle' });
    ok((await p.locator('h1').innerText()).includes('שישה צעדים'), 'דף הבית: שורת התובנה');
    ok(await p.locator('svg.iso .station').count() === 6, 'דף הבית: 6 תחנות במסלול');
    await p.locator('.legend-row').nth(3).hover();
    ok(await p.locator('svg.iso .station.on').getAttribute('aria-label').then((a) => a.includes('טבעי')), 'ריחוף על המקרא מדגיש את התחנה');
    await p.locator('.cake-row').nth(2).click();
    ok(await p.locator('.cake .slice.on').count() === 1 && (await p.locator('.cake-row[aria-pressed="true"]').innerText()).includes('פואטי'), 'עוגת הידע: בחירת פרוסה מציגה תחנות');
    await p.locator('.cake-row').nth(2).click();
    ok(await p.locator('.cake .slice.on').count() === 0, 'עוגת הידע: לחיצה שנייה מאפסת');
    ok(await p.locator('.map-card').count() === 7, 'מפת הקורס: הקדמה ו-6 תחנות');

    await p.locator('svg.iso .station').nth(5).click(); // reversed order: index 5 = station 1
    await p.waitForFunction(() => location.hash.startsWith('#/t/'));
    ok(p.url().includes('#/t/a1'), 'לחיצה על תחנה פותחת אותה');
    await p.waitForSelector('.slide-frame img');
    ok((await p.locator('.stage-top h2').innerText()) === 'הנחיות לפרויקט חדש', 'שקף ראשון מוצג');
    await p.keyboard.press('ArrowLeft');
    await p.waitForFunction(() => location.hash.includes('s=2'));
    ok(true, 'חץ שמאלה עובר לשקף הבא ונשמר בכתובת');
    await p.locator('.film button').nth(5).click();
    ok((await p.locator('.stage-top h2').innerText()).includes('Mirror Lake'), 'רצועת השקופיות קופצת לשקף 6');
    await p.reload({ waitUntil: 'networkidle' });
    ok((await p.locator('.stage-top h2').innerText()).includes('Mirror Lake'), 'רענון שומר את השקף');
    ok(await p.locator('.film button').count() === 12, 'תחנה 1: 12 שקופיות');

    await p.locator('.chain .step-btn').first().click();
    ok(await p.locator('.chain li.done').count() === 1, 'סימון שלב בתרגיל');
    await p.locator('.journal textarea').first().fill('לגלות שפה מהחוף');
    await p.reload({ waitUntil: 'networkidle' });
    ok(await p.locator('.chain li.done').count() === 1 && (await p.locator('.journal textarea').first().inputValue()) === 'לגלות שפה מהחוף', 'התרגיל והיומן נשמרים אחרי רענון');

    await p.locator('.io-card').nth(1).click();
    await p.waitForFunction(() => location.hash.includes('s=6'));
    ok(true, 'כרטיס הפלט פותח את השקף שלו');

    const lab = p.locator('#lab textarea');
    await lab.fill('אני רוצה רעיון לעיצוב סלון.');
    ok((await p.locator('.levels .cur b').innerText()) === '1', 'מעבדה: פרומפט בסיסי ברמה 1');
    await lab.fill('אתה מעצב פנים.\nאני אדריכלית.\nקלט: תמונה מצורפת.\nפלט: טבלה של 3 לוחות.\nזקק את העיקר, בלי קלישאות.\nבסגנון Peter Zumthor.');
    ok((await p.locator('.levels .cur b').innerText()) === '4', 'מעבדה: פרומפט מלא ברמה 4');
    ok((await p.locator('.check.no').count()) === 0, 'מעבדה: אין רכיב חסר');

    ok(await p.locator('.ft-quote cite').innerText().then((t) => t.includes('Chuck Close')), 'שכבת ידע: ציטוט עם מקור');
    ok(await p.locator('.ft-haiku span').count() === 3, 'שכבת ידע: הייקו של 3 שורות');
    await p.waitForSelector('.gal-card', { timeout: 4000 }).catch(() => {});
    ok(await p.locator('.gal-card').count() === 1, 'גלריית התחנה מציגה את העבודה מהשרת');
    await p.locator('.gal-card').first().click();
    ok(await p.locator('.lightbox').isVisible(), 'עבודה נפתחת בהגדלה');
    await p.keyboard.press('Escape');
    ok(await p.locator('.lightbox').count() === 0, 'Esc סוגר את ההגדלה');

    await p.locator('.search input').fill('אגם');
    ok(await p.locator('.search-hit').count() > 2, 'חיפוש מוצא שקופיות');
    await p.locator('.search input').fill('תיאוריה'); // לא אמור לתפוס "אור"
    await p.locator('.search input').fill('אור');
    const hits = await p.locator('.search-hit').allInnerTexts();
    ok(hits.every((h) => !/תאוריה/.test(h)), 'חיפוש: מילה קצרה מחייבת מילה שלמה');
    await p.locator('.search input').fill('קשקשת');
    ok(await p.getByText('לא נמצאה שקופית').isVisible(), 'חיפוש: מצב ריק מוסבר');
    await p.locator('.search .clear').click();
    ok((await p.locator('.search input').inputValue()) === '', 'איקס מאפס את החיפוש');
    await p.locator('.search input').fill('טרמיטים');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => location.hash.includes('/t/b1'));
    ok(await p.waitForSelector('.slide-text mark.hit', { timeout: 4000 }).then(() => true).catch(() => false), 'Enter פותח את השקף ומדגיש את המילה');

    await p.goto(BASE + '#/intro', { waitUntil: 'networkidle' });
    ok(await p.locator('.film button').count() === 14, 'הקדמה: 14 שקופיות');
    ok(await p.locator('.tpl').count() === 3, 'הקדמה: 3 תבניות להעתקה');
    await p.goto(BASE + '#/gallery', { waitUntil: 'networkidle' });
    await p.waitForSelector('.gal-card', { timeout: 4000 }).catch(() => {});
    ok(await p.locator('.gal-card').count() === 1, 'גלריית הכיתה נטענת');
    await p.locator('.chips .chip', { hasText: 'לוגי' }).click();
    ok(await p.getByText('אין עבודות בבחירה הזו').isVisible(), 'בורר תחנה מסנן, ומצב ריק מוסבר');
    await p.locator('.chips .chip', { hasText: 'לוגי' }).click();
    ok(await p.locator('.gal-card').count() === 1, 'לחיצה על הנבחר מחזירה ל"הכול"');
    await p.goto(BASE + '#/auth', { waitUntil: 'networkidle' });
    await p.locator('input[type=email]').fill('a@b.co'); await p.locator('input[type=password]').fill('123456');
    await p.locator('form button[type=submit]').click();
    ok(await p.waitForSelector('.msg.err', { timeout: 5000 }).then(() => true).catch(() => false), 'כניסה שגויה מסבירה מה לעשות');
    await p.locator('.brand').click();
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await p.waitForSelector('.kpi');
    ok(true, 'שם האפליקציה מוביל לבית');
    ok(await p.evaluate(() => [...document.querySelectorAll('button, .press, .field')].every((b) => getComputedStyle(b).borderRadius === '0px')), 'כל הכפתורים והשדות מרובעים');
    ok(await p.locator('.num').count() > 10, 'מספרים מודגשים אוטומטית');

    const cdp = await p.context().newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    ok(inst.installabilityErrors.length === 0, 'התקנה: ' + (JSON.stringify(inst.installabilityErrors) || 'אין שגיאות'));

    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const m = await b.newPage({ viewport: vp, reducedMotion: 'reduce' });
      await mock(m);
      for (const h of ['', '#/intro', '#/t/a1?s=6', '#/t/b3?s=20', '#/gallery', '#/auth']) {
        await m.goto(BASE + h, { waitUntil: 'networkidle' });
        const hs = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        ok(!hs, `${vp.width}px ${h || 'בית'}: בלי גלילה אופקית`);
      }
      await m.goto(BASE, { waitUntil: 'networkidle' });
      const anim = await m.evaluate(() => getComputedStyle(document.querySelector('.rise')).animationName);
      ok(anim === 'none', `${vp.width}px: הפחתת תנועה מכובדת`);
      await m.close();
    }
    ok(errors.length === 0, 'אין שגיאות JavaScript ' + errors.join(' | '));
  } finally {
    await b.close();
    srv.kill();
  }
  console.log(fails.length ? `\n${fails.length} נכשלו` : '\nהכול עבר');
  process.exit(fails.length ? 1 : 0);
})();
