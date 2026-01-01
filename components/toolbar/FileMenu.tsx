
import React, { useRef } from 'react';
import { FilePlus, FolderOpen, Save } from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { AppState } from '../../types';

interface FileMenuProps {
  state: AppState;
  onNewProject: () => void;
  onUpdate: (updates: Partial<AppState>) => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({ state, onNewProject, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProject = () => {
    const projectData = {
      version: "1.0.0",
      timestamp: Date.now(),
      canvasSize: state.canvasSize,
      backgroundColor: state.backgroundColor,
      transparentBackground: state.transparentBackground,
      elements: state.elements,
      gridSize: state.gridSize,
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iconclay-project-${Date.now()}.clay`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result);
          
          if (data.elements && Array.isArray(data.elements)) {
            onUpdate({
              elements: data.elements,
              canvasSize: data.canvasSize || state.canvasSize,
              backgroundColor: data.backgroundColor || state.backgroundColor,
              transparentBackground: data.transparentBackground ?? state.transparentBackground,
              gridSize: data.gridSize || state.gridSize,
              showGrid: data.showGrid ?? state.showGrid,
              snapToGrid: data.snapToGrid ?? state.snapToGrid,
              selectedIds: [] 
            });
          } else {
            alert("Invalid project file: Missing elements data.");
          }
        }
      } catch (err) {
        console.error("Error loading project:", err);
        alert("Failed to load project file. It may be corrupted.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewRequest = () => {
    if (window.confirm("Start a new project? This will clear your current workspace.")) {
      onNewProject();
    }
  };

  return (
    <div className="flex items-center gap-1 mr-4">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleLoadProject}
        className="hidden"
        accept=".clay,.json"
      />

      <ToolbarButton 
        icon={FilePlus} 
        title="New Project" 
        description="Start a fresh workspace." 
        shortcut="Alt+N" 
        onClick={handleNewRequest} 
      />

      <ToolbarButton 
        icon={FolderOpen} 
        title="Open Project" 
        description="Load a previously saved .clay project file." 
        shortcut="Ctrl+O" 
        onClick={() => fileInputRef.current?.click()} 
      />

      <ToolbarButton 
        icon={Save} 
        title="Save Project" 
        description="Save your current workspace as a .clay file." 
        shortcut="Ctrl+S" 
        onClick={handleSaveProject} 
      />
    </div>
  );
};
