// types/timeline.types.ts
export interface Clip {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number;
  color: string;
  name: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  trackIndex: number;
  trimStart: number;
  trimEnd: number;
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  isTrimming: boolean;
  trimSide: 'start' | 'end' | null;
  startX: number;
  startY: number;
  clipStartX: number;
  clipStartWidth: number;
  clipStartTrack: number;
  clipTrimStart: number;
  clipTrimEnd: number;
}

// ← NEU: Track Configuration
export interface Track {
  index: number;
  volume: number; // 0.0 bis 1.0
  muted: boolean;
  solo: boolean;
}

export interface TimelineConfig {
  pixelsPerSecond: number;
  trackHeight: number;
  rulerHeight: number;
  numberOfTracks: number;
  trackControlsWidth: number; // ← NEU: Breite der Track-Controls
}