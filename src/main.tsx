import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);

// service worker רק כשהבסיס הוא השורש (Vercel), לא בעותק היחסי של raw.githack
if ("serviceWorker" in navigator && location.pathname === "/") {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
