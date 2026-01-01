import React, { useRef, useState, useEffect } from 'react';
import { AppState, CanvasElement, Guide } from '../types';
import { generateClayCSS } from '../utils/styleGen';
import { SvgClayRenderer } from './SvgClayRenderer';
import { getElementBounds, calculateSmartGuides } from '../utils/geometry';

interface CanvasProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onSelect: (id: string | string[] | null, multi: boolean) => void;
  onContextMenu: (e: React.MouseEvent, id: string | null) => void;
  onRecordHistory: () => void;
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br';
type DragMode = 'move' | 'resize' | 'pan' | 'boxSelect';

interface InteractionState {
  mode: DragMode;
  activeId?: string;
  handle?: HandleType;
  startX: number;
  startY: number;
  currentX?: number;
  currentY?: number;
  initial: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  initialView?: { x: number; y: number };
  initialSelection?: string[];
}

export const Canvas: React.FC<CanvasProps> = ({ state, onUpdateState, onUpdateElement, onSelect, onContextMenu, onRecordHistory }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);
  const hasCentered = useRef(false);

  const SNAP_THRESHOLD = 5;

  // --- Global Interaction Handler ---
  useEffect(() => {
    if (!interaction) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    // Lock selection to prevent highlighting text/elements while dragging
    document.body.style.userSelect = 'none';

    // Set temporary global cursor
    if (interaction.mode === 'pan') document.body.style.cursor = 'grabbing';
    else if (interaction.mode === 'move') document.body.style.cursor = 'move';
    else if (interaction.mode === 'resize') {
       // Use a generic crosshair or specific resize cursor based on handle logic if needed
       // Note: To be perfectly accurate we'd map handle -> cursor, but crosshair is often sufficient for "active resize"
       document.body.style.cursor = 'crosshair';
    }

    const handleWindowMouseMove = (e: MouseEvent) => {
      e.preventDefault(); // Stop text selection

      // 1. PANNING
      if (interaction.mode === 'pan' && interaction.initialView) {
        const dx = e.clientX - interaction.startX;
        const dy = e.clientY - interaction.startY;
        onUpdateState({
          viewOffset: {
            x: interaction.initialView.x + dx,
            y: interaction.initialView.y + dy
          }
        });
        return;
      }

      // 2. BOX SELECTION
      if (interaction.mode === 'boxSelect') {
        const currentX = e.clientX;
        const currentY = e.clientY;

        setInteraction(prev => ({
          ...prev!,
          currentX,
          currentY
        }));

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        const relStartX = interaction.startX - rect.left;
        const relStartY = interaction.startY - rect.top;
        const relCurrX = currentX - rect.left;
        const relCurrY = currentY - rect.top;

        const boxLeft = Math.min(relStartX, relCurrX);
        const boxTop = Math.min(relStartY, relCurrY);
        const boxWidth = Math.abs(relCurrX - relStartX);
        const boxHeight = Math.abs(relCurrY - relStartY);

        const worldLeft = (boxLeft - state.viewOffset.x) / state.zoom;
        const worldTop = (boxTop - state.viewOffset.y) / state.zoom;
        const worldRight = worldLeft + (boxWidth / state.zoom);
        const worldBottom = worldTop + (boxHeight / state.zoom);

        const intersectingIds = state.elements
          .filter(el => {
            if (!el.visible || el.locked) return false;
            const b = getElementBounds(el);
            return !(b.left > worldRight ||
              b.right < worldLeft ||
              b.top > worldBottom ||
              b.bottom < worldTop);
          })
          .map(el => el.id);

        const newSelection = Array.from(new Set([...(interaction.initialSelection || []), ...intersectingIds]));
        onUpdateState({ selectedIds: newSelection });
        return;
      }

      // 3. MOVE & RESIZE
      const { activeId, startX, startY, initial, handle } = interaction;
      if (!activeId) return;

      const zoom = state.zoom;
      const rawDx = (e.clientX - startX) / zoom;
      const rawDy = (e.clientY - startY) / zoom;

      const snapToGrid = (val: number) => {
        if (!state.snapToGrid) return val;
        return Math.round(val / state.gridSize) * state.gridSize;
      };

      if (interaction.mode === 'move') {
        let newX = initial.x + rawDx;
        let newY = initial.y + rawDy;

        const otherElements = state.elements.filter(el => el.id !== activeId);
        const { snapDx, snapDy, guides } = calculateSmartGuides(
          { x: newX, y: newY, width: initial.width, height: initial.height },
          otherElements,
          state.canvasSize,
          state.zoom,
          SNAP_THRESHOLD
        );

        let finalX = newX;
        let finalY = newY;

        if (guides.length > 0) {
          finalX += snapDx;
          finalY += snapDy;
          setActiveGuides(guides);
        } else {
          if (state.snapToGrid) {
            finalX = snapToGrid(newX);
            finalY = snapToGrid(newY);
          }
          setActiveGuides([]);
        }

        onUpdateElement(activeId, { x: finalX, y: finalY });
      } else if (interaction.mode === 'resize' && handle) {
        const rad = (initial.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const localDx = rawDx * cos + rawDy * sin;
        const localDy = rawDy * cos - rawDx * sin;

        let newW = initial.width;
        let newH = initial.height;

        switch (handle) {
          case 'br': newW = initial.width + localDx; newH = initial.height + localDy; break;
          case 'bl': newW = initial.width - localDx; newH = initial.height + localDy; break;
          case 'tr': newW = initial.width + localDx; newH = initial.height - localDy; break;
          case 'tl': newW = initial.width - localDx; newH = initial.height - localDy; break;
        }

        newW = Math.max(state.gridSize, newW);
        newH = Math.max(state.gridSize, newH);

        if (state.snapToGrid) {
          newW = Math.round(newW / state.gridSize) * state.gridSize;
          newH = Math.round(newH / state.gridSize) * state.gridSize;
          newW = Math.max(state.gridSize, newW);
          newH = Math.max(state.gridSize, newH);
        }

        const deltaW = newW - initial.width;
        const deltaH = newH - initial.height;

        let localCenterShiftX = 0;
        let localCenterShiftY = 0;

        switch (handle) {
          case 'br': localCenterShiftX = deltaW / 2; localCenterShiftY = deltaH / 2; break;
          case 'bl': localCenterShiftX = -deltaW / 2; localCenterShiftY = deltaH / 2; break;
          case 'tr': localCenterShiftX = deltaW / 2; localCenterShiftY = -deltaH / 2; break;
          case 'tl': localCenterShiftX = -deltaW / 2; localCenterShiftY = -deltaH / 2; break;
        }

        const globalShiftX = localCenterShiftX * cos - localCenterShiftY * sin;
        const globalShiftY = localCenterShiftX * sin + localCenterShiftY * cos;

        const initialCx = initial.x + initial.width / 2;
        const initialCy = initial.y + initial.height / 2;
        const newCx = initialCx + globalShiftX;
        const newCy = initialCy + globalShiftY;

        const newX = newCx - newW / 2;
        const newY = newCy - newH / 2;

        setActiveGuides([]);
        onUpdateElement(activeId, { x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      setInteraction(null);
      setActiveGuides([]);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [interaction, state, onUpdateState, onUpdateElement]);

  const handleMouseDown = (e: React.MouseEvent, id?: string, handle?: HandleType) => {
    // Prevent default browser behavior (drag & drop of images, text selection)
    // This is CRITICAL to prevent the "stuck" cursor issue where the browser
    // thinks you are dragging a ghost image of the element.
    if (e.button === 0 || e.button === 1) {
      e.preventDefault(); 
    }

    if (e.button === 2) return;

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setInteraction({
        mode: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        initial: { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
        initialView: { ...state.viewOffset }
      });
      return;
    }

    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

    if (id) {
      e.stopPropagation();
      const el = state.elements.find(el => el.id === id);
      if (!el) return;
      if (el.locked && !handle) return;
      if (el.locked) return;

      onSelect(id, isMultiSelect);
      onRecordHistory(); // Record history before modification starts

      setInteraction({
        mode: handle ? 'resize' : 'move',
        activeId: id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        initial: { ...el },
      });
    } else {
      if (e.button === 0) {
        const startSelection = isMultiSelect ? state.selectedIds : [];
        if (!isMultiSelect) onSelect(null, false);

        setInteraction({
          mode: 'boxSelect',
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY,
          initial: { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
          initialSelection: startSelection
        });
        return;
      }
      onSelect(null, false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const performCenter = () => {
      if (hasCentered.current) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw > 0 && ch > 0) {
        onUpdateState({
          viewOffset: {
            x: (cw - state.canvasSize.width * state.zoom) / 2,
            y: (ch - state.canvasSize.height * state.zoom) / 2
          }
        });
        hasCentered.current = true;
      }
    };
    performCenter();
    const resizeObserver = new ResizeObserver(() => performCenter());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY;
        const zoomStep = 0.05;
        const direction = delta > 0 ? 1 : -1;
        const newZoom = Math.max(0.1, Math.min(3, state.zoom + (direction * zoomStep)));
        if (newZoom !== state.zoom) onUpdateState({ zoom: newZoom });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [state.zoom, onUpdateState]);

  const getFolderBounds = (folderId: string) => {
    const children = state.elements.filter(e => e.parentId === folderId);
    if (children.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxR = -Infinity, maxB = -Infinity;

    children.forEach(child => {
      if (child.type === 'folder') {
        const subBounds = getFolderBounds(child.id);
        if (subBounds) {
          minX = Math.min(minX, subBounds.x);
          minY = Math.min(minY, subBounds.y);
          maxR = Math.max(maxR, subBounds.x + subBounds.width);
          maxB = Math.max(maxB, subBounds.y + subBounds.height);
        }
      } else {
        minX = Math.min(minX, child.x);
        minY = Math.min(minY, child.y);
        maxR = Math.max(maxR, child.x + child.width);
        maxB = Math.max(maxB, child.y + child.height);
      }
    });

    if (minX === Infinity) return null;
    return { x: minX, y: minY, width: maxR - minX, height: maxB - minY };
  };

  const renderElementTree = (parentId: string | null): React.ReactNode[] => {
    const children = state.elements.filter(el =>
      (parentId === null && el.parentId === null) ||
      el.parentId === parentId
    );

    children.sort((a, b) => state.elements.indexOf(a) - state.elements.indexOf(b));

    return children.map(el => {
      if (!el.visible) return null;

      // Handle Boolean Union / Clay Merge for Folders
      if (el.type === 'folder' && el.merge) {
          const folderChildren = state.elements.filter(child => child.parentId === el.id);
          const isSelected = state.selectedIds.includes(el.id);
          const hasChildSelected = folderChildren.some(child => state.selectedIds.includes(child.id));
          
          const clayStyle = generateClayCSS(el);
          const { mixBlendMode, opacity, ...innerStyle } = clayStyle;

          const containerStyle = {
            ...innerStyle,
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            borderRadius: 0,
          };
          
          return (
             <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onMouseEnter={() => setHoveredId(el.id)}
                onMouseLeave={() => setHoveredId(null)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu(e, el.id);
                }}
                className="absolute group"
                style={{
                   left: el.x,
                   top: el.y,
                   width: el.width,
                   height: el.height,
                   transform: `rotate(${el.rotation}deg)`,
                   mixBlendMode: mixBlendMode as any,
                   opacity: opacity !== undefined ? Number(opacity) : 1,
                   pointerEvents: 'auto',
                   cursor: interaction?.mode === 'pan' ? 'grabbing' : (el.locked ? 'default' : 'move'),
                   zIndex: 'auto'
                }}
             >
                {/* 1. Render the Unified Clay Shape */}
                <div className="w-full h-full pointer-events-none" style={containerStyle}>
                    <SvgClayRenderer element={el} mergedChildren={folderChildren} />
                </div>

                {/* 2. Render Interactive Bones (Wireframes) for Children 
                    Only visible if group or a child is selected.
                */}
                {(isSelected || hasChildSelected) && (
                    <div className="absolute inset-0 pointer-events-none">
                         {folderChildren.map(child => {
                             // Calculate child pos relative to parent (accounting for parent rotation implicitly by being in its div)
                             const relativeX = child.x - el.x;
                             const relativeY = child.y - el.y;
                             const isChildSelected = state.selectedIds.includes(child.id);

                             return (
                                 <div 
                                     key={child.id}
                                     className={`absolute ${isChildSelected ? 'z-50' : 'z-10'} pointer-events-auto`}
                                     style={{
                                         left: relativeX,
                                         top: relativeY,
                                         width: child.width,
                                         height: child.height,
                                         transform: `rotate(${child.rotation}deg)`,
                                         cursor: 'move'
                                     }}
                                     onMouseDown={(e) => {
                                         e.stopPropagation(); // Don't drag the parent group
                                         handleMouseDown(e, child.id);
                                     }}
                                 >
                                      {/* Wireframe Outline */}
                                      <div className={`w-full h-full border pointer-events-none transition-colors ${
                                          isChildSelected 
                                            ? 'border-blue-500 border-2' 
                                            : 'border-white/30 border-dashed hover:border-white/60'
                                      }`} />

                                      {/* Resize Handles for Child */}
                                      {isChildSelected && !child.locked && (
                                        <>
                                          <div onMouseDown={(e) => handleMouseDown(e, child.id, 'tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                                          <div onMouseDown={(e) => handleMouseDown(e, child.id, 'tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                                          <div onMouseDown={(e) => handleMouseDown(e, child.id, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                                          <div onMouseDown={(e) => handleMouseDown(e, child.id, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                                        </>
                                      )}
                                 </div>
                             );
                         })}
                    </div>
                )}

                {/* 3. Parent Group Selection UI */}
                {(isSelected || hoveredId === el.id) && (
                    <div className={`selection-ui absolute -inset-[2px] border pointer-events-none ${isSelected ? (el.locked ? 'border-orange-500/50' : 'border-blue-500 z-40') : 'border-blue-500/30'}`}>
                         {/* Simplified resize handles for merged group parent */}
                         {isSelected && !el.locked && (
                            <>
                              <div onMouseDown={(e) => handleMouseDown(e, el.id, 'tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                              <div onMouseDown={(e) => handleMouseDown(e, el.id, 'tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                              <div onMouseDown={(e) => handleMouseDown(e, el.id, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                              <div onMouseDown={(e) => handleMouseDown(e, el.id, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                            </>
                         )}
                    </div>
                )}
             </div>
          );
      }

      if (el.type === 'folder') {
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              mixBlendMode: el.style.blendMode as any,
              opacity: el.style.opacity,
              display: el.visible ? 'block' : 'none',
            }}
          >
            {renderElementTree(el.id)}
          </div>
        );
      }

      const isSelected = state.selectedIds.includes(el.id);
      const clayStyle = generateClayCSS(el);
      const { mixBlendMode, opacity, ...innerStyle } = clayStyle;
      
      const maskElement = el.maskId ? state.elements.find(m => m.id === el.maskId) : undefined;

      const containerStyle = {
        ...innerStyle,
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        borderRadius: 0,
      };

      return (
        <div
          key={el.id}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          onMouseEnter={() => setHoveredId(el.id)}
          onMouseLeave={() => setHoveredId(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, el.id);
          }}
          className={`absolute group`}
          style={{
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: `rotate(${el.rotation}deg)`,
            mixBlendMode: mixBlendMode as any,
            opacity: opacity !== undefined ? Number(opacity) : 1,
            pointerEvents: 'auto',
            cursor: interaction?.mode === 'pan' ? 'grabbing' : (el.locked ? 'default' : 'move'),
            zIndex: 'auto'
          }}
        >
          {/* Apply Flip Transform to content only, so selection UI handles remain unflipped relative to container */}
          <div className="w-full h-full" style={{
             ...containerStyle,
             transform: `${containerStyle.transform || ''} scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`
          }}>
            <SvgClayRenderer element={el} maskElement={maskElement} />
          </div>

          {(isSelected || hoveredId === el.id) && (
            <div className={`selection-ui absolute -inset-[2px] border pointer-events-none 
                        ${isSelected ? (el.locked ? 'border-orange-500/50' : 'border-blue-500 z-50') : 'border-blue-500/30'}`}>
              {isSelected && !el.locked && (
                <>
                  <div onMouseDown={(e) => handleMouseDown(e, el.id, 'tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                  <div onMouseDown={(e) => handleMouseDown(e, el.id, 'tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                  <div onMouseDown={(e) => handleMouseDown(e, el.id, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" />
                  <div onMouseDown={(e) => handleMouseDown(e, el.id, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" />
                </>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative bg-[#121212] overflow-hidden ${interaction?.mode === 'pan' ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={(e) => handleMouseDown(e)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, null);
      }}
    >
      <div
        className="absolute transition-transform duration-75 ease-out origin-top-left border border-white/5"
        style={{
          width: state.canvasSize.width,
          height: state.canvasSize.height,
          transform: `translate(${state.viewOffset.x}px, ${state.viewOffset.y}px) scale(${state.zoom})`,
        }}
      >
        <div className={`absolute inset-0 pointer-events-none ${state.transparentBackground ? 'checkerboard' : ''}`} />

        <div
          id="icon-clay-export-root"
          className="absolute inset-0 overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            fontKerning: 'normal'
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: state.transparentBackground ? 'transparent' : state.backgroundColor,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ isolation: 'auto' }}
          >
            {renderElementTree(null)}
          </div>
        </div>

        {state.elements.filter(el => state.selectedIds.includes(el.id) && el.type === 'folder' && !el.merge).map(folder => {
          const bounds = getFolderBounds(folder.id);
          if (!bounds) return null;
          return (
            <div
              key={`folder-sel-${folder.id}`}
              className="absolute border border-blue-400 border-dashed pointer-events-none z-50 selection-ui"
              style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height
              }}
            >
              <div className="absolute -top-5 left-0 text-[10px] bg-blue-500 text-white px-1 rounded">
                {folder.name}
              </div>
            </div>
          );
        })}

        {state.showGrid && (
          <div className="absolute inset-0 pointer-events-none opacity-20 canvas-grid" style={{ backgroundSize: `${state.gridSize}px ${state.gridSize}px` }} />
        )}

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[100] overflow-visible">
          {activeGuides.map((guide, i) => {
            const strokeColor = guide.isCenter ? '#ef4444' : '#3b82f6';
            if (guide.type === 'horizontal') {
              return (
                <line key={i} x1="0" y1={guide.position} x2={state.canvasSize.width} y2={guide.position} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
              );
            } else {
              return (
                <line key={i} x1={guide.position} y1="0" x2={guide.position} y2={state.canvasSize.height} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2" />
              );
            }
          })}
        </svg>
      </div>

      {interaction?.mode === 'boxSelect' && interaction.currentX !== undefined && interaction.currentY !== undefined && (() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return null;

        const sx = interaction.startX - rect.left;
        const sy = interaction.startY - rect.top;
        const cx = interaction.currentX - rect.left;
        const cy = interaction.currentY - rect.top;

        const left = Math.min(sx, cx);
        const top = Math.min(sy, cy);
        const width = Math.abs(cx - sx);
        const height = Math.abs(cy - sy);

        return (
          <div
            className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-[9999]"
            style={{
              left, top, width, height
            }}
          />
        );
      })()}

      <div className="absolute bottom-4 left-4 bg-[#2a2a2a] text-gray-400 text-xs px-3 py-1.5 rounded-full border border-[#333] pointer-events-none flex items-center gap-2 z-[99]">
        <span>{state.canvasSize.width} x {state.canvasSize.height}</span>
        <span className="w-px h-3 bg-[#444]" />
        <span>{Math.round(state.zoom * 100)}%</span>
      </div>
    </div>
  );
}
