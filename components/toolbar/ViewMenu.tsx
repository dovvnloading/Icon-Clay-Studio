
import React from 'react';
import { Grid, Magnet, ZoomIn, ZoomOut } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { AppState } from '../../types';
import { Tooltip } from '../Tooltip';

interface ViewMenuProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ state, onUpdate }) => {
  return (
    <div className="flex items-center gap-4">
       {/* Zoom Control Group */}
       <div className="flex items-center gap-1 bg-[#1a1a1a] rounded p-1 border border-[#333]">
         <Tooltip title="Zoom Out" description="Decrease view scale." shortcut="Ctrl -">
           <button 
             onClick={() => onUpdate({ zoom: Math.max(0.1, state.zoom - 0.1) })}
             className="p-1.5 text-gray-400 hover:text-white"
           >
             <ZoomOut size={14} />
           </button>
         </Tooltip>
         
         <span className="text-xs text-gray-400 w-10 text-center font-mono">
           {Math.round(state.zoom * 100)}%
         </span>
         
         <Tooltip title="Zoom In" description="Increase view scale." shortcut="Ctrl +">
           <button 
             onClick={() => onUpdate({ zoom: Math.min(3, state.zoom + 0.1) })}
             className="p-1.5 text-gray-400 hover:text-white"
           >
             <ZoomIn size={14} />
           </button>
         </Tooltip>
       </div>

      <div className="flex items-center gap-1">
        <ToolbarButton 
          icon={Magnet} 
          title="Snap to Grid" 
          description="Magnetic snapping for alignment." 
          shortcut="S" 
          isActive={state.snapToGrid}
          onClick={() => onUpdate({ snapToGrid: !state.snapToGrid })} 
        />

        <ToolbarButton 
          icon={Grid} 
          title="Toggle Grid" 
          description="Show or hide layout grid." 
          shortcut="'" 
          isActive={state.showGrid}
          onClick={() => onUpdate({ showGrid: !state.showGrid })} 
        />
      </div>
    </div>
  );
};
