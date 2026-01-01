import { useState, useCallback, useEffect } from 'react';
import { AppState, CanvasElement } from '../types';

const STORAGE_KEY = 'iconclay_session_v1';
const HISTORY_LIMIT = 50;

const DEFAULT_STATE: AppState = {
  elements: [],
  selectedIds: [],
  canvasSize: { width: 512, height: 512 },
  gridSize: 16,
  snapToGrid: true,
  showGrid: true,
  zoom: 0.8,
  viewOffset: { x: 0, y: 0 },
  backgroundColor: '#252525',
  transparentBackground: true,
  isIconPickerOpen: false,
  isInfoOpen: false,
  isPreviewOpen: false,
};

export const useEditorState = () => {
  // Initialize state from local storage if available
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with DEFAULT_STATE to ensure schema integrity
        // Reset ephemeral UI states (modals, selection)
        return {
          ...DEFAULT_STATE,
          ...parsed,
          isIconPickerOpen: false,
          isInfoOpen: false,
          isPreviewOpen: false,
          selectedIds: [],
        };
      }
    } catch (e) {
      console.warn("Failed to restore session:", e);
    }
    return DEFAULT_STATE;
  });

  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  
  // History Management
  const [past, setPast] = useState<AppState[]>([]);
  const [future, setFuture] = useState<AppState[]>([]);

  // Persistence Effect: Auto-save state to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save session:", e);
      }
    }, 1000); // 1s debounce to avoid thrashing storage

    return () => clearTimeout(timeoutId);
  }, [state]);

  const recordHistory = useCallback(() => {
    setPast(prev => {
        // Limit history size
        const newPast = [...prev, JSON.parse(JSON.stringify(state))];
        if (newPast.length > HISTORY_LIMIT) newPast.shift();
        return newPast;
    });
    setFuture([]);
  }, [state]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    const newPast = [...past];
    const previousState = newPast.pop();
    
    setFuture(prev => [JSON.parse(JSON.stringify(state)), ...prev]);
    setPast(newPast);
    
    if (previousState) {
        setState(previousState);
    }
  }, [state, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    const newFuture = [...future];
    const nextState = newFuture.shift();
    
    setPast(prev => [...prev, JSON.parse(JSON.stringify(state))]);
    setFuture(newFuture);

    if (nextState) {
        setState(nextState);
    }
  }, [state, future]);

  const clearState = useCallback(() => {
    setState(DEFAULT_STATE);
    setPast([]);
    setFuture([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { 
      state, 
      setState, 
      clipboard, 
      setClipboard,
      undo,
      redo,
      recordHistory,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      clearState
  };
};