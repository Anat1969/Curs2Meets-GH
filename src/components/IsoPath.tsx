// אובייקט חוויתי: שש תחנות כמדרגות איזומטריות שעולות מן האגם, ומשתקפות בו.
// הטלה איזומטרית ב-SVG (אמינה בכל דפדפן ובצילום). הריחוף מסונכרן עם המקרא.
import { topics, slides, type LessonKey } from "../data/course";
import { go } from "../lib/route";

const C30 = Math.cos(Math.PI / 6), S30 = 0.5, U = 46;
const P = (x: number, y: number, z: number) => [(x - y) * C30 * U, (x + y) * S30 * U - z * U] as const;
const pts = (a: (readonly [number, number])[]) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");

const SHADES = {
  a: { top: "#7FB2C9", left: "#2E6E8E", right: "#1F4F67" },
  b: { top: "#F0A879", left: "#B8571F", right: "#853B12" },
};

// התחנות נעות שמאלה (כיוון הקריאה) ועולות. בין המפגשים יש מרווח: המעבר מכלי לשותף.
const stations = topics.map((t, i) => {
  const step = i * 1.3 + (i >= 3 ? 0.45 : 0);
  return { t, x: -step, y: step, w: 1.05, d: 1.05, h: 0.55 + i * 0.38 };
});

export default function IsoPath({ active, setActive }: { active: LessonKey | null; setActive: (k: LessonKey | null) => void }) {
  const tops = stations.map((s) => P(s.x + s.w / 2, s.y + s.d / 2, s.h));
  const all = stations.flatMap((s) => [P(s.x, s.y, s.h + 1.1), P(s.x + s.w, s.y + s.d, -1.2), P(s.x, s.y + s.d, 0), P(s.x + s.w, s.y, 0)]);
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const vb = [Math.min(...xs) - 30, Math.min(...ys) - 10, Math.max(...xs) - Math.min(...xs) + 60, Math.max(...ys) - Math.min(...ys) + 20];
  const waterY = P(1.05, 1.05, 0)[1];

  const box = (s: (typeof stations)[number], mirror = false) => {
    const c = SHADES[s.t.session];
    const z = (v: number) => (mirror ? -v : v);
    const { x, y, w, d, h } = s;
    return (
      <>
        <polygon points={pts([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, z(h)), P(x, y + d, z(h))])} fill={c.left} />
        <polygon points={pts([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, z(h)), P(x + w, y, z(h))])} fill={c.right} />
        <polygon className="top" points={pts([P(x, y, z(h)), P(x + w, y, z(h)), P(x + w, y + d, z(h)), P(x, y + d, z(h))])} fill={c.top} />
      </>
    );
  };

  return (
    <svg className={`iso ${active ? "dim" : ""}`} viewBox={vb.join(" ")} role="img" aria-label="מסלול הקורס: שש תחנות עולות, שלוש של AI ככלי ושלוש של AI כמחולל">
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB2C9" stopOpacity=".35" />
          <stop offset="1" stopColor="#2E6E8E" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="reflect"><rect x={vb[0]} y={waterY} width={vb[2]} height={vb[3]} fill="url(#fade)" /></mask>
      </defs>
      <rect x={vb[0]} y={waterY} width={vb[2]} height={vb[3] - (waterY - vb[1])} fill="url(#water)" />
      <line x1={vb[0]} x2={vb[0] + vb[2]} y1={waterY} y2={waterY} stroke="#fff" strokeOpacity=".25" />
      <g mask="url(#reflect)" opacity=".4" aria-hidden="true">
        {[...stations].reverse().map((s) => <g key={s.t.key}>{box(s, true)}</g>)}
      </g>
      <polyline className="trail" points={pts(tops.map((p) => [p[0], p[1]] as const))} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" />
      {[...stations].reverse().map((s, ri) => {
        const i = stations.length - 1 - ri;
        const top = tops[i];
        const label = P(s.x + s.w / 2, s.y + s.d / 2, s.h + 0.95);
        return (
          <g key={s.t.key} className={`station ${active === s.t.key ? "on" : ""}`} tabIndex={0} role="link"
            aria-label={`תחנה ${i + 1}: ${s.t.title}, ${s.t.subtitle}`}
            onMouseEnter={() => setActive(s.t.key)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(s.t.key)} onBlur={() => setActive(null)}
            onClick={() => go(`/t/${s.t.key}`)} onKeyDown={(e) => { if (e.key === "Enter") go(`/t/${s.t.key}`); }}>
            {box(s)}
            <text x={top[0]} y={top[1] + 5} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="15" fontWeight="600" fill="#fff">{i + 1}</text>
            <text x={label[0]} y={label[1]} textAnchor="middle" fontFamily="IBM Plex Sans Hebrew, sans-serif" fontSize="17" fontWeight="600" fill="#fff" direction="rtl">{s.t.title}</text>
            <text x={label[0]} y={label[1] + 17} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#fff" fillOpacity=".65">{slides[s.t.key].length}</text>
          </g>
        );
      })}
    </svg>
  );
}
