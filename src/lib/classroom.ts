// כיתה: רשימת סטודנטים, קישור הזמנה אישי, שליחה בוואטסאפ או במייל, והצטרפות.
// הזיהוי לפי טוקן בקישור, לא לפי אימייל: כל חשבון שפותח את הקישור משויך לשורה שלו.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export const APP_URL = "https://curs2meets-gh.vercel.app";
export const joinLink = (token: string) => `${APP_URL}/#/join/${token}`;

export interface RosterRow {
  id: string; name: string; email: string | null; phone: string | null; role: "student" | "admin";
  token: string; invited_at: string | null; invited_via: string | null; user_id: string | null; joined_at: string | null; created_at: string;
}

export function useMembership() {
  const { user } = useAuth();
  const [m, setM] = useState<{ admin: boolean; member: boolean; ready: boolean }>({ admin: false, member: false, ready: false });
  useEffect(() => {
    if (!user) { setM({ admin: false, member: false, ready: true }); return; }
    let live = true;
    Promise.all([supabase.rpc("is_class_admin"), supabase.rpc("class_member")]).then(([a, b]) => {
      if (live) setM({ admin: !!a.data, member: !!b.data, ready: true });
    }).catch(() => live && setM({ admin: false, member: false, ready: true }));
    const f = () => Promise.all([supabase.rpc("is_class_admin"), supabase.rpc("class_member")]).then(([a, b]) => setM({ admin: !!a.data, member: !!b.data, ready: true }));
    addEventListener("class-joined", f);
    return () => { live = false; removeEventListener("class-joined", f); };
  }, [user]);
  return m;
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
