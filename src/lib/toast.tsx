import { useEffect, useState } from "react";

let push: (m: string) => void = () => {};
export const toast = (m: string) => push(m);

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number;
    push = (m) => { setMsg(m); clearTimeout(t); t = window.setTimeout(() => setMsg(null), 2400); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
