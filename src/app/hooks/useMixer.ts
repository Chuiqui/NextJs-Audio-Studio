// hooks/useMixer.ts
import { useState, useCallback } from 'react';

export interface MixerTrack {
  index: number;
  volume: number; // 0.0 bis 1.0
  muted: boolean;
  solo: boolean;
  pan: number; // -1.0 (links) bis 1.0 (rechts)
}

export interface MasterTrack {
  volume: number;
  muted: boolean;
}

export const useMixer = (numberOfTracks: number) => {
  const [tracks, setTracks] = useState<MixerTrack[]>(
    Array.from({ length: numberOfTracks }, (_, i) => ({
      index: i,
      volume: 0.8,
      muted: false,
      solo: false,
      pan: 0,
    }))
  );

  const [master, setMaster] = useState<MasterTrack>({
    volume: 0.8,
    muted: false,
  });

  const updateTrackVolume = useCallback((trackIndex: number, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.index === trackIndex 
        ? { ...track, volume: Math.max(0, Math.min(1, volume)) }
        : track
    ));
  }, []);

  const updateMasterVolume = useCallback((volume: number) => {
    setMaster(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleTrackMute = useCallback((trackIndex: number) => {
    setTracks(prev => prev.map(track => 
      track.index === trackIndex 
        ? { ...track, muted: !track.muted }
        : track
    ));
  }, []);

  const toggleMasterMute = useCallback(() => {
    setMaster(prev => ({ ...prev, muted: !prev.muted }));
  }, []);

  const toggleTrackSolo = useCallback((trackIndex: number) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const wasSolo = newTracks[trackIndex].solo;
      
      if (!wasSolo) {
        newTracks.forEach((track, i) => {
          track.solo = i === trackIndex;
        });
      } else {
        newTracks[trackIndex].solo = false;
      }
      
      return newTracks;
    });
  }, []);

  const updateTrackPan = useCallback((trackIndex: number, pan: number) => {
    setTracks(prev => prev.map(track => 
      track.index === trackIndex 
        ? { ...track, pan: Math.max(-1, Math.min(1, pan)) }
        : track
    ));
  }, []);

  const isTrackAudible = useCallback((trackIndex: number) => {
    if (master.muted) return false;
    
    const track = tracks[trackIndex];
    if (!track) return false;
    if (track.muted) return false;
    
    const hasSoloTracks = tracks.some(t => t.solo);
    if (hasSoloTracks) {
      return track.solo;
    }
    
    return true;
  }, [tracks, master.muted]);

  const getEffectiveVolume = useCallback((trackIndex: number) => {
    const track = tracks[trackIndex];
    if (!track || !isTrackAudible(trackIndex)) return 0;
    return track.volume * master.volume;
  }, [tracks, master.volume, isTrackAudible]);

  return {
    tracks,
    master,
    updateTrackVolume,
    updateMasterVolume,
    toggleTrackMute,
    toggleMasterMute,
    toggleTrackSolo,
    updateTrackPan,
    isTrackAudible,
    getEffectiveVolume,
  };
};