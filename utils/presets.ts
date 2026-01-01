






import { ClayStyle } from '../types';

export interface Preset {
  id: string;
  name: string;
  style: Partial<ClayStyle>;
}

export const MATERIAL_PRESETS: Preset[] = [
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