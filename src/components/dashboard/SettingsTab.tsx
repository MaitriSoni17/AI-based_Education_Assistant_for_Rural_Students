import React, { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../../data/translations';
import { STATES, STANDARDS, BOARDS } from '../../data/educationData';
import { speakText, stopSpeaking, checkVoiceAvailability } from '../../utils/speech';
import { Settings, Volume2, Globe, GraduationCap, Check, Download, ChevronDown, Search, Play, Square, Radio } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface SettingsTabProps {
  user: User;
  onUpdateUser: (updated: Partial<User>) => void;
  lang: LanguageCode;
  onChangeLanguage: (newLang: LanguageCode) => void;
}

export default function SettingsTab({ user, onUpdateUser, lang, onChangeLanguage }: SettingsTabProps) {
  // Input binders
  const [state, setState] = useState(user.state || 'Gujarat');
  const [village, setVillage] = useState(user.village || '');
  const [school, setSchool] = useState(user.school || '');
  const [standard, setStandard] = useState(user.standard || '');
  const [board, setBoard] = useState(user.board || '');

  // Custom Dropdown Open States
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');

  // Local speech test state
  const [speechRate, setSpeechRate] = useState(() => {
    return localStorage.getItem('speech_rate_multiplier') || '1';
  });
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(() => checkVoiceAvailability(lang));

  useEffect(() => {
    setVoiceStatus(checkVoiceAvailability(lang));
    const handleVoicesChanged = () => {
      setVoiceStatus(checkVoiceAvailability(lang));
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, [lang]);

  const [preferredVoice, setPreferredVoice] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_preferred_voice') || 'Aoede';
    } catch {
      return 'Aoede';
    }
  });

  const handleVoiceSelect = (voice: string) => {
    setPreferredVoice(voice);
    try {
      localStorage.setItem('gemini_preferred_voice', voice);
    } catch (e) {}

    const sample = voice === 'Aoede'
      ? '[excitedly] Hello, my wonderful little friend! [giggles] I am Aoede, your sweetest companion! I love learning and exploring with you!'
      : voice === 'Despina'
      ? '[whispers softly] Hello little friend... [gently] I am Despina, your calming bedtime storyteller.'
      : voice === 'Puck'
      ? '[excitedly] Yoohoo! [giggles] I am Puck! Ready for active play and exciting adventures?'
      : '[excitedly] Hi there! [softly] I am Zephyr, your cheerful companion for science and fun!';

    speakText(sample, lang, voice, '🎙️');
  };

  const handleTestSpeech = (testType: 'bedtime' | 'play' = 'bedtime') => {
    if (isPlayingTest) {
      stopSpeaking();
      setIsPlayingTest(false);
      return;
    }

    const bedtimeSamples: Record<string, string> = {
      en: '[whispers softly] Close your little eyes... [gently] and listen to the stars twinkling in the calm night sky... [sighs happily] You are safe and loved. Sweet dreams, little star...',
      hi: '[whispers softly] अपनी नन्हीं आँखें बंद करो... [gently] और रात के शांत आसमान में चमकते तारों को सुनो... [sighs happily] तुम बहुत प्यारे हो। मीठे सपने, नन्हे तारे...',
      gu: '[whispers softly] તમારી નાની આંખો બંધ કરો... [gently] અને શાંત રાત્રિના આકાશમાં ચમકતા તારાઓને સાંભળો... [sighs happily] મીઠા સપના, વ્હાલા મિત્ર...',
      mr: '[whispers softly] तुझे छोटे डोळे मिटून घे... [gently] आणि रात्रीच्या शांत आकाशातल्या चांदण्यांचं गाणं ऐक... [sighs happily] छान स्वप्ने पडोत, बालमित्रा...',
      ta: '[whispers softly] உன் குட்டி கண்களை மூடு... [gently] அமைதியான இரவு வானில் மின்னும் நட்சத்திரங்களைக் கேள்... [sighs happily] இனிய கனவுகள் செல்லமே...',
      te: '[whispers softly] నీ చిన్ని కళ్ళు మూసుకో... [gently] ప్రశాంతమైన రాత్రి వేళ మెరిసే తారల పాట విను... [sighs happily] తియ్యని కలలు, చిన్ని నేస్తమా...'
    };

    const playSamples: Record<string, string> = {
      en: '[excitedly] Wow, look at that! [gasp] A hidden treasure in the jungle... [giggles] Come on, little explorer, let\'s jump right in!',
      hi: '[excitedly] अरे वाह, उधर देखो! [gasp] जंगल में एक छिपा हुआ खज़ाना... [giggles] चलो नन्हे खोजी, मिलकर कूद पड़ते हैं!',
      gu: '[excitedly] અરે વાહ, ત્યાં જુઓ! [gasp] જંગલમાં એક છુપાયેલો ખજાનો... [giggles] ચાલો નાનકડા દોસ્ત, સાથે મળીને સાહસ કરીએ!',
      mr: '[excitedly] अरे वा, तिकडे बघ! [gasp] जंगलात एक लपलेला खजिना... [giggles] चल छोट्या दोस्ता, आपण मिळून शोधूया!',
      ta: '[excitedly] ஆஹா, அங்கே பார்! [gasp] காட்டில் ஒரு மறைந்த புதையல்... [giggles] வா குட்டி நண்பா, குதித்து மகிழ்வோம்!',
      te: '[excitedly] అరెరే, అటు చూడండి! [gasp] అడవిలో దాగి ఉన్న నిధి... [giggles] రా చిన్ని నేస్తమా, కలిసి దూకుదాం!'
    };

    const sample = testType === 'bedtime'
      ? (bedtimeSamples[lang] || bedtimeSamples.en)
      : (playSamples[lang] || playSamples.en);

    const testAvatar = testType === 'bedtime' ? 'Dadi Amma' : 'Puck';
    const testChar = testType === 'bedtime' ? '👵' : '🦊';

    setIsPlayingTest(true);
    speakText(sample, lang, testAvatar, testChar, () => {
      setIsPlayingTest(false);
    });
  };

  const [savingKey, setSavingKey] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);

    onUpdateUser({
      state,
      village,
      school,
      standard,
      board
    });

    try {
      localStorage.setItem(`${user.mobile}_profile_state`, state);
      localStorage.setItem(`${user.mobile}_profile_village`, village);
      localStorage.setItem(`${user.mobile}_profile_school`, school);
      localStorage.setItem(`${user.mobile}_profile_standard`, standard);
      localStorage.setItem(`${user.mobile}_profile_board`, board);
    } catch (e) {
      console.warn("Failed to set profile fields in localStorage:", e);
    }

    setTimeout(() => {
      setSavingKey(false);
      setFeedbackMsg(lang === 'hi' ? "सेटिंग्स सफलतापूर्वक सहेजी गईं! ✨" : "Settings saved successfully! ✨");
      speakText(
        lang === 'hi' ? "शाबाश! आपकी सेटिंग्स प्यार से सहेज ली गई हैं।" : "Wonderful! Your profile settings have been updated beautifully.", 
        lang, 
        "Swami AI", 
        "🤖 Swami AI"
      );
      setTimeout(() => setFeedbackMsg(''), 4000);
    }, 1000);
  };

  const handleLanguageUpdate = (code: LanguageCode) => {
    onChangeLanguage(code);
    speakText(
      code === 'hi' ? "नमस्ते दोस्त! अब हम हिंदी में बातें करेंगे।" : code === 'gu' ? "નમસ્તે મિત્ર! હવે આપણે ગુજરાતીમાં વાત કરીશું." : "Hello friend! Your learning language has been updated.", 
      code, 
      "Swami AI", 
      "🤖 Swami AI"
    );
  };

  const handleSpeechRateSave = (rate: string) => {
    setSpeechRate(rate);
    try {
      localStorage.setItem('speech_rate_multiplier', rate);
    } catch (e) {
      console.warn("Failed to set speech_rate_multiplier in localStorage:", e);
    }
    speakText(
      lang === 'hi' 
        ? "आवाज़ की गति आपके लिए बिल्कुल सही कर दी गई है।" 
        : `Voice speed tuned to ${rate} times speed, perfect for listening!`, 
      lang, 
      "Swami AI", 
      "🤖 Swami AI"
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-5xl mx-auto">
      
      {/* LEFT: Local Settings, Languages, Speech */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* 1. Language Pickers */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs space-y-3.5">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Globe className="h-4.5 w-4.5 text-[#81B29A]" />
            Scholastic Primary Language
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((sl) => {
              const isActive = lang === sl.code;
              return (
                <button
                  key={sl.code}
                  onClick={() => handleLanguageUpdate(sl.code as LanguageCode)}
                  className={`p-3 rounded-xl border text-center font-sans text-xs sm:text-sm font-semibold transition-all cursor-pointer flex flex-col justify-center items-center gap-1 ${
                    isActive
                      ? 'border-[#81B29A] bg-[#81B29A]/10 text-[#3D405B] font-extrabold ring-1 ring-[#81B29A]'
                      : 'border-gray-200 hover:bg-[#FAF8F4] text-gray-700'
                  }`}
                >
                  <span className="text-sm font-sans block">{sl.label}</span>
                  <span className="text-[9px] text-gray-400 font-mono block">{sl.nativeLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Educational Profile Form */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <GraduationCap className="h-4.5 w-4.5 text-[#E07A5F]" />
            Your Study Profile Criteria
          </h3>

          <form onSubmit={handleSaveProfileSettings} className="space-y-4 pt-3.5">
            {/* State & Village Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left relative">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  State / Union Territory
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsStateOpen(!isStateOpen);
                    setIsStandardOpen(false);
                    setIsBoardOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-bold text-gray-800 transition-all hover:bg-gray-100 cursor-pointer text-left"
                >
                  <span>{state || 'Select State'}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStateOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 max-h-56 overflow-y-auto p-2 space-y-1 animate-fade-in text-left">
                    {STATES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setState(st);
                          setIsStateOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs sm:text-sm font-sans font-bold transition-colors cursor-pointer text-left ${
                          state === st ? 'bg-[#E07A5F]/10 text-[#E07A5F]' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>{st}</span>
                        {state === st && <Check className="h-4 w-4 text-[#E07A5F]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Village / City / District
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Anand"
                  className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                My High School / Institution
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Government Higher Secondary School"
                className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
              />
            </div>

            <div className="space-y-1.5 text-left relative">
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Standard / Grade Class
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsStandardOpen(!isStandardOpen);
                  setIsBoardOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-bold text-gray-800 transition-all hover:bg-gray-100 cursor-pointer text-left"
              >
                <span className="text-left flex-1 mr-2">{standard || (lang === 'hi' ? 'अपनी कक्षा चुनें' : 'Select Your Class')}</span>
                <ChevronDown className={`h-4 w-4 text-[#3D405B]/60 transition-transform ${isStandardOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isStandardOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStandardOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-1.5 space-y-0.5"
                    >
                      {STANDARDS.map((std) => (
                        <button
                          key={std.value}
                          type="button"
                          onClick={() => {
                            setStandard(std.value);
                            setIsStandardOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            standard === std.value
                              ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-extrabold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {std.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5 text-left relative">
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Academic Board / Syllabus
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsBoardOpen(!isBoardOpen);
                  setIsStandardOpen(false);
                  setBoardSearch('');
                }}
                className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans font-bold text-gray-800 transition-all hover:bg-gray-100 cursor-pointer text-left"
              >
                <span className="text-left flex-1 mr-2">{BOARDS.find(b => b.value === board)?.label || board}</span>
                <ChevronDown className={`h-4 w-4 text-[#3D405B]/60 transition-transform ${isBoardOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isBoardOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsBoardOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2 space-y-2 max-h-72 overflow-hidden flex flex-col"
                    >
                      {/* Search box within board dropdown */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={boardSearch}
                          onChange={(e) => setBoardSearch(e.target.value)}
                          placeholder={lang === 'hi' ? "बोर्ड खोजें..." : "Search board..."}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-150 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                        />
                      </div>

                      <div className="overflow-y-auto flex-1 space-y-1 pr-0.5">
                        {["National Boards", "State Boards"].map(groupName => {
                          const groupItems = BOARDS.filter(b => b.group === groupName && (boardSearch === '' || b.label.toLowerCase().includes(boardSearch.toLowerCase())));
                          if (groupItems.length === 0) return null;

                          return (
                            <div key={groupName} className="space-y-0.5">
                              <div className="text-[9px] font-black font-mono text-gray-400 uppercase tracking-wider px-2 py-1">
                                {groupName === "National Boards" 
                                  ? (lang === 'hi' ? "राष्ट्रीय बोर्ड" : "National Boards") 
                                  : (lang === 'hi' ? "राज्य बोर्ड" : "State Boards")}
                              </div>
                              {groupItems.map((b) => (
                                <button
                                  key={b.value}
                                  type="button"
                                  onClick={() => {
                                    setBoard(b.value);
                                    setIsBoardOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    board === b.value
                                      ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-500 font-extrabold pl-2'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {b.label}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                        {BOARDS.filter(b => boardSearch === '' || b.label.toLowerCase().includes(boardSearch.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-xs text-gray-400 font-bold">
                            {lang === 'hi' ? "कोई बोर्ड नहीं मिला" : "No board found"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[9px] text-gray-400 font-sans leading-normal">
              This setting routes learning prompts dynamically, fine-tuning step-by-step solutions to your chosen national or regional SCERT syllabus format.
            </p>

            {feedbackMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-sans font-semibold flex items-center gap-1">
                <Check className="h-4 w-4" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingKey}
              className="px-5 py-2.5 bg-[#3D405B] hover:bg-[#2D2F44] active:scale-98 text-white rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
            >
              <span>{savingKey ? "Saving Details..." : "Save Profile Details ✨"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT: Voice speed adjusters, maintenance diagnostics */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* 1. Voice configuration */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs space-y-4">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Volume2 className="h-4.5 w-4.5 text-[#F2CC8F]" />
            Storyteller Voice Selection (Gemini Audio)
          </h3>
          
          <div className="space-y-2">
            {[
              { 
                key: 'Aoede', 
                label: '🌟 Aoede — Sweet & Cheerful Child Companion (Recommended)', 
                desc: 'Warm, melodious, joyful, and encouraging voice specially tuned to inspire kids' 
              },
              { 
                key: 'Despina', 
                label: '🌙 Despina — Bedtime & Calming Storyteller', 
                desc: 'Soft, gentle, whispery, slower cadence for bedtime and comforting stories' 
              },
              { 
                key: 'Puck', 
                label: '🦊 Puck — Active Play & Joyful Explorer', 
                desc: 'Bubbly, energetic, high-energy delivery for adventure, games, and math tricks' 
              },
              { 
                key: 'Zephyr', 
                label: '🤖 Zephyr — Active Play & Learning Companion', 
                desc: 'Bright, rhythmic, encouraging companion voice for science & daily curiosity' 
              }
            ].map(voiceItem => {
              const isActive = preferredVoice === voiceItem.key;
              return (
                <button
                  key={voiceItem.key}
                  type="button"
                  onClick={() => handleVoiceSelect(voiceItem.key)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-sans transition-all flex items-start justify-between cursor-pointer ${
                    isActive 
                      ? 'border-[#E07A5F] bg-orange-50/60 text-amber-950 font-bold ring-1 ring-orange-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-xs block">{voiceItem.label}</span>
                    <span className="text-[10px] text-gray-500 block leading-tight font-normal">{voiceItem.desc}</span>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Mascot Speak Velocity */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs space-y-4">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Volume2 className="h-4.5 w-4.5 text-[#81B29A]" />
            Mascot Speak Velocity
          </h3>
          
          <div className="space-y-2">
            {[
              { key: '0.85', label: '🐢 Slow Rate (Quiet Focus / Clear Storytelling)' },
              { key: '1', label: '👤 Normal Speed Rate (Default Lesson Readout)' },
              { key: '1.25', label: '🐇 Quick Speed Rate (Speedy Quiz Solutions)' }
            ].map(rateItem => {
              const activeRate = speechRate === rateItem.key;
              return (
                <button
                  key={rateItem.key}
                  onClick={() => handleSpeechRateSave(rateItem.key)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-sans font-bold transition-all flex items-center justify-between cursor-pointer ${
                    activeRate 
                      ? 'border-[#FAF8F4] bg-orange-50/50 text-amber-950 font-extrabold ring-1 ring-amber-300'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-650'
                  }`}
                >
                  <span>{rateItem.label}</span>
                  {activeRate && <Check className="h-4 w-4 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio Engine Diagnostics & Live Story Voice Testers */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-3xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-[#81B29A]" />
              Voice Engine & Diagnostics
            </h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              voiceStatus.hasNativeVoice
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {voiceStatus.hasNativeVoice ? 'Native Device Voice' : 'Cloud Regional TTS'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-gray-600 font-sans">
            <p className="text-[11px] leading-relaxed text-gray-500">
              Audio engine features soft, warm, child-friendly expression markers [whispers], [giggles], rhythmic short cadence, and ellipses pauses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestSpeech('bedtime')}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isPlayingTest
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-3xs'
                }`}
              >
                {isPlayingTest ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>🌙 Test Bedtime (Despina)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTestSpeech('play')}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isPlayingTest
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-[#E07A5F] hover:bg-[#CE6B50] text-white shadow-3xs'
                }`}
              >
                {isPlayingTest ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>☀️ Test Play (Puck)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
