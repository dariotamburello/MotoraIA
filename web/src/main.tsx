import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Motora IA — Web (skeleton)</h1>
      <p>UI de admin/landing aterriza en Story 9.1.</p>
    </main>
  </StrictMode>,
);
