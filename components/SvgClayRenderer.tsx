import React from 'react';
import * as LucideIcons from 'lucide-react';
// @ts-ignore
import * as HeroOutline from 'heroicons-outline';
// @ts-ignore
import * as HeroSolid from 'heroicons-solid';
import { CanvasElement } from '../types';
import { getSquirclePath } from '../utils/geometry';

interface SvgClayRendererProps {
  element: CanvasElement;
  maskElement?: CanvasElement;
  mergedChildren?: CanvasElement[]; // For Boolean Union
  idPrefix?: string;
}

/**
 * Generates an SVG path string for a regular polygon.
 */
const getPolygonPath = (sides: number, width: number, height: number): string => {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;
  let path = "";

  // Rotate -90deg so the first point is at the top
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) path += `M ${x} ${y}`;
    else path += ` L ${x} ${y}`;
  }
  path += " Z";
  return path;
};

/**
 * Generates an SVG path string for a star.
 */
const getStarPath = (points: number, width: number, height: number, innerRatio: number = 0.5): string => {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) / 2;
  const innerR = outerR * innerRatio;
  let path = "";
  const totalPoints = points * 2;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < totalPoints; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = startAngle + (i * Math.PI) / points;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) path += `M ${x} ${y}`;
    else path += ` L ${x} ${y}`;
  }
  path += " Z";
  return path;
};

/**
 * SVG Clay Renderer (High Precision)
 * Renders individual elements using SVG filters to simulate clay/neumorphic physics.
 */
export const SvgClayRenderer: React.FC<SvgClayRendererProps> = ({ element, maskElement, mergedChildren, idPrefix = '' }) => {
  const { style } = element;
  const gradientId = `grad-${idPrefix}${element.id}`;
  const filterId = `clay-filter-${idPrefix}${element.id}`;
  const patternId = `pat-${idPrefix}${element.id}`;
  const iconMaskId = `icon-mask-${idPrefix}${element.id}`;
  const layerMaskId = `layer-mask-${idPrefix}${element.id}`;

  const isText = element.type === 'text';
  const isIcon = element.type === 'icon';
  const isMergedGroup = !!mergedChildren && mergedChildren.length > 0;

  const width = element.width;
  const height = element.height;

  // Visual Properties
  const shadowEnabled = style.shadowEnabled !== false;
  const shadowAngle = style.shadowAngle ?? style.lightSource;
  const shadowDist = style.shadowDistance ?? style.depth;
  const shadowBlurVal = style.shadowBlur !== undefined ? style.shadowBlur : 20;

  const showLighting = style.lighting !== false;
  const shadingOpacity = style.surfaceIntensity ?? style.intensity;

  // Light Geometry
  const lightAngle = style.lightSource;
  const azimuth = (lightAngle - 90) % 360;
  const oppositeAzimuth = (azimuth + 180) % 360;

  // Geometry Modification
  const extrusion = (element.textExtrusion || 0);

  // Shadow Offsets
  const shadowRad = (shadowAngle * Math.PI) / 180;
  const shadowDx = Math.cos(shadowRad) * (shadowDist / 2);
  const shadowDy = Math.sin(shadowRad) * (shadowDist / 2);

  // Bevel Offsets (For Inner Sharp Highlight)
  const angleRad = (lightAngle * Math.PI) / 180;
  const bevelDx = Math.cos(angleRad) * style.bevel;
  const bevelDy = Math.sin(angleRad) * style.bevel;

  const fill = style.gradient ? `url(#${gradientId})` : style.color;

  const useFilter = (showLighting) || (shadowEnabled) || (extrusion > 0) || (style.noise > 0) || (style.surfacePattern && style.surfacePattern !== 'none');

  // Calculate padding based on blur radius to prevent clipping
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

  // Render Pattern Definition
  const renderPatternDef = () => {
      if (!style.surfacePattern || style.surfacePattern === 'none') return null;
      
      const pScale = style.patternScale || 1;
      const opacity = style.patternOpacity || 0.1;
      const color = style.gradient ? style.gradientColor : 'rgba(0,0,0,1)';

      let content;
      let size = 10 * pScale;
      
      if (style.surfacePattern === 'dots') {
          content = <circle cx={size/2} cy={size/2} r={1.5 * pScale} fill={color} />;
      } else if (style.surfacePattern === 'lines') {
          content = <path d={`M 0 ${size} L ${size} 0`} stroke={color} strokeWidth={1 * pScale} />;
      } else if (style.surfacePattern === 'grid') {
          content = <path d={`M ${size} 0 L 0 0 L 0 ${size}`} fill="none" stroke={color} strokeWidth={1 * pScale} />;
      }

      return (
          <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <g style={{ opacity }}>{content}</g>
          </pattern>
      );
  };

  const ShapeRenderer = ({ el, overrideFill }: { el: CanvasElement, overrideFill?: string }) => {
      const shapeWidth = el.width;
      const shapeHeight = el.height;
      const shapeFill = overrideFill || fill;
      
      if (el.type === 'text') {
        return (
            <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize={el.fontSize}
                fontFamily={el.fontFamily || 'Inter, sans-serif'}
                fontWeight={el.fontWeight}
                letterSpacing={el.letterSpacing}
                fill={shapeFill}
                stroke={el.textStrokeColor || 'none'}
                strokeWidth={el.textStrokeWidth || 0}
            >
            {el.text}
            </text>
        );
      } 
      
      if (el.type === 'icon') {
          // If merged, we skip icons because simple extraction without DOM parser is fragile.
          if (mergedChildren) return null;

          return (
            <rect
                x={0} y={0} width={shapeWidth} height={shapeHeight}
                fill={shapeFill}
                mask={`url(#${iconMaskId})`}
            />
          );
      }
      
      const elIsCustom = ['triangle', 'star', 'hexagon', 'squircle'].includes(el.type);
      if (elIsCustom) {
          let path = "";
          if (el.type === 'triangle') path = getPolygonPath(3, shapeWidth, shapeHeight);
          else if (el.type === 'hexagon') path = getPolygonPath(6, shapeWidth, shapeHeight);
          else if (el.type === 'star') path = getStarPath(5, shapeWidth, shapeHeight, 0.45);
          else if (el.type === 'squircle') path = getSquirclePath(shapeWidth, shapeHeight);
          
          return <path d={path} fill={shapeFill} stroke={!mergedChildren && style.borderWidth > 0 ? style.borderColor : 'none'} strokeWidth={!mergedChildren ? style.borderWidth : 0} />;
      }
      
      // Default Rect/Circle/Rounded
      return (
        <rect
            x={0} y={0}
            width={shapeWidth}
            height={shapeHeight}
            rx={el.type === 'circle' ? '50%' : (!mergedChildren ? style.borderRadius : el.style.borderRadius)}
            ry={el.type === 'circle' ? '50%' : (!mergedChildren ? style.borderRadius : el.style.borderRadius)}
            fill={shapeFill}
            stroke={!mergedChildren && style.borderWidth > 0 ? style.borderColor : 'none'}
            strokeWidth={!mergedChildren ? style.borderWidth : 0}
        />
      );
  };

  const RenderContent = () => {
    if (isMergedGroup && mergedChildren) {
        return (
            <g>
                {mergedChildren.map(child => (
                    <g key={child.id} transform={`translate(${child.x - element.x}, ${child.y - element.y}) rotate(${child.rotation}, ${child.width/2}, ${child.height/2})`}>
                       <ShapeRenderer el={child} overrideFill={fill} />
                    </g>
                ))}
            </g>
        );
    }
    return <ShapeRenderer el={element} />;
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', color: style.color }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {renderGradientDef()}
        {renderPatternDef()}

        {isIcon && !isMergedGroup && (
          <mask id={iconMaskId}>
            <g transform={`translate(${iconTx}, ${iconTy}) scale(${iconScale})`}>
              {/* Simply render the icon directly. stroke="white" for outline, fill="white" for solid or both depending on desired mask opacity */}
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
        
        {maskElement && (
            <mask id={layerMaskId} maskUnits="userSpaceOnUse">
               <g transform={`translate(${maskElement.x - element.x}, ${maskElement.y - element.y}) rotate(${maskElement.rotation}, ${maskElement.width/2}, ${maskElement.height/2})`}>
                  <rect 
                    x={0} y={0} width={maskElement.width} height={maskElement.height}
                    rx={maskElement.type === 'circle' ? '50%' : maskElement.style.borderRadius}
                    ry={maskElement.type === 'circle' ? '50%' : maskElement.style.borderRadius}
                    fill="white"
                  />
               </g>
            </mask>
        )}

        {useFilter && (
          <filter
            id={filterId}
            x={-padding}
            y={-padding}
            width={width + padding * 2}
            height={height + padding * 2}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="linearRGB"
          >
            {/* --- 0. GEOMETRY PREP --- */}
            {extrusion > 0 ? (
              <feMorphology in="SourceAlpha" operator="dilate" radius={extrusion / 2} result="BASE_ALPHA" />
            ) : (
              <feColorMatrix in="SourceAlpha" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="BASE_ALPHA" />
            )}

            {/* --- 1. DROP SHADOW (Atmosphere) --- */}
            {shadowEnabled && (
              <feDropShadow
                in="BASE_ALPHA"
                dx={shadowDx}
                dy={shadowDy}
                stdDeviation={shadowBlurVal / 2}
                floodOpacity={style.intensity}
                result="DROP_SHADOW"
              />
            )}

            {/* --- 2. ELEVATION MAP (The "Clay" Shape) --- */}
            <feGaussianBlur
              in="BASE_ALPHA"
              stdDeviation={Math.max(1, style.blur)}
              result="ELEVATION_MAP"
            />

            {/* --- 3. VOLUME LIGHTING --- */}
            {showLighting && (
              <>
                {/* A. KEY LIGHT */}
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

                {/* B. FILL SHADOW */}
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

                {/* C. BEVEL */}
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

                {/* D. GLOSS */}
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

            {/* --- 4. TEXTURE NOISE --- */}
            {style.noise > 0 && (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={0.6 / (style.noiseScale || 1)} numOctaves={3} stitchTiles="stitch" result="NOISE_RAW" />
                <feColorMatrix type="saturate" values="0" in="NOISE_RAW" result="NOISE_DESAT" />
                <feComponentTransfer in="NOISE_DESAT" result="NOISE_ALPHA"><feFuncA type="linear" slope={style.noise / 100} /></feComponentTransfer>
                <feComposite in="NOISE_ALPHA" in2="BASE_ALPHA" operator="in" result="NOISE_MASKED" />
              </>
            )}

            {/* --- 5. COMPOSITION STACK --- */}
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

      <g mask={maskElement ? `url(#${layerMaskId})` : undefined}>
        <g filter={useFilter ? `url(#${filterId})` : undefined}>
            <RenderContent />
        </g>
        {!isMergedGroup && <g filter={useFilter ? `url(#${filterId})` : undefined}><pattern id={patternId} /></g>}
      </g>
    </svg>
  );
};