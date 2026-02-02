import * as React from "react";
import { createRoot } from "react-dom/client";
import { GanttHub } from "./GanttHub";
import { ErrorBoundary } from "./components";
import { ThemeProvider } from "./contexts/ThemeContext";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary onReset={() => window.location.reload()}>
      <ThemeProvider>
        <GanttHub />
      </ThemeProvider>
    </ErrorBoundary>
  );
} else {
  console.error("Failed to find root element");
}
