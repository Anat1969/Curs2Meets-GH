import { useMemo } from "react";
import { useRoute, go } from "../lib/route";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { toast } from "../lib/toast";
import AIMenu, { type MenuItem } from "./AIMenu";
import Search from "./Search";
import { useMembership } from "../lib/classroom";

export default function TopBar() {
  const r = useRoute();
  const { user } = useAuth();
  const m = useMembership();
  const p = r.parts;
  const cur = p[0] === "intro" ? "intro" : p[0] === "t" ? p[1]?.[0] : p[0] === "gallery" ? "gallery" : "home";

  const items = useMemo<MenuItem[]>(() => user
    ? [
        ...(m.admin ? [{ label: "ניהול הכיתה", hint: "רשימה, הזמנות ומי הצטרף", onSelect: () => go("/class") }] : []),
        { label: "יציאה מהחשבון", hint: user.email ?? "", onSelect: async () => { await supabase.auth.signOut(); toast("יצאת מהחשבון"); } },
      ]
    : [{ label: "כניסה לסטודנטים", hint: "כדי להעלות תרגיל לגלריה", onSelect: () => go("/auth") }], [user, m.admin]);

  const tabs = [
    { id: "intro", label: "הקדמה", to: "/intro", color: "var(--wine)" },
    { id: "a", label: "מפגש א׳ · ככלי", to: "/t/a1", color: "var(--lake)" },
    { id: "b", label: "מפגש ב׳ · כמחולל", to: "/t/b1", color: "var(--ember)" },
    { id: "gallery", label: "גלריית הכיתה", to: "/gallery", color: "var(--ink)" },
  ];

  return (
    <header className="topbar">
      <div className="topbar-in">
        <a className="brand" href="#/" aria-label="מכלי לשותף, לדף הבית">
          <img src="icon.svg" alt="" />
          <span className="name">מכלי לשותף<small>קורס AI ויצירה</small></span>
        </a>
        <nav className="tabs" aria-label="ניווט ראשי">
          {tabs.map((t) => (
            <a key={t.id} className="tab" href={`#${t.to}`} aria-current={cur === t.id ? "page" : undefined}>
              <i className="dot" style={{ background: t.color }} />{t.label}
            </a>
          ))}
        </nav>
        <Search />
        <AIMenu items={items} status={user ? (m.admin ? "מנהלת הכיתה" : m.member ? "בכיתה" : "מחובר/ת") : ""} />
      </div>
    </header>
  );
}
