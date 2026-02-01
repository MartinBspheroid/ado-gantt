import * as React from "react";
import * as ReactDOM from "react-dom";
import { GanttHub } from "./GanttHub";

const container = document.getElementById("root");

if (container) {
  ReactDOM.render(<GanttHub />, container);
} else {
  console.error("Failed to find root element");
}
