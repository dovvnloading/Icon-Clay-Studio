import { useEffect } from 'react';
import { AppState, CanvasElement } from '../types';

export interface ShortcutActions {
    handleDelete: () => void;
    handleDuplicate: () => void;
    handleCopy: () => void;
    handlePaste: () => void;
    handleGroup: () => void;
    handleUngroup: () => void;
    handleNudge: (dx: number, dy: number) => void;
    handleAddElement: (type: any) => void;
    handleUpdateState: (u: any) => void;
    handleExport: (f: any) => void;
    undo: () => void;
    redo: () => void;
}

export const useKeyboardShortcuts = (
    state: AppState, 
    actions: ShortcutActions,
    clipboard: CanvasElement[]
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Prevent shortcuts when typing in inputs
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        actions.handleDelete();
        return;
      }

      // Undo / Redo / Select All / Copy / Paste / Duplicate / Group / Grid / Export
      if (isCtrl) {
        if (e.key === 'z') {
           e.preventDefault();
           if (isShift) {
               actions.redo();
           } else {
               actions.undo();
           }
           return;
        }
        if (e.key === 'y') {
            e.preventDefault();
            actions.redo();
            return;
        }

        if (e.key === 'a') {
          e.preventDefault();
          actions.handleUpdateState({ selectedIds: state.elements.map(el => el.id) });
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          actions.handleDuplicate();
          return;
        }
        if (e.key === 'c') {
          e.preventDefault();
          actions.handleCopy();
          return;
        }
        if (e.key === 'v') {
          e.preventDefault();
          actions.handlePaste();
          return;
        }
        if (e.key === 'g') {
            e.preventDefault();
            if (isShift) {
                actions.handleUngroup();
            } else {
                actions.handleGroup();
            }
            return;
        }
        if (e.key === "'" || e.key === '"') {
          e.preventDefault();
          actions.handleUpdateState({ showGrid: !state.showGrid });
          return;
        }
        if (e.key === 'e') {
           e.preventDefault();
           actions.handleExport({ format: 'png' });
           return;
        }
      }

      // Escape to deselect or close modals
      if (e.key === 'Escape') {
        if (state.isPreviewOpen) {
            actions.handleUpdateState({ isPreviewOpen: false });
            return;
        }
        actions.handleUpdateState({ selectedIds: [] });
        return;
      }

      // Nudge with arrows
      if (state.selectedIds.length > 0) {
        const step = isShift ? 10 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); actions.handleNudge(-step, 0); }
        if (e.key === 'ArrowRight') { e.preventDefault(); actions.handleNudge(step, 0); }
        if (e.key === 'ArrowUp') { e.preventDefault(); actions.handleNudge(0, -step); }
        if (e.key === 'ArrowDown') { e.preventDefault(); actions.handleNudge(0, step); }
      }

      // Shape Creation (No modifiers)
      if (!isCtrl && !e.altKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'r') actions.handleAddElement('rectangle');
        if (key === 'o' || key === 'c') actions.handleAddElement('circle');
        if (key === 't') actions.handleAddElement('text');
        if (key === 'u') actions.handleAddElement('rounded');
        if (key === 'g') actions.handleAddElement('folder');
      }

      // Zoom
      if (isCtrl || e.key === '+' || e.key === '-') {
        if (isCtrl && (e.key === '=' || e.key === '+')) {
           e.preventDefault();
           actions.handleUpdateState({ zoom: Math.min(3, state.zoom + 0.1) });
        }
        if (isCtrl && e.key === '-') {
           e.preventDefault();
           actions.handleUpdateState({ zoom: Math.max(0.1, state.zoom - 0.1) });
        }
        if (isCtrl && e.key === '0') {
           e.preventDefault();
           actions.handleUpdateState({ zoom: 1, viewOffset: { x: 0, y: 0 } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state, 
    clipboard, 
    actions
  ]);
};