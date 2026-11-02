// ניתוב hash עם פרמטרים: #/t/a1?s=4&q=אגם. "העתקת קישור" פותחת את אותו מצב.
import { useEffect, useState } from "react";

export interface Route { path: string; parts: string[]; params: URLSearchParams }

export function parse(hash = location.hash): Route {
  const raw = decodeURIComponent(hash.replace(/^#/, "")) || "/";
  const [path, qs = ""] = raw.split("?");
  return { path, parts: path.split("/").filter(Boolean), params: new URLSearchParams(qs) };
}

export function href(path: string, params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  const s = q.toString();
  return `#${path}${s ? `?${s}` : ""}`;
}

export function go(path: string, params?: Record<string, string | number | undefined>, replace = false) {
  const h = href(path, params);
  if (replace) history.replaceState(null, "", h);
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute() {
  const [r, setR] = useState(parse());
  useEffect(() => {
    const f = () => setR(parse());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return r;
}
