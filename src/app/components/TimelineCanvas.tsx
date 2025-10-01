// components/TimelineCanvas.tsx
import { useRef, useEffect, useCallback } from 'react';
import { Clip, TimelineConfig } from '../types/timeline.types';
import { 
  drawRuler, 
  drawGrid, 
  drawClip, 
  drawPlayhead,
  drawTracks 
} from '../utils/canvasDrawing';
import { calculateTimelineWidth, isClipVisible } from '../utils/timelineCalculations';

interface TimelineCanvasProps {
  clips: Clip[];
  selectedClipId: string | null;
  currentTime: number;
  scrollOffset: number;
  config: TimelineConfig;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  getCursor: (e: React.MouseEvent<HTMLCanvasElement>) => string;
  isDraggingOver?: boolean; // ← NEU
  dropPosition?: { x: number; y: number } | null; // ← NEU
}

export const TimelineCanvas = ({
  clips,
  selectedClipId,
  currentTime,
  scrollOffset,
  config,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  getCursor,
  isDraggingOver = false, // ← NEU
  dropPosition = null, // ← NEU
}: TimelineCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timelineWidth = calculateTimelineWidth(clips, config.pixelsPerSecond);
    const maxSeconds = Math.ceil(timelineWidth / config.pixelsPerSecond);

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawRuler(ctx, canvas.width, config.rulerHeight, scrollOffset, config.pixelsPerSecond, maxSeconds);
    drawTracks(ctx, canvas.width, canvas.height, config.rulerHeight, config.trackHeight, config.numberOfTracks);
    drawGrid(ctx, canvas.width, canvas.height, config.rulerHeight, scrollOffset, config.pixelsPerSecond, maxSeconds);

    clips.forEach(clip => {
      if (isClipVisible(clip, scrollOffset, canvas.width)) {
        drawClip(ctx, clip, scrollOffset, clip.id === selectedClipId, config.rulerHeight, config.trackHeight);
      }
    });

    drawPlayhead(ctx, currentTime, config.pixelsPerSecond, scrollOffset, canvas.width, canvas.height, config.rulerHeight);

    // ← NEU: Zeichne Drop-Indikator
    if (isDraggingOver && dropPosition) {
      const dropX = dropPosition.x - scrollOffset;
      const trackIndex = Math.max(
        0, 
        Math.min(
          config.numberOfTracks - 1, 
          Math.floor((dropPosition.y - config.rulerHeight) / config.trackHeight)
        )
      );
      const dropY = config.rulerHeight + trackIndex * config.trackHeight + 10;
      const dropHeight = config.trackHeight - 20;

      // Zeichne gestricheltes Rechteck als Platzhalter
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(dropX, dropY, 100, dropHeight);
      ctx.setLineDash([]);

      // Zeichne Text
      ctx.fillStyle = '#10b981';
      ctx.font = '12px Arial';
      ctx.fillText('Drop hier', dropX + 10, dropY + 25);
    }
  }, [clips, selectedClipId, currentTime, scrollOffset, config, isDraggingOver, dropPosition]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const width = containerRef.current.clientWidth;
        const height = config.rulerHeight + config.numberOfTracks * config.trackHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [config]);

  const handleMouseMoveWithCursor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    onMouseMove(e);
    e.currentTarget.style.cursor = getCursor(e);
  };

  return (
    <div ref={containerRef} className="border border-gray-700 overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="bg-gray-900 w-full block"
        onMouseDown={onMouseDown}
        onMouseMove={handleMouseMoveWithCursor}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />
      
      {isDraggingOver && (
        <div className="absolute inset-0 bg-gray-500 opacity-15 bg-opacity-50 pointer-events-none border-2 border-blue-800 border-dashed flex items-center rounded-md justify-center">
          <div className="bg-gray-900 bg-opacity-90 px-6 py-4 rounded-lg">
            <p className="text-green-400 text-lg font-semibold">📁 Audio-Datei hier ablegen</p>
          </div>
        </div>
      )}
    </div>
  );
};