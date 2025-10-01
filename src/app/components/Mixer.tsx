// components/Mixer.tsx
import { useState, useEffect } from 'react';
import { MixerTrack, MasterTrack } from '../hooks/useMixer';

interface MixerProps {
  tracks: MixerTrack[];
  master: MasterTrack;
  onTrackVolumeChange: (trackIndex: number, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onTrackMuteToggle: (trackIndex: number) => void;
  onMasterMuteToggle: () => void;
  onTrackSoloToggle: (trackIndex: number) => void;
  onTrackPanChange: (trackIndex: number, pan: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  audioLevels?: Map<number, number>; // ← NEU: Audio-Pegel pro Track
  masterAudioLevel?: number; // ← NEU: Master Audio-Pegel
}

export const Mixer = ({
  tracks,
  master,
  onTrackVolumeChange,
  onMasterVolumeChange,
  onTrackMuteToggle,
  onMasterMuteToggle,
  onTrackSoloToggle,
  onTrackPanChange,
  isOpen,
  onToggle,
  audioLevels = new Map(),
  masterAudioLevel = 0,
}: MixerProps) => {
  return (
    <>

      {/* Toggle Button */}
      {/* <button
        onClick={onToggle}
        className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        {isOpen ? '🎚️ Mixer schließen' : '🎚️ Mixer öffnen'}
      </button> */}

      {/* Mixer Panel */}
      {isOpen && (
        <div className="mb-4 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Audio Mixer</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Track Channels */}
            {tracks.map((track) => (
              <TrackChannel
                key={track.index}
                track={track}
                audioLevel={audioLevels.get(track.index) || 0}
                onVolumeChange={(vol) => onTrackVolumeChange(track.index, vol)}
                onMuteToggle={() => onTrackMuteToggle(track.index)}
                onSoloToggle={() => onTrackSoloToggle(track.index)}
                onPanChange={(pan) => onTrackPanChange(track.index, pan)}
              />
            ))}

            {/* Separator */}
            <div className="w-px bg-gray-600 mx-2" />

            {/* Master Channel */}
            <MasterChannel
              master={master}
              audioLevel={masterAudioLevel}
              onVolumeChange={onMasterVolumeChange}
              onMuteToggle={onMasterMuteToggle}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Track Channel Component
interface TrackChannelProps {
  track: MixerTrack;
  audioLevel: number; // ← NEU: 0.0 bis 1.0
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onPanChange: (pan: number) => void;
}

const TrackChannel = ({
  track,
  audioLevel,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
}: TrackChannelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [peakLevel, setPeakLevel] = useState(0); // ← Peak Hold

  // Peak Hold Effect
  useEffect(() => {
    if (audioLevel > peakLevel) {
      setPeakLevel(audioLevel);
    } else {
      // Langsam abfallender Peak
      const timer = setTimeout(() => {
        setPeakLevel(prev => Math.max(0, prev - 0.02));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [audioLevel, peakLevel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && e.type === 'mousemove') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    const volume = Math.max(0, Math.min(1, 1 - (y / height)));
    onVolumeChange(volume);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // VU Meter Calculation mit tatsächlichem Audio-Pegel
  const vuMeterHeight = audioLevel * 100;
  const peakMeterHeight = peakLevel * 100;
  
  const getVuMeterColor = () => {
    if (track.muted) return 'bg-gray-600';
    if (audioLevel > 0.9) return 'bg-red-500';
    if (audioLevel > 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-lg min-w-[100px]">
      {/* Track Label */}
      <div className="text-white font-bold text-sm">Track {track.index + 1}</div>

      {/* Volume Meter (VU Meter) mit echtem Audio-Pegel */}
      <div className="w-8 h-48 bg-gray-700 rounded relative overflow-hidden">
        {/* Tatsächlicher Audio-Pegel */}
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ${getVuMeterColor()}`}
          style={{ height: `${vuMeterHeight}%` }}
        />
        
        {/* Peak Hold Indicator */}
        {peakLevel > 0 && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-white"
            style={{ bottom: `${peakMeterHeight}%` }}
          />
        )}
        
        {/* dB Markierungen */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          <div className="w-full h-px bg-gray-600" title="0 dB" />
          <div className="w-full h-px bg-gray-600" title="-6 dB" />
          <div className="w-full h-px bg-gray-600" title="-12 dB" />
          <div className="w-full h-px bg-gray-600" title="-18 dB" />
        </div>
      </div>

      {/* Fader */}
      <div 
        className="relative w-12 h-64 bg-gray-700 rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Fader Track - zentriert */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center">
          <div className="w-1 h-full bg-gray-600 rounded" />
        </div>

        {/* Fader Knob - zentriert */}
        <div 
          className={`absolute left-1/1 -translate-x-1/2 w-12 h-8 rounded-lg transition-colors ${
            track.muted 
              ? 'bg-gray-600' 
              : isDragging 
                ? 'bg-blue-500' 
                : 'bg-blue-600 hover:bg-blue-500'
          } shadow-lg cursor-grab active:cursor-grabbing border-2 border-gray-900`}
          style={{ 
            top: `${(1 - track.volume) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-px bg-gray-300" />
          </div>
        </div>

        {/* Scale Markings */}
        <div className="absolute right-full mr-2 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-500">
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-18</span>
          <span>-∞</span>
        </div>
      </div>

      {/* Volume Display */}
      <div className="text-gray-400 text-xs font-mono">
        {track.muted ? 'MUTE' : `${Math.round(track.volume * 100)}%`}
      </div>

      {/* Pan Control mit Center Marker */}
      <div className="w-full">
        <div className="text-gray-400 text-[10px] text-center mb-1">PAN</div>
        <div className="relative">
          <input
            type="range"
            min="-100"
            max="100"
            value={track.pan * 100}
            onChange={(e) => onPanChange(parseInt(e.target.value) / 100)}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          {/* Center Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-400 pointer-events-none" />
        </div>
        <div className="text-gray-500 text-[10px] text-center mt-1">
          {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
        </div>
      </div>

      {/* Mute/Solo Buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onMuteToggle}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
            track.muted 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          M
        </button>
        <button
          onClick={onSoloToggle}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
            track.solo 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          S
        </button>
      </div>
    </div>
  );
};

// Master Channel Component
interface MasterChannelProps {
  master: MasterTrack;
  audioLevel: number; // ← NEU
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

const MasterChannel = ({
  master,
  audioLevel,
  onVolumeChange,
  onMuteToggle,
}: MasterChannelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [peakLevel, setPeakLevel] = useState(0);

  useEffect(() => {
    if (audioLevel > peakLevel) {
      setPeakLevel(audioLevel);
    } else {
      const timer = setTimeout(() => {
        setPeakLevel(prev => Math.max(0, prev - 0.02));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [audioLevel, peakLevel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && e.type === 'mousemove') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    const volume = Math.max(0, Math.min(1, 1 - (y / height)));
    onVolumeChange(volume);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const vuMeterHeight = audioLevel * 100;
  const peakMeterHeight = peakLevel * 100;
  
  const getVuMeterColor = () => {
    if (master.muted) return 'bg-gray-600';
    if (audioLevel > 0.9) return 'bg-red-500';
    if (audioLevel > 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg min-w-[120px] border-2 border-blue-500">
      {/* Master Label */}
      <div className="text-blue-400 font-bold text-sm">MASTER</div>

      {/* Volume Meter mit echtem Audio-Pegel */}
      <div className="w-10 h-48 bg-gray-700 rounded relative overflow-hidden">
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ${getVuMeterColor()}`}
          style={{ height: `${vuMeterHeight}%` }}
        />
        
        {/* Peak Hold */}
        {peakLevel > 0 && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-white"
            style={{ bottom: `${peakMeterHeight}%` }}
          />
        )}
        
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          <div className="w-full h-px bg-gray-600" />
          <div className="w-full h-px bg-gray-600" />
          <div className="w-full h-px bg-gray-600" />
          <div className="w-full h-px bg-gray-600" />
        </div>
      </div>

      {/* Master Fader */}
      <div 
        className="relative w-14 h-64 bg-gray-700 rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center">
          <div className="w-2 h-full bg-gray-600 rounded" />
        </div>

        <div 
          className={`absolute left-1/1 -translate-x-1/2 w-14 h-10 rounded-lg transition-colors ${
            master.muted 
              ? 'bg-gray-600' 
              : isDragging 
                ? 'bg-blue-400' 
                : 'bg-blue-500 hover:bg-blue-400'
          } shadow-xl cursor-grab active:cursor-grabbing border-2 border-gray-900`}
          style={{ 
            top: `${(1 - master.volume) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-px bg-gray-300" />
          </div>
        </div>

        <div className="absolute right-full mr-2 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-500">
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-18</span>
          <span>-∞</span>
        </div>
      </div>

      {/* Master Volume Display */}
      <div className="text-blue-400 text-sm font-mono font-bold">
        {master.muted ? 'MUTE' : `${Math.round(master.volume * 100)}%`}
      </div>

      {/* Master Mute Button */}
      <button
        onClick={onMuteToggle}
        className={`w-full px-4 py-3 text-sm font-bold rounded-lg transition-colors ${
          master.muted 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        MUTE
      </button>
    </div>
  );
};