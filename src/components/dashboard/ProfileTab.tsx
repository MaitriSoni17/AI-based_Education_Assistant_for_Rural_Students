import { useState, useEffect } from 'react';
import { User, LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { 
  Award, Flame, Clock, BookOpen, Database, MapPin, School, Phone, Calendar, 
  Sparkles, Settings, Globe, ShieldCheck, Edit3, Save, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface ProfileTabProps {
  user: User;
  lang: LanguageCode;
  claimedMedals: string[];
  offlineCount: number;
  onNavigateToTab: (tab: 'ai-assistant' | 'tutor' | 'quiz' | 'exam' | 'career' | 'settings' | 'profile') => void;
}

const AVATARS = [
  { id: 'fox', emoji: '🦊', name: 'Smart Fox' },
  { id: 'owl', emoji: '🦉', name: 'Wise Owl' },
  { id: 'tiger', emoji: '🐯', name: 'Brave Tiger' },
  { id: 'elephant', emoji: '🐘', name: 'Kind Elephant' },
  { id: 'lion', emoji: '🦁', name: 'Royal Lion' },
];

export default function ProfileTab({ user, lang, claimedMedals, offlineCount, onNavigateToTab }: ProfileTabProps) {
  const t = TRANSLATIONS[lang];

  // Load custom student attributes from local storage for offline continuity
  const [village, setVillage] = useState(() => localStorage.getItem('profile_village') || 'Rampur Vilas');
  const [school, setSchool] = useState(() => localStorage.getItem('profile_school') || 'Rampur Primary Public School');
  const [standard, setStandard] = useState(() => localStorage.getItem('profile_standard') || 'Grade 6 Science');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('profile_avatar') || '🦊');
  const [isEditing, setIsEditing] = useState(false);

  // Generate mock but consistent weekly analytics data based on user
  const weeklyData = [
    { day: 'Mon', mins: 35, quizzes: 1 },
    { day: 'Tue', mins: 45, quizzes: 2 },
    { day: 'Wed', mins: 20, quizzes: 0 },
    { day: 'Thu', mins: 55, quizzes: 3 },
    { day: 'Fri', mins: 40, quizzes: 1 },
    { day: 'Sat', mins: 60, quizzes: 2 },
    { day: 'Sun', mins: loggedMinutesToday(), quizzes: claimedMedals.length > 0 ? 1 : 0 },
  ];

  function loggedMinutesToday() {
    return 30 + claimedMedals.length * 10;
  }

  const saveProfileDetails = () => {
    localStorage.setItem('profile_village', village);
    localStorage.setItem('profile_school', school);
    localStorage.setItem('profile_standard', standard);
    localStorage.setItem('profile_avatar', selectedAvatar);
    setIsEditing(false);
  };

  const totalWeeklyMins = weeklyData.reduce((acc, curr) => acc + curr.mins, 0);

  // Hardcoded but consistent curriculum stats
  const subjects = [
    { name: 'Science 🔬', completed: 3, total: 5, color: '#81B29A', accuracy: '85%' },
    { name: 'Mathematics 📐', completed: 2, total: 4, color: '#F2CC8F', accuracy: '75%' },
    { name: 'Languages 🗣️', completed: 4, total: 4, color: '#E07A5F', accuracy: '95%' },
    { name: 'General Knowledge 🧠', completed: 1, total: 3, color: '#3D405B', accuracy: '80%' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS HERO CARD */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-36 h-36 bg-[#81B29A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/2 w-48 h-48 bg-[#E07A5F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Avatar and Name */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full sm:w-auto">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#FAF8F4] border-4 border-[#F2CC8F] rounded-full flex items-center justify-center text-5xl shadow-md select-none transition-transform duration-300 hover:rotate-6">
                {selectedAvatar}
              </div>
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 bg-[#3D405B] text-white p-1 rounded-full text-xs shadow">
                  ✏️
                </div>
              )}
            </div>

            <div className="space-y-2 w-full sm:w-auto">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="font-display font-extrabold text-2xl text-[#3D405B]">
                    {user.name}
                  </h2>
                  <span className="inline-flex self-center sm:self-auto items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#81B29A]/10 text-emerald-700 border border-[#81B29A]/30">
                    Active Student 🌟
                  </span>
                </div>
                
                {/* School/College subtitle */}
                {!isEditing ? (
                  <p className="font-sans text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <School className="h-4 w-4 text-[#81B29A]" />
                    <span>{standard} • {school}</span>
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      placeholder="e.g. Class 6 Science"
                      className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] w-full"
                    />
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Rampur Primary School"
                      className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] w-full"
                    />
                  </div>
                )}
              </div>

              {/* Village Location */}
              {!isEditing ? (
                <p className="font-sans text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#E07A5F]" />
                  <span>{village}, India</span>
                </p>
              ) : (
                <div className="flex gap-2">
                  <span className="text-xs self-center font-bold text-gray-500">Village:</span>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Village Name"
                    className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex gap-2">
            {!isEditing ? (
              <button
                id="edit-profile-details"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-[#3D405B] font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                id="save-profile-details"
                onClick={saveProfileDetails}
                className="px-4 py-2 bg-gradient-to-r from-[#3D405B] to-[#E07A5F] text-white font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Avatar Picker popup if editing */}
        {isEditing && (
          <div className="mt-5 p-4 bg-gray-50/60 rounded-2xl border border-gray-150 text-left space-y-2 animate-fade-in">
            <h4 className="font-display font-black text-xs text-[#3D405B] uppercase tracking-wider">
              Choose your Learning Mascot Mascot:
            </h4>
            <div className="flex flex-wrap gap-3">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.emoji)}
                  className={`p-2.5 rounded-xl text-3xl transition-all cursor-pointer border ${
                    selectedAvatar === av.emoji 
                      ? 'bg-amber-100 border-[#F2CC8F] scale-110 shadow-3xs' 
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  }`}
                  title={av.name}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. CORE SCHOLASTIC METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Medals */}
        <div 
          onClick={() => onNavigateToTab('tutor')}
          className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left cursor-pointer transition-transform duration-300 hover:scale-102 flex flex-col justify-between h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 block bg-amber-50 px-1.5 py-0.5 rounded uppercase">
              Golden
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">My Medals</span>
            <span className="text-xl font-black text-[#3D405B]">{claimedMedals.length} Unlocked</span>
          </div>
        </div>

        {/* Metric 2: Daily Streak */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 pointer-events-none scale-150 opacity-10">🔥</div>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-50 rounded-xl border border-orange-100 text-[#E07A5F]">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#E07A5F] block bg-orange-50 px-1.5 py-0.5 rounded uppercase">
              Hot
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">Daily Streak</span>
            <span className="text-xl font-black text-[#3D405B]">5 Days Studied</span>
          </div>
        </div>

        {/* Metric 3: Screen Minutes */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal-50 rounded-xl border border-teal-100 text-[#81B29A]">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 block bg-teal-50 px-1.5 py-0.5 rounded uppercase">
              Active
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">Time Studied</span>
            <span className="text-xl font-black text-[#3D405B]">{totalWeeklyMins} Minutes</span>
          </div>
        </div>

        {/* Metric 4: Offline Files Synced */}
        <div 
          onClick={() => onNavigateToTab('settings')}
          className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left cursor-pointer transition-transform duration-300 hover:scale-102 flex flex-col justify-between h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150 text-[#3D405B]">
              <Database className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 block bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
              2G Cache
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">Synced Files</span>
            <span className="text-xl font-black text-[#3D405B]">{offlineCount} packs saved</span>
          </div>
        </div>

      </div>

      {/* 3. RECHARTS STUDY ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Study Area Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider">
                Weekly Learning Area
              </h3>
              <p className="text-[11px] text-gray-400">Minutes of customized voice lessons & reading logs</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#E07A5F] bg-[#FAF8F4] px-2 py-1 rounded-sm border border-[#F2CC8F]/40 uppercase">
                Avg: {Math.round(totalWeeklyMins / 7)} mins/day
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E07A5F" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '10px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#3d405b' }}
                />
                <Area type="monotone" dataKey="mins" name="Study Time (Mins)" stroke="#E07A5F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subjects Progression */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider">
              Syllabus Mapping Progress
            </h3>
            <p className="text-[11px] text-gray-400">Grade curriculum completion rates</p>
          </div>

          <div className="space-y-3.5 my-4">
            {subjects.map((sub, sIdx) => {
              const pct = Math.round((sub.completed / sub.total) * 100);
              return (
                <div key={sIdx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-gray-700">{sub.name}</span>
                    <span className="font-mono font-bold text-gray-500">{pct}% ({sub.completed}/{sub.total})</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: sub.color }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Quiz score avg:</span>
                    <span className="font-bold text-[#3D405B]">{sub.accuracy}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateToTab('tutor')}
            className="w-full py-2 bg-[#FAF8F4] border border-[#F2CC8F]/50 hover:bg-[#F2CC8F]/10 active:scale-98 text-xs font-sans font-bold text-[#3D405B] rounded-xl cursor-pointer text-center block transition-all"
          >
            Study Next Chapters ➡️
          </button>
        </div>

      </div>

      {/* 4. MEDAL CASE & STUDY HISTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Interactive Achievements Deck */}
        <div className="bg-white p-5 rounded-2xl border border-[#F2CC8F]/30 shadow-3xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              Accolades Showcase Room
            </h3>
            <span className="text-[10px] font-mono text-gray-400 font-bold">Unblock with 100% scores</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            
            {/* Medal A: Rain */}
            <div className={`p-3 rounded-xl border text-center space-y-1 ${
              claimedMedals.includes('rain') 
                ? 'bg-amber-50/70 border-amber-250 text-amber-950' 
                : 'bg-gray-50 border-gray-150 text-gray-300 opacity-60'
            }`}>
              <div className="text-3xl filter drop-shadow-sm select-none">
                {claimedMedals.includes('rain') ? '🌧️' : '🔒'}
              </div>
              <div className="text-[10px] font-sans font-extrabold truncate">Rain Master</div>
              <div className="text-[8px] font-mono text-gray-400 font-bold uppercase">
                {claimedMedals.includes('rain') ? 'Unlocked' : 'Science 🔬'}
              </div>
            </div>

            {/* Medal B: Photo */}
            <div className={`p-3 rounded-xl border text-center space-y-1 ${
              claimedMedals.includes('photo') 
                ? 'bg-emerald-50/70 border-emerald-250 text-emerald-950' 
                : 'bg-gray-50 border-gray-150 text-gray-300 opacity-60'
            }`}>
              <div className="text-3xl filter drop-shadow-sm select-none">
                {claimedMedals.includes('photo') ? '🌿' : '🔒'}
              </div>
              <div className="text-[10px] font-sans font-extrabold truncate">Plants Chef</div>
              <div className="text-[8px] font-mono text-gray-400 font-bold uppercase">
                {claimedMedals.includes('photo') ? 'Unlocked' : 'Science 🔬'}
              </div>
            </div>

            {/* Medal C: Math */}
            <div className={`p-3 rounded-xl border text-center space-y-1 ${
              claimedMedals.includes('math') 
                ? 'bg-orange-50/70 border-orange-250 text-orange-950' 
                : 'bg-gray-50 border-gray-150 text-gray-300 opacity-60'
            }`}>
              <div className="text-3xl filter drop-shadow-sm select-none">
                {claimedMedals.includes('math') ? '📐' : '🔒'}
              </div>
              <div className="text-[10px] font-sans font-extrabold truncate">Calc Speedster</div>
              <div className="text-[8px] font-mono text-gray-400 font-bold uppercase">
                {claimedMedals.includes('math') ? 'Unlocked' : 'Math 📐'}
              </div>
            </div>

          </div>

          {claimedMedals.length === 0 && (
            <p className="text-[11px] text-[#E07A5F] text-center bg-orange-50 p-2.5 rounded-xl border border-orange-100 font-sans font-semibold">
              ⚠️ You haven't earned any rewards yet. Study a chapter under "Tutor" and score 100% on the Quiz to unlock medals!
            </p>
          )}
        </div>

        {/* Live Study Feed Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-[#E07A5F]" />
              Recent Learning Feed
            </h3>
            <span className="text-[10px] font-mono text-gray-400 font-bold">Updated offline</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            
            <div className="flex gap-3 text-xs leading-relaxed border-b border-gray-50 pb-2.5">
              <span className="p-1 rounded-sm bg-blue-50 text-blue-600 block h-max">🗣️</span>
              <div>
                <p className="font-sans font-bold text-gray-800">Assisted voice-reading with Dadi AI</p>
                <span className="text-[10px] font-mono text-gray-400">Today • 15 minutes of audio synthesis</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed border-b border-gray-50 pb-2.5">
              <span className="p-1 rounded-sm bg-amber-50 text-amber-600 block h-max">🏆</span>
              <div>
                <p className="font-sans font-bold text-gray-800">
                  Passed Quiz with 100% scores
                </p>
                <span className="text-[10px] font-mono text-gray-400">Today • Earned academic medal</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed border-b border-gray-50 pb-2.5">
              <span className="p-1 rounded-sm bg-indigo-50 text-indigo-600 block h-max">📥</span>
              <div>
                <p className="font-sans font-bold text-gray-800">Synced Offline Video Files Cache Pack</p>
                <span className="text-[10px] font-mono text-gray-400">Yesterday • Saved 4.2 MB memory</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed">
              <span className="p-1 rounded-sm bg-purple-50 text-purple-600 block h-max">🔑</span>
              <div>
                <p className="font-sans font-bold text-gray-800">Registered Gramin Student Academic ID</p>
                <span className="text-[10px] font-mono text-gray-400">Joined Date: {user.signupDate || "June 2026"}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
