// כפתור הלוגו היחיד "אד' ענת שטיבלמן A&I" (ai-menu.js, נטען ב-index.html).
// כל פעולות המערכת (כניסה, יציאה, העתקת קישור, התקנה, שיחת הפיתוח) רק בתוכו.
import { useEffect, useRef } from "react";

export interface MenuItem { label: string; hint?: string; pressed?: boolean; disabled?: boolean; onSelect: () => unknown }
type MenuEl = HTMLElement & { items: MenuItem[]; status: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ai-menu": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { chat?: string; research?: string };
    }
  }
}

export const CHAT = "https://claude.ai/code/session_018qeN18c1dHb5hAszdX5o5p";

export default function AIMenu({ items, status }: { items: MenuItem[]; status?: string }) {
  const ref = useRef<MenuEl>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => { el.items = items; el.status = status ?? ""; };
    apply();
    customElements.whenDefined("ai-menu").then(apply).catch(() => {});
  }, [items, status]);
  return <ai-menu ref={ref} chat={CHAT} />;
}
