// components/AudioTimeline.tsx
'use client';
import { useCallback, useState } from 'react';
import { TimelineCanvas } from './TimelineCanvas';
import { TransportControls } from './TransportControls';
import { TimelineScrollbar } from './TimelineScrollbar';
import { ClipInfoPanel } from './ClipInfoPanel';
import { TrackControls } from './TrackControls';
import { Mixer } from './Mixer'; // ← NEU
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useClipManagement } from '../hooks/useClipManagement';
import { useTimelineScroll } from '../hooks/useTimelineScroll';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAudioDragDrop } from '../hooks/useAudioDragDrop';
import { useMixer } from '../hooks/useMixer'; // ← NEU: statt useTrackControls
import { calculateTimelineWidth } from '../utils/timelineCalculations';
import { TimelineConfig } from '../types/timeline.types';

const initialClips = [
  { 
    id: '1', 
    x: 80, 
    y: 0,
    width: 200, 
    height: 60, 
    duration: 5, 
    color: '#3b82f6', 
    name: 'Audio 1',
    audioUrl: '/audio/song.mp3',
    trackIndex: 0,
    trimStart: 0,
    trimEnd: 5,
  },
  { 
    id: '2', 
    x: 320, 
    y: 0,
    width: 200, 
    height: 60, 
    duration: 5, 
    color: '#10b981', 
    name: 'Audio 2',
    audioUrl: '/audio/song2.mp3',
    trackIndex: 1,
    trimStart: 0,
    trimEnd: 5,
  },
];

const config: TimelineConfig = {
  pixelsPerSecond: 40,
  trackHeight: 80,
  rulerHeight: 30,
  numberOfTracks: 4,
  trackControlsWidth: 180,
};

export default function AudioTimeline() {
  const {
    clips,
    selectedClipId,
    setSelectedClipId,
    updateClipPosition,
    updateClipTrim,
    deleteClip,
    addClip,
    getSelectedClip,
  } = useClipManagement(initialClips, config.pixelsPerSecond);

  // ← AKTUALISIERT: Mixer Hook statt Track Controls Hook
  const {
    tracks,
    master,
    updateTrackVolume,
    updateMasterVolume,
    toggleTrackMute,
    toggleMasterMute,
    toggleTrackSolo,
    updateTrackPan,
    isTrackAudible,
  } = useMixer(config.numberOfTracks);

  // ← NEU: State für Mixer Panel
  const [mixerOpen, setMixerOpen] = useState(false);

  const {
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    seek,
    audioLevels,
    masterAudioLevel
  } = useAudioPlayback(
    clips, 
    config.pixelsPerSecond, 
    tracks, 
    master, // ← NEU: master übergeben
    isTrackAudible
  );

  const timelineWidth = calculateTimelineWidth(clips, config.pixelsPerSecond);
  const canvasWidth = 1200;

  const {
    scrollOffset,
    setScrollOffset,
    scroll,
  } = useTimelineScroll(timelineWidth, canvasWidth, isPlaying, currentTime, config.pixelsPerSecond);

  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCursor,
  } = useCanvasInteraction(
    clips,
    scrollOffset,
    config.pixelsPerSecond,
    config.rulerHeight,
    config.trackHeight,
    config.numberOfTracks,
    setSelectedClipId,
    updateClipPosition,
    updateClipTrim,
    handleSeek
  );

  const handleDeleteSelectedClip = useCallback(() => {
    if (selectedClipId) {
      console.log('Deleting clip:', selectedClipId);
      deleteClip(selectedClipId);
    }
  }, [selectedClipId, deleteClip]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  useKeyboardShortcuts(
    selectedClipId, 
    handleDeleteSelectedClip,
    togglePlayPause,
    isPlaying
  );

  const {
    isDraggingOver,
    dropPosition,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useAudioDragDrop({
    onAddClip: addClip,
    pixelsPerSecond: config.pixelsPerSecond,
    rulerHeight: config.rulerHeight,
    trackHeight: config.trackHeight,
    numberOfTracks: config.numberOfTracks,
    scrollOffset,
  });

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    scroll(e.deltaY);
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Audio Timeline Editor</h1>
      </div>

      <TransportControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={clips[0]?.duration || 0}
        onPlayPause={togglePlayPause}
        onStop={stop}
        mixerOpen={mixerOpen}
        onMixerToggle={() => setMixerOpen(!mixerOpen)}
      />
      <ClipInfoPanel
        selectedClip={getSelectedClip()}
        pixelsPerSecond={config.pixelsPerSecond}
      />

      {/* Flex Container für Track Controls + Timeline */}
      <div className="flex gap-0 mb-4 mt-4">
        {/* Track Controls - Basic Volume/Mute/Solo */}
        <TrackControls
          tracks={tracks}
          rulerHeight={config.rulerHeight}
          trackHeight={config.trackHeight}
          controlsWidth={config.trackControlsWidth}
          onVolumeChange={updateTrackVolume}
          onMuteToggle={toggleTrackMute}
          onSoloToggle={toggleTrackSolo}
        />

        {/* Timeline */}
        <div 
          className="flex-1"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <TimelineCanvas
            clips={clips}
            selectedClipId={selectedClipId}
            currentTime={currentTime}
            scrollOffset={scrollOffset}
            config={config}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => handleMouseMove(e, selectedClipId)}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            getCursor={getCursor}
            isDraggingOver={isDraggingOver}
            dropPosition={dropPosition}
          />
        </div>
      </div>

      <TimelineScrollbar
        scrollOffset={scrollOffset}
        canvasWidth={canvasWidth}
        timelineWidth={timelineWidth}
        onScroll={setScrollOffset}
      />

      {/* ← NEU: Professional Mixer Component */}
      <Mixer
        tracks={tracks}
        master={master}
        onTrackVolumeChange={updateTrackVolume}
        onMasterVolumeChange={updateMasterVolume}
        onTrackMuteToggle={toggleTrackMute}
        onMasterMuteToggle={toggleMasterMute}
        onTrackSoloToggle={toggleTrackSolo}
        onTrackPanChange={updateTrackPan}
        isOpen={mixerOpen}
        onToggle={() => setMixerOpen(!mixerOpen)}
        audioLevels={audioLevels}
        masterAudioLevel={masterAudioLevel}
      />
      
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Tipps</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li><strong>Mixer:</strong> Öffne den professionellen Mixer für vertikale Fader und Pan-Control</li>
          <li><strong>Track Controls:</strong> Schnelle Lautstärke-Anpassung links neben der Timeline</li>
          <li><strong>M</strong> = Mute, <strong>S</strong> = Solo</li>
          <li><strong>Master Fader:</strong> Kontrolliert die Gesamtlautstärke aller Tracks</li>
          <li><strong>Pan:</strong> Stereo-Positionierung (Links/Rechts)</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">Leertaste</kbd> Play/Pause</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">Delete</kbd> Clip löschen</li>
        </ul>
      </div>
    </div>
  );
}