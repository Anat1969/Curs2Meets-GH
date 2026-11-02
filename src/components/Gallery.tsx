// גלריית הכיתה: עבודות הסטודנטים מאותו בסיס נתונים. כולם רואים, רק מחובר/ת מעלה, רק הבעלים מוחק/ת.
import { useCallback, useEffect, useState } from "react";
import { supabase, fetchSubmissions, type Submission } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { toast } from "../lib/toast";
import { topics } from "../data/course";
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
  const { user } = useAuth();
  return (
    <div className="gal">
      {list.map((s) => (
        <div key={s.id} className="press gal-card" role="button" tabIndex={0} onClick={() => onOpen(s)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(s); }}>
          <img src={s.image_url} alt={s.description} loading="lazy" />
          <div className="in">
            <div className="meta"><b>{s.display_name}</b>{showTopic && <span>· {label(s)}</span>}<span className="when">{new Date(s.created_at).toLocaleDateString("he-IL")}</span></div>
            <p>{s.description}</p>
            {user?.id === s.user_id && (
              <button className="press btn" style={{ justifySelf: "start", padding: "4px 10px", fontSize: 13 }}
                onClick={(e) => { e.stopPropagation(); if (confirm("למחוק את העבודה? אי אפשר לשחזר.")) onDelete(s); }}>מחיקה</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function remove(s: Submission) {
  const { error } = await supabase.from("student_submissions").delete().eq("id", s.id);
  if (error) { toast("המחיקה נכשלה: " + error.message); return false; }
  toast("העבודה נמחקה"); return true;
}

export default function TopicGallery({ session, topic }: { session: string; topic: string }) {
  const { user } = useAuth();
  const [list, setList] = useState<Submission[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<Submission | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchSubmissions({ session, topic }).then((l) => { setList(l); setErr(""); })
      .catch(() => { setList([]); setErr("הגלריה לא נטענה. בדקו חיבור לאינטרנט ורעננו את הדף."); });
  }, [session, topic]);
  useEffect(load, [load]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name && !String(data.display_name).includes("@")) setName(data.display_name); });
  }, [user]);

  const submit = async () => {
    if (!user || !file || !desc.trim() || !name.trim()) { toast("חסר שם, תיאור או תמונה"); return; }
    setBusy(true);
    await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error: up } = await supabase.storage.from("submissions").upload(path, await shrink(file), { contentType: "image/jpeg" });
    if (up) { toast("העלאת התמונה נכשלה: " + up.message); setBusy(false); return; }
    const url = supabase.storage.from("submissions").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("student_submissions").insert({ user_id: user.id, session_id: session, topic_id: topic, description: desc.trim(), image_url: url });
    if (error) toast("השמירה נכשלה: " + error.message);
    else { toast("התרגיל עלה לגלריה"); setDesc(""); setFile(null); setPreview(null); load(); }
    setBusy(false);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {user ? (
        <div className="card upload">
          <div style={{ display: "grid", gap: 10 }}>
            <b>שתפו את התרגיל שלכם</b>
            <input className="field" placeholder="השם שיופיע בגלריה" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} aria-label="השם שיופיע בגלריה" />
            <textarea className="field" placeholder="מה עשיתם? איזה פרומפט עבד?" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="תיאור התרגיל" />
            <div><button className="press btn btn-main" onClick={submit} disabled={busy || !file || !desc.trim() || !name.trim()}>{busy ? "מעלה…" : "שיתוף בגלריה"}</button></div>
          </div>
          <label className="drop">
            {preview ? <img src={preview} alt="תצוגה מקדימה" /> : <span>בחירת תמונה<br /><small className="src">התמונה נדחסת לפני ההעלאה</small></span>}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
          </label>
        </div>
      ) : (
        <div className="tone tone-neutral" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ margin: 0 }}>כדי להעלות תרגיל, נכנסים עם אימייל וסיסמה. הצפייה פתוחה לכולם.</p>
          <a className="press btn btn-main" href="#/auth">כניסה לסטודנטים</a>
        </div>
      )}
      <p className="label" style={{ margin: 0 }}>{list === null ? "טוען עבודות…" : <><bdi className="num">{list.length}</bdi> עבודות בתחנה הזו</>}</p>
      {err && <div className="msg err">{err}</div>}
      {list && list.length === 0 && !err && <div className="empty"><b>עדיין אין עבודות בתחנה הזו.</b><span>העבודה הראשונה שתעלה תפתח את הגלריה לכל הכיתה.</span></div>}
      {list && list.length > 0 && <Cards list={list} onOpen={setOpen} onDelete={async (s) => { if (await remove(s)) load(); }} />}
      <Lightbox s={open} onClose={() => setOpen(null)} />
    </div>
  );
}
