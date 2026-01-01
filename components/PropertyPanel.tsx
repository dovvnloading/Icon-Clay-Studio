

import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, ClayStyle, AppState } from '../types';
import { 
  Sliders, Sun, Box, Move, Layers, Type, 
  Settings, Maximize, Cuboid, Palette, Star, 
  Zap, Eclipse, Sparkles, LayoutTemplate, 
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Minus, Plus, Type as TypeIcon, ScanLine, Frame,
  RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Grid
} from 'lucide-react';

interface PropertyPanelProps {
  state: AppState;
  element: CanvasElement | null;
  onUpdate: (updates: Partial<CanvasElement> | { style: Partial<ClayStyle> }) => void;
  onUpdateState: (updates: Partial<AppState>) => void;
  onRecordHistory: () => void;
}

// Inline Presets to prevent module loading issues
const PRESETS: { id: string; name: string; style: Partial<ClayStyle> }[] = [
  {
    id: 'soft-clay-light',
    name: 'Soft Clay (Light)',
    style: {
      color: '#e0e5ec',
      gradient: false,
      lighting: true,
      lightSource: 135,
      depth: 18,
      surfaceIntensity: 0.15,
      blur: 20,
      
      shadowEnabled: true,
      shadowAngle: 135,
      shadowDistance: 18,
      shadowBlur: 30,
      intensity: 0.15,

      convex: true,
      bevel: 2,
      bevelIntensity: 0.4,
      gloss: 10,
      borderWidth: 0,
    }
  },
  {
    id: 'soft-clay-dark',
    name: 'Soft Clay (Dark)',
    style: {
      color: '#2a2a2a',
      gradient: false,
      lighting: true,
      lightSource: 135,
      depth: 18,
      surfaceIntensity: 0.25,
      blur: 25,
      
      shadowEnabled: true,
      shadowAngle: 135,
      shadowDistance: 18,
      shadowBlur: 35,
      intensity: 0.4,

      convex: true,
      bevel: 1,
      bevelIntensity: 0.3,
      gloss: 15,
      borderWidth: 0,
    }
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum Pop',
    style: {
      color: '#ff6b9d',
      gradient: true,
      gradientColor: '#ff8fab',
      gradientType: 'radial',
      gradientAngle: 135,
      lighting: true,
      lightSource: 120,
      depth: 25,
      surfaceIntensity: 0.3,
      blur: 10,
      
      shadowEnabled: true,
      shadowAngle: 120,
      shadowDistance: 25,
      shadowBlur: 30,
      intensity: 0.25,

      convex: true,
      bevel: 5,
      bevelIntensity: 0.7,
      gloss: 45,
    }
  },
  {
    id: 'holographic',
    name: 'Holographic',
    style: {
      color: '#6366f1',
      gradient: true,
      gradientColor: '#ec4899',
      gradientType: 'linear',
      gradientAngle: 45,
      lighting: true,
      lightSource: 90,
      depth: 10,
      surfaceIntensity: 0.1,
      blur: 5,
      
      shadowEnabled: true,
      shadowAngle: 90,
      shadowDistance: 10,
      shadowBlur: 15,
      intensity: 0.2,

      convex: true,
      bevel: 1,
      bevelIntensity: 0.8,
      gloss: 60,
    }
  },
  {
    id: 'deep-pressed',
    name: 'Deep Pressed',
    style: {
      color: '#252525',
      gradient: false,
      lighting: true,
      lightSource: 135,
      depth: 12,
      surfaceIntensity: 0.5,
      blur: 5,
      
      shadowEnabled: true,
      shadowAngle: 135,
      shadowDistance: 12,
      shadowBlur: 15,
      intensity: 0.6,

      convex: false,
      bevel: 2,
      bevelIntensity: 0.5,
      gloss: 5,
    }
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    style: {
      color: '#9ca3af',
      gradient: true,
      gradientColor: '#d1d5db',
      gradientType: 'linear',
      gradientAngle: 160,
      lighting: true,
      lightSource: 110,
      depth: 30,
      surfaceIntensity: 0.3,
      blur: 15,
      
      shadowEnabled: true,
      shadowAngle: 110,
      shadowDistance: 30,
      shadowBlur: 25,
      intensity: 0.3,

      convex: true,
      bevel: 8,
      bevelIntensity: 0.9,
      gloss: 90,
    }
  },
  {
    id: 'ceramic',
    name: 'White Ceramic',
    style: {
      color: '#f9fafb',
      gradient: false,
      lighting: true,
      lightSource: 145,
      depth: 15,
      surfaceIntensity: 0.05,
      blur: 10,
      
      shadowEnabled: true,
      shadowAngle: 145,
      shadowDistance: 15,
      shadowBlur: 20,
      intensity: 0.1,

      convex: true,
      bevel: 1,
      bevelIntensity: 0.2,
      gloss: 70,
    }
  }
];

// Helper: Compact Number Input with Drag Support AND Aggressive Scroll Capture
const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min = -Infinity, 
  max = Infinity, 
  step = 1,
  unit,
  className = "",
  onRecordHistory
}: { 
  label?: string, 
  value: number, 
  onChange: (val: number) => void, 
  min?: number, 
  max?: number, 
  step?: number,
  unit?: string,
  className?: string,
  onRecordHistory: () => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Robust Scroll Interception
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const direction = e.deltaY > 0 ? -1 : 1;
      const multiplier = e.shiftKey ? 10 : (e.altKey ? 0.1 : 1);
      
      const currentVal = parseFloat(el.value) || 0;
      let newVal = currentVal + (direction * step * multiplier);
      
      if (min !== undefined) newVal = Math.max(min, newVal);
      if (max !== undefined) newVal = Math.min(max, newVal);

      const decimals = (step.toString().split('.')[1] || '').length;
      const rounded = Number(newVal.toFixed(decimals > 0 ? decimals : 0));
      
      onChange(rounded);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [step, min, max, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); 
    onRecordHistory(); // Record history at start of drag

    const startY = e.clientY;
    const startVal = value;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const multiplier = moveEvent.shiftKey ? 10 : (moveEvent.altKey ? 0.1 : 1);
      
      let newVal = startVal + (deltaY * step * multiplier);
      
      if (min !== undefined) newVal = Math.max(min, newVal);
      if (max !== undefined) newVal = Math.min(max, newVal);
      
      const decimals = (step.toString().split('.')[1] || '').length;
      const rounded = Number(newVal.toFixed(decimals > 0 ? decimals : 0));

      onChange(rounded);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {label && (
        <span 
          className="text-gray-500 w-12 truncate cursor-ns-resize hover:text-blue-400 transition-colors select-none"
          onMouseDown={handleMouseDown}
          title="Drag to adjust"
        >
          {label}
        </span>
      )}
      <div className="flex-1 relative group flex items-center">
        <input 
          ref={inputRef}
          type="number"
          value={value}
          onFocus={() => onRecordHistory()}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-gray-200 focus:border-blue-500 outline-none transition-colors text-right font-mono appearance-none ${unit ? 'pr-7' : ''}`}
          step={step}
        />
        {unit && (
          <span 
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold select-none ${!label ? 'cursor-ns-resize hover:text-blue-400' : 'pointer-events-none'}`}
            onMouseDown={!label ? handleMouseDown : undefined}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper: Slider with Value
const SliderControl = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onRecordHistory
}: {
  label: string,
  value: number,
  onChange: (val: number) => void,
  min?: number,
  max?: number,
  step?: number,
  unit?: string,
  onRecordHistory: () => void
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-end">
      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</span>
      <span className="text-[10px] font-mono text-gray-400 bg-[#1a1a1a] px-1 rounded">{Math.round(value * 100) / 100}{unit}</span>
    </div>
    <input 
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onMouseDown={() => onRecordHistory()}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
    />
  </div>
);

// Helper: Section Header
const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#333] pt-4 first:pt-0">
    <Icon size={12} className="text-blue-500" />
    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{title}</span>
  </div>
);

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ state, element, onUpdate, onUpdateState, onRecordHistory }) => {
  const [activeTab, setActiveTab] = useState<'lighting' | 'surface' | 'shadow'>('lighting');

  // --- GLOBAL CANVAS SETTINGS ---
  if (!element) {
    return (
      <div className="w-80 bg-[#1e1e1e] border-l border-[#333] flex flex-col h-full overflow-y-auto custom-scrollbar select-none">
        <div className="p-4 bg-[#252525] border-b border-[#333]">
           <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings size={14} className="text-gray-400" />
            Global Settings
          </h2>
        </div>
        
        <div className="p-4 space-y-6">
           {/* Dimensions */}
           <div>
              <SectionHeader icon={Maximize} title="Canvas Size" />
              <div className="grid grid-cols-2 gap-3">
                 <NumberInput 
                   onRecordHistory={onRecordHistory}
                   label="Width" 
                   value={state.canvasSize.width} 
                   onChange={(v) => onUpdateState({ canvasSize: { ...state.canvasSize, width: v } })} 
                   unit="px"
                 />
                 <NumberInput 
                   onRecordHistory={onRecordHistory}
                   label="Height" 
                   value={state.canvasSize.height} 
                   onChange={(v) => onUpdateState({ canvasSize: { ...state.canvasSize, height: v } })} 
                   unit="px"
                 />
              </div>
           </div>
           
           {/* Background */}
           <div>
              <SectionHeader icon={Layers} title="Environment" />
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs text-gray-400 group-hover:text-gray-200">Transparent Background</span>
                  <input 
                    type="checkbox"
                    checked={state.transparentBackground}
                    onChange={(e) => {
                         onRecordHistory();
                         onUpdateState({ transparentBackground: e.target.checked });
                    }}
                    className="toggle-checkbox"
                  />
                </label>

                {!state.transparentBackground && (
                   <div className="flex items-center justify-between p-2 bg-[#151515] rounded border border-[#333]">
                      <span className="text-xs text-gray-400">Fill Color</span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono text-gray-500">{state.backgroundColor}</span>
                         <input 
                          type="color" 
                          value={state.backgroundColor}
                          onClick={() => onRecordHistory()}
                          onChange={(e) => onUpdateState({ backgroundColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                      </div>
                   </div>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- ELEMENT PROPERTIES ---
  const { style } = element;
  const isText = element.type === 'text';
  const isIcon = element.type === 'icon';
  const isCustomShape = ['triangle', 'star', 'hexagon'].includes(element.type);
  const isShape = !isText && !isIcon && !isCustomShape;

  // Alignment Handlers
  const align = (axis: 'x' | 'y', pos: 'start' | 'center' | 'end') => {
      onRecordHistory();
      if (axis === 'x') {
          let val = 0;
          if (pos === 'start') val = 0;
          if (pos === 'center') val = (state.canvasSize.width - element.width) / 2;
          if (pos === 'end') val = state.canvasSize.width - element.width;
          onUpdate({ x: Math.round(val) });
      } else {
          let val = 0;
          if (pos === 'start') val = 0;
          if (pos === 'center') val = (state.canvasSize.height - element.height) / 2;
          if (pos === 'end') val = state.canvasSize.height - element.height;
          onUpdate({ y: Math.round(val) });
      }
  };

  const updateStyle = (s: Partial<ClayStyle>) => onUpdate({ style: { ...style, ...s } });

  return (
    <div className="w-80 bg-[#1e1e1e] border-l border-[#333] flex flex-col h-full overflow-y-auto custom-scrollbar select-none">
      
      {/* HEADER & ALIGNMENT */}
      <div className="bg-[#252525] border-b border-[#333] p-2 space-y-2">
          <div className="flex justify-between items-center px-2">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{element.type} Properties</span>
             <span className="text-[9px] text-gray-600 font-mono">ID: {element.id.slice(-4)}</span>
          </div>
          
          <div className="grid grid-cols-6 gap-0.5 bg-[#151515] p-1 rounded border border-[#333]">
             <button onClick={() => align('x', 'start')} title="Align Left" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignStartVertical size={14} className="-rotate-90"/></button>
             <button onClick={() => align('x', 'center')} title="Align Center X" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignCenterVertical size={14} className="-rotate-90"/></button>
             <button onClick={() => align('x', 'end')} title="Align Right" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignEndVertical size={14} className="-rotate-90"/></button>
             <div className="w-px bg-[#333] mx-1 h-4 self-center" />
             <button onClick={() => align('y', 'start')} title="Align Top" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignStartVertical size={14} /></button>
             <button onClick={() => align('y', 'center')} title="Align Center Y" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignCenterVertical size={14} /></button>
             <button onClick={() => align('y', 'end')} title="Align Bottom" className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white flex justify-center"><AlignEndVertical size={14} /></button>
          </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* TRANSFORM */}
        <div>
           <SectionHeader icon={Move} title="Transform" />
           <div className="grid grid-cols-2 gap-x-2 gap-y-3">
              <NumberInput onRecordHistory={onRecordHistory} label="X" value={Math.round(element.x)} onChange={(v) => onUpdate({ x: v })} />
              <NumberInput onRecordHistory={onRecordHistory} label="Y" value={Math.round(element.y)} onChange={(v) => onUpdate({ y: v })} />
              <NumberInput onRecordHistory={onRecordHistory} label="W" value={Math.round(element.width)} onChange={(v) => onUpdate({ width: Math.max(1, v) })} />
              <NumberInput onRecordHistory={onRecordHistory} label="H" value={Math.round(element.height)} onChange={(v) => onUpdate({ height: Math.max(1, v) })} />
              <NumberInput onRecordHistory={onRecordHistory} label="Rot" value={element.rotation} onChange={(v) => onUpdate({ rotation: v })} unit="°" />
              {isShape && element.type !== 'circle' && (
                 <NumberInput onRecordHistory={onRecordHistory} label="Radius" value={style.borderRadius} onChange={(v) => updateStyle({ borderRadius: Math.max(0, v) })} unit="px" />
              )}
           </div>
           
           {/* Actions: Flip & Rotate */}
           <div className="grid grid-cols-4 gap-1 mt-3 pt-2 border-t border-[#333]">
              <button 
                  title="Rotate -90°"
                  onClick={() => { onRecordHistory(); onUpdate({ rotation: element.rotation - 90 }); }}
                  className="p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded flex items-center justify-center text-gray-400 hover:text-white"
              >
                  <RotateCcw size={14} />
              </button>
              <button 
                  title="Rotate +90°"
                  onClick={() => { onRecordHistory(); onUpdate({ rotation: element.rotation + 90 }); }}
                  className="p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded flex items-center justify-center text-gray-400 hover:text-white"
              >
                  <RotateCw size={14} />
              </button>
              <button 
                  title="Flip Horizontal"
                  onClick={() => { onRecordHistory(); onUpdate({ flipX: !element.flipX }); }}
                  className={`p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded flex items-center justify-center transition-colors ${element.flipX ? 'text-blue-400 bg-[#252525]' : 'text-gray-400 hover:text-white'}`}
              >
                  <FlipHorizontal size={14} />
              </button>
              <button 
                  title="Flip Vertical"
                  onClick={() => { onRecordHistory(); onUpdate({ flipY: !element.flipY }); }}
                  className={`p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded flex items-center justify-center transition-colors ${element.flipY ? 'text-blue-400 bg-[#252525]' : 'text-gray-400 hover:text-white'}`}
              >
                  <FlipVertical size={14} />
              </button>
           </div>
        </div>

        {/* TYPOGRAPHY */}
        {isText && (
          <div>
            <SectionHeader icon={TypeIcon} title="Typography" />
            <div className="space-y-3">
               <textarea 
                  value={element.text || ''}
                  onFocus={() => onRecordHistory()}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  className="w-full bg-[#151515] border border-[#333] rounded px-2 py-2 text-sm text-gray-200 focus:border-blue-500 outline-none h-16 resize-none font-sans"
               />
               <div className="grid grid-cols-2 gap-2">
                 <NumberInput onRecordHistory={onRecordHistory} label="Size" value={element.fontSize || 12} onChange={(v) => onUpdate({ fontSize: v })} unit="px" />
                 <select 
                    value={element.fontWeight}
                    onClick={() => onRecordHistory()}
                    onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                    className="bg-[#151515] border border-[#333] rounded text-xs text-white outline-none"
                 >
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="600">SemiBold</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                 </select>
               </div>
            </div>
          </div>
        )}
        
        {/* ICON SELECTOR */}
        {isIcon && (
           <div>
             <SectionHeader icon={Star} title="Iconography" />
             <button 
               onClick={() => onUpdateState({ isIconPickerOpen: true })}
               className="w-full flex items-center justify-between bg-[#151515] hover:bg-[#222] border border-[#333] rounded px-3 py-2 transition-colors text-xs text-gray-300"
             >
                <span className="font-mono">{element.iconName}</span>
                <Settings size={12} />
             </button>
           </div>
        )}

        {/* APPEARANCE (Fill/Stroke/Opacity) */}
        <div>
           <SectionHeader icon={Palette} title="Appearance" />
           <div className="space-y-4">
              {/* Fill */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Fill Color</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={style.gradient} 
                        onChange={(e) => {
                            onRecordHistory();
                            updateStyle({ gradient: e.target.checked });
                        }} 
                        title="Use Gradient" 
                        className="toggle-checkbox" 
                      />
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-[#151515] border border-[#333] rounded flex items-center px-1 gap-2">
                       <input 
                         type="color" 
                         value={style.color} 
                         onClick={() => onRecordHistory()}
                         onChange={(e) => updateStyle({ color: e.target.value })} 
                         className="w-5 h-5 bg-transparent border-none rounded cursor-pointer" 
                       />
                       <span className="text-[10px] font-mono text-gray-500 uppercase">{style.color}</span>
                    </div>
                    {style.gradient && (
                      <div className="flex-1 h-8 bg-[#151515] border border-[#333] rounded flex items-center px-1 gap-2 animate-in fade-in slide-in-from-right-2">
                         <input 
                           type="color" 
                           value={style.gradientColor} 
                           onClick={() => onRecordHistory()}
                           onChange={(e) => updateStyle({ gradientColor: e.target.value })} 
                           className="w-5 h-5 bg-transparent border-none rounded cursor-pointer" 
                         />
                         <span className="text-[10px] font-mono text-gray-500 uppercase">{style.gradientColor}</span>
                      </div>
                    )}
                 </div>
                 
                 {style.gradient && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                       <select 
                          value={style.gradientType} 
                          onClick={() => onRecordHistory()}
                          onChange={(e) => updateStyle({ gradientType: e.target.value as any })}
                          className="bg-[#151515] border border-[#333] text-xs text-gray-400 rounded py-1"
                       >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                       </select>
                       <NumberInput onRecordHistory={onRecordHistory} value={style.gradientAngle || 0} onChange={(v) => updateStyle({ gradientAngle: v })} unit="°" />
                    </div>
                 )}
              </div>
              
              {/* Pattern Overlay */}
              <div className="space-y-2 pt-2 border-t border-[#333]">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Pattern Overlay</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={style.surfacePattern || 'none'}
                        onClick={() => onRecordHistory()}
                        onChange={(e) => updateStyle({ surfacePattern: e.target.value as any })}
                        className="bg-[#151515] border border-[#333] text-xs text-gray-400 rounded py-1 outline-none"
                    >
                        <option value="none">None</option>
                        <option value="dots">Dots</option>
                        <option value="lines">Lines</option>
                        <option value="grid">Grid</option>
                    </select>
                    {style.surfacePattern && style.surfacePattern !== 'none' && (
                        <div className="flex gap-1">
                            <NumberInput 
                                onRecordHistory={onRecordHistory}
                                value={style.patternScale || 1}
                                onChange={(v) => updateStyle({ patternScale: v })}
                                step={0.1}
                                min={0.1}
                                unit="x"
                            />
                        </div>
                    )}
                </div>
                {style.surfacePattern && style.surfacePattern !== 'none' && (
                     <div className="space-y-1">
                        <label className="text-[10px] text-gray-500">Pattern Opacity</label>
                        <input 
                           type="range" min="0" max="1" step="0.01" 
                           value={style.patternOpacity || 0.1} 
                           onMouseDown={() => onRecordHistory()}
                           onChange={(e) => updateStyle({ patternOpacity: parseFloat(e.target.value) })}
                           className="w-full h-1 bg-[#333] rounded-lg accent-gray-400"
                        />
                     </div>
                )}
              </div>

              {/* Stroke / Border */}
              <div className="space-y-2 pt-2 border-t border-[#333]">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{isText || isIcon ? 'Stroke' : 'Border'}</span>
                 </div>
                 <div className="grid grid-cols-[1fr_60px] gap-2">
                    <div className="h-7 bg-[#151515] border border-[#333] rounded flex items-center px-1 gap-2">
                       <input 
                          type="color" 
                          value={(isText || isIcon) ? (element.textStrokeColor || style.borderColor) : style.borderColor} 
                          onClick={() => onRecordHistory()}
                          onChange={(e) => isText || isIcon ? onUpdate({ textStrokeColor: e.target.value }) : updateStyle({ borderColor: e.target.value })} 
                          className="w-4 h-4 bg-transparent border-none rounded cursor-pointer" 
                       />
                       <span className="text-[10px] font-mono text-gray-500 uppercase">
                          {(isText || isIcon) ? (element.textStrokeColor || style.borderColor) : style.borderColor}
                       </span>
                    </div>
                    <NumberInput 
                        onRecordHistory={onRecordHistory}
                        value={(isText || isIcon) ? (element.textStrokeWidth ?? 0) : style.borderWidth}
                        onChange={(v) => {
                            const val = Math.max(0, v);
                            if (isText || isIcon) onUpdate({ textStrokeWidth: val });
                            else updateStyle({ borderWidth: val });
                        }}
                        min={0}
                        unit="px"
                        className="h-7"
                    />
                 </div>
              </div>
              
              {/* Opacity & Blend */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#333]">
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500">Opacity</label>
                    <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={style.opacity} 
                       onMouseDown={() => onRecordHistory()}
                       onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
                       className="w-full h-1 bg-[#333] rounded-lg accent-gray-400"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-gray-500">Blend Mode</label>
                    <select 
                       value={style.blendMode} 
                       onClick={() => onRecordHistory()}
                       onChange={(e) => updateStyle({ blendMode: e.target.value })}
                       className="w-full bg-[#151515] text-xs text-gray-400 border border-[#333] rounded py-0.5 outline-none"
                    >
                       <option value="normal">Normal</option>
                       <option value="overlay">Overlay</option>
                       <option value="multiply">Multiply</option>
                       <option value="screen">Screen</option>
                       <option value="soft-light">Soft Light</option>
                    </select>
                 </div>
              </div>

           </div>
        </div>

        {/* 3D GEOMETRY (For Text/Icons) */}
        {(isText || isIcon) && (
            <div>
               <SectionHeader icon={Cuboid} title="Geometry" />
               <div className="space-y-3 px-1">
                  <SliderControl 
                    onRecordHistory={onRecordHistory}
                    label="Extrusion Depth" 
                    value={element.textExtrusion || 0} 
                    onChange={(v) => onUpdate({ textExtrusion: v })} 
                    max={50} unit="px"
                  />
               </div>
            </div>
        )}

        {/* CLAY ENGINE (Effects Studio) */}
        <div>
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <Zap size={12} className="text-yellow-500" />
                 <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Clay Engine</span>
               </div>
            </div>
            
            {/* PRESETS GRID (Restored and Visible) */}
            <div className="grid grid-cols-4 gap-2 mb-4 bg-[#151515] p-2 rounded border border-[#333]">
               {(PRESETS || []).map(preset => {
                   const bg = preset.style.gradient 
                     ? (preset.style.gradientType === 'radial' 
                        ? `radial-gradient(circle at center, ${preset.style.gradientColor}, ${preset.style.color})` 
                        : `linear-gradient(${preset.style.gradientAngle || 135}deg, ${preset.style.color}, ${preset.style.gradientColor})`)
                     : preset.style.color;

                   return (
                       <button 
                         key={preset.id}
                         title={preset.name}
                         onClick={() => {
                             onRecordHistory();
                             updateStyle(preset.style);
                         }}
                         className="w-full aspect-square rounded-lg border border-[#333] hover:border-blue-500 hover:scale-105 transition-all shadow-sm relative overflow-hidden group"
                         style={{ background: bg }}
                       >
                           {/* Shine effect for clay look */}
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       </button>
                   );
               })}
            </div>
            
            <div className="bg-[#151515] border border-[#333] rounded-lg overflow-hidden">
               {/* Tabs */}
               <div className="flex border-b border-[#333]">
                   <button onClick={() => setActiveTab('lighting')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider ${activeTab === 'lighting' ? 'bg-[#222] text-white border-b-2 border-b-blue-500' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}>Light</button>
                   <button onClick={() => setActiveTab('surface')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider ${activeTab === 'surface' ? 'bg-[#222] text-white border-b-2 border-b-blue-500' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}>Surface</button>
                   <button onClick={() => setActiveTab('shadow')} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider ${activeTab === 'shadow' ? 'bg-[#222] text-white border-b-2 border-b-blue-500' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}>Shadow</button>
               </div>

               <div className="p-4 space-y-4">
                  {/* LIGHTING TAB */}
                  {activeTab === 'lighting' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-gray-500 uppercase">3D Render</span>
                           <input 
                             type="checkbox" 
                             checked={style.lighting !== false} 
                             onChange={(e) => {
                                 onRecordHistory();
                                 updateStyle({ lighting: e.target.checked });
                             }} 
                             className="toggle-checkbox" 
                           />
                        </div>
                        
                        {style.lighting !== false && (
                           <>
                              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
                                 <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full border border border-[#444] bg-[#111] relative shadow-inner" style={{ transform: `rotate(${style.lightSource - 90}deg)` }}>
                                       <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                                    </div>
                                    <div className="flex-1">
                                       <SliderControl onRecordHistory={onRecordHistory} label="Light Angle" value={style.lightSource} onChange={(v) => updateStyle({ lightSource: v })} max={360} unit="°" />
                                    </div>
                                 </div>
                                 <div className="flex gap-1">
                                    <button onClick={() => { onRecordHistory(); updateStyle({ convex: true }); }} className={`flex-1 py-1 text-[10px] rounded ${style.convex ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#111] text-gray-500 hover:text-gray-300'}`}>Convex</button>
                                    <button onClick={() => { onRecordHistory(); updateStyle({ convex: false }); }} className={`flex-1 py-1 text-[10px] rounded ${!style.convex ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#111] text-gray-500 hover:text-gray-300'}`}>Concave</button>
                                 </div>
                              </div>
                              
                              <SliderControl onRecordHistory={onRecordHistory} label="Depth (Volume)" value={style.depth} onChange={(v) => updateStyle({ depth: v })} max={100} unit="px" />
                              <SliderControl onRecordHistory={onRecordHistory} label="Bevel (Edge)" value={style.bevel} onChange={(v) => updateStyle({ bevel: v })} max={20} step={0.1} unit="px" />
                              <SliderControl onRecordHistory={onRecordHistory} label="Gloss (Specular)" value={style.gloss} onChange={(v) => updateStyle({ gloss: v })} max={100} unit="%" />
                           </>
                        )}
                     </div>
                  )}

                  {/* SURFACE TAB */}
                  {activeTab === 'surface' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                        <SliderControl onRecordHistory={onRecordHistory} label="Softness (Blur)" value={style.blur} onChange={(v) => updateStyle({ blur: v })} max={50} unit="px" />
                        <SliderControl onRecordHistory={onRecordHistory} label="Texture Noise" value={style.noise} onChange={(v) => updateStyle({ noise: v })} max={100} unit="%" />
                        {style.noise > 0 && (
                           <SliderControl onRecordHistory={onRecordHistory} label="Noise Scale" value={style.noiseScale} onChange={(v) => updateStyle({ noiseScale: v })} min={0.1} max={5} step={0.1} unit="x" />
                        )}
                        <SliderControl onRecordHistory={onRecordHistory} label="Reflection Blur" value={style.specularBlur || 0} onChange={(v) => updateStyle({ specularBlur: v })} max={20} unit="px" />
                     </div>
                  )}

                  {/* SHADOW TAB */}
                  {activeTab === 'shadow' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-gray-500 uppercase">Drop Shadow</span>
                           <input type="checkbox" checked={style.shadowEnabled !== false} onChange={(e) => { onRecordHistory(); updateStyle({ shadowEnabled: e.target.checked }); }} className="toggle-checkbox" />
                        </div>
                        {style.shadowEnabled !== false && (
                           <>
                             <SliderControl onRecordHistory={onRecordHistory} label="Distance" value={style.shadowDistance ?? style.depth} onChange={(v) => updateStyle({ shadowDistance: v })} max={100} unit="px" />
                             <SliderControl onRecordHistory={onRecordHistory} label="Blur" value={style.shadowBlur ?? 20} onChange={(v) => updateStyle({ shadowBlur: v })} max={100} unit="px" />
                             <SliderControl onRecordHistory={onRecordHistory} label="Angle" value={style.shadowAngle ?? style.lightSource} onChange={(v) => updateStyle({ shadowAngle: v })} max={360} unit="°" />
                             <SliderControl onRecordHistory={onRecordHistory} label="Intensity" value={(style.intensity ?? 0.3) * 100} onChange={(v) => updateStyle({ intensity: v / 100 })} max={100} unit="%" />
                           </>
                        )}
                     </div>
                  )}
               </div>
            </div>
        </div>

      </div>
    </div>
  );
};