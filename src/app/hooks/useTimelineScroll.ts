// hooks/useTimelineScroll.ts
import { useState, useEffect } from 'react';

export const useTimelineScroll = (
  timelineWidth: number,
  canvasWidth: number,
  isPlaying: boolean,
  currentTime: number,
  pixelsPerSecond: number
) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const playheadX = currentTime * pixelsPerSecond;
      const visibleEnd = scrollOffset + canvasWidth;
      
      if (playheadX > visibleEnd - 100) {
        setScrollOffset(playheadX - canvasWidth + 100);
      }
    }
  }, [currentTime, isPlaying, pixelsPerSecond, scrollOffset, canvasWidth]);

  const scroll = (deltaY: number) => {
    const maxScroll = Math.max(0, timelineWidth - canvasWidth);
    setScrollOffset(prev => {
      const newOffset = prev + deltaY;
      return Math.max(0, Math.min(maxScroll, newOffset));
    });
  };

  return {
    scrollOffset,
    setScrollOffset,
    scroll,
  };
};