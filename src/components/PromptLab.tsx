// מעבדת פרומפט: כותבים, רואים את הרמה מתעדכנת, ומשלימים את מה שחסר. נשמר אוטומטית.
import { useMemo } from "react";
import { grade, LEVELS } from "../lib/grade";
import { useSaved } from "../lib/store";
import { toast } from "../lib/toast";
import { Copy } from "./icons";

export default function PromptLab({ id, starter }: { id: string; starter: string }) {
  const [text, setText, saved] = useSaved<string>(`lab:${id}`, starter);
  const g = useMemo(() => grade(text), [text]);
  const missing = g.checks.filter((c) => !c.ok);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast("הפרומפט הועתק. הדביקו אותו בשיחה חדשה."); }
    catch { toast("ההעתקה נחסמה בדפדפן. סמנו את הטקסט והעתיקו ידנית."); }
  };
  const fill = () => setText(`${text.trimEnd()}\n${missing.map((c) => c.fix).join("\n")}`);

  return (
    <div className="lab">
      <div>
        <label className="label" htmlFor={`lab-${id}`}>הפרומפט שלך · נכתב בעברית, כל רכיב בשורה</label>
        <textarea id={`lab-${id}`} className="field" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        <div className="lab-tools">
          <button className="press btn btn-main" onClick={copy}><Copy /> העתקת הפרומפט</button>
          <button className="press btn" onClick={fill} disabled={!missing.length}>השלמת מה שחסר ({missing.length})</button>
          <button className="press btn" onClick={() => setText(starter)}>חזרה לפתיחה</button>
          <span className="saved" style={{ opacity: saved ? 1 : 0 }}>נשמר</span>
          <span className="src" style={{ marginInlineStart: "auto" }}><bdi className="num">{g.words}</bdi> מילים</span>
        </div>
        <p className="method">
          <b>על מה זה נשען:</b> ארבע רמות הניסוח ושלוש רמות ההנחיה מההקדמה, ועקרונות הנדסת פרומפטים מוכרים: תפקיד, הקשר, קלט, פורמט ופעלי חשיבה.<br />
          <b>איך המדידה אמינה:</b> כל בדיקה היא כלל טקסטואלי גלוי, שרץ בדפדפן ונותן אותה תוצאה בכל פעם.<br />
          <b>המגבלה:</b> המנוע בודק מבנה, לא איכות. נכונות, מקוריות והתאמה לפרויקט לא נמדדות, ונשארות לשיקול דעתך.
        </p>
      </div>
      <div className="card" aria-live="polite">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="label">הערכה אוטומטית</span>
          <span style={{ marginInlineStart: "auto", fontFamily: "var(--mono)", fontSize: 28, fontWeight: 600 }}><bdi>{g.score}</bdi><span style={{ fontSize: 14, color: "var(--ink-mute)" }}> / {g.max}</span></span>
        </div>
        <div className="levels" aria-label={`רמת ניסוח ${g.level} מתוך 4`}>
          {LEVELS.map((l) => (
            <div key={l.n} className={l.n === g.level ? "cur" : l.n < g.level ? "on" : ""}><b>{l.n}</b>{l.name}<br /><small>{l.text}</small></div>
          ))}
        </div>
        <div className="checks">
          {g.checks.map((c) => (
            <div key={c.id} className={`check ${c.ok ? "ok" : "no"}`}>
              <span className="mk" aria-hidden="true">{c.ok ? "+" : "−"}</span>
              <div><b>{c.name}</b><p>{c.what} {c.ok ? "נמצא." : <>חסר. לדוגמה: <i>{c.fix}</i></>}</p><p>נמדד כך: {c.how}</p></div>
              <span className="pts">{c.ok ? c.pts : 0}/{c.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
