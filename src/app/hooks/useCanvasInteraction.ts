// hooks/useCanvasInteraction.ts
import { useState, useCallback } from 'react';
import { DragState, Clip } from '../types/timeline.types';

const yToTrackIndex = (y: number, rulerHeight: number, trackHeight: number, numberOfTracks: number): number => {
  if (y <= rulerHeight) return 0;
  const trackIndex = Math.floor((y - rulerHeight) / trackHeight);
  return Math.max(0, Math.min(numberOfTracks - 1, trackIndex));
};

const isPointInClip = (
  x: number, 
  y: number, 
  clip: Clip, 
  rulerHeight: number, 
  trackHeight: number,
  pixelsPerSecond: number
): boolean => {
  const clipY = rulerHeight + clip.trackIndex * trackHeight + 10;
  const clipHeight = trackHeight - 20;
  const actualDuration = clip.trimEnd - clip.trimStart;
  const displayWidth = actualDuration * pixelsPerSecond;
  
  return (
    x >= clip.x &&
    x <= clip.x + displayWidth &&
    y >= clipY &&
    y <= clipY + clipHeight
  );
};

export const useCanvasInteraction = (
  clips: Clip[],
  scrollOffset: number,
  pixelsPerSecond: number,
  rulerHeight: number,
  trackHeight: number,
  numberOfTracks: number,
  onClipSelect: (id: string | null) => void,
  onClipMove: (id: string, x: number, trackIndex: number) => void,
  onClipTrim: (id: string, trimStart: number, trimEnd: number, x: number) => void, // ← NEU
  onSeek: (time: number) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    isTrimming: false,
    trimSide: null,
    startX: 0,
    startY: 0,
    clipStartX: 0,
    clipStartWidth: 0,
    clipStartTrack: 0,
    clipTrimStart: 0,
    clipTrimEnd: 0,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const y = e.clientY - rect.top;

    if (y <= rulerHeight) {
      const newTime = x / pixelsPerSecond;
      onSeek(newTime);
      return;
    }

    // ← NEU: Prüfe Trim-Handles
    for (const clip of clips) {
      const clipY = rulerHeight + clip.trackIndex * trackHeight + 10;
      const clipHeight = trackHeight - 20;
      const actualDuration = clip.trimEnd - clip.trimStart;
      const displayWidth = actualDuration * pixelsPerSecond;
      
      const TRIM_HANDLE_WIDTH = 8;
      
      // Linker Trim-Handle
      if (
        x >= clip.x &&
        x <= clip.x + TRIM_HANDLE_WIDTH &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        onClipSelect(clip.id);
        setDragState({
          isDragging: false,
          isResizing: false,
          isTrimming: true,
          trimSide: 'start',
          startX: x,
          startY: y,
          clipStartX: clip.x,
          clipStartWidth: clip.width,
          clipStartTrack: clip.trackIndex,
          clipTrimStart: clip.trimStart,
          clipTrimEnd: clip.trimEnd,
        });
        return;
      }
      
      // Rechter Trim-Handle
      if (
        x >= clip.x + displayWidth - TRIM_HANDLE_WIDTH &&
        x <= clip.x + displayWidth &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        onClipSelect(clip.id);
        setDragState({
          isDragging: false,
          isResizing: false,
          isTrimming: true,
          trimSide: 'end',
          startX: x,
          startY: y,
          clipStartX: clip.x,
          clipStartWidth: clip.width,
          clipStartTrack: clip.trackIndex,
          clipTrimStart: clip.trimStart,
          clipTrimEnd: clip.trimEnd,
        });
        return;
      }
    }

    // Dann prüfe Clip-Body für Drag
    for (const clip of clips) {
      if (isPointInClip(x, y, clip, rulerHeight, trackHeight, pixelsPerSecond)) {
        onClipSelect(clip.id);
        setDragState({
          isDragging: true,
          isResizing: false,
          isTrimming: false,
          trimSide: null,
          startX: x,
          startY: y,
          clipStartX: clip.x,
          clipStartWidth: clip.width,
          clipStartTrack: clip.trackIndex,
          clipTrimStart: clip.trimStart,
          clipTrimEnd: clip.trimEnd,
        });
        return;
      }
    }

    onClipSelect(null);
  }, [clips, scrollOffset, pixelsPerSecond, rulerHeight, trackHeight, numberOfTracks, onClipSelect, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>, selectedClipId: string | null) => {
    if (!selectedClipId || (!dragState.isDragging && !dragState.isTrimming)) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const y = e.clientY - rect.top;
    const deltaX = x - dragState.startX;

    if (dragState.isDragging) {
      const newTrackIndex = yToTrackIndex(y, rulerHeight, trackHeight, numberOfTracks);
      const newX = Math.max(0, dragState.clipStartX + deltaX);
      
      onClipMove(selectedClipId, newX, newTrackIndex);
    } else if (dragState.isTrimming) {
      const clip = clips.find(c => c.id === selectedClipId);
      if (!clip || !clip.audioBuffer) return;
      
      const deltaSec = deltaX / pixelsPerSecond;
      const maxDuration = clip.audioBuffer.duration;
      
      if (dragState.trimSide === 'start') {
        // ← Trim am Anfang
        const newTrimStart = Math.max(0, Math.min(dragState.clipTrimStart + deltaSec, dragState.clipTrimEnd - 0.1));
        const newX = dragState.clipStartX + (newTrimStart - dragState.clipTrimStart) * pixelsPerSecond;
        
        onClipTrim(selectedClipId, newTrimStart, dragState.clipTrimEnd, newX);
      } else if (dragState.trimSide === 'end') {
        // ← Trim am Ende
        const newTrimEnd = Math.max(dragState.clipTrimStart + 0.1, Math.min(maxDuration, dragState.clipTrimEnd + deltaSec));
        
        onClipTrim(selectedClipId, dragState.clipTrimStart, newTrimEnd, dragState.clipStartX);
      }
    }
  }, [dragState, scrollOffset, rulerHeight, trackHeight, numberOfTracks, pixelsPerSecond, clips, onClipMove, onClipTrim]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      isTrimming: false,
      trimSide: null,
      startX: 0,
      startY: 0,
      clipStartX: 0,
      clipStartWidth: 0,
      clipStartTrack: 0,
      clipTrimStart: 0,
      clipTrimEnd: 0,
    });
  }, []);

  const getCursor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const y = e.clientY - rect.top;

    if (y <= rulerHeight) return 'pointer';

    const TRIM_HANDLE_WIDTH = 8;

    for (const clip of clips) {
      const clipY = rulerHeight + clip.trackIndex * trackHeight + 10;
      const clipHeight = trackHeight - 20;
      const actualDuration = clip.trimEnd - clip.trimStart;
      const displayWidth = actualDuration * pixelsPerSecond;
      
      // Linker Trim-Handle
      if (
        x >= clip.x &&
        x <= clip.x + TRIM_HANDLE_WIDTH &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        return 'ew-resize';
      }
      
      // Rechter Trim-Handle
      if (
        x >= clip.x + displayWidth - TRIM_HANDLE_WIDTH &&
        x <= clip.x + displayWidth &&
        y >= clipY &&
        y <= clipY + clipHeight
      ) {
        return 'ew-resize';
      }
      
      if (isPointInClip(x, y, clip, rulerHeight, trackHeight, pixelsPerSecond)) {
        return 'move';
      }
    }
    return 'default';
  }, [clips, scrollOffset, rulerHeight, trackHeight, pixelsPerSecond]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCursor,
  };
};