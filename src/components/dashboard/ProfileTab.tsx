import { useState, useEffect } from 'react';
import { User, LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { 
  Award, Flame, Clock, BookOpen, Database, MapPin, School, Phone, Calendar, 
  Sparkles, Settings, Globe, ShieldCheck, Edit3, Save, CheckCircle,
  Trophy, Zap, Star, Compass, Brain, CheckCircle2, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { offlineSyncManager } from '../../utils/offlineSync';

interface ProfileTabProps {
  user: User;
  lang: LanguageCode;
  claimedMedals: string[];
  offlineCount: number;
  onNavigateToTab: (tab: 'ai-assistant' | 'tutor' | 'offline-library' | 'quiz' | 'exam' | 'career' | 'settings' | 'profile') => void;
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

  // Gamified statistics from localStorage
  const [userPoints, setUserPoints] = useState(() => Number(localStorage.getItem('quizzes_total_points')) || 40);
  const [streakDays, setStreakDays] = useState(() => Number(localStorage.getItem('profile_streak_days')) || 5);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(() => localStorage.getItem('profile_checked_in_today') === 'true');
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked' | 'science' | 'math'>('all');
  const [streakCelebration, setStreakCelebration] = useState(false);

  // Sync state points change on local storage updates (for instance from quizzes passed)
  useEffect(() => {
    const handleStorageChange = () => {
      setUserPoints(Number(localStorage.getItem('quizzes_total_points')) || 40);
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll to keep in sync if tabs are operated
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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

  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) return;

    const newStreak = streakDays + 1;
    const newPoints = userPoints + 15;

    // Save to local storage
    localStorage.setItem('profile_streak_days', String(newStreak));
    localStorage.setItem('quizzes_total_points', String(newPoints));
    localStorage.setItem('profile_checked_in_today', 'true');

    // Update state
    setStreakDays(newStreak);
    setUserPoints(newPoints);
    setHasCheckedInToday(true);
    setStreakCelebration(true);

    // Queue offline sync progress to user stats
    offlineSyncManager.queuePendingProgress('quiz_points', 15);

    // Auto-clear celebration banner
    setTimeout(() => {
      setStreakCelebration(false);
    }, 4500);
  };

  const badgesList = [
    {
      id: 'first_step',
      name: lang === 'hi' ? 'पहला कदम' : 'First Step',
      title: lang === 'hi' ? 'ग्रामीण शुरुआत' : 'Rural Scholar Launch',
      emoji: '🚀',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      desc: lang === 'hi' ? 'अपना पहला ग्रामीण छात्र आईडी प्रोफाइल पंजीकृत करने पर प्राप्त।' : 'Awarded for successfully creating and activating your custom student academy profile.',
      required: lang === 'hi' ? 'पंजीकृत छात्र आईडी' : 'Created Student ID Profile',
      unlocked: true,
      category: 'general'
    },
    {
      id: 'science_explorer',
      name: lang === 'hi' ? 'विज्ञान अन्वेषक' : 'Science Explorer',
      title: lang === 'hi' ? 'प्रकृति प्रेमी' : 'Nature & Stars Scholar',
      emoji: '🔬',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      desc: lang === 'hi' ? 'विज्ञान के वर्षा और पौधे के दोनों अध्यायों को पूरा करने और पदक अर्जित करने पर।' : 'Earned by fully mastering both natural Science chapters (Rain cycle and Plant Chlorophyll) with 100% scores.',
      required: lang === 'hi' ? 'वर्षा और पौधे दोनों स्वर्ण पदक प्राप्त करें' : 'Earn Rain & Plants gold medals (Science)',
      unlocked: claimedMedals.includes('rain') && claimedMedals.includes('photo'),
      category: 'science'
    },
    {
      id: 'math_wizard',
      name: lang === 'hi' ? 'गणित के जादूगर' : 'Math Prodigy',
      title: lang === 'hi' ? 'चतुर लोमड़ी' : 'Super Calculation Speedster',
      emoji: '📐',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      desc: lang === 'hi' ? 'चंदा के साथ गणित की चालों और तेज़ गणनाओं की परीक्षा पास करने पर।' : 'Awarded for completing the Mathematics speed multiplication quiz with a flawless score.',
      required: lang === 'hi' ? 'गणित का स्वर्ण पदक प्राप्त करें' : 'Earn Mathematics gold medal',
      unlocked: claimedMedals.includes('math'),
      category: 'math'
    },
    {
      id: 'streak_flame',
      name: lang === 'hi' ? 'अखंड ज्योति' : 'Consistent Streak',
      title: lang === 'hi' ? 'नियमित अध्येता' : 'Unstoppable Mindset',
      emoji: '🔥',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      desc: lang === 'hi' ? 'लगातार 5 दिनों तक पढ़ने का रिकॉर्ड बनाने पर।' : 'Study for 5 consecutive days to spark continuous learning consistency.',
      required: lang === 'hi' ? '5 दिनों की लगातार पढ़ाई' : 'Reach a 5-Day study streak',
      unlocked: streakDays >= 5,
      category: 'streak'
    },
    {
      id: 'offline_pioneer',
      name: lang === 'hi' ? 'ऑफ़लाइन अग्रदूत' : 'Offline Pioneer',
      title: lang === 'hi' ? 'बिना इंटरनेट के पढ़ाई' : 'Zero-Data Hero',
      emoji: '📦',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      desc: lang === 'hi' ? 'ऑफ़लाइन अध्ययन के लिए कम से कम एक पाठ का पीडीएफ़ या डेटा सिंक करने पर।' : 'Sync lessons or quizzes offline to study with zero active mobile network.',
      required: lang === 'hi' ? 'ऑफ़लाइन कैश में फ़ाइलें सहेजें' : 'Save at least 1 lesson offline',
      unlocked: offlineCount > 0,
      category: 'offline'
    },
    {
      id: 'storyteller',
      name: lang === 'hi' ? 'ग्रामीण वक्ता' : 'Village Storyteller',
      title: lang === 'hi' ? 'दादी माँ के लोककथा' : 'Indian Folklore Master',
      emoji: '🗣️',
      color: 'bg-teal-50 border-teal-200 text-teal-700',
      desc: lang === 'hi' ? 'शुभम भैया और दादी माँ एआई के साथ बातचीत का सिलसिला शुरू करने पर।' : 'Earned by engaging in a science-storytelling dialog with our village mentors.',
      required: lang === 'hi' ? 'दादी माँ एआई से पहली बातचीत' : 'First chat with grandmother AI tutor',
      unlocked: true,
      category: 'general'
    }
  ];

  const filteredBadges = badgesList.filter(badge => {
    if (badgeFilter === 'all') return true;
    if (badgeFilter === 'unlocked') return badge.unlocked;
    if (badgeFilter === 'locked') return !badge.unlocked;
    if (badgeFilter === 'science') return badge.category === 'science';
    if (badgeFilter === 'math') return badge.category === 'math';
    return true;
  });

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

              {/* Gamified level progress bar */}
              <div className="pt-2.5 animate-fade-in flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex justify-between items-center w-full max-w-[256px] mb-1">
                  <span className="text-[11px] font-extrabold text-[#E07A5F] flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                    <span>Level {Math.floor(userPoints / 100) + 1} Rural Scholar</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-extrabold">
                    {userPoints % 100}/100 XP
                  </span>
                </div>
                <div className="h-2 w-full max-w-[256px] bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-3xs">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F2CC8F] to-[#E07A5F] rounded-full transition-all duration-700"
                    style={{ width: `${userPoints % 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 font-sans mt-1">
                  Earn points from quizzes or daily check-ins to level up!
                </span>
              </div>
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
            <span className="text-xl font-black text-[#3D405B]">{streakDays} Days Studied</span>
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

      {/* 4. DAILY STREAK PATH ROADMAP (Gamified Continuity) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-3xs space-y-4 text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-display font-extrabold text-[#3D405B] text-base uppercase tracking-wider flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#E07A5F] animate-pulse" />
              {lang === 'hi' ? 'दैनिक अध्ययन निरंतरता पथ 🛤️' : 'Daily Consistency Streak Path 🛤️'}
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              {lang === 'hi' ? 'हर दिन चेक-इन करें और मुफ़्त में +15 XP अंक प्राप्त करें!' : 'Check in each day of continuous study and unlock +15 XP bonus points!'}
            </p>
          </div>
          <div className="shrink-0">
            {hasCheckedInToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                <span>{lang === 'hi' ? 'आज का चेक-इन पूर्ण' : 'Checked In Today'}</span>
              </span>
            ) : (
              <button
                onClick={handleDailyCheckIn}
                className="px-4 py-2 bg-gradient-to-r from-[#E07A5F] to-[#F2CC8F] hover:from-[#F2CC8F] hover:to-[#E07A5F] text-white text-xs font-black rounded-xl border border-orange-200/50 cursor-pointer shadow-3xs active:scale-95 transition-all duration-300 flex items-center gap-1.5 animate-pulse"
              >
                <Zap className="h-4 w-4 text-yellow-300 animate-bounce" />
                <span>{lang === 'hi' ? 'चेक-इन करें (+15 XP)' : 'Claim Daily Reward (+15 XP)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 7-Day sequence map */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center pt-2">
          {[
            { num: 1, label: lang === 'hi' ? 'दिन 1' : 'Day 1' },
            { num: 2, label: lang === 'hi' ? 'दिन 2' : 'Day 2' },
            { num: 3, label: lang === 'hi' ? 'दिन 3' : 'Day 3' },
            { num: 4, label: lang === 'hi' ? 'दिन 4' : 'Day 4' },
            { num: 5, label: lang === 'hi' ? 'दिन 5' : 'Day 5' },
            { num: 6, label: lang === 'hi' ? 'आज' : 'Today' },
            { num: 7, label: lang === 'hi' ? 'दिन 7' : 'Day 7' }
          ].map((d) => {
            // Unlocked if <= streakDays. If streakDays is 5, days 1 to 5 are checked. 
            // If hasCheckedInToday is true, Day 6 is checked as well!
            let isDayCompleted = d.num < streakDays || (d.num === streakDays && hasCheckedInToday) || (d.num < 6);
            if (streakDays > 5) {
              isDayCompleted = d.num <= streakDays || (d.num === 6 && hasCheckedInToday);
            }
            const isToday = d.num === 6;

            return (
              <div 
                key={d.num} 
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all duration-300 ${
                  isDayCompleted 
                    ? 'bg-amber-50/50 border-amber-200 text-amber-950' 
                    : isToday 
                    ? 'bg-white border-[#E07A5F] border-2 shadow-2xs text-[#E07A5F]' 
                    : 'bg-gray-50 border-gray-150 text-gray-300'
                }`}
              >
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">
                  {d.label}
                </span>
                <div className="text-2xl my-2 select-none">
                  {isDayCompleted ? '🔥' : isToday ? '⭐' : '🔒'}
                </div>
                <div className="w-full flex justify-center">
                  {isDayCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 bg-white rounded-full shadow-3xs" />
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-gray-400">
                      {isToday ? '+15 XP' : 'Day ' + d.num}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak milestone alert banner if celebration is active */}
        {streakCelebration && (
          <div className="bg-[#81B29A] text-white p-3 rounded-2xl border border-emerald-600 animate-bounce flex items-center justify-center gap-2.5 shadow-sm text-xs font-sans font-bold">
            <Trophy className="h-5 w-5 text-yellow-300 animate-spin" />
            <span>
              {lang === 'hi' 
                ? `वाह! शानदार निरंतरता! +15 XP अंक अर्जित हुए। आपका नया लेवल: ${Math.floor(userPoints / 100) + 1}!` 
                : `Awesome Consistency Streak! +15 XP claimed. Your current Level: ${Math.floor(userPoints / 100) + 1}!`}
            </span>
          </div>
        )}
      </div>

      {/* 5. VISUAL BADGE SYSTEM & STUDY HISTORY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Interactive Achievements & Badges Deck */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                {lang === 'hi' ? 'मेरा पदक और बैज शोकेस' : 'Milestones & Badges Showcase'}
              </h3>
              <p className="text-[11px] text-gray-400 font-sans">
                {lang === 'hi' ? 'विशेष विषयों को पार करके और निरंतर अभ्यास से बैज अनलॉक करें।' : 'Showcase your subject mastery, caching efforts, and study consistency.'}
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: lang === 'hi' ? 'सभी' : 'All' },
                { id: 'unlocked', label: lang === 'hi' ? 'अनलॉक' : 'Unlocked' },
                { id: 'science', label: lang === 'hi' ? 'विज्ञान' : 'Science' },
                { id: 'math', label: lang === 'hi' ? 'गणित' : 'Math' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setBadgeFilter(f.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer border transition-colors ${
                    badgeFilter === f.id 
                      ? 'bg-[#3D405B] text-white border-[#3D405B]' 
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredBadges.map((badge) => (
              <div 
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3.5 rounded-2xl border text-center relative flex flex-col justify-between items-center cursor-pointer transition-all duration-300 group hover:scale-103 ${
                  badge.unlocked 
                    ? 'bg-gradient-to-br from-white to-amber-50/10 border-amber-250 shadow-3xs' 
                    : 'bg-gray-50/70 border-gray-200 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-xl text-3xl filter drop-shadow-sm select-none mb-1 group-hover:scale-110 transition-transform duration-300 ${
                  badge.unlocked ? 'bg-amber-50/50' : 'bg-gray-100'
                }`}>
                  {badge.unlocked ? badge.emoji : '🔒'}
                </div>
                
                <div className="space-y-0.5">
                  <div className="text-[11px] font-sans font-black text-gray-800 line-clamp-1">
                    {badge.name}
                  </div>
                  <div className="text-[9px] font-semibold text-gray-400 font-mono tracking-wider line-clamp-1 uppercase">
                    {badge.unlocked ? (lang === 'hi' ? 'अनलॉक किया' : 'Unlocked') : (lang === 'hi' ? 'लॉक्ड' : 'Locked')}
                  </div>
                </div>

                {/* Achievement progress indicators */}
                <div className="w-full mt-2 pt-1.5 border-t border-gray-100/60 flex items-center justify-between text-[8px] font-mono font-bold text-gray-400">
                  <span>{badge.category.toUpperCase()}</span>
                  <span className={badge.unlocked ? 'text-emerald-600' : 'text-gray-400'}>
                    {badge.unlocked ? '100%' : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 font-mono">
              No matching badges found. Keep learning to expand your shelf!
            </p>
          )}
        </div>

        {/* Live Study Feed Logs */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-4">
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
                <span className="text-[10px] font-mono text-gray-400 font-extrabold block">Today • 15 minutes of audio synthesis</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed border-b border-gray-50 pb-2.5">
              <span className="p-1 rounded-sm bg-amber-50 text-amber-600 block h-max">🏆</span>
              <div>
                <p className="font-sans font-bold text-gray-800">
                  Passed Quiz with 100% scores
                </p>
                <span className="text-[10px] font-mono text-gray-400 font-extrabold block">Today • Earned academic medal</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed border-b border-gray-50 pb-2.5">
              <span className="p-1 rounded-sm bg-indigo-50 text-indigo-600 block h-max">📥</span>
              <div>
                <p className="font-sans font-bold text-gray-800">Synced Offline Video Files Cache Pack</p>
                <span className="text-[10px] font-mono text-gray-400 font-extrabold block">Yesterday • Saved 4.2 MB memory</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed">
              <span className="p-1 rounded-sm bg-purple-50 text-purple-600 block h-max">🔑</span>
              <div>
                <p className="font-sans font-bold text-gray-800">Registered Gramin Student Academic ID</p>
                <span className="text-[10px] font-mono text-gray-400 font-extrabold block">Joined Date: {user.signupDate || "June 2026"}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Badge Detail Modal popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xl max-w-sm w-full text-center space-y-4 relative animate-scale-up">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <span className="text-xl font-bold font-sans">✕</span>
            </button>
            <div className="text-6xl mx-auto py-2 filter drop-shadow-sm select-none animate-bounce">
              {selectedBadge.emoji}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#E07A5F] uppercase tracking-widest block mb-1">
                {selectedBadge.category} Milestone
              </span>
              <h4 className="font-display font-extrabold text-[#3D405B] text-lg leading-tight">
                {selectedBadge.name}
              </h4>
              <p className="text-xs text-[#81B29A] font-bold mt-0.5">
                {selectedBadge.title}
              </p>
            </div>
            <div className="bg-[#FAF8F4] p-3.5 rounded-2xl border border-amber-100 text-left text-xs text-gray-600 font-sans space-y-1.5">
              <p className="font-semibold text-gray-800">
                {lang === 'hi' ? 'बैज विवरण:' : 'Badge Description:'}
              </p>
              <p>{selectedBadge.desc}</p>
              <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-gray-500">
                  {lang === 'hi' ? 'आवश्यकता:' : 'Requirement:'}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedBadge.unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {selectedBadge.unlocked ? (lang === 'hi' ? 'पूर्ण' : 'Mastered') : (lang === 'hi' ? 'अनलॉक करें' : 'To Unlock')}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono italic">
                {selectedBadge.required}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              {!selectedBadge.unlocked && (
                <button
                  onClick={() => {
                    setSelectedBadge(null);
                    onNavigateToTab('tutor');
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-[#3D405B] to-[#E07A5F] text-white text-xs font-sans font-black rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all text-center"
                >
                  {lang === 'hi' ? 'चैप्टर पढ़ें 📚' : 'Go to Lessons 📚'}
                </button>
              )}
              <button
                onClick={() => setSelectedBadge(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-[#3D405B] text-xs font-sans font-bold rounded-xl cursor-pointer transition-all"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
