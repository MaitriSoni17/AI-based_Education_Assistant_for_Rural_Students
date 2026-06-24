import React, { useState } from 'react';
import { 
  GitBranch, ArrowRight, ArrowDown, Sparkles, BookOpen, 
  ChevronRight, Play, Volume2, Layers, CheckCircle2, Award
} from 'lucide-react';
import { speakText, stopSpeaking } from '../../utils/speech';

interface FlowchartNode {
  id: string;
  label: string;
  description: string;
}

interface FlowchartData {
  type: 'flowchart';
  title: string;
  nodes: FlowchartNode[];
}

interface MindmapBranch {
  label: string;
  description?: string;
  subBranches?: string[];
}

interface MindmapData {
  type: 'mindmap';
  title: string;
  root: {
    label: string;
    description?: string;
    branches: MindmapBranch[];
  };
}

type DiagramData = FlowchartData | MindmapData;

interface InteractiveDiagramProps {
  data: DiagramData;
  lang: 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'te';
}

export default function InteractiveDiagram({ data, lang }: InteractiveDiagramProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'list'>('visual');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    data.type === 'flowchart' && data.nodes.length > 0 ? data.nodes[0].id : null
  );
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(0);
  const [isPlayingText, setIsPlayingText] = useState<string | null>(null);

  // Read step or branch out loud
  const playExplanation = (text: string, identifier: string) => {
    if (isPlayingText === identifier) {
      stopSpeaking();
      setIsPlayingText(null);
      return;
    }
    setIsPlayingText(identifier);
    speakText(text, lang, 'Swami AI 🤖', '🤖 Swami AI', () => {
      setIsPlayingText(null);
    });
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setIsPlayingText(null);
  };

  if (!data) return null;

  return (
    <div className="my-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      {/* Title Header */}
      <div className="bg-[#3D405B] text-white p-3 px-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg text-[#F2CC8F]">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-[#F2CC8F] tracking-widest block">
              {data.type === 'flowchart' ? 'Interactive Flowchart' : 'Concept Mind Map'}
            </span>
            <h3 className="font-display font-extrabold text-xs sm:text-sm">{data.title}</h3>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-[#E07A5F] text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Visual Map
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#E07A5F] text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Details Table
          </button>
        </div>
      </div>

      {/* Render Visual Map */}
      {activeTab === 'visual' && (
        <div className="p-4 sm:p-6 overflow-x-auto">
          {data.type === 'flowchart' ? (
            /* FLOWCHART VISUAL */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-2">
                {data.nodes.map((node, index) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <React.Fragment key={node.id}>
                      {/* Step node card */}
                      <button
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`flex-1 text-left p-3.5 rounded-xl border transition-all relative cursor-pointer group active:scale-[0.98] ${
                          isSelected
                            ? 'bg-white border-[#E07A5F] ring-2 ring-[#E07A5F]/20 shadow-md translate-y-[-2px]'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-3xs'
                        }`}
                      >
                        {/* Step number badge */}
                        <span className={`absolute -top-2.5 -left-2 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-[#E07A5F] text-white border-transparent'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          Step {index + 1}
                        </span>

                        <h4 className={`text-xs font-bold font-sans mt-1 ${isSelected ? 'text-[#E07A5F]' : 'text-slate-800'}`}>
                          {node.label}
                        </h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                          {node.description}
                        </p>
                      </button>

                      {/* Connection arrow */}
                      {index < data.nodes.length - 1 && (
                        <div className="flex justify-center items-center py-1 md:py-0 shrink-0">
                          <ArrowRight className="h-4 w-4 text-slate-400 hidden md:block animate-pulse" />
                          <ArrowDown className="h-4 w-4 text-slate-400 md:hidden animate-pulse" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Node Detail Panel */}
              {selectedNodeId && (() => {
                const node = data.nodes.find(n => n.id === selectedNodeId);
                if (!node) return null;
                const speakId = `fc-node-${node.id}`;
                return (
                  <div className="bg-white border border-[#E07A5F]/20 rounded-xl p-4 shadow-3xs animate-fadeIn relative">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-2 w-2 bg-[#E07A5F] rounded-full" />
                          <span className="text-[10px] font-mono font-extrabold text-[#E07A5F] uppercase">Active Step Details</span>
                        </div>
                        <h4 className="font-display font-black text-slate-800 text-sm sm:text-base">{node.label}</h4>
                      </div>
                      <button
                        onClick={() => playExplanation(node.description, speakId)}
                        className={`p-2 rounded-full border transition-all ${
                          isPlayingText === speakId
                            ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                        title="Read this step aloud"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {node.description}
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* MINDMAP VISUAL */
            <div className="space-y-6">
              {/* Central Concept Node */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-[#3D405B] to-[#4D506F] text-white p-4 px-6 rounded-2xl border-2 border-[#F2CC8F]/40 shadow-md text-center max-w-sm relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F2CC8F] text-[#3D405B] font-mono font-black text-[8px] uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-white">
                    Main Subject
                  </div>
                  <h4 className="font-display font-extrabold text-xs sm:text-sm mt-1">{data.root.label}</h4>
                  {data.root.description && (
                    <p className="text-[10px] text-slate-200/90 mt-1 font-sans">{data.root.description}</p>
                  )}
                </div>
              </div>

              {/* Connector lines to branches - Represented as stylized cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.root.branches.map((branch, index) => {
                  const isActive = activeBranchIndex === index;
                  // Color cycle
                  const colors = [
                    { border: 'border-blue-200 hover:border-blue-400', bg: 'bg-blue-50/50', active: 'ring-2 ring-blue-500 border-blue-500 bg-white' },
                    { border: 'border-emerald-200 hover:border-emerald-400', bg: 'bg-emerald-50/50', active: 'ring-2 ring-emerald-500 border-emerald-500 bg-white' },
                    { border: 'border-amber-200 hover:border-amber-400', bg: 'bg-amber-50/50', active: 'ring-2 ring-amber-500 border-amber-500 bg-white' },
                    { border: 'border-purple-200 hover:border-purple-400', bg: 'bg-purple-50/50', active: 'ring-2 ring-purple-500 border-purple-500 bg-white' }
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <button
                      key={index}
                      onClick={() => setActiveBranchIndex(index)}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative group active:scale-[0.98] ${
                        isActive ? color.active : `bg-white ${color.border} shadow-3xs`
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Branch {index + 1}</span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isActive ? 'rotate-90 text-slate-600' : ''}`} />
                      </div>
                      <h5 className="font-sans font-extrabold text-xs text-slate-800 mt-1">{branch.label}</h5>
                      
                      {branch.description && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{branch.description}</p>
                      )}

                      {/* Sub-branches badge count */}
                      {branch.subBranches && branch.subBranches.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500 font-mono">
                            {branch.subBranches.length} Concepts
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Branch details & sub-concepts */}
              {activeBranchIndex !== null && (() => {
                const branch = data.root.branches[activeBranchIndex];
                if (!branch) return null;
                const speakId = `mm-branch-${activeBranchIndex}`;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs animate-fadeIn space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase block">Sub-Concept Explorer</span>
                        <h4 className="font-display font-black text-slate-800 text-sm sm:text-base">{branch.label}</h4>
                      </div>
                      <button
                        onClick={() => playExplanation(branch.description || branch.label, speakId)}
                        className={`p-2 rounded-full border transition-all ${
                          isPlayingText === speakId
                            ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                        title="Read aloud"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {branch.description && (
                      <p className="text-xs text-slate-600 font-sans leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        {branch.description}
                      </p>
                    )}

                    {/* Render visual sub-branch nodes */}
                    {branch.subBranches && branch.subBranches.length > 0 && (
                      <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Connected Sub-categories:</span>
                        <div className="flex flex-wrap gap-2">
                          {branch.subBranches.map((sub, sIdx) => (
                            <div 
                              key={sIdx} 
                              className="bg-slate-50 hover:bg-slate-100/85 border border-slate-200 rounded-lg p-2 px-3 text-xs text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-default shadow-3xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Render Table/Details List View */}
      {activeTab === 'list' && (
        <div className="p-4 sm:p-5 overflow-x-auto">
          {data.type === 'flowchart' ? (
            /* FLOWCHART TABLE LIST */
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Step</th>
                  <th className="py-2.5 px-3">Milestone / action</th>
                  <th className="py-2.5 px-3">Detailed Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.nodes.map((node, index) => (
                  <tr key={node.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#E07A5F]">#{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{node.label}</td>
                    <td className="py-3 px-3 text-slate-600 font-sans leading-relaxed">{node.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* MINDMAP TABLE LIST */
            <div className="space-y-4">
              <div className="bg-slate-100/60 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Main Core Subject</span>
                <span className="text-xs font-bold text-slate-800">{data.root.label}</span>
                {data.root.description && <p className="text-[10px] text-slate-500 font-sans mt-0.5">{data.root.description}</p>}
              </div>

              <div className="space-y-3">
                {data.root.branches.map((branch, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 shadow-3xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">{branch.label}</span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 border border-slate-200">
                        Branch #{index + 1}
                      </span>
                    </div>
                    {branch.description && <p className="text-xs text-slate-600 font-sans leading-relaxed">{branch.description}</p>}
                    
                    {branch.subBranches && branch.subBranches.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {branch.subBranches.map((sub, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="bg-slate-50 border border-slate-150 text-[10px] text-slate-600 p-1 px-2.5 rounded-md font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
