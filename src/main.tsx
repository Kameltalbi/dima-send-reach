import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import "./lib/sentry"; // Import pour initialiser Sentry si nécessaire

createRoot(document.getElementById("root")!).render(<App />);
