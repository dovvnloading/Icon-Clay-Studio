
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactElement<any>;
  title: string;
  description?: string;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  width?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  title, 
  description, 
  shortcut, 
  side = 'bottom',
  delay = 300,
  width = 220
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [actualSide, setActualSide] = useState(side);
  const triggerRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  // Smart Positioning Logic
  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { width, height: 100 };
    
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let resolvedSide = side;

    // Calculate initial position based on preferred side
    const calculate = (s: string) => {
      switch (s) {
        case 'top':
          return {
            top: triggerRect.top - tooltipRect.height - gap,
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          };
        case 'bottom':
          return {
            top: triggerRect.bottom + gap,
            left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
          };
        case 'left':
          return {
            top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
            left: triggerRect.left - tooltipRect.width - gap
          };
        case 'right':
          return {
            top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
            left: triggerRect.right + gap
          };
        default:
          return { top: 0, left: 0 };
      }
    };

    let pos = calculate(side);

    // Collision Detection & Flipping
    if (side === 'bottom' && pos.top + tooltipRect.height > viewportHeight) {
      resolvedSide = 'top';
      pos = calculate('top');
    } else if (side === 'top' && pos.top < 0) {
      resolvedSide = 'bottom';
      pos = calculate('bottom');
    } else if (side === 'right' && pos.left + tooltipRect.width > viewportWidth) {
      resolvedSide = 'left';
      pos = calculate('left');
    } else if (side === 'left' && pos.left < 0) {
      resolvedSide = 'right';
      pos = calculate('right');
    }

    // Edge clamping (keep inside X axis)
    if (pos.left < 10) pos.left = 10;
    if (pos.left + tooltipRect.width > viewportWidth - 10) {
      pos.left = viewportWidth - tooltipRect.width - 10;
    }

    setCoords({ top: pos.top + window.scrollY, left: pos.left + window.scrollX });
    setActualSide(resolvedSide);

  }, [isVisible, side, width]);

  return (
    <>
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onMouseDown: handleMouseLeave,
        onFocus: handleMouseEnter,
        onBlur: handleMouseLeave
      })}
      
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none perspective-1000"
          style={{ 
            top: coords.top, 
            left: coords.left,
            width: width
          }}
        >
          <div className={`
            relative bg-[#18181b]/95 backdrop-blur-md border border-[#27272a] 
            text-gray-200 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.5)] 
            p-3 text-left animate-in fade-in zoom-in-95 duration-200
            ${actualSide === 'bottom' ? 'origin-top' : ''}
            ${actualSide === 'top' ? 'origin-bottom' : ''}
            ${actualSide === 'left' ? 'origin-right' : ''}
            ${actualSide === 'right' ? 'origin-left' : ''}
          `}>
            
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="font-semibold text-xs text-white tracking-wide">{title}</span>
              {shortcut && (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-[#27272a] border border-[#3f3f46] rounded text-[9px] font-mono text-gray-400 shadow-sm">
                  {shortcut}
                </kbd>
              )}
            </div>

            {/* Description Body */}
            {description && (
              <p className="text-[10px] leading-relaxed text-gray-400 font-medium">
                {description}
              </p>
            )}

            {/* Decorative Arrow */}
            <div className={`
              absolute w-2 h-2 bg-[#18181b] border border-[#27272a] rotate-45
              ${actualSide === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0' : ''}
              ${actualSide === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0' : ''}
              ${actualSide === 'right' ? '-left-1 top-1/2 -translate-y-1/2 border-t-0 border-r-0' : ''}
              ${actualSide === 'left' ? '-right-1 top-1/2 -translate-y-1/2 border-b-0 border-l-0' : ''}
            `} />
            
            {/* Gloss Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
