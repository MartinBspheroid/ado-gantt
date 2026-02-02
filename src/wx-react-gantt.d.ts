declare module "wx-react-gantt" {
  import * as React from "react";

  export interface GanttTask {
    id: number | string;
    text: string;
    start: Date;
    end: Date;
    duration?: number;
    progress?: number;
    parent?: number | string;
    type?: "task" | "summary";
    open?: boolean;
    $css?: string;
    [key: string]: unknown;
  }

  export interface GanttLink {
    id: number | string;
    source: number | string;
    target: number | string;
    type: "e2s" | "s2s" | "e2e" | "s2e";
  }

  export interface GanttScale {
    unit: string;
    step: number;
    format: string;
  }

  export interface GanttColumn {
    id: string;
    header: string;
    width?: number;
    flexgrow?: number;
    align?: "left" | "center" | "right";
  }

  export interface GanttProps {
    tasks: GanttTask[];
    links?: GanttLink[];
    scales?: GanttScale[];
    columns?: GanttColumn[];
    cellWidth?: number;
    cellHeight?: number;
    readonly?: boolean;
  }

  export interface GanttApi {
    on: (event: string, callback: (ev: unknown) => void) => (() => void) | undefined;
    getTask: (id: number | string) => GanttTask | undefined;
    [key: string]: unknown;
  }

  export const Gantt: React.ForwardRefExoticComponent<
    GanttProps & React.RefAttributes<GanttApi>
  >;
}

declare module "wx-react-gantt/dist/gantt.css" {
  const content: string;
  export default content;
}
