// src/components/AnnotatedImageViewer.tsx

"use client";

import { useEffect, useRef } from "react";

// Define types for the props for better code quality
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Defect {
  description: string;
  boundingBox: BoundingBox;
}

interface AnalysisData {
  defects: Defect[];
}

interface ViewerProps {
  imageUrl: string;
  analysisData: AnalysisData;
}

export default function AnnotatedImageViewer({
  imageUrl,
  analysisData,
}: ViewerProps) {
  console.log(imageUrl, analysisData, "test");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analysisData?.defects) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    // This helps prevent canvas security issues with cross-origin images
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Set canvas dimensions to match the loaded image
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw the original image onto the canvas
      ctx.drawImage(img, 0, 0);

      // 2. Loop through the defects and draw the annotations
      analysisData.defects.forEach((defect) => {
        const { x, y, width, height } = defect.boundingBox;

        // Draw the red bounding box
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 4; // Made it thicker for visibility
        ctx.strokeRect(x, y, width, height);

        // Draw the text label
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 24px sans-serif"; // Made it larger
        ctx.fillText(defect.description, x, y - 10); // Position label just above the box
      });
    };

    img.onerror = () => {
      console.error("Failed to load image for canvas.");
    };
  }, [imageUrl, analysisData]);

  return (
    <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
  );
}
