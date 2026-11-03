import { useEffect } from "react";
import { useRoute } from "./lib/route";
import { AuthProvider } from "./lib/auth";
import { Toaster } from "./lib/toast";
import { course } from "./data/course";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import IntroPage from "./pages/IntroPage";
import TopicPage from "./pages/TopicPage";
import GalleryPage from "./pages/GalleryPage";
import AuthPage from "./pages/AuthPage";
import JoinPage from "./pages/JoinPage";
import ClassPage from "./pages/ClassPage";
import NotFound from "./pages/NotFound";

function Page() {
  const r = useRoute();
  const [a, b] = r.parts;
  useEffect(() => { window.scrollTo(0, 0); }, [r.path]);
  useEffect(() => { if (!a) document.title = "מכלי לשותף · קורס AI ויצירה"; }, [a]);
  if (!a) return <Home />;
  if (a === "intro") return <IntroPage />;
  if (a === "t" && b) return <TopicPage key={b} k={b} />;
  if (a === "gallery") return <GalleryPage />;
  if (a === "auth") return <AuthPage />;
  if (a === "join" && b) return <JoinPage token={b} />;
  if (a === "class") return <ClassPage />;
  return <NotFound />;
}

export default function App() {
  return (
    <AuthProvider>
      <TopBar />
      <Page />
      <footer className="foot">
        <div className="foot-in">
          <span>{course.inspiration}</span>
          <span>אד' ענת שטיבלמן · A&amp;I</span>
        </div>
      </footer>
      <Toaster />
    </AuthProvider>
  );
}
