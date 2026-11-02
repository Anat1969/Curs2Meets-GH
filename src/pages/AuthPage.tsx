import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { go } from "../lib/route";

export default function AuthPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = "כניסה · מכלי לשותף"; }, []);
  useEffect(() => { if (user) go("/gallery", undefined, true); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setMsg({ ok: false, text: error.message === "Invalid login credentials" ? "האימייל או הסיסמה שגויים. אם נרשמת בעבר עם Google, צרי סיסמה בהרשמה עם אותו אימייל." : error.message });
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { display_name: name } } });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "נרשמת. אפשר להעלות תרגילים." });
    }
    setBusy(false);
  };

  return (
    <main className="page">
      <form className="card auth" onSubmit={submit}>
        <span className="label">כניסה לסטודנטים</span>
        <h1 className="page-title" style={{ fontSize: 28 }}>{mode === "in" ? "כניסה כדי להעלות תרגיל." : "הרשמה בדקה אחת."}</h1>
        <p className="page-sub" style={{ margin: 0 }}>הצפייה פתוחה לכולם. החשבון נדרש רק כדי להעלות עבודה ולמחוק אותה.</p>
        {mode === "up" && <label>שם מלא<input className="field" value={name} onChange={(e) => setName(e.target.value)} required /></label>}
        <label>אימייל<input className="field" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>סיסמה<input className="field" type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} /></label>
        {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
        <button className="press btn btn-main" disabled={busy} type="submit">{busy ? "רגע…" : mode === "in" ? "כניסה" : "הרשמה"}</button>
        <button className="chip" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "אין לך חשבון? להרשמה" : "יש לך חשבון? לכניסה"}</button>
      </form>
    </main>
  );
}
