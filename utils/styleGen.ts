import { CanvasElement } from '../types';
import React from 'react';

/**
 * Calculates the X and Y offsets based on a distance and angle.
 */
const getOffset = (distance: number, angleDegrees: number) => {
  const angleRad = (angleDegrees * Math.PI) / 180;
  return {
    x: Math.round(Math.cos(angleRad) * distance),
    y: Math.round(Math.sin(angleRad) * distance),
  };
};

export const generateClayCSS = (element: CanvasElement): React.CSSProperties => {
  const { style, type } = element;
  
  const {
    color,
    gradient,
    gradientColor,
    gradientType,
    gradientAngle,
    opacity,
    blendMode,
    
    // Light
    lighting, 
    lightSource,
    depth, // Internal Volume Depth
    surfaceIntensity,
    
    // Shadow
    shadowEnabled,
    shadowAngle,
    shadowDistance,
    shadowBlur,
    intensity, // Shadow Opacity

    blur,
    convex,
    bevel,
    bevelIntensity,
    
    // Specular
    gloss,
    specularBlur,
    specularColor,

    borderWidth,
    borderColor,
    borderRadius,
  } = style;

  // Defaults if new properties are missing
  const useShadow = shadowEnabled !== false;
  const sAngle = shadowAngle ?? lightSource;
  const sDist = shadowDistance ?? depth;
  const sBlur = shadowBlur ?? 20;
  
  const useLight = lighting !== false;

  // Fallback for existing elements without surfaceIntensity
  const shadingOpacity = surfaceIntensity ?? intensity;

  // --- Calculations ---
  
  // 1. Drop Shadow Calcs
  const dropDist = sDist;
  const dropOff = getOffset(dropDist, sAngle);
  // Add a secondary ambient shadow for realism
  const dropLightOff = getOffset(dropDist, sAngle + 180); 
  const darkAlpha = intensity;
  
  // 2. Light/Volume Calcs (Dual-Pass Logic)
  // Instead of one generic shadow, we calculate an "Inset Highlight" (Top) and "Inset Shadow" (Bottom)
  const volDist = depth / 2;
  const highlightOff = getOffset(volDist, lightSource); // Towards light
  const shadowOff = getOffset(volDist, lightSource + 180); // Away from light


  // Generate the Background String (Linear or Radial)
  let backgroundValue = color;
  if (gradient) {
    if (gradientType === 'radial') {
      const sourceAngleRad = ((lightSource + 180) * Math.PI) / 180;
      const cx = 50 + Math.cos(sourceAngleRad) * 30;
      const cy = 50 + Math.sin(sourceAngleRad) * 30;
      backgroundValue = `radial-gradient(circle at ${cx}% ${cy}%, ${gradientColor}, ${color})`;
    } else {
      backgroundValue = `linear-gradient(${gradientAngle}deg, ${color}, ${gradientColor})`;
    }
  }

  // ============================
  // TEXT & ICON RENDERING LOGIC
  // ============================
  if (type === 'text' || type === 'icon') {
    return {
      opacity,
      mixBlendMode: (blendMode || 'normal') as any,
      transform: 'translateZ(0)',
    };
  }

  // ============================
  // SHAPE RENDERING LOGIC
  // ============================

  const layers = [];

  // A. Drop Shadow (Independent)
  if (useShadow) {
    // Primary Drop Shadow
    layers.push(`${dropOff.x}px ${dropOff.y}px ${sBlur}px rgba(0, 0, 0, ${darkAlpha})`);
    // Ambient Light Bounce (Optional, subtle)
    // layers.push(`${dropLightOff.x}px ${dropLightOff.y}px ${sBlur}px rgba(255, 255, 255, ${darkAlpha * 0.1})`);
  }

  // B. Internal Lighting (Bevels + Volume)
  if (useLight) {
    // Bevel (The "Lip")
    const bevelDist = Math.max(0, bevel);
    const bevelOff = getOffset(bevelDist, lightSource); 
    const bevelHighlight = `inset ${bevelOff.x}px ${bevelOff.y}px ${Math.max(1, bevelDist)}px rgba(255,255,255,${bevelIntensity * 0.9})`;
    const bevelShadow = `inset ${-bevelOff.x}px ${-bevelOff.y}px ${Math.max(1, bevelDist)}px rgba(0,0,0,${bevelIntensity})`;

    // Volume (Dual Pass: Light Top, Dark Bottom)
    // Note: CSS Blur on inset box-shadows is not perfectly "smooth" gradient like SVG, but this approximates it.
    let volumeHighlight = '';
    let volumeShadow = '';

    if (convex) {
      // Standard Clay: White Top-Left, Black Bottom-Right
      volumeHighlight = `inset ${highlightOff.x}px ${highlightOff.y}px ${blur * 2}px rgba(255,255,255,${shadingOpacity * 1.5})`;
      volumeShadow = `inset ${shadowOff.x}px ${shadowOff.y}px ${blur * 2}px rgba(0,0,0,${shadingOpacity})`;
    } else {
      // Concave: Black Top-Left, White Bottom-Right
      volumeShadow = `inset ${highlightOff.x}px ${highlightOff.y}px ${blur * 2}px rgba(0,0,0,${shadingOpacity})`;
      volumeHighlight = `inset ${shadowOff.x}px ${shadowOff.y}px ${blur * 2}px rgba(255,255,255,${shadingOpacity})`;
    }

    // Gloss / Specular (Top Spot)
    let glossShadow = '';
    if (gloss > 0) {
        const sColor = specularColor || '#ffffff';
        const sBlur = specularBlur !== undefined ? specularBlur : 5;
        // Gloss usually sits closer to top left
        glossShadow = `inset ${highlightOff.x/1.5}px ${highlightOff.y/1.5}px ${sBlur}px ${sColor}`;
    }

    // Push Layers (Order matters: Top rendering first in CSS box-shadow stack)
    if (bevel > 0) {
        layers.push(bevelHighlight);
        layers.push(bevelShadow);
    }
    
    if (gloss > 0) layers.push(glossShadow);

    // Volume comes after gloss/bevel so they sit "on top" visually in terms of mixing? 
    // Actually in box-shadow, the first one is on top.
    layers.push(volumeHighlight);
    layers.push(volumeShadow);
  }

  return {
    background: backgroundValue,
    opacity,
    mixBlendMode: (blendMode || 'normal') as any,
    borderRadius: `${borderRadius}px`,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
    boxShadow: layers.length > 0 ? layers.join(', ') : 'none',
    transform: 'translateZ(0)',
  };
};