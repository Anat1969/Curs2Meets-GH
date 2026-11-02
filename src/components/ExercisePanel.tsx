// תרגיל כלולאה: מחשבה, מעשה ורישום. השלבים מסומנים, היומן נשמר, והדוגמה פותחת את השקף.
import type { Exercise, LessonKey } from "../data/course";
import { slideSrc } from "../data/course";
import { useSaved } from "../lib/store";
import { go } from "../lib/route";
import Rich from "./Rich";
import { Arrow } from "./icons";

export default function ExercisePanel({ k, ex }: { k: LessonKey; ex: Exercise }) {
  const [done, setDone] = useSaved<number[]>(`steps:${k}`, []);
  const [log, setLog, saved] = useSaved<{ think: string; do: string; note: string }>(`journal:${k}`, { think: "", do: "", note: "" });
  const toggle = (i: number) => setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i]);
  const toSlide = (i: number) => { go(`/t/${k}`, { s: i + 1 }, true); document.getElementById("slides")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const pct = Math.round((done.length / ex.steps.length) * 100);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="meter" style={{ marginBottom: 14 }}>
            <span><bdi className="num">{done.length}</bdi> מתוך <bdi className="num">{ex.steps.length}</bdi> שלבים</span>
            <span className="bar"><i style={{ width: `${pct}%` }} /></span>
          </div>
          <ol className="chain">
            {ex.steps.map((s, i) => (
              <li key={i} className={done.includes(i) ? "done" : ""}>
                <button className="step-btn" aria-pressed={done.includes(i)} aria-label={`שלב ${i + 1}: ${done.includes(i) ? "בוצע" : "סימון כבוצע"}`} onClick={() => toggle(i)}>{i + 1}</button>
                <span className="txt">{s}</span>
              </li>
            ))}
          </ol>
          <p className="src">לחיצה על מספר מסמנת שלב כבוצע. הסימון נשמר במכשיר שלך.</p>
        </div>
        <div>
          <p className="label" style={{ margin: "0 0 8px" }}>דוגמה מהמצגת · מקלט לפלט</p>
          <div className="io">
            <button className="press io-card" onClick={() => toSlide(ex.input.slide)}>
              <img src={slideSrc(k, ex.input.slide)} alt={ex.input.label} loading="lazy" />
              <span className="in"><b>{ex.input.label}</b><Rich as="p">{ex.input.text}</Rich><span className="go">לשקף {ex.input.slide + 1}</span></span>
            </button>
            <span className="arrow" aria-hidden="true"><Arrow /></span>
            <button className="press io-card" onClick={() => toSlide(ex.output.slide)}>
              <img src={slideSrc(k, ex.output.slide)} alt={ex.output.label} loading="lazy" />
              <span className="in"><b>{ex.output.label}</b><Rich as="p">{ex.output.text}</Rich><span className="go">לשקף {ex.output.slide + 1}</span></span>
            </button>
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>היומן שלי: מחשבה, מעשה, רישום.</h3>
          <span className="saved" style={{ opacity: saved ? 1 : 0 }}>נשמר</span>
        </div>
        <div className="journal">
          <label><b>מחשבה</b><span>מה רציתי לגלות?</span><textarea className="field" value={log.think} onChange={(e) => setLog({ ...log, think: e.target.value })} /></label>
          <label><b>מעשה</b><span>מה ביקשתי, ומה ה-AI החזיר?</span><textarea className="field" value={log.do} onChange={(e) => setLog({ ...log, do: e.target.value })} /></label>
          <label><b>רישום</b><span>מה אני לוקחת לתחנה הבאה?</span><textarea className="field" value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })} /></label>
        </div>
      </div>
    </div>
  );
}
