// גלריית הכיתה: כל אחד מעלה עבודה עם השם שלו, בלי סיסמה ובלי חשבון (בקשת ענת, 04.11.2026).
// מחיקה: רק מהמכשיר שהעלה (מפתח עריכה סמוי), או על ידי מנהלת הכיתה.
import { useCallback, useEffect, useState } from "react";
import { supabase, fetchSubmissions, type Submission } from "../lib/supabase";
import { toast } from "../lib/toast";
import { topics } from "../data/course";
import { useAdmin, useIdentity, getAuthor, setAuthorName, addMyWork, getAdminKey } from "../lib/classroom";
import { Close } from "./icons";

const label = (s: Submission) => {
  const t = topics.find((x) => x.session === s.session_id && String(x.n) === s.topic_id);
  return t ? `${t.title}: ${t.subtitle}` : `${s.session_id}/${s.topic_id}`;
};

// דחיסה בדפדפן: עד 1800 פיקסל, JPEG. העלאה מהירה, גלריה מהירה.
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
  } catch { return file; }
}

export function Lightbox({ s, onClose }: { s: Submission | null; onClose: () => void }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", f); return () => removeEventListener("keydown", f);
  }, [onClose]);
  if (!s) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={s.description} onClick={onClose}>
      <button className="icon-btn x" aria-label="סגירה" onClick={onClose}><Close /></button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={s.image_url} alt={s.description} />
        <figcaption><b>{s.display_name}</b> · {label(s)} · <span className="src">{new Date(s.created_at).toLocaleDateString("he-IL")}</span><br />{s.description}</figcaption>
      </figure>
    </div>
  );
}

export function Cards({ list, onOpen, onDelete, showTopic }: { list: Submission[]; onOpen: (s: Submission) => void; onDelete: (s: Submission) => void; showTopic?: boolean }) {
  const { admin } = useAdmin();
  const { mine } = useIdentity();
  return (
    <div className="gal">
      {list.map((s) => (
        <div key={s.id} className="press gal-card" role="button" tabIndex={0} onClick={() => onOpen(s)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(s); }}>
          <img src={s.image_url} alt={s.description} loading="lazy" />
          <div className="in">
            <div className="meta"><b>{s.display_name}</b>{showTopic && <span>· {label(s)}</span>}<span className="when">{new Date(s.created_at).toLocaleDateString("he-IL")}</span></div>
            <p>{s.description}</p>
            {(mine.includes(s.id) || admin) && (
              <button className="chip" style={{ justifySelf: "start", fontSize: 13 }}
                onClick={(e) => { e.stopPropagation(); if (confirm("למחוק את העבודה? אי אפשר לשחזר.")) onDelete(s); }}>מחיקה</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function remove(s: Submission) {
  for (const k of [getAuthor().key, getAdminKey()].filter(Boolean) as string[]) {
    const { data, error } = await supabase.rpc("remove_submission", { p_id: s.id, p_key: k });
    if (!error && data) { toast("העבודה נמחקה"); return true; }
  }
  toast("המחיקה לא בוצעה. אפשר למחוק רק מהמכשיר שהעלה את העבודה, או מניהול הכיתה.");
  return false;
}

const ERR: Record<string, string> = {
  name: "כתבו שם של 2 עד 60 תווים.",
  description: "כתבו תיאור קצר של העבודה.",
  rate: "הרבה עבודות עלו בשעה האחרונה. נסו שוב בעוד כמה דקות.",
};

export function UploadForm({ session, topic, onDone, picker }: { session: string; topic: string; onDone: () => void; picker?: React.ReactNode }) {
  const me = useIdentity();
  const [name, setName] = useState(me.name);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!name && me.name) setName(me.name); }, [me.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const station = topics.find((t) => t.session === session && String(t.n) === topic);
  const no = station ? topics.indexOf(station) + 1 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || desc.trim().length < 2 || name.trim().length < 2) { toast("חסר שם, תיאור או תמונה"); return; }
    setBusy(true);
    setAuthorName(name);
    const rnd = crypto.getRandomValues(new Uint32Array(2)).join("");
    const path = `open/${Date.now()}-${rnd}.jpg`;
    const { error: up } = await supabase.storage.from("submissions").upload(path, await shrink(file), { contentType: "image/jpeg" });
    if (up) { toast("העלאת התמונה נכשלה: " + up.message); setBusy(false); return; }
    const url = supabase.storage.from("submissions").getPublicUrl(path).data.publicUrl;
    const { data, error } = await supabase.rpc("add_submission", { p_name: name.trim(), p_session: session, p_topic: topic, p_description: desc.trim(), p_image_url: url, p_key: getAuthor().key });
    if (error) toast(ERR[(error.message.match(/name|description|rate/) ?? [""])[0]] ?? "השמירה נכשלה. נסו שוב.");
    else { addMyWork(String(data)); toast(`העבודה עלתה לתחנה ${no}, תחת השם ${name.trim()}`); setDesc(""); setFile(null); setPreview(null); onDone(); }
    setBusy(false);
  };

  return (
    <form className="card upload" id="upload" onSubmit={submit}>
      <div style={{ display: "grid", gap: 10 }}>
        <b style={{ fontSize: 18 }}>העלאת עבודה{station ? ` לתחנה ${no}: ${station.title}` : ""}</b>
        <span className="src">בלי סיסמה ובלי הרשמה. העבודה נשמרת תחת השם שכתבתם, וכולם רואים אותה בגלריה.</span>
        {picker}
        <input className="field" name="name" autoComplete="name" placeholder="השם שלכם" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label="השם שלכם" />
        <textarea className="field" placeholder="מה עשיתם? איזה פרומפט עבד?" value={desc} maxLength={1500} onChange={(e) => setDesc(e.target.value)} aria-label="תיאור העבודה" />
        <div><button className="press btn btn-main" type="submit" disabled={busy || !file || desc.trim().length < 2 || name.trim().length < 2}>{busy ? "מעלה…" : "העלאה לגלריה"}</button></div>
      </div>
      <label className="drop">
        {preview ? <img src={preview} alt="תצוגה מקדימה" /> : <span>בחירת תמונה<br /><small className="src">מהמחשב או מהטלפון. התמונה נדחסת לפני ההעלאה</small></span>}
        <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
      </label>
    </form>
  );
}

export default function TopicGallery({ session, topic }: { session: string; topic: string }) {
  const [list, setList] = useState<Submission[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<Submission | null>(null);

  const load = useCallback(() => {
    fetchSubmissions({ session, topic }).then((l) => { setList(l); setErr(""); })
      .catch(() => { setList([]); setErr("הגלריה לא נטענה. בדקו חיבור לאינטרנט ורעננו את הדף."); });
  }, [session, topic]);
  useEffect(load, [load]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <UploadForm session={session} topic={topic} onDone={load} />
      <p className="label" style={{ margin: 0 }}>{list === null ? "טוען עבודות…" : <><bdi className="num">{list.length}</bdi> עבודות בתחנה הזו</>}</p>
      {err && <div className="msg err">{err}</div>}
      {list && list.length === 0 && !err && <div className="empty"><b>עדיין אין עבודות בתחנה הזו.</b><span>העבודה הראשונה שתעלה תפתח את הגלריה לכל הכיתה.</span></div>}
      {list && list.length > 0 && <Cards list={list} onOpen={setOpen} onDelete={async (s) => { if (await remove(s)) load(); }} />}
      <Lightbox s={open} onClose={() => setOpen(null)} />
    </div>
  );
}
