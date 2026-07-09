import { useEffect, useState } from 'react';
import { 
  Sun, Cloud, CloudRain, Leaf, Sparkles, HelpCircle, 
  Dna, Microscope, Globe, BookOpen, Binary, Atom, Activity, Zap
} from 'lucide-react';
import { LanguageCode } from '../../types';
import InteractiveAITeacher from '../InteractiveAITeacher';

interface SlideVisualBoardProps {
  slide: {
    id: string;
    title: string;
    content: string;
    bullets: string[];
    keyFact?: string;
    visualLayout?: string;
    visualAttributes?: {
      stepNumber?: number;
      totalSteps?: number;
      stepTitle?: string;
      keywords?: string[];
      accentColor?: string;
      stage?: 'evaporation' | 'condensation' | 'precipitation' | string;
    };
  };
  currentSlideIndex: number;
  isPlaying: boolean;
  lang: LanguageCode;
  avatarChar?: string;
  avatarName?: string;
  avatarAction?: 'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think';
}

export default function SlideVisualBoard({
  slide,
  currentSlideIndex,
  isPlaying,
  lang,
  avatarChar,
  avatarName,
  avatarAction
}: SlideVisualBoardProps) {
  const layout = slide.visualLayout || 'conceptual-flow';
  const stage = slide.visualAttributes?.stage || '';
  const accentColor = slide.visualAttributes?.accentColor || '#E07A5F';
  const keywords = slide.visualAttributes?.keywords || [];
  
  // State for particles to make animations feel alive and custom
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; speed: number }[]>([]);

  // Regenerate random particles for animations when stage or slide changes
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 85 + 5,
      top: Math.random() * 60 + 10,
      delay: Math.random() * 2,
      speed: Math.random() * 1.5 + 0.8
    }));
    setParticles(newParticles);
  }, [slide.id, stage]);

  // Determine dynamic icon for conceptual layout based on keywords or subject/title
  const getConceptualIcon = () => {
    const titleText = (slide.title + " " + keywords.join(" ")).toLowerCase();
    if (titleText.includes('space') || titleText.includes('sun') || titleText.includes('star') || titleText.includes('gravity') || titleText.includes('orbit')) {
      return <Sun className="h-10 w-10 text-amber-400 animate-pulse" />;
    }
    if (titleText.includes('plant') || titleText.includes('tree') || titleText.includes('bio') || titleText.includes('cell') || titleText.includes('leaf') || titleText.includes('chlorophyll')) {
      return <Leaf className="h-10 w-10 text-emerald-400 animate-pulse" />;
    }
    if (titleText.includes('chemical') || titleText.includes('atom') || titleText.includes('physic') || titleText.includes('molecule') || titleText.includes('energy') || titleText.includes('wind')) {
      return <Atom className="h-10 w-10 text-[#81B29A] animate-spin" style={{ animationDuration: '8s' }} />;
    }
    if (titleText.includes('math') || titleText.includes('number') || titleText.includes('count') || titleText.includes('multiply') || titleText.includes('sum')) {
      return <Binary className="h-10 w-10 text-indigo-400 animate-pulse" />;
    }
    if (titleText.includes('history') || titleText.includes('ancient') || titleText.includes('war') || titleText.includes('book') || titleText.includes('story')) {
      return <BookOpen className="h-10 w-10 text-orange-300" />;
    }
    if (titleText.includes('earth') || titleText.includes('world') || titleText.includes('map') || titleText.includes('geo') || titleText.includes('country')) {
      return <Globe className="h-10 w-10 text-sky-400 animate-pulse" />;
    }
    return <Microscope className="h-10 w-10 text-[#F2CC8F] animate-pulse" />;
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-5 p-4 sm:p-5 text-white bg-[#1A1D2D]/95 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      
      {/* Visual Canvas Panel (Left/Center) */}
      <div className="flex-1 min-h-[160px] sm:min-h-[240px] bg-slate-950/70 border border-white/5 rounded-2xl relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Render specific layout graphics */}
        {layout === 'water-cycle' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10">
            {/* Sky Level */}
            <div className="flex justify-between items-start w-full px-2">
              {/* Sun (Always shining or pulsing during Evaporation) */}
              <div className="relative">
                <Sun 
                  className={`h-12 w-12 text-amber-400 transition-all duration-700 ${
                    stage === 'evaporation' && isPlaying ? 'animate-pulse scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'opacity-80'
                  }`} 
                />
                {stage === 'evaporation' && isPlaying && (
                  <span className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md animate-ping" />
                )}
              </div>

              {/* Condensation Clouds representation */}
              <div className="relative flex flex-col items-end">
                <Cloud 
                  className={`h-14 w-20 transition-all duration-700 ${
                    stage === 'condensation' 
                      ? 'text-sky-100 fill-sky-50 drop-shadow-[0_4px_10px_rgba(255,255,255,0.4)] scale-110 animate-pulse-scale' 
                      : stage === 'precipitation' 
                        ? 'text-slate-400 fill-slate-500 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]' 
                        : 'text-slate-500 opacity-40'
                  }`} 
                />
                {stage === 'condensation' && isPlaying && (
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-200 font-bold font-mono px-2 py-0.5 rounded-full absolute -bottom-4 right-2 animate-bounce border border-cyan-400/30">
                    Vapor Gathering...
                  </span>
                )}
              </div>
            </div>

            {/* Middle Atmosphere Level with Interactive Particles */}
            <div className="flex-1 relative w-full min-h-[70px]">
              {/* Stage 1: Evaporation steam particles rising */}
              {stage === 'evaporation' && isPlaying && (
                <div className="absolute inset-0">
                  {particles.map((p) => (
                    <div 
                      key={p.id}
                      className="absolute text-cyan-300 font-bold select-none text-xs animate-rise-steam"
                      style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.speed + 1.2}s`
                      }}
                    >
                      💧↑
                    </div>
                  ))}
                </div>
              )}

              {/* Stage 2: Condensation swirly cloud molecules */}
              {stage === 'condensation' && isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-16 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center animate-rotate-slow">
                    <Sparkles className="h-5 w-5 text-cyan-300 animate-ping" />
                    <span className="text-[8px] text-cyan-200 font-mono absolute font-extrabold uppercase tracking-widest">Cooling Down</span>
                  </div>
                </div>
              )}

              {/* Stage 3: Precipitation falling rain drops */}
              {stage === 'precipitation' && isPlaying && (
                <div className="absolute inset-0">
                  {particles.map((p) => (
                    <div 
                      key={p.id}
                      className="absolute text-blue-400 select-none text-sm font-black animate-fall-rain"
                      style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.speed + 0.5}s`
                      }}
                    >
                      🌧️
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earth & Water Level */}
            <div className="w-full relative h-12 bg-emerald-950/30 border-t border-emerald-900/40 rounded-b-xl overflow-hidden flex items-end">
              {/* Land / Mountain on right */}
              <div className="absolute right-0 bottom-0 w-1/3 h-10 bg-gradient-to-t from-emerald-800 to-emerald-700 rounded-tl-full flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-emerald-100 uppercase tracking-widest">Land</span>
              </div>
              
              {/* Ocean water on left */}
              <div className="w-2/3 h-7 bg-gradient-to-t from-blue-700 to-sky-500 relative overflow-hidden flex items-center justify-center">
                {/* Rolling waves effect */}
                <div className="absolute inset-0 bg-sky-400/30 animate-wave-slide opacity-50" />
                <span className="text-[9px] font-mono font-bold text-white uppercase tracking-widest z-10 relative">
                  {stage === 'evaporation' && isPlaying ? '💧 Warming Water' : '🌊 Ocean Basin'}
                </span>
              </div>
            </div>
          </div>
        )}

        {layout === 'photosynthesis' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10">
            {/* Top row: Sun and Gas flow */}
            <div className="flex justify-between items-start w-full px-2">
              <div className="relative">
                <Sun className={`h-12 w-12 text-amber-400 ${isPlaying ? 'animate-pulse' : 'opacity-80'}`} />
                {isPlaying && (
                  <div className="absolute left-10 top-10 flex flex-col space-y-0.5 pointer-events-none">
                    <span className="w-20 h-1 bg-gradient-to-r from-amber-400 to-transparent rotate-35 origin-left animate-pulse-scale" />
                    <span className="w-24 h-0.5 bg-gradient-to-r from-yellow-300 to-transparent rotate-40 origin-left animate-pulse-scale" style={{ animationDelay: '0.5s' }} />
                  </div>
                )}
              </div>

              {/* Gas Molecule Badges */}
              <div className="flex flex-col space-y-1.5 items-end">
                {/* CO2 Input */}
                <div className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-black flex items-center gap-1 transition-all ${
                  stage === 'co2' || isPlaying
                    ? 'bg-slate-800/90 text-amber-200 border-amber-400/40 scale-105' 
                    : 'bg-slate-900/50 text-slate-400 border-white/5'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  CO₂ (In)
                </div>

                {/* O2 Output */}
                <div className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-black flex items-center gap-1 transition-all ${
                  stage === 'precipitation' || isPlaying
                    ? 'bg-emerald-950/85 text-emerald-200 border-emerald-400/40 scale-105 animate-pulse-scale' 
                    : 'bg-slate-900/50 text-slate-400 border-white/5'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  O₂ (Out) + Glucose 🌟
                </div>
              </div>
            </div>

            {/* Plant Structure Visual representation */}
            <div className="flex-1 flex items-center justify-center relative min-h-[90px] mt-2">
              
              {/* Glowing absorption lines during explain */}
              {isPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Floating O2 bubbles rising up from the leaf */}
                  {particles.slice(0, 8).map((p) => (
                    <div 
                      key={p.id}
                      className="absolute bg-emerald-400/80 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-emerald-950 animate-rise-steam"
                      style={{
                        left: `${p.left - 10}%`,
                        bottom: `${p.top}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.speed + 1.5}s`
                      }}
                    >
                      O₂
                    </div>
                  ))}
                </div>
              )}

              {/* The Plant Drawing */}
              <div className="flex flex-col items-center relative">
                {/* Leaf */}
                <div className="relative group flex items-center justify-center">
                  <div className={`w-20 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-ellipse rotate-12 flex items-center justify-center border-2 border-emerald-300/40 relative shadow-lg ${
                    isPlaying ? 'animate-pulse scale-105 shadow-emerald-500/10' : ''
                  }`}>
                    {/* Leaf veins */}
                    <span className="absolute left-0 right-0 h-0.5 bg-emerald-300/30 top-1/2 -translate-y-1/2" />
                    <span className="text-[10px] font-extrabold text-white font-sans tracking-wide">Chlorophyll</span>
                  </div>
                  
                  {/* Root flow connection */}
                  <span className="absolute top-8 w-1 h-8 bg-emerald-700" />
                </div>
              </div>
            </div>

            {/* Soil Level */}
            <div className="w-full h-10 bg-gradient-to-t from-amber-950 to-amber-900 rounded-b-xl flex items-center justify-between px-3 border-t border-amber-800/40">
              <span className="text-[8px] font-mono font-bold text-amber-200 uppercase tracking-widest flex items-center gap-1">
                🌱 Root System
              </span>
              
              {/* Flowing Water particles into roots */}
              <div className="flex gap-2 items-center">
                <span className="text-[8px] text-sky-300 font-mono animate-pulse">H₂O Water Absorbed</span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              </div>
            </div>
          </div>
        )}

        {layout === 'multiplication' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-2">
            <div className="bg-black/50 rounded-xl p-2.5 border border-white/10 text-center mb-2">
              <span className="text-[11px] font-mono text-[#F2CC8F] font-bold uppercase tracking-widest block mb-1">
                Visual Mathematical Array
              </span>
              <div className="flex justify-center items-center gap-3">
                <div className="px-2 py-0.5 bg-white/10 rounded font-mono text-xs font-bold text-white">
                  3 Rows
                </div>
                <span className="text-amber-400 font-black">×</span>
                <div className="px-2 py-0.5 bg-white/10 rounded font-mono text-xs font-bold text-white">
                  4 Items
                </div>
                <span className="text-[#81B29A] font-black">=</span>
                <div className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-xs font-black">
                  12 Total
                </div>
              </div>
            </div>

            {/* Displaying interactive groupings Grid */}
            <div className="flex-1 flex flex-col justify-center items-center gap-2 py-2">
              {[0, 1, 2].map((rowIdx) => (
                <div 
                  key={rowIdx} 
                  className={`flex items-center gap-2.5 p-1.5 rounded-lg border transition-all duration-300 ${
                    isPlaying && rowIdx === Math.floor(Date.now() / 1500) % 3 
                      ? 'bg-amber-400/10 border-amber-400/40 scale-105 shadow-md shadow-amber-400/5' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest px-1 border-r border-white/10">
                    Row {rowIdx + 1}:
                  </span>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((colIdx) => {
                      const id = rowIdx * 4 + colIdx;
                      const emojis = ['🌟', '🍎', '🍓', '🍀', '🍬', '🎈'];
                      const activeEmoji = emojis[id % emojis.length];
                      return (
                        <div 
                          key={colIdx}
                          className={`w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-base shadow-sm transition-transform duration-200 hover:scale-110 select-none ${
                            isPlaying ? 'animate-pulse' : ''
                          }`}
                          style={{ animationDelay: `${id * 100}ms` }}
                        >
                          {activeEmoji}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] font-sans text-gray-400 italic">
              "Repeated addition: 4 + 4 + 4 is exactly same as 3 times 4!"
            </div>
          </div>
        )}

        {layout === 'conceptual-flow' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-2">
            {/* Header with concept title */}
            <div className="flex justify-between items-center w-full pb-1 border-b border-white/10 mb-2">
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                {slide.visualAttributes?.stepTitle || `Concept Milestone`}
              </span>
              <span className="text-[10px] bg-[#3D405B] text-[#F2CC8F] font-mono font-black px-2.5 py-0.5 rounded border border-white/10 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#E07A5F] rounded-full animate-ping" />
                Live Flow
              </span>
            </div>

            {/* Smart Concept neural node board */}
            <div className="flex-1 flex items-center justify-center relative min-h-[110px] my-2">
              {/* Connecting Neural Network Web background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#FFF" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="85%" y1="50%" x2="50%" y2="50%" stroke="#FFF" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="15%" x2="50%" y2="50%" stroke="#FFF" strokeWidth="2" strokeDasharray="4 4" />
              </svg>

              {/* Central Active Hub */}
              <div className="relative z-10 flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-2xl relative transition-all duration-500"
                  style={{ 
                    borderColor: accentColor, 
                    backgroundColor: '#1E2235',
                    boxShadow: isPlaying ? `0 0 20px ${accentColor}33` : 'none'
                  }}
                >
                  {getConceptualIcon()}
                  
                  {/* Orbiting element when talking */}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full border border-dashed border-white/40 animate-rotate-slow">
                      <span 
                        className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 -top-1 left-1/2 -translate-x-1/2 shadow-xs"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                  )}
                </div>
                
                <span className="text-[10px] font-mono font-black text-gray-300 mt-2 tracking-wide uppercase px-2 py-0.5 bg-slate-900/85 rounded border border-white/5 max-w-[120px] truncate text-center">
                  {keywords[0] || 'Core Subject'}
                </span>
              </div>

              {/* Keyword Nodes (Floating satellite items) */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-center">
                <div className="px-2.5 py-1 bg-slate-900/90 border border-white/10 rounded-lg text-[9px] font-bold tracking-wider text-slate-300 shadow-sm flex items-center gap-1.5 animate-pulse">
                  <Activity className="h-3 w-3 text-sky-400" />
                  <span>Analyze</span>
                </div>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-center">
                <div className="px-2.5 py-1 bg-slate-900/90 border border-white/10 rounded-lg text-[9px] font-bold tracking-wider text-slate-300 shadow-sm flex items-center gap-1.5 animate-pulse" style={{ animationDelay: '1s' }}>
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Interactive</span>
                </div>
              </div>
            </div>

            {/* Keyword tag row */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {keywords.map((kw, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-[#F2CC8F]"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Small floating Picture-in-Picture Tutor feed inside the Visual Canvas Panel */}
        {avatarChar && avatarName && (
          <div className="absolute bottom-3 right-3 z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-[#F2CC8F] bg-slate-950/95 overflow-hidden shadow-2xl flex items-center justify-center transition-transform hover:scale-105 select-none">
            <div className="scale-[0.38] sm:scale-[0.44] transform origin-center flex flex-col items-center justify-center">
              <InteractiveAITeacher 
                avatarChar={avatarChar}
                avatarName={avatarName}
                action={avatarAction || 'idle'}
                isPlaying={isPlaying}
                minimal={true}
              />
            </div>
            {isPlaying && (
              <span className="absolute inset-0 rounded-full border border-[#E07A5F] animate-ping opacity-60 pointer-events-none" />
            )}
            <div className="absolute bottom-0.5 bg-black/80 px-1.5 py-0.5 rounded text-[6.5px] font-mono text-white tracking-widest scale-90 opacity-90 select-none">
              {isPlaying ? "🔴 REC" : "🎙️ IDLE"}
            </div>
          </div>
        )}

      </div>

      {/* Content Metadata Panel (Right) */}
      <div className="w-full md:w-[240px] flex flex-col justify-between shrink-0 space-y-4">
        
        {/* Slide Title and bullets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span 
              className="text-xs font-mono font-black px-2 py-0.5 rounded text-white flex items-center gap-1 bg-slate-800"
            >
              <Sparkles className="h-3 w-3 text-[#F2CC8F] animate-pulse" />
              Insights
            </span>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
              Interactive Guide
            </h4>
          </div>

          <p className="text-xs text-gray-200 font-sans leading-relaxed">
            {slide.content}
          </p>

          {/* Bullet Points */}
          <div className="space-y-1.5">
            {slide.bullets && slide.bullets.map((bullet, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-2 text-[10px] sm:text-xs font-medium font-sans leading-relaxed text-gray-350 transition-all duration-300 ${
                  isPlaying ? 'translate-x-0.5 text-white' : ''
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <span className="text-amber-400 shrink-0 select-none mt-0.5">✦</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Key Fact Card styled like a cute sticky note */}
        {slide.keyFact && (
          <div className="p-3 bg-[#F2CC8F]/10 border border-[#F2CC8F]/20 rounded-xl relative shadow-inner">
            <div className="absolute -top-2 left-3 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[8px] font-black uppercase rounded-sm tracking-widest flex items-center gap-1 shadow-xs">
              <Sparkles className="h-2.5 w-2.5" />
              <span>DID YOU KNOW?</span>
            </div>
            <p className="text-[10px] sm:text-xs font-sans text-[#F2CC8F] font-bold leading-relaxed mt-1">
              {slide.keyFact}
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
