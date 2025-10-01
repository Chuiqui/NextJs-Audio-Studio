// hooks/useAudioDragDrop.ts
import { useCallback, useState } from 'react';
import { Clip } from '../types/timeline.types';

interface UseAudioDragDropProps {
  onAddClip: (clip: Clip) => void;
  pixelsPerSecond: number;
  rulerHeight: number;
  trackHeight: number;
  numberOfTracks: number;
  scrollOffset: number;
}

export const useAudioDragDrop = ({
  onAddClip,
  pixelsPerSecond,
  rulerHeight,
  trackHeight,
  numberOfTracks,
  scrollOffset,
}: UseAudioDragDropProps) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prüfe ob es Audio-Dateien sind
    const hasAudioFiles = Array.from(e.dataTransfer.types).some(
      type => type === 'Files'
    );
    
    if (hasAudioFiles) {
      setIsDraggingOver(true);
      
      // Berechne Position für visuelles Feedback
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const y = e.clientY - rect.top;
      
      setDropPosition({ x, y });
    }
  }, [scrollOffset]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingOver(false);
    setDropPosition(null);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    if (audioFiles.length === 0) {
      console.log('No audio files dropped');
      return;
    }

    // Berechne Drop-Position
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left + scrollOffset;
    const dropY = e.clientY - rect.top;
    
    // Berechne Track-Index basierend auf Y-Position
    const trackIndex = Math.max(
      0, 
      Math.min(
        numberOfTracks - 1, 
        Math.floor((dropY - rulerHeight) / trackHeight)
      )
    );

    console.log(`Dropping ${audioFiles.length} audio file(s) at position`, { dropX, trackIndex });

    // Verarbeite jede Audio-Datei
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      await processAudioFile(file, dropX + (i * 20), trackIndex, onAddClip, pixelsPerSecond);
    }
  }, [scrollOffset, rulerHeight, trackHeight, numberOfTracks, pixelsPerSecond, onAddClip]);

  return {
    isDraggingOver,
    dropPosition,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

// Hilfsfunktion zum Verarbeiten der Audio-Datei
async function processAudioFile(
  file: File,
  x: number,
  trackIndex: number,
  onAddClip: (clip: Clip) => void,
  pixelsPerSecond: number
) {
  try {
    console.log('Processing audio file:', file.name);

    // Erstelle Audio Context
    const audioContext = new AudioContext();
    
    // Lese Datei als ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Dekodiere Audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('Audio decoded:', {
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
    });

    // Erstelle Object URL für die Datei
    const audioUrl = URL.createObjectURL(file);

    // Erstelle neuen Clip
    const newClip: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.max(0, x),
      y: 0,
      width: audioBuffer.duration * pixelsPerSecond,
      height: 60,
      duration: audioBuffer.duration,
      color: getRandomColor(),
      name: file.name.replace(/\.[^/.]+$/, ''), // Entferne Dateiendung
      audioUrl,
      audioBuffer,
      trackIndex,
      trimStart: 0,
      trimEnd: audioBuffer.duration,
    };

    onAddClip(newClip);
    
    audioContext.close();
    
    console.log('Clip created:', newClip);
  } catch (error) {
    console.error('Error processing audio file:', error);
    alert(`Fehler beim Laden der Audio-Datei: ${file.name}`);
  }
}

// Hilfsfunktion für zufällige Farben
function getRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}