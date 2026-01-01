import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
// @ts-ignore
import * as HeroOutline from 'heroicons-outline';
// @ts-ignore
import * as HeroSolid from 'heroicons-solid';
import { X, Search, Check } from 'lucide-react';
import { IconLibrary } from '../types';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string, iconLib: IconLibrary) => void;
}

// Layout Constants
const ITEM_HEIGHT = 90; // Fixed height for grid rows
const MIN_COL_WIDTH = 80; // Minimum width for a column to determine column count
const GAP_PADDING = 6; // Padding inside each cell to create gaps

export const IconPicker: React.FC<IconPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [activeLib, setActiveLib] = useState<IconLibrary>('lucide');
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Get ALL icon names based on active library
  const allIconNames = useMemo(() => {
    let sourceModule: any;
    
    switch (activeLib) {
      case 'lucide':
        sourceModule = LucideIcons;
        break;
      case 'heroicons-outline':
        sourceModule = HeroOutline;
        break;
      case 'heroicons-solid':
        sourceModule = HeroSolid;
        break;
      default:
        sourceModule = LucideIcons;
    }

    if (!sourceModule) return [];

    const uniqueRefs = new Set<any>();
    const validNames: string[] = [];
    
    // Get all keys from the module
    const keys = Object.keys(sourceModule);

    for (const key of keys) {
        // Skip explicitly known non-icon exports
        if (key === 'default' || key === 'createLucideIcon' || key === 'icons' || key === 'lucide-react') continue;

        const component = sourceModule[key];

        // 1. Type Check: Must be a function (React Component) or Object (ForwardRef/Memo)
        if (typeof component !== 'function' && typeof component !== 'object') continue;

        // 2. Name Check: Must be PascalCase (starts with uppercase)
        if (!/^[A-Z]/.test(key)) continue;

        // 3. Reference Check: Prevent Aliases
        if (uniqueRefs.has(component)) continue;

        uniqueRefs.add(component);
        validNames.push(key);
    }
    
    return validNames.sort();
  }, [activeLib]);

  // 2. Filter based on search input
  const filteredIcons = useMemo(() => {
    if (!allIconNames) return []; // Guard
    if (!search.trim()) return allIconNames;
    const lowerQuery = search.toLowerCase();
    return allIconNames.filter(name => name.toLowerCase().includes(lowerQuery));
  }, [search, allIconNames]);

  // 3. Monitor Container Size for Responsive Grid
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
            setContainerWidth(entry.contentRect.width);
        }
      }
    });
    
    observer.observe(scrollContainerRef.current);
    
    // Initial measure
    setContainerWidth(scrollContainerRef.current.clientWidth);

    return () => observer.disconnect();
  }, [isOpen]);

  // 4. Reset scroll when search or library changes
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        setScrollTop(0);
    }
  }, [isOpen, search, activeLib]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // --- VIRTUALIZATION LOGIC ---
  const cols = Math.max(2, Math.floor(containerWidth / MIN_COL_WIDTH));
  const totalItems = filteredIcons.length;
  const totalRows = Math.ceil(totalItems / cols);
  const totalHeight = totalRows * ITEM_HEIGHT;
  
  // Determine Visible Range
  // We add a buffer of rows above and below the viewport to prevent white flashes
  const viewportHeight = scrollContainerRef.current?.clientHeight || 600;
  const startRow = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2); 
  const visibleRowCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + 4;
  const endRow = Math.min(totalRows, startRow + visibleRowCount);

  // Generate Renderable Items
  const visibleItems = [];
  for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          if (index < totalItems) {
              visibleItems.push({
                  name: filteredIcons[index],
                  row: r,
                  col: c,
                  index
              });
          }
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#252525] w-full max-w-4xl h-[85vh] rounded-xl border border-[#333] shadow-2xl flex flex-col overflow-hidden m-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#2a2a2a]">
          <div>
              <h2 className="text-white font-semibold flex items-center gap-3">
                  Icon Library
                  <span className="text-[10px] font-medium text-gray-400 bg-[#1e1e1e] px-2 py-0.5 rounded-full border border-[#333]">
                      {filteredIcons.length}
                  </span>
              </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#333] rounded">
            <X size={20} />
          </button>
        </div>

        {/* Library Selection Tabs */}
        <div className="flex border-b border-[#333] bg-[#222]">
           {[
             { id: 'lucide', label: 'Lucide' },
             { id: 'heroicons-outline', label: 'Heroicons (Outline)' },
             { id: 'heroicons-solid', label: 'Heroicons (Solid)' }
           ].map(lib => (
             <button
               key={lib.id}
               onClick={() => setActiveLib(lib.id as IconLibrary)}
               className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${activeLib === lib.id ? 'border-blue-500 text-white bg-[#2a2a2a]' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#252525]'}`}
             >
               {lib.label}
             </button>
           ))}
        </div>

        <div className="p-4 border-b border-[#333] bg-[#222]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={`Search ${activeLib}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-[#1a1a1a] text-white pl-10 pr-10 py-3 rounded-lg border border-[#333] focus:border-blue-500 outline-none placeholder-gray-600 transition-all shadow-inner"
            />
             {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 hover:bg-[#333] rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative custom-scrollbar bg-[#1e1e1e]"
        >
          {filteredIcons.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-50">
              <Search size={32} />
              <p>No icons found for "{search}"</p>
            </div>
          ) : (
            <div style={{ height: totalHeight, width: '100%' }} className="relative">
                {(visibleItems || []).map(item => {
                    let IconComp;
                    if (activeLib === 'lucide') IconComp = (LucideIcons as any)[item.name];
                    else if (activeLib === 'heroicons-outline') IconComp = (HeroOutline as any)[item.name];
                    else if (activeLib === 'heroicons-solid') IconComp = (HeroSolid as any)[item.name];

                    if (!IconComp) return null;

                    return (
                        <div
                            key={item.name}
                            style={{
                                position: 'absolute',
                                top: item.row * ITEM_HEIGHT,
                                left: `${(item.col / cols) * 100}%`,
                                width: `${100 / cols}%`,
                                height: ITEM_HEIGHT,
                                padding: GAP_PADDING
                            }}
                        >
                             <button
                                onClick={() => onSelect(item.name, activeLib)}
                                className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg bg-[#252525] hover:bg-[#2a2a2a] border border-transparent hover:border-[#444] text-gray-500 hover:text-white transition-all group relative"
                                title={item.name}
                            >
                                <IconComp size={24} width={24} height={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-200 text-gray-400 group-hover:text-blue-400" />
                                <span className="text-[9px] opacity-60 group-hover:opacity-100 truncate w-full px-1 text-center transition-opacity">
                                    {item.name}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t border-[#333] bg-[#2a2a2a] text-center">
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                Powered by <span className="font-semibold text-gray-400">ESM.sh</span>
            </p>
        </div>
      </div>
    </div>
  );
};