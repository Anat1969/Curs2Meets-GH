import { useEffect, useMemo, useState } from "react";
import { fetchSubmissions, type Submission } from "../lib/supabase";
import { topics } from "../data/course";
import { Cards, Lightbox, remove, UploadForm } from "../components/Gallery";

// בורר: "הכול" מאפס, כל לחיצה מחליפה, לחיצה על הנבחר מחזירה ל"הכול".
function Picker({ label, items, value, set }: { label: string; items: { id: string; name: string; n: number }[]; value: string | null; set: (v: string | null) => void }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      <span className="label" style={{ marginInlineEnd: 6 }}>{label}</span>
      <button className="chip" aria-pressed={value === null} onClick={() => set(null)}>הכול</button>
      {items.map((x) => <button key={x.id} className="chip" aria-pressed={value === x.id} onClick={() => set(value === x.id ? null : x.id)}>{x.name}<bdi className="num">{x.n}</bdi></button>)}
    </div>
  );
}

export default function GalleryPage() {
  const [list, setList] = useState<Submission[] | null>(null);
  const [err, setErr] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [who, setWho] = useState<string | null>(null);
  const [open, setOpen] = useState<Submission | null>(null);
  const [up, setUp] = useState(topics[0].key as string);
  const upT = topics.find((t) => t.key === up)!;
  const load = () => fetchSubmissions().then(setList).catch(() => { setList([]); setErr("הגלריה לא נטענה. בדקו חיבור לאינטרנט ורעננו את הדף."); });
  useEffect(() => { document.title = "העלאה וגלריה · מכלי לשותף"; load(); }, []);

  const key = (s: Submission) => `${s.session_id}${s.topic_id}`;
  const shown = useMemo(() => (list ?? []).filter((s) => (!topic || key(s) === topic) && (!who || s.display_name === who)), [list, topic, who]);
  const topicItems = topics.map((t) => ({ id: `${t.session}${t.n}`, name: t.title, n: (list ?? []).filter((s) => key(s) === `${t.session}${t.n}`).length }));
  const people = [...new Set((list ?? []).map((s) => s.display_name ?? ""))].map((p) => ({ id: p, name: p, n: (list ?? []).filter((s) => s.display_name === p).length }));

  return (
    <main className="page">
      <div className="crumbs"><a href="#/">מכלי לשותף</a> / העלאה וגלריה</div>
      <h1 className="page-title">העלאה וגלריה: מה יצא מהתרגילים.</h1>
      <p className="page-sub">בוחרים תחנה, כותבים שם ומעלים תמונה. בלי סיסמה.<br />למטה כל העבודות מכל התחנות.</p>
      <div style={{ marginBottom: 24 }}>
        <UploadForm session={upT.session} topic={String(upT.n)} onDone={load} picker={
          <div className="chips" role="group" aria-label="לאיזו תחנה">
            <span className="label" style={{ marginInlineEnd: 6 }}>לאיזו תחנה</span>
            {topics.map((t, i) => <button type="button" key={t.key} className="chip" aria-pressed={up === t.key} onClick={() => setUp(t.key)}>{i + 1} · {t.title}</button>)}
          </div>
        } />
      </div>
      <div className="card" style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <Picker label="תחנה" items={topicItems} value={topic} set={setTopic} />
        {people.length > 1 && <Picker label="יוצר/ת" items={people} value={who} set={setWho} />}
      </div>
      {err && <div className="msg err">{err}</div>}
      {list === null && <p className="label">טוען עבודות…</p>}
      {list && shown.length === 0 && !err && <div className="empty"><b>אין עבודות בבחירה הזו.</b><span>נסו "הכול", או העלו עבודה מתוך אחת התחנות.</span></div>}
      {shown.length > 0 && <Cards list={shown} showTopic onOpen={setOpen} onDelete={async (s) => { if (await remove(s)) load(); }} />}
      <Lightbox s={open} onClose={() => setOpen(null)} />
    </main>
  );
}
