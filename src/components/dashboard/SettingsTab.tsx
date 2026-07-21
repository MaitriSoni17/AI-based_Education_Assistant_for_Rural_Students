import React, { useState } from 'react';
import { LanguageCode, User } from '../../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Settings, Volume2, Globe, GraduationCap, Check, Download, ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const STANDARDS = [
  { value: "Class 1", label: "Class 1" },
  { value: "Class 2", label: "Class 2" },
  { value: "Class 3", label: "Class 3" },
  { value: "Class 4", label: "Class 4" },
  { value: "Class 5", label: "Class 5" },
  { value: "Class 6", label: "Class 6" },
  { value: "Class 7", label: "Class 7" },
  { value: "Class 8", label: "Class 8" },
  { value: "Class 9", label: "Class 9" },
  { value: "Class 10", label: "Class 10" },
  { value: "Class 11 (Science)", label: "Class 11 (Science)", group: "Class 11" },
  { value: "Class 11 (Commerce)", label: "Class 11 (Commerce)", group: "Class 11" },
  { value: "Class 11 (Arts)", label: "Class 11 (Arts)", group: "Class 11" },
  { value: "Class 12 (Science)", label: "Class 12 (Science)", group: "Class 12" },
  { value: "Class 12 (Commerce)", label: "Class 12 (Commerce)", group: "Class 12" },
  { value: "Class 12 (Arts)", label: "Class 12 (Arts)", group: "Class 12" },
];

const BOARDS = [
  { value: "CBSE", label: "CBSE (NCERT Standards)", group: "National Boards" },
  { value: "ICSE", label: "ICSE (CISCE Standards)", group: "National Boards" },
  { value: "Andhra Pradesh: BIEAP & BSEAP", label: "Andhra Pradesh: BIEAP & BSEAP", group: "State Boards" },
  { value: "Assam: AHSEC & SEBA", label: "Assam: AHSEC & SEBA", group: "State Boards" },
  { value: "Bihar: BSEB", label: "Bihar: BSEB", group: "State Boards" },
  { value: "Chhattisgarh: CGBSE", label: "Chhattisgarh: CGBSE", group: "State Boards" },
  { value: "Goa: GBSHSE", label: "Goa: GBSHSE", group: "State Boards" },
  { value: "Gujarat: GSEB", label: "Gujarat: GSEB", group: "State Boards" },
  { value: "Haryana: HBSE", label: "Haryana: HBSE", group: "State Boards" },
  { value: "Himachal Pradesh: HPBOSE", label: "Himachal Pradesh: HPBOSE", group: "State Boards" },
  { value: "Jammu & Kashmir: JKBOSE", label: "Jammu & Kashmir: JKBOSE", group: "State Boards" },
  { value: "Jharkhand: JAC", label: "Jharkhand: JAC", group: "State Boards" },
  { value: "Karnataka: KSEAB", label: "Karnataka: KSEAB", group: "State Boards" },
  { value: "Kerala: DHSE & Pareeksha Bhavan", label: "Kerala: DHSE & Pareeksha Bhavan", group: "State Boards" },
  { value: "Madhya Pradesh: MPBSE", label: "Madhya Pradesh: MPBSE", group: "State Boards" },
  { value: "Maharashtra: MSBSHSE", label: "Maharashtra: MSBSHSE", group: "State Boards" },
  { value: "Manipur: BSEM & COHSEM", label: "Manipur: BSEM & COHSEM", group: "State Boards" },
  { value: "Meghalaya: MBOSE", label: "Meghalaya: MBOSE", group: "State Boards" },
  { value: "Mizoram: MBSE", label: "Mizoram: MBSE", group: "State Boards" },
  { value: "Nagaland: NBSE", label: "Nagaland: NBSE", group: "State Boards" },
  { value: "Odisha: BSE Odisha & CHSE Odisha", label: "Odisha: BSE Odisha & CHSE Odisha", group: "State Boards" },
  { value: "Punjab: PSEB", label: "Punjab: PSEB", group: "State Boards" },
  { value: "Rajasthan: RBSE", label: "Rajasthan: RBSE", group: "State Boards" },
  { value: "Tamil Nadu: DGE TN", label: "Tamil Nadu: DGE TN", group: "State Boards" },
  { value: "Telangana: TSBIE", label: "Telangana: TSBIE", group: "State Boards" },
  { value: "Tripura: TBSE", label: "Tripura: TBSE", group: "State Boards" },
  { value: "Uttar Pradesh: UPMSP", label: "Uttar Pradesh: UPMSP", group: "State Boards" },
  { value: "Uttarakhand: UBSE", label: "Uttarakhand: UBSE", group: "State Boards" },
  { value: "West Bengal: WBBSE & WBCHSE", label: "West Bengal: WBBSE & WBCHSE", group: "State Boards" },
];

interface SettingsTabProps {
  user: User;
  onUpdateUser: (updated: Partial<User>) => void;
  lang: LanguageCode;
  onChangeLanguage: (newLang: LanguageCode) => void;
}

export default function SettingsTab({ user, onUpdateUser, lang, onChangeLanguage }: SettingsTabProps) {
  // Input binders
  const [village, setVillage] = useState(user.village || '');
  const [school, setSchool] = useState(user.school || '');
  const [standard, setStandard] = useState(user.standard || '');
  const [board, setBoard] = useState(user.board || 'CBSE');

  // Custom Dropdown Open States
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');

  // Local speech test state
  const [speechRate, setSpeechRate] = useState(() => {
    return localStorage.getItem('speech_rate_multiplier') || '1';
  });

  const [savingKey, setSavingKey] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);

    onUpdateUser({
      village,
      school,
      standard,
      board
    });

    localStorage.setItem(`${user.mobile}_profile_village`, village);
    localStorage.setItem(`${user.mobile}_profile_school`, school);
    localStorage.setItem(`${user.mobile}_profile_standard`, standard);
    localStorage.setItem(`${user.mobile}_profile_board`, board);

    setTimeout(() => {
      setSavingKey(false);
      setFeedbackMsg(lang === 'hi' ? "सेटिंग्स सफलतापूर्वक सहेजी गईं! ✨" : "Settings saved successfully! ✨");
      speakText(
        lang === 'hi' ? "आपकी सेटिंग्स बदल दी गई हैं।" : "Your settings have been registered successfully.", 
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
      code === 'hi' ? "हिंदी भाषा चुनी गई।" : code === 'gu' ? "ગુજરાતી ભાષા પસંદ કરી." : "Language updated successfully.", 
      code, 
      "Swami AI", 
      "🤖 Swami AI"
    );
  };

  const handleSpeechRateSave = (rate: string) => {
    setSpeechRate(rate);
    localStorage.setItem('speech_rate_multiplier', rate);
    speakText(
      lang === 'hi' 
        ? "आवाज़ की गति अद्यतन की गई।" 
        : `Voice readout speed configured to ${rate} times speed.`, 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  My District / Village
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Anand, Gujarat"
                  className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  My High School
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. Government Vidhyalaya"
                  className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                />
              </div>
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
      </div>

    </div>
  );
}
