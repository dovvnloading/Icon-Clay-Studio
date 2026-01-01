

export type ShapeType = 'rectangle' | 'circle' | 'rounded' | 'squircle' | 'text' | 'icon' | 'folder' | 'triangle' | 'star' | 'hexagon';

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' 
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' 
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export type IconLibrary = 'lucide' | 'heroicons-outline' | 'heroicons-solid';

export type SurfacePattern = 'none' | 'dots' | 'lines' | 'grid';

export interface ClayStyle {
  color: string;
  gradient: boolean;
  gradientColor: string;
  gradientType: 'linear' | 'radial';
  gradientAngle: number;
  opacity: number;
  blendMode: string; 
  
  // --- SURFACE LIGHTING (Internal 3D) ---
  lighting: boolean; // Controls whether internal lighting effects (bevels, volume) are rendered
  lightSource: number; // Angle for internal highlights/shadows
  depth: number; // Controls internal volume/surface depth (concavity/convexity strength)
  surfaceIntensity: number; // Internal Shading Opacity (Decoupled from Shadow)
  
  // --- DROP SHADOW (External Atmosphere) ---
  shadowEnabled: boolean; // New independent toggle
  shadowAngle: number; // New independent angle
  shadowDistance: number; // New independent distance
  shadowBlur: number; // Drop Shadow blur (Atmosphere)
  intensity: number; // Controls drop shadow opacity
  
  // --- SURFACE TEXTURE ---
  blur: number; // Object Surface Softness (Sculpting blur)
  convex: boolean; // True = pop out, False = pressed in
  
  // 3D Bevel & Finish
  bevel: number; // Thickness of the "lip" or edge
  bevelIntensity: number; // Contrast of the bevel highlights/shadows
  
  // --- ADVANCED SPECULAR ---
  gloss: number; // Specular highlight intensity (0-100)
  specularBlur: number; // Softness of the light reflection independent of object blur
  specularColor: string; // Tint of the highlight

  // Texture
  noise: number; // 0-100 Grain intensity
  noiseScale: number; // Scale of the grain
  
  // New: Patterns
  surfacePattern: SurfacePattern;
  patternOpacity: number;
  patternScale: number;
  
  // Border
  borderWidth: number;
  borderColor: string;
  borderRadius: number; // For rect/rounded
}

export interface CanvasElement {
  id: string;
  name: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  style: ClayStyle;
  
  // Hierarchy
  parentId?: string | null;
  maskId?: string | null; // Pointer to the element acting as a mask
  collapsed?: boolean;
  merge?: boolean; // Boolean Union Flag
  
  // Text Specific Props
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  
  // Icon Specific Props
  iconName?: string;
  iconLib?: IconLibrary;
  
  // Advanced 3D Text/Icon Props
  textExtrusion?: number; // Depth of the 3D block
  textExtrusionColor?: string;
  textExtrusionAngle?: number;
  textStrokeWidth?: number;
  textStrokeColor?: string;
}

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
  isCenter?: boolean;
}

export interface AppState {
  elements: CanvasElement[];
  selectedIds: string[];
  canvasSize: { width: number; height: number };
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  zoom: number;
  viewOffset: { x: number; y: number };
  backgroundColor: string;
  transparentBackground: boolean;
  isIconPickerOpen: boolean;
  isInfoOpen: boolean;
  isPreviewOpen: boolean; // New State for Preview Studio
}

export const DEFAULT_STYLE: ClayStyle = {
  color: '#252525',
  gradient: false,
  gradientColor: '#333333',
  gradientType: 'linear',
  gradientAngle: 135,
  opacity: 1,
  blendMode: 'normal',
  
  // Surface
  lighting: true,
  lightSource: 135,
  depth: 20, // Internal Depth
  surfaceIntensity: 0.2, // Decoupled shading opacity
  blur: 10,
  convex: true,
  
  // Shadow
  shadowEnabled: true,
  shadowAngle: 135,
  shadowDistance: 20,
  shadowBlur: 40,
  intensity: 0.3,

  // Finish
  bevel: 2,
  bevelIntensity: 0.6,
  
  // Specular
  gloss: 15,
  specularBlur: 5,
  specularColor: '#ffffff',

  noise: 0,
  noiseScale: 1,
  
  // Patterns
  surfacePattern: 'none',
  patternOpacity: 0.1,
  patternScale: 1,

  borderWidth: 0,
  borderColor: '#444444',
  borderRadius: 40,
};