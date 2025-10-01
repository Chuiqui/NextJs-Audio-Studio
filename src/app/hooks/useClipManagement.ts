// hooks/useClipManagement.ts
import { useState, useEffect } from 'react';
import { Clip } from '../types/timeline.types';

export const useClipManagement = (initialClips: Clip[], pixelsPerSecond: number) => {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  useEffect(() => {
    clips.forEach(async (clip) => {
      if (clip.audioUrl && !clip.audioBuffer) {
        try {
          const audioContext = new AudioContext();
          const response = await fetch(clip.audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          setClips(prev => prev.map(c => 
            c.id === clip.id 
              ? { 
                  ...c, 
                  audioBuffer, 
                  duration: audioBuffer.duration,
                  width: audioBuffer.duration * pixelsPerSecond,
                  trimEnd: audioBuffer.duration
                }
              : c
          ));
          
          audioContext.close();
        } catch (error) {
          console.error('Fehler beim Laden der Audio-Datei:', error);
        }
      }
    });
  }, [clips, pixelsPerSecond]);

  const updateClipPosition = (clipId: string, x: number, trackIndex: number) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, x: Math.max(0, x), trackIndex } : clip
    ));
  };

  const updateClipTrim = (clipId: string, trimStart: number, trimEnd: number, x: number) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? { 
            ...clip, 
            trimStart,
            trimEnd,
            x: Math.max(0, x),
            duration: trimEnd - trimStart
          } 
        : clip
    ));
  };

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  // ← NEU: Clip hinzufügen
  const addClip = (clip: Clip) => {
    setClips(prev => [...prev, clip]);
    setSelectedClipId(clip.id); // Automatisch auswählen
  };

  const getSelectedClip = () => {
    return clips.find(c => c.id === selectedClipId) || null;
  };

  return {
    clips,
    selectedClipId,
    setSelectedClipId,
    updateClipPosition,
    updateClipTrim,
    deleteClip,
    addClip, // ← NEU exportieren
    getSelectedClip,
  };
};