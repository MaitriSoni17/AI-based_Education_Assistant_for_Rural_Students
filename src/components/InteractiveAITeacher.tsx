import { useState, useEffect } from 'react';

export interface InteractiveAITeacherProps {
  avatarChar?: string;
  avatarName?: string;
  action?: 'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think';
  isPlaying?: boolean;
  themeColor?: string;
  className?: string;
  minimal?: boolean;
}

export default function InteractiveAITeacher({
  avatarChar = "🤖 Swami AI",
  avatarName = "Swami AI",
  action = 'idle',
  isPlaying = false,
  className = "",
  minimal = false
}: InteractiveAITeacherProps) {
  const safeChar = avatarChar || "🤖 Swami AI";
  const safeName = avatarName || "Swami AI";

  const [blink, setBlink] = useState(false);
  const [mouthStep, setMouthStep] = useState(0);
  const [eyeLook, setEyeLook] = useState<'center' | 'left' | 'right' | 'up'>('center');
  const [earTwitch, setEarTwitch] = useState(false);

  // Parse teacher type
  let teacherType: 'dadi' | 'swami' | 'chanda' | 'ramanujan' | 'rocket' | 'anandi' | 'laxmi' | 'newton' | 'scholar' | 'eagle' | 'panther' | 'kisan' | 'nature' | 'generic' = 'generic';
  const charLower = (safeChar + " " + safeName).toLowerCase();
  
  if (safeChar.includes('👵') || charLower.includes('dadi') || charLower.includes('दादी') || charLower.includes('દાદી') || charLower.includes('பாட்டி')) {
    teacherType = 'dadi';
  } else if (safeChar.includes('💻') || charLower.includes('panther') || charLower.includes('turing') || charLower.includes('excel') || charLower.includes('computer') || charLower.includes('coding') || charLower.includes('tech')) {
    teacherType = 'panther';
  } else if (safeChar.includes('🤖') || (charLower.includes('swami') && !charLower.includes('panther')) || charLower.includes('robot')) {
    teacherType = 'swami';
  } else if (safeChar.includes('🦊') || charLower.includes('chanda') || charLower.includes('fox')) {
    teacherType = 'chanda';
  } else if (safeChar.includes('📐') || charLower.includes('ramanujan') || charLower.includes('math')) {
    teacherType = 'ramanujan';
  } else if (safeChar.includes('🚀') || charLower.includes('apj') || charLower.includes('rocket') || charLower.includes('kalam')) {
    teacherType = 'rocket';
  } else if (safeChar.includes('🧪') || charLower.includes('anandi') || charLower.includes('doctor') || charLower.includes('bio')) {
    teacherType = 'anandi';
  } else if (safeChar.includes('🛡️') || charLower.includes('laxmi') || charLower.includes('rani') || charLower.includes('shivaji') || charLower.includes('ashoka')) {
    teacherType = 'laxmi';
  } else if (safeChar.includes('🍎') || charLower.includes('newton')) {
    teacherType = 'newton';
  } else if (safeChar.includes('🦅') || charLower.includes('william') || charLower.includes('eagle')) {
    teacherType = 'eagle';
  } else if (safeChar.includes('🌾') || charLower.includes('kisan') || charLower.includes('farmer') || charLower.includes('agri')) {
    teacherType = 'kisan';
  } else if (safeChar.includes('🌿') || charLower.includes('prakriti') || charLower.includes('flora')) {
    teacherType = 'nature';
  } else if (safeChar.includes('📜') || safeChar.includes('✍️') || safeChar.includes('📖') || charLower.includes('narmad') || charLower.includes('premchand') || charLower.includes('kalidas') || charLower.includes('kavi') || charLower.includes('scholar')) {
    teacherType = 'scholar';
  }

  // Periodic Blink cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Ear twitching for Chanda Fox
  useEffect(() => {
    if (teacherType !== 'chanda') return;
    const twitchInterval = setInterval(() => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 250);
    }, 4500);
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
    }, 3200);
    return () => clearInterval(lookInterval);
  }, [action]);

  // Lip Sync animation cycle with variable phonetic cadence
  useEffect(() => {
    if (!isPlaying) {
      setMouthStep(0);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      setMouthStep((prev) => {
        const choices = [0, 1, 2, 3];
        const alternateChoices = choices.filter(c => c !== prev);
        return alternateChoices[Math.floor(Math.random() * alternateChoices.length)];
      });

      const nextDuration = Math.floor(Math.random() * 80) + 110;
      timeoutId = setTimeout(tick, nextDuration);
    };

    timeoutId = setTimeout(tick, 80);
    return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  // Pupil offsets for gaze
  const pupilDx = eyeLook === 'left' ? -2.2 : eyeLook === 'right' ? 2.2 : 0;
  const pupilDy = eyeLook === 'up' ? -2 : 0;

  // Extract avatar emoji fallback
  const avatarEmoji = safeChar.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|👵|🤖|🦊|🚀|📜|🛡️|🦅|🧪|📐|🦚|🌿|🌾|🍎|💻|✍️|🎓|🔢/u)?.[0] || '🎓';

  // --- MOUTH RENDERER HELPER (Coordinates 0..120) ---
  const renderMouth = (cx = 60, cy = 82) => {
    if (!isPlaying) {
      return (
        <path
          d={`M ${cx - 7} ${cy - 1} Q ${cx} ${cy + 4} ${cx + 7} ${cy - 1}`}
          stroke="#4A1E1E"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    switch (mouthStep) {
      case 1: // Open Wide 'Ah'
        return (
          <g>
            <ellipse cx={cx} cy={cy + 1} rx="7" ry="5.5" fill="#4A1E1E" />
            <path d={`M ${cx - 5} ${cy - 1} Q ${cx} ${cy + 1} ${cx + 5} ${cy - 1}`} fill="#FFFFFF" />
            <ellipse cx={cx} cy={cy + 4.5} rx="4" ry="2" fill="#FB7185" />
          </g>
        );
      case 2: // Medium 'Eh'
        return (
          <g>
            <ellipse cx={cx} cy={cy} rx="6" ry="3.5" fill="#4A1E1E" />
            <rect x={cx - 4.5} y={cy - 2} width="9" height="1.5" rx="0.5" fill="#FFFFFF" />
            <ellipse cx={cx} cy={cy + 2} rx="3" ry="1.2" fill="#FB7185" />
          </g>
        );
      case 3: // Round 'Oo'
        return (
          <g>
            <circle cx={cx} cy={cy} r="4.2" fill="#4A1E1E" />
            <circle cx={cx} cy={cy + 1.2} r="2" fill="#FB7185" />
          </g>
        );
      default: // Speaking slit
        return (
          <path
            d={`M ${cx - 6} ${cy} Q ${cx} ${cy + 3} ${cx + 6} ${cy}`}
            stroke="#4A1E1E"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        );
    }
  };

  // --- SWAMI ROBOT SVG FACE (Cyber Robot 🤖) ---
  const renderSwamiVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ambient Back Glow */}
        <circle cx="60" cy="60" r="54" fill="#0EA5E9" fillOpacity="0.15" />

        {/* Antennae */}
        <line x1="48" y1="28" x2="44" y2="15" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="43" cy="14" r="4.5" fill="#38BDF8" className={isPlaying ? "animate-pulse" : ""} />
        <line x1="72" y1="28" x2="76" y2="15" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="77" cy="14" r="4.5" fill="#F59E0B" />

        {/* Head Chassis */}
        <rect x="22" y="26" width="76" height="66" rx="20" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
        
        {/* Ear Bolts */}
        <rect x="17" y="52" width="6" height="14" rx="2" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
        <rect x="97" y="52" width="6" height="14" rx="2" fill="#475569" stroke="#94A3B8" strokeWidth="1" />

        {/* Visor Area */}
        <rect x="28" y="40" width="64" height="28" rx="10" fill="#090D16" stroke="#38BDF8" strokeWidth="1.8" />

        {/* Futuristic Glowing Eyes inside Visor */}
        {blink ? (
          <>
            <line x1="39" y1="54" x2="51" y2="54" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
            <line x1="69" y1="54" x2="81" y2="54" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <circle cx={45 + pupilDx} cy={54 + pupilDy} r="7" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx={45 + pupilDx} cy={54 + pupilDy} r="3" fill="#BAE6FD" />
            <circle cx={43 + pupilDx} cy={52 + pupilDy} r="1.2" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx={75 + pupilDx} cy={54 + pupilDy} r="7" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
            <circle cx={75 + pupilDx} cy={54 + pupilDy} r="3" fill="#BAE6FD" />
            <circle cx={73 + pupilDx} cy={52 + pupilDy} r="1.2" fill="#FFFFFF" />
          </>
        )}

        {/* LED Equalizer Mouth */}
        {!isPlaying ? (
          <rect x="46" y="77" width="28" height="3" rx="1.5" fill="#38BDF8" />
        ) : mouthStep === 1 ? (
          <g>
            <rect x="44" y="74" width="4" height="8" rx="1" fill="#38BDF8" />
            <rect x="50" y="72" width="4" height="12" rx="1" fill="#7DD3FC" />
            <rect x="56" y="70" width="8" height="16" rx="1" fill="#38BDF8" />
            <rect x="66" y="72" width="4" height="12" rx="1" fill="#7DD3FC" />
            <rect x="72" y="74" width="4" height="8" rx="1" fill="#38BDF8" />
          </g>
        ) : (
          <g>
            <rect x="46" y="75" width="5" height="6" rx="1" fill="#38BDF8" />
            <rect x="53" y="73" width="14" height="10" rx="2" fill="#7DD3FC" />
            <rect x="69" y="75" width="5" height="6" rx="1" fill="#38BDF8" />
          </g>
        )}

        {/* Chest Base */}
        <path d="M 38 92 L 82 92 L 92 110 L 28 110 Z" fill="#0F172A" stroke="#475569" strokeWidth="2" />
        <rect x="48" y="98" width="24" height="4" rx="2" fill="#0EA5E9" className={isPlaying ? "animate-pulse" : ""} />
      </svg>
    );
  };

  // --- DADI AI SVG FACE (Grandmother 👵) ---
  const renderDadiVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Silver Bun on top */}
        <circle cx="60" cy="18" r="14" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="50" y1="18" x2="70" y2="15" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

        {/* Head Base */}
        <circle cx="60" cy="58" r="34" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />

        {/* Parted Silver Hair */}
        <path d="M 28 50 C 35 30, 85 30, 92 50 C 85 34, 60 36, 60 42 C 60 36, 35 34, 28 50 Z" fill="#E2E8F0" />

        {/* Red & Gold Bindi */}
        <circle cx="60" cy="44" r="3.2" fill="#DC2626" />
        <circle cx="60" cy="44" r="1.2" fill="#FDE047" />

        {/* Eyebrows */}
        <path d="M 40 48 Q 48 45 54 48" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 66 48 Q 72 45 80 48" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Golden Grandmother Spectacles 👓 */}
        <circle cx="47" cy="57" r="9" stroke="#D97706" strokeWidth="2" fill="#FFFFFF" fillOpacity="0.3" />
        <circle cx="73" cy="57" r="9" stroke="#D97706" strokeWidth="2" fill="#FFFFFF" fillOpacity="0.3" />
        <path d="M 56 57 Q 60 55 64 57" stroke="#D97706" strokeWidth="2" fill="none" />

        {/* Eyes inside glasses */}
        {blink ? (
          <>
            <line x1="42" y1="57" x2="52" y2="57" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
            <line x1="68" y1="57" x2="78" y2="57" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#451A03" />
            <circle cx={46 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#451A03" />
            <circle cx={72 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <circle cx="38" cy="65" r="4.5" fill="#FDA4AF" fillOpacity="0.6" />
        <circle cx="82" cy="65" r="4.5" fill="#FDA4AF" fillOpacity="0.6" />

        {/* Cute Nose */}
        <path d="M 60 62 Q 62 67 58 68" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Lip Sync Mouth */}
        {renderMouth(60, 77)}

        {/* Traditional Red Embroidered Saree Neck */}
        <path d="M 28 88 C 40 82, 80 82, 92 88 L 102 118 L 18 118 Z" fill="#991B1B" />
        <path d="M 24 95 Q 60 92 96 95" stroke="#FBBF24" strokeWidth="3" fill="none" />
      </svg>
    );
  };

  // --- CHANDA FOX SVG FACE (Smart Fox 🦊) ---
  const renderChandaVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pointy Fox Ears with Twitch animation */}
        <g className={earTwitch ? "animate-pulse" : ""}>
          {/* Left Ear */}
          <polygon points="26,45 36,12 55,38" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
          <polygon points="32,40 37,18 49,36" fill="#FECDD3" />
          {/* Right Ear */}
          <polygon points="94,45 84,12 65,38" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
          <polygon points="88,40 83,18 71,36" fill="#FECDD3" />
        </g>

        {/* Fox Head Oval */}
        <ellipse cx="60" cy="60" rx="36" ry="32" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />

        {/* White Cheek Fur */}
        <path d="M 26 64 C 36 60, 48 72, 60 82 C 72 72, 84 60, 94 64 C 92 84, 60 94, 26 64 Z" fill="#FFFFFF" />

        {/* Smart Student Glasses 👓 */}
        <rect x="36" y="47" width="20" height="15" rx="5" stroke="#0284C7" strokeWidth="2" fill="#E0F2FE" fillOpacity="0.4" />
        <rect x="64" y="47" width="20" height="15" rx="5" stroke="#0284C7" strokeWidth="2" fill="#E0F2FE" fillOpacity="0.4" />
        <line x1="56" y1="54" x2="64" y2="54" stroke="#0284C7" strokeWidth="2" />

        {/* Bright Fox Eyes inside glasses */}
        {blink ? (
          <>
            <line x1="41" y1="54" x2="51" y2="54" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="69" y1="54" x2="79" y2="54" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={46 + pupilDx} cy={54 + pupilDy} rx="4" ry="4.5" fill="#451A03" />
            <circle cx={44.5 + pupilDx} cy={52.5 + pupilDy} r="1.5" fill="#FFFFFF" />
            <ellipse cx={74 + pupilDx} cy={54 + pupilDy} rx="4" ry="4.5" fill="#451A03" />
            <circle cx={72.5 + pupilDx} cy={52.5 + pupilDy} r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Fox Nose Tip */}
        <polygon points="56,73 64,73 60,78" fill="#1C1917" />

        {/* Mouth */}
        {renderMouth(60, 83)}

        {/* Math Wizard Collar */}
        <path d="M 38 88 L 60 98 L 82 88 L 92 115 L 28 115 Z" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
        <text x="60" y="108" textAnchor="middle" fill="#FCD34D" fontSize="8" fontWeight="bold" fontFamily="monospace">∑</text>
      </svg>
    );
  };

  // --- RAMANUJAN / MATH EXPERT SVG (📐) ---
  const renderRamanujanVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#3B82F6" fillOpacity="0.08" />
        {/* Head */}
        <circle cx="60" cy="56" r="33" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
        {/* Parted Dark Hair */}
        <path d="M 28 46 C 36 24, 84 24, 92 46 C 84 32, 60 30, 28 46 Z" fill="#1E293B" />
        {/* Sacred Vermilion Tilak */}
        <line x1="60" y1="36" x2="60" y2="48" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="50" r="1.5" fill="#EAB308" />
        {/* Eyebrows */}
        <path d="M 40 47 Q 48 44 54 47" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 66 47 Q 72 44 80 47" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Deep Intelligent Eyes */}
        {blink ? (
          <>
            <line x1="41" y1="55" x2="52" y2="55" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="55" x2="79" y2="55" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={55 + pupilDy} r="5" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={53 + pupilDy} r="1.5" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={55 + pupilDy} r="5" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={53 + pupilDy} r="1.5" fill="#FFFFFF" />
          </>
        )}
        {/* Nose & Mouth */}
        <path d="M 60 58 Q 62 65 58 67" stroke="#C2410C" strokeWidth="1.5" fill="none" />
        {renderMouth(60, 76)}
        {/* Traditional Kurta with Gold Stole */}
        <path d="M 28 86 Q 60 84 92 86 L 102 118 L 18 118 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <path d="M 42 86 L 50 118" stroke="#D97706" strokeWidth="4" />
        <path d="M 78 86 L 70 118" stroke="#D97706" strokeWidth="4" />
      </svg>
    );
  };

  // --- DR. APJ ROCKET / SPACE EXPERT SVG (🚀) ---
  const renderRocketVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#6366F1" fillOpacity="0.12" />
        {/* Astronaut Helmet Bubble */}
        <circle cx="60" cy="56" r="42" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
        {/* Helmet Visor Reflection */}
        <path d="M 32 40 Q 60 26 88 40" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" fill="none" />
        {/* Friendly Face inside Visor */}
        <circle cx="60" cy="58" r="28" fill="#FED7AA" />
        {/* Famous Waved Hair Parting */}
        <path d="M 34 50 C 40 32, 80 32, 86 50 C 76 36, 60 38, 34 50 Z" fill="#475569" />
        {/* Kind Eyes */}
        {blink ? (
          <>
            <line x1="43" y1="57" x2="51" y2="57" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="69" y1="57" x2="77" y2="57" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
          </>
        )}
        {renderMouth(60, 75)}
        {/* ISRO Space Suit Collar */}
        <path d="M 28 92 C 40 86, 80 86, 92 92 L 104 118 L 16 118 Z" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
        <rect x="52" y="98" width="16" height="8" rx="2" fill="#EA580C" />
        <text x="60" y="104" textAnchor="middle" fill="#FFFFFF" fontSize="5" fontWeight="bold">ISRO</text>
      </svg>
    );
  };

  // --- DR. ANANDI / BIO-MED EXPERT SVG (🧪) ---
  const renderAnandiVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#10B981" fillOpacity="0.1" />
        {/* Head */}
        <circle cx="60" cy="56" r="32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
        {/* Dark Braided Updo Hair */}
        <path d="M 28 48 C 36 26, 84 26, 92 48 C 84 34, 60 32, 28 48 Z" fill="#0F172A" />
        <circle cx="60" cy="24" r="10" fill="#0F172A" />
        {/* Red Bindi */}
        <circle cx="60" cy="44" r="2.5" fill="#E11D48" />
        {/* Smart Medical Wire Glasses 👓 */}
        <circle cx="47" cy="55" r="8" stroke="#0D9488" strokeWidth="1.8" fill="#ECFDF5" fillOpacity="0.4" />
        <circle cx="73" cy="55" r="8" stroke="#0D9488" strokeWidth="1.8" fill="#ECFDF5" fillOpacity="0.4" />
        <line x1="55" y1="55" x2="65" y2="55" stroke="#0D9488" strokeWidth="1.8" />
        {/* Eyes inside glasses */}
        {blink ? (
          <>
            <line x1="43" y1="55" x2="51" y2="55" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="69" y1="55" x2="77" y2="55" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={55 + pupilDy} r="4" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={53.5 + pupilDy} r="1.3" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={55 + pupilDy} r="4" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={53.5 + pupilDy} r="1.3" fill="#FFFFFF" />
          </>
        )}
        {renderMouth(60, 75)}
        {/* White Doctor Coat with Stethoscope */}
        <path d="M 28 86 Q 60 84 92 86 L 102 118 L 18 118 Z" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
        <path d="M 44 86 Q 60 102 76 86" stroke="#475569" strokeWidth="2" fill="none" />
        <circle cx="60" cy="104" r="3" fill="#0D9488" />
      </svg>
    );
  };

  // --- RANI LAXMI / HISTORY HERO SVG (🛡️) ---
  const renderLaxmiVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#E11D48" fillOpacity="0.1" />
        {/* Royal Warrior Pagri (Turban) with Gold Crest */}
        <path d="M 26 44 C 30 20, 90 20, 94 44 Z" fill="#BE123C" stroke="#F59E0B" strokeWidth="2" />
        <circle cx="60" cy="24" r="5" fill="#FBBF24" />
        <path d="M 60 19 L 60 10" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
        {/* Face */}
        <circle cx="60" cy="58" r="31" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
        <circle cx="60" cy="46" r="3" fill="#E11D48" />
        {/* Brave, Radiant Eyes */}
        {blink ? (
          <>
            <line x1="41" y1="56" x2="52" y2="56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="56" x2="79" y2="56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={56 + pupilDy} r="4.8" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={54 + pupilDy} r="1.5" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={56 + pupilDy} r="4.8" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={54 + pupilDy} r="1.5" fill="#FFFFFF" />
          </>
        )}
        {renderMouth(60, 76)}
        {/* Royal Armor & Stole */}
        <path d="M 28 86 Q 60 84 92 86 L 102 118 L 18 118 Z" fill="#991B1B" stroke="#F59E0B" strokeWidth="2" />
        <circle cx="60" cy="100" r="6" fill="#F59E0B" />
      </svg>
    );
  };

  // --- NEWTON / PHYSICS SAGE SVG (🍎) ---
  const renderNewtonVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#EA580C" fillOpacity="0.1" />
        {/* Curly White/Grey Scholar Hair */}
        <circle cx="34" cy="48" r="14" fill="#E2E8F0" />
        <circle cx="86" cy="48" r="14" fill="#E2E8F0" />
        <circle cx="30" cy="64" r="12" fill="#E2E8F0" />
        <circle cx="90" cy="64" r="12" fill="#E2E8F0" />
        <circle cx="60" cy="30" r="16" fill="#E2E8F0" />
        {/* Face */}
        <circle cx="60" cy="58" r="30" fill="#FED7AA" stroke="#E2E8F0" strokeWidth="1.5" />
        {blink ? (
          <>
            <line x1="43" y1="57" x2="52" y2="57" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="68" y1="57" x2="77" y2="57" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={57 + pupilDy} r="4.2" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={55.5 + pupilDy} r="1.3" fill="#FFFFFF" />
          </>
        )}
        {renderMouth(60, 76)}
        {/* Jacket with Apple Pin */}
        <path d="M 28 86 Q 60 84 92 86 L 102 118 L 18 118 Z" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="70" cy="98" r="4.5" fill="#EF4444" />
        <line x1="70" y1="94" x2="72" y2="91" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  // --- TURING CYBER PANTHER / COMPUTER & EXCEL AI (💻) ---
  const renderPantherVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glow halo */}
        <circle cx="60" cy="60" r="54" fill="#06B6D4" fillOpacity="0.12" />

        {/* Pointy Cyber Ears */}
        <polygon points="26,45 34,14 54,36" fill="#0F172A" stroke="#22D3EE" strokeWidth="2" />
        <polygon points="32,40 36,20 48,34" fill="#06B6D4" opacity="0.8" />
        <polygon points="94,45 86,14 66,36" fill="#0F172A" stroke="#22D3EE" strokeWidth="2" />
        <polygon points="88,40 84,20 72,34" fill="#06B6D4" opacity="0.8" />

        {/* Obsidian Head */}
        <rect x="26" y="32" width="68" height="60" rx="22" fill="#0F172A" stroke="#06B6D4" strokeWidth="2.5" />

        {/* Cyan Neon Forehead Line */}
        <line x1="42" y1="42" x2="78" y2="42" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />

        {/* Neon Feline Eyes */}
        {blink ? (
          <>
            <line x1="38" y1="56" x2="52" y2="56" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="68" y1="56" x2="82" y2="56" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={45 + pupilDx} cy={56 + pupilDy} rx="6" ry="4.5" fill="#0891B2" stroke="#22D3EE" strokeWidth="1.8" />
            <ellipse cx={45 + pupilDx} cy={56 + pupilDy} rx="2" ry="4" fill="#ECFEFF" />
            <ellipse cx={75 + pupilDx} cy={56 + pupilDy} rx="6" ry="4.5" fill="#0891B2" stroke="#22D3EE" strokeWidth="1.8" />
            <ellipse cx={75 + pupilDx} cy={56 + pupilDy} rx="2" ry="4" fill="#ECFEFF" />
          </>
        )}

        {/* Cyber Whiskers */}
        <line x1="22" y1="68" x2="38" y2="70" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="22" y1="75" x2="38" y2="74" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="98" y1="68" x2="82" y2="70" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="98" y1="75" x2="82" y2="74" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />

        {/* Nose & Mouth */}
        <polygon points="57,72 63,72 60,76" fill="#22D3EE" />
        {renderMouth(60, 82)}

        {/* Cyber Neck Base */}
        <path d="M 36 90 L 84 90 L 96 116 L 24 116 Z" fill="#020617" stroke="#0891B2" strokeWidth="2" />
        <text x="60" y="106" textAnchor="middle" fill="#22D3EE" fontSize="7" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
      </svg>
    );
  };

  // --- WILLIAM AI (GRAMMAR EAGLE 🦅) ---
  const renderEagleVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crown White Feathers */}
        <path d="M 28 46 C 36 18, 84 18, 92 46 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        {/* Golden-Brown Head Base */}
        <circle cx="60" cy="58" r="32" fill="#78350F" stroke="#D97706" strokeWidth="1.5" />
        <path d="M 32 50 C 44 46, 76 46, 88 50 C 80 62, 40 62, 32 50 Z" fill="#F8FAFC" />
        {/* Piercing Eagle Eyes */}
        {blink ? (
          <>
            <line x1="40" y1="52" x2="52" y2="52" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="52" x2="80" y2="52" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={46 + pupilDx} cy={52 + pupilDy} r="5.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <circle cx={46 + pupilDx} cy={52 + pupilDy} r="2.8" fill="#1C1917" />
            <circle cx={44.5 + pupilDx} cy={50.5 + pupilDy} r="1" fill="#FFFFFF" />
            <circle cx={74 + pupilDx} cy={52 + pupilDy} r="5.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <circle cx={74 + pupilDx} cy={52 + pupilDy} r="2.8" fill="#1C1917" />
            <circle cx={72.5 + pupilDx} cy={50.5 + pupilDy} r="1" fill="#FFFFFF" />
          </>
        )}
        {/* Curved Golden Beak */}
        <path d="M 52 64 C 52 60, 68 60, 68 64 C 68 76, 60 84, 60 84 C 60 84, 52 76, 52 64 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
        {renderMouth(60, 88)}
      </svg>
    );
  };

  // --- KISAN TECH AI (FARMER GUIDE 🌾) ---
  const renderKisanVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#10B981" fillOpacity="0.1" />
        {/* Green Pagri / Gamcha (Farmer Turban) */}
        <path d="M 24 44 C 30 18, 90 18, 96 44 Z" fill="#15803D" stroke="#166534" strokeWidth="2" />
        <path d="M 32 38 Q 60 30 88 38" stroke="#FACC15" strokeWidth="2.5" fill="none" />
        <path d="M 22 42 Q 18 55 24 64" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Smiling Warm Face */}
        <circle cx="60" cy="58" r="32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
        {/* Kind Farmer Eyes */}
        {blink ? (
          <>
            <line x1="41" y1="56" x2="52" y2="56" stroke="#451A03" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="68" y1="56" x2="79" y2="56" stroke="#451A03" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={56 + pupilDy} r="4.8" fill="#451A03" />
            <circle cx={45.5 + pupilDx} cy={54 + pupilDy} r="1.5" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={56 + pupilDy} r="4.8" fill="#451A03" />
            <circle cx={71.5 + pupilDx} cy={54 + pupilDy} r="1.5" fill="#FFFFFF" />
          </>
        )}
        {/* Gentle Moustache */}
        <path d="M 46 72 Q 54 74 60 70 Q 66 74 74 72" stroke="#451A03" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {renderMouth(60, 78)}
        {/* White Kurta with Golden Wheat Emblem */}
        <path d="M 28 88 Q 60 84 92 88 L 102 118 L 18 118 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        <circle cx="60" cy="100" r="6" fill="#F59E0B" />
        <text x="60" y="103" textAnchor="middle" fontSize="7">🌾</text>
      </svg>
    );
  };

  // --- KAVI NARMAD / GUJARATI SCHOLAR (📜) ---
  const renderScholarVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" fill="#D97706" fillOpacity="0.1" />
        {/* Traditional Gujarati Pagri (Turban) */}
        <path d="M 24 44 C 30 16, 90 16, 96 44 Z" fill="#D97706" stroke="#B45309" strokeWidth="2" />
        <circle cx="60" cy="22" r="6" fill="#FBBF24" />
        {/* Face */}
        <circle cx="60" cy="58" r="32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
        {/* Tilak */}
        <line x1="60" y1="42" x2="60" y2="52" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        {/* Literary Eyes */}
        {blink ? (
          <>
            <line x1="41" y1="56" x2="52" y2="56" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="68" y1="56" x2="79" y2="56" stroke="#451A03" strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={56 + pupilDy} r="4.5" fill="#451A03" />
            <circle cx={45.5 + pupilDx} cy={54.5 + pupilDy} r="1.3" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={56 + pupilDy} r="4.5" fill="#451A03" />
            <circle cx={71.5 + pupilDx} cy={54.5 + pupilDy} r="1.3" fill="#FFFFFF" />
          </>
        )}
        {renderMouth(60, 77)}
        {/* Kurta with Golden Stole & Quill */}
        <path d="M 28 88 Q 60 84 92 88 L 102 118 L 18 118 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="60" cy="100" r="6" fill="#D97706" />
        <text x="60" y="103" textAnchor="middle" fontSize="7">📜</text>
      </svg>
    );
  };

  // --- UNIVERSAL CHARMING AI TEACHER (Generic / Fallback) ---
  const renderGenericVector = () => {
    return (
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ambient Ring */}
        <circle cx="60" cy="60" r="54" fill="#3D405B" fillOpacity="0.12" />

        {/* Head */}
        <circle cx="60" cy="56" r="32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />

        {/* Stylized Modern Hairstyle */}
        <path d="M 30 46 C 36 24, 84 24, 90 46 C 82 30, 60 30, 30 46 Z" fill="#332211" />

        {/* Eyebrows */}
        <path d="M 40 46 Q 48 43 54 46" stroke="#332211" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 66 46 Q 72 43 80 46" stroke="#332211" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Big Expressive Anime Eyes */}
        {blink ? (
          <>
            <line x1="41" y1="54" x2="52" y2="54" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="54" x2="79" y2="54" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + pupilDx} cy={54 + pupilDy} r="5.2" fill="#1E293B" />
            <circle cx={45.5 + pupilDx} cy={52 + pupilDy} r="1.8" fill="#FFFFFF" />
            <circle cx={73 + pupilDx} cy={54 + pupilDy} r="5.2" fill="#1E293B" />
            <circle cx={71.5 + pupilDx} cy={52 + pupilDy} r="1.8" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <circle cx="37" cy="64" r="4.5" fill="#FDA4AF" fillOpacity="0.6" />
        <circle cx="83" cy="64" r="4.5" fill="#FDA4AF" fillOpacity="0.6" />

        {/* Nose */}
        <circle cx="60" cy="64" r="1.8" fill="#E6D4B9" />

        {/* Talking Mouth */}
        {renderMouth(60, 76)}

        {/* Mascot Emoji Badge Pin on Chest */}
        <path d="M 30 86 Q 60 84 90 86 L 100 118 L 20 118 Z" fill="#3D405B" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="60" cy="98" r="9" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
        <text x="60" y="102" textAnchor="middle" fontSize="11">{avatarEmoji}</text>
      </svg>
    );
  };

  // Selector for vector render
  const renderVectorFace = () => {
    switch (teacherType) {
      case 'swami':
        return renderSwamiVector();
      case 'dadi':
        return renderDadiVector();
      case 'chanda':
        return renderChandaVector();
      case 'ramanujan':
        return renderRamanujanVector();
      case 'rocket':
        return renderRocketVector();
      case 'anandi':
        return renderAnandiVector();
      case 'laxmi':
        return renderLaxmiVector();
      case 'newton':
        return renderNewtonVector();
      case 'panther':
        return renderPantherVector();
      case 'eagle':
        return renderEagleVector();
      case 'kisan':
        return renderKisanVector();
      case 'scholar':
        return renderScholarVector();
      case 'nature':
      case 'generic':
      default:
        return renderGenericVector();
    }
  };

  // When minimal={true} (e.g. inside small cards or PiP corners)
  if (minimal) {
    return (
      <div 
        className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-full bg-slate-900 shadow-inner ${className}`}
        title={safeName}
      >
        <div className="w-full h-full p-0.5 flex items-center justify-center">
          {renderVectorFace()}
        </div>

        {/* Live vocal vibration ripple */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full border-2 border-emerald-400/80 animate-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // Full-featured portrait mode
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <style>{`
        @keyframes natural-breathe {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.018); }
        }
        .ai-breath-cycle {
          animation: natural-breathe 4s ease-in-out infinite;
        }
      `}</style>

      {/* Main Avatar Bubble */}
      <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-slate-900 shadow-2xl border-4 border-[#F2CC8F] p-2 flex items-center justify-center ai-breath-cycle overflow-hidden">
        {renderVectorFace()}

        {/* Active Speech Glow */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-4 border-[#E07A5F] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Name Title Label Card */}
      <div className="mt-2.5 text-center flex flex-col items-center gap-1">
        <span className="bg-[#E07A5F] text-white text-xs font-sans font-black tracking-wide px-3.5 py-1 rounded-full shadow-md select-none border border-white/60 flex items-center gap-1.5">
          <span>{avatarEmoji}</span>
          <span>{safeName}</span>
        </span>
      </div>
    </div>
  );
}
