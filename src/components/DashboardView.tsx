import { useState, useEffect } from 'react';
import { LanguageCode, User, OfflineResource } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';
import { speakText, stopSpeaking } from '../utils/speech';
import { offlineSyncManager } from '../utils/offlineSync';

// Modular Tab Components
import ProfileTab from './dashboard/ProfileTab';
import AIAssistantTab from './dashboard/AIAssistantTab';
import TutorTab from './dashboard/TutorTab';
import QuizTab from './dashboard/QuizTab';
import ExamPrepTab from './dashboard/ExamPrepTab';
import CareerGuidanceTab from './dashboard/CareerGuidanceTab';
import SettingsTab from './dashboard/SettingsTab';
import OfflineLibraryTab from './dashboard/OfflineLibraryTab';
import CertificatesTab from './dashboard/CertificatesTab';

// Icons
import { 
  User as UserIcon, MessageSquare, BookOpen, GraduationCap, 
  HelpCircle, Sparkles, Award, Settings as SettingsIcon, LogOut, Download, Globe, Menu, X,
  RefreshCw, Wifi, WifiOff
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  lang: LanguageCode;
}

export default function DashboardView({ user, lang }: DashboardViewProps) {
  // Navigation active tab controller: default to 'profile' as requested for the overview
  const [activeTab, setActiveTab] = useState<'profile' | 'ai-assistant' | 'tutor' | 'offline-library' | 'quiz' | 'exam' | 'career' | 'settings' | 'certificates'>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync Manager state tracking
  const [isOnline, setIsOnline] = useState(offlineSyncManager.isOnline());
  const [pendingChatsCount, setPendingChatsCount] = useState(offlineSyncManager.getPendingChats().length);
  const [pendingProgressCount, setPendingProgressCount] = useState(offlineSyncManager.getPendingProgress().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  useEffect(() => {
    const handleSyncUpdate = () => {
      setIsOnline(offlineSyncManager.isOnline());
      setPendingChatsCount(offlineSyncManager.getPendingChats().length);
      setPendingProgressCount(offlineSyncManager.getPendingProgress().length);
    };

    const unsubscribe = offlineSyncManager.subscribe(handleSyncUpdate);
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(lang === 'hi' ? "डेटा मिलाया जा रहा है..." : "Synchronizing offline database...");
    const result = await offlineSyncManager.reconcileAllPending();
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
    const c = localStorage.getItem('profile_earned_medals');
    return c ? JSON.parse(c) : [];
  });

  useEffect(() => {
    localStorage.setItem('profile_earned_medals', JSON.stringify(claimedMedals));
  }, [claimedMedals]);

  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>([
    { id: 'off-1', title: 'Rain & Clouds Lesson Pack', subject: 'Science', size: '12.4 MB', category: 'video', downloaded: true },
    { id: 'off-2', title: 'Photosynthesis Diagram Class-6', subject: 'Science', size: '2.8 MB', category: 'pdf', downloaded: false },
    { id: 'off-3', title: 'Speed Multiplication Audio Lecture', subject: 'Math', size: '6.1 MB', category: 'audio', downloaded: false },
  ]);

  const offlineDownloadedCount = offlineResources.filter(r => r.downloaded).length;

  // Sync user profile settings
  const [localUser, setLocalUser] = useState<User>(user);
  
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleUpdateLocalUser = (updatedData: Partial<User>) => {
    const nextUser = { ...localUser, ...updatedData };
    setLocalUser(nextUser);
    localStorage.setItem('gramin_student_session', JSON.stringify(nextUser));
  };

  // Stop synthesis when switching tabs
  useEffect(() => {
    stopSpeaking();
  }, [activeTab]);

  const sidebarItems = [
    { id: 'profile', label: 'My Profile Overview', icon: UserIcon, color: 'text-blue-500 bg-blue-50' },
    { id: 'ai-assistant', label: 'AI Study Chatbot', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'tutor', label: 'Mascot Class Tutor', icon: BookOpen, color: 'text-[#81B29A] bg-[#81B29A]/10' },
    { id: 'offline-library', label: 'Offline Library', icon: Download, color: 'text-indigo-500 bg-indigo-50' },
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
        <div className="space-y-1.5 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
              {isOnline ? 'Active Online Connection' : 'Offline Cached Mode'}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
              (pendingChatsCount > 0 || pendingProgressCount > 0)
                ? 'bg-amber-50 text-amber-800 border-amber-150 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-150'
            }`}>
              <RefreshCw className={`h-2.5 w-2.5 ${(pendingChatsCount > 0 || pendingProgressCount > 0) ? 'animate-spin' : ''}`} />
              {(pendingChatsCount > 0 || pendingProgressCount > 0) ? 'Sync: Pending' : 'Sync: Synced'}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-[#3D405B]">
            Namaste, {localUser.name}! 👋
          </h1>
          <p className="text-xs text-gray-500 font-sans">
            Curriculum Medium: <span className="font-bold underline text-[#E07A5F] capitalize">
              {SUPPORTED_LANGUAGES.find(l => l.code === localUser.defaultLanguage)?.label}
            </span>
          </p>
        </div>

        {/* Global summary stats indicators */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-amber-50/50 border border-[#F2CC8F]/40 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-3xs">
            <Award className="h-5 w-5 text-amber-500 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-amber-800 font-bold uppercase tracking-wider block">Completed Lessons</span>
              <span className="text-xs font-black text-gray-900">{claimedMedals.length} medals earned</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-250 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-3xs">
            <Download className="h-5 w-5 text-[#81B29A]" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">Offline Cache</span>
              <span className="text-xs font-black text-gray-900">{offlineDownloadedCount} items saved</span>
            </div>
          </div>

          {/* New visual database sync status indicator */}
          <div className={`border rounded-2xl px-4 py-2 flex items-center gap-2 shadow-3xs transition-all ${
            (pendingChatsCount > 0 || pendingProgressCount > 0)
              ? 'bg-amber-50/60 border-amber-250'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}>
            <RefreshCw className={`h-5 w-5 ${
              (pendingChatsCount > 0 || pendingProgressCount > 0)
                ? 'text-amber-600 animate-spin'
                : 'text-emerald-600'
            }`} />
            <div className="text-left font-mono">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Database Sync</span>
              <span className="text-xs font-black text-gray-900">
                {(pendingChatsCount > 0 || pendingProgressCount > 0) ? (
                  <span className="text-amber-800 font-bold">
                    Pending ({pendingChatsCount + pendingProgressCount} items)
                  </span>
                ) : (
                  <span className="text-emerald-800 font-bold">Synced</span>
                )}
              </span>
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
                  className={`w-full p-3 rounded-xl font-sans text-xs sm:text-sm font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E07A5F] bg-[#FAF8F4] text-[#E07A5F] ring-1 ring-[#FAF8F4]'
                      : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${item.color}`}>
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
                  className={`p-2.5 px-4 rounded-full font-sans text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer border ${
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
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AIAssistantTab 
                lang={lang}
              />
            )}

            {activeTab === 'tutor' && (
              <TutorTab
                user={localUser}
                lang={lang}
                claimedMedals={claimedMedals}
                setClaimedMedals={setClaimedMedals}
              />
            )}

            {activeTab === 'offline-library' && (
              <OfflineLibraryTab 
                lang={lang}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizTab
                lang={lang}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificatesTab
                lang={lang}
                onNavigateToTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 'exam' && (
              <ExamPrepTab
                lang={lang}
              />
            )}

            {activeTab === 'career' && (
              <CareerGuidanceTab
                lang={lang}
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
          </div>
        </div>

      </div>

    </div>
  );
}
