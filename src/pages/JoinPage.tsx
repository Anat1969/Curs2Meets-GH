// הצטרפות בקישור אישי: #/join/<טוקן>. מזהה את ההזמנה, נכנסים או נרשמים, והחשבון משויך לכיתה.
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { go } from "../lib/route";
import { toast } from "../lib/toast";
import AuthForm from "../components/AuthForm";

interface Invite { name: string; email: string | null; role: string; joined: boolean }
const CLAIM: Record<string, string> = {
  invalid: "הקישור הזה לא תקין. בקשו מענת קישור חדש.",
  used: "הקישור הזה כבר שויך לחשבון אחר. אם זה החשבון שלך, צאו והיכנסו עם החשבון הקודם.",
  already_member: "החשבון הזה כבר משויך לכיתה בשם אחר. צאו מהחשבון ופתחו את הקישור שוב.",
  not_signed_in: "צריך להיכנס קודם.",
};

export default function JoinPage({ token }: { token: string }) {
  const { user, ready } = useAuth();
  const [inv, setInv] = useState<Invite | null | undefined>(undefined);
  const [err, setErr] = useState("");
  useEffect(() => { document.title = "הצטרפות לכיתה · מכלי לשותף"; }, []);
  useEffect(() => {
    supabase.rpc("class_invite", { p_token: token }).then(({ data, error }) => {
      if (error) { setErr("ההזמנה לא נטענה. בדקו חיבור לאינטרנט ורעננו."); setInv(null); return; }
      setInv((data as Invite[] | null)?.[0] ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!ready || !user || !inv) return;
    supabase.rpc("class_claim", { p_token: token }).then(({ data, error }) => {
      const r = error ? "error" : String(data);
      if (r === "ok") {
        dispatchEvent(new Event("class-joined"));
        toast(inv.role === "admin" ? "נכנסת כמנהלת הכיתה" : `ברוך/ה הבא/ה, ${inv.name.split(" ")[0]}`);
        go(inv.role === "admin" ? "/class" : "/t/a1", undefined, true);
      } else setErr(CLAIM[r] ?? "ההצטרפות נכשלה. נסו שוב בעוד רגע.");
    });
  }, [ready, user, inv, token]);

  return (
    <main className="page">
      <div className="card auth">
        <span className="label">הזמנה אישית לקורס</span>
        {inv === undefined && <p>טוען את ההזמנה…</p>}
        {inv === null && <div className="msg err">{err || CLAIM.invalid}</div>}
        {inv && (
          <>
            <h1 className="page-title" style={{ fontSize: 28 }}>שלום {inv.name.split(" ")[0]}, הוזמנת לקורס.</h1>
            <p className="page-sub" style={{ margin: 0 }}>
              <b>מכלי לשותף: AI ויצירה.</b><br />
              {user ? "משייכים את החשבון שלך לכיתה…" : "בפעם הראשונה בוחרים סיסמה. בפעם הבאה Chrome ממלא אותה לבד."}
            </p>
            {err && <div className="msg err">{err}</div>}
            {!user && <AuthForm email={inv.email ?? ""} name={inv.name} startWith={inv.joined ? "in" : "up"} />}
          </>
        )}
      </div>
    </main>
  );
}
