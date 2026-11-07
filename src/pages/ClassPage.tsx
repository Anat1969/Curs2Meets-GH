// ניהול הכיתה (למנהלת בלבד): ייבוא רשימה, קישור אישי לכל אחד, שליחה בוואטסאפ או במייל, ומעקב הצטרפות.
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSaved } from "../lib/store";
import { toast } from "../lib/toast";
import {
  useAdmin, setAdminKey, parseRoster, prettyPhone, fill, waLink, mailLink, joinLink, toCsv, DEFAULT_MESSAGE,
  type RosterRow, type Parsed,
} from "../lib/classroom";

type Filter = "all" | "new" | "invited" | "joined";
const status = (r: RosterRow): Exclude<Filter, "all"> => (r.joined_at ? "joined" : r.invited_at ? "invited" : "new");
const STATUS_NAME = { new: "לא הוזמנו", invited: "הוזמנו", joined: "פתחו את הקישור" } as const;

export default function ClassPage() {
  const m = useAdmin();
  const key = m.key ?? "";
  const [rows, setRows] = useState<RosterRow[] | null>(null);
  const [paste, setPaste] = useState("");
  const [tpl, setTpl, tplSaved] = useSaved<string>("class:message", DEFAULT_MESSAGE);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = "ניהול הכיתה · מכלי לשותף"; }, []);

  const load = useCallback(() => {
    supabase.rpc("roster_list", { p_key: key }).then(({ data, error }) => {
      if (error) { toast("הרשימה לא נטענה: " + error.message); setRows([]); } else setRows((data ?? []) as RosterRow[]);
    });
  }, [key]);
  useEffect(() => { if (m.admin) load(); }, [m.admin, load]);

  const parsed = useMemo(() => parseRoster(paste), [paste]);
  const existing = useMemo(() => new Set((rows ?? []).flatMap((r) => [r.email, r.phone].filter(Boolean) as string[])), [rows]);
  const preview: Parsed[] = parsed.map((p) => (!p.issue && ((p.email && existing.has(p.email)) || (p.phone && existing.has(p.phone))) ? { ...p, issue: "כבר ברשימה" } : p));
  const good = preview.filter((p) => !p.issue);

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("roster_add", { p_key: key, p_rows: good.map((p) => ({ name: p.name, email: p.email ?? "", phone: p.phone ?? "" })) });
    setBusy(false);
    if (error) { toast("ההוספה נכשלה: " + error.message); return; }
    toast(`${good.length} נוספו לרשימה`); setPaste(""); load();
  };

  const mark = async (r: RosterRow, via: "whatsapp" | "email" | "link") => {
    if (r.invited_at) return;
    const now = new Date().toISOString();
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, invited_at: now, invited_via: via } : x)) ?? rs);
    await supabase.rpc("roster_mark", { p_key: key, p_id: r.id, p_via: via });
  };
  const open = (r: RosterRow, via: "whatsapp" | "email") => {
    const text = fill(tpl, r);
    window.open(via === "whatsapp" ? waLink(r.phone!, text) : mailLink(r.email!, text), "_blank", "noopener");
    mark(r, via);
  };
  const copy = async (r: RosterRow) => {
    try { await navigator.clipboard.writeText(fill(tpl, r)); toast(`ההודעה של ${r.name} הועתקה`); mark(r, "link"); }
    catch { toast("ההעתקה נחסמה. הקישור: " + joinLink(r.token)); }
  };
  const remove = async (r: RosterRow) => {
    if (!confirm(`להסיר את ${r.name} מהרשימה? הקישור האישי יפסיק לעבוד.`)) return;
    const { error } = await supabase.rpc("roster_remove", { p_key: key, p_id: r.id });
    if (error) toast("ההסרה נכשלה: " + error.message); else { toast(`${r.name} הוסר/ה`); load(); }
  };
  const nextWa = () => {
    const n = (rows ?? []).find((r) => r.role === "student" && !r.invited_at && r.phone);
    if (n) open(n, "whatsapp"); else toast("כל מי שיש לו טלפון כבר הוזמן");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows ?? [])], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "רשימת-הכיתה-עם-קישורים.csv" });
    a.click(); URL.revokeObjectURL(url);
  };
  const readFile = (f: File) => f.text().then(setPaste);

  if (!m.ready) return <main className="page"><p className="label">בודק הרשאה…</p></main>;
  if (!m.admin) return (
    <main className="page"><div className="empty" style={{ marginTop: 40 }}>
      <b>הדף הזה למנהלת הכיתה בלבד.</b>
      <span>פתחי פעם אחת את קישור המנהלת האישי שלך, והניהול ייפתח במכשיר הזה. בלי סיסמה.</span>
    </div></main>
  );

  const list = (rows ?? []).filter((r) => r.role === "student");
  const counts = { all: list.length, new: list.filter((r) => status(r) === "new").length, invited: list.filter((r) => status(r) === "invited").length, joined: list.filter((r) => status(r) === "joined").length };
  const shown = list.filter((r) => filter === "all" || status(r) === filter);

  return (
    <main className="page">
      <div className="crumbs"><a href="#/">מכלי לשותף</a> / ניהול הכיתה</div>
      <h1 className="page-title">ניהול הכיתה: מרשימה לכיתה בשלושה צעדים.</h1>
      <p className="page-sub">מדביקים רשימה, שולחים לכל אחד קישור אישי, ורואים מי פתח אותו.<br />בלי סיסמה ובלי הרשמה: הקישור שומר את השם במכשיר, והעבודות עולות תחת השם הזה.<br /><span className="src">הניהול פתוח במכשיר הזה בזכות הקישור האישי שלך. <button className="chip muted" onClick={() => { setAdminKey(null); }}>סגירת הניהול במכשיר הזה</button></span></p>

      <div className="kpi-row" aria-label="הכיתה במספרים">
        <div><b>{counts.all}</b><span>ברשימה</span></div>
        <div><b>{counts.invited + counts.joined}</b><span>הוזמנו</span></div>
        <div className="ok"><b>{counts.joined}</b><span>פתחו את הקישור</span></div>
      </div>

      <section className="section" id="import">
        <div className="section-head"><span className="section-no">1</span><h2>הדבקת הרשימה</h2><span className="label">מאקסל, מ-Google Sheets או מקובץ CSV</span></div>
        <div className="lab">
          <div>
            <label className="label" htmlFor="roster-paste">שם, מייל וטלפון בכל שורה · בכל סדר · אפשר רק מייל או רק טלפון</label>
            <textarea id="roster-paste" className="field" style={{ minHeight: 200 }} value={paste} onChange={(e) => setPaste(e.target.value)}
              placeholder={"נועה כהן\tnoa@gmail.com\t050-1234567\nדניאל לוי\tdaniel@gmail.com\nמאיה פרץ\t052-7654321"} />
            <div className="lab-tools">
              <label className="press btn" style={{ cursor: "pointer" }}>בחירת קובץ CSV<input type="file" accept=".csv,.tsv,.txt,text/csv" hidden onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} /></label>
              {paste && <button className="chip" onClick={() => setPaste("")}>ניקוי</button>}
            </div>
            <p className="method"><b>מאקסל או מ-Sheets:</b> מסמנים את העמודות, מעתיקים (Ctrl+C) ומדביקים כאן.<br /><b>טלפון:</b> אפשר עם מקפים או בלי, 05X או 972+. המערכת מתקנת לפורמט של וואטסאפ.<br /><b>פרטיות:</b> הרשימה גלויה רק לך. סטודנט/ית רואה רק את השורה שלו/ה.</p>
          </div>
          <div className="card" aria-live="polite">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="label">תצוגה מקדימה</span>
              <span className="src" style={{ marginInlineStart: "auto" }}><bdi className="num">{good.length}</bdi> תקינים · <bdi className="num">{preview.length - good.length}</bdi> לתיקון</span>
            </div>
            {preview.length === 0 ? <p className="src" style={{ margin: "16px 0" }}>הרשימה תופיע כאן ברגע שתדביקי אותה.</p> : (
              <div className="mini-wrap"><table className="roster mini"><tbody>
                {preview.map((p, i) => (
                  <tr key={i} className={p.issue ? "bad" : ""}>
                    <td><b>{p.name || "—"}</b></td>
                    <td dir="ltr">{p.email ?? ""}</td>
                    <td dir="ltr">{p.phone ? prettyPhone(p.phone) : ""}</td>
                    <td>{p.issue ? <span className="tag-bad">{p.issue}</span> : <span className="tag-ok">תקין</span>}</td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
            <button className="press btn btn-main" style={{ marginTop: 12 }} onClick={add} disabled={busy || !good.length}>{busy ? "מוסיף…" : `הוספת ${good.length} לרשימה`}</button>
          </div>
        </div>
      </section>

      <section className="section" id="send">
        <div className="section-head"><span className="section-no">2</span><h2>שליחת הקישור האישי</h2><span className="label">וואטסאפ · מייל · העתקה</span></div>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span className="label">נוסח ההודעה · {"{שם}"} ו-{"{קישור}"} מתחלפים לכל אחד <span className="saved" style={{ opacity: tplSaved ? 1 : 0 }}>נשמר</span></span>
            <textarea className="field" style={{ minHeight: 150 }} value={tpl} onChange={(e) => setTpl(e.target.value)} />
          </label>
          <div className="tone tone-neutral">
            <h4>איך שולחים לכל הכיתה</h4>
            <p><b>וואטסאפ:</b> "לבא בתור" פותח שיחה מוכנה עם ההודעה. לוחצים שלח בוואטסאפ, חוזרים, ושוב "לבא בתור".<br />
              <b>מייל:</b> כפתור המייל בכל שורה פותח מייל מוכן. לשליחה לכולם בבת אחת: הורידי את הקובץ עם הקישורים, וצרי מיזוג דואר ב-Gmail.<br />
              <b>הכול בחינם,</b> מהטלפון ומהמייל שלך. שום הודעה לא נשלחת בלי לחיצה שלך.</p>
            <div className="lab-tools">
              <button className="press btn btn-main" onClick={nextWa} disabled={!list.some((r) => !r.invited_at && r.phone)}>וואטסאפ לבא בתור</button>
              <button className="press btn" onClick={download} disabled={!list.length}>הורדת הרשימה עם הקישורים</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="list">
        <div className="section-head"><span className="section-no">3</span><h2>מי פתח את הקישור</h2>
          <div className="chips" role="group" aria-label="סינון לפי מצב" style={{ marginInlineStart: "auto" }}>
            {(["all", "new", "invited", "joined"] as Filter[]).map((f) => (
              <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(filter === f && f !== "all" ? "all" : f)}>{f === "all" ? "הכול" : STATUS_NAME[f]}<bdi className="num">{counts[f]}</bdi></button>
            ))}
          </div>
        </div>
        {rows === null ? <p className="label">טוען…</p> : list.length === 0 ? (
          <div className="empty"><b>הרשימה עוד ריקה.</b><span>הדביקי שמות למעלה, בצעד 1.</span></div>
        ) : (
          <div className="table-wrap">
            <table className="roster">
              <thead><tr><th>שם</th><th>מייל</th><th>טלפון</th><th>מצב</th><th>שליחה</th><th></th></tr></thead>
              <tbody>
                {shown.map((r) => {
                  const s = status(r);
                  return (
                    <tr key={r.id}>
                      <td><b>{r.name}</b></td>
                      <td dir="ltr">{r.email ?? ""}</td>
                      <td dir="ltr">{r.phone ? prettyPhone(r.phone) : ""}</td>
                      <td><span className={`state state-${s}`}>{s === "joined" ? "הצטרף/ה" : s === "invited" ? `הוזמן/ה${r.invited_via === "whatsapp" ? " בוואטסאפ" : r.invited_via === "email" ? " במייל" : ""}` : "לא הוזמן/ה"}</span></td>
                      <td className="acts"><div>
                        <button className="chip" disabled={!r.phone} onClick={() => open(r, "whatsapp")} title={r.phone ? "פתיחת וואטסאפ עם ההודעה" : "אין טלפון"}>וואטסאפ</button>
                        <button className="chip" disabled={!r.email} onClick={() => open(r, "email")} title={r.email ? "פתיחת מייל מוכן" : "אין מייל"}>מייל</button>
                        <button className="chip" onClick={() => copy(r)} title="העתקת ההודעה עם הקישור">העתקה</button>
                      </div></td>
                      <td><button className="chip muted" onClick={() => remove(r)} aria-label={`הסרת ${r.name}`}>הסרה</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
