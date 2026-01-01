import React from 'react';
import { Info, Combine, ScanLine } from 'lucide-react';
import { AppState, ShapeType } from '../types';
import { ExportOptions } from '../hooks/useExport';

// Sub-Modules
import { FileMenu } from './toolbar/FileMenu';
import { EditMenu } from './toolbar/EditMenu';
import { InsertMenu } from './toolbar/InsertMenu';
import { ViewMenu } from './toolbar/ViewMenu';
import { ExportMenu } from './toolbar/ExportMenu';
import { ToolbarButton } from './toolbar/ToolbarButton';

interface ToolbarProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
  onAddElement: (type: ShapeType) => void;
  onDelete: () => void;
  onExport: (options: ExportOptions) => void;
  onNewProject: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBooleanUnion?: () => void;
  onBooleanSubtract?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  state, 
  onUpdate, 
  onAddElement,
  onDelete,
  onExport,
  onNewProject,
  undo,
  redo,
  canUndo,
  canRedo,
  onBooleanUnion,
  onBooleanSubtract
}) => {
  // Check if selection contains unsupported types for Union (Text, Icon, Folder)
  const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id));
  const hasUnsupportedUnionType = selectedElements.some(el => 
      ['text', 'icon', 'folder'].includes(el.type)
  );
  const canUnion = state.selectedIds.length > 0 && !hasUnsupportedUnionType;
  const canSubtract = state.selectedIds.length === 2 && !hasUnsupportedUnionType;

  return (
    <div className="h-14 bg-[#2a2a2a] border-b border-[#333] flex items-center px-4 justify-between select-none z-50 relative">
      
      {/* LEFT: Editor Tools */}
      <div className="flex items-center gap-2">
        
        {/* File Operations */}
        <FileMenu 
          state={state} 
          onNewProject={onNewProject} 
          onUpdate={onUpdate} 
        />

        <div className="w-px h-4 bg-[#444] mx-1" />

        {/* Edit Operations (Undo/Redo/Select) */}
        <EditMenu 
          state={state} 
          undo={undo} 
          redo={redo} 
          canUndo={canUndo} 
          canRedo={canRedo} 
          onUpdate={onUpdate} 
        />
        
        {/* Boolean Tools */}
        <div className="flex items-center gap-1 border-l border-[#444] pl-2 ml-2">
            <ToolbarButton 
              icon={Combine} 
              title="Union (Merge)" 
              description={hasUnsupportedUnionType ? "Union not supported for Text/Icons" : "Merge selected shapes into a single clay surface."} 
              onClick={onBooleanUnion || (() => {})} 
              disabled={!canUnion}
            />
            <ToolbarButton 
              icon={ScanLine} 
              title="Subtract (Mask)" 
              description={hasUnsupportedUnionType ? "Subtract not supported for Text/Icons" : "Use the top shape to mask the bottom shape."} 
              onClick={onBooleanSubtract || (() => {})} 
              disabled={!canSubtract}
            />
        </div>

        <div className="w-px h-4 bg-[#444] mx-1" />

        {/* Insertion Tools */}
        <InsertMenu 
          state={state} 
          onAddElement={onAddElement} 
          onUpdate={onUpdate} 
          onDelete={onDelete} 
        />
      </div>

      {/* RIGHT: View & Export */}
      <div className="flex items-center gap-4">
         
         <ViewMenu 
           state={state} 
           onUpdate={onUpdate} 
         />
        
        <div className="w-px h-6 bg-[#444] mx-2" />

        <ExportMenu 
          state={state} 
          onUpdate={onUpdate} 
          onExport={onExport} 
        />

        <div className="w-px h-6 bg-[#444] mx-2" />

        <ToolbarButton
           icon={Info}
           title="Documentation"
           description="Learn about the Clay Engine physics."
           onClick={() => onUpdate({ isInfoOpen: true })}
           className="rounded-full"
        />

      </div>
    </div>
  );
};