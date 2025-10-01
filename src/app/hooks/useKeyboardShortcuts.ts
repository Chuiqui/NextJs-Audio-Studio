// hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export const useKeyboardShortcuts = (
  selectedClipId: string | null,
  onDelete: () => void,
  onPlayPause: () => void, // ← NEU
  isPlaying: boolean // ← NEU (optional, für besseres Feedback)
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prüfe ob ein Input-Feld fokussiert ist
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // ← NEU: Leertaste für Play/Pause
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Verhindert Scrollen der Seite
        onPlayPause();
        return;
      }

      // Delete oder Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        e.preventDefault();
        onDelete();
      }

      // Optional: Escape zum Deselektieren
      if (e.key === 'Escape' && selectedClipId) {
        e.preventDefault();
        // Hier kannst du eine separate onDeselect Funktion aufrufen
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedClipId, onDelete, onPlayPause, isPlaying]);
};