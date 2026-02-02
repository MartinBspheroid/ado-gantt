import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { GanttHub } from "./GanttHub";

const container = document.getElementById("root");

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<GanttHub />);
} else {
  console.error("Failed to find root element");
}
