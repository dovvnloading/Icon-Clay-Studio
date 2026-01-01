

import React, { useState, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { LayersPanel } from './components/LayersPanel';
import { Canvas } from './components/Canvas';
import { IconPicker } from './components/IconPicker';
import { InfoModal } from './components/InfoModal';
import { PreviewStudio } from './components/PreviewStudio';
import { ContextMenu, MenuItem } from './components/ContextMenu';
import { useEditorState } from './hooks/useEditorState';
import { useElementOperations } from './hooks/useElementOperations';
import { useExport } from './hooks/useExport';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  // --- STATE HOOKS ---
  const { 
    state, setState, clipboard, setClipboard,
    undo, redo, recordHistory, canUndo, canRedo, clearState
  } = useEditorState();
  
  // --- OPERATIONS HOOK ---
  const actions = useElementOperations(state, setState, clipboard, setClipboard, recordHistory);
  
  const {
      handleUpdateState,
      handleAddElement,
      handleUpdateElement,
      handleSelect,
      handleDelete,
      handleReorderElements,
      handleGroup,
      handleUnion,
      handleUngroup,
      handleMask,
      handleUnmask,
      handleCopy,
      handlePaste,
      handleDuplicate,
      handleNudge,
      handleArrangement,
      handleIconSelect
  } = actions;

  // --- EXPORT HOOK ---
  const { isExporting, handleExport } = useExport(state);

  // --- LOCAL UI STATE ---
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);

  // --- KEYBOARD SHORTCUTS ---
  useKeyboardShortcuts(state, { ...actions, handleExport, undo, redo }, clipboard);

  // --- CONTEXT MENU CONSTRUCTOR ---
  const handleContextMenu = useCallback((e: React.MouseEvent, id: string | null) => {
    e.preventDefault();
    
    let currentSelectedIds = state.selectedIds;
    if (id) {
        if (!state.selectedIds.includes(id)) {
            handleSelect(id, false);
            currentSelectedIds = [id];
        }
    } else {
        handleSelect(null, false);
        currentSelectedIds = [];
    }

    const items: MenuItem[] = [];

    if (currentSelectedIds.length > 0) {
        const isLocked = state.elements.find(el => el.id === currentSelectedIds[0])?.locked;
        const isSingle = currentSelectedIds.length === 1;
        const isMasked = state.elements.find(el => el.id === currentSelectedIds[0])?.maskId;

        items.push(
            { label: 'Copy', icon: 'Copy', shortcut: 'Ctrl+C', action: handleCopy },
            { label: 'Duplicate', icon: 'CopyPlus', shortcut: 'Ctrl+D', action: handleDuplicate },
            { label: 'Delete', icon: 'Trash2', shortcut: 'Del', action: () => handleDelete(), danger: true },
            { separator: true },
        );

        items.push(
            { label: 'Group Selection', icon: 'FolderPlus', shortcut: 'Ctrl+G', action: handleGroup },
            { label: 'Boolean Union (Merge)', icon: 'Combine', action: handleUnion },
            { label: 'Ungroup', icon: 'FolderMinus', shortcut: 'Ctrl+Shift+G', action: handleUngroup },
            { separator: true }
        );

        // Masking Options
        if (currentSelectedIds.length === 2) {
            items.push({ label: 'Mask with Shape', icon: 'Scissors', action: handleMask });
        } else if (currentSelectedIds.length === 1 && isMasked) {
            items.push({ label: 'Release Mask', icon: 'Maximize', action: handleUnmask });
        }
        items.push({ separator: true });

        if (isSingle) {
            items.push(
                { label: 'Bring Forward', icon: 'ChevronUp', shortcut: ']', action: () => handleArrangement('forward') },
                { label: 'Send Backward', icon: 'ChevronDown', shortcut: '[', action: () => handleArrangement('backward') },
                { separator: true },
                { 
                    label: isLocked ? 'Unlock' : 'Lock', 
                    icon: isLocked ? 'Unlock' : 'Lock', 
                    action: () => {
                         recordHistory();
                         handleUpdateElement(currentSelectedIds[0], { locked: !isLocked });
                    }
                }
            );
        }
    } else {
        if (clipboard.length > 0) {
            items.push({ label: 'Paste', icon: 'Clipboard', shortcut: 'Ctrl+V', action: handlePaste });
            items.push({ separator: true });
        }
        
        items.push(
            { label: 'New Rectangle', icon: 'Square', shortcut: 'R', action: () => handleAddElement('rectangle') },
            { label: 'New Circle', icon: 'Circle', shortcut: 'C', action: () => handleAddElement('circle') },
            { label: 'New Text', icon: 'Type', shortcut: 'T', action: () => handleAddElement('text') },
            { label: 'New Group', icon: 'FolderPlus', action: () => handleAddElement('folder') },
            { label: 'New Icon', icon: 'Star', action: () => handleUpdateState({ isIconPickerOpen: true }) }
        );
    }
    
    items.push({ separator: true });
    items.push({ label: 'Export PNG', icon: 'Download', action: () => handleExport({ format: 'png' }) });

    setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        items
    });
  }, [
      state.selectedIds, state.elements, clipboard.length, 
      handleCopy, handleDuplicate, handleDelete, handlePaste, 
      handleArrangement, handleAddElement, handleUpdateState, 
      handleUpdateElement, handleSelect, handleExport,
      handleGroup, handleUnion, handleUngroup, handleMask, handleUnmask, recordHistory
  ]);

  const selectedElement = state.elements.find(el => state.selectedIds.includes(el.id)) || null;

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-white overflow-hidden font-sans">
      <Toolbar 
        state={state} 
        onUpdate={handleUpdateState}
        onAddElement={handleAddElement}
        onDelete={() => handleDelete()}
        onExport={handleExport}
        onNewProject={clearState}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onBooleanUnion={handleUnion}
        onBooleanSubtract={handleMask}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <LayersPanel 
          state={state}
          onSelect={handleSelect}
          onUpdateElement={handleUpdateElement}
          onDelete={handleDelete}
          onReorder={handleReorderElements}
          onContextMenu={handleContextMenu}
          onRecordHistory={recordHistory}
        />
        
        <Canvas 
          state={state}
          onUpdateState={handleUpdateState}
          onUpdateElement={handleUpdateElement}
          onSelect={handleSelect}
          onContextMenu={handleContextMenu}
          onRecordHistory={recordHistory}
        />

        <PropertyPanel 
          state={state}
          element={selectedElement}
          onUpdate={(updates) => selectedElement && handleUpdateElement(selectedElement.id, updates)}
          onUpdateState={handleUpdateState}
          onRecordHistory={recordHistory}
        />
      </div>

      <IconPicker 
        isOpen={state.isIconPickerOpen}
        onClose={() => handleUpdateState({ isIconPickerOpen: false })}
        onSelect={handleIconSelect}
      />
      
      <InfoModal 
        isOpen={state.isInfoOpen}
        onClose={() => handleUpdateState({ isInfoOpen: false })}
      />

      <PreviewStudio 
        isOpen={state.isPreviewOpen}
        onClose={() => handleUpdateState({ isPreviewOpen: false })}
        state={state}
      />
      
      {contextMenu?.isOpen && (
        <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            items={contextMenu.items} 
            onClose={() => setContextMenu(null)} 
        />
      )}
      
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
            <div className="bg-[#2a2a2a] px-6 py-4 rounded-lg shadow-xl border border-[#333] flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white font-medium">Generating {isExporting ? 'Icon' : ''}...</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
