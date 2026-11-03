import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import { go } from "../lib/route";
import AuthForm from "../components/AuthForm";

export default function AuthPage() {
  const { user } = useAuth();
  useEffect(() => { document.title = "כניסה · מכלי לשותף"; }, []);
  useEffect(() => { if (user) go("/gallery", undefined, true); }, [user]);
  return (
    <main className="page">
      <div className="card auth">
        <span className="label">כניסה לסטודנטים</span>
        <h1 className="page-title" style={{ fontSize: 28 }}>כניסה לחשבון הכיתה.</h1>
        <p className="page-sub" style={{ margin: 0 }}>הצפייה פתוחה לכולם.<br />העלאה לגלריה פתוחה למי שהצטרף בקישור האישי שקיבל מענת.</p>
        <AuthForm startWith="in" />
      </div>
    </main>
  );
}
