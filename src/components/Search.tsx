import { useEffect, useMemo, useRef, useState } from "react";
import { search, groupTitle } from "../lib/search";
import { go, useRoute } from "../lib/route";
import { order } from "../data/course";
import Rich from "./Rich";

// חיפוש קבוע בסרגל, אותו מקום בכל הדפים. איקס אפור לאיפוס, Esc מאפס, המילה נשמרת במעבר.
export default function Search() {
  const r = useRoute();
  const [q, setQ] = useState(() => r.params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => search(q), [q]);

  useEffect(() => { const u = r.params.get("q"); if (u !== null && u !== q) setQ(u); }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    addEventListener("mousedown", f);
    return () => removeEventListener("mousedown", f);
  }, []);

  const pick = (k: string, i: number) => {
    setOpen(false);
    go(k === "intro" ? "/intro" : `/t/${k}`, { s: i + 1, q });
  };
  const clear = () => {
    setQ(""); setOpen(false);
    if (r.params.get("q")) { const p = Object.fromEntries(r.params); delete p.q; go(r.path, p, true); }
  };
  const counts = order.map((k) => ({ k, n: hits.filter((h) => h.k === k).length })).filter((c) => c.n);

  return (
    <div className="search" ref={box}>
      <input
        className="field" type="search" placeholder="חיפוש בכל השקופיות" aria-label="חיפוש בכל השקופיות" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={(e) => { e.target.select(); if (q) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") clear();
          if (e.key === "Enter" && hits[0]) pick(hits[0].k, hits[0].i);
        }}
      />
      {q && <button className="clear" aria-label="ניקוי החיפוש" onClick={clear}>×</button>}
      {open && q.trim().length >= 2 && (
        <div className="search-pop" role="listbox" aria-label="תוצאות חיפוש">
          {hits.length === 0 ? (
            <div className="search-empty">לא נמצאה שקופית עם "{q}".<br />נסו מילה אחרת, למשל "אגם" או "רשת".</div>
          ) : (
            <>
              <div className="group label"><bdi className="num">{hits.length}</bdi> תוצאות · {counts.map((c) => `${groupTitle(c.k).split(":")[0]} ${c.n}`).join(" · ")}</div>
              {hits.slice(0, 40).map((h) => (
                <button key={`${h.k}-${h.i}`} className="search-hit" role="option" onClick={() => pick(h.k, h.i)}>
                  <Rich q={q}>{h.title}</Rich>
                  <small>{groupTitle(h.k)} · שקף {h.i + 1} · <Rich q={q}>{h.snippet}</Rich></small>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
