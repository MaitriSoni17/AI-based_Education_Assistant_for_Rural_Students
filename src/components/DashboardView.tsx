import { useState, useEffect, useRef } from 'react';
import { LanguageCode, User, OfflineResource } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';
import { getDeterministicAvatar } from '../utils/avatar';
import { speakText, stopSpeaking } from '../utils/speech';
import { offlineSyncManager } from '../utils/offlineSync';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

// Modular Tab Components
import ProfileTab, { formatStudyTime } from './dashboard/ProfileTab';
import AdminPdfsTab from './dashboard/AdminPdfsTab';
import AIAssistantTab from './dashboard/AIAssistantTab';
import TutorTab from './dashboard/TutorTab';
import QuizTab from './dashboard/QuizTab';
import ExamPrepTab from './dashboard/ExamPrepTab';
import CareerGuidanceTab from './dashboard/CareerGuidanceTab';
import SettingsTab from './dashboard/SettingsTab';
import OfflineLibraryTab from './dashboard/OfflineLibraryTab';
import CertificatesTab from './dashboard/CertificatesTab';
import EquationsTab from './dashboard/EquationsTab';
import PuzzleGamesTab from './dashboard/PuzzleGamesTab';

// Icons
import { 
  User as UserIcon, MessageSquare, BookOpen, GraduationCap, 
  HelpCircle, Sparkles, Award, Settings as SettingsIcon, LogOut, Download, Globe, Menu, X,
  RefreshCw, Wifi, WifiOff, Flame, Clock, Binary, FileText, ChevronDown, Check, Grid, Layers,
  Gamepad2
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

export default function DashboardView({ user, lang, onUpdateUser }: DashboardViewProps) {
  // Navigation active tab controller: default to 'profile' as requested for the overview
  const [activeTab, setActiveTab] = useState<'profile' | 'admin-pdfs' | 'ai-assistant' | 'tutor' | 'quiz' | 'exam' | 'career' | 'settings' | 'certificates' | 'equations' | 'puzzles'>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobilePageDrawerOpen, setIsMobilePageDrawerOpen] = useState(false);

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
      if (Array.isArray(saved)) return saved;
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
      if (Array.isArray(saved)) {
        setClaimedMedals(saved);
      } else {
        setClaimedMedals(saved ? JSON.parse(saved) : []);
      }
    } catch {
      setClaimedMedals([]);
    }
  }, [user.mobile]);

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

  // Automatically sync/unlock corresponding medals based on earned certificates (e.g., perfect scores or passed quizzes)
  useEffect(() => {
    if (!localUser.earnedCertificates) return;
    try {
      const certs = JSON.parse(localUser.earnedCertificates) as any[];
      if (!Array.isArray(certs)) return;

      const newMedals = [...claimedMedals];
      let changed = false;

      certs.forEach((cert) => {
        // Only award medals for high performance (e.g. perfect score or passing with high percentage)
        const totalQ = cert.totalQuestions || 5;
        const pct = cert.score / totalQ;
        if (pct >= 0.8) {
          const titleLower = (cert.quizTitle || '').toLowerCase();
          const idLower = (cert.quizId || '').toLowerCase();

          // Science
          if (
            idLower.includes('sci') || 
            idLower.includes('env') || 
            idLower.includes('photo') || 
            titleLower.includes('science') || 
            titleLower.includes('earth') || 
            titleLower.includes('environment') || 
            titleLower.includes('photosynthesis') || 
            titleLower.includes('rain') ||
            titleLower.includes('cloud')
          ) {
            const scienceMedals = ['rain', 'photo', 'ch-photosynthesis'];
            scienceMedals.forEach((m) => {
              if (!newMedals.includes(m)) {
                newMedals.push(m);
                changed = true;
              }
            });
          }

          // Math
          if (
            idLower.includes('math') || 
            idLower.includes('equation') || 
            idLower.includes('mult') || 
            titleLower.includes('math') || 
            titleLower.includes('equation') || 
            titleLower.includes('multiplication') || 
            titleLower.includes('fraction') ||
            titleLower.includes('algebra')
          ) {
            const mathMedals = ['math', 'ch-multiplication'];
            mathMedals.forEach((m) => {
              if (!newMedals.includes(m)) {
                newMedals.push(m);
                changed = true;
              }
            });
          }

          // Languages
          if (
            idLower.includes('lang') || 
            idLower.includes('eng') || 
            idLower.includes('hindi') || 
            titleLower.includes('language') || 
            titleLower.includes('english') || 
            titleLower.includes('grammar')
          ) {
            if (!newMedals.includes('lang')) {
              newMedals.push('lang');
              changed = true;
            }
          }

          // General Knowledge
          if (
            idLower.includes('gk') || 
            idLower.includes('general') || 
            titleLower.includes('gk') || 
            titleLower.includes('general knowledge') || 
            titleLower.includes('trivia')
          ) {
            if (!newMedals.includes('gk')) {
              newMedals.push('gk');
              changed = true;
            }
          }
        }
      });

      if (changed) {
        setClaimedMedals(newMedals);
      }
    } catch (e) {
      console.error("Error auto-unlocking medals from certificates:", e);
    }
  }, [localUser.earnedCertificates, claimedMedals]);

  // Use a ref to track the latest localUser state and prevent stale closures inside snapshot listener
  const latestLocalUserRef = useRef<User>(localUser);
  useEffect(() => {
    latestLocalUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    if (!user.mobile) return;

    const path = `users/${user.mobile}`;
    const userDocRef = doc(db, 'users', user.mobile);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        
        // Prevent stale snapshot data from overwriting newer local state updates (LWW)
        const localTs = latestLocalUserRef.current?.updatedAt || 0;
        const remoteTs = data.updatedAt || 0;
        if (remoteTs < localTs) {
          console.log("[onSnapshot Sync] Skipped older remote update (LWW check). Local timestamp is newer.");
          return;
        }

        setLocalUser((prev) => {
          const prevTs = prev?.updatedAt || 0;
          if (remoteTs < prevTs) return prev;
          const merged = { ...prev, ...data };
          return merged;
        });

        // Sync claimed medals if it has changed
        if (data.claimedMedals) {
          try {
            const parsed = Array.isArray(data.claimedMedals)
              ? data.claimedMedals
              : JSON.parse(data.claimedMedals) as string[];
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
    { id: 'profile', label: 'My Profile Overview', category: 'Account & Settings', icon: UserIcon, color: 'text-blue-500 bg-blue-50' },
    { id: 'ai-assistant', label: 'AI Study Chatbot', category: 'AI Learning Tools', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'tutor', label: 'Mascot Class Tutor', category: 'AI Learning Tools', icon: BookOpen, color: 'text-[#81B29A] bg-[#81B29A]/10' },
    { id: 'equations', label: 'Smart Equation Hub', category: 'AI Learning Tools', icon: Binary, color: 'text-orange-500 bg-orange-50' },
    { id: 'admin-pdfs', label: 'Study Materials', category: 'Curriculum & Prep', icon: FileText, color: 'text-rose-600 bg-rose-50' },
    { id: 'quiz', label: 'Topic Play Quizzes', category: 'Practice & Rewards', icon: HelpCircle, color: 'text-amber-500 bg-amber-50' },
    { id: 'puzzles', label: 'AI Puzzle Arena', category: 'Practice & Rewards', icon: Gamepad2, color: 'text-violet-600 bg-violet-50' },
    { id: 'certificates', label: 'My Certificates', category: 'Practice & Rewards', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
    { id: 'exam', label: 'Competitive Exams', category: 'Curriculum & Prep', icon: Award, color: 'text-rose-500 bg-rose-50' },
    { id: 'career', label: 'Career Guidance', category: 'Curriculum & Prep', icon: Sparkles, color: 'text-purple-500 bg-purple-50' },
    { id: 'settings', label: 'System Settings', category: 'Account & Settings', icon: SettingsIcon, color: 'text-gray-500 bg-gray-50' },
  ] as const;

  const activeLabel = sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard';
  const currentActiveItem = sidebarItems.find(i => i.id === activeTab) || sidebarItems[0];
  const CurrentActiveIcon = currentActiveItem.icon;

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
                  className={`w-full p-3 rounded-xl font-sans text-xs sm:text-sm font-bold flex items-center gap-3 transition-all duration-200 hover:translate-x-1 cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#E07A5F] bg-[#FAF8F4] text-[#E07A5F] ring-1 ring-[#FAF8F4]'
                      : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComp className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-left flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MOBILE NAVIGATION BAR & PAGE SELECTOR */}
        <div className="lg:hidden shrink-0 space-y-2">
          {/* Active Page Header Card with "All Pages" Button */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${currentActiveItem.color}`}>
                <CurrentActiveIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Active Page</span>
                <h2 className="text-xs sm:text-sm font-extrabold text-gray-850 truncate">{currentActiveItem.label}</h2>
              </div>
            </div>

            <button
              type="button"
              id="mobile-btn-open-all-pages"
              onClick={() => setIsMobilePageDrawerOpen(true)}
              className="px-3 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Grid className="h-3.5 w-3.5 text-[#F2CC8F]" />
              <span>All Pages ({sidebarItems.length})</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Clean Horizontal Quick Pills (Without default browser scrollbars) */}
          <div className="flex overflow-x-auto gap-2 pb-1 pt-0.5 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-2 px-3.5 rounded-xl font-sans text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all duration-150 cursor-pointer border text-left shrink-0 ${
                    isSelected
                      ? 'bg-[#3D405B] text-white border-transparent shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FULL PAGE SELECTION DRAWER MODAL (MOBILE) */}
        {isMobilePageDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden text-left">
              {/* Drawer Title Header */}
              <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#E07A5F]/15 rounded-xl">
                    <Grid className="h-5 w-5 text-[#E07A5F]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800">
                      Classroom Pages ({sidebarItems.length})
                    </h3>
                    <p className="text-xs text-gray-500 font-sans">Tap any page to navigate instantly</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="mobile-drawer-close-btn"
                  onClick={() => setIsMobilePageDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categorized Pages List */}
              <div className="p-4 overflow-y-auto space-y-4">
                {['AI Learning Tools', 'Curriculum & Prep', 'Practice & Rewards', 'Account & Settings'].map(catName => {
                  const itemsInCat = sidebarItems.filter(i => i.category === catName);
                  if (itemsInCat.length === 0) return null;
                  return (
                    <div key={catName} className="space-y-2">
                      <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest px-1">
                        {catName}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {itemsInCat.map(item => {
                          const IconComp = item.icon;
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsMobilePageDrawerOpen(false);
                              }}
                              className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#3D405B] text-white border-transparent shadow-md'
                                  : 'bg-gray-50/80 border-gray-200 text-gray-800 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : item.color}`}>
                                  <IconComp className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="text-xs font-bold truncate">{item.label}</div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-[#F2CC8F] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STICKY BOTTOM QUICK DOCK (MOBILE THUMB NAV) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-1.5 px-2 shadow-lg flex justify-around items-center">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'ai-assistant', label: 'AI Chat', icon: MessageSquare },
            { id: 'tutor', label: 'Tutor', icon: BookOpen },
            { id: 'admin-pdfs', label: 'Study', icon: FileText },
          ].map((dockItem) => {
            const DockIcon = dockItem.icon;
            const isDockSelected = activeTab === dockItem.id;
            return (
              <button
                key={dockItem.id}
                type="button"
                onClick={() => setActiveTab(dockItem.id as any)}
                className={`flex flex-col items-center justify-center p-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  isDockSelected
                    ? 'text-[#E07A5F] font-extrabold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                <DockIcon className={`h-4.5 w-4.5 ${isDockSelected ? 'text-[#E07A5F]' : 'text-gray-500'}`} />
                <span className="text-[10px] mt-0.5">{dockItem.label}</span>
              </button>
            );
          })}

          {/* Menu Drawer Toggle Button in Bottom Dock */}
          <button
            type="button"
            onClick={() => setIsMobilePageDrawerOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 px-3 rounded-xl text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
          >
            <Grid className="h-4.5 w-4.5 text-[#3D405B]" />
            <span className="text-[10px] mt-0.5">All ({sidebarItems.length})</span>
          </button>
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

            {activeTab === 'admin-pdfs' && (
              <AdminPdfsTab
                user={localUser}
                lang={lang}
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

            {activeTab === 'puzzles' && (
              <PuzzleGamesTab
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
