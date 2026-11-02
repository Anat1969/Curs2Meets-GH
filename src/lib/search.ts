// חיפוש בעברית: התאמה בתחילת מילה, גם אחרי אותיות שימוש (ה, ו, ב, כ, ל, מ, ש).
// מילה עד 3 אותיות חייבת להיות שלמה, כדי ש"אור" לא יתפוס "תאוריה".
import { order, slides, lessonTitle, type LessonKey } from "../data/course";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function hitRegex(q: string): RegExp | null {
  const t = q.trim();
  if (t.length < 2) return null;
  const tail = t.length <= 3 ? "(?![\\u0590-\\u05FFA-Za-z])" : "";
  return new RegExp(`((?:^|[^\\u0590-\\u05FFA-Za-z0-9])[הובכלמש]{0,2})(${esc(t)}${tail})`, "gi");
}

export interface Hit { k: LessonKey; i: number; title: string; snippet: string }

export function search(q: string): Hit[] {
  const re = hitRegex(q);
  if (!re) return [];
  const out: Hit[] = [];
  for (const k of order) {
    slides[k].forEach((s, i) => {
      const text = `${s.title}. ${s.content}`;
      re.lastIndex = 0;
      const m = re.exec(" " + text);
      if (m) {
        const at = Math.max(0, (m.index ?? 0) - 30);
        out.push({ k, i, title: s.title, snippet: (at > 0 ? "…" : "") + text.slice(at, at + 90) + "…" });
      }
    });
  }
  return out;
}

export const groupTitle = lessonTitle;
