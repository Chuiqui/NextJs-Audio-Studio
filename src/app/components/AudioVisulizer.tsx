'use client';

import { useRef, useEffect, useMemo, useState, useCallback, } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import { createRoot } from 'react-dom/client'

export default function AudioTrack() {
  const waveformRef = useRef<HTMLDivElement>(null);


  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: waveformRef,
    height: 100,
    waveColor: 'rgb(31, 31, 194)',
    progressColor: 'rgb(100, 0, 100)',
    url: '/audio/song.mp3',
  })

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause()
  }, [wavesurfer])

  return (
    <div>
      <div ref={waveformRef} />
      <button onClick={onPlayPause} style={{ minWidth: '5em' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
    </div>
  );
}