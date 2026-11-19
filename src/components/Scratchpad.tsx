/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Trash2, PenLine, Maximize2, Minimize2, X } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser: boolean;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState('#fbbf24'); // Chalk yellow default
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = [
    { name: 'Groc guix', hex: '#fbbf24' },
    { name: 'Blanc', hex: '#f8fafc' },
    { name: 'Cian', hex: '#38bdf8' },
    { name: 'Coral', hex: '#f87171' },
    { name: 'Verd llima', hex: '#4ade80' }
  ];

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark blackboard background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional grid lines for math handwriting
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all completed strokes
    const allStrokes = [...strokes, ...(currentStroke ? [currentStroke] : [])];

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#0f172a' : stroke.color;
      ctx.lineWidth = stroke.isEraser ? stroke.width * 5 : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Resize canvas when container size changes
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      }
      redrawCanvas();
    };

    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen, isExpanded, redrawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentStroke({
      points: [coords],
      color,
      width: strokeWidth,
      isEraser
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    const coords = getCanvasCoords(e);
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, coords]
      };
    });
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes((prev) => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-200 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden ${
        isExpanded
          ? 'inset-4 md:inset-10'
          : 'bottom-4 right-4 w-[92vw] max-w-lg h-[340px] md:h-[400px]'
      }`}
    >
      {/* Header toolbar */}
      <div className="bg-slate-800/90 backdrop-blur px-3 py-2 border-b border-slate-700 flex items-center justify-between gap-2 text-white text-xs select-none">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <PenLine className="w-4 h-4 text-amber-400" />
          <span>Pissarra d'Esborrany</span>
          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
            Per fer càlculs
          </span>
        </div>

        {/* Color pickers */}
        <div className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-1 rounded-lg">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setColor(c.hex);
                setIsEraser(false);
              }}
              title={c.name}
              className={`w-5 h-5 rounded-full transition-transform ${
                !isEraser && color === c.hex
                  ? 'scale-125 ring-2 ring-white'
                  : 'hover:scale-110 opacity-80'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            title="Goma d'esborrar"
            className={`p-1.5 rounded transition ${
              isEraser
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Desfés l'últim traç"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Netejar tota la pissarra"
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-700 disabled:opacity-30 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Redueix mida' : 'Amplia pantalla'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Tanca pissarra"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-600 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-slate-950 touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-600 text-xs italic select-none">
            Escriu o dibuixa aquí els teus càlculs (m.c.m., signes, passos intermedis)...
          </div>
        )}
      </div>
    </div>
  );
};
