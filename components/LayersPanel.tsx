import React, { useState, useRef, useEffect } from 'react';
import { AppState, CanvasElement, ClayStyle, BlendMode } from '../types';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  GripVertical, 
  Trash2, 
  Type, 
  Circle, 
  Square, 
  Layers,
  Blend,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowDownRight,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';

interface LayersPanelProps {
  state: AppState;
  onSelect: (id: string | string[] | null, multi: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement> | { style: Partial<ClayStyle> }) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string | null) => void;
  onRecordHistory: () => void;
}

const BLEND_MODES: { category: string; modes: BlendMode[] }[] = [
  { category: 'Basic', modes: ['normal'] },
  { category: 'Darken', modes: ['multiply', 'darken', 'color-burn'] },
  { category: 'Lighten', modes: ['screen', 'lighten', 'color-dodge'] },
  { category: 'Contrast', modes: ['overlay', 'soft-light', 'hard-light'] },
  { category: 'Inversion', modes: ['difference', 'exclusion'] },
  { category: 'Component', modes: ['hue', 'saturation', 'color', 'luminosity'] },
];

const BlendModePicker = ({ 
  current, 
  onChange, 
  onOpen 
}: { 
  current: string; 
  onChange: (val: string) => void;
  onOpen: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button 
                onClick={() => { setIsOpen(!isOpen); onOpen(); }}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-gray-200 focus:border-blue-500 outline-none h-7 flex items-center justify-between hover:bg-[#222] transition-colors"
            >
                <span className="capitalize">{current.replace('-', ' ')}</span>
                <ChevronDownIcon size={12} className="text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-[180px] mt-1 bg-[#252525] border border-[#333] rounded-lg shadow-2xl z-[9999] max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {(BLEND_MODES || []).map((group) => (
                        <div key={group.category} className="mb-2 last:mb-0">
                            <div className="text-[9px] font-bold text-gray-500 px-2 py-1 uppercase tracking-wider sticky top-0 bg-[#252525]">
                                {group.category}
                            </div>
                            <div className="space-y-0.5">
                                {(group.modes || []).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            onChange(mode);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center justify-between group ${current === mode ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#333]'}`}
                                    >
                                        <span className="capitalize">{mode.replace('-', ' ')}</span>
                                        {current === mode && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
  state,
  onSelect,
  onUpdateElement,
  onDelete,
  onReorder,
  onContextMenu,
  onRecordHistory
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);
  const [lastActiveId, setLastActiveId] = useState<string | null>(null);

  // --- Helper: Get flattened list of currently visible items ---
  const getVisibleItems = () => {
    const flat: string[] = [];
    const traverse = (parentId: string | null) => {
        // Get children
        const children = state.elements.filter(el => 
            (parentId === null && el.parentId === null) || el.parentId === parentId
        );
        // Sort (Matches renderTreeItem order)
        children.sort((a, b) => {
            const indexA = state.elements.indexOf(a);
            const indexB = state.elements.indexOf(b);
            return indexB - indexA;
        });
        
        children.forEach(child => {
            flat.push(child.id);
            // If folder and open, recurse
            if (child.type === 'folder' && !child.collapsed) {
                traverse(child.id);
            }
        });
    };
    traverse(null);
    return flat;
  };

  // --- Tree Building Logic ---
  const buildTree = (elements: CanvasElement[], parentId: string | null = null): CanvasElement[] => {
      // Find all children
      const children = elements.filter(el => 
        el.parentId === (parentId === null ? undefined : parentId) || 
        (parentId === null && el.parentId === null)
      );
      
      // Sort by their index in the main elements array (descending / reversed)
      // This ensures the visual stack in layers matches the rendering order (last is top)
      children.sort((a, b) => {
          const indexA = state.elements.indexOf(a);
          const indexB = state.elements.indexOf(b);
          return indexB - indexA;
      });
      
      return children;
  };

  const rootElements = buildTree(state.elements, null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string, type: string) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    // Logic: 
    // Top 25% -> Drop Above (Reorder)
    // Bottom 25% -> Drop Below (Reorder)
    // Middle 50% -> Drop Inside (Parenting), only if folder
    
    if (type === 'folder' && offsetY > rect.height * 0.25 && offsetY < rect.height * 0.75) {
        setDropPosition('inside');
    } else if (offsetY < rect.height * 0.5) {
        setDropPosition('top');
    } else {
        setDropPosition('bottom');
    }
    
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sourceId = e.dataTransfer.getData('text/plain');
    setDragOverId(null);
    setDropPosition(null);

    if (sourceId === targetId) return;

    // Find indices
    const sourceEl = state.elements.find(e => e.id === sourceId);
    const targetEl = state.elements.find(e => e.id === targetId);
    if (!sourceEl || !targetEl) return;

    // prevent dropping parent into child
    const isDescendant = (parent: string, child: string): boolean => {
         const els = state.elements.filter(e => e.parentId === child);
         for (const el of els) {
             if (el.id === parent) return true;
             if (isDescendant(parent, el.id)) return true;
         }
         return false;
    };
    
    if (isDescendant(targetId, sourceId)) return;

    if (dropPosition === 'inside') {
        onRecordHistory();
        onUpdateElement(sourceId, { parentId: targetId });
    } else {
        // onReorder handles history internally
        const sourceIndex = state.elements.findIndex(e => e.id === sourceId);
        const targetIndex = state.elements.findIndex(e => e.id === targetId);
        
        onRecordHistory();
        // Update parent to match target
        onUpdateElement(sourceId, { parentId: targetEl.parentId });
        
        // Reorder
        // Note: Dragging visually ONTO a target implies swapping or inserting.
        // We use standard list reorder via index splice in App.tsx
        onReorder(sourceIndex, targetIndex);
    }
  };

  const handleLayerClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isShift && lastActiveId) {
         const visible = getVisibleItems();
         const idxA = visible.indexOf(lastActiveId);
         const idxB = visible.indexOf(id);
         
         if (idxA !== -1 && idxB !== -1) {
             const start = Math.min(idxA, idxB);
             const end = Math.max(idxA, idxB);
             const range = visible.slice(start, end + 1);
             onSelect(range, isCtrl); // If Ctrl is held, add range. If not, replace.
             return;
         }
    }

    // Normal click or Ctrl Click
    onSelect(id, isCtrl);
    setLastActiveId(id);
  };

  const renderTreeItem = (el: CanvasElement, depth: number = 0) => {
      const isSelected = state.selectedIds.includes(el.id);
      const isFolder = el.type === 'folder';
      const hasChildren = state.elements.some(e => e.parentId === el.id);
      const children = hasChildren ? buildTree(state.elements, el.id) : [];
      const isMasked = !!el.maskId;

      return (
          <div key={el.id} className="flex flex-col">
              <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragOver={(e) => handleDragOver(e, el.id, el.type)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, el.id)}
                  onClick={(e) => handleLayerClick(e, el.id)}
                  onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenu(e, el.id);
                  }}
                  className={`
                      group relative flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all border-y-2 border-transparent
                      ${isSelected ? 'bg-blue-900/30' : 'hover:bg-[#2a2a2a]'}
                      ${dragOverId === el.id && dropPosition === 'top' ? 'border-t-blue-500' : ''}
                      ${dragOverId === el.id && dropPosition === 'bottom' ? 'border-b-blue-500' : ''}
                      ${dragOverId === el.id && dropPosition === 'inside' ? 'bg-blue-500/20' : ''}
                      ${!el.visible ? 'opacity-50' : ''}
                  `}
                  style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                   {/* Folder Toggle */}
                   {isFolder ? (
                       <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { collapsed: !el.collapsed }); }}
                          className="text-gray-500 hover:text-white p-0.5"
                       >
                          {el.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                       </button>
                   ) : (
                       <div className="w-4 flex items-center justify-center">
                          {isMasked && <ArrowDownRight size={10} className="text-gray-500" />}
                       </div>
                   )}

                   {/* Visibility */}
                   <button 
                     onClick={(e) => { 
                         e.stopPropagation(); 
                         onRecordHistory();
                         onUpdateElement(el.id, { visible: !el.visible }); 
                     }}
                     className={`p-1 rounded hover:bg-[#333] ${el.visible ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
                   >
                     {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                   </button>

                   {/* Icon */}
                   <span className={`opacity-70 ${isFolder ? 'text-yellow-400' : (isMasked ? 'text-purple-400' : 'text-blue-400')}`}>
                      {isFolder ? (el.collapsed ? <Folder size={14} /> : <FolderOpen size={14} />) : 
                        (el.type === 'text' ? <Type size={14} /> : 
                        el.type === 'circle' ? <Circle size={14} /> : 
                        <Square size={14} />)}
                   </span>

                   {/* Name */}
                   <div className="flex-1 min-w-0">
                      {editingId === el.id ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={el.name}
                          onBlur={(e) => {
                              onRecordHistory();
                              onUpdateElement(el.id, { name: e.target.value });
                              setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  onRecordHistory();
                                  onUpdateElement(el.id, { name: (e.target as HTMLInputElement).value });
                                  setEditingId(null);
                              }
                          }}
                          className="bg-[#111] text-white px-1 py-0.5 text-xs rounded w-full border border-blue-500 outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span 
                            className={`truncate text-xs cursor-text block ${isSelected ? 'text-white font-medium' : 'text-gray-300'}`}
                            onDoubleClick={() => setEditingId(el.id)}
                        >
                            {el.name}
                        </span>
                      )}
                   </div>

                   {/* Lock */}
                   {el.locked && <Lock size={10} className="text-orange-400 ml-1" />}
              </div>
              
              {/* Recursive Children */}
              {isFolder && !el.collapsed && (
                  <div>
                      {(children || []).map(child => renderTreeItem(child, depth + 1))}
                  </div>
              )}
          </div>
      );
  };

  const selectedElement = state.elements.find(el => el.id === state.selectedIds[0]);
  const hasSelection = !!selectedElement;

  return (
    <div 
      className="w-64 bg-[#252525] border-r border-[#333] flex flex-col h-full overflow-hidden select-none z-10"
      onContextMenu={(e) => onContextMenu(e, null)}
    >
      <div className="p-4 border-b border-[#333] bg-[#2a2a2a] flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Layers size={16} className="text-gray-400" />
          Layers
        </h2>
        <span className="text-xs text-gray-500">{state.elements.length} Items</span>
      </div>

      <div className={`px-4 py-3 border-b border-[#333] bg-[#222] space-y-3 transition-opacity duration-200 ${hasSelection ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
            <div className="flex items-center gap-2 mb-1">
               <Blend size={12} className="text-blue-400" />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Blending</span>
            </div>
            <div className="flex gap-2">
               <div className="flex-1">
                  <BlendModePicker 
                    current={selectedElement?.style.blendMode || 'normal'}
                    onOpen={() => onRecordHistory()}
                    onChange={(val) => selectedElement && onUpdateElement(selectedElement.id, { style: { blendMode: val } })}
                  />
               </div>
               <div className="w-16 relative">
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={selectedElement ? Math.round(selectedElement.style.opacity * 100) : 100}
                    disabled={!hasSelection}
                    onFocus={() => onRecordHistory()}
                    onChange={(e) => {
                        if (!selectedElement) return;
                        const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        onUpdateElement(selectedElement.id, { style: { opacity: val / 100 } });
                    }}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded pl-2 pr-4 py-1 text-xs text-gray-200 focus:border-blue-500 outline-none h-7 text-right disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-1.5 top-1.5 text-[10px] text-gray-500">%</span>
               </div>
            </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar"
        onDragOver={(e) => {
            e.preventDefault();
        }}
        onDrop={(e) => {
            e.preventDefault();
            const sourceId = e.dataTransfer.getData('text/plain');
            if (sourceId) {
                onRecordHistory();
                onUpdateElement(sourceId, { parentId: null });
            }
        }}
      >
        {state.elements.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-10 opacity-50">
                No layers<br/>Add a shape to start
            </div>
        )}
        {(rootElements || []).map(el => renderTreeItem(el, 0))}
      </div>
    </div>
  );
};