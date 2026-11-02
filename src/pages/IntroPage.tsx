import { useEffect } from "react";
import { introSummary, templates, introKnowledge } from "../data/course";
import SlideViewer from "../components/SlideViewer";
import KnowledgeCake from "../components/KnowledgeCake";
import PromptLab from "../components/PromptLab";
import Feature from "../components/Feature";
import Rich from "../components/Rich";
import { toast } from "../lib/toast";
import { Copy } from "../components/icons";

const SECTIONS = [["slides", "השקופיות"], ["summary", "הסיכום"], ["templates", "שלוש רמות הנחיה"], ["lab", "מעבדת פרומפט"], ["knowledge", "ידע והשראה"]] as const;

export default function IntroPage() {
  useEffect(() => { document.title = "הקדמה · מכלי לשותף"; }, []);
  const copy = async (t: string, name: string) => {
    try { await navigator.clipboard.writeText(t); toast(`תבנית ${name} הועתקה`); } catch { toast("ההעתקה נחסמה. סמנו והעתיקו ידנית."); }
  };
  return (
    <main className="page">
      <div className="crumbs"><a href="#/">מכלי לשותף</a> / הקדמה</div>
      <h1 className="page-title">הקדמה: פרומפט הוא כלי לחידוד החשיבה.</h1>
      <p className="page-sub">עוגת הידע, חשיבה מהירה ואיטית, ושלוש רמות של הנחיה. מכאן יוצאים לשש התחנות.</p>

      <nav className="subnav tabs" aria-label="חלקי ההקדמה">
        {SECTIONS.map(([id, label], n) => (
          <button key={id} className="tab" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="section-no">{n + 1}</span> {label}</button>
        ))}
      </nav>

      <SlideViewer k="intro" />

      <section className="section" id="summary">
        <div className="section-head"><span className="section-no">2</span><h2>שש תובנות מההקדמה</h2><span className="label">סיכום</span></div>
        <div className="grid-3">
          {introSummary.map((s, i) => (
            <div key={s.term} className={`tone ${i === 0 ? "tone-insight" : "tone-neutral"} rise`} style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="label">{String(i + 1).padStart(2, "0")}</span><h4>{s.term}</h4><Rich as="p">{s.text}</Rich>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}><KnowledgeCake /></div>
      </section>

      <section className="section" id="templates">
        <div className="section-head"><span className="section-no">3</span><h2>שלוש רמות הנחיה: מהכללי לשיחה.</h2><span className="label">תרגיל הקדמה · תבניות להעתקה</span></div>
        <p className="page-sub">העתיקו כל תבנית, מלאו את השדות, והדביקו בממשק ה-AI שלכם: <b>Setting</b> פעם אחת, <b>Project</b> לכל פרויקט, <b>Custom Instructions</b> לכל שיחה.</p>
        <div className="grid-3">
          {templates.map((t) => (
            <div key={t.key} className="card tpl">
              <header><div><span className="label">{t.level}</span><br /><b>{t.title}</b></div><button className="press btn" onClick={() => copy(t.text, t.title.split(":")[0])}><Copy /> העתקה</button></header>
              <pre>{t.text}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="lab">
        <div className="section-head"><span className="section-no">4</span><h2>מעבדת פרומפט: ארבע רמות ניסוח.</h2><span className="label">כלי · הערכה שמסבירה את עצמה</span></div>
        <p className="page-sub">כתבו פרומפט בסיסי, "אני רוצה…", וראו מה חסר כדי לעלות רמה.</p>
        <PromptLab id="intro" starter={"אני רוצה רעיון לעיצוב סלון."} />
      </section>

      <section className="section" id="knowledge">
        <div className="section-head"><span className="section-no">5</span><h2>ידע והשראה</h2><span className="label">ציטוט · תובנה · הייקו · עיר · פוסט</span></div>
        <Feature k="intro" item={introKnowledge} />
      </section>

      <nav className="section pager" style={{ justifyContent: "flex-end" }}><a className="press" href="#/t/a1" style={{ textAlign: "left" }}><small>התחנה הראשונה</small>השראה: מרעיון לביצוע</a></nav>
    </main>
  );
}
