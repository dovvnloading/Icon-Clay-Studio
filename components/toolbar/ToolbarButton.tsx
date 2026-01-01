import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface ToolbarButtonProps {
  icon: LucideIcon | React.ElementType;
  onClick: () => void;
  title: string;
  description: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'danger';
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  onClick,
  title,
  description,
  shortcut,
  isActive = false,
  disabled = false,
  className = '',
  variant = 'default'
}) => {
  const baseClasses = "p-2 rounded transition-colors";
  
  let colorClasses = "text-gray-400 hover:text-white hover:bg-[#333]";
  if (isActive) {
    colorClasses = "bg-[#333] text-blue-400 shadow-sm";
  } else if (variant === 'danger') {
    colorClasses = "text-gray-400 hover:text-red-400 hover:bg-[#333]";
  } else if (disabled) {
    colorClasses = "text-gray-600 cursor-not-allowed opacity-50";
  }

  return (
    <Tooltip title={title} description={description} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${colorClasses} ${className}`}
      >
        <Icon size={18} />
      </button>
    </Tooltip>
  );
};