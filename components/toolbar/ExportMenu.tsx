
import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, Eye } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { AppState } from '../../types';
import { ExportOptions } from '../../hooks/useExport';

interface ExportMenuProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
  onExport: (options: ExportOptions) => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ state, onUpdate, onExport }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'ico' | 'svg'>('png');
  const [exportSize, setExportSize] = useState<number | '1x' | '2x' | '4x'>('1x');
  const [forceTransparent, setForceTransparent] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    if (isExportOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportOpen]);

  const handleExportClick = () => {
     let opts: ExportOptions = { 
         format: exportFormat, 
         transparent: forceTransparent 
     };

     if (typeof exportSize === 'number') {
         opts.size = exportSize;
     } else {
         opts.pixelRatio = parseInt(exportSize.toString().charAt(0));
     }

     onExport(opts);
     setIsExportOpen(false);
  };

  return (
    <>
      <Tooltip title="Preview Studio" description="Simulate your icon in real environments." delay={100}>
        <button 
          onClick={() => onUpdate({ isPreviewOpen: true })}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors border border-[#444] bg-[#222] hover:bg-[#333] text-gray-200 mr-2`}
        >
          <Eye size={16} className="text-green-400" />
          <span className="text-xs font-medium">Preview</span>
        </button>
      </Tooltip>

      <div className="relative" ref={exportRef}>
        <Tooltip title="Export Options" description="Save your design as image or vector.">
          <button 
            onClick={() => setIsExportOpen(!isExportOpen)}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isExportOpen ? 'bg-blue-500 ring-2 ring-blue-400/50' : ''}`}
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} className={`opacity-70 transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>
        </Tooltip>
        
        {isExportOpen && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-72 bg-[#252525] border border-[#333] rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/50 z-[99] animate-in fade-in zoom-in-95 duration-100 flex flex-col">
            
            <div className="p-3 border-b border-[#333] bg-[#2a2a2a]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Export Settings</span>
            </div>

            <div className="p-4 space-y-4">
                {/* Format Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-medium">Format</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                       {['png', 'ico', 'svg'].map((f) => (
                           <button
                             key={f}
                             onClick={() => setExportFormat(f as any)}
                             className={`text-xs py-1.5 rounded-md transition-all ${exportFormat === f ? 'bg-[#333] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                           >
                              {f.toUpperCase()}
                           </button>
                       ))}
                    </div>
                </div>

                {/* Resolution Selection (Only for PNG/ICO) */}
                {exportFormat !== 'svg' && (
                   <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-[10px] text-gray-400 font-medium">Resolution</label>
                      <div className="grid grid-cols-4 gap-2">
                         {['1x', '2x', '512', '1024'].map(val => {
                             const numericVal = (val === '512' || val === '1024') ? parseInt(val) : val;
                             const isActive = exportSize === numericVal;
                             return (
                                 <button 
                                    key={val}
                                    onClick={() => setExportSize(numericVal as any)}
                                    className={`text-[10px] font-mono border rounded py-1 transition-colors ${isActive ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-gray-500'}`}
                                 >
                                    {val}
                                    {val === '512' || val === '1024' ? 'px' : ''}
                                 </button>
                             );
                         })}
                      </div>
                   </div>
                )}

                {/* Options */}
                <div className="pt-2 border-t border-[#333/50]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${forceTransparent ? 'bg-blue-600 border-blue-600' : 'bg-[#1a1a1a] border-[#444] group-hover:border-gray-400'}`}>
                            {forceTransparent && <Check size={10} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={forceTransparent} onChange={e => setForceTransparent(e.target.checked)} className="hidden" />
                        <span className="text-xs text-gray-300">Transparent Background</span>
                    </label>
                </div>
            </div>

            {/* Action */}
            <button 
               onClick={handleExportClick}
               className="m-3 mt-0 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
               <Download size={14} />
               Download {exportFormat.toUpperCase()}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
