import * as React from "react";
import { useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import "../styles/ExportControls.css";

export type ExportFormat = "png" | "jpeg" | "pdf";

interface ExportControlsProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  targetRef,
  filename = "gantt-chart"
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");

  const handleExport = async (format: ExportFormat) => {
    if (!targetRef.current || isExporting) return;

    setIsExporting(true);
    setExportProgress(`Generating ${format.toUpperCase()}...`);

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}-${timestamp}`;

      switch (format) {
        case "png":
          await exportAsPng(targetRef.current, fullFilename);
          break;
        case "jpeg":
          await exportAsJpeg(targetRef.current, fullFilename);
          break;
        case "pdf":
          await exportAsPdf(targetRef.current, fullFilename);
          break;
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  const exportAsPng = async (element: HTMLElement, filename: string) => {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      skipFonts: false
    });
    downloadFile(dataUrl, `${filename}.png`);
  };

  const exportAsJpeg = async (element: HTMLElement, filename: string) => {
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      skipFonts: false,
      backgroundColor: "#ffffff"
    });
    downloadFile(dataUrl, `${filename}.jpg`);
  };

  const exportAsPdf = async (element: HTMLElement, filename: string) => {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      skipFonts: false
    });

    const img = new Image();
    img.src = dataUrl;
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const pdf = new jsPDF({
      orientation: img.width > img.height ? "landscape" : "portrait",
      unit: "px",
      format: [img.width, img.height]
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
    pdf.save(`${filename}.pdf`);
  };

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="export-controls">
      <span className="export-label">Export:</span>
      <div className="export-buttons" role="group" aria-label="Export options">
        <button
          className="export-btn"
          onClick={() => handleExport("png")}
          disabled={isExporting}
          aria-label="Export as PNG image"
          title="Export as PNG"
        >
          {isExporting ? "..." : "PNG"}
        </button>
        <button
          className="export-btn"
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          aria-label="Export as PDF document"
          title="Export as PDF"
        >
          {isExporting ? "..." : "PDF"}
        </button>
      </div>
      {isExporting && (
        <span className="export-progress" role="status" aria-live="polite">
          {exportProgress}
        </span>
      )}
    </div>
  );
};

export default ExportControls;
