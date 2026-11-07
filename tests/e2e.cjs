// בדיקת קצה לקצה: npm run build && node tests/e2e.cjs (מריץ vite preview בעצמו)
// Supabase מדומה: הגלריה מקבלת עבודה אחת, וההתחברות לא נשלחת לשרת אמיתי.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const BASE = 'http://localhost:4198/';
const menu = fs.readFileSync(__dirname + '/ai-menu.local.js', 'utf8');
const fails = [];
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };
const SUB = [{ id: 'x1', user_id: null, author_name: 'נועה כהן', session_id: 'a', topic_id: '1', description: 'קולקציה בהשראת חוף אשדוד', image_url: BASE + 'slides/a1/06.webp', created_at: '2026-03-08T20:49:48Z' }];

const ROSTER = [
  { id: 'r0', name: 'ענת שטיבלמן', email: null, phone: null, role: 'admin', token: 'adm', invited_at: null, invited_via: null, user_id: 'admin1', joined_at: '2026-11-03T10:00:00Z', created_at: '2026-11-03T09:00:00Z' },
  { id: 'r1', name: 'נועה כהן', email: 'noa@gmail.com', phone: '972501234567', role: 'student', token: 'tok1', invited_at: null, invited_via: null, user_id: null, joined_at: null, created_at: '2026-11-03T09:01:00Z' },
  { id: 'r2', name: 'דניאל לוי', email: 'daniel@gmail.com', phone: null, role: 'student', token: 'tok2', invited_at: '2026-11-03T09:30:00Z', invited_via: 'email', user_id: 'u2', joined_at: '2026-11-03T09:40:00Z', created_at: '2026-11-03T09:02:00Z' },
];

async function mock(p) {
  await p.route('**/appofapp-gh.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: menu }));
  await p.route('**/*.supabase.co/rest/v1/student_submissions**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUB) }));
  await p.route('**/*.supabase.co/rest/v1/profiles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ user_id: 'u1', display_name: 'נועה' }]) }));
  const json = (r, body, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const rpc = (name, fn) => p.route(`**/*.supabase.co/rest/v1/rpc/${name}**`, (r) => { const body = JSON.parse(r.request().postData() || '{}'); (p.__rpc ||= {})[name] = body; return fn(r, body); });
  await rpc('class_invite', (r, b) => json(r, b.p_token === 'adm' ? [{ name: 'ענת שטיבלמן', email: null, role: 'admin', joined: true }] : b.p_token === 'tok1' ? [{ name: 'נועה כהן', email: 'noa@gmail.com', role: 'student', joined: false }] : []));
  await rpc('roster_open', (r) => r.fulfill({ status: 204, body: '' }));
  await rpc('admin_check', (r, b) => json(r, b.p_key === 'adm'));
  await rpc('roster_list', (r) => json(r, ROSTER));
  await rpc('roster_add', (r) => json(r, 1));
  await rpc('roster_mark', (r) => r.fulfill({ status: 204, body: '' }));
  await rpc('roster_remove', (r) => r.fulfill({ status: 204, body: '' }));
  await rpc('add_submission', (r) => json(r, 'new-work-id'));
  await rpc('remove_submission', (r, b) => json(r, b.p_key.length === 32 || b.p_key === 'adm'));
  await p.route('**/*.supabase.co/storage/v1/object/submissions/**', (r) => { p.__uploaded = r.request().url(); return json(r, { Key: 'submissions/open/x.jpg' }); });
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
    ok(await p.locator('form#upload [aria-label="לאיזו תחנה"] .chip').count() === 6, 'העלאה מהגלריה: בחירה מבין 6 תחנות');
    await p.locator('form#upload [aria-label="לאיזו תחנה"] .chip', { hasText: '5 · לוגי' }).click();
    ok((await p.locator('form#upload b').first().innerText()).includes('לתחנה 5'), 'העלאה מהגלריה: הכותרת אומרת לאיזו תחנה');
    await p.locator('[aria-label="תחנה"] .chip', { hasText: 'לוגי' }).click();
    ok(await p.getByText('אין עבודות בבחירה הזו').isVisible(), 'בורר תחנה מסנן, ומצב ריק מוסבר');
    await p.locator('[aria-label="תחנה"] .chip', { hasText: 'לוגי' }).click();
    ok(await p.locator('.gal-card').count() === 1, 'לחיצה על הנבחר מחזירה ל"הכול"');
    await p.goto(BASE + '#/auth', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => location.hash === '#/gallery');
    ok(true, 'אין יותר דף כניסה: הכתובת הישנה מעבירה לגלריה');
    await p.locator('.brand').click();
    await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await p.waitForSelector('.kpi');
    ok(true, 'שם האפליקציה מוביל לבית');
    ok(await p.evaluate(() => [...document.querySelectorAll('button, .press, .field')].every((b) => getComputedStyle(b).borderRadius === '0px')), 'כל הכפתורים והשדות מרובעים');
    ok(await p.locator('.num').count() > 10, 'מספרים מודגשים אוטומטית');

    // העלאה בלי סיסמה: שם, תיאור ותמונה
    await p.goto(BASE + '#/t/a1', { waitUntil: 'networkidle' });
    await p.waitForSelector('form.upload');
    ok((await p.locator('h1').innerText()).includes('תחנה 1'), 'מספר התחנה גלוי בכותרת');
    await p.getByRole('button', { name: 'העלאת עבודה לתחנה 1' }).click();
    await p.waitForTimeout(900);
    ok(await p.evaluate(() => { const r = document.querySelector('form#upload').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), 'כפתור "העלאת עבודה" גולל אל הטופס');
    ok(await p.locator('input[type=password]').count() === 0, 'אין שדה סיסמה באפליקציה');
    await p.locator('form.upload input[name=name]').fill('דנה לוי');
    await p.locator('form.upload textarea').fill('קולקציה בהשראת הנמל');
    await p.locator('form.upload input[type=file]').setInputFiles(require('path').join(__dirname, '../public/icon-192.png'));
    await p.locator('form.upload button[type=submit]').click();
    await p.waitForFunction(() => (localStorage.getItem('c2m:my-works') || '').includes('new-work-id'), null, { timeout: 6000 }).catch(() => {});
    const add = p.__rpc.add_submission || {};
    ok(add.p_name === 'דנה לוי' && add.p_session === 'a' && add.p_topic === '1' && /^[0-9a-f]{32}$/.test(add.p_key || ''), 'העלאה נשמרת תחת השם, עם מפתח עריכה סמוי');
    ok((p.__uploaded || '').includes('/submissions/open/'), 'התמונה עולה לתיקייה הפתוחה');
    ok(await p.evaluate(() => localStorage.getItem('c2m:author-name')) === 'דנה לוי', 'השם נזכר לפעם הבאה');
    await p.evaluate(() => localStorage.setItem('c2m:my-works', JSON.stringify(['x1'])));
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForSelector('.gal-card');
    ok(await p.locator('.gal-card .chip', { hasText: 'מחיקה' }).count() === 1, 'כפתור מחיקה רק לעבודה שהועלתה מהמכשיר הזה');
    p.once('dialog', (d) => d.accept());
    await p.locator('.gal-card .chip', { hasText: 'מחיקה' }).click();
    await p.waitForTimeout(400);
    ok((p.__rpc.remove_submission || {}).p_id === 'x1', 'מחיקה עם מפתח העריכה של המכשיר');

    // קישור אישי של סטודנטית: בלי טופס, השם נשמר וממשיכים לקורס
    await p.evaluate(() => localStorage.removeItem('c2m:author-name'));
    await p.goto(BASE + '#/join/tok1', { waitUntil: 'networkidle' });
    await p.waitForFunction(() => location.hash.startsWith('#/t/a1'), null, { timeout: 6000 }).catch(() => {});
    ok(p.url().includes('#/t/a1') && (p.__rpc.roster_open || {}).p_token === 'tok1', 'קישור אישי: מסומן "פתח/ה" ומוביל לתחנה 1');
    await p.waitForSelector('form.upload');
    ok((await p.locator('form.upload input[name=name]').inputValue()) === 'נועה כהן', 'קישור אישי: השם ממולא בטופס ההעלאה');
    await p.goto(BASE + '#/class', { waitUntil: 'networkidle' });
    await p.waitForSelector('.empty');
    ok(await p.getByText('הדף הזה למנהלת הכיתה בלבד').isVisible(), 'ניהול הכיתה חסום בלי קישור מנהלת');

    // מנהלת הכיתה: ייבוא, תצוגה מקדימה ושליחה
    const a = await b.newPage({ viewport: { width: 1440, height: 900 } });
    a.__admin = true;
    await a.context().route('https://wa.me/**', (r) => { a.__wa = decodeURIComponent(r.request().url()); r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }); });
    await mock(a);
    a.on('pageerror', (e) => errors.push(e.message));
    await a.goto(BASE + '#/join/adm', { waitUntil: 'networkidle' });
    await a.waitForFunction(() => location.hash === '#/class', null, { timeout: 6000 }).catch(() => {});
    ok(await a.evaluate(() => localStorage.getItem('c2m:admin-key')) === 'adm', 'קישור מנהלת: הניהול נפתח במכשיר בלי סיסמה');
    await a.waitForSelector('#roster-paste', { timeout: 6000 }).catch(() => {});
    ok(await a.locator('#roster-paste').count() === 1, 'ניהול הכיתה נפתח למנהלת');
    ok((await a.locator('.kpi-row b').allInnerTexts()).join(',') === '2,1,1', 'מספרי הכיתה: 2 ברשימה, 1 הוזמן, 1 פתח את הקישור');
    await a.locator('#roster-paste').fill('שם\tמייל\tטלפון\nמאיה פרץ\tmaya@gmail.com\t052-765-4321\nנועה כהן\tnoa@gmail.com\nיואב\t\t\nרון\tron@@x');
    const tags = await a.locator('.roster.mini td:last-child').allInnerTexts();
    ok(tags.join('|') === 'תקין|כבר ברשימה|חסר מייל או טלפון|מייל או טלפון לא תקינים', 'תצוגה מקדימה: תקין, כפילות, חוסר ושגיאה מסומנים');
    await a.getByRole('button', { name: 'הוספת 1 לרשימה' }).click();
    await a.waitForTimeout(400);
    ok(JSON.stringify(a.__rpc.roster_add) === JSON.stringify({ p_key: 'adm', p_rows: [{ name: 'מאיה פרץ', email: 'maya@gmail.com', phone: '972527654321' }] }), 'הוספה: רק התקינים, וטלפון בפורמט וואטסאפ');
    const [pop] = await Promise.all([a.waitForEvent('popup'), a.getByRole('button', { name: 'וואטסאפ לבא בתור' }).click()]);
    await pop.waitForLoadState('domcontentloaded').catch(() => {});
    const u = a.__wa || '';
    ok(u.includes('972501234567') && u.includes('/#/join/tok1') && u.includes('שלום נועה'), 'וואטסאפ: הודעה אישית עם הקישור של נועה');
    await pop.close();
    await a.waitForTimeout(300);
    ok(a.__rpc.roster_mark && a.__rpc.roster_mark.p_via === 'whatsapp' && a.__rpc.roster_mark.p_id === 'r1', 'השליחה נרשמת כ"הוזמנה בוואטסאפ"');
    await a.locator('.chips .chip', { hasText: 'פתחו את הקישור' }).click();
    ok(await a.locator('table.roster:not(.mini) tbody tr').count() === 1, 'סינון "פתחו את הקישור"');
        ok(await a.evaluate(() => [...document.querySelectorAll('.press')].every((x) => getComputedStyle(x).borderTopColor === 'rgba(0, 0, 0, 0)')), 'כפתורים סמויים: בלי מסגרת גלויה');
    await a.close();

    const cdp = await p.context().newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    ok(inst.installabilityErrors.length === 0, 'התקנה: ' + (JSON.stringify(inst.installabilityErrors) || 'אין שגיאות'));

    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const m = await b.newPage({ viewport: vp, reducedMotion: 'reduce' });
      await mock(m);
      for (const h of ['', '#/intro', '#/t/a1?s=6', '#/t/b3?s=20', '#/gallery', '#/class']) {
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
