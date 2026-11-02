// מציג שקופיות: רצועת תמונות בטור משלה, במה, טקסט מזוקק, מקלדת, מסך מלא, ומצב בכתובת.
import { useCallback, useEffect, useRef, useState } from "react";
import { slides, slideSrc, lessonTitle, type LessonKey } from "../data/course";
import { go, useRoute } from "../lib/route";
import Rich from "./Rich";
import { Prev, Next, Expand, Shrink } from "./icons";

// כל משפט בשורה חדשה. משפט ראשון הוא שורת התובנה. ציטוט ותווית לפני נקודתיים מודגשים.
export function distill(text: string): { lead: string; more: string[] } {
  const bold = (s: string) => s
    .replace(/(["״“][^"״”]{2,90}["״”])/g, "**$1**")
    .replace(/^([^:.,"]{2,28}):\s/, "**$1:** ");
  const parts = text
    .replace(/\s+(?=\d{1,2}\.\s)/g, "\n")
    .split(/(?<=[^\d\s][.!?])\s+(?=[^\d\s])|\n/)
    .map((s) => s.trim()).filter(Boolean);
  const [lead = "", ...more] = parts;
  return { lead: bold(lead), more: more.map(bold) };
}

export default function SlideViewer({ k }: { k: LessonKey }) {
  const r = useRoute();
  const list = slides[k];
  const total = list.length;
  const idx = Math.min(Math.max((Number(r.params.get("s")) || 1) - 1, 0), total - 1);
  const q = r.params.get("q") ?? undefined;
  const [full, setFull] = useState(false);
  const film = useRef<HTMLDivElement>(null);

  const set = useCallback((i: number) => {
    const n = Math.min(Math.max(i, 0), total - 1);
    const p = Object.fromEntries(r.params);
    go(r.path, { ...p, s: n + 1 }, true);
  }, [r, total]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); set(idx + 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); set(idx - 1); }
      if (e.key === "Escape" && full) setFull(false);
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [idx, set, full]);

  useEffect(() => {
    // גלילה בתוך הרצועה בלבד, בלי להזיז את הדף
    const f = film.current, el = f?.querySelector<HTMLElement>('[aria-current="true"]');
    if (f && el) {
      const a = f.getBoundingClientRect(), b = el.getBoundingClientRect();
      f.scrollBy({ top: b.top - a.top - a.height / 2 + b.height / 2, left: b.left - a.left - a.width / 2 + b.width / 2 });
    }
    if (idx + 1 < total) { const im = new Image(); im.src = slideSrc(k, idx + 1); }
  }, [idx, k, total]);

  const s = list[idx];
  const { lead, more } = distill(s.content);

  return (
    <div className={`viewer ${full ? "full" : ""}`} id="slides">
      <div className="film" ref={film} aria-label="כל השקופיות">
        {list.map((x, i) => (
          <button key={i} aria-current={i === idx} onClick={() => set(i)} aria-label={`שקף ${i + 1}: ${x.title}`}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <img src={slideSrc(k, i, true)} alt="" loading="lazy" width={160} height={90} />
            <span className="t">{x.title}</span>
          </button>
        ))}
      </div>
      <div className="stage">
        <div className="stage-top">
          <span className="stage-no">שקף {idx + 1}</span>
          <Rich as="h2" q={q}>{s.title}</Rich>
          <div className="ctrl">
            <button className="icon-btn" onClick={() => set(idx - 1)} disabled={idx === 0} aria-label="השקף הקודם" title="הקודם (חץ ימינה)"><Prev /></button>
            <span className="pos"><bdi className="num">{idx + 1}</bdi> / <bdi className="num">{total}</bdi></span>
            <button className="icon-btn" onClick={() => set(idx + 1)} disabled={idx === total - 1} aria-label="השקף הבא" title="הבא (חץ שמאלה)"><Next /></button>
            <button className="icon-btn" onClick={() => setFull((f) => !f)} aria-label={full ? "יציאה ממסך מלא" : "מסך מלא"} title={full ? "יציאה ממסך מלא (Esc)" : "מסך מלא"}>{full ? <Shrink /> : <Expand />}</button>
          </div>
        </div>
        <div className="slide-frame" onClick={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          set(e.clientX - b.left < b.width / 2 ? idx + 1 : idx - 1);
        }}>
          <img key={idx} src={slideSrc(k, idx)} alt={s.alt} width={1600} height={900} />
          {idx < total - 1 && <span className="half left" aria-hidden="true"><span>הבא</span></span>}
          {idx > 0 && <span className="half right" aria-hidden="true"><span>הקודם</span></span>}
        </div>
        <div className="progress" aria-hidden="true"><i style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
        <div className="slide-text" aria-live="polite">
          <Rich as="p" className="lead" q={q}>{lead}</Rich>
          {more.length > 0 && <p className="more">{more.map((m, i) => <Rich key={i} q={q}>{m}</Rich>)}</p>}
          <p className="src" style={{ marginTop: 10 }}>{lessonTitle(k)} · שקף {idx + 1} מתוך {total} · ניווט בחצים או בלחיצה על חצי השקף</p>
        </div>
      </div>
    </div>
  );
}
