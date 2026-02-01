import * as React from "react";
import { createRoot } from "react-dom/client";
import { GanttHub } from "./GanttHub";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<GanttHub />);
} else {
  console.error("Failed to find root element");
}
