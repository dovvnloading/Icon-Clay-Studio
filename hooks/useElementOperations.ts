import React, { useCallback } from 'react';
import { AppState, CanvasElement, DEFAULT_STYLE, ShapeType, ClayStyle, IconLibrary } from '../types';

export const useElementOperations = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  clipboard: CanvasElement[],
  setClipboard: React.Dispatch<React.SetStateAction<CanvasElement[]>>,
  recordHistory: () => void
) => {
  
  const handleUpdateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, [setState]);

  const getDescendantIds = useCallback((elements: CanvasElement[], parentId: string): string[] => {
    let ids: string[] = [];
    const children = elements.filter(e => e.parentId === parentId);
    children.forEach(child => {
      ids.push(child.id);
      ids = [...ids, ...getDescendantIds(elements, child.id)];
    });
    return ids;
  }, []);

  const handleAddElement = useCallback((type: ShapeType, iconName?: string) => {
    recordHistory();
    const id = Date.now().toString();
    const size = (type === 'text' || type === 'icon') ? 200 : (type === 'folder' ? 100 : 128);
    const randomOffset = Math.floor(Math.random() * 20) - 10;
    const centerX = state.canvasSize.width / 2 - size / 2 + randomOffset;
    const centerY = state.canvasSize.height / 2 - (type === 'text' ? 50 : size / 2) + randomOffset;

    let initialStyle = { ...DEFAULT_STYLE };
    
    if (type === 'text' || type === 'icon') {
        initialStyle = {
            ...initialStyle,
            depth: 0,
            blur: 0,
            intensity: 0,
            surfaceIntensity: 0,
            bevel: 0,
            bevelIntensity: 0,
            gloss: 0,
            noise: 0,
            borderWidth: 0,
            gradient: false,
            lighting: false,
            shadowEnabled: false,
            color: '#FFFFFF'
        };
    } else if (type === 'folder') {
        // Folder defaults
    } else {
        initialStyle = {
            ...initialStyle,
            borderRadius: type === 'circle' ? 999 : type === 'rectangle' ? 0 : 40,
            color: state.transparentBackground ? DEFAULT_STYLE.color : state.backgroundColor,
            // Add subtle defaults for new shapes
            depth: ['triangle', 'star', 'hexagon'].includes(type) ? 10 : DEFAULT_STYLE.depth,
        };
    }

    const newElement: CanvasElement = {
      id,
      name: iconName || (type === 'folder' ? 'Group' : `${type.charAt(0).toUpperCase() + type.slice(1)} ${state.elements.length + 1}`),
      type,
      x: centerX,
      y: centerY,
      width: size,
      height: type === 'text' ? 100 : size,
      rotation: 0,
      zIndex: state.elements.length,
      visible: true,
      locked: false,
      style: initialStyle,
      collapsed: false,
      parentId: null,
      maskId: null,
      text: type === 'text' ? 'Icon' : undefined,
      fontSize: 100,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0,
      iconName: type === 'icon' ? (iconName || 'Star') : undefined,
      iconLib: type === 'icon' ? 'lucide' : undefined,
      textStrokeWidth: type === 'icon' ? 2 : 0
    };

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedIds: [id],
      isIconPickerOpen: false
    }));
  }, [state.canvasSize, state.elements.length, state.backgroundColor, state.transparentBackground, setState, recordHistory]);

  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement> | { style: any }) => {
    setState(prev => {
      const element = prev.elements.find(e => e.id === id);
      if (!element) return prev;

      let newElements = [...prev.elements];
      
      // Folder/Group/Merged Scaling & Translation Logic
      if (element.type === 'folder') {
          const oldX = element.x;
          const oldY = element.y;
          const oldW = element.width;
          const oldH = element.height;

          // Determine new properties (fallback to old if not in update)
          const u = updates as Partial<CanvasElement>;
          const newX = u.x !== undefined ? u.x : oldX;
          const newY = u.y !== undefined ? u.y : oldY;
          const newW = u.width !== undefined ? u.width : oldW;
          const newH = u.height !== undefined ? u.height : oldH;

          // Detect Scale (Resize) vs Translation (Move)
          const sizeChanged = newW !== oldW || newH !== oldH;
          const posChanged = newX !== oldX || newY !== oldY;

          if (sizeChanged) {
             // --- SCALING PROPAGATION ---
             const safeOldW = oldW === 0 ? 1 : oldW;
             const safeOldH = oldH === 0 ? 1 : oldH;
             const scaleX = newW / safeOldW;
             const scaleY = newH / safeOldH;
             const avgScale = (scaleX + scaleY) / 2;

             const descendants = getDescendantIds(prev.elements, id);
             
             newElements = newElements.map(el => {
                 if (descendants.includes(el.id)) {
                     const relX = el.x - oldX;
                     const relY = el.y - oldY;
                     
                     const updatedEl: CanvasElement = {
                         ...el,
                         x: newX + (relX * scaleX),
                         y: newY + (relY * scaleY),
                         width: el.width * scaleX,
                         height: el.height * scaleY,
                     };
                     
                     // Scale Typography
                     if (el.type === 'text' && el.fontSize) {
                         updatedEl.fontSize = el.fontSize * scaleY;
                     }
                     
                     // Scale Vector Styles (Borders/Radius)
                     // Clone style to avoid shared reference issues
                     if (el.style) {
                        const newStyle = { ...el.style };
                        let styleChanged = false;
                        
                        if (newStyle.borderRadius > 0) {
                            newStyle.borderRadius *= avgScale;
                            styleChanged = true;
                        }
                        if (newStyle.borderWidth > 0) {
                            newStyle.borderWidth *= avgScale;
                            styleChanged = true;
                        }
                        
                        if (styleChanged) {
                            updatedEl.style = newStyle;
                        }
                     }
                     
                     // Scale Extrusion
                     if (el.textExtrusion && el.textExtrusion > 0) {
                         updatedEl.textExtrusion = el.textExtrusion * avgScale;
                     }

                     return updatedEl;
                 }
                 return el;
             });

          } else if (posChanged) {
             // --- TRANSLATION PROPAGATION ---
             const dx = newX - oldX;
             const dy = newY - oldY;
             const descendants = getDescendantIds(prev.elements, id);
             
             newElements = newElements.map(el => {
                 if (descendants.includes(el.id)) {
                     return { ...el, x: el.x + dx, y: el.y + dy };
                 }
                 return el;
             });
          }
      }

      // Finally apply updates to the target element itself
      newElements = newElements.map(el => {
        if (el.id !== id) return el;
        if ('style' in updates) {
           // @ts-ignore
           return { ...el, ...updates, style: { ...el.style, ...updates.style } };
        }
        return { ...el, ...updates };
      });

      return { ...prev, elements: newElements };
    });
  }, [getDescendantIds, setState]);

  const handleSelect = useCallback((target: string | string[] | null, multi: boolean) => {
    setState(prev => {
      if (target === null) return { ...prev, selectedIds: [] };
      
      if (Array.isArray(target)) {
          if (multi) {
              const newSet = new Set(prev.selectedIds);
              target.forEach(id => newSet.add(id));
              return { ...prev, selectedIds: Array.from(newSet) };
          } else {
              return { ...prev, selectedIds: target };
          }
      }

      const id = target;
      if (multi) {
        return {
          ...prev,
          selectedIds: prev.selectedIds.includes(id) 
            ? prev.selectedIds.filter(sid => sid !== id)
            : [...prev.selectedIds, id]
        };
      }
      return { ...prev, selectedIds: [id] };
    });
  }, [setState]);

  const handleDelete = useCallback((targetId?: string) => {
    recordHistory();
    setState(prev => {
      const idsToDelete = targetId ? [targetId] : prev.selectedIds;
      
      let allIdsToDelete = [...idsToDelete];
      idsToDelete.forEach(id => {
          const el = prev.elements.find(e => e.id === id);
          if (el && el.type === 'folder') {
              allIdsToDelete = [...allIdsToDelete, ...getDescendantIds(prev.elements, id)];
          }
      });
      
      // Handle Unmasking if mask is deleted
      const remainingElements = prev.elements
        .filter(el => !allIdsToDelete.includes(el.id))
        .map(el => {
            if (el.maskId && allIdsToDelete.includes(el.maskId)) {
                return { ...el, maskId: null };
            }
            return el;
        });

      return {
        ...prev,
        elements: remainingElements,
        selectedIds: prev.selectedIds.filter(id => !allIdsToDelete.includes(id))
      };
    });
  }, [getDescendantIds, setState, recordHistory]);

  const handleReorderElements = useCallback((fromIndex: number, toIndex: number) => {
    recordHistory();
    setState(prev => {
      const newElements = [...prev.elements];
      const [item] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, item);
      return { ...prev, elements: newElements };
    });
  }, [setState, recordHistory]);

  const handleGroup = useCallback(() => {
    const selected = state.elements.filter(el => state.selectedIds.includes(el.id));
    if (selected.length === 0) return;
    
    recordHistory();

    const firstParent = selected[0].parentId;
    const allSameParent = selected.every(el => el.parentId === firstParent);
    const targetParent = allSameParent ? firstParent : null;

    const groupId = Date.now().toString();
    const groupElement: CanvasElement = {
        id: groupId,
        name: 'Group ' + (state.elements.filter(e => e.type === 'folder').length + 1),
        type: 'folder',
        x: 0, y: 0, width: 100, height: 100,
        rotation: 0, zIndex: 0,
        visible: true, locked: false,
        style: DEFAULT_STYLE,
        parentId: targetParent,
        collapsed: false,
        maskId: null
    };

    setState(prev => {
        const newElements = prev.elements.map(el => {
            if (prev.selectedIds.includes(el.id)) {
                return { ...el, parentId: groupId };
            }
            return el;
        });
        
        const indices = prev.selectedIds.map(id => prev.elements.findIndex(e => e.id === id));
        const insertIndex = Math.max(...indices);
        
        newElements.splice(insertIndex + 1, 0, groupElement);

        return {
            ...prev,
            elements: newElements,
            selectedIds: [groupId]
        };
    });
  }, [state.elements, state.selectedIds, setState, recordHistory]);

  // Handle Boolean Union (Clay Merge)
  const handleUnion = useCallback(() => {
      const selected = state.elements.filter(el => state.selectedIds.includes(el.id));
      if (selected.length < 1) return;
      
      // RESTRICTION: Do not allow text or icons in Union
      const hasRestrictedTypes = selected.some(el => ['text', 'icon', 'folder'].includes(el.type));
      if (hasRestrictedTypes) {
          alert("Union Merge is only available for basic shapes (Rectangle, Circle, Star, etc). Text and Icons are not supported.");
          return;
      }
      
      recordHistory();
      
      // Calculate Bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selected.forEach(el => {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
      });
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      const groupId = Date.now().toString();
      
      // Adopt style from the first element if possible
      const baseStyle = selected[0].style;

      const groupElement: CanvasElement = {
          id: groupId,
          name: 'Union Shape',
          type: 'folder',
          x: minX,
          y: minY,
          width: width,
          height: height,
          rotation: 0, 
          zIndex: 0,
          visible: true, 
          locked: false,
          style: { ...baseStyle, blur: Math.max(10, baseStyle.blur) }, 
          parentId: selected[0].parentId,
          collapsed: false,
          maskId: null,
          merge: true // Enable Boolean Merge
      };

      setState(prev => {
          const newElements = prev.elements.map(el => {
              if (prev.selectedIds.includes(el.id)) {
                  return { ...el, parentId: groupId };
              }
              return el;
          });
          
          const indices = prev.selectedIds.map(id => prev.elements.findIndex(e => e.id === id));
          const insertIndex = Math.max(...indices);
          
          newElements.splice(insertIndex + 1, 0, groupElement);
          
          return {
              ...prev,
              elements: newElements,
              selectedIds: [groupId]
          };
      });
  }, [state.elements, state.selectedIds, setState, recordHistory]);

  const handleUngroup = useCallback(() => {
    const selectedFolders = state.elements.filter(el => state.selectedIds.includes(el.id) && el.type === 'folder');
    if (selectedFolders.length === 0) return;
    
    recordHistory();

    setState(prev => {
        let newElements = [...prev.elements];
        const foldersToDelete: string[] = [];
        const childrenToSelect: string[] = [];

        selectedFolders.forEach(folder => {
            foldersToDelete.push(folder.id);
            newElements = newElements.map(el => {
                if (el.parentId === folder.id) {
                    childrenToSelect.push(el.id);
                    return { ...el, parentId: folder.parentId };
                }
                return el;
            });
        });

        return {
            ...prev,
            elements: newElements.filter(el => !foldersToDelete.includes(el.id)),
            selectedIds: childrenToSelect
        };
    });
  }, [state.elements, state.selectedIds, setState, recordHistory]);

  const handleMask = useCallback(() => {
      const { selectedIds, elements } = state;
      if (selectedIds.length !== 2) return;

      const selected = elements.filter(el => selectedIds.includes(el.id));
      const hasRestrictedTypes = selected.some(el => ['text', 'icon', 'folder'].includes(el.type));
      if (hasRestrictedTypes) {
         alert("Masking is not supported for Text/Icons.");
         return;
      }

      recordHistory();
      
      const el1 = elements.find(e => e.id === selectedIds[0]);
      const el2 = elements.find(e => e.id === selectedIds[1]);
      if (!el1 || !el2) return;

      const idx1 = elements.indexOf(el1);
      const idx2 = elements.indexOf(el2);

      const maskShape = idx1 < idx2 ? el1 : el2; // Bottom
      const content = idx1 < idx2 ? el2 : el1; // Top

      setState(prev => ({
          ...prev,
          elements: prev.elements.map(el => {
              if (el.id === content.id) {
                  return { ...el, maskId: maskShape.id };
              }
              if (el.id === maskShape.id) {
                  return { ...el, visible: false }; 
              }
              return el;
          }),
          selectedIds: [content.id]
      }));

  }, [state, setState, recordHistory]);

  const handleUnmask = useCallback(() => {
      const { selectedIds, elements } = state;
      if (selectedIds.length === 0) return;

      recordHistory();

      const idsToUnmask = selectedIds.filter(id => {
          const el = elements.find(e => e.id === id);
          return el && el.maskId;
      });

      if (idsToUnmask.length === 0) return;

      setState(prev => ({
          ...prev,
          elements: prev.elements.map(el => {
              if (idsToUnmask.includes(el.id)) {
                  return { ...el, maskId: null };
              }
              const wasMaskFor = idsToUnmask.find(targetId => {
                 const target = prev.elements.find(t => t.id === targetId);
                 return target?.maskId === el.id;
              });

              if (wasMaskFor) {
                  return { ...el, visible: true };
              }
              return el;
          })
      }));

  }, [state, setState, recordHistory]);

  const handleCopy = useCallback(() => {
    const selected = state.elements.filter(el => state.selectedIds.includes(el.id));
    if (selected.length > 0) {
      setClipboard(selected);
    }
  }, [state.elements, state.selectedIds, setClipboard]);

  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return;
    recordHistory();
    
    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    clipboard.forEach((item, i) => {
      const id = Date.now().toString() + i;
      newElements.push({
        ...item,
        id,
        x: item.x + 20,
        y: item.y + 20,
        name: item.name + ' Copy',
        parentId: null, 
        zIndex: state.elements.length + i,
        maskId: null 
      });
      newIds.push(id);
    });

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, ...newElements],
      selectedIds: newIds
    }));
  }, [clipboard, state.elements.length, setState, recordHistory]);

  const handleDuplicate = useCallback(() => {
    const selected = state.elements.filter(el => state.selectedIds.includes(el.id));
    if (selected.length === 0) return;
    recordHistory();

    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    selected.forEach((item, i) => {
      const id = Date.now().toString() + i;
      newElements.push({
        ...item,
        id,
        x: item.x + 20,
        y: item.y + 20,
        name: item.name + ' Copy',
        parentId: item.parentId,
        zIndex: state.elements.length + i,
        maskId: null 
      });
      newIds.push(id);
    });

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, ...newElements],
      selectedIds: newIds
    }));
  }, [state.elements, state.selectedIds, setState, recordHistory]);

  const handleNudge = useCallback((dx: number, dy: number) => {
    recordHistory();
    setState(prev => {
        const idsToMove = new Set<string>();
        const isSelected = (id: string | null | undefined) => id && prev.selectedIds.includes(id);
        const selectionRoots = prev.elements.filter(el => 
            isSelected(el.id) && !isSelected(el.parentId)
        );

        selectionRoots.forEach(root => {
            idsToMove.add(root.id);
            if (root.type === 'folder') {
                const descendants = getDescendantIds(prev.elements, root.id);
                descendants.forEach(d => idsToMove.add(d));
            }
        });

        return {
            ...prev,
            elements: prev.elements.map(el => {
                if (idsToMove.has(el.id)) {
                    return { ...el, x: el.x + dx, y: el.y + dy };
                }
                return el;
            })
        };
    });
  }, [getDescendantIds, setState, recordHistory]);

  const handleArrangement = useCallback((action: 'forward' | 'backward' | 'front' | 'back') => {
    recordHistory();
    setState(prev => {
      if (prev.selectedIds.length === 0) return prev;
      
      const elements = [...prev.elements];
      const selectedId = prev.selectedIds[0]; 
      const index = elements.findIndex(el => el.id === selectedId);
      if (index === -1) return prev;

      if (action === 'backward' && index > 0) {
        [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
      } else if (action === 'forward' && index < elements.length - 1) {
        [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
      } else if (action === 'back') {
        const [item] = elements.splice(index, 1);
        elements.unshift(item);
      } else if (action === 'front') {
        const [item] = elements.splice(index, 1);
        elements.push(item);
      }

      return { ...prev, elements };
    });
  }, [setState, recordHistory]);

  const handleIconSelect = useCallback((iconName: string, iconLib: IconLibrary) => {
    const selectedId = state.selectedIds[0];
    const selectedEl = state.elements.find(el => el.id === selectedId);

    if (selectedEl && selectedEl.type === 'icon') {
      recordHistory();
      handleUpdateElement(selectedId, { iconName, iconLib, name: iconName });
      setState(prev => ({ ...prev, isIconPickerOpen: false }));
    } else {
      recordHistory();
      
      setState(prev => {
         const id = Date.now().toString();
         const size = 200;
         const randomOffset = Math.floor(Math.random() * 20) - 10;
         const centerX = state.canvasSize.width / 2 - size / 2 + randomOffset;
         const centerY = state.canvasSize.height / 2 - size / 2 + randomOffset;

         const newElement: CanvasElement = {
            id,
            name: iconName,
            type: 'icon',
            x: centerX,
            y: centerY,
            width: size,
            height: size,
            rotation: 0,
            zIndex: prev.elements.length,
            visible: true,
            locked: false,
            style: { 
                ...DEFAULT_STYLE, 
                depth: 0, 
                blur: 0, 
                intensity: 0, 
                surfaceIntensity: 0,
                bevel: 0, 
                bevelIntensity: 0, 
                gloss: 0, 
                noise: 0, 
                borderWidth: 0, 
                gradient: false, 
                lighting: false,
                shadowEnabled: false,
                color: '#FFFFFF' 
            },
            collapsed: false,
            parentId: null,
            maskId: null,
            iconName: iconName,
            iconLib: iconLib,
            textStrokeWidth: 2
         };
         
         return {
            ...prev,
            elements: [...prev.elements, newElement],
            selectedIds: [id],
            isIconPickerOpen: false
         };
      });
    }
  }, [state.selectedIds, state.elements, state.canvasSize, handleUpdateElement, setState, recordHistory]);

  return {
    handleUpdateState,
    handleAddElement,
    handleUpdateElement,
    handleSelect,
    handleDelete,
    handleReorderElements,
    handleGroup,
    handleUnion, // Exported
    handleUngroup,
    handleMask,
    handleUnmask,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleNudge,
    handleArrangement,
    handleIconSelect
  };
};