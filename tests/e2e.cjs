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

const ROSTER = [
  { id: 'r0', name: 'ענת שטיבלמן', email: null, phone: null, role: 'admin', token: 'adm', invited_at: null, invited_via: null, user_id: 'admin1', joined_at: '2026-11-03T10:00:00Z', created_at: '2026-11-03T09:00:00Z' },
  { id: 'r1', name: 'נועה כהן', email: 'noa@gmail.com', phone: '972501234567', role: 'student', token: 'tok1', invited_at: null, invited_via: null, user_id: null, joined_at: null, created_at: '2026-11-03T09:01:00Z' },
  { id: 'r2', name: 'דניאל לוי', email: 'daniel@gmail.com', phone: null, role: 'student', token: 'tok2', invited_at: '2026-11-03T09:30:00Z', invited_via: 'email', user_id: 'u2', joined_at: '2026-11-03T09:40:00Z', created_at: '2026-11-03T09:02:00Z' },
];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const FAKE_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'admin1', email: 'anat@example.com', role: 'authenticated', aud: 'authenticated', exp: 4102444800 })}.sig`;
const SESSION = { access_token: FAKE_JWT, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: { id: 'admin1', email: 'anat@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } };

async function mock(p) {
  await p.route('**/appofapp-gh.vercel.app/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: menu }));
  await p.route('**/*.supabase.co/rest/v1/student_submissions**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SUB) }));
  await p.route('**/*.supabase.co/rest/v1/profiles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ user_id: 'u1', display_name: 'נועה' }]) }));
  await p.route('**/*.supabase.co/rest/v1/rpc/class_invite**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ name: 'נועה כהן', email: 'noa@gmail.com', role: 'student', joined: false }]) }));
  await p.route('**/*.supabase.co/rest/v1/rpc/is_class_admin**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: String(!!p.__admin) }));
  await p.route('**/*.supabase.co/rest/v1/rpc/class_member**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: String(!!p.__admin) }));
  await p.route('**/*.supabase.co/rest/v1/class_roster**', (r) => {
    const m = r.request().method();
    if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROSTER) });
    if (m === 'POST') { p.__inserted = JSON.parse(r.request().postData()); return r.fulfill({ status: 201, contentType: 'application/json', body: '[]' }); }
    if (m === 'PATCH') { p.__patched = JSON.parse(r.request().postData()); return r.fulfill({ status: 204, body: '' }); }
    return r.fulfill({ status: 204, body: '' });
  });
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

    // הזמנה אישית: הקישור מזהה את הסטודנטית וממלא את הטופס
    await p.goto(BASE + '#/join/tok1', { waitUntil: 'networkidle' });
    await p.waitForSelector('.auth-form');
    ok((await p.locator('h1').innerText()).includes('שלום נועה'), 'קישור אישי: פנייה בשם');
    ok((await p.locator('input[name=email]').inputValue()) === 'noa@gmail.com' && (await p.locator('input[name=name]').inputValue()) === 'נועה כהן', 'קישור אישי: אימייל ושם ממולאים מראש');
    ok((await p.locator('input[name=password]').getAttribute('autocomplete')) === 'new-password', 'קישור אישי: מילוי אוטומטי של Chrome לסיסמה חדשה');
    await p.locator('input[name=password]').fill('abcdef');
    await p.locator('.pass-eye').click();
    ok((await p.locator('input[name=password]').getAttribute('type')) === 'text', 'כפתור הצגת סיסמה');
    await p.goto(BASE + '#/class', { waitUntil: 'networkidle' });
    ok(await p.getByText('הדף הזה למנהלת הכיתה בלבד').isVisible(), 'ניהול הכיתה חסום למי שאינו מנהל');

    // מנהלת הכיתה: ייבוא, תצוגה מקדימה ושליחה
    const a = await b.newPage({ viewport: { width: 1440, height: 900 } });
    a.__admin = true;
    await a.context().route('https://wa.me/**', (r) => { a.__wa = decodeURIComponent(r.request().url()); r.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }); });
    await mock(a);
    a.on('pageerror', (e) => errors.push(e.message));
    await a.addInitScript((s) => localStorage.setItem('sb-tnvwpjcilwmtigfxhomx-auth-token', JSON.stringify(s)), SESSION);
    await a.goto(BASE + '#/class', { waitUntil: 'networkidle' });
    await a.waitForSelector('#roster-paste', { timeout: 6000 }).catch(() => {});
    ok(await a.locator('#roster-paste').count() === 1, 'ניהול הכיתה נפתח למנהלת');
    ok((await a.locator('.kpi-row b').allInnerTexts()).join(',') === '2,1,1', 'מספרי הכיתה: 2 ברשימה, 1 הוזמן, 1 הצטרף');
    await a.locator('#roster-paste').fill('שם\tמייל\tטלפון\nמאיה פרץ\tmaya@gmail.com\t052-765-4321\nנועה כהן\tnoa@gmail.com\nיואב\t\t\nרון\tron@@x');
    const tags = await a.locator('.roster.mini td:last-child').allInnerTexts();
    ok(tags.join('|') === 'תקין|כבר ברשימה|חסר מייל או טלפון|מייל או טלפון לא תקינים', 'תצוגה מקדימה: תקין, כפילות, חוסר ושגיאה מסומנים');
    await a.getByRole('button', { name: 'הוספת 1 לרשימה' }).click();
    await a.waitForTimeout(400);
    ok(JSON.stringify(a.__inserted) === JSON.stringify([{ name: 'מאיה פרץ', email: 'maya@gmail.com', phone: '972527654321' }]), 'הוספה: רק התקינים, וטלפון בפורמט וואטסאפ');
    const [pop] = await Promise.all([a.waitForEvent('popup'), a.getByRole('button', { name: 'וואטסאפ לבא בתור' }).click()]);
    await pop.waitForLoadState('domcontentloaded').catch(() => {});
    const u = a.__wa || '';
    ok(u.includes('972501234567') && u.includes('/#/join/tok1') && u.includes('שלום נועה'), 'וואטסאפ: הודעה אישית עם הקישור של נועה');
    await pop.close();
    await a.waitForTimeout(300);
    ok(a.__patched && a.__patched.invited_via === 'whatsapp', 'השליחה נרשמת כ"הוזמנה בוואטסאפ"');
    await a.locator('.chips .chip', { hasText: 'הצטרפו' }).click();
    ok(await a.locator('table.roster:not(.mini) tbody tr').count() === 1, 'סינון "הצטרפו"');
        ok(await a.evaluate(() => [...document.querySelectorAll('.press')].every((x) => getComputedStyle(x).borderTopColor === 'rgba(0, 0, 0, 0)')), 'כפתורים סמויים: בלי מסגרת גלויה');
    await a.close();

    const cdp = await p.context().newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    ok(inst.installabilityErrors.length === 0, 'התקנה: ' + (JSON.stringify(inst.installabilityErrors) || 'אין שגיאות'));

    for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const m = await b.newPage({ viewport: vp, reducedMotion: 'reduce' });
      await mock(m);
      for (const h of ['', '#/intro', '#/t/a1?s=6', '#/t/b3?s=20', '#/gallery', '#/auth', '#/join/tok1']) {
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
