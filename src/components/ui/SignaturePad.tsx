"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Undo } from "lucide-react";

interface SignaturePadProps {
  onSignature: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSignature,
  width = 500,
  height = 160,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getPoint = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const point = getPoint(e);
      if (!point) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a1a2e";

      setIsDrawing(true);
      lastPoint.current = point;
    },
    [getPoint],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;

      const point = getPoint(e);
      if (!point) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastPoint.current?.x || point.x, lastPoint.current?.y || point.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPoint.current = point;
      setHasSignature(true);
    },
    [isDrawing, getPoint],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignature(canvas.toDataURL("image/png"));
    }
  }, [hasSignature, onSignature]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignature("");
  }, [onSignature]);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-dashed border-olive/30 bg-white/60">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none w-full cursor-crosshair rounded-lg"
          style={{ maxWidth: width }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={!hasSignature}
        >
          <Eraser className="h-3.5 w-3.5 mr-1" />
          Wyczyść
        </Button>
      </div>
    </div>
  );
}
