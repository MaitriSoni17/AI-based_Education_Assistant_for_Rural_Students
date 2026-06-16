import { useState, useEffect } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';

interface InteractiveAITeacherProps {
  avatarChar: string;
  avatarName: string;
  action: 'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think';
  isPlaying: boolean;
  themeColor?: string;
  className?: string;
}

export default function InteractiveAITeacher({
  avatarChar,
  avatarName,
  action,
  isPlaying,
  className = ""
}: InteractiveAITeacherProps) {
  const [blink, setBlink] = useState(false);
  const [mouthStep, setMouthStep] = useState(0);
  const [eyeLook, setEyeLook] = useState<'center' | 'left' | 'right' | 'up'>('center');
  const [earTwitch, setEarTwitch] = useState(false);

  // Parse teacher type
  let teacherType: 'dadi' | 'swami' | 'chanda' | 'generic' = 'generic';
  if (avatarChar.includes('👵') || avatarName.toLowerCase().includes('dadi')) {
    teacherType = 'dadi';
  } else if (avatarChar.includes('🤖') || avatarName.toLowerCase().includes('swami')) {
    teacherType = 'swami';
  } else if (avatarChar.includes('🦊') || avatarName.toLowerCase().includes('chanda')) {
    teacherType = 'chanda';
  }

  // Periodic Blink cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Ear twitching for Chanda Fox 🦊
  useEffect(() => {
    if (teacherType !== 'chanda') return;
    const twitchInterval = setInterval(() => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 300);
    }, 6000);
    return () => clearInterval(twitchInterval);
  }, [teacherType]);

  // Eye movement changes to look around naturally
  useEffect(() => {
    if (action === 'think') {
      setEyeLook('up');
      return;
    }
    if (action === 'idea') {
      setEyeLook('center');
      return;
    }

    const lookInterval = setInterval(() => {
      const looks: ('center' | 'left' | 'right')[] = ['center', 'center', 'left', 'right'];
      const randomLook = looks[Math.floor(Math.random() * looks.length)];
      setEyeLook(randomLook);
    }, 3800);
    return () => clearInterval(lookInterval);
  }, [action]);

  // Lip Sync animation cycle with realistic variable-tempo phonetic timing
  useEffect(() => {
    if (!isPlaying) {
      setMouthStep(0);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      setMouthStep((prev) => {
        // Organically transition to a different mouth shape to simulate natural phoneme variance
        const choices = [0, 1, 2, 3];
        let next = prev;
        // High probability of shifting to another mouth shape rather than repeating standard frame
        if (Math.random() > 0.15) {
          const alternateChoices = choices.filter(c => c !== prev);
          next = alternateChoices[Math.floor(Math.random() * alternateChoices.length)];
        } else {
          next = prev;
        }
        return next;
      });

      // Assign organic speech cadence timings depending on the mouth shape simulation:
      // - Step 0 (Closed/Consonant Stops like P, B, M): Short snappy holds (40ms - 90ms) or micro word pauses
      // - Step 1 (Wide Open 'Ah' Vowels): Longer resonant emphasis holds (150ms - 240ms)
      // - Step 2 & 3 (Fluent Transition vowels 'Eh', 'Oo'): Medium organic cadences (100ms - 170ms)
      let nextDuration = 130;
      const currentStepRoll = Math.random();

      if (currentStepRoll < 0.25) {
        // Snappy transition / stop consonant
        nextDuration = Math.floor(Math.random() * 50) + 40; // 40ms - 90ms
      } else if (currentStepRoll < 0.65) {
        // Dwell resonance vowel timing
        nextDuration = Math.floor(Math.random() * 90) + 150; // 150ms - 240ms
      } else {
        // Standard conversational pacing
        nextDuration = Math.floor(Math.random() * 70) + 100; // 100ms - 170ms
      }

      timeoutId = setTimeout(tick, nextDuration);
    };

    // Kickstart recursive organic speaker schedule
    timeoutId = setTimeout(tick, 100);

    return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  // Determine mouth scale based on talking state & step - with realistic pink tongue and teeth drawings
  const renderInteractiveMouth = () => {
    if (!isPlaying) {
      return (
        <div className="absolute bottom-6 flex flex-col items-center justify-center z-20">
          {/* A sweet, subtle smiling curve lips */}
          <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="transition-all duration-300">
            <path d="M4 2C12 9 28 9 36 2" stroke="#4A1E1E" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    // Interactive speaking lip movements containing inner mouth detail (realistic teeth/pink tongue tongue!)
    switch (mouthStep) {
      case 1: // Open Wide 'Ah'
        return (
          <div className="absolute bottom-4.5 w-8 h-6.5 bg-[#4A1E1E] rounded-b-2xl rounded-t-lg border-2 border-[#E07A5F] flex flex-col justify-between overflow-hidden shadow-inner z-20 transition-all duration-100">
            {/* White upper teeth curve */}
            <div className="w-full h-1.5 bg-white rounded-b-md" />
            {/* Pink glowing tongue */}
            <div className="w-6 h-3 bg-rose-400 rounded-t-full self-center" />
          </div>
        );
      case 2: // Semi closed 'Eh'
        return (
          <div className="absolute bottom-5.5 w-7.5 h-3.5 bg-[#4A1E1E] rounded-b-lg rounded-t-xs border border-[#E07A5F] flex flex-col justify-between overflow-hidden shadow-inner z-20 transition-all duration-100">
            <div className="w-full h-1 bg-white" />
            <div className="w-5 h-2 bg-rose-400 rounded-t-full self-center" />
          </div>
        );
      case 3: // 'Oo' circular shape
        return (
          <div className="absolute bottom-5 w-5 h-5 bg-[#4A1E1E] rounded-full border-2 border-[#E07A5F] flex items-center justify-center overflow-hidden shadow-inner z-20 transition-all duration-100">
            <div className="w-2.5 h-2.5 bg-rose-400 rounded-full mt-2" />
          </div>
        );
      default: // Normal speaking aperture
        return (
          <div className="absolute bottom-5 w-8 h-4.5 bg-[#4A1E1E] rounded-b-xl border border-[#E07A5F] flex flex-col justify-between overflow-hidden shadow-inner z-20 transition-all duration-100">
            <div className="w-full h-0.5 bg-white" />
            <div className="w-5 h-2 bg-rose-400 rounded-t-md self-center" />
          </div>
        );
    }
  };

  // Robot futuristic LED sound response matrix
  const renderRobotMouth = () => {
    if (!isPlaying) {
      return (
        <div className="h-1.5 w-10 bg-cyan-400 rounded-sm shadow-[0_0_10px_rgba(34,211,238,0.9)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
        </div>
      );
    }

    switch (mouthStep) {
      case 1: // Max aperture spectrum
        return (
          <div className="flex items-center gap-0.5 h-4 w-12 transition-all">
            <div className="h-2 w-1.5 bg-cyan-400 rounded-xs shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            <div className="h-4 w-1.5 bg-cyan-300 rounded-xs shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />
            <div className="h-3 w-1.5 bg-cyan-400 rounded-xs shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="h-4 w-1.5 bg-cyan-300 rounded-xs shadow-[0_0_10px_rgba(34,211,238,1)]" />
            <div className="h-2 w-1.5 bg-cyan-400 rounded-xs shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          </div>
        );
      case 2: // Minimal buzz
        return (
          <div className="flex items-center gap-0.5 h-1 w-12 justify-center">
            <div className="h-1 w-10 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.7)]" />
          </div>
        );
      case 3: // Round frequency pulse
        return (
          <div className="flex items-center gap-0.5 h-3 w-12 justify-center">
            <div className="h-2 w-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="h-3 w-3 bg-cyan-300 rounded-full shadow-[0_0_12px_rgba(34,211,238,1)]" />
            <div className="h-2 w-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
        );
      default: // Normal sound bar response
        return (
          <div className="flex items-center gap-0.5 h-2.5 w-12 justify-center">
            <div className="h-1 text-cyan-400 font-bold tracking-widest text-[8px] animate-pulse">🔊</div>
            <div className="h-2 w-8 bg-cyan-400 rounded-xs shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
        );
    }
  };

  // Convert looks coordinates for eyes
  const getEyeBallOffset = () => {
    switch (eyeLook) {
      case 'left': return '-translate-x-1 translate-y-0';
      case 'right': return 'translate-x-1 translate-y-0';
      case 'up': return 'translate-x-0 -translate-y-1';
      default: return 'translate-x-0 translate-y-0';
    }
  };

  // 1. Render Dadi AI details 👵
  const renderDadiFace = () => {
    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-center scale-95 origin-center">
        {/* Grey Bun Hair on top with multi-layer shading */}
        <div className="absolute top-1 w-11 h-11 rounded-full bg-gradient-to-b from-gray-100 via-gray-300 to-gray-400 border border-gray-400 shadow-xs z-0" />
        {/* Bun hair clasp pin details */}
        <div className="absolute top-2 w-6 h-1.5 bg-amber-500 rounded-full z-0 rotate-15" />

        {/* Head Canvas with 3D gradient skin depth */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#FCE1D4] via-[#F5D6C6] to-[#E9BEA8] border-3 border-white shadow-lg flex flex-col items-center overflow-visible z-10 transition-transform duration-300 select-none">
          
          {/* Grey Front parted hair overlay with realistic combed lines */}
          <div className="absolute top-0 inset-x-0 h-9 bg-gradient-to-b from-gray-200 to-gray-300 rounded-t-full border-b border-gray-400/50 overflow-hidden flex">
            <div className="w-1/2 h-full bg-gradient-to-br from-gray-100 to-gray-300 border-r border-gray-400/40 rounded-br-2xl" />
            <div className="w-1/2 h-full bg-gradient-to-bl from-gray-100 to-gray-300 rounded-bl-2xl" />
          </div>

          {/* Red and Gold Kundan Bindi */}
          <div className="absolute top-9.5 w-3 h-3 bg-rose-600 rounded-full shadow-xs border border-amber-400 flex items-center justify-center">
            <div className="w-1 h-1 bg-amber-200 rounded-full" />
          </div>

          {/* Eyebrows (animated and expressive) */}
          <div className="flex justify-between w-18 absolute top-12">
            <div className={`h-1.5 w-5 bg-gray-500/80 rounded-full transition-transform duration-300 ${action === 'think' ? 'rotate-15 translate-y-0.5' : '-rotate-3'}`} />
            <div className={`h-1.5 w-5 bg-gray-500/80 rounded-full transition-transform duration-300 ${action === 'think' ? '-rotate-15 translate-y-0.5' : 'rotate-3'}`} />
          </div>

          {/* Golden Grandma Glasses 👓 - Extremely detailed and 3D */}
          <div className="absolute top-12.5 flex justify-between w-21 z-20">
            {/* Left rim */}
            <div className="w-9 h-9 rounded-full border-2.5 border-amber-400 bg-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center relative">
              {/* Eye Pupils inside detailed brown iris */}
              {blink ? (
                <div className="h-0.5 w-5 bg-[#3B2314] rounded-full" />
              ) : (
                <div className={`w-4 h-4 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  {/* Iris highlighting */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#523A28] flex items-center justify-center">
                    {/* Pupil reflex sparkle */}
                    <div className="w-1 h-1 bg-white rounded-full absolute top-1 left-1" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Glasses bridge */}
            <div className="w-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 h-1 mt-4 shadow-xs" />
            
            {/* Right rim */}
            <div className="w-9 h-9 rounded-full border-2.5 border-amber-400 bg-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center relative">
              {/* Eye Pupils */}
              {blink ? (
                <div className="h-0.5 w-5 bg-[#3B2314] rounded-full" />
              ) : (
                <div className={`w-4 h-4 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  {/* Iris highlighting */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#523A28] flex items-center justify-center">
                    {/* Pupil reflex sparkle */}
                    <div className="w-1 h-1 bg-white rounded-full absolute top-1 left-1" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Realistic Nose ridge with subtle drop shadow */}
          <div className="absolute top-20.5 w-2 h-3.5 bg-gradient-to-b from-[#E9BEA8] to-[#D5A790] rounded-full border-b border-white/20 shadow-2xs z-10" />

          {/* Rosy blush cheeks & soft wrinkles */}
          <div className="flex justify-between w-22 absolute top-20 px-0.5 opacity-60">
            <div className="w-4 h-2.5 bg-rose-300 rounded-full blur-[1px]" />
            <div className="w-4 h-2.5 bg-rose-300 rounded-full blur-[1px]" />
          </div>

          {/* Lip synced Mouth */}
          {renderInteractiveMouth()}

          {/* Wrinkle creases mapping */}
          <div className="absolute bottom-6.5 left-3.5 w-1 h-2 border-l border-[#A77B65]/40 rounded-full" />
          <div className="absolute bottom-6.5 right-3.5 w-1 h-2 border-r border-[#A77B65]/40 rounded-full" />
        </div>

        {/* 3D Coordinated shoulders for Dadi (Warm Embroidered traditional Red Saree drape) */}
        <div className="absolute bottom-[-18px] w-28 h-12 bg-gradient-to-r from-red-800 via-rose-700 to-red-800 rounded-t-3xl border-t-2 border-amber-300/40 shadow-md overflow-hidden flex justify-center z-5 select-none font-sans font-extrabold text-[8px] text-white">
          {/* Beautiful golden embroidery patterns (Zari work mockup) */}
          <div className="w-full h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 flex justify-around px-2 items-center text-[7px] font-mono shrink-0 select-none">
            <span>✨</span><span>💠</span><span>✨</span><span>💠</span><span>✨</span>
          </div>
        </div>
      </div>
    );
  };

  // 2. Render Swami AI Robot (Science/Tech Expert) 🤖 - High Fidelity Cyber-Engine
  const renderSwamiFace = () => {
    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-center scale-95 origin-center">
        {/* Industrial detailed double-antenna */}
        <div className="absolute top-2 flex justify-between w-8 h-8">
          <div className="relative w-1.5 h-6 bg-gradient-to-b from-slate-400 to-slate-600 flex flex-col items-center">
            <div className={`w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white absolute -top-3 shadow-[0_0_10px_rgba(34,211,238,0.9)] ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="relative w-1.5 h-6 bg-gradient-to-b from-slate-400 to-slate-600 flex flex-col items-center">
            <div className={`w-3.5 h-3.5 rounded-full bg-amber-400 border border-white absolute -top-3 shadow-[0_0_10px_rgba(245,158,11,0.9)]`} />
          </div>
        </div>

        {/* Deep Steel Chamfered Head Canvas */}
        <div className="relative w-28 h-27 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl border-3 border-slate-300/90 shadow-2xl flex flex-col items-center justify-center overflow-visible z-10 mt-6 shrink-0">
          
          {/* Metallic Side bolts with realistic screw slots */}
          <div className="absolute -left-2.5 top-9 w-2.5 h-5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 rounded-l flex items-center justify-center">
            <div className="w-0.5 h-3 bg-slate-800" />
          </div>
          <div className="absolute -right-2.5 top-9 w-2.5 h-5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 rounded-r flex items-center justify-center">
            <div className="w-0.5 h-3 bg-slate-800" />
          </div>

          {/* Status diagnostics center badge with glowing LEDs */}
          <div className="absolute top-2 w-14 h-3 bg-slate-950 rounded-md border border-slate-700 flex justify-between items-center px-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="h-1 w-6 bg-cyan-500/20 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-cyan-400 animate-shimmer" />
            </div>
          </div>

          {/* Panoramic Cyberspace Visor Display Glass */}
          <div className="w-23 h-11 bg-slate-950 rounded-xl border-1.5 border-slate-700 flex justify-between items-center px-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative overflow-hidden my-1">
            {/* Holographic grid scanner overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

            {/* Glowing Scanline */}
            <div className="absolute top-0 inset-x-0 h-1/3 bg-cyan-400/10 blur-xs animate-bounce" />

            {/* Visor Left Eye */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative z-10">
              {blink ? (
                <div className="h-0.5 w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] rounded" />
              ) : action === 'think' ? (
                <span className="text-sm text-cyan-400 font-mono font-black scale-y-75 animate-bounce">?</span>
              ) : action === 'celebrate' || action === 'idea' ? (
                <span className="text-sm text-cyan-300 font-mono font-extrabold animate-pulse">^</span>
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-[#1e293b] border border-cyan-800 flex items-center justify-center relative transition-transform duration-300 ${getEyeBallOffset()}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] flex items-center justify-center">
                    {/* Concentric aperture circles */}
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Visor Right Eye */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative z-10">
              {blink ? (
                <div className="h-0.5 w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] rounded" />
              ) : action === 'think' ? (
                <span className="text-sm text-cyan-400 font-mono font-black scale-y-75 animate-bounce">?</span>
              ) : action === 'celebrate' || action === 'idea' ? (
                <span className="text-sm text-cyan-300 font-mono font-extrabold animate-pulse">^</span>
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-[#1e293b] border border-cyan-800 flex items-center justify-center relative transition-transform duration-300 ${getEyeBallOffset()}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sound wave LED talking mouth bar */}
          <div className="absolute bottom-5 flex items-center justify-center h-6 w-16">
            {renderRobotMouth()}
          </div>
        </div>

        {/* Chrome Metallic cybernetic shoulders with glowing power core */}
        <div className="absolute bottom-[-18px] w-28 h-12 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-t-3xl border-t-2 border-slate-500 shadow-md overflow-hidden flex flex-col items-center justify-end z-5 select-none">
          {/* Glowing neon fusion battery band */}
          <div className="w-14 h-2.5 bg-slate-950 rounded-t-lg border-x border-t border-cyan-500/20 p-0.5">
            <div className="h-full bg-cyan-400 rounded-xs shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  };

  // 3. Render Chanda AI Smart Fox 🦊 - Organic fur structures & organic twitch wiggles
  const renderChandaFace = () => {
    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-center scale-95 origin-center">
        {/* Detailed twitching pointy left fox ear */}
        <div className={`absolute -top-1 left-3 w-10.5 h-16 bg-gradient-to-b from-[#EA580C] to-[#C2410C] rounded-t-3xl border-2.5 border-white ${earTwitch ? 'animate-[bounce_0.25s_twice] rotate-[-16deg]' : '-rotate-12'} flex items-center justify-center overflow-hidden transition-transform z-0 shadow-smOrigin`}>
          <div className="w-5.5 h-11 bg-rose-150 rounded-t-2xl mt-3.5" />
        </div>

        {/* Detailed twitching pointy right fox ear */}
        <div className={`absolute -top-1 right-3 w-10.5 h-16 bg-gradient-to-b from-[#EA580C] to-[#C2410C] rounded-t-3xl border-2.5 border-white ${earTwitch ? 'animate-[bounce_0.25s_twice] rotate-[16deg]' : 'rotate-12'} flex items-center justify-center overflow-hidden transition-transform z-0 shadow-smOrigin`}>
          <div className="w-5.5 h-11 bg-rose-150 rounded-t-2xl mt-3.5" />
        </div>

        {/* Gorgeous Fox Face Canvas with complex cheeks fur projections */}
        <div className="relative w-28 h-28 bg-[#EA580C] rounded-full border-3 border-white shadow-xl flex flex-col items-center overflow-visible z-10 transition-transform duration-300 select-none">
          
          {/* Organic white fluffy inner cheek fur overlays projecting outwards */}
          <div className="absolute bottom-0 inset-x-0 h-13 flex justify-between z-0">
            <div className="w-12 h-13 bg-gradient-to-tr from-white via-white to-orange-50 rounded-t-3xl rounded-bl-3xl border-r border-[#EA580C]/20 shadow-xs" />
            <div className="w-12 h-13 bg-gradient-to-tl from-white via-white to-orange-50 rounded-t-3xl rounded-br-3xl border-l border-[#EA580C]/20 shadow-xs" />
          </div>

          {/* Expressive Arching Fox Eyebrows */}
          <div className="flex justify-between w-15 absolute top-11 z-10">
            <div className={`h-1.5 w-4.5 bg-amber-950 rounded-full transition-transform duration-300 ${action === 'think' ? 'rotate-12 translate-y-0.5' : '-rotate-6'}`} />
            <div className={`h-1.5 w-4.5 bg-amber-950 rounded-full transition-transform duration-300 ${action === 'think' ? '-rotate-12 translate-y-0.5' : 'rotate-6'}`} />
          </div>

          {/* High quality expressive Fox Eyes with beautiful forest-green irises */}
          <div className="flex justify-between w-18 absolute top-12.5 z-10">
            <div className="w-7 h-7 flex items-center justify-center relative">
              {blink ? (
                <div className="h-0.5 w-5 bg-[#3B2314] rounded-full" />
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#065F46] via-[#10B981] to-[#34D399] p-0.5 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  {/* Iris & pupil highlighting */}
                  <div className="w-3.5 h-3.5 rounded-full bg-[#111827] flex items-center justify-center relative">
                    {/* Tiny glowing reflections resembling animal eye depth */}
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" />
                    <div className="w-0.5 h-0.5 bg-white rounded-full absolute bottom-0.5 right-0.5" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-7 h-7 flex items-center justify-center relative">
              {blink ? (
                <div className="h-0.5 w-5 bg-[#3B2314] rounded-full" />
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#065F46] via-[#10B981] to-[#34D399] p-0.5 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#111827] flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" />
                    <div className="w-0.5 h-0.5 bg-white rounded-full absolute bottom-0.5 right-0.5" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Realistic Fox whiskers representing sensory realism */}
          <div className="absolute inset-y-17 inset-x-1 flex justify-between z-15 w-26">
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-amber-950/25 -rotate-6 rounded-full" />
              <div className="w-6 h-0.5 bg-amber-950/20 rounded-full" />
            </div>
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-amber-950/25 rotate-6 rounded-full" />
              <div className="w-6 h-0.5 bg-amber-950/20 rounded-full" />
            </div>
          </div>

          {/* Cute wet snout and black shiny button nose */}
          <div className="absolute bottom-9 w-6 h-5 flex flex-col items-center justify-center z-20">
            <div className="w-4 h-3 bg-gradient-to-b from-slate-800 to-black rounded-full shadow-md relative">
              {/* shiny spot on nose */}
              <div className="w-1 h-0.5 bg-white rounded-full absolute top-0.5 left-1" />
            </div>
          </div>

          {/* Lip synced Voice aligned Mouth */}
          {renderInteractiveMouth()}
        </div>

        {/* High-quality furry neck collar shoulders overlay for Chanda */}
        <div className="absolute bottom-[-18px] w-28 h-12 bg-gradient-to-r from-[#EA580C] via-orange-500 to-[#EA580C] rounded-t-3xl border-t-2 border-white/40 shadow-sm flex items-start justify-center overflow-visible z-5 select-none">
          {/* Fluffy white throat fur ruff */}
          <div className="w-18 h-7 bg-white rounded-b-2xl border-x border-b border-orange-200 shadow-md shadow-orange-950/10 flex flex-col justify-end p-1 select-none">
            <div className="w-full flex justify-around text-orange-200 font-black text-[6px]">
              <span>▼</span><span>▼</span><span>▼</span><span>▼</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 4. Render Generic AI Teacher Face - High quality Human avatar
  const renderGenericFace = () => {
    return (
      <div className="relative w-36 h-36 flex flex-col items-center justify-center scale-95 origin-center">
        {/* Slick neat stylized top hairstyle with gradients */}
        <div className="absolute top-1 w-24 h-12 bg-gradient-to-b from-amber-950 via-[#332211] to-amber-950 rounded-b-2xl rounded-t-3xl z-0" />

        {/* Head Canvas with elegant shading */}
        <div className="relative w-28 h-28 bg-[#FDF0D5] rounded-full border-3 border-white shadow-xl flex flex-col items-center overflow-visible z-10 transition-transform duration-300">
          
          {/* Expressive eyebrows */}
          <div className="flex justify-between w-15 absolute top-11 z-10">
            <div className="h-1 w-4.5 bg-[#4A3B32] rounded-full" />
            <div className="h-1 w-4.5 bg-[#4A3B32] rounded-full" />
          </div>

          {/* High-fidelity large anime eyes with gorgeous pupils */}
          <div className="flex justify-between w-18 absolute top-12.5 z-10">
            <div className="w-6.5 h-6.5 flex items-center justify-center relative">
              {blink ? (
                <div className="h-0.5 w-5 bg-slate-800 rounded-full" />
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-br from-amber-900 to-amber-950 p-0.5 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="w-6.5 h-6.5 flex items-center justify-center relative">
              {blink ? (
                <div className="h-0.5 w-5 bg-slate-800 rounded-full" />
              ) : (
                <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-br from-amber-900 to-amber-950 p-0.5 flex items-center justify-center transition-transform duration-300 ${getEyeBallOffset()}`}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rounded cute cartoon nose with shading */}
          <div className="absolute top-20 w-1.5 h-2.5 bg-[#E6D4B9] rounded-full" />

          {/* Talking Mouth */}
          {renderInteractiveMouth()}
        </div>

        {/* Polished shoulders with classic striped polo shirt */}
        <div className="absolute bottom-[-18px] w-28 h-12 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 rounded-t-3xl border-t-2 border-white shadow-md flex items-start justify-center z-5">
          {/* Collar shirt flap overlay */}
          <div className="w-12 h-4.5 bg-white rounded-b-xl flex justify-between px-1 shadow-xs border-x border-emerald-150">
            <div className="w-4 h-full bg-white border-r border-gray-150 rotate-15 cursor-pointer" />
            <div className="w-4 h-full bg-white border-l border-gray-150 -rotate-15 cursor-pointer" />
          </div>
        </div>
      </div>
    );
  };

  // Render hands connected via virtual visual sleeves extending inside the canvas
  const renderHands = () => {
    switch (action) {
      case 'wave':
        return (
          <>
            {/* Soft waving arm sleeve connecting body to hand */}
            <div className="absolute -right-5 top-1.5 w-12 h-12 bg-gradient-to-br from-white to-gray-55 border-2 border-[#E07A5F] rounded-full shadow-lg flex items-center justify-center text-xl animate-[bounce_0.4s_infinite] select-none [animation-duration:0.22s] rotate-12 z-25">
              👋
              {/* Dynamic light sparkles radiating off wavings */}
              <div className="absolute -top-1 -right-1 text-amber-400 text-xs animate-ping">✨</div>
            </div>
            <div className="absolute -left-3.5 bottom-0 w-11 h-11 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-lg animate-pulse z-25">
              🤝
            </div>
          </>
        );

      case 'idea':
        return (
          <>
            {/* Rest posture Left arm */}
            <div className="absolute -left-3 bottom-0 w-11 h-11 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-lg z-25">
              🤔
            </div>
            {/* Rich idea gesture pointing upwards with an interactive glowing direct energy stream */}
            <div className="absolute -right-6.5 top-0 flex flex-col items-center gap-1 z-25">
              <div className="bg-amber-400 p-1.5 rounded-full shadow-md border border-white animate-bounce">
                <Lightbulb className="h-4.5 w-4.5 text-white fill-current" />
              </div>
              <div className="w-12 h-12 bg-white border-2 border-amber-400 rounded-full shadow-lg flex items-center justify-center text-xl font-bold animate-[pulse_0.8s_infinite] border-amber-500">
                ☝️
              </div>
            </div>
          </>
        );

      case 'thumbsup':
        return (
          <>
            <div className="absolute -left-3 bottom-0 w-11 h-11 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-lg z-25">
              ✨
            </div>
            {/* Highly rendered thumbsup popping forward with layered bursts */}
            <div className="absolute -right-6.5 top-4 w-15 h-15 bg-white border-2 border-emerald-400 rounded-full shadow-2xl flex flex-col items-center justify-center text-2xl animate-[pulse_0.6s_infinite] z-25">
              👍
              {/* Glow particle bubble */}
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 absolute -top-1.5 -right-1.5 animate-bounce" />
            </div>
          </>
        );

      case 'celebrate':
        return (
          <>
            {/* Raised animated dual celebration hands */}
            <div className="absolute -left-6 top-1 w-12 h-12 bg-white border-2 border-amber-300 rounded-full shadow-lg flex items-center justify-center text-xl animate-[bounce_0.3s_infinite] [animation-delay:0.12s] z-25">
              🙌
            </div>
            <div className="absolute -right-6 top-1 w-12 h-12 bg-white border-2 border-amber-300 rounded-full shadow-lg flex items-center justify-center text-xl animate-[bounce_0.3s_infinite] z-25">
              🎉
            </div>
          </>
        );

      case 'think':
        return (
          <>
            <div className="absolute -left-3.5 bottom-0 w-11 h-11 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-lg opacity-40 z-25">
              💤
            </div>
            {/* Think hand on chin curve */}
            <div className="absolute left-9 bottom-3 w-11 h-11 bg-white border-2 border-amber-400 rounded-full shadow-md flex items-center justify-center text-lg z-25 animate-pulse border-amber-400">
              🤔
            </div>
          </>
        );

      case 'explaining':
        return (
          <>
            {/* Alternating moving pointers detailing presentation fields */}
            <div className="absolute -left-4 bottom-2 w-11 h-11 bg-white border-2 border-gray-150 rounded-full shadow-md flex items-center justify-center text-lg animate-[bounce_1.4s_infinite] z-25">
              👈
            </div>
            <div className="absolute -right-4 bottom-1 w-11 h-11 bg-white border-2 border-gray-150 rounded-full shadow-md flex items-center justify-center text-lg animate-[bounce_1.4s_infinite] [animation-delay:0.7s] z-25">
              👉
            </div>
          </>
        );

      default: // resting posture holding standard teaching tools
        return (
          <>
            <div className="absolute -left-3.5 bottom-0 w-10.5 h-10.5 bg-gradient-to-tr from-gray-50 to-white border border-gray-200 rounded-full shadow-xs flex items-center justify-center text-base opacity-95 z-25">
              🤝
            </div>
            <div className="absolute -right-3.5 bottom-0 w-10.5 h-10.5 bg-gradient-to-tr from-gray-50 to-white border border-[#E07A5F]/20 rounded-full shadow-xs flex items-center justify-center text-base opacity-95 z-25">
              📖
            </div>
          </>
        );
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      
      {/* Dynamic Keyframes injected into DOM for gorgeous breathing rhythm & twitches */}
      <style>{`
        @keyframes natural-breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.015); }
        }
        @keyframes subtle-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .ai-breath-cycle {
          animation: natural-breathe 4.5s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: subtle-shimmer 2s linear infinite;
        }
      `}</style>
      
      {/* Background card/ambient circle wrapper equipped with warm dynamic breathing cycle */}
      <div className="relative w-44 h-44 rounded-full bg-slate-900/40 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-white/20 transition-transform duration-500 scale-100 hover:scale-105 ai-breath-cycle">
        
        {/* Render Specific Real Character Face built with pristine overlapping vector shapes */}
        {teacherType === 'dadi' && renderDadiFace()}
        {teacherType === 'swami' && renderSwamiFace()}
        {teacherType === 'chanda' && renderChandaFace()}
        {teacherType === 'generic' && renderGenericFace()}

        {/* Floating Hands & Gestures sleeve overlay */}
        {renderHands()}

        {/* Ambient glow soundwaves pulsing on vocalization */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-4 border-[#E07A5F]/30 animate-pulse [animation-duration:1.2s] pointer-events-none" />
        )}
      </div>

      {/* Name Title label card */}
      <div className="mt-2 text-center">
        <span className="bg-[#E07A5F] text-white text-[10px] font-sans font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md select-none border border-white">
          {avatarName}
        </span>
      </div>
    </div>
  );
}
