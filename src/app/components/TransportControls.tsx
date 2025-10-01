// components/TransportControls.tsx
import { formatTime } from '../utils/formatters';

interface TransportControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStop: () => void;
  mixerOpen?: boolean; // ← NEU
  onMixerToggle?: () => void; // ← NEU
}

export const TransportControls = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  mixerOpen = false,
  onMixerToggle,
}: TransportControlsProps) => {
  return (
    <div className="mb-4 flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
      <button
        onClick={onPlayPause}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
      <button
        onClick={onStop}
        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
      >
        ⏹ Stop
      </button>
      
      {/* ← NEU: Mixer Toggle Button */}
      {onMixerToggle && (
        <button
          onClick={onMixerToggle}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            mixerOpen 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {mixerOpen ? '🎚️ Mixer schließen' : '🎚️ Mixer'}
        </button>
      )}
      
      <div className="text-white font-mono text-lg">
        {formatTime(currentTime)}
      </div>
    </div>
  );
};