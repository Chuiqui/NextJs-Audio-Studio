// hooks/useTrackControls.ts
import { useState, useCallback } from 'react';
import { Track } from '../types/timeline.types';

export const useTrackControls = (numberOfTracks: number) => {
  const [tracks, setTracks] = useState<Track[]>(
    Array.from({ length: numberOfTracks }, (_, i) => ({
      index: i,
      volume: 0.8, // Default 80%
      muted: false,
      solo: false,
    }))
  );

  const updateTrackVolume = useCallback((trackIndex: number, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.index === trackIndex 
        ? { ...track, volume: Math.max(0, Math.min(1, volume)) }
        : track
    ));
  }, []);

  const toggleTrackMute = useCallback((trackIndex: number) => {
    setTracks(prev => prev.map(track => 
      track.index === trackIndex 
        ? { ...track, muted: !track.muted }
        : track
    ));
  }, []);

  const toggleTrackSolo = useCallback((trackIndex: number) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const wasSolo = newTracks[trackIndex].solo;
      
      // Wenn wir Solo aktivieren, deaktiviere alle anderen
      if (!wasSolo) {
        newTracks.forEach((track, i) => {
          track.solo = i === trackIndex;
        });
      } else {
        // Wenn wir Solo deaktivieren, deaktiviere nur diesen Track
        newTracks[trackIndex].solo = false;
      }
      
      return newTracks;
    });
  }, []);

  const getTrack = useCallback((trackIndex: number) => {
    return tracks.find(t => t.index === trackIndex);
  }, [tracks]);

  // Hilfsfunktion: Sollte dieser Track hörbar sein?
  const isTrackAudible = useCallback((trackIndex: number) => {
    const track = tracks[trackIndex];
    if (!track) return false;
    
    // Wenn der Track gemutet ist, nicht hörbar
    if (track.muted) return false;
    
    // Wenn irgendein Track solo ist, nur solo Tracks sind hörbar
    const hasSoloTracks = tracks.some(t => t.solo);
    if (hasSoloTracks) {
      return track.solo;
    }
    
    // Sonst ist der Track hörbar
    return true;
  }, [tracks]);

  return {
    tracks,
    updateTrackVolume,
    toggleTrackMute,
    toggleTrackSolo,
    getTrack,
    isTrackAudible,
  };
};