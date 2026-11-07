// כיתה: רשימת סטודנטים, קישור הזמנה אישי, שליחה בוואטסאפ או במייל, והצטרפות.
// הזיהוי לפי טוקן בקישור, לא לפי אימייל: כל חשבון שפותח את הקישור משויך לשורה שלו.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const APP_URL = "https://curs2meets-gh.vercel.app";
export const joinLink = (token: string) => `${APP_URL}/#/join/${token}`;

export interface RosterRow {
  id: string; name: string; email: string | null; phone: string | null; role: "student" | "admin";
  token: string; invited_at: string | null; invited_via: string | null; user_id: string | null; joined_at: string | null; created_at: string;
}

/* בלי סיסמה ובלי חשבון (בקשת ענת, 04.11.2026):
   - מנהלת: הקישור האישי שלה שומר מפתח ניהול במכשיר.
   - יוצר/ת: שם גלוי, ומפתח עריכה סמוי שנוצר במכשיר ומאפשר למחוק רק את העבודות שלו/ה. */
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* מצב פרטי */ } };
const emit = () => dispatchEvent(new Event("c2m-identity"));

export function setAdminKey(k: string | null) { write("c2m:admin-key", k); emit(); }
export function getAdminKey() { return read("c2m:admin-key"); }

export function getAuthor(): { name: string; key: string } {
  let key = read("c2m:author-key");
  if (!key || key.length < 16) {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    key = [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
    write("c2m:author-key", key);
  }
  return { name: read("c2m:author-name") ?? "", key };
}
export function setAuthorName(n: string) { write("c2m:author-name", n.trim()); emit(); }
export function myWorks(): string[] { try { return JSON.parse(read("c2m:my-works") ?? "[]"); } catch { return []; } }
export function addMyWork(id: string) { write("c2m:my-works", JSON.stringify([...new Set([...myWorks(), id])])); emit(); }

/* האם המפתח השמור במכשיר הוא מפתח מנהלת. נבדק מול השרת. */
export function useAdmin() {
  const [st, setSt] = useState<{ key: string | null; admin: boolean; ready: boolean }>({ key: getAdminKey(), admin: false, ready: false });
  useEffect(() => {
    let live = true;
    const check = () => {
      const key = getAdminKey();
      if (!key) { setSt({ key: null, admin: false, ready: true }); return; }
      supabase.rpc("admin_check", { p_key: key }).then(({ data }) => live && setSt({ key, admin: !!data, ready: true }), () => live && setSt({ key, admin: false, ready: true }));
    };
    check();
    addEventListener("c2m-identity", check);
    return () => { live = false; removeEventListener("c2m-identity", check); };
  }, []);
  return st;
}

export function useIdentity() {
  const [n, setN] = useState(0);
  useEffect(() => { const f = () => setN((x) => x + 1); addEventListener("c2m-identity", f); return () => removeEventListener("c2m-identity", f); }, []);
  return { ...getAuthor(), mine: myWorks(), tick: n };
}

/* טלפון ישראלי לפורמט בינלאומי: 050-123-4567 → 972501234567 */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (!d) return null;
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "972" + d.slice(1);
  if (/^5\d{8}$/.test(d)) d = "972" + d;
  return /^\d{8,15}$/.test(d) ? d : null;
}
export const prettyPhone = (p: string) => (p.startsWith("972") ? "0" + p.slice(3).replace(/^(\d{2})(\d{3})(\d{4})$/, "$1-$2-$3") : "+" + p);
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface Parsed { name: string; email: string | null; phone: string | null; issue: string | null }

/* הדבקה מאקסל או מ-Google Sheets (טאבים), או CSV (פסיקים). העמודות מזוהות לפי התוכן, בכל סדר. */
export function parseRoster(text: string): Parsed[] {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: Parsed[] = [];
  for (const line of lines) {
    const cells = line.split(line.includes("\t") ? "\t" : /[,;]/).map((c) => c.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (!cells.length) continue;
    if (cells.every((c) => /^(שם|name|שם מלא|מייל|אימייל|email|e-mail|טלפון|נייד|phone|mobile)$/i.test(c))) continue; // שורת כותרות
    let email: string | null = null, phone: string | null = null; const rest: string[] = [];
    for (const c of cells) {
      if (!email && EMAIL.test(c)) email = c.toLowerCase();
      else if (!phone && /^[+\d][\d\s\-()]{6,}$/.test(c)) phone = normalizePhone(c);
      else rest.push(c);
    }
    const name = rest.join(" ").slice(0, 80);
    let issue: string | null = null;
    if (!name) issue = "חסר שם";
    else if (!email && !phone) issue = cells.some((c) => /[\d@]/.test(c)) ? "מייל או טלפון לא תקינים" : "חסר מייל או טלפון";
    rows.push({ name, email, phone, issue });
  }
  const seen = new Set<string>();
  for (const r of rows) {
    const k = r.email ?? r.phone ?? r.name;
    if (seen.has(k) && !r.issue) r.issue = "כפילות ברשימה";
    seen.add(k);
  }
  return rows;
}

export const DEFAULT_MESSAGE = "שלום {שם},\nהוזמנת לקורס \"מכלי לשותף: AI ויצירה\".\nזה הקישור האישי שלך לכניסה:\n{קישור}\nבפעם הראשונה בוחרים סיסמה, ו-Chrome זוכר אותה.\nענת";
export const fill = (tpl: string, r: { name: string; token: string }) => tpl.replaceAll("{שם}", r.name.split(" ")[0]).replaceAll("{קישור}", joinLink(r.token));
export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const mailLink = (email: string, text: string) => `mailto:${email}?subject=${encodeURIComponent("הזמנה לקורס: מכלי לשותף")}&body=${encodeURIComponent(text)}`;

export function toCsv(rows: RosterRow[]) {
  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const head = ["שם", "מייל", "טלפון", "קישור אישי", "סטטוס"];
  const body = rows.map((r) => [r.name, r.email ?? "", r.phone ? prettyPhone(r.phone) : "", joinLink(r.token), r.joined_at ? "הצטרף/ה" : r.invited_at ? "הוזמן/ה" : "לא הוזמן/ה"].map(esc).join(","));
  return "﻿" + [head.map(esc).join(","), ...body].join("\n");
}
