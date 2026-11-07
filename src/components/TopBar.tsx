import { useMemo } from "react";
import { useRoute, go } from "../lib/route";
import { toast } from "../lib/toast";
import AIMenu, { type MenuItem } from "./AIMenu";
import Search from "./Search";
import { useAdmin, setAdminKey } from "../lib/classroom";

export default function TopBar() {
  const r = useRoute();
  const m = useAdmin();
  const p = r.parts;
  const cur = p[0] === "intro" ? "intro" : p[0] === "t" ? p[1]?.[0] : p[0] === "gallery" ? "gallery" : "home";

  const items = useMemo<MenuItem[]>(() => m.admin
    ? [
        { label: "ניהול הכיתה", hint: "רשימה, קישורים אישיים ומי פתח אותם", onSelect: () => go("/class") },
        { label: "סגירת הניהול במכשיר הזה", hint: "הקישור האישי פותח אותו שוב", onSelect: () => { setAdminKey(null); toast("הניהול נסגר במכשיר הזה"); } },
      ]
    : [], [m.admin]);

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
        <AIMenu items={items} status={m.admin ? "מנהלת הכיתה" : ""} />
      </div>
    </header>
  );
}
