import { useEffect, useState } from 'react';
import { 
  Sun, Cloud, Leaf, Sparkles,
  Microscope, Globe, BookOpen, Binary, Atom, Activity, Zap,
  Table, Rocket, Droplets, Compass, Shield
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
      stage?: string;
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
  isPlaying,
  lang,
  avatarChar,
  avatarName,
  avatarAction
}: SlideVisualBoardProps) {
  const rawLayout = (slide.visualLayout || '').toLowerCase();
  const keywords = slide.visualAttributes?.keywords || [];
  const titleText = (slide.title + " " + keywords.join(" ") + " " + slide.content).toLowerCase();

  // Smart layout resolution: matches explicit layout or infers from slide content
  let layout = 'conceptual-flow';
  if (rawLayout.includes('spreadsheet') || rawLayout.includes('excel') || titleText.includes('excel') || titleText.includes('spreadsheet') || titleText.includes('cell') && (titleText.includes('row') || titleText.includes('formula'))) {
    layout = 'spreadsheet-excel';
  } else if (rawLayout.includes('space') || rawLayout.includes('orbit') || rawLayout.includes('rocket') || titleText.includes('rocket') || titleText.includes('gravity') || titleText.includes('space') || titleText.includes('planet') || titleText.includes('solar system')) {
    layout = 'space-orbit';
  } else if (rawLayout.includes('cell') || rawLayout.includes('anatomy') || rawLayout.includes('bio') || titleText.includes('cell') || titleText.includes('blood') || titleText.includes('organ') || titleText.includes('hemoglobin') || titleText.includes('dna')) {
    layout = 'cell-anatomy';
  } else if (rawLayout.includes('chem') || rawLayout.includes('atom') || titleText.includes('chemistry') || titleText.includes('reaction') || titleText.includes('molecule') || titleText.includes('atom') || titleText.includes('acid')) {
    layout = 'chemistry-lab';
  } else if (rawLayout.includes('geometry') || rawLayout.includes('pythagoras') || titleText.includes('pythagoras') || titleText.includes('triangle') || titleText.includes('geometry') || titleText.includes('algebra')) {
    layout = 'geometry-pythagoras';
  } else if (rawLayout.includes('history') || rawLayout.includes('timeline') || rawLayout.includes('civics') || titleText.includes('constitution') || titleText.includes('freedom') || titleText.includes('history') || titleText.includes('ambedkar') || titleText.includes('gandhi')) {
    layout = 'history-timeline';
  } else if (rawLayout.includes('agri') || rawLayout.includes('farm') || titleText.includes('farming') || titleText.includes('irrigation') || titleText.includes('soil') || titleText.includes('crop')) {
    layout = 'agri-drone';
  } else if (rawLayout.includes('water') || rawLayout.includes('rain') || titleText.includes('water cycle') || titleText.includes('rain') || titleText.includes('cloud')) {
    layout = 'water-cycle';
  } else if (rawLayout.includes('photo') || titleText.includes('photosynthesis') || titleText.includes('chlorophyll')) {
    layout = 'photosynthesis';
  } else if (rawLayout.includes('math') || rawLayout.includes('multiplication') || titleText.includes('multiply') || titleText.includes('multiplication')) {
    layout = 'multiplication';
  }

  const stage = slide.visualAttributes?.stage || '';
  const accentColor = slide.visualAttributes?.accentColor || '#E07A5F';

  // Dynamic particle generation for live canvas ambiance
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; delay: number; speed: number }[]>([]);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const newParticles = Array.from({ length: 14 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 85 + 5,
      top: Math.random() * 60 + 10,
      delay: Math.random() * 2,
      speed: Math.random() * 1.5 + 0.8
    }));
    setParticles(newParticles);
  }, [slide.id, stage]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTicker(t => (t + 1) % 100);
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex flex-col md:flex-row gap-5 p-4 sm:p-5 text-white bg-[#1A1D2D]/95 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
      
      {/* Visual Canvas Panel (Left/Center) */}
      <div className="flex-1 min-h-[180px] sm:min-h-[250px] bg-slate-950/80 border border-white/10 rounded-2xl relative p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner">
        
        {/* Futuristic grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* 1. SPREADSHEET & MS EXCEL DYNAMIC SIMULATION */}
        {layout === 'spreadsheet-excel' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            {/* Excel Formula Ribbon */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-lg mb-2 shadow-xs">
              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                fx
              </span>
              <span className="text-[11px] font-mono font-bold text-white tracking-wide truncate">
                {isPlaying ? '=SUM(B2:D2) * 1.18' : '=EXCEL_CALC(Data_Rows)'}
              </span>
              <span className="ml-auto text-[8px] font-mono text-emerald-300 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 animate-pulse">
                AUTOSUM ACTIVE ✨
              </span>
            </div>

            {/* Interactive Grid Table */}
            <div className="flex-1 bg-slate-900/95 rounded-xl border border-slate-700/80 overflow-hidden shadow-md flex flex-col justify-between p-2">
              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9.5px] border-b border-slate-700 pb-1.5 font-black text-slate-400">
                <span className="bg-slate-800/80 rounded py-0.5">A (Item)</span>
                <span className="bg-slate-800/80 rounded py-0.5">B (Qty)</span>
                <span className="bg-slate-800/80 rounded py-0.5">C (Rate)</span>
                <span className="bg-emerald-950/80 text-emerald-300 rounded py-0.5 border border-emerald-500/30">D (Total ₹)</span>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-1 my-1 font-mono text-[10px]">
                <div className="grid grid-cols-4 gap-1 text-center items-center py-1 bg-slate-800/40 rounded">
                  <span className="text-white font-bold text-left px-2">Notebooks</span>
                  <span className="text-slate-300">5</span>
                  <span className="text-slate-300">₹40</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 rounded">₹200</span>
                </div>
                <div className={`grid grid-cols-4 gap-1 text-center items-center py-1 rounded transition-all duration-500 ${
                  isPlaying ? 'bg-amber-400/20 border border-amber-400/50 shadow-xs' : 'bg-slate-800/40'
                }`}>
                  <span className="text-white font-bold text-left px-2 flex items-center gap-1">
                    <span>Pens</span>
                    {isPlaying && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />}
                  </span>
                  <span className="text-slate-300">10</span>
                  <span className="text-slate-300">₹15</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 rounded">₹150</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center items-center py-1 bg-slate-800/40 rounded">
                  <span className="text-white font-bold text-left px-2">Calculators</span>
                  <span className="text-slate-300">2</span>
                  <span className="text-slate-300">₹250</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 rounded">₹500</span>
                </div>
              </div>

              {/* Chart Bar Visualization footer */}
              <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-[9.5px] font-sans font-bold text-slate-300">
                    {lang === 'hi' ? 'ग्रिड और फॉर्मूला गणना' : 'Row × Column Automated Computing'}
                  </span>
                </div>
                <div className="flex gap-1.5 items-end h-5">
                  <span className="w-2.5 bg-cyan-400 rounded-t h-3 animate-pulse" />
                  <span className="w-2.5 bg-emerald-400 rounded-t h-5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2.5 bg-amber-400 rounded-t h-4 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SPACE, ROCKET PROPULSION & GRAVITATIONAL ORBITS */}
        {layout === 'space-orbit' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                Orbital Trajectory & Gravitation
              </span>
              <span className="text-[9px] font-mono bg-sky-950/80 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/40">
                v = 11.2 km/s (Escape Vel.)
              </span>
            </div>

            {/* Orbit Motion Space Field */}
            <div className="flex-1 flex items-center justify-center relative min-h-[120px] my-2">
              {/* Planetary Ellipse */}
              <div className="w-48 h-28 rounded-full border-2 border-dashed border-cyan-400/30 flex items-center justify-center relative animate-rotate-slow">
                {/* Orbiting Satellite / Moon */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] flex items-center justify-center text-[8px]">
                    🛰️
                  </div>
                </div>
              </div>

              {/* Central Planet / Sun */}
              <div className="absolute z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 shadow-[0_0_24px_rgba(251,191,36,0.6)] flex items-center justify-center text-xl">
                  🌍
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-200 mt-1 uppercase">
                  Earth Gravity (g)
                </span>
              </div>

              {/* Rocket with Thrusters */}
              <div className={`absolute right-4 top-2 flex flex-col items-center transition-transform duration-700 ${
                isPlaying ? 'translate-y-[-6px] scale-110' : ''
              }`}>
                <span className="text-2xl animate-bounce">🚀</span>
                <div className="flex gap-0.5 mt-0.5">
                  <span className="w-1 h-3 bg-gradient-to-b from-orange-400 to-transparent rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-gradient-to-b from-yellow-300 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1 h-3 bg-gradient-to-b from-orange-400 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-cyan-200 bg-slate-900/80 py-1 px-3 rounded-lg border border-white/5">
              Newton 3rd Law: Action Force (Exhaust) = Reaction Force (Upward Thrust)
            </div>
          </div>
        )}

        {/* 3. BIOLOGY & CELLULAR ANATOMY */}
        {layout === 'cell-anatomy' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-emerald-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Microscope className="h-3.5 w-3.5 text-emerald-400" />
                Cellular Structure & Respiration
              </span>
              <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40 animate-pulse">
                ATP Energy Engine ⚡
              </span>
            </div>

            {/* Cell Body */}
            <div className="flex-1 flex items-center justify-center relative min-h-[120px]">
              <div className="w-44 h-32 rounded-ellipse bg-gradient-to-br from-emerald-900/60 to-teal-950/80 border-2 border-emerald-400/50 relative flex items-center justify-center shadow-lg shadow-emerald-500/10">
                
                {/* Nucleus */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-600 border-2 border-purple-400/60 flex flex-col items-center justify-center shadow-inner animate-pulse">
                  <span className="text-xs">🧬</span>
                  <span className="text-[8px] font-mono font-black text-purple-200 uppercase">DNA Core</span>
                </div>

                {/* Mitochondria */}
                <div className="absolute top-2 left-4 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[8px] font-mono text-amber-200">
                  ⚡ Mitochondria
                </div>

                {/* Cytoplasm Particles */}
                {particles.slice(0, 6).map((p) => (
                  <div 
                    key={p.id} 
                    className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/80 animate-ping pointer-events-none"
                    style={{ left: `${p.left}%`, top: `${p.top}%` }}
                  />
                ))}

                {/* Ribosomes */}
                <div className="absolute bottom-2 right-4 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-[8px] font-mono text-rose-200">
                  🔬 Ribosome
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900/80 px-3 py-1 rounded-lg border border-white/5 text-[9.5px] font-mono text-emerald-200">
              <span>Hemoglobin + Oxygen ➔ Cellular Metabolism</span>
              <span className="text-emerald-400 font-bold">Pure O₂</span>
            </div>
          </div>
        )}

        {/* 4. CHEMISTRY & ATOMIC LAB */}
        {layout === 'chemistry-lab' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-indigo-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Atom className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
                Chemical Reaction & Atomic Orbitals
              </span>
              <span className="text-[9px] font-mono bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/40">
                pH & Bonds
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center gap-6 relative my-1">
              {/* Atom with Orbitals */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-indigo-400/30 absolute animate-spin" style={{ animationDuration: '6s' }}>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-0 left-1/2 -translate-x-1/2 shadow-xs" />
                </div>
                <div className="w-24 h-24 rounded-full border border-indigo-400/30 absolute rotate-60 animate-spin" style={{ animationDuration: '7s' }}>
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-0 left-1/2 -translate-x-1/2 shadow-xs" />
                </div>
                {/* Nucleus */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-md">
                  P+N
                </div>
              </div>

              {/* Lab Flask */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-20 flex flex-col items-center justify-end">
                  <div className="w-4 h-6 border-2 border-b-0 border-slate-400 bg-slate-900/50" />
                  <div className="w-14 h-14 rounded-b-2xl border-2 border-slate-400 bg-gradient-to-t from-purple-700 via-indigo-600 to-transparent flex items-center justify-center relative overflow-hidden shadow-lg">
                    {particles.slice(0, 5).map(p => (
                      <span 
                        key={p.id}
                        className="w-1.5 h-1.5 rounded-full bg-white/70 absolute animate-rise-steam"
                        style={{ left: `${p.left}%`, bottom: '2px', animationDuration: '2s' }}
                      />
                    ))}
                    <span className="text-xs font-mono font-bold text-white z-10">NaCl</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-purple-200 mt-1">Reaction Core</span>
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-300 bg-slate-900/80 py-1 px-2 rounded border border-white/5">
              Reactants (A + B) ➔ Balanced Compounds (C + D) + Energy Release
            </div>
          </div>
        )}

        {/* 5. GEOMETRY & MATHEMATICAL PROOFS */}
        {layout === 'geometry-pythagoras' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-amber-400" />
                Pythagoras Principle (a² + b² = c²)
              </span>
              <span className="text-[9px] font-mono bg-amber-950 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40">
                Right Triangle 90°
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center gap-4 relative my-2">
              <svg viewBox="0 0 160 120" className="w-40 h-28 select-none">
                {/* Right Triangle */}
                <polygon points="20,100 120,100 120,30" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="2.5" />
                {/* 90 degree corner */}
                <polyline points="110,100 110,90 120,90" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                {/* Labels */}
                <text x="65" y="114" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">Base (b = 4)</text>
                <text x="138" y="70" fill="#94A3B8" fontSize="9" fontWeight="bold">Height (a = 3)</text>
                <text x="56" y="55" fill="#38BDF8" fontSize="10" fontWeight="bold" transform="rotate(-35, 56, 55)">Hypotenuse (c = 5)</text>
              </svg>

              <div className="flex flex-col gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] font-mono text-amber-400 font-bold">3² + 4² = 5²</span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">9 + 16 = 25</span>
                <span className="text-[9px] font-mono text-emerald-400 font-extrabold bg-emerald-950/80 px-1.5 py-0.5 rounded">√25 = 5 (Hypotenuse)</span>
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-300 bg-slate-900/80 py-1 px-2 rounded border border-white/5">
              Essential for GPS navigation, construction engineering, and distance calculations!
            </div>
          </div>
        )}

        {/* 6. HISTORY, CIVICS & CONSTITUTION TIMELINE */}
        {layout === 'history-timeline' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-rose-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                Constitution, Republic & Rights
              </span>
              <span className="text-[9px] font-mono bg-rose-950 text-rose-200 px-2 py-0.5 rounded-full border border-rose-500/40">
                Preamble Core
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-2 my-2 px-2">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 -translate-y-1/2 z-0" />
                
                {[
                  { step: "1947", title: "Independence", color: "border-amber-400 bg-amber-950 text-amber-300" },
                  { step: "1949", title: "Constitution Adopted", color: "border-rose-400 bg-rose-950 text-rose-300" },
                  { step: "1950", title: "Republic of India", color: "border-emerald-400 bg-emerald-950 text-emerald-300" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full border-2 ${item.color} flex items-center justify-center text-[9px] font-mono font-black shadow-md`}>
                      {idx + 1}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-white mt-1">{item.step}</span>
                    <span className="text-[8px] font-sans text-slate-400 max-w-[80px] text-center truncate">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-amber-200 bg-slate-900/80 py-1 px-2 rounded border border-white/5">
              Justice • Liberty • Equality • Fraternity guaranteed to every citizen
            </div>
          </div>
        )}

        {/* 7. AGRICULTURE & DRONE IRRIGATION */}
        {layout === 'agri-drone' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-emerald-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                Smart Drip Irrigation & Soil Health
              </span>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40">
                Saves 60% Water
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between relative my-2">
              {/* Drone Scanning Sky */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 flex items-center gap-1.5 animate-pulse">
                  <span>🛸 Drone AI Soil Moisture Scan: 78% Optimal</span>
                </div>
              </div>

              {/* Crops & Drip line */}
              <div className="flex justify-around items-end h-16 border-b-2 border-emerald-700 pb-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>🌾</span>
                    <span className="text-[8px] font-mono text-cyan-300 animate-pulse">💧 drip</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-emerald-200 bg-slate-900/80 py-1 px-2 rounded border border-white/5">
              NPK Nutrient Balance + Direct Root Watering = High Crop Yield
            </div>
          </div>
        )}

        {/* 8. WATER CYCLE */}
        {layout === 'water-cycle' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start w-full px-2">
              <div className="relative">
                <Sun className={`h-12 w-12 text-amber-400 transition-all duration-700 ${isPlaying ? 'animate-pulse scale-110' : 'opacity-80'}`} />
              </div>
              <div className="relative flex flex-col items-end">
                <Cloud className="h-14 w-20 text-sky-100 fill-sky-50 drop-shadow-[0_4px_10px_rgba(255,255,255,0.4)]" />
              </div>
            </div>

            <div className="flex-1 relative w-full min-h-[70px]">
              {particles.slice(0, 8).map((p) => (
                <div 
                  key={p.id}
                  className="absolute text-cyan-300 font-bold select-none text-xs animate-rise-steam"
                  style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.speed + 1.2}s` }}
                >
                  💧
                </div>
              ))}
            </div>

            <div className="w-full relative h-12 bg-emerald-950/30 border-t border-emerald-900/40 rounded-b-xl overflow-hidden flex items-end">
              <div className="w-full h-7 bg-gradient-to-t from-blue-700 to-sky-500 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-white uppercase tracking-widest">
                  🌊 Water Reservoir & Evaporation Basin
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 9. PHOTOSYNTHESIS */}
        {layout === 'photosynthesis' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start w-full px-2">
              <Sun className={`h-12 w-12 text-amber-400 ${isPlaying ? 'animate-pulse' : 'opacity-80'}`} />
              <div className="flex flex-col space-y-1 items-end">
                <div className="px-2 py-0.5 rounded-md border text-[9px] font-mono font-black bg-slate-800 text-amber-200 border-amber-400/40">
                  CO₂ In ➔ O₂ Out
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-[90px] mt-2">
              <div className="w-24 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-ellipse rotate-12 flex items-center justify-center border-2 border-emerald-300/40 shadow-lg">
                <span className="text-[10px] font-extrabold text-white font-sans">Chlorophyll</span>
              </div>
            </div>

            <div className="w-full h-8 bg-gradient-to-t from-amber-950 to-amber-900 rounded-b-xl flex items-center justify-between px-3 border-t border-amber-800/40">
              <span className="text-[8px] font-mono font-bold text-amber-200">🌱 Water + Soil Nutrients</span>
              <span className="text-[8px] text-emerald-300 font-mono">Glucose Food 🌟</span>
            </div>
          </div>
        )}

        {/* 10. MULTIPLICATION */}
        {layout === 'multiplication' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-2">
            <div className="bg-black/50 rounded-xl p-2 border border-white/10 text-center mb-1">
              <span className="text-[10px] font-mono text-[#F2CC8F] font-bold uppercase tracking-widest block">
                Visual Mathematical Array
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center gap-1.5 py-1">
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] font-mono text-slate-400 font-bold">Row {rowIdx + 1}:</span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((colIdx) => (
                      <div key={colIdx} className="w-7 h-7 rounded bg-slate-900 border border-white/10 flex items-center justify-center text-sm shadow-sm select-none">
                        ⭐
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-[10px] font-mono text-gray-400">
              3 Rows × 4 Stars = 12 Total Units
            </div>
          </div>
        )}

        {/* 11. UNIVERSAL CONCEPTUAL FLOW */}
        {layout === 'conceptual-flow' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-2">
            <div className="flex justify-between items-center w-full pb-1 border-b border-white/10 mb-2">
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest truncate max-w-[200px]">
                {slide.visualAttributes?.stepTitle || slide.title}
              </span>
              <span className="text-[10px] bg-[#3D405B] text-[#F2CC8F] font-mono font-black px-2.5 py-0.5 rounded border border-white/10 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-[#E07A5F] rounded-full animate-ping" />
                Live Flow
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-[110px] my-2">
              <div className="relative z-10 flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-2xl relative transition-all duration-500 bg-[#1E2235]"
                  style={{ borderColor: accentColor }}
                >
                  <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono font-black text-gray-300 mt-2 tracking-wide uppercase px-2 py-0.5 bg-slate-900/85 rounded border border-white/5 max-w-[140px] truncate text-center">
                  {keywords[0] || 'Core Subject'}
                </span>
              </div>

              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center">
                <div className="px-2 py-0.5 bg-slate-900/90 border border-white/10 rounded text-[9px] font-bold text-slate-300 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-sky-400" />
                  <span>Analyze</span>
                </div>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center">
                <div className="px-2 py-0.5 bg-slate-900/90 border border-white/10 rounded text-[9px] font-bold text-slate-300 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span>Execute</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {keywords.map((kw, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-[#F2CC8F]">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Floating Picture-in-Picture Tutor feed inside the Visual Canvas Panel */}
        {avatarChar && avatarName && (
          <div className="absolute bottom-2.5 right-2.5 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#F2CC8F] bg-slate-900 overflow-hidden shadow-lg flex items-center justify-center select-none ring-1 ring-black/50">
            <InteractiveAITeacher 
              avatarChar={avatarChar}
              avatarName={avatarName}
              action={avatarAction || 'idle'}
              isPlaying={isPlaying}
              minimal={true}
              className="w-full h-full"
            />
            {isPlaying && (
              <span className="absolute inset-0 rounded-full border-2 border-[#E07A5F] animate-ping opacity-75 pointer-events-none" />
            )}
            <div className="absolute top-0.5 right-0.5 bg-black/85 backdrop-blur-xs px-1 py-0.2 rounded-full text-[6px] font-mono text-white tracking-tighter select-none z-30 border border-white/10">
              {isPlaying ? "🔴" : "🎙️"}
            </div>
          </div>
        )}

      </div>

      {/* Content Metadata Panel (Right) */}
      <div className="w-full md:w-[240px] flex flex-col justify-between shrink-0 space-y-3.5">
        
        {/* Active AI Tutor Card */}
        {avatarChar && avatarName && (
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-900/90 rounded-xl border border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F2CC8F] bg-slate-950 shrink-0 shadow-xs">
              <InteractiveAITeacher
                avatarChar={avatarChar}
                avatarName={avatarName}
                action={avatarAction || 'idle'}
                isPlaying={isPlaying}
                minimal={true}
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-[9px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                  {isPlaying ? (lang === 'hi' ? 'लेक्चर चालू है...' : 'Speaking...') : (lang === 'hi' ? 'एआई शिक्षक' : 'AI Mascot Tutor')}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate font-sans">{avatarName}</h4>
            </div>
          </div>
        )}

        {/* Slide Title and bullets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span 
              className="text-xs font-mono font-black px-2 py-0.5 rounded text-white flex items-center gap-1 bg-slate-800"
            >
              {slide.title}
            </span>
          </div>

          <p className="text-xs sm:text-[13px] text-gray-200 leading-relaxed font-sans">
            {slide.content}
          </p>

          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {slide.bullets.map((b, idx) => (
                <li key={idx} className="text-[11px] text-gray-300 flex items-start gap-2">
                  <span className="text-[#F2CC8F] mt-0.5 font-bold">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fact / Tip Badge at bottom */}
        {slide.keyFact && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-400/20 rounded-xl text-amber-200 text-[10px] font-sans flex items-start gap-2 shadow-xs">
            <span className="text-sm shrink-0">💡</span>
            <span className="leading-tight">{slide.keyFact}</span>
          </div>
        )}
      </div>
    </div>
  );
}
