import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./lib/sentry";

// Initialiser Sentry en production
initSentry().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
