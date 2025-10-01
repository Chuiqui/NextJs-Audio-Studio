// components/TimelineScrollbar.tsx
interface TimelineScrollbarProps {
  scrollOffset: number;
  canvasWidth: number;
  timelineWidth: number;
  onScroll: (offset: number) => void;
}

export const TimelineScrollbar = ({
  scrollOffset,
  canvasWidth,
  timelineWidth,
  onScroll,
}: TimelineScrollbarProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startScroll = scrollOffset;
    
    const handleDrag = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const scrollDelta = (deltaX / canvasWidth) * timelineWidth;
      onScroll(Math.max(0, Math.min(timelineWidth - canvasWidth, startScroll + scrollDelta)));
    };
    
    const handleUp = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <div className="h-3 bg-gray-800 relative">
      <div 
        className="h-full bg-gray-600 absolute cursor-pointer hover:bg-gray-500 transition-colors"
        style={{
          left: `${(scrollOffset / timelineWidth) * 100}%`,
          width: `${(canvasWidth / timelineWidth) * 100}%`
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};