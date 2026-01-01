import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';

export interface MenuItem {
  id?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let newTop = y;
    let newLeft = x;

    // Smart positioning: Flip X if too close to right edge
    if (x + rect.width > viewportW - 10) {
      newLeft = x - rect.width;
    }

    // Smart positioning: Flip Y if too close to bottom edge
    if (y + rect.height > viewportH - 10) {
      newTop = y - rect.height;
    }

    setPosition({ top: newTop, left: newLeft });
    setIsVisible(true);
  }, [x, y]);

  return createPortal(
    <div 
        className="fixed inset-0 z-[9999]" 
        onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        onContextMenu={(e) => {
            e.preventDefault();
            onClose();
        }}
    >
      <div
        ref={menuRef}
        className={`fixed min-w-[220px] w-auto bg-[#1e1e1e]/95 backdrop-blur-xl border border-[#333]/80 rounded-xl shadow-2xl py-1.5 flex flex-col gap-0.5 overflow-hidden ring-1 ring-black/50 transition-opacity duration-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: position.top, left: position.left }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {(items || []).map((item, i) => {
          if (item.separator) {
            return <div key={i} className="h-px bg-[#333] my-1 mx-2" />;
          }
          
          if (!item.label) return null;

          // @ts-ignore - Dynamic icon loading
          const IconComp = item.icon ? LucideIcons[item.icon] : null;

          return (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`
                group mx-1 px-3 py-1.5 rounded flex items-center gap-3 text-[13px] outline-none select-none transition-colors
                ${item.disabled ? 'opacity-40 cursor-not-allowed' : 
                   item.danger ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300' : 
                   'hover:bg-blue-600 text-gray-200 hover:text-white'}
              `}
            >
              <span className={`w-4 h-4 flex items-center justify-center ${item.disabled ? 'opacity-50' : (item.danger ? 'text-red-400' : 'text-gray-400 group-hover:text-white')}`}>
                {IconComp && <IconComp size={14} strokeWidth={2} />}
              </span>
              <span className="flex-1 text-left tracking-wide font-medium">{item.label}</span>
              {item.shortcut && (
                <span className={`text-[10px] ml-4 font-sans tracking-wider ${item.disabled ? 'opacity-50' : 'text-gray-500 group-hover:text-blue-100'}`}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};