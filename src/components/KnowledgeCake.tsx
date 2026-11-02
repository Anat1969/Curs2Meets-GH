// עוגת הידע: הקונספט המאחד של הקורס. לחיצה על פרוסה מציגה את התחנות שעובדות בה.
import { useState } from "react";
import { cake, topics } from "../data/course";
import Rich from "./Rich";

const CX = 160, CY = 160, R = 130;
const arc = (a0: number, a1: number) => {
  const p = (a: number) => [CX + R * Math.sin(a), CY - R * Math.cos(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${CX},${CY} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
};

export default function KnowledgeCake() {
  const [pick, setPick] = useState<string | null>(null);
  let a = 0;
  const parts = cake.map((c) => { const a0 = a; a += c.share * Math.PI * 2; return { ...c, a0, a1: a }; });
  const toggle = (id: string) => setPick((p) => (p === id ? null : id));

  return (
    <div className={`cake ${pick ? "picked" : ""}`}>
      <svg viewBox="-10 -10 340 340" role="img" aria-label="עוגת הידע: אדום יודעים, כתום מכירים ולא יודעים, צהוב לא מכירים">
        <circle cx={CX} cy={CY + 8} r={R} fill="rgba(0,0,0,.08)" />
        {parts.map((c, i) => (
          <path key={c.id} className={`slice ${pick === c.id ? "on" : ""}`} d={arc(c.a0, c.a1)} fill={c.hex} stroke="#fff" strokeWidth="2"
            tabIndex={0} role="button" aria-pressed={pick === c.id} aria-label={c.name}
            onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(c.id); } }}>
            <title>{`${i + 1}. ${c.name}`}</title>
          </path>
        ))}
        {parts.map((c, i) => {
          const m = (c.a0 + c.a1) / 2, rr = R * 0.62;
          return <text key={c.id} x={CX + rr * Math.sin(m)} y={CY - rr * Math.cos(m) + 6} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="20" fontWeight="600" fill="#fff" pointerEvents="none">{i + 1}</text>;
        })}
        <path d={`M${CX + 150},${CY - 20} A150,150 0 1 0 ${CX + 60},${CY + 138}`} fill="none" stroke="var(--ink)" strokeWidth="3" />
        <path d={`M${CX + 52},${CY + 128} l14,12 l-18,6`} fill="none" stroke="var(--ink)" strokeWidth="3" />
      </svg>
      <div className="cake-legend">
        <p className="label">מקרא · לחצו על פרוסה</p>
        {parts.map((c, i) => (
          <button key={c.id} className="press cake-row" aria-pressed={pick === c.id} onClick={() => toggle(c.id)}>
            <i className="sw" style={{ background: c.hex }} />
            <span>
              <b>{i + 1}. {c.name}</b> · {c.role}
              <Rich as="span">{c.text}</Rich>
              {pick === c.id && (
                <span className="src">תחנות: {c.topics.map((k) => topics.find((t) => t.key === k)!.title).join(", ")}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
