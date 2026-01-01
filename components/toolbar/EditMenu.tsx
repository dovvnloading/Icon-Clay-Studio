
import React from 'react';
import { RotateCcw, RotateCw, MousePointer2 } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { AppState } from '../../types';

interface EditMenuProps {
  state: AppState;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUpdate: (updates: Partial<AppState>) => void;
}

export const EditMenu: React.FC<EditMenuProps> = ({ 
  state, undo, redo, canUndo, canRedo, onUpdate 
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Selection Tool is logically grouped here as it resets selection */}
      <div className="border-r border-[#444] pr-2 mr-2">
        <ToolbarButton
            icon={MousePointer2}
            title="Selection Tool"
            description="Select, move, and resize objects. Click blank space to drag-select."
            shortcut="V"
            isActive={state.selectedIds.length === 0}
            onClick={() => onUpdate({ selectedIds: [] })}
        />
      </div>

      <ToolbarButton 
        icon={RotateCcw} 
        title="Undo" 
        description="Revert the last action." 
        shortcut="Ctrl+Z" 
        disabled={!canUndo}
        onClick={undo} 
      />

      <ToolbarButton 
        icon={RotateCw} 
        title="Redo" 
        description="Reapply the last undone action." 
        shortcut="Ctrl+Y" 
        disabled={!canRedo}
        onClick={redo} 
      />
    </div>
  );
};
