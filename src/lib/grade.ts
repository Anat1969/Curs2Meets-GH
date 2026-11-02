// הערכה אוטומטית של פרומפט. דטרמיניסטית, בלי שרת, ומסבירה את עצמה.
// נשענת על "ארבע רמות הניסוח" ועל "שלוש רמות ההנחיה" שבהקדמה לקורס,
// ועל עקרונות הנדסת פרומפטים מוכרים: תפקיד, הקשר, קלט, פורמט פלט, דוגמה וגבולות
// (Anthropic, Prompt engineering overview; OpenAI, Prompt engineering guide).
// מה שלא נמדד בקוד: האם התוכן נכון, מקורי או מתאים לפרויקט. את זה קובעת את.

export interface Check { id: string; name: string; pts: number; ok: boolean; what: string; how: string; fix: string }
export interface Grade { score: number; max: number; level: 1 | 2 | 3 | 4; checks: Check[]; words: number }

const has = (t: string, re: RegExp) => re.test(t);

export const LEVELS = [
  { n: 1, name: "בסיסי", text: "משפט אחד: \"אני…\"" },
  { n: 2, name: "משודרג", text: "תפקיד, הקשר ובקשה" },
  { n: 3, name: "מובנה", text: "קלט, פלט ופרמטרים" },
  { n: 4, name: "ממקסם", text: "פעלי חשיבה וגבולות" },
] as const;

export const VERBS = ["זקק", "חלץ", "פענח", "סנתז", "מפה", "חשוף", "בחן", "התווה", "שכלל", "הפתע", "ערער", "פרק", "הרכב"];

export function grade(text: string): Grade {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const lines = t.split("\n").filter((l) => l.trim()).length;
  const checks: Check[] = [
    { id: "role", name: "תפקיד ל-AI", pts: 15, ok: has(t, /(^|\s)(אתה|את|את\/ה|you are|act as|בתפקיד|כמומחה|משמש כ)/i),
      what: "האם ה-AI יודע מי הוא בשיחה.", how: "מחפש פתיחה כמו \"אתה…\", \"בתפקיד…\" או \"You are\".", fix: "אתה [מקצוע], מומחה ב[תחום]." },
    { id: "me", name: "מי אני (הקשר)", pts: 10, ok: has(t, /(^|\s)(אני|אנחנו|מי אתם|הרקע שלי|הלקוח|I am|I'm)/i),
      what: "האם ה-AI יודע למי הוא עונה ולמה.", how: "מחפש \"אני…\", \"אנחנו…\" או תיאור הלקוח.", fix: "אני [מקצוע] שעובדת על [פרויקט]." },
    { id: "input", name: "קלט מוגדר", pts: 15, ok: has(t, /(קלט|input|אעלה|מצורף|תמונה|קובץ|המשתמש יעלה|נתון|נתונים|אתגר|ייעוד|שפה:)/i),
      what: "האם ברור על מה ה-AI עובד.", how: "מחפש \"קלט\", \"אעלה\", \"תמונה\", \"קובץ\" או \"נתונים\".", fix: "קלט: [תמונה / טקסט / נתון]." },
    { id: "output", name: "פלט ופורמט", pts: 15, ok: has(t, /(פלט|output|פורמט|טבלה|רשימה|ממוספר|נקודות|מסמך|מחשבון|ממשק|פרומפט לתמונה|לוח|סעיפים|שלב \d)/i),
      what: "האם ברור מה יוצא ובאיזו צורה.", how: "מחפש \"פלט\", \"פורמט\", \"טבלה\", \"רשימה\" או שלבים ממוספרים.", fix: "פלט: [טבלה / 3 לוחות / ממשק], בעברית." },
    { id: "params", name: "פרמטרים מדידים", pts: 10, ok: has(t, /\d/) || has(t, /(יחס|גודל|מילים|שורות|אורך)/),
      what: "האם יש מספר, יחס או כמות שאפשר לבדוק.", how: "מחפש ספרה או מילה כמו \"יחס\", \"אורך\", \"מילים\".", fix: "3 חלופות, עד 120 מילים, יחס 16:9." },
    { id: "style", name: "סגנון ורפרנס", pts: 10, ok: has(t, /(בסגנון|כמו |השראה|רפרנס|style|in the style|בהשראת)/i) || has(t, /\b[A-Z][a-z]+ [A-Z][a-z]+\b/),
      what: "האם יש כיוון אסתטי או שם יוצר.", how: "מחפש \"בסגנון\", \"בהשראת\" או שם לועזי של יוצר.", fix: "בסגנון [אדריכל / צלם / תנועה]." },
    { id: "verbs", name: "פעלי חשיבה", pts: 15, ok: VERBS.some((v) => t.includes(v)),
      what: "האם יש פועל שמכוון את סוג החשיבה.", how: `מחפש אחד מ: ${VERBS.join(", ")}.`, fix: "זקק את העיקר, חלץ 3 עקרונות, ערער על ההנחה." },
    { id: "limits", name: "גבולות", pts: 5, ok: has(t, /(אל |בלי|ללא|אסור|לא ל|רק |avoid|don't|do not)/i),
      what: "האם ה-AI יודע מה לא לעשות.", how: "מחפש \"אל\", \"בלי\", \"ללא\", \"רק\".", fix: "בלי קלישאות, אל תחזור על עצמך." },
    { id: "structure", name: "מבנה בשורות", pts: 5, ok: lines >= 3,
      what: "האם הפרומפט מחולק לחלקים קריאים.", how: "סופר שורות לא ריקות: לפחות 3.", fix: "כל רכיב בשורה משלו." },
  ];
  const max = checks.reduce((s, c) => s + c.pts, 0);
  const score = checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0);
  const ok = (id: string) => checks.find((c) => c.id === id)!.ok;
  let level: Grade["level"] = 1;
  if (ok("role") && (ok("me") || ok("input"))) level = 2;
  if (level === 2 && ok("input") && ok("output") && ok("params")) level = 3;
  if (level === 3 && ok("verbs") && ok("limits")) level = 4;
  return { score, max, level, checks, words };
}
