import { useState, useEffect } from 'react';
import { LanguageCode, User, OfflineResource } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';
import { getDeterministicAvatar } from '../utils/avatar';
import { speakText, stopSpeaking } from '../utils/speech';
import { offlineSyncManager } from '../utils/offlineSync';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

// Modular Tab Components
import ProfileTab, { formatStudyTime } from './dashboard/ProfileTab';
import AIAssistantTab from './dashboard/AIAssistantTab';
import TutorTab from './dashboard/TutorTab';
import QuizTab from './dashboard/QuizTab';
import ExamPrepTab from './dashboard/ExamPrepTab';
import CareerGuidanceTab from './dashboard/CareerGuidanceTab';
import SettingsTab from './dashboard/SettingsTab';
import OfflineLibraryTab from './dashboard/OfflineLibraryTab';
import CertificatesTab from './dashboard/CertificatesTab';
import EquationsTab from './dashboard/EquationsTab';

// Icons
import { 
  User as UserIcon, MessageSquare, BookOpen, GraduationCap, 
  HelpCircle, Sparkles, Award, Settings as SettingsIcon, LogOut, Download, Globe, Menu, X,
  RefreshCw, Wifi, WifiOff, Flame, Clock, Binary
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

export default function DashboardView({ user, lang, onUpdateUser }: DashboardViewProps) {
  // Navigation active tab controller: default to 'profile' as requested for the overview
  const [activeTab, setActiveTab] = useState<'profile' | 'ai-assistant' | 'tutor' | 'quiz' | 'exam' | 'career' | 'settings' | 'certificates' | 'equations'>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top of page whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Sync Manager state tracking
  const [isOnline, setIsOnline] = useState(offlineSyncManager.isOnline());
  const [pendingChatsCount, setPendingChatsCount] = useState(() => offlineSyncManager.getPendingChats(user.mobile).length);
  const [pendingProgressCount, setPendingProgressCount] = useState(() => offlineSyncManager.getPendingProgress(user.mobile).length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  useEffect(() => {
    const handleSyncUpdate = () => {
      setIsOnline(offlineSyncManager.isOnline());
      setPendingChatsCount(offlineSyncManager.getPendingChats(user.mobile).length);
      setPendingProgressCount(offlineSyncManager.getPendingProgress(user.mobile).length);
    };

    const unsubscribe = offlineSyncManager.subscribe(handleSyncUpdate);
    return () => unsubscribe();
  }, [user.mobile]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(lang === 'hi' ? "डेटा मिलाया जा रहा है..." : "Synchronizing offline database...");
    const result = await offlineSyncManager.reconcileAllPending(user.mobile);
    setIsSyncing(false);
    
    if (result.error) {
      setSyncFeedback(result.error);
    } else {
      const chats = result.chatsSynced || 0;
      const progress = result.progressSynced || 0;
      if (chats > 0 || progress > 0) {
        setSyncFeedback(
          lang === 'hi' 
            ? `सफलतापूर्वक सिंक किया गया! ${chats} संदेश और ${progress} प्रगति रिकॉर्ड संरेखित किए गए।`
            : `Sync complete! Reconciled ${chats} pending chats and ${progress} progress metrics.`
        );
      } else {
        setSyncFeedback(
          lang === 'hi'
            ? "सभी स्थानीय डेटा पहले से ही सिंक है! ✨"
            : "All local offline data is up to date! ✨"
        );
      }
    }
    setTimeout(() => setSyncFeedback(''), 4000);
  };

  // Synced Global States for medals and resource counters to bridge tabs
  const [claimedMedals, setClaimedMedals] = useState<string[]>(() => {
    try {
      const saved = user.claimedMedals;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const serialized = JSON.stringify(claimedMedals);
    if (user.claimedMedals !== serialized) {
      onUpdateUser({ claimedMedals: serialized });
    }
  }, [claimedMedals]);

  // Sync claimed medals when active user changes
  useEffect(() => {
    try {
      const saved = user.claimedMedals;
      setClaimedMedals(saved ? JSON.parse(saved) : []);
    } catch {
      setClaimedMedals([]);
    }
  }, [user]);

  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>([
    { id: 'off-1', title: 'Rain & Clouds Lesson Pack', subject: 'Science', size: '12.4 MB', category: 'video', downloaded: true },
    { id: 'off-2', title: 'Photosynthesis Diagram Class-6', subject: 'Science', size: '2.8 MB', category: 'pdf', downloaded: false },
    { id: 'off-3', title: 'Speed Multiplication Audio Lecture', subject: 'Math', size: '6.1 MB', category: 'audio', downloaded: false },
  ]);

  const offlineDownloadedCount = offlineResources.filter(r => r.downloaded).length;

  // Sync user profile settings dynamically via real-time Firestore listener
  const [localUser, setLocalUser] = useState<User>(user);
  
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    if (!user.mobile) return;

    const path = `users/${user.mobile}`;
    const userDocRef = doc(db, 'users', user.mobile);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        
        setLocalUser((prev) => {
          // Merging keys and values safely
          const merged = { ...prev, ...data };
          return merged;
        });

        // Sync claimed medals if it has changed
        if (data.claimedMedals) {
          try {
            const parsed = JSON.parse(data.claimedMedals) as string[];
            setClaimedMedals((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                return parsed;
              }
              return prev;
            });
          } catch (e) {
            console.error("Failed to parse claimedMedals in Firestore real-time listener:", e);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user.mobile]);

  const handleUpdateLocalUser = (updatedData: Partial<User>) => {
    onUpdateUser(updatedData);
  };

  // Stop synthesis when switching tabs
  useEffect(() => {
    stopSpeaking();
  }, [activeTab]);

  const sidebarItems = [
    { id: 'profile', label: 'My Profile Overview', icon: UserIcon, color: 'text-blue-500 bg-blue-50' },
    { id: 'ai-assistant', label: 'AI Study Chatbot', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'tutor', label: 'Mascot Class Tutor', icon: BookOpen, color: 'text-[#81B29A] bg-[#81B29A]/10' },
    { id: 'equations', label: 'Smart Equation Hub', icon: Binary, color: 'text-orange-500 bg-orange-55' },
    { id: 'quiz', label: 'Topic Play Quizzes', icon: HelpCircle, color: 'text-amber-500 bg-amber-50' },
    { id: 'certificates', label: 'My Certificates', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
    { id: 'exam', label: 'Competitive Exams', icon: Award, color: 'text-rose-500 bg-rose-50' },
    { id: 'career', label: 'Career Guidance', icon: Sparkles, color: 'text-purple-500 bg-purple-50' },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, color: 'text-gray-500 bg-gray-50' },
  ] as const;

  const activeLabel = sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard';

  return (
    <div id="school-workspace-dashboard" className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-2 md:py-6 space-y-6 pb-16">
      
      {/* 1. GREETING HEADER BANNER */}
      <header className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-150 flex flex-col md:flex-row justify-between items-center gap-4 text-left shadow-2xs">
        <div className="space-y-1 w-full md:w-auto">
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-[#3D405B] flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl hover:scale-110 transition-transform duration-300">{localUser.avatar || getDeterministicAvatar(localUser.name, localUser.mobile)}</span>
            <span>Namaste, {localUser.name}!</span>
          </h1>
          <p className="text-xs text-gray-500 font-sans">
            Curriculum Medium: <span className="font-bold underline text-[#E07A5F] capitalize">
              {SUPPORTED_LANGUAGES.find(l => l.code === localUser.defaultLanguage)?.label}
            </span>
          </p>
        </div>

        {/* Global summary stats indicators */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Real-time XP Gained Indicator */}
          <div className="bg-emerald-50/50 border border-emerald-250 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 shadow-3xs hover-float duration-300 transition-all cursor-default">
            <Sparkles className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">XP Gained</span>
              <span className="text-xs font-black text-gray-900">{localUser.totalPoints ?? 15} points</span>
            </div>
          </div>

          {/* Real-time Active Streak Indicator */}
          <div className="bg-orange-50/50 border border-orange-250 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 shadow-3xs hover-float duration-300 transition-all cursor-default">
            <Flame className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-orange-800 font-bold uppercase tracking-wider block">Study Streak</span>
              <span className="text-xs font-black text-gray-900">{localUser.streakDays ?? 1} Days</span>
            </div>
          </div>

          {/* Real-time Time Studied Indicator */}
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 shadow-3xs hover-float duration-300 transition-all cursor-default">
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-indigo-800 font-bold uppercase tracking-wider block">Time Studied</span>
              <span className="text-xs font-black text-gray-900">{formatStudyTime(localUser.studyMins ?? 30, lang === 'hi')}</span>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-[#F2CC8F]/40 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 shadow-3xs hover-float duration-300 transition-all cursor-default">
            <Award className="h-4.5 w-4.5 text-amber-500" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-amber-800 font-bold uppercase tracking-wider block">Completed Lessons</span>
              <span className="text-xs font-black text-gray-900">{claimedMedals.length} medals</span>
            </div>
          </div>
        </div>
      </header>



      {/* 2. DYNAMIC WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* DESKTOP SIDEBAR NAVIGATION BOARD */}
        <aside className="lg:col-span-3 bg-white p-4 rounded-3xl border border-gray-150 shadow-sm space-y-4 hidden lg:block text-left">
          <div className="px-3 pb-2 border-b border-gray-100">
            <h3 className="text-[10px] font-mono font-extrabold text-gray-400 uppercase tracking-widest">
              My Class Channels
            </h3>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full p-3 rounded-xl font-sans text-xs sm:text-sm font-bold flex items-center gap-3 transition-all duration-200 hover:translate-x-1 cursor-pointer ${
                    isSelected
                      ? 'border-[#E07A5F] bg-[#FAF8F4] text-[#E07A5F] ring-1 ring-[#FAF8F4]'
                      : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComp className="h-4.5 w-4.5" />
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MOBILE HORIZONTAL SCROLL NAV & TABS SHELTER */}
        <div className="lg:hidden shrink-0">
          <div className="flex overflow-x-auto gap-2 pb-2.5 px-1 scrollbar-thin select-none">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-2.5 px-4 rounded-full font-sans text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition-all duration-200 cursor-pointer border hover-scale-sm ${
                    isSelected
                      ? 'bg-[#3D405B] text-white border-transparent shadow'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE MAIN VIEWPORT CONTAINER */}
        <div className="lg:col-span-9 bg-transparent">
          <div className="animate-fade-in">
            {activeTab === 'profile' && (
              <ProfileTab
                user={localUser}
                lang={lang}
                claimedMedals={claimedMedals}
                offlineCount={offlineDownloadedCount}
                onNavigateToTab={(tabId) => {
                  setActiveTab(tabId as any);
                }}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AIAssistantTab 
                user={localUser}
                lang={lang}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'tutor' && (
              <TutorTab
                user={localUser}
                lang={lang}
                claimedMedals={claimedMedals}
                setClaimedMedals={setClaimedMedals}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizTab
                user={localUser}
                lang={lang}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificatesTab
                user={localUser}
                lang={lang}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'exam' && (
              <ExamPrepTab
                user={localUser}
                lang={lang}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}

            {activeTab === 'career' && (
              <CareerGuidanceTab
                lang={lang}
                user={localUser}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                user={localUser}
                onUpdateUser={handleUpdateLocalUser}
                lang={lang}
                onChangeLanguage={(newCode) => {
                  handleUpdateLocalUser({ defaultLanguage: newCode });
                }}
              />
            )}

            {activeTab === 'equations' && (
              <EquationsTab
                user={localUser}
                lang={lang}
                onUpdateUser={handleUpdateLocalUser}
              />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
