


import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, Circle, Type, FolderPlus, Star, Trash2, Triangle, Hexagon, Shapes, ChevronDown 
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { ShapeType, AppState } from '../../types';

interface InsertMenuProps {
  state: AppState;
  onAddElement: (type: ShapeType) => void;
  onUpdate: (updates: Partial<AppState>) => void;
  onDelete: () => void;
}

export const InsertMenu: React.FC<InsertMenuProps> = ({ 
  state, onAddElement, onUpdate, onDelete 
}) => {
  const [showShapes, setShowShapes] = useState(false);
  const shapesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapesRef.current && !shapesRef.current.contains(event.target as Node)) {
        setShowShapes(false);
      }
    };
    if (showShapes) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShapes]);

  return (
    <>
      <div className="flex items-center gap-1">
        <ToolbarButton 
          icon={Star} 
          title="Icon Library" 
          description="Browse standard vector icons." 
          shortcut="I" 
          onClick={() => onUpdate({ isIconPickerOpen: true })} 
        />

        <div className="w-px h-4 bg-[#444] mx-1" />
        
        <ToolbarButton 
          icon={Square} 
          title="Rectangle" 
          description="Add a sharp geometric base." 
          shortcut="R" 
          onClick={() => onAddElement('rectangle')} 
        />

        <ToolbarButton 
          icon={Circle} 
          title="Circle" 
          description="Add a perfect circle." 
          shortcut="C" 
          onClick={() => onAddElement('circle')} 
        />

        <div className="relative" ref={shapesRef}>
            <button 
                onClick={() => setShowShapes(!showShapes)}
                className={`p-2 rounded transition-colors flex items-center gap-1 ${showShapes ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                title="More Shapes"
            >
                <Shapes size={18} />
                <ChevronDown size={10} />
            </button>
            
            {showShapes && (
                <div className="absolute top-full left-0 mt-2 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 w-40 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/50">
                     <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#333] mb-1">
                        Primitives
                     </div>
                     <button onClick={() => { onAddElement('rounded'); setShowShapes(false); }} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors w-full text-left group">
                        <div className="w-4 h-4 border-2 border-gray-500 group-hover:border-white rounded-md transition-colors" />
                        <span className="text-xs font-medium">Rounded Rect</span>
                     </button>
                     <button onClick={() => { onAddElement('squircle'); setShowShapes(false); }} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors w-full text-left group">
                        <div className="w-4 h-4 border-2 border-gray-500 group-hover:border-white rounded-[6px] transition-colors" style={{ borderRadius: '35%' }} />
                        <span className="text-xs font-medium">Squircle</span>
                     </button>
                     <button onClick={() => { onAddElement('triangle'); setShowShapes(false); }} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors w-full text-left group">
                        <Triangle size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-xs font-medium">Triangle</span>
                     </button>
                     <button onClick={() => { onAddElement('star'); setShowShapes(false); }} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors w-full text-left group">
                        <Star size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-xs font-medium">Star</span>
                     </button>
                     <button onClick={() => { onAddElement('hexagon'); setShowShapes(false); }} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors w-full text-left group">
                        <Hexagon size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                        <span className="text-xs font-medium">Hexagon</span>
                     </button>
                </div>
            )}
        </div>

        <ToolbarButton 
          icon={Type} 
          title="Text Layer" 
          description="Add typography with 3D depth." 
          shortcut="T" 
          onClick={() => onAddElement('text')} 
        />

        <div className="w-px h-4 bg-[#444] mx-1" />
        
        <ToolbarButton 
          icon={FolderPlus} 
          title="New Group" 
          description="Create a folder to organize layers." 
          shortcut="G" 
          onClick={() => onAddElement('folder')} 
        />
      </div>

      <div className="w-px h-6 bg-[#444] mx-2" />

      <div className="flex items-center gap-1">
        <ToolbarButton 
          icon={Trash2} 
          title="Delete Selection" 
          description="Permanently remove selected objects." 
          shortcut="Del" 
          variant="danger"
          disabled={state.selectedIds.length === 0}
          onClick={onDelete} 
        />
      </div>
    </>
  );
};
