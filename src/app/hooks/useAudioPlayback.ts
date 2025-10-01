// hooks/useAudioPlayback.ts - VOLLSTÄNDIGE korrigierte Version
import { useState, useRef, useEffect, useCallback } from 'react';
import { Clip } from '../types/timeline.types';
import { MixerTrack, MasterTrack } from '../hooks/useMixer';

export const useAudioPlayback = (
  clips: Clip[], 
  pixelsPerSecond: number,
  tracks: MixerTrack[],
  master: MasterTrack,
  isTrackAudible: (trackIndex: number) => boolean
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const pannerNodesRef = useRef<Map<string, StereoPannerNode>>(new Map());
  const analyserNodesRef = useRef<Map<number, AnalyserNode>>(new Map());
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef(0);
  const playbackOffsetRef = useRef(0);
  const isSeekingRef = useRef(false);
  const previousClipsRef = useRef<Clip[]>(clips);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<Map<number, number>>(new Map());
  const [masterAudioLevel, setMasterAudioLevel] = useState(0);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (audioContextRef.current) {
      masterGainRef.current = audioContextRef.current.createGain();
      masterAnalyserRef.current = audioContextRef.current.createAnalyser();
      masterAnalyserRef.current.fftSize = 256;
      masterAnalyserRef.current.smoothingTimeConstant = 0.8;
      
      masterGainRef.current.connect(masterAnalyserRef.current);
      masterAnalyserRef.current.connect(audioContextRef.current.destination);
    }
    
    return () => {
      sourceNodesRef.current.forEach(source => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      sourceNodesRef.current.clear();
      
      gainNodesRef.current.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {}
      });
      gainNodesRef.current.clear();
      
      pannerNodesRef.current.forEach(panner => {
        try {
          panner.disconnect();
        } catch (e) {}
      });
      pannerNodesRef.current.clear();
      
      analyserNodesRef.current.forEach(analyser => {
        try {
          analyser.disconnect();
        } catch (e) {}
      });
      analyserNodesRef.current.clear();
      
      if (masterGainRef.current) {
        try {
          masterGainRef.current.disconnect();
        } catch (e) {}
      }
      
      if (masterAnalyserRef.current) {
        try {
          masterAnalyserRef.current.disconnect();
        } catch (e) {}
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // KOMBINIERTER Animation Loop für Zeit UND Audio-Level
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current) {
      // Reset levels when not playing
      setAudioLevels(new Map());
      setMasterAudioLevel(0);
      return;
    }

    let frameId: number;
    
    const update = () => {
      if (!audioContextRef.current || !isPlaying) return;
      
      // Update Current Time
      if (!isSeekingRef.current) {
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
        const newTime = playbackOffsetRef.current + elapsed;
        setCurrentTime(newTime);
      }
      
      // Update Audio Levels
      const newLevels = new Map<number, number>();
      
      analyserNodesRef.current.forEach((analyser, trackIndex) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray); // Zeit-Domain für bessere Anzeige
        
        // Calculate Peak Level
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = Math.abs((dataArray[i] - 128) / 128);
          if (normalized > max) max = normalized;
        }
        newLevels.set(trackIndex, max);
      });
      
      setAudioLevels(newLevels);
      
      // Update Master Level
      if (masterAnalyserRef.current) {
        const dataArray = new Uint8Array(masterAnalyserRef.current.frequencyBinCount);
        masterAnalyserRef.current.getByteTimeDomainData(dataArray);
        
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = Math.abs((dataArray[i] - 128) / 128);
          if (normalized > max) max = normalized;
        }
        setMasterAudioLevel(max);
      }
      
      frameId = requestAnimationFrame(update);
    };
    
    frameId = requestAnimationFrame(update);
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isPlaying]);

  // Überwache Clip-Änderungen
  useEffect(() => {
    if (!isPlaying || isSeekingRef.current) {
      previousClipsRef.current = clips;
      return;
    }

    const previousClipIds = new Set(previousClipsRef.current.map(c => c.id));
    const currentClipIds = new Set(clips.map(c => c.id));

    const deletedClipIds: string[] = [];
    previousClipIds.forEach(id => {
      if (!currentClipIds.has(id)) {
        deletedClipIds.push(id);
      }
    });

    if (deletedClipIds.length > 0) {
      deletedClipIds.forEach(clipId => {
        const source = sourceNodesRef.current.get(clipId);
        const gain = gainNodesRef.current.get(clipId);
        const panner = pannerNodesRef.current.get(clipId);
        
        if (source) {
          try {
            source.onended = null;
            source.stop();
            source.disconnect();
          } catch (e) {}
          sourceNodesRef.current.delete(clipId);
        }
        
        if (gain) {
          try {
            gain.disconnect();
          } catch (e) {}
          gainNodesRef.current.delete(clipId);
        }
        
        if (panner) {
          try {
            panner.disconnect();
          } catch (e) {}
          pannerNodesRef.current.delete(clipId);
        }
      });
    }

    const hasClipPositionChanged = clips.some(clip => {
      const prevClip = previousClipsRef.current.find(c => c.id === clip.id);
      return prevClip && (
        prevClip.x !== clip.x || 
        prevClip.width !== clip.width ||
        prevClip.duration !== clip.duration ||
        prevClip.trackIndex !== clip.trackIndex
      );
    });

    if (hasClipPositionChanged) {
      const currentPlaybackTime = currentTime;
      
      sourceNodesRef.current.forEach((source) => {
        try {
          source.onended = null;
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      sourceNodesRef.current.clear();
      
      gainNodesRef.current.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {}
      });
      gainNodesRef.current.clear();
      
      pannerNodesRef.current.forEach(panner => {
        try {
          panner.disconnect();
        } catch (e) {}
      });
      pannerNodesRef.current.clear();
      
      startPlaybackInternal(currentPlaybackTime);
    }

    previousClipsRef.current = clips;
  }, [clips, isPlaying, currentTime]);

  // Aktualisiere Gain und Pan
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current) return;
    
    const currentAudioTime = audioContextRef.current.currentTime;
    
    if (masterGainRef.current) {
      const masterVolume = master.muted ? 0 : master.volume;
      masterGainRef.current.gain.setTargetAtTime(masterVolume, currentAudioTime, 0.05);
    }
    
    gainNodesRef.current.forEach((gainNode, clipId) => {
      const clip = clips.find(c => c.id === clipId);
      if (!clip) return;
      
      const track = tracks[clip.trackIndex];
      if (!track) return;
      
      const isAudible = isTrackAudible(clip.trackIndex);
      const trackVolume = isAudible ? track.volume : 0;
      
      gainNode.gain.setTargetAtTime(trackVolume, currentAudioTime, 0.05);
    });
    
    pannerNodesRef.current.forEach((pannerNode, clipId) => {
      const clip = clips.find(c => c.id === clipId);
      if (!clip) return;
      
      const track = tracks[clip.trackIndex];
      if (!track) return;
      
      pannerNode.pan.setTargetAtTime(track.pan, currentAudioTime, 0.05);
    });
  }, [tracks, master, clips, isPlaying, isTrackAudible]);

  const stopAllSources = useCallback(() => {
    sourceNodesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    sourceNodesRef.current.clear();
    
    gainNodesRef.current.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {}
    });
    gainNodesRef.current.clear();
    
    pannerNodesRef.current.forEach(panner => {
      try {
        panner.disconnect();
      } catch (e) {}
    });
    pannerNodesRef.current.clear();
    
    analyserNodesRef.current.forEach(analyser => {
      try {
        analyser.disconnect();
      } catch (e) {}
    });
    analyserNodesRef.current.clear();
    
    // Erstelle Analyser neu für nächstes Playback
    if (audioContextRef.current && masterGainRef.current) {
      tracks.forEach(track => {
        const analyser = audioContextRef.current!.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.connect(masterGainRef.current!);
        analyserNodesRef.current.set(track.index, analyser);
      });
    }
  }, [tracks]);

  const stopClipSource = useCallback((clipId: string) => {
    const source = sourceNodesRef.current.get(clipId);
    const gain = gainNodesRef.current.get(clipId);
    const panner = pannerNodesRef.current.get(clipId);
    
    if (source) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch (e) {}
      sourceNodesRef.current.delete(clipId);
    }
    
    if (gain) {
      try {
        gain.disconnect();
      } catch (e) {}
      gainNodesRef.current.delete(clipId);
    }
    
    if (panner) {
      try {
        panner.disconnect();
      } catch (e) {}
      pannerNodesRef.current.delete(clipId);
    }
  }, []);

  const startPlaybackInternal = (fromTime: number) => {
    if (!audioContextRef.current || !masterGainRef.current) {
      return;
    }

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    let startedAnyClip = false;

    // Stelle sicher, dass Analyser existieren
    tracks.forEach(track => {
      if (!analyserNodesRef.current.has(track.index)) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyser.connect(masterGainRef.current!);
        analyserNodesRef.current.set(track.index, analyser);
      }
    });

    clips.forEach(clip => {
      if (!clip.audioBuffer) return;

      const clipStartTime = clip.x / pixelsPerSecond;
      const clipDuration = clip.trimEnd - clip.trimStart;
      const clipEndTime = clipStartTime + clipDuration;

      if (fromTime < clipEndTime) {
        const track = tracks[clip.trackIndex];
        if (!track) return;

        const pannerNode = audioContext.createStereoPanner();
        pannerNode.pan.value = track.pan;
        
        const gainNode = audioContext.createGain();
        const isAudible = isTrackAudible(clip.trackIndex);
        const trackVolume = isAudible ? track.volume : 0;
        gainNode.gain.value = trackVolume;
        
        const trackAnalyser = analyserNodesRef.current.get(clip.trackIndex);
        
        pannerNode.connect(gainNode);
        if (trackAnalyser) {
          gainNode.connect(trackAnalyser);
        } else {
          gainNode.connect(masterGainRef.current);
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = clip.audioBuffer;
        source.connect(pannerNode);

        let audioStartOffset = clip.trimStart;
        let scheduleDelay = 0;

        if (fromTime < clipStartTime) {
          scheduleDelay = clipStartTime - fromTime;
          audioStartOffset = clip.trimStart;
        } else {
          scheduleDelay = 0;
          const timeIntoClip = fromTime - clipStartTime;
          audioStartOffset = clip.trimStart + timeIntoClip;
        }

        const remainingInTrim = clip.trimEnd - audioStartOffset;
        
        if (remainingInTrim > 0) {
          const startAt = now + scheduleDelay;
          
          source.start(startAt, audioStartOffset, remainingInTrim);
          sourceNodesRef.current.set(clip.id, source);
          gainNodesRef.current.set(clip.id, gainNode);
          pannerNodesRef.current.set(clip.id, pannerNode);
          startedAnyClip = true;

          source.onended = () => {
            sourceNodesRef.current.delete(clip.id);
            
            const gain = gainNodesRef.current.get(clip.id);
            if (gain) {
              try {
                gain.disconnect();
              } catch (e) {}
              gainNodesRef.current.delete(clip.id);
            }
            
            const panner = pannerNodesRef.current.get(clip.id);
            if (panner) {
              try {
                panner.disconnect();
              } catch (e) {}
              pannerNodesRef.current.delete(clip.id);
            }
            
            if (sourceNodesRef.current.size === 0) {
              setIsPlaying(false);
            }
          };
        }
      }
    });

    if (startedAnyClip) {
      playbackStartTimeRef.current = now;
      playbackOffsetRef.current = fromTime;
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const startPlayback = useCallback((fromTime: number) => {
    stopAllSources();
    startPlaybackInternal(fromTime);
  }, [clips, pixelsPerSecond, tracks, isTrackAudible, stopAllSources]);

  const play = useCallback(() => {
    startPlayback(currentTime);
  }, [startPlayback, currentTime]);

  const pause = useCallback(() => {
    stopAllSources();
    setIsPlaying(false);
  }, [stopAllSources]);

  const stop = useCallback(() => {
    stopAllSources();
    setIsPlaying(false);
    setCurrentTime(0);
    playbackOffsetRef.current = 0;
  }, [stopAllSources]);

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    
    isSeekingRef.current = true;
    
    stopAllSources();

    setCurrentTime(time);
    playbackOffsetRef.current = time;

    if (wasPlaying) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          startPlaybackInternal(time);
          
          setTimeout(() => {
            isSeekingRef.current = false;
          }, 50);
        });
      });
    } else {
      setIsPlaying(false);
      isSeekingRef.current = false;
    }
  }, [isPlaying, stopAllSources]);

  return {
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    seek,
    stopClipSource,
    audioLevels,
    masterAudioLevel,
  };
};