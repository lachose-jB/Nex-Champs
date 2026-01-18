import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pen, Type } from "lucide-react";

interface CanvasProps {
  meetingId: number;
  participantId: number;
  isTokenHolder: boolean;
  onAnnotation?: (annotation: any) => void;
}

type DrawingTool = "pen" | "eraser" | "text";

export const Canvas: React.FC<CanvasProps> = ({
  meetingId,
  participantId,
  isTokenHolder,
  onAnnotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState("#000000");
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setContext(ctx);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTokenHolder || !context) return;

    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !isTokenHolder) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "eraser") {
      context.clearRect(x - 5, y - 5, 10, 10);
    } else if (tool === "pen") {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !context) return;

    setIsDrawing(false);
    context.closePath();

    // Record annotation
    if (onAnnotation && isTokenHolder) {
      const imageData = canvasRef.current?.toDataURL();
      onAnnotation({
        type: tool,
        timestamp: Date.now(),
        participantId,
        meetingId,
        imageData,
      });
    }
  };

  const handleClear = () => {
    if (!context || !canvasRef.current) return;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("pen")}
            disabled={!isTokenHolder}
            title={isTokenHolder ? "Pen tool" : "Only token holder can draw"}
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("eraser")}
            disabled={!isTokenHolder}
            title={isTokenHolder ? "Eraser tool" : "Only token holder can erase"}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setTool("text")}
            disabled={!isTokenHolder}
            title={isTokenHolder ? "Text tool" : "Only token holder can add text"}
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isTokenHolder}
            className="w-8 h-8 cursor-pointer"
            title="Color picker"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!isTokenHolder}
            className="text-red-600"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full ${isTokenHolder ? "cursor-crosshair" : "cursor-not-allowed opacity-75"}`}
          style={{ display: "block" }}
        />
      </div>

      {!isTokenHolder && (
        <div className="text-sm text-gray-500 text-center p-2">
          Only the token holder can annotate the canvas
        </div>
      )}
    </div>
  );
};
