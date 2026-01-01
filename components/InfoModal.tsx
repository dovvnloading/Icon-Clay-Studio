
import React, { useState } from 'react';
import { X, MousePointer2, Layers, Sliders, Share2, Github, Globe, Twitter, Heart, Keyboard, Zap, Droplet, Sun, Box, BookOpen, ToggleLeft, Scale, ShieldAlert } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'start' | 'engine' | 'materials' | 'shortcuts' | 'about';

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('start');

  if (!isOpen) return null;

  const SidebarItem = ({ id, icon: Icon, label }: { id: TabId; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
          : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200 border border-transparent'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#1e1e1e] w-[900px] h-[85vh] rounded-2xl border border-[#333] shadow-2xl flex overflow-hidden ring-1 ring-white/10" 
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col p-4 shrink-0">
          <div className="mb-8 px-2 pt-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
               {/* Brand Logo Small */}
               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.4),inset_-2px_-2px_6px_rgba(0,0,0,0.2),0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-center text-white shrink-0 border border-white/10">
                  <Box size={16} className="text-white drop-shadow-sm" strokeWidth={2.5} />
               </div>
               IconClay
            </h2>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-semibold ml-11">Documentation</p>
          </div>
          
          <nav className="space-y-1 flex-1">
            <SidebarItem id="start" icon={BookOpen} label="Getting Started" />
            <SidebarItem id="engine" icon={Box} label="The Clay Engine" />
            <SidebarItem id="materials" icon={Droplet} label="Material Science" />
            <SidebarItem id="shortcuts" icon={Keyboard} label="Shortcuts" />
          </nav>

          <div className="mt-auto pt-4 border-t border-[#333]">
             <SidebarItem id="about" icon={Heart} label="About & Credits" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
           {/* Header */}
           <div className="h-16 border-b border-[#333] flex items-center justify-between px-8 shrink-0 bg-[#1e1e1e]">
              <h2 className="text-lg font-semibold text-white">
                {activeTab === 'start' && 'Getting Started'}
                {activeTab === 'engine' && 'Understanding the Physics'}
                {activeTab === 'materials' && 'Materials & Textures'}
                {activeTab === 'shortcuts' && 'Keyboard Shortcuts'}
                {activeTab === 'about' && 'About the Project'}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              
              {/* === TAB: GETTING STARTED === */}
              {activeTab === 'start' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 text-lg leading-relaxed">
                        IconClay Studio is a specialized vector-based tool designed for creating 
                        <strong> high-fidelity neumorphic and claymorphic assets</strong>. 
                        Unlike standard design tools, it separates internal volume ("Lighting") from external atmosphere ("Shadow") 
                        to create tactile, touchable objects.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-[#252525] p-5 rounded-xl border border-[#333]">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="p-2 bg-blue-500/10 rounded text-blue-400"><MousePointer2 size={18}/></div>
                             <h3 className="font-semibold text-white">1. Create & Select</h3>
                          </div>
                          <p className="text-sm text-gray-400">Add shapes from the toolbar. Click to select. Drag to move. Hold <span className="text-white">Ctrl</span> to multi-select or drag-copy.</p>
                       </div>
                       <div className="bg-[#252525] p-5 rounded-xl border border-[#333]">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="p-2 bg-purple-500/10 rounded text-purple-400"><Sliders size={18}/></div>
                             <h3 className="font-semibold text-white">2. Sculpt</h3>
                          </div>
                          <p className="text-sm text-gray-400">Use the property panel to adjust Depth and Blur. This isn't just CSS shadows; it's a simulated 3D surface.</p>
                       </div>
                       <div className="bg-[#252525] p-5 rounded-xl border border-[#333]">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="p-2 bg-orange-500/10 rounded text-orange-400"><Layers size={18}/></div>
                             <h3 className="font-semibold text-white">3. Compose</h3>
                          </div>
                          <p className="text-sm text-gray-400">Group items (Ctrl+G) to organize. Use "Clipping" mechanics by nesting shapes inside folders.</p>
                       </div>
                       <div className="bg-[#252525] p-5 rounded-xl border border-[#333]">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="p-2 bg-green-500/10 rounded text-green-400"><Share2 size={18}/></div>
                             <h3 className="font-semibold text-white">4. Export</h3>
                          </div>
                          <p className="text-sm text-gray-400">Export as 2048px PNGs or Windows ICO files. The output retains all semi-transparency and alpha channels.</p>
                       </div>
                    </div>
                </div>
              )}

              {/* === TAB: ENGINE === */}
              {activeTab === 'engine' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
                       <Zap className="text-blue-400 shrink-0 mt-1" size={20} />
                       <div>
                          <h4 className="text-blue-200 font-medium text-sm">The "Clay" Philosophy</h4>
                          <p className="text-blue-300/70 text-sm mt-1">
                             Most design tools treat shadows as a single entity. IconClay decouples <strong>Volume (Internal)</strong> from <strong>Shadow (External)</strong>. This allows you to create objects that feel "plump" or "hollow" independent of their casting shadow.
                          </p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       {/* Concept 1 */}
                       <div className="space-y-3">
                          <h3 className="text-white font-semibold flex items-center gap-2">
                             <ToggleLeft size={18} className="text-gray-400" />
                             Convex vs. Concave
                          </h3>
                          <div className="bg-[#111] rounded-lg p-6 border border-[#333] flex justify-around items-center h-32">
                             <div className="w-16 h-16 rounded-full bg-[#333] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.5),inset_4px_4px_10px_rgba(255,255,255,0.1)] flex items-center justify-center text-[10px] text-gray-500">Concave</div>
                             <div className="w-16 h-16 rounded-full bg-[#333] shadow-[inset_4px_4px_10px_rgba(255,255,255,0.1),inset_-4px_-4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-[10px] text-gray-500 font-bold text-white">Convex</div>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                             <strong>Convex</strong> pushes the object "out" towards the user. <strong>Concave</strong> presses it "in" to the background. This flips the internal highlight and shadow calculations relative to the global light source.
                          </p>
                       </div>

                       {/* Concept 2 */}
                       <div className="space-y-3">
                          <h3 className="text-white font-semibold flex items-center gap-2">
                             <Sun size={18} className="text-yellow-500" />
                             Lighting & Depth
                          </h3>
                          <div className="bg-[#111] rounded-lg p-6 border border-[#333] flex justify-around items-center h-32 relative overflow-hidden">
                             <div className="absolute top-2 right-2 text-yellow-500 opacity-20"><Sun size={40}/></div>
                             <div className="w-16 h-16 rounded-2xl bg-[#333] shadow-[6px_6px_12px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05)] border border-[#444]"></div>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                             <strong>Depth</strong> controls the "thickness" of the object. Higher depth separates the highlight and shadow further apart. <strong>Surface Intensity</strong> controls the contrast of these internal shadows.
                          </p>
                       </div>
                    </div>
                    
                    <div className="border-t border-[#333] pt-6">
                       <h3 className="text-white font-semibold mb-4">Parameter Reference</h3>
                       <div className="space-y-4">
                          <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                             <span className="text-blue-400 font-mono">Blur</span>
                             <span className="text-gray-400">Controls the softness of the material. Low blur = Hard Plastic. High blur = Soft Clay/Rubber.</span>
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                             <span className="text-blue-400 font-mono">Bevel</span>
                             <span className="text-gray-400">Adds a distinct "lip" or edge highlight. Essential for "Hard Clay" or ceramic looks.</span>
                          </div>
                           <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                             <span className="text-blue-400 font-mono">Extrusion</span>
                             <span className="text-gray-400">Specific to Text/Icons. It physically thickens the stroke before applying lighting, making thin icons chunky.</span>
                          </div>
                       </div>
                    </div>
                </div>
              )}

              {/* === TAB: MATERIALS === */}
              {activeTab === 'materials' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-white font-medium">Specular / Gloss</h3>
                            <div className="bg-[#252525] p-6 rounded-xl border border-[#333] flex justify-center gap-8">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 rounded-full bg-gray-700 shadow-[inset_4px_4px_15px_rgba(255,255,255,0.1)]"></div>
                                    <span className="text-xs text-gray-500">Matte (0%)</span>
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 rounded-full bg-gray-700 shadow-[inset_4px_4px_6px_rgba(255,255,255,0.9)]"></div>
                                    <span className="text-xs text-gray-500">Glossy (100%)</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">Controls the "shininess" hotspot. Combine with <strong>Specular Blur</strong> to diffuse the reflection.</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-white font-medium">Noise & Texture</h3>
                            <div className="bg-[#252525] p-6 rounded-xl border border-[#333] flex justify-center gap-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                                <div className="w-16 h-16 rounded-full bg-gray-700 border border-white/10 z-10"></div>
                            </div>
                            <p className="text-xs text-gray-400">Adds grain to the surface. Essential for "Paper" or "Frosted" textures to remove the digital vector look.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-white font-medium border-b border-[#333] pb-2">Blend Modes</h3>
                        <p className="text-sm text-gray-400">
                           Layers support standard blend modes. This is powerful for creating complex materials:
                        </p>
                        <ul className="grid grid-cols-2 gap-3">
                           <li className="bg-[#1a1a1a] p-3 rounded border border-[#333]">
                              <span className="text-yellow-400 font-mono text-xs block mb-1">Overlay</span>
                              <span className="text-gray-500 text-xs">Great for adding lighting highlights on top of colored bases without washing them out.</span>
                           </li>
                           <li className="bg-[#1a1a1a] p-3 rounded border border-[#333]">
                              <span className="text-yellow-400 font-mono text-xs block mb-1">Multiply</span>
                              <span className="text-gray-500 text-xs">Use for deepening shadows or creating tinted glass effects.</span>
                           </li>
                        </ul>
                    </div>
                </div>
              )}

              {/* === TAB: SHORTCUTS === */}
              {activeTab === 'shortcuts' && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                       {/* Section */}
                       <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Creation</h3>
                          <div className="space-y-2">
                             {[
                               { k: 'R', d: 'Rectangle' },
                               { k: 'O', d: 'Circle' },
                               { k: 'T', d: 'Text' },
                               { k: 'U', d: 'Rounded Rect' },
                             ].map(s => (
                                <div key={s.k} className="flex items-center justify-between group">
                                   <span className="text-gray-300 text-sm group-hover:text-white">{s.d}</span>
                                   <kbd className="bg-[#2a2a2a] border border-[#333] px-2 py-1 rounded text-xs font-mono text-gray-400 min-w-[24px] text-center shadow-[0_2px_0_#1a1a1a] group-hover:border-blue-500/50 group-hover:text-blue-400">{s.k}</kbd>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Section */}
                       <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Manipulation</h3>
                          <div className="space-y-2">
                             {[
                               { k: 'Ctrl + C', d: 'Copy' },
                               { k: 'Ctrl + V', d: 'Paste' },
                               { k: 'Ctrl + D', d: 'Duplicate' },
                               { k: 'Del', d: 'Delete' },
                               { k: 'Ctrl + G', d: 'Group' },
                               { k: 'Shift + G', d: 'Ungroup' },
                             ].map(s => (
                                <div key={s.k} className="flex items-center justify-between group">
                                   <span className="text-gray-300 text-sm group-hover:text-white">{s.d}</span>
                                   <kbd className="bg-[#2a2a2a] border border-[#333] px-2 py-1 rounded text-xs font-mono text-gray-400 min-w-[24px] text-center shadow-[0_2px_0_#1a1a1a] group-hover:border-blue-500/50 group-hover:text-blue-400">{s.k}</kbd>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Section */}
                       <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Arrangement</h3>
                          <div className="space-y-2">
                             {[
                               { k: ']', d: 'Bring Forward' },
                               { k: '[', d: 'Send Backward' },
                               { k: 'Shift + ]', d: 'Bring to Front' },
                               { k: 'Shift + [', d: 'Send to Back' },
                             ].map(s => (
                                <div key={s.k} className="flex items-center justify-between group">
                                   <span className="text-gray-300 text-sm group-hover:text-white">{s.d}</span>
                                   <kbd className="bg-[#2a2a2a] border border-[#333] px-2 py-1 rounded text-xs font-mono text-gray-400 min-w-[24px] text-center shadow-[0_2px_0_#1a1a1a] group-hover:border-blue-500/50 group-hover:text-blue-400">{s.k}</kbd>
                                </div>
                             ))}
                          </div>
                       </div>

                        {/* Section */}
                       <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">View</h3>
                          <div className="space-y-2">
                             {[
                               { k: 'Ctrl + Scroll', d: 'Zoom' },
                               { k: 'Ctrl + 0', d: 'Reset Zoom' },
                               { k: "'", d: 'Toggle Grid' },
                               { k: "Arrows", d: 'Nudge (1px)' },
                               { k: "Shift + Arr", d: 'Nudge (10px)' },
                             ].map(s => (
                                <div key={s.k} className="flex items-center justify-between group">
                                   <span className="text-gray-300 text-sm group-hover:text-white">{s.d}</span>
                                   <kbd className="bg-[#2a2a2a] border border-[#333] px-2 py-1 rounded text-xs font-mono text-gray-400 min-w-[24px] text-center shadow-[0_2px_0_#1a1a1a] group-hover:border-blue-500/50 group-hover:text-blue-400">{s.k}</kbd>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                </div>
              )}

              {/* === TAB: ABOUT === */}
              {activeTab === 'about' && (
                <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300">
                    {/* Brand Logo Large */}
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[inset_5px_5px_20px_rgba(255,255,255,0.3),inset_-5px_-5px_20px_rgba(0,0,0,0.2),0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:scale-105 transition-transform duration-500 ease-out border border-white/5">
                        {/* Highlights */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/30 blur-2xl rounded-full pointer-events-none" />
                        {/* 3D Box Icon */}
                        <div className="relative z-10 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                            <Box size={64} strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">IconClay Studio</h2>
                    <p className="text-gray-500 mb-8">v1.0.0 • Production Build</p>
                    
                    <div className="flex gap-4">
                       <a href="https://github.com/dovvnloading" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-[#252525] hover:bg-[#333] rounded-full border border-[#333] text-gray-300 hover:text-white transition-all">
                          <Github size={18} />
                          <span>GitHub</span>
                       </a>
                       <a href="https://x.com/D3VAUX" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-[#252525] hover:bg-[#333] rounded-full border border-[#333] text-gray-300 hover:text-white transition-all">
                          <Twitter size={18} />
                          <span>Follow</span>
                       </a>
                       <a href="https://dovvnloading.github.io" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-[#252525] hover:bg-[#333] rounded-full border border-[#333] text-gray-300 hover:text-white transition-all">
                          <Globe size={18} />
                          <span>Website</span>
                       </a>
                    </div>

                    <p className="mt-8 mb-8 text-xs text-gray-600 max-w-sm text-center">
                        Designed & Developed by Matthew Robert Wesney.
                        <br/>Built with React, SVG Filters, and TailwindCSS.
                    </p>

                    <div className="w-full max-w-md bg-[#151515] border border-[#2a2a2a] rounded-xl p-5 relative overflow-hidden group hover:border-red-900/30 transition-colors">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>

                        <div className="flex items-center gap-2 mb-3">
                             <ShieldAlert size={14} className="text-gray-500" />
                             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">License & Proprietary Usage Restrictions</h3>
                        </div>

                        <p className="text-[10px] leading-relaxed text-gray-500 text-justify">
                            This software is provided for personal utility and design purposes only.
                            <span className="text-gray-400 font-medium"> The source code, interface design (UI/UX), and underlying mechanics are proprietary.</span>
                            Under no circumstances is this application to be:
                        </p>

                        <ul className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 text-[10px] text-gray-500">
                             <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/60 rounded-full"></div>
                                Redistributed or Renamed
                             </li>
                             <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/60 rounded-full"></div>
                                Monetized or Resold
                             </li>
                             <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/60 rounded-full"></div>
                                Mirrored / Hosted Elsewhere
                             </li>
                             <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-500/60 rounded-full"></div>
                                UI/UX Assets Extracted
                             </li>
                        </ul>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#222]">
                            <Scale size={12} className="text-gray-600" />
                            <p className="text-[9px] text-gray-600 italic">
                                Strictly prohibited from unauthorized copying, repository cloning for modification, or commercial integration. Usage is strictly limited to the intended end-user design utility functions.
                            </p>
                        </div>
                    </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
