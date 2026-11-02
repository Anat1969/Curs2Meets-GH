// אותו בסיס נתונים של הגרסה הקודמת (Lovable Cloud), כך שעבודות הכיתה נשמרות.
// המפתח הוא מפתח ציבורי (anon). ההרשאות נאכפות ב-RLS: קריאה לכולם, כתיבה ומחיקה רק לבעלים.
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL || "https://tnvwpjcilwmtigfxhomx.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudndwamNpbHdtdGlnZnhob214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTgyODEsImV4cCI6MjA4ODU3NDI4MX0.e9JlLG9PzSR0HKVvIkBHG7MBTM0PNfFupnDQNj42FKA";

export const supabase = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });

export interface Submission {
  id: string; user_id: string; session_id: string; topic_id: string;
  description: string; image_url: string; created_at: string; display_name?: string;
}

export async function fetchSubmissions(filter?: { session: string; topic: string }): Promise<Submission[]> {
  let q = supabase.from("student_submissions").select("*").order("created_at", { ascending: false });
  if (filter) q = q.eq("session_id", filter.session).eq("topic_id", filter.topic);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Submission[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (!ids.length) return rows;
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
  const map = new Map((profiles ?? []).map((p: { user_id: string; display_name: string }) => [p.user_id, p.display_name]));
  return rows.map((r) => ({ ...r, display_name: map.get(r.user_id) ?? "סטודנט/ית" }));
}
