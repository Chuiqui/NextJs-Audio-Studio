// components/ClipInfoPanel.tsx
import { Clip } from '../types/timeline.types';

interface ClipInfoPanelProps {
  selectedClip: Clip | null;
  pixelsPerSecond: number;
}

export const ClipInfoPanel = ({ selectedClip, pixelsPerSecond }: ClipInfoPanelProps) => {
  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Clip Info</h3>
      {selectedClip ? (
        <div className="text-gray-300 text-sm">
          <p>Name: {selectedClip.name}</p>
          <p>Position: {(selectedClip.x / pixelsPerSecond).toFixed(2)}s</p>
          <p>Duration: {selectedClip.duration.toFixed(2)}s</p>
          <p>Status: {selectedClip.audioBuffer ? '✓ Geladen' : 'Lädt...'}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Kein Clip ausgewählt</p>
      )}
    </div>
  );
};