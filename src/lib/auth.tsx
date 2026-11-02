import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const Ctx = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); setReady(true); });
    supabase.auth.getSession().then(({ data: d }) => { setUser(d.session?.user ?? null); setReady(true); }).catch(() => setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={{ user, ready }}>{children}</Ctx.Provider>;
}
