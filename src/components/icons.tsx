// סט אייקוני קו אחד: 24×24, קו 1.75, בצבע הנושא. אייקון לכל נושא ולתפעול.
import type { LessonKey } from "../data/course";

const S = (p: { children: React.ReactNode; title?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden={p.title ? undefined : true} role={p.title ? "img" : undefined}>
    {p.title && <title>{p.title}</title>}{p.children}
  </svg>
);

export const TopicIcon = ({ k }: { k: LessonKey }) => {
  switch (k) {
    case "intro": return <S><circle cx="12" cy="12" r="8" /><path d="M12 4v8l6 4" /></S>; // עוגת הידע
    case "a1": return <S><path d="M3 18l5-7 4 5 3-4 6 6" /><circle cx="17" cy="7" r="2.5" /><path d="M3 21h18" /></S>; // נוף ואגם
    case "a2": return <S><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 17.5h7M17.5 14v7" /></S>; // פירוק והרכבה
    case "a3": return <S><path d="M4 20L20 4" /><path d="M14 4h6v6" /><path d="M4 14v6h6" /><path d="M8 16l-2-2M12 12l-2-2M16 8l-2-2" /></S>; // סרגל מקצועי
    case "b1": return <S><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15" /><path d="M5 19l8-8" /></S>; // עלה
    case "b2": return <S><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="12" cy="12" r="2" /><path d="M7 12h3M13.5 10.5l4-4M13.5 13.5l4 4" /></S>; // רשת
    case "b3": return <S><path d="M7 7h4v4c0 3-2 5-4 6" /><path d="M14 7h4v4c0 3-2 5-4 6" /></S>; // מירכאות
  }
};

export const Prev = () => <S><path d="M9 6l6 6-6 6" /></S>;   // ב-RTL "הקודם" מצביע ימינה
export const Next = () => <S><path d="M15 6l-6 6 6 6" /></S>;
export const Expand = () => <S><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></S>;
export const Shrink = () => <S><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></S>;
export const Close = () => <S><path d="M6 6l12 12M18 6L6 18" /></S>;
export const Copy = () => <S><rect x="8" y="8" width="12" height="12" /><path d="M16 8V4H4v12h4" /></S>;
export const Arrow = () => <S><path d="M20 12H4M10 6l-6 6 6 6" /></S>;
