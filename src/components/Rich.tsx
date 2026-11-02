// טקסט עשיר: **מודגש**, ==תובנה== (מרקר צהוב), מספרים מודגשים אוטומטית, והדגשת מילת חיפוש.
import { Fragment, type ReactNode } from "react";
import { hitRegex } from "../lib/search";

const TOKEN = /(\*\*[^*]+\*\*|==[^=]+==)/g;
const NUM = /(\d[\d,]*(?:[.:×]\d+)*%?)/g;

function Hits({ text, q }: { text: string; q?: string }): ReactNode {
  const re = q ? hitRegex(q) : null;
  if (!re) return text;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = (m.index ?? 0) + (m[1]?.length ?? 0);
    const word = m[2];
    out.push(text.slice(last, start), <mark key={start} className="hit">{word}</mark>);
    last = start + word.length;
  }
  out.push(text.slice(last));
  return out;
}

function Numbers({ text, q }: { text: string; q?: string }) {
  return (
    <>
      {text.split(NUM).map((part, i) =>
        i % 2 ? <bdi key={i} className="num">{part}</bdi> : <Fragment key={i}><Hits text={part} q={q} /></Fragment>
      )}
    </>
  );
}

export default function Rich({ children, as: Tag = "span", className, q }: { children: string; as?: keyof JSX.IntrinsicElements; className?: string; q?: string }) {
  const parts = String(children).split(TOKEN);
  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**")) return <strong key={i}><Numbers text={part.slice(2, -2)} q={q} /></strong>;
        if (part.startsWith("==")) return <mark key={i} className="insight"><Numbers text={part.slice(2, -2)} q={q} /></mark>;
        return <Numbers key={i} text={part} q={q} />;
      })}
    </Tag>
  );
}

// כל משפט בשורה חדשה
export function Lines({ text, className, q }: { text: string; className?: string; q?: string }) {
  return (
    <span className={`lines ${className ?? ""}`}>
      {text.split("\n").map((l, i) => <Rich key={i} q={q}>{l}</Rich>)}
    </span>
  );
}
