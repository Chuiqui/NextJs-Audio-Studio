import { Clip } from "../types/timeline.types";
// utils/timelineCalculations.ts
export const timeToPixels = (seconds: number, pixelsPerSecond: number): number => {
  return seconds * pixelsPerSecond;
};

export const pixelsToTime = (pixels: number, pixelsPerSecond: number): number => {
  return pixels / pixelsPerSecond;
};

export const calculateTimelineWidth = (
  clips: Clip[],
  pixelsPerSecond: number,
  minSeconds: number = 30
): number => {
  const maxClipEnd = clips.reduce((max, clip) => {
    const clipEnd = clip.x + clip.width;
    return clipEnd > max ? clipEnd : max;
  }, 0);
  return Math.max(minSeconds * pixelsPerSecond, maxClipEnd + 10 * pixelsPerSecond);
};

export const isClipVisible = (
  clip: Clip,
  scrollOffset: number,
  canvasWidth: number
): boolean => {
  const clipX = clip.x - scrollOffset;
  return !(clipX + clip.width < 0 || clipX > canvasWidth);
};