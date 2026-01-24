import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set --vh CSS variable for proper mobile viewport height
const setVh = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

setVh();
window.addEventListener("resize", setVh);
window.addEventListener("orientationchange", setVh);

createRoot(document.getElementById("root")!).render(<App />);
