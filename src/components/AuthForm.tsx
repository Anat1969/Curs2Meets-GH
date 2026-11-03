// טופס כניסה אחיד: טופס אמיתי למילוי אוטומטי של Chrome, הצגת סיסמה, ומעבר בין כניסה להרשמה.
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthForm({ email: initialEmail = "", name: initialName = "", startWith = "up", onDone }:
  { email?: string; name?: string; startWith?: "in" | "up"; onDone?: () => void }) {
  const [mode, setMode] = useState<"in" | "up">(startWith);
  const [email, setEmail] = useState(initialEmail);
  const [pass, setPass] = useState("");
  const [name, setName] = useState(initialName);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) setMsg({ ok: false, text: error.message === "Invalid login credentials" ? "האימייל או הסיסמה לא נכונים. אין לך עדיין סיסמה? עברו ל\"הרשמה\"." : error.message });
      else onDone?.();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { display_name: name } } });
      if (error) setMsg({ ok: false, text: /registered|exists/i.test(error.message) ? "כבר יש חשבון עם האימייל הזה. עברו ל\"כניסה\"." : error.message });
      else if (!data.session) setMsg({ ok: false, text: "האימייל הזה כבר רשום, אולי דרך Google. נסו \"כניסה\" עם סיסמה, או הירשמו עם כתובת נוספת. ב-Gmail אפשר להוסיף +קורס לפני ה-@, והמייל מגיע לאותה תיבה." });
      else onDone?.();
    }
    setBusy(false);
  };

  return (
    <form className="auth-form" onSubmit={submit} method="post" action="#">
      {mode === "up" && <label>שם מלא<input className="field" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>}
      <label>אימייל<input className="field" type="email" name="email" dir="ltr" autoComplete="username email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>סיסמה {mode === "up" && <span className="src">(לפחות 6 תווים, Chrome ישמור אותה)</span>}
        <span className="pass">
          <input className="field" type={show ? "text" : "password"} name="password" dir="ltr" autoComplete={mode === "in" ? "current-password" : "new-password"} value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} />
          <button type="button" className="chip pass-eye" aria-pressed={show} onMouseDown={(e) => e.preventDefault()} onClick={() => setShow((s) => !s)}>{show ? "הסתרה" : "הצגה"}</button>
        </span>
      </label>
      {msg && <div className={`msg ${msg.ok ? "ok" : "err"}`} role="alert">{msg.text}</div>}
      <button className="press btn btn-main" disabled={busy} type="submit">{busy ? "רגע…" : mode === "in" ? "כניסה" : "הרשמה וכניסה"}</button>
      <button className="chip" type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>{mode === "in" ? "אין לי סיסמה עדיין: הרשמה" : "כבר יש לי סיסמה: כניסה"}</button>
    </form>
  );
}
