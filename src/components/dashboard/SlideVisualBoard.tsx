import { useEffect, useState } from 'react';
import { 
  Sun, Cloud, Leaf, Sparkles,
  Microscope, Globe, BookOpen, Binary, Atom, Activity, Zap,
  Table, Rocket, Droplets, Compass, Shield, Heart, Battery, Eye,
  ArrowRight, CheckCircle2, Waves, Layers, Moon, Flame, Cpu, Radio
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
    svgVisual?: string;
    visualAttributes?: {
      stepNumber?: number;
      totalSteps?: number;
      stepTitle?: string;
      keywords?: string[];
      accentColor?: string;
      stage?: string;
      [key: string]: any;
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
  currentSlideIndex = 0,
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
  if (slide.svgVisual && slide.svgVisual.trim().startsWith('<svg')) {
    layout = 'dynamic-svg';
  } else if (
    rawLayout.includes('eclipse') || rawLayout.includes('solar-eclipse') || rawLayout.includes('lunar-eclipse') ||
    titleText.includes('eclipse') || titleText.includes('moon block') || titleText.includes('sun block') ||
    (titleText.includes('moon') && (titleText.includes('sun') || titleText.includes('shadow') || titleText.includes('earth'))) ||
    titleText.includes('umbra') || titleText.includes('penumbra') || titleText.includes('syzygy')
  ) {
    layout = 'solar-eclipse';
  } else if (
    rawLayout.includes('optics') || rawLayout.includes('prism') || rawLayout.includes('refraction') ||
    titleText.includes('prism') || titleText.includes('refraction') || titleText.includes('reflection') || titleText.includes('rainbow') ||
    titleText.includes('spectrum') || titleText.includes('lens') || titleText.includes('optics') || (titleText.includes('light') && (titleText.includes('ray') || titleText.includes('color') || titleText.includes('travel') || titleText.includes('speed of light')))
  ) {
    layout = 'optics-light';
  } else if (
    rawLayout.includes('heart') || rawLayout.includes('circulation') || rawLayout.includes('cardio') ||
    titleText.includes('heart') || titleText.includes('circulation') || titleText.includes('blood flow') || titleText.includes('pulse') || titleText.includes('cardio') || titleText.includes('artery') || titleText.includes('vein')
  ) {
    layout = 'human-heart';
  } else if (
    rawLayout.includes('circuit') || rawLayout.includes('electricity') || rawLayout.includes('battery') ||
    titleText.includes('circuit') || titleText.includes('electricity') || titleText.includes('current') || titleText.includes('voltage') || titleText.includes('battery') || titleText.includes('electric')
  ) {
    layout = 'electric-circuit';
  } else if (
    rawLayout.includes('magnet') || rawLayout.includes('magnetic') ||
    titleText.includes('magnet') || titleText.includes('magnetic') || titleText.includes('compass') || titleText.includes('poles')
  ) {
    layout = 'magnetism';
  } else if (
    rawLayout.includes('spreadsheet') || rawLayout.includes('excel') || titleText.includes('excel') || titleText.includes('spreadsheet') || (titleText.includes('cell') && (titleText.includes('row') || titleText.includes('formula')))
  ) {
    layout = 'spreadsheet-excel';
  } else if (
    rawLayout.includes('space') || rawLayout.includes('orbit') || rawLayout.includes('rocket') || titleText.includes('rocket') || titleText.includes('gravity') || titleText.includes('space') || titleText.includes('planet') || titleText.includes('solar system')
  ) {
    layout = 'space-orbit';
  } else if (
    rawLayout.includes('cell') || rawLayout.includes('anatomy') || rawLayout.includes('bio') || titleText.includes('cell') || titleText.includes('blood') || titleText.includes('organ') || titleText.includes('hemoglobin') || titleText.includes('dna')
  ) {
    layout = 'cell-anatomy';
  } else if (
    rawLayout.includes('chem') || rawLayout.includes('atom') || titleText.includes('chemistry') || titleText.includes('reaction') || titleText.includes('molecule') || titleText.includes('atom') || titleText.includes('acid')
  ) {
    layout = 'chemistry-lab';
  } else if (
    rawLayout.includes('geometry') || rawLayout.includes('pythagoras') || titleText.includes('pythagoras') || titleText.includes('triangle') || titleText.includes('geometry') || titleText.includes('algebra')
  ) {
    layout = 'geometry-pythagoras';
  } else if (
    rawLayout.includes('history') || rawLayout.includes('timeline') || rawLayout.includes('civics') || titleText.includes('constitution') || titleText.includes('freedom') || titleText.includes('history') || titleText.includes('ambedkar') || titleText.includes('gandhi')
  ) {
    layout = 'history-timeline';
  } else if (
    rawLayout.includes('agri') || rawLayout.includes('farm') || titleText.includes('farming') || titleText.includes('irrigation') || titleText.includes('soil') || titleText.includes('crop')
  ) {
    layout = 'agri-drone';
  } else if (
    rawLayout.includes('water') || rawLayout.includes('rain') || titleText.includes('water cycle') || titleText.includes('rain') || titleText.includes('cloud')
  ) {
    layout = 'water-cycle';
  } else if (
    rawLayout.includes('photo') || titleText.includes('photosynthesis') || titleText.includes('chlorophyll')
  ) {
    layout = 'photosynthesis';
  } else if (
    rawLayout.includes('math') || rawLayout.includes('multiplication') || titleText.includes('multiply') || titleText.includes('multiplication')
  ) {
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

        {/* 5. GEOMETRY & MATHEMATICAL PROOFS (Stage-Aware) */}
        {layout === 'geometry-pythagoras' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-amber-400" />
                Pythagoras Principle (a² + b² = c²)
              </span>
              <span className="text-[9px] font-mono bg-amber-950 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40">
                {currentSlideIndex === 0 ? "Phase 1: 90° Triangle" : currentSlideIndex === 1 ? "Phase 2: Area Squares" : "Phase 3: Real Apps"}
              </span>
            </div>

            {currentSlideIndex === 1 ? (
              /* Phase 2: Geometric Squares Proof on sides */
              <div className="flex-1 flex items-center justify-center gap-3 relative my-2">
                <svg viewBox="0 0 200 160" className="w-44 h-32 select-none">
                  {/* Base Square (4x4 = 16) */}
                  <rect x="70" y="80" width="70" height="50" fill="rgba(16, 185, 129, 0.25)" stroke="#10B981" strokeWidth="1.5" />
                  <text x="105" y="110" fill="#6EE7B7" fontSize="8" fontWeight="bold" textAnchor="middle">b² = 16</text>
                  
                  {/* Height Square (3x3 = 9) */}
                  <rect x="140" y="30" width="50" height="50" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" strokeWidth="1.5" />
                  <text x="165" y="60" fill="#FCD34D" fontSize="8" fontWeight="bold" textAnchor="middle">a² = 9</text>

                  {/* Main Triangle */}
                  <polygon points="70,80 140,80 140,30" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" strokeWidth="2" />
                  <polyline points="132,80 132,72 140,72" fill="none" stroke="#F59E0B" strokeWidth="1" />
                  
                  {/* Hypotenuse label */}
                  <text x="95" y="50" fill="#38BDF8" fontSize="8" fontWeight="bold" transform="rotate(-35, 95, 50)">c² = 25</text>
                </svg>

                <div className="flex flex-col gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[9px] font-mono text-cyan-300 font-bold">GEOMETRIC PROOF</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">a² + b² = c²</span>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold">9 + 16 = 25</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-extrabold bg-emerald-950/80 px-1.5 py-0.5 rounded">c = √25 = 5</span>
                </div>
              </div>
            ) : currentSlideIndex >= 2 ? (
              /* Phase 3: Real-World Applications (Navigation, Engineering, Height & Distance) */
              <div className="flex-1 flex items-center justify-center gap-3 relative my-2">
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 120 100" className="w-32 h-24 select-none">
                    {/* Building */}
                    <rect x="70" y="20" width="35" height="75" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
                    <rect x="75" y="28" width="8" height="10" fill="#38BDF8" />
                    <rect x="90" y="28" width="8" height="10" fill="#38BDF8" />
                    <rect x="75" y="46" width="8" height="10" fill="#38BDF8" />
                    <rect x="90" y="46" width="8" height="10" fill="#38BDF8" />
                    {/* Ground */}
                    <line x1="10" y1="95" x2="115" y2="95" stroke="#475569" strokeWidth="2" />
                    {/* Ladder / Slope */}
                    <line x1="25" y1="95" x2="70" y2="28" stroke="#F59E0B" strokeWidth="2.5" />
                    <text x="35" y="55" fill="#F59E0B" fontSize="8" fontWeight="bold">Dist (c)</text>
                    <text x="45" y="102" fill="#94A3B8" fontSize="7">Base (b)</text>
                  </svg>
                </div>

                <div className="flex flex-col gap-1 bg-slate-900/90 p-2 rounded-xl border border-slate-700 text-left">
                  <span className="text-[9px] font-mono text-amber-300 font-bold flex items-center gap-1">
                    <span>🛰️</span> GPS Triangulation
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                    <span>🏗️</span> Civil Engineering
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <span>🎮</span> 3D Graphics & CGI
                  </span>
                </div>
              </div>
            ) : (
              /* Phase 1: 90° Triangle Fundamentals */
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
            )}

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

        {/* 11. SOLAR & LUNAR ECLIPSE / PLANETARY SHADOW OPTICS */}
        {layout === 'solar-eclipse' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1.5 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '24s' }} />
                {titleText.includes('lunar') ? 'Lunar Eclipse (Earth Blocks Sun)' : 'Solar Eclipse (Moon Blocks Sun)'}
              </span>
              <span className="text-[9px] font-mono bg-amber-950/90 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                {isPlaying ? '☀️ Umbra & Penumbra Active' : 'Alignment Track'}
              </span>
            </div>

            {/* Eclipse Ray Optics Simulation */}
            <div className="flex-1 flex items-center justify-between relative min-h-[145px] px-2 sm:px-4 my-1">
              {/* 1. The Sun (Radiant Light Source) */}
              <div className="relative flex flex-col items-center shrink-0 z-20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 shadow-[0_0_35px_rgba(251,191,36,0.9)] flex items-center justify-center relative animate-pulse">
                  <span className="text-2xl sm:text-3xl select-none">☀️</span>
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300/60 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                </div>
                <span className="text-[9px] font-mono font-black text-amber-300 mt-1 uppercase tracking-wider">
                  The Sun
                </span>
                <span className="text-[7.5px] font-mono text-amber-200/80 bg-amber-950/60 px-1 rounded">
                  Light Source
                </span>
              </div>

              {/* SVG Ray Tracing & Umbra/Penumbra Shadow Cone */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <svg viewBox="0 0 360 140" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="umbraCone" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="rgba(0,0,0,0.9)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.98)" />
                    </linearGradient>
                    <linearGradient id="penumbraCone" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="rgba(245,158,11,0.25)" />
                      <stop offset="100%" stopColor="rgba(15,23,42,0.4)" />
                    </linearGradient>
                  </defs>

                  {/* Ray Lines from Sun to Moon to Earth */}
                  <line x1="50" y1="40" x2="180" y2="60" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="50" y1="100" x2="180" y2="80" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* Outer Penumbra Cone */}
                  <polygon points="180,55 310,32 310,108 180,85" fill="url(#penumbraCone)" />
                  
                  {/* Inner Dark Umbra Cone */}
                  <polygon points="180,62 310,66 310,74 180,78" fill="url(#umbraCone)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                  
                  {/* Crossed Light Rays creating Penumbra */}
                  <line x1="50" y1="40" x2="310" y2="108" stroke="rgba(251,191,36,0.35)" strokeWidth="1" strokeDasharray="4 2" />
                  <line x1="50" y1="100" x2="310" y2="32" stroke="rgba(251,191,36,0.35)" strokeWidth="1" strokeDasharray="4 2" />
                </svg>
              </div>

              {/* 2. The Moon (The Intersecting Celestial Body) */}
              <div className="relative flex flex-col items-center shrink-0 z-20">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-slate-950 via-slate-700 to-slate-400 border border-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.4)] flex items-center justify-center transition-all duration-700 ${isPlaying ? 'scale-110 shadow-[0_0_20px_#fde047]' : ''}`}>
                  <span className="text-base sm:text-lg select-none">🌑</span>
                </div>
                <span className="text-[9px] font-mono font-black text-slate-200 mt-1 uppercase tracking-wider">
                  Moon
                </span>
                <span className="text-[7.5px] font-mono text-cyan-300 bg-slate-900/90 px-1 rounded border border-cyan-500/30">
                  Blocks Sun
                </span>
              </div>

              {/* 3. The Earth (Observer with Cast Shadow) */}
              <div className="relative flex flex-col items-center shrink-0 z-20">
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-500 shadow-[0_0_22px_rgba(56,189,248,0.7)] flex items-center justify-center relative overflow-hidden border border-sky-300/50">
                  <span className="text-xl sm:text-2xl select-none">🌍</span>
                  {/* Umbra Zone Spot on Earth Surface */}
                  <div className="absolute top-1/2 left-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black border border-white/60 shadow-[0_0_8px_black] animate-pulse">
                    <span className="absolute -top-3.5 -left-3 text-[7px] font-mono text-yellow-300 font-black whitespace-nowrap bg-black/90 px-1 rounded border border-yellow-300/40">
                      Totality!
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-black text-sky-200 mt-1 uppercase tracking-wider">
                  Earth
                </span>
                <span className="text-[7.5px] font-mono text-emerald-300 bg-slate-900/90 px-1 rounded border border-emerald-500/30">
                  Observer
                </span>
              </div>
            </div>

            {/* Educational Optical Legend Bar */}
            <div className="flex justify-between items-center bg-slate-900/95 px-3 py-1.5 rounded-xl border border-white/10 text-[9.5px] font-mono text-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black border border-white" />
                <span className="text-slate-300"><strong>Umbra:</strong> 100% Sun Blocked (Total Dark)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/50 border border-amber-300" />
                <span className="text-amber-200"><strong>Penumbra:</strong> Partial Shadow</span>
              </div>
              <span className="text-yellow-300 font-bold hidden sm:inline">
                Syzygy Straight Line Alignment ✨
              </span>
            </div>
          </div>
        )}

        {/* 12. OPTICS, PRISM & LIGHT REFRACTION */}
        {layout === 'optics-light' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1.5 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                Optics: Dispersion of White Light through Prism
              </span>
              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-400/40">
                VIBGYOR Spectrum
              </span>
            </div>

            {/* SVG Prism & Rainbow Refraction Ray Diagram */}
            <div className="flex-1 flex items-center justify-center relative min-h-[140px] my-1">
              <svg viewBox="0 0 340 130" className="w-full h-full">
                {/* Incident White Ray */}
                <line x1="20" y1="75" x2="120" y2="65" stroke="#FFFFFF" strokeWidth="3" />
                <text x="35" y="60" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">White Light Beam</text>

                {/* Glass Triangular Prism */}
                <polygon points="150,20 110,110 190,110" fill="rgba(56,189,248,0.2)" stroke="#38BDF8" strokeWidth="2" />
                <text x="150" y="105" fill="#38BDF8" fontSize="8" textAnchor="middle" fontWeight="bold">Glass Prism</text>

                {/* Internal Refraction rays */}
                <line x1="120" y1="65" x2="160" y2="55" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="120" y1="65" x2="165" y2="75" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Refracted Spectrum Rays (VIBGYOR) */}
                <line x1="160" y1="55" x2="310" y2="30" stroke="#EF4444" strokeWidth="2.5" /> {/* Red */}
                <line x1="161" y1="58" x2="310" y2="44" stroke="#F97316" strokeWidth="2" />   {/* Orange */}
                <line x1="162" y1="62" x2="310" y2="58" stroke="#EAB308" strokeWidth="2" />   {/* Yellow */}
                <line x1="163" y1="66" x2="310" y2="72" stroke="#22C55E" strokeWidth="2" />   {/* Green */}
                <line x1="164" y1="70" x2="310" y2="86" stroke="#06B6D4" strokeWidth="2" />   {/* Blue */}
                <line x1="165" y1="73" x2="310" y2="100" stroke="#6366F1" strokeWidth="2" />  {/* Indigo */}
                <line x1="165" y1="75" x2="310" y2="114" stroke="#A855F7" strokeWidth="2.5" />{/* Violet */}

                {/* Spectrum Screen Receiver */}
                <rect x="312" y="25" width="4" height="95" fill="#FFFFFF" rx="2" />
                <text x="320" y="34" fill="#EF4444" fontSize="8" fontWeight="bold">R (700nm)</text>
                <text x="320" y="74" fill="#22C55E" fontSize="8" fontWeight="bold">G (530nm)</text>
                <text x="320" y="118" fill="#A855F7" fontSize="8" fontWeight="bold">V (400nm)</text>
              </svg>
            </div>

            <div className="text-center text-[10px] font-mono text-cyan-200 bg-slate-900/90 py-1 px-3 rounded-lg border border-white/5">
              Refraction Angle is Inversely Proportional to Wavelength: Violet bends most, Red bends least!
            </div>
          </div>
        )}

        {/* 13. HUMAN HEART & BLOOD CIRCULATION */}
        {layout === 'human-heart' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1.5 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-rose-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Heart className={`h-3.5 w-3.5 text-rose-500 ${isPlaying ? 'animate-bounce' : ''}`} />
                Cardiac System: Double Circulation & 4 Chambers
              </span>
              <span className="text-[9px] font-mono bg-rose-950 text-rose-200 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                Pulse: 72 BPM 💓
              </span>
            </div>

            {/* Heart 4-Chamber Anatomical Visual */}
            <div className="flex-1 flex items-center justify-center gap-4 relative min-h-[140px] my-1">
              {/* Heart Chambers Card */}
              <div className="relative w-48 h-32 rounded-3xl bg-slate-900/90 border-2 border-rose-500/40 p-2 grid grid-cols-2 gap-1.5 shadow-xl">
                {/* Right Atrium (Deoxygenated) */}
                <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[8px] font-mono font-bold text-blue-300 uppercase">Right Atrium</span>
                  <span className="text-[7.5px] font-mono text-blue-400">Receives Deox Blood ⬇️</span>
                </div>
                {/* Left Atrium (Oxygenated) */}
                <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[8px] font-mono font-bold text-rose-300 uppercase">Left Atrium</span>
                  <span className="text-[7.5px] font-mono text-rose-400">Oxygen-Rich from Lungs 🫁</span>
                </div>
                {/* Right Ventricle */}
                <div className="bg-blue-900/80 border border-blue-500/40 rounded-xl p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[8px] font-mono font-bold text-blue-200 uppercase">Right Ventricle</span>
                  <span className="text-[7.5px] font-mono text-blue-300">Pumps to Lungs ➔</span>
                </div>
                {/* Left Ventricle (Strongest Muscle) */}
                <div className="bg-rose-900/80 border border-rose-500/40 rounded-xl p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[8px] font-mono font-bold text-rose-200 uppercase">Left Ventricle</span>
                  <span className="text-[7.5px] font-mono text-rose-300">Pumps to Entire Body (Aorta) 🚀</span>
                </div>
              </div>

              {/* Circulation Legend */}
              <div className="flex flex-col gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-white/10 text-left font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[9px] text-blue-300">Deoxygenated (CO₂)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[9px] text-rose-300">Oxygenated (O₂)</span>
                </div>
                <span className="text-[8px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Valves Prevent Backflow 🔒
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-300 bg-slate-900/80 py-1 px-3 rounded-lg border border-white/5">
              Pulmonary Circuit (To Lungs) + Systemic Circuit (To Body) = Perpetual Vital Life Engine!
            </div>
          </div>
        )}

        {/* 14. ELECTRIC CIRCUIT & CURRENT FLOW */}
        {layout === 'electric-circuit' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1.5 select-none">
            <div className="flex justify-between items-center w-full px-2">
              <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Electric Circuit: Potential Difference & Electron Flow
              </span>
              <span className="text-[9px] font-mono bg-amber-950 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/40">
                V = I × R (Ohm's Law)
              </span>
            </div>

            {/* Circuit Diagram */}
            <div className="flex-1 flex items-center justify-center relative min-h-[140px] my-1">
              <svg viewBox="0 0 320 130" className="w-full h-full">
                {/* Circuit Wires */}
                <rect x="40" y="25" width="240" height="80" rx="8" fill="none" stroke="#64748B" strokeWidth="3" />

                {/* Battery on Left */}
                <rect x="34" y="50" width="12" height="30" fill="#F59E0B" rx="2" />
                <line x1="30" y1="60" x2="30" y2="70" stroke="#EF4444" strokeWidth="3" />
                <text x="24" y="68" fill="#EF4444" fontSize="10" fontWeight="bold">+</text>
                <text x="24" y="88" fill="#38BDF8" fontSize="10" fontWeight="bold">-</text>
                <text x="40" y="98" fill="#FCD34D" fontSize="8" fontWeight="bold" fontFamily="monospace">9V DC</text>

                {/* Switch on Top Wire */}
                <circle cx="130" cy="25" r="4" fill="#38BDF8" />
                <circle cx="170" cy="25" r="4" fill="#38BDF8" />
                <line x1="130" y1="25" x2="168" y2="25" stroke="#22C55E" strokeWidth="2.5" />
                <text x="150" y="16" fill="#4ADE80" fontSize="8" textAnchor="middle" fontWeight="bold">Switch (Closed)</text>

                {/* Resistor / Load on Right */}
                <g transform="translate(280, 50)">
                  <path d="M0,0 L-6,6 L6,12 L-6,18 L6,24 L-6,30 L0,36" fill="none" stroke="#F97316" strokeWidth="2" />
                  <text x="12" y="22" fill="#FDBA74" fontSize="8" fontWeight="bold">R = 10Ω</text>
                </g>

                {/* Glowing Light Bulb on Bottom Wire */}
                <g transform="translate(160, 105)">
                  {/* Glowing Aura */}
                  <circle cx="0" cy="0" r="16" fill="rgba(251,191,36,0.25)" className="animate-pulse" />
                  <circle cx="0" cy="0" r="10" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5" />
                  <line x1="-12" y1="-12" x2="-8" y2="-8" stroke="#FDE047" strokeWidth="1.5" />
                  <line x1="12" y1="-12" x2="8" y2="-8" stroke="#FDE047" strokeWidth="1.5" />
                  <line x1="0" y1="-14" x2="0" y2="-10" stroke="#FDE047" strokeWidth="1.5" />
                  <text x="0" y="20" fill="#FDE047" fontSize="8" textAnchor="middle" fontWeight="bold">Glowing Bulb 💡</text>
                </g>

                {/* Electron Flow Moving Dots */}
                <circle cx="80" cy="25" r="2.5" fill="#38BDF8" className="animate-ping" />
                <circle cx="230" cy="25" r="2.5" fill="#38BDF8" className="animate-ping" style={{ animationDelay: '0.4s' }} />
                <circle cx="280" cy="85" r="2.5" fill="#38BDF8" className="animate-ping" style={{ animationDelay: '0.8s' }} />
                <circle cx="80" cy="105" r="2.5" fill="#38BDF8" className="animate-ping" style={{ animationDelay: '1.2s' }} />
              </svg>
            </div>

            <div className="text-center text-[10px] font-mono text-slate-300 bg-slate-900/80 py-1 px-3 rounded-lg border border-white/5">
              Electrons flow from Negative (-) to Positive (+) terminal, creating steady electric current!
            </div>
          </div>
        )}

        {/* 15. DYNAMIC CUSTOM SVG INJECTION (Gemini Native SVG Generator) */}
        {layout === 'dynamic-svg' && slide.svgVisual && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-1.5 select-none">
            <div className="flex justify-between items-center w-full px-2 mb-1">
              <span className="text-[10px] font-mono text-emerald-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                {slide.visualAttributes?.stepTitle || slide.title}
              </span>
              <span className="text-[8px] font-mono bg-emerald-950 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Vector Precision
              </span>
            </div>

            <div 
              className="flex-1 flex items-center justify-center relative min-h-[140px] overflow-hidden rounded-xl bg-slate-950/90 border border-white/5 p-2 [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-[150px]"
              dangerouslySetInnerHTML={{ __html: slide.svgVisual }}
            />

            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {keywords.map((kw, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-[#F2CC8F]">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 16. REVAMPED UNIVERSAL CONCEPT ARCHITECTURE FLOW (Eliminates the basic empty circles!) */}
        {layout === 'conceptual-flow' && (
          <div className="w-full h-full flex flex-col justify-between relative z-10 p-2">
            <div className="flex justify-between items-center w-full pb-1 border-b border-white/10 mb-2">
              <span className="text-[10px] font-mono text-[#F2CC8F] font-bold uppercase tracking-widest truncate max-w-[240px]">
                {slide.visualAttributes?.stepTitle || slide.title}
              </span>
              <span className="text-[9px] bg-slate-900 text-emerald-300 font-mono font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Step-by-Step Flow
              </span>
            </div>

            {/* 3-Stage Connected Concept Architecture Cards */}
            <div className="flex-1 flex items-center justify-between gap-1.5 sm:gap-2 relative min-h-[135px] my-1">
              {/* Stage 1: Observation / Cause */}
              <div className="flex-1 bg-slate-900/90 border border-amber-500/30 rounded-xl p-2 flex flex-col justify-between h-full relative overflow-hidden shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Phase 1
                  </span>
                  <span className="text-xs">💡</span>
                </div>
                <h5 className="text-[10px] sm:text-[11px] font-bold text-white line-clamp-2 leading-tight">
                  {keywords[0] ? keywords[0].toUpperCase() : 'ORIGIN & CAUSE'}
                </h5>
                <p className="text-[8.5px] text-slate-300 line-clamp-2 font-sans mt-0.5">
                  {slide.bullets[0] || 'Initial concept conditions and background factors'}
                </p>
                <div className="h-1 w-full bg-amber-500/30 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-amber-400 w-full animate-pulse" />
                </div>
              </div>

              {/* Connecting Glow Arrow 1 ➔ 2 */}
              <div className="flex flex-col items-center shrink-0">
                <ArrowRight className="h-4 w-4 text-[#F2CC8F] animate-pulse" />
              </div>

              {/* Stage 2: Active Working Mechanism */}
              <div className="flex-1 bg-slate-900/95 border-2 border-emerald-400/50 rounded-xl p-2 flex flex-col justify-between h-full relative overflow-hidden shadow-lg scale-102">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    Mechanism
                  </span>
                  <span className="text-xs animate-spin" style={{ animationDuration: '6s' }}>⚙️</span>
                </div>
                <h5 className="text-[10px] sm:text-[11px] font-black text-emerald-300 line-clamp-2 leading-tight">
                  {keywords[1] ? keywords[1].toUpperCase() : 'ACTIVE PROCESS'}
                </h5>
                <p className="text-[8.5px] text-slate-200 line-clamp-2 font-sans mt-0.5">
                  {slide.bullets[1] || 'Core scientific reaction, rule, or mechanism'}
                </p>
                <div className="h-1 w-full bg-emerald-500/30 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-400 w-full animate-pulse" />
                </div>
              </div>

              {/* Connecting Glow Arrow 2 ➔ 3 */}
              <div className="flex flex-col items-center shrink-0">
                <ArrowRight className="h-4 w-4 text-emerald-400 animate-pulse" />
              </div>

              {/* Stage 3: Result & Outcome */}
              <div className="flex-1 bg-slate-900/90 border border-sky-500/30 rounded-xl p-2 flex flex-col justify-between h-full relative overflow-hidden shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/30">
                    Result
                  </span>
                  <span className="text-xs">🎯</span>
                </div>
                <h5 className="text-[10px] sm:text-[11px] font-bold text-white line-clamp-2 leading-tight">
                  {keywords[2] ? keywords[2].toUpperCase() : 'APPLICATION'}
                </h5>
                <p className="text-[8.5px] text-slate-300 line-clamp-2 font-sans mt-0.5">
                  {slide.bullets[2] || 'Final impact, observation, or practical application'}
                </p>
                <div className="h-1 w-full bg-sky-500/30 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-sky-400 w-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Bottom Tag Bar */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {keywords.map((kw, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-900/80 border border-white/10 rounded-md text-[9px] font-mono text-[#F2CC8F]">
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
