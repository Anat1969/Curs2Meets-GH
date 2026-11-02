// שמירה אוטומטית ב-localStorage עם חיווי "נשמר". עובד גם בלי חיבור.
import { useEffect, useRef, useState } from "react";

const read = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; }
};

export function useSaved<T>(key: string, initial: T): [T, (v: T) => void, boolean] {
  const [val, setVal] = useState<T>(() => read(key, initial));
  const [saved, setSaved] = useState(false);
  const t = useRef<number>();
  useEffect(() => { setVal(read(key, initial)); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (v: T) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); setSaved(true); } catch { /* מצב פרטי */ }
    clearTimeout(t.current);
    t.current = window.setTimeout(() => setSaved(false), 1800);
  };
  return [val, set, saved];
}
