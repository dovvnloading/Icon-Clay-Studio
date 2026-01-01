import { useState, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppState } from '../types';
import { SvgClayRenderer } from '../components/SvgClayRenderer';
import React from 'react';

export interface ExportOptions {
  format: 'png' | 'ico' | 'svg';
  size?: number; // Target size (e.g. 1024)
  pixelRatio?: number; // Multiplier (e.g. 2x)
  transparent?: boolean;
}

export const useExport = (state: AppState) => {
  const [isExporting, setIsExporting] = useState(false);

  // --- SVG GENERATOR ---
  // Reconstructs the React/HTML canvas as a pure SVG string
  const generateSvg = useCallback(() => {
    const { elements, canvasSize, backgroundColor, transparentBackground } = state;

    // We sort elements by zIndex/order (same as render loop)
    const sortedElements = [...elements].sort((a, b) => elements.indexOf(a) - elements.indexOf(b));

    // Create the Virtual SVG Tree
    // Since this file is .ts, we cannot use JSX. We must use React.createElement.
    const children: React.ReactNode[] = [];

    // 1. Background
    if (!transparentBackground) {
        children.push(React.createElement('rect', {
            key: 'background',
            width: '100%',
            height: '100%',
            fill: backgroundColor
        }));
    }

    // 2. Elements
    sortedElements.forEach(el => {
        if (!el.visible) return;
        if (el.type === 'folder') return; // Folders are logical only in this flat rendering

        // Group container for positioning
        const group = React.createElement('g', {
            key: el.id,
            transform: `translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width / 2}, ${el.height / 2})`,
            style: { 
                mixBlendMode: el.style.blendMode as any, 
                opacity: el.style.opacity 
            }
        }, 
            // Nested SVG to handle local coordinate system of SvgClayRenderer
            React.createElement('svg', {
                width: el.width,
                height: el.height,
                viewBox: `0 0 ${el.width} ${el.height}`,
                overflow: 'visible'
            }, 
                // Group to handle Flip transform (Scale)
                // We use standard SVG flip technique: translate(w,0) scale(-1,1) for Horizontal
                // This keeps the element in the same bounding box relative to the rotation point
                React.createElement('g', {
                   transform: (() => {
                       let transform = '';
                       // Order: Translate Center -> Scale -> Translate Back
                       // Actually, simpler: Translate(Size) -> Scale
                       if (el.flipX && el.flipY) transform = `translate(${el.width}, ${el.height}) scale(-1, -1)`;
                       else if (el.flipX) transform = `translate(${el.width}, 0) scale(-1, 1)`;
                       else if (el.flipY) transform = `translate(0, ${el.height}) scale(1, -1)`;
                       return transform;
                   })()
                },
                    React.createElement(SvgClayRenderer, {
                        element: el,
                        idPrefix: 'export-'
                    })
                )
            )
        );

        children.push(group);
    });

    const svgRoot = React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: canvasSize.width,
        height: canvasSize.height,
        viewBox: `0 0 ${canvasSize.width} ${canvasSize.height}`
    }, ...children);

    return renderToStaticMarkup(svgRoot);
  }, [state]);

  const handleExport = useCallback(async (options: ExportOptions) => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // 1. SVG EXPORT
      if (options.format === 'svg') {
        const svgString = generateSvg();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        triggerDownload(blob, 'svg');
        setIsExporting(false);
        return;
      }

      // 2. RASTER EXPORT (PNG/ICO)
      const node = document.getElementById('icon-clay-export-root');
      if (!node) throw new Error("Canvas root not found");

      await document.fonts.ready;

      // Calculate Scaling
      let pixelRatio = 1;
      if (options.size) {
        // If target size is 1024 and canvas is 512, ratio is 2
        pixelRatio = options.size / state.canvasSize.width;
      } else if (options.pixelRatio) {
        pixelRatio = options.pixelRatio;
      }

      // Hide Grid/Selection for capture if it's visible
      // Note: The html-to-image filter below handles selection-ui, 
      // but the grid background is a separate div we might want to ensure is handled.
      // Current Canvas implementation: Grid is distinct from export-root. Good.

      const blob = await htmlToImage.toBlob(node, {
        width: state.canvasSize.width,
        height: state.canvasSize.height,
        pixelRatio: pixelRatio,
        cacheBust: true,
        skipAutoScale: true,
        filter: (child) => {
          if (child.classList && child.classList.contains('selection-ui')) return false;
          return true;
        },
        backgroundColor: options.transparent ? undefined : state.backgroundColor,
      });

      if (!blob) throw new Error("Failed to generate image blob");

      if (options.format === 'ico') {
        const { pngToIco } = await import('../utils/icoEncoder');
        const icoBlob = await pngToIco(blob);
        triggerDownload(icoBlob, 'ico');
      } else {
        triggerDownload(blob, 'png');
      }

    } catch (error) {
      console.error('Export failed:', error);
      alert("Export failed. Please check console.");
    } finally {
      setIsExporting(false);
    }
  }, [state, isExporting, generateSvg]);

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `icon-clay-export.${ext}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { isExporting, handleExport };
};