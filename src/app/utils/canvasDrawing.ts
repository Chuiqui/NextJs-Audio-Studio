// utils/canvasDrawing.ts
import { Clip, TimelineConfig } from '../types/timeline.types';

export const drawRuler = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  rulerHeight: number,
  scrollOffset: number,
  pixelsPerSecond: number,
  maxSeconds: number
) => {
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, canvasWidth, rulerHeight);
  
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, rulerHeight);
  ctx.lineTo(canvasWidth, rulerHeight);
  ctx.stroke();

  const startSecond = Math.floor(scrollOffset / pixelsPerSecond);
  const endSecond = Math.ceil((scrollOffset + canvasWidth) / pixelsPerSecond);
  
  for (let i = startSecond; i <= endSecond && i <= maxSeconds; i++) {
    const x = i * pixelsPerSecond - scrollOffset;
    
    if (x >= 0 && x <= canvasWidth) {
      ctx.strokeStyle = '#4b5563';
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight - 10);
      ctx.lineTo(x, rulerHeight);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px monospace';
      ctx.fillText(`${i}s`, x + 3, rulerHeight - 15);
    }
  }
};

export const drawTracks = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  rulerHeight: number,
  trackHeight: number,
  numberOfTracks: number
) => {
  for (let i = 0; i < numberOfTracks; i++) {
    const y = rulerHeight + i * trackHeight;
    
    ctx.fillStyle = i % 2 === 0 ? '#1a1f2e' : '#151923';
    ctx.fillRect(0, y, canvasWidth, trackHeight);
    
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    ctx.fillText(`Track ${i + 1}`, 8, y + 18);
  }
};

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  rulerHeight: number,
  scrollOffset: number,
  pixelsPerSecond: number,
  maxSeconds: number
) => {
  ctx.strokeStyle = '#1f2937';
  const startSecond = Math.floor(scrollOffset / pixelsPerSecond);
  const endSecond = Math.ceil((scrollOffset + canvasWidth) / pixelsPerSecond);
  
  for (let i = startSecond; i <= endSecond && i <= maxSeconds; i++) {
    const x = i * pixelsPerSecond - scrollOffset;
    if (x >= 0 && x <= canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(x, rulerHeight);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
  }
};

export const drawClip = (
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  scrollOffset: number,
  isSelected: boolean,
  rulerHeight: number,
  trackHeight: number
) => {
  const clipX = clip.x - scrollOffset;
  const clipY = rulerHeight + clip.trackIndex * trackHeight + 10;
  const clipHeight = trackHeight - 20;
  
  // ← NEU: Berechne die tatsächliche Dauer nach Trimming
  const actualDuration = clip.trimEnd - clip.trimStart;
  const displayWidth = actualDuration * (clip.width / clip.duration);
  
  ctx.fillStyle = clip.color;
  ctx.fillRect(clipX, clipY, displayWidth, clipHeight);

  ctx.strokeStyle = isSelected ? '#fbbf24' : '#1e293b';
  ctx.lineWidth = isSelected ? 3 : 1;
  ctx.strokeRect(clipX, clipY, displayWidth, clipHeight);

  // ← NEU: Trim-Handles zeichnen (beide Seiten)
  if (isSelected) {
    // Linker Trim-Handle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(clipX, clipY, 4, clipHeight);
    
    // Rechter Trim-Handle
    ctx.fillRect(clipX + displayWidth - 4, clipY, 4, clipHeight);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(clip.name, clipX + 8, clipY + 20);

  ctx.font = '11px Arial';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(`${actualDuration.toFixed(1)}s`, clipX + 8, clipY + 38);

  if (clip.audioBuffer) {
    drawWaveform(ctx, clip, clipX, clipY, clipHeight, displayWidth);
  }
};

const drawWaveform = (
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  clipX: number,
  clipY: number,
  clipHeight: number,
  displayWidth: number
) => {
  if (!clip.audioBuffer) return;
  
  const channelData = clip.audioBuffer.getChannelData(0);
  const sampleRate = clip.audioBuffer.sampleRate;
  
  // ← NEU: Nur den getrimmten Teil der Waveform anzeigen
  const trimStartSample = Math.floor(clip.trimStart * sampleRate);
  const trimEndSample = Math.floor(clip.trimEnd * sampleRate);
  const trimmedLength = trimEndSample - trimStartSample;
  
  const step = Math.max(1, Math.floor(trimmedLength / (displayWidth - 16)));
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < displayWidth - 16; i += 2) {
    const sampleIndex = trimStartSample + (i * step);
    if (sampleIndex >= channelData.length) break;
    
    const value = channelData[sampleIndex] || 0;
    const height = Math.abs(value) * 25;
    
    ctx.beginPath();
    ctx.moveTo(clipX + 8 + i, clipY + clipHeight / 2);
    ctx.lineTo(clipX + 8 + i, clipY + clipHeight / 2 - height);
    ctx.moveTo(clipX + 8 + i, clipY + clipHeight / 2);
    ctx.lineTo(clipX + 8 + i, clipY + clipHeight / 2 + height);
    ctx.stroke();
  }
};

export const drawPlayhead = (
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  pixelsPerSecond: number,
  scrollOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  rulerHeight: number
) => {
  const playheadX = currentTime * pixelsPerSecond - scrollOffset;
  
  if (playheadX >= 0 && playheadX <= canvasWidth) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvasHeight);
    ctx.stroke();
  }
};