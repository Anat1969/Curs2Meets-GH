// קישור אישי: #/join/<טוקן>. בלי סיסמה ובלי חשבון.
// מנהלת: המפתח נשמר במכשיר, ונפתח ניהול הכיתה. סטודנט/ית: השם נשמר, מסומן "הצטרף/ה", וממשיכים לקורס.
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { go } from "../lib/route";
import { toast } from "../lib/toast";
import { setAdminKey, setAuthorName } from "../lib/classroom";

export default function JoinPage({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "invalid" | "error">("loading");
  useEffect(() => { document.title = "הצטרפות לכיתה · מכלי לשותף"; }, []);
  useEffect(() => {
    supabase.rpc("class_invite", { p_token: token }).then(async ({ data, error }) => {
      if (error) { setState("error"); return; }
      const inv = (data as { name: string; role: string }[] | null)?.[0];
      if (!inv) { setState("invalid"); return; }
      const first = inv.name.split(" ")[0];
      if (inv.role === "admin") {
        setAdminKey(token);
        toast(`שלום ${first}, ניהול הכיתה פתוח במכשיר הזה`);
        go("/class", undefined, true);
      } else {
        setAuthorName(inv.name);
        await supabase.rpc("roster_open", { p_token: token });
        toast(`ברוך/ה הבא/ה, ${first}. העבודות שתעלי יישמרו בשם ${inv.name}`);
        go("/t/a1", undefined, true);
      }
    });
  }, [token]);

  return (
    <main className="page">
      <div className="card auth">
        <span className="label">קישור אישי לקורס</span>
        {state === "loading" && <p>פותח את הקורס…</p>}
        {state === "invalid" && <div className="msg err">הקישור הזה לא תקין או שהוסר מהרשימה. בקשו מענת קישור חדש. בינתיים אפשר <a href="#/">להיכנס לקורס</a> בלי קישור.</div>}
        {state === "error" && <div className="msg err">הקישור לא נטען. בדקו חיבור לאינטרנט ורעננו את הדף.</div>}
      </div>
    </main>
  );
}
