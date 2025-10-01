// components/TrackControls.tsx
import { Track } from '../types/timeline.types';

interface TrackControlsProps {
  tracks: Track[];
  rulerHeight: number;
  trackHeight: number;
  controlsWidth: number;
  onVolumeChange: (trackIndex: number, volume: number) => void;
  onMuteToggle: (trackIndex: number) => void;
  onSoloToggle: (trackIndex: number) => void;
}

export const TrackControls = ({
  tracks,
  rulerHeight,
  trackHeight,
  controlsWidth,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
}: TrackControlsProps) => {
  return (
    <div 
      className="bg-gray-800 border-r border-gray-700 flex flex-col"
      style={{ width: `${controlsWidth}px` }}
    >
      {/* Header Spacer */}
      <div 
        className="bg-gray-900 border-b border-gray-700"
        style={{ height: `${rulerHeight}px` }}
      />
      
      {/* Track Controls */}
      {tracks.map((track) => (
        <div
          key={track.index}
          className="border-b border-gray-700 flex items-center px-3 gap-2"
          style={{ 
            height: `${trackHeight}px`,
            backgroundColor: track.index % 2 === 0 ? '#1a1f2e' : '#151923'
          }}
        >
          {/* Track Label */}
          <div className="text-gray-400 font-semibold text-xs min-w-[30px]">
            T{track.index + 1}
          </div>
          
          {/* Volume Slider */}
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={track.volume * 100}
              onChange={(e) => onVolumeChange(track.index, parseInt(e.target.value) / 100)}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              disabled={track.muted}
              style={{
                background: track.muted 
                  ? '#4b5563'
                  : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${track.volume * 100}%, #4b5563 ${track.volume * 100}%, #4b5563 100%)`
              }}
            />
            <div className="text-[10px] text-gray-500 text-center">
              {track.muted ? 'MUTE' : `${Math.round(track.volume * 100)}%`}
            </div>
          </div>
          
          {/* Mute Button */}
          <button
            onClick={() => onMuteToggle(track.index)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
              track.muted 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={track.muted ? 'Unmute' : 'Mute'}
          >
            M
          </button>
          
          {/* Solo Button */}
          <button
            onClick={() => onSoloToggle(track.index)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
              track.solo 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={track.solo ? 'Unsolo' : 'Solo'}
          >
            S
          </button>
        </div>
      ))}
    </div>
  );
};