import React, { useState } from 'react';
import { LanguageCode, User } from '../../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Settings, Volume2, Globe, GraduationCap, Check, Download } from 'lucide-react';

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

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Standard / Grade Class
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#81B29A] cursor-pointer"
              >
                <option value="">{lang === 'hi' ? '-- अपनी कक्षा चुनें --' : '-- Select Your Class --'}</option>
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <optgroup label={lang === 'hi' ? "कक्षा 11 (Arts, Commerce, Science)" : "Class 11 (Arts, Commerce, Science)"}>
                  <option value="Class 11 (Science)">Class 11 (Science)</option>
                  <option value="Class 11 (Commerce)">Class 11 (Commerce)</option>
                  <option value="Class 11 (Arts)">Class 11 (Arts)</option>
                </optgroup>
                <optgroup label={lang === 'hi' ? "कक्षा 12 (Arts, Commerce, Science)" : "Class 12 (Arts, Commerce, Science)"}>
                  <option value="Class 12 (Science)">Class 12 (Science)</option>
                  <option value="Class 12 (Commerce)">Class 12 (Commerce)</option>
                  <option value="Class 12 (Arts)">Class 12 (Arts)</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Academic Board / Syllabus
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#81B29A] cursor-pointer font-bold text-[#3D405B]"
              >
                <optgroup label="National Boards">
                  <option value="CBSE">CBSE (NCERT Standards)</option>
                  <option value="ICSE">ICSE (CISCE Standards)</option>
                </optgroup>
                <optgroup label="State Boards">
                  <option value="Andhra Pradesh: BIEAP & BSEAP">Andhra Pradesh: BIEAP & BSEAP</option>
                  <option value="Assam: AHSEC & SEBA">Assam: AHSEC & SEBA</option>
                  <option value="Bihar: BSEB">Bihar: BSEB</option>
                  <option value="Chhattisgarh: CGBSE">Chhattisgarh: CGBSE</option>
                  <option value="Goa: GBSHSE">Goa: GBSHSE</option>
                  <option value="Gujarat: GSEB">Gujarat: GSEB</option>
                  <option value="Haryana: HBSE">Haryana: HBSE</option>
                  <option value="Himachal Pradesh: HPBOSE">Himachal Pradesh: HPBOSE</option>
                  <option value="Jammu & Kashmir: JKBOSE">Jammu & Kashmir: JKBOSE</option>
                  <option value="Jharkhand: JAC">Jharkhand: JAC</option>
                  <option value="Karnataka: KSEAB">Karnataka: KSEAB</option>
                  <option value="Kerala: DHSE & Pareeksha Bhavan">Kerala: DHSE & Pareeksha Bhavan</option>
                  <option value="Madhya Pradesh: MPBSE">Madhya Pradesh: MPBSE</option>
                  <option value="Maharashtra: MSBSHSE">Maharashtra: MSBSHSE</option>
                  <option value="Manipur: BSEM & COHSEM">Manipur: BSEM & COHSEM</option>
                  <option value="Meghalaya: MBOSE">Meghalaya: MBOSE</option>
                  <option value="Mizoram: MBSE">Mizoram: MBSE</option>
                  <option value="Nagaland: NBSE">Nagaland: NBSE</option>
                  <option value="Odisha: BSE Odisha & CHSE Odisha">Odisha: BSE Odisha & CHSE Odisha</option>
                  <option value="Punjab: PSEB">Punjab: PSEB</option>
                  <option value="Rajasthan: RBSE">Rajasthan: RBSE</option>
                  <option value="Tamil Nadu: DGE TN">Tamil Nadu: DGE TN</option>
                  <option value="Telangana: TSBIE">Telangana: TSBIE</option>
                  <option value="Tripura: TBSE">Tripura: TBSE</option>
                  <option value="Uttar Pradesh: UPMSP">Uttar Pradesh: UPMSP</option>
                  <option value="Uttarakhand: UBSE">Uttarakhand: UBSE</option>
                  <option value="West Bengal: WBBSE & WBCHSE">West Bengal: WBBSE & WBCHSE</option>
                </optgroup>
              </select>
              <p className="text-[9px] text-gray-400 font-sans leading-normal">
                This setting routes learning prompts dynamically, fine-tuning step-by-step solutions to your chosen national or regional SCERT syllabus format.
              </p>
            </div>

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
