import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Eraser, Pen, Type, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";

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
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

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

    // Save initial state
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const saveState = () => {
    if (!context || !canvasRef.current) return;
    const imageData = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setHistory((prev) => [...prev, imageData]);
  };

  const handleUndo = () => {
    if (!context || !canvasRef.current || history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];

    if (previousState) {
      context.putImageData(previousState, 0, 0);
      setHistory(newHistory);
      toast.success(t("canvas.undo"));
    }
  };

  const handleClearAll = () => {
    if (!context || !canvasRef.current) return;

    context.fillStyle = "white";
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
    toast.success(t("canvas.clearAll"));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTokenHolder || !context) {
      toast.error(t("canvas.onlyTokenHolder"));
      return;
    }

    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);

    if (tool === "pen") {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";
    } else if (tool === "eraser") {
      context.clearRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !isTokenHolder) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen") {
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === "eraser") {
      context.clearRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    saveState();

    if (onAnnotation) {
      onAnnotation({
        meetingId,
        participantId,
        timestamp: Date.now(),
        tool,
        color,
      });
    }
  };

  const handleToolChange = (newTool: DrawingTool) => {
    if (!isTokenHolder) {
      toast.error(t("canvas.onlyTokenHolder"));
      return;
    }
    setTool(newTool);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <Button
            variant={tool === "pen" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolChange("pen")}
            className="gap-2"
            title={t("canvas.penTool")}
          >
            <Pen className="w-4 h-4" />
            <span className="hidden sm:inline">{t("canvas.penTool")}</span>
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolChange("eraser")}
            className="gap-2"
            title={t("canvas.eraserTool")}
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">{t("canvas.eraserTool")}</span>
          </Button>
          <Button
            variant={tool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolChange("text")}
            className="gap-2"
            title={t("canvas.textTool")}
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">{t("canvas.textTool")}</span>
          </Button>
        </div>

        {/* Separator */}
        <div className="w-px bg-gray-300" />

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{t("canvas.colorPicker")}:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isTokenHolder}
            className="w-10 h-10 rounded cursor-pointer disabled:opacity-50"
            title={t("canvas.colorPicker")}
          />
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{t("canvas.lineWidth")}:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            disabled={!isTokenHolder}
            className="w-24 disabled:opacity-50"
            title={t("canvas.lineWidth")}
          />
          <span className="text-xs text-gray-600 w-8">{lineWidth}px</span>
        </div>

        {/* Separator */}
        <div className="w-px bg-gray-300" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!isTokenHolder || history.length <= 1}
            className="gap-2"
            title={t("canvas.undo")}
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("canvas.undo")}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={!isTokenHolder}
            className="gap-2"
            title={t("canvas.clearAll")}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t("canvas.clearAll")}</span>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {!isTokenHolder && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {t("canvas.onlyTokenHolder")}
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full border-2 rounded-lg bg-white ${
          isTokenHolder ? "border-blue-300 cursor-crosshair" : "border-gray-300 cursor-not-allowed opacity-75"
        }`}
        style={{ minHeight: "400px" }}
      />
    </div>
  );
};
