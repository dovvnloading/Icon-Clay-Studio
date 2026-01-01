import React, { useState } from 'react';
import { AppState, CanvasElement } from '../types';
import { X, Smartphone, LayoutGrid, Eye } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
// @ts-ignore
import * as HeroOutline from 'heroicons-outline';
// @ts-ignore
import * as HeroSolid from 'heroicons-solid';

interface PreviewStudioProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

const SvgClayRenderer: React.FC<{ element: CanvasElement }> = ({ element }) => {
  const { style } = element;
  const gradientId = `grad-p-${element.id}`; 
  const filterId = `clay-filter-p-${element.id}`;
  const maskId = `mask-p-${element.id}`; 

  const isText = element.type === 'text';
  const isIcon = element.type === 'icon';
  
  const width = element.width;
  const height = element.height;
  
  // Visual Properties
  const shadowEnabled = style.shadowEnabled !== false;
  const shadowAngle = style.shadowAngle ?? style.lightSource;
  const shadowDist = style.shadowDistance ?? style.depth;
  const shadowBlurVal = style.shadowBlur !== undefined ? style.shadowBlur : 20;

  const showLighting = style.lighting !== false; 
  const shadingOpacity = style.surfaceIntensity ?? style.intensity;

  // Dual-Pass Lighting Logic
  const lightAngle = style.lightSource;
  const azimuth = (lightAngle - 90) % 360; 
  const oppositeAzimuth = (azimuth + 180) % 360;

  const extrusion = (element.textExtrusion || 0); 

  const shadowRad = (shadowAngle * Math.PI) / 180;
  const shadowDx = Math.cos(shadowRad) * (shadowDist / 2);
  const shadowDy = Math.sin(shadowRad) * (shadowDist / 2);

  const angleRad = (lightAngle * Math.PI) / 180;
  const bevelDx = Math.cos(angleRad) * style.bevel;
  const bevelDy = Math.sin(angleRad) * style.bevel;

  const fill = style.gradient ? `url(#${gradientId})` : style.color;
  
  const useFilter = (showLighting) || (shadowEnabled) || (extrusion > 0) || (style.noise > 0);

  const padding = Math.max(
      style.blur * 4, 
      shadowBlurVal * 2, 
      style.depth * 2, 
      50
  );

  // Icon Prep
  const iconOriginalSize = 24;
  const iconScale = isIcon ? Math.min(width, height) / iconOriginalSize : 1;
  const iconTx = isIcon ? (width - iconOriginalSize * iconScale) / 2 : 0;
  const iconTy = isIcon ? (height - iconOriginalSize * iconScale) / 2 : 0;
  
  let IconComp: any;
  if (isIcon) {
     if (element.iconLib === 'heroicons-outline') IconComp = HeroOutline[element.iconName!];
     else if (element.iconLib === 'heroicons-solid') IconComp = HeroSolid[element.iconName!];
     else IconComp = (LucideIcons as any)[element.iconName!];
     
     if (!IconComp) IconComp = LucideIcons.HelpCircle;
  }

  const renderGradientDef = () => {
    if (!style.gradient) return null;
    
    if (style.gradientType === 'radial') {
         const angle = style.lightSource ?? 135;
         const rad = ((angle + 180) * Math.PI) / 180;
         const cx = 50 + Math.cos(rad) * 30;
         const cy = 50 + Math.sin(rad) * 30;

         return (
            <radialGradient id={gradientId} cx={`${cx}%`} cy={`${cy}%`} r="80%" fx={`${cx}%`} fy={`${cy}%`}>
                <stop offset="0%" stopColor={style.gradientColor} />
                <stop offset="100%" stopColor={style.color} />
            </radialGradient>
         );
    }
    return (
        <linearGradient 
            id={gradientId} 
            x1="0%" y1="100%" x2="0%" y2="0%"
            gradientTransform={`rotate(${style.gradientAngle || 0} .5 .5)`}
        >
            <stop offset="0%" stopColor={style.color} />
            <stop offset="100%" stopColor={style.gradientColor} />
        </linearGradient>
    );
  };

  return (
    <svg 
      width="100%" height="100%" 
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', color: style.color }}
    >
      <defs>
        {renderGradientDef()}

        {isIcon && (
            <mask id={maskId}>
                 <g transform={`translate(${iconTx}, ${iconTy}) scale(${iconScale})`}>
                    <IconComp 
                        size={24} 
                        color="white"
                        strokeWidth={element.textStrokeWidth ?? 2}
                        fill={element.iconLib === 'heroicons-solid' ? 'white' : 'none'}
                        stroke={element.iconLib === 'heroicons-solid' ? 'none' : 'white'}
                    />
                </g>
            </mask>
        )}

        {useFilter && (
          <filter 
            id={filterId} 
            x={-padding} y={-padding} 
            width={width + padding * 2} height={height + padding * 2} 
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="linearRGB"
          >
            {/* 0. GEOMETRY */}
            {extrusion > 0 ? (
               <feMorphology in="SourceAlpha" operator="dilate" radius={extrusion / 2} result="BASE_ALPHA" />
            ) : (
               <feColorMatrix in="SourceAlpha" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="BASE_ALPHA"/>
            )}
            
            {/* 1. DROP SHADOW */}
            {shadowEnabled && (
                <feDropShadow in="BASE_ALPHA" dx={shadowDx} dy={shadowDy} stdDeviation={shadowBlurVal / 2} floodOpacity={style.intensity} result="DROP_SHADOW" />
            )}

            {/* 2. ELEVATION */}
            <feGaussianBlur in="BASE_ALPHA" stdDeviation={Math.max(1, style.blur)} result="ELEVATION_MAP" />

            {/* 3. LIGHTING */}
            {showLighting && (
                <>
                {/* KEY LIGHT (High) */}
                <feSpecularLighting
                    in="ELEVATION_MAP"
                    surfaceScale={style.depth / 2}
                    specularConstant={1.2} 
                    specularExponent={12}
                    lightingColor="#ffffff"
                    result="LIGHT_PASS_RAW"
                >
                    <feDistantLight azimuth={azimuth} elevation={40} />
                </feSpecularLighting>
                <feGaussianBlur in="LIGHT_PASS_RAW" stdDeviation="0.75" result="LIGHT_PASS_SMOOTH" />
                <feComposite in="LIGHT_PASS_SMOOTH" in2="BASE_ALPHA" operator="in" result="LIGHT_PASS" />

                {/* FILL SHADOW (Low/Opposite) */}
                <feSpecularLighting
                    in="ELEVATION_MAP"
                    surfaceScale={style.depth / 2}
                    specularConstant={1}
                    specularExponent={10}
                    lightingColor="#ffffff"
                    result="SHADOW_PASS_MAP_RAW"
                >
                    <feDistantLight azimuth={oppositeAzimuth} elevation={40} />
                </feSpecularLighting>
                <feGaussianBlur in="SHADOW_PASS_MAP_RAW" stdDeviation="0.75" result="SHADOW_PASS_MAP" />
                
                <feComposite in="SHADOW_PASS_MAP" in2="BASE_ALPHA" operator="in" result="SHADOW_PASS_MASK" />
                <feFlood floodColor="black" floodOpacity={shadingOpacity} result="SHADOW_FLOOD" />
                <feComposite in="SHADOW_FLOOD" in2="SHADOW_PASS_MASK" operator="in" result="SHADOW_PASS" />

                {/* BEVEL */}
                {style.bevel > 0 && (
                    <>
                        <feOffset in="BASE_ALPHA" dx={bevelDx} dy={bevelDy} result="OFF_H" />
                        <feComposite in="BASE_ALPHA" in2="OFF_H" operator="out" result="BEVEL_H_RAW" />
                        <feGaussianBlur in="BEVEL_H_RAW" stdDeviation={style.bevel / 3} result="BEVEL_H_BLUR" />
                        <feComposite in="BEVEL_H_BLUR" in2="BASE_ALPHA" operator="in" result="BEVEL_H_MASKED" />
                        <feFlood floodColor="white" floodOpacity={style.bevelIntensity} result="BEVEL_H_FLOOD" />
                        <feComposite in="BEVEL_H_FLOOD" in2="BEVEL_H_MASKED" operator="in" result="BEVEL_HIGHLIGHT" />

                        <feOffset in="BASE_ALPHA" dx={-bevelDx} dy={-bevelDy} result="OFF_S" />
                        <feComposite in="BASE_ALPHA" in2="OFF_S" operator="out" result="BEVEL_S_RAW" />
                        <feGaussianBlur in="BEVEL_S_RAW" stdDeviation={style.bevel / 3} result="BEVEL_S_BLUR" />
                        <feComposite in="BEVEL_S_BLUR" in2="BASE_ALPHA" operator="in" result="BEVEL_S_MASKED" />
                        <feFlood floodColor="black" floodOpacity={style.bevelIntensity} result="BEVEL_S_FLOOD" />
                        <feComposite in="BEVEL_S_FLOOD" in2="BEVEL_S_MASKED" operator="in" result="BEVEL_SHADOW" />
                    </>
                )}

                {/* GLOSS */}
                <feSpecularLighting
                    in="ELEVATION_MAP"
                    surfaceScale={style.depth}
                    specularConstant={style.gloss / 40}
                    specularExponent={25}
                    lightingColor={style.specularColor || '#ffffff'}
                    result="GLOSS_RAW"
                >
                    <feDistantLight azimuth={azimuth} elevation={60} />
                </feSpecularLighting>
                <feGaussianBlur in="GLOSS_RAW" stdDeviation={style.specularBlur || 0} result="GLOSS_BLURRED" />
                <feComposite in="GLOSS_BLURRED" in2="BASE_ALPHA" operator="in" result="GLOSS" />
                </>
            )}
            
            {/* 4. NOISE */}
            {style.noise > 0 && (
                <>
                <feTurbulence type="fractalNoise" baseFrequency={0.6 / (style.noiseScale || 1)} numOctaves={3} stitchTiles="stitch" result="NOISE_RAW" />
                <feColorMatrix type="saturate" values="0" in="NOISE_RAW" result="NOISE_DESAT" />
                <feComponentTransfer in="NOISE_DESAT" result="NOISE_ALPHA"><feFuncA type="linear" slope={style.noise / 100} /></feComponentTransfer>
                <feComposite in="NOISE_ALPHA" in2="BASE_ALPHA" operator="in" result="NOISE_MASKED" />
                </>
            )}
            
            <feMerge>
              {shadowEnabled && <feMergeNode in="DROP_SHADOW" />}
              <feMergeNode in={style.noise > 0 ? "NOISE_MASKED" : "SourceGraphic"} />
              {style.noise > 0 && <feMergeNode in="SourceGraphic" />}
              {showLighting && (
                <>
                <feMergeNode in="SHADOW_PASS" />
                <feMergeNode in="LIGHT_PASS" />
                {style.bevel > 0 && <feMergeNode in="BEVEL_SHADOW" />}
                {style.bevel > 0 && <feMergeNode in="BEVEL_HIGHLIGHT" />}
                <feMergeNode in="GLOSS" />
                </>
              )}
              {style.noise > 0 && <feMergeNode in="NOISE_MASKED" />}
            </feMerge>
          </filter>
        )}
      </defs>
      {isText ? (
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize={element.fontSize} fontFamily={element.fontFamily || 'Inter, sans-serif'} fontWeight={element.fontWeight} letterSpacing={element.letterSpacing} fill={fill} filter={useFilter ? `url(#${filterId})` : undefined} stroke={element.textStrokeColor || 'none'} strokeWidth={element.textStrokeWidth || 0}>{element.text}</text>
      ) : isIcon ? (
         <g filter={useFilter ? `url(#${filterId})` : undefined}>
            <rect 
                x={0} y={0} width={width} height={height}
                fill={fill}
                mask={`url(#${maskId})`}
            />
         </g>
      ) : (
        <rect x={0} y={0} width={width} height={height} rx={element.type === 'circle' ? '50%' : style.borderRadius} ry={element.type === 'circle' ? '50%' : style.borderRadius} fill={fill} filter={useFilter ? `url(#${filterId})` : undefined} stroke={style.borderWidth > 0 ? style.borderColor : 'none'} strokeWidth={style.borderWidth} />
      )}
    </svg>
  );
};

export const PreviewStudio: React.FC<PreviewStudioProps> = ({ isOpen, onClose, state }) => {
  const [activeTab, setActiveTab] = useState<'icon' | 'phone'>('icon');

  if (!isOpen) return null;

  const renderIcon = (size: number) => {
    const scale = size / state.canvasSize.width;
    const sortedElements = [...state.elements].sort((a, b) => state.elements.indexOf(a) - state.elements.indexOf(b));

    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: state.transparentBackground ? 'transparent' : state.backgroundColor,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: size * 0.22, 
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: state.canvasSize.width,
            height: state.canvasSize.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
        }}>
            {sortedElements.map(el => {
                if (!el.visible) return null;
                if (el.type === 'folder') return null; 

                return (
                    <div
                        key={el.id}
                        style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            transform: `rotate(${el.rotation}deg)`,
                            mixBlendMode: el.style.blendMode as any,
                            opacity: el.style.opacity
                        }}
                    >
                         <div style={{
                             width: '100%', height: '100%',
                             transform: `${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`
                         }}>
                             <SvgClayRenderer element={el} />
                         </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
       <div className="bg-[#1e1e1e] w-[800px] h-[600px] rounded-2xl border border-[#333] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#252525]">
             <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="text-green-400" size={16} />
                Preview Studio
             </h2>
             <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#333] text-gray-400 hover:text-white transition-colors">
                <X size={18} />
             </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
             <div className="w-40 border-r border-[#333] bg-[#222] p-3 space-y-1">
                <button onClick={() => setActiveTab('icon')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'icon' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#333]'}`}>
                    <LayoutGrid size={14} /> Sizes
                </button>
                <button onClick={() => setActiveTab('phone')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'phone' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#333]'}`}>
                    <Smartphone size={14} /> Mobile
                </button>
             </div>

             <div className="flex-1 bg-[#151515] p-6 overflow-y-auto flex items-center justify-center">
                 {activeTab === 'icon' && (
                     <div className="grid grid-cols-2 gap-8">
                         <div className="flex flex-col items-center gap-2">
                             {renderIcon(128)}
                             <span className="text-[10px] text-gray-500 font-mono">128px</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                             {renderIcon(64)}
                             <span className="text-[10px] text-gray-500 font-mono">64px</span>
                         </div>
                          <div className="flex flex-col items-center gap-2">
                             {renderIcon(192)}
                             <span className="text-[10px] text-gray-500 font-mono">192px</span>
                         </div>
                          <div className="flex flex-col items-center gap-2">
                             {renderIcon(100)}
                             <span className="text-[10px] text-gray-500 font-mono">100px</span>
                         </div>
                     </div>
                 )}
                 
                 {activeTab === 'phone' && (
                     <div className="relative w-[280px] h-[550px] bg-[#000] rounded-[36px] border-[6px] border-[#333] shadow-2xl overflow-hidden ring-1 ring-white/10">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-black opacity-80" />
                         
                         <div className="h-6 w-full flex justify-between px-6 items-center pt-3 relative z-10">
                             <div className="text-[10px] text-white font-medium">9:41</div>
                         </div>

                         <div className="p-5 grid grid-cols-4 gap-4 mt-8 relative z-10">
                             <div className="flex flex-col items-center gap-1">
                                 {renderIcon(50)}
                                 <span className="text-[9px] text-white drop-shadow-md">IconClay</span>
                             </div>
                             
                             {[...Array(11)].map((_, i) => (
                                 <div key={i} className="flex flex-col items-center gap-1 opacity-20">
                                     <div className="w-[50px] h-[50px] bg-white rounded-[12px]" />
                                     <div className="w-8 h-1 bg-white rounded-full" />
                                 </div>
                             ))}
                         </div>
                         
                         <div className="absolute bottom-4 left-3 right-3 h-18 bg-white/5 backdrop-blur-md rounded-[24px] flex items-center justify-around px-1 z-10">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className="w-[48px] h-[48px] bg-white/10 rounded-[12px]" />
                             ))}
                         </div>
                     </div>
                 )}
             </div>
          </div>
       </div>
    </div>
  );
};