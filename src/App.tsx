import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import FeaturesView from './components/FeaturesView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ErrorBoundary from './components/ErrorBoundary';
import { CurrentView, LanguageCode, User, DashboardTab } from './types';
import { TRANSLATIONS } from './data/translations';
import { GraduationCap, Shield, LogOut } from 'lucide-react';
import AdminAuthView from './components/admin/AdminAuthView';
import AdminDashboardView from './components/admin/AdminDashboardView';
import { updateFirebaseUserFields, syncFirebaseUserWithLWW, getFirebaseUser } from './lib/firebase';
import { offlineSyncManager } from './utils/offlineSync';
import { fireContinuousFireworks } from './utils/confetti';
import { getSafeDateString, getDaysDifference } from './utils/dateUtils';
import { executeBackHandlers, EXIT_TOAST_MESSAGES } from './utils/backNavigation';
import { AnimatePresence, motion } from 'motion/react';

function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[localStorage] Failed to write key "${key}":`, e);
  }
}

const VALID_VIEWS: CurrentView[] = [
  'home', 'about', 'features', 'login', 'signup', 'dashboard', 'admin-login', 'admin-dashboard'
];

const VALID_TABS: DashboardTab[] = [
  'profile', 'admin-pdfs', 'ai-assistant', 'tutor', 'quiz', 'exam', 'career', 'settings', 'certificates', 'equations', 'puzzles'
];

function parseHash(): { view: CurrentView; tab?: DashboardTab } {
  if (typeof window === 'undefined') return { view: 'home' };
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return { view: 'home' };

  const [viewPart, queryPart] = raw.split('?');
  const view = viewPart as CurrentView;

  let tab: DashboardTab | undefined = undefined;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const t = params.get('tab') as DashboardTab;
    if (t && VALID_TABS.includes(t)) tab = t;
  }

  return {
    view: VALID_VIEWS.includes(view) ? view : 'home',
    tab
  };
}

function constructHash(view: CurrentView, tab?: DashboardTab): string {
  if (view === 'dashboard' && tab && tab !== 'profile') {
    return `#dashboard?tab=${tab}`;
  }
  return `#${view}`;
}

export default function App() {
  const [studentActiveTab, setStudentActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseHash();
      if (parsed.tab) return parsed.tab;
      const savedTab = localStorage.getItem('gramin_student_active_tab') as DashboardTab | null;
      if (savedTab && VALID_TABS.includes(savedTab)) return savedTab;
    }
    return 'profile';
  });

  const [currentView, setCurrentView] = useState<CurrentView>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseHash();
      const studentSession = localStorage.getItem('gramin_student_session');
      const adminSession = localStorage.getItem('gramin_admin_session');

      if (parsed.view) {
        if (parsed.view === 'dashboard' && !studentSession) return 'login';
        if (parsed.view === 'admin-dashboard' && !adminSession) return 'admin-login';
        return parsed.view;
      }

      const savedView = localStorage.getItem('gramin_current_view') as CurrentView | null;
      if (savedView && VALID_VIEWS.includes(savedView)) {
        if (savedView === 'dashboard' && !studentSession) return 'login';
        if (savedView === 'admin-dashboard' && !adminSession) return 'admin-login';
        return savedView;
      }

      if (adminSession) return 'admin-dashboard';
      if (studentSession) return 'dashboard';
    }
    return 'home';
  });

  const [user, setUser] = useState<User | null>(() => {
    // Attempt local storage cache retrieval for offline reliability
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gramin_student_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          if (parsed.studyMins === undefined) parsed.studyMins = 30;
          if (parsed.todayMins === undefined) parsed.todayMins = 0;
          return parsed;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [adminUser, setAdminUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gramin_admin_session');
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  // Mobile Back Button Navigation, Exit Guard & Modal/Drawer Dismissal
  const lastBackPressRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const exitToastTimerRef = useRef<any>(null);

  // Prime browser history on app load so mobile back button can be trapped even on first screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialHash = constructHash(currentView, studentActiveTab);
      try {
        window.history.replaceState({ view: currentView, tab: studentActiveTab, isRoot: true }, '', initialHash);
        window.history.pushState({ view: currentView, tab: studentActiveTab, isGuard: true }, '', initialHash);
      } catch (e) {
        console.warn('[history] Prime failed:', e);
      }
    }
  }, []);

  const handleNavigate = (newView: CurrentView, newTab?: DashboardTab) => {
    const targetTab = newTab || (newView === 'dashboard' ? (studentActiveTab || 'profile') : undefined);
    const newHash = constructHash(newView, targetTab);
    
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: newView, tab: targetTab }, '', newHash);
    }
    
    setCurrentView(newView);
    safeSetLocalStorage('gramin_current_view', newView);
    
    if (targetTab) {
      setStudentActiveTab(targetTab);
      safeSetLocalStorage('gramin_student_active_tab', targetTab);
    }
  };

  const handleTabChange = (newTab: DashboardTab) => {
    setStudentActiveTab(newTab);
    safeSetLocalStorage('gramin_student_active_tab', newTab);
    if (typeof window !== 'undefined') {
      const newHash = constructHash('dashboard', newTab);
      window.history.pushState({ view: 'dashboard', tab: newTab }, '', newHash);
    }
  };

  // Listen to popstate (mobile hardware back button / gesture)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // 1. Check if any modal or mobile drawer registered a back handler
      if (executeBackHandlers()) {
        const currentHash = constructHash(currentView, studentActiveTab);
        window.history.pushState({ view: currentView, tab: studentActiveTab, isGuard: true }, '', currentHash);
        return;
      }

      // 2. Are we at the root screen?
      const isAtRoot = 
        (!user && !adminUser && currentView === 'home') ||
        (user && currentView === 'dashboard' && studentActiveTab === 'profile') ||
        (adminUser && currentView === 'admin-dashboard');

      if (isAtRoot) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Double-tap back confirmed: allow app exit
          setShowExitToast(false);
          window.history.back();
          return;
        } else {
          // First tap at root: prevent accidental exit, show helpful exit toast
          lastBackPressRef.current = now;
          const currentHash = constructHash(currentView, studentActiveTab);
          window.history.pushState({ view: currentView, tab: studentActiveTab, isGuard: true }, '', currentHash);

          setShowExitToast(true);
          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = setTimeout(() => {
            setShowExitToast(false);
          }, 2200);
          return;
        }
      }

      // 3. If in Dashboard on a sub-tab (e.g. equations, puzzles, tutor, etc.), navigate back to Profile tab
      if (user && currentView === 'dashboard' && studentActiveTab !== 'profile') {
        setStudentActiveTab('profile');
        safeSetLocalStorage('gramin_student_active_tab', 'profile');
        const currentHash = constructHash('dashboard', 'profile');
        window.history.pushState({ view: 'dashboard', tab: 'profile', isGuard: true }, '', currentHash);
        return;
      }

      // 4. If on secondary views (about, features, login, signup, admin-login), return to root
      const parsed = parseHash();
      const fallbackView: CurrentView = user ? 'dashboard' : 'home';
      const targetView = (parsed.view && parsed.view !== currentView) ? parsed.view : fallbackView;

      setCurrentView(targetView);
      safeSetLocalStorage('gramin_current_view', targetView);
      if (targetView === 'dashboard') {
        const targetTab = parsed.tab || 'profile';
        setStudentActiveTab(targetTab);
        safeSetLocalStorage('gramin_student_active_tab', targetTab);
      }

      const currentHash = constructHash(targetView, parsed.tab);
      window.history.pushState({ view: targetView, tab: parsed.tab, isGuard: true }, '', currentHash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, [currentView, studentActiveTab, user, adminUser]);

  const handleAdminAuthSuccess = (authenticatedAdmin: User) => {
    setAdminUser(authenticatedAdmin);
    safeSetLocalStorage('gramin_admin_session', JSON.stringify(authenticatedAdmin));
    setUser(authenticatedAdmin);
    safeSetLocalStorage('gramin_student_session', JSON.stringify(authenticatedAdmin));
    handleNavigate('admin-dashboard');
  };

  const handleLogoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('gramin_admin_session');
    localStorage.removeItem('gramin_admin_active_tab');
    setUser(null);
    localStorage.removeItem('gramin_student_session');
    localStorage.removeItem('gramin_student_active_tab');
    safeSetLocalStorage('gramin_current_view', 'home');
    setStudentActiveTab('profile');
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'home', isRoot: true }, '', '#home');
      window.history.pushState({ view: 'home', isGuard: true }, '', '#home');
    }
    setCurrentView('home');
  };

  const [showStreakEarnedToast, setShowStreakEarnedToast] = useState(false);

  // Celebratory effect when daily goal is completed with auto-dismiss after 25 seconds
  useEffect(() => {
    if (showStreakEarnedToast) {
      fireContinuousFireworks(4000);
      const timer = setTimeout(() => {
        setShowStreakEarnedToast(false);
      }, 25000); // Automatically disappears within 20-60 seconds (25s)
      return () => clearTimeout(timer);
    }
  }, [showStreakEarnedToast]);

  // Helper to handle daily reset on a specific user object
  const performDailyResetForUser = (targetUser: User): { updatedUser: User; wasReset: boolean; fields: Partial<User> } => {
    const todayStr = getSafeDateString();
    if (targetUser.lastActiveDate !== todayStr) {
      const lastCheckedIn = targetUser.lastCheckedInDate;
      const updatedStreak = targetUser.streakDays ?? 1;
      
      // Keep streak continuing from that day even if a day is missed! Do not reset to 0.
      // The streak remains preserved so they don't lose their progression.
      
      const fields: Partial<User> = {
        lastActiveDate: todayStr,
        todayMins: 0, // Reset today's study minutes
        streakDays: updatedStreak,
        updatedAt: Date.now()
      };
      
      return {
        updatedUser: { ...targetUser, ...fields },
        wasReset: true,
        fields
      };
    }
    return {
      updatedUser: targetUser,
      wasReset: false,
      fields: {}
    };
  };

  // Synchronize with Firebase Firestore on app startup/mount to pull latest remote progress
  // and safely handle daily resets without racing or using a blocking state variable.
  useEffect(() => {
    if (!user?.mobile) return;

    getFirebaseUser(user.mobile)
      .then((dbUser) => {
        let finalUser: User;
        
        if (dbUser) {
          const remoteUser = dbUser as User;
          const remoteUpdatedAt = remoteUser.updatedAt || 0;
          const localUpdatedAt = user.updatedAt || 0;
          
          // Merge based on newest updated timestamp
          if (remoteUpdatedAt >= localUpdatedAt || (remoteUser.streakDays ?? 0) > (user.streakDays ?? 0) || (remoteUser.studyMins ?? 30) > (user.studyMins ?? 30)) {
            finalUser = { ...user, ...remoteUser };
          } else {
            finalUser = { ...remoteUser, ...user };
          }
        } else {
          finalUser = { ...user };
        }

        // Perform daily reset check on the merged/synchronized user profile
        const { updatedUser, wasReset, fields } = performDailyResetForUser(finalUser);
        
        setUser(updatedUser);
        safeSetLocalStorage('gramin_student_session', JSON.stringify(updatedUser));

        if (wasReset) {
          updateFirebaseUserFields(user.mobile, fields)
            .catch((err) => console.error("[Startup Sync Reset] Failed to sync reset to Firebase:", err));
        } else if (dbUser && JSON.stringify(dbUser) !== JSON.stringify(finalUser)) {
          // If we resolved a local-first win but didn't trigger a reset, update remote with newer local details
          updateFirebaseUserFields(user.mobile, finalUser)
            .catch((err) => console.error("[Startup Sync Update] Failed to sync merged user to Firebase:", err));
        }
      })
      .catch((err) => {
        console.error("[Startup Sync] Offline or failed to load remote user profile. Falling back to local reset check:", err);
        // Fallback to doing daily reset check directly on local user
        const { updatedUser, wasReset } = performDailyResetForUser(user);
        if (wasReset) {
          setUser(updatedUser);
          safeSetLocalStorage('gramin_student_session', JSON.stringify(updatedUser));
        }
      });
  }, [user?.mobile]);

  // Ensure any existing user session with stale defaults is automatically migrated
  useEffect(() => {
    if (user) {
      let needsUpdate = false;
      const updated = { ...user };
      if (user.studyMins === undefined) {
        updated.studyMins = 30;
        needsUpdate = true;
      }
      if (user.todayMins === undefined) {
        updated.todayMins = 0;
        needsUpdate = true;
      }
      if (needsUpdate) {
        setUser(updated);
        safeSetLocalStorage('gramin_student_session', JSON.stringify(updated));
        updateFirebaseUserFields(user.mobile, {
          studyMins: updated.studyMins,
          todayMins: updated.todayMins
        }).catch(err => console.error(err));
      }
    }
  }, []);

  // Background study timer: tracks actual active dashboard time in real-time
  useEffect(() => {
    if (!user || user.role === 'admin' || adminUser || currentView === 'admin-dashboard' || currentView === 'admin-login') return;

    let activeSecs = 0;
    const interval = setInterval(() => {
      // Do not accumulate study time if the tab is hidden or minimized
      if (document.hidden) {
        activeSecs = 0; // Reset active accumulator to avoid sudden jumps when returning
        return;
      }

      activeSecs += 10; // Add 10 seconds of active browsing time

      // Every 60 seconds (1 minute), we increment user's total study minutes
      if (activeSecs >= 60) {
        activeSecs = 0;
        setUser((current) => {
          if (!current) return null;
          
          const todayStr = getSafeDateString();
          
          const currentMins = current.studyMins ?? 30;
          const updatedMins = currentMins + 1;
          
          const currentTodayMins = current.todayMins ?? 0;
          const updatedTodayMins = currentTodayMins + 1;
          
          let nextStreak = current.streakDays ?? 0;
          let nextPoints = current.totalPoints ?? 15;
          let nextLastCheckedIn = current.lastCheckedInDate;
          let earnedTodayStreak = false;
          
          // Parse checkInDates array
          let checkInList: string[] = [];
          try {
            if (current.checkInDates) checkInList = JSON.parse(current.checkInDates);
          } catch(e) {}

          // Parse dailyStudyLog object
          let logMap: Record<string, number> = {};
          try {
            if (current.dailyStudyLog) logMap = JSON.parse(current.dailyStudyLog);
          } catch(e) {}

          logMap[todayStr] = updatedTodayMins;

          // Check if today's streak can be automatically claimed:
          // Criteria: works for at least 5 minutes today AND has not claimed today yet
          if (updatedTodayMins >= 5 && current.lastCheckedInDate !== todayStr) {
            // Yes! Auto-accept today's streak!
            nextLastCheckedIn = todayStr;
            
            // Streaks are never reset to 1 when a day is broken! The streak continues by incrementing from its last value.
            nextStreak = nextStreak + 1;
            
            nextPoints = nextPoints + 15; // Bonus +15 XP claimed automatically!
            earnedTodayStreak = true;
            if (!checkInList.includes(todayStr)) {
              checkInList.push(todayStr);
            }
          }

          const updatedCheckInDatesStr = JSON.stringify(checkInList);
          const updatedDailyStudyLogStr = JSON.stringify(logMap);
          
          const updatedUser: User = { 
            ...current, 
            studyMins: updatedMins,
            todayMins: updatedTodayMins,
            streakDays: nextStreak,
            totalPoints: nextPoints,
            lastCheckedInDate: nextLastCheckedIn,
            lastActiveDate: todayStr,
            checkInDates: updatedCheckInDatesStr,
            dailyStudyLog: updatedDailyStudyLogStr
          };

          // Persist to local storage
          safeSetLocalStorage('gramin_student_session', JSON.stringify(updatedUser));

          // Sync to Firebase Firestore
          updateFirebaseUserFields(current.mobile, { 
            studyMins: updatedMins,
            todayMins: updatedTodayMins,
            streakDays: nextStreak,
            totalPoints: nextPoints,
            lastCheckedInDate: nextLastCheckedIn,
            lastActiveDate: todayStr,
            checkInDates: updatedCheckInDatesStr,
            dailyStudyLog: updatedDailyStudyLogStr
          })
          .then(() => {
            if (earnedTodayStreak) {
              setShowStreakEarnedToast(true);
              offlineSyncManager.queuePendingProgress('quiz_points', 15, current.mobile);
            }
          })
          .catch(err => console.error("[Timer] Failed to sync to Firebase:", err));

          return updatedUser;
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user?.mobile]);

  // Default language is 'en' (English), as requested by user
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    if (user) return user.defaultLanguage;
    return 'en';
  });

  // Keep currentLanguage in sync with user's defaultLanguage when it changes in settings or via Firestore sync
  useEffect(() => {
    if (user?.defaultLanguage && user.defaultLanguage !== currentLanguage) {
      setCurrentLanguage(user.defaultLanguage);
    }
  }, [user?.defaultLanguage, currentLanguage]);

  // Scroll to top of page whenever currentView changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  const handleUpdateUser = async (fields: Partial<User>) => {
    if (!user) return;

    // Check if fields actually changed to prevent redundant writes and infinite loops
    const hasChanges = Object.keys(fields).some(
      (key) => fields[key as keyof User] !== user[key as keyof User] && key !== 'updatedAt'
    );
    if (!hasChanges) return;

    // Attach high-precision timestamp for Last-Write-Wins (LWW) conflict resolution
    const currentTimestamp = Date.now();
    const updatedUser = { ...user, ...fields, updatedAt: currentTimestamp };
    setUser(updatedUser);
    safeSetLocalStorage('gramin_student_session', JSON.stringify(updatedUser));

    try {
      if (navigator.onLine && !isOfflineSimulated) {
        const { resolvedUser, conflictResolved, source } = await syncFirebaseUserWithLWW(user.mobile, updatedUser);
        if (conflictResolved && source === 'remote') {
          // A newer remote update was found (e.g. from another shared device). Remote wins.
          setUser(resolvedUser as User);
          safeSetLocalStorage('gramin_student_session', JSON.stringify(resolvedUser));
          // console.log("[LWW Sync] Resolved conflict: remote data was newer and has overwritten local changes.");
        }
      } else {
        // console.log("[LWW Sync] Saved update locally while offline. Sync will reconcile via LWW once online.");
      }
    } catch (e) {
      console.error("Failed to sync user updates to Firestore", e);
    }
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    if (user) {
      handleUpdateUser({ defaultLanguage: lang });
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    // Override Default Language with the student's selected language at Auth
    const userWithUpdatedLanguage = { ...authenticatedUser, defaultLanguage: currentLanguage };
    setUser(userWithUpdatedLanguage);
    safeSetLocalStorage('gramin_student_session', JSON.stringify(userWithUpdatedLanguage));
    setStudentActiveTab('profile');
    safeSetLocalStorage('gramin_student_active_tab', 'profile');
    handleNavigate('dashboard', 'profile');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gramin_student_session');
    localStorage.removeItem('gramin_student_active_tab');
    safeSetLocalStorage('gramin_current_view', 'home');
    setStudentActiveTab('profile');
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'home', isRoot: true }, '', '#home');
      window.history.pushState({ view: 'home', isGuard: true }, '', '#home');
    }
    setCurrentView('home');
  };

  const handleSimulateOfflineToggle = () => {
    setIsOfflineSimulated((prev) => !prev);
  };

  const currentTranslation = TRANSLATIONS[currentLanguage];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#3D405B] flex flex-col font-sans transition-colors duration-300">
      
      {/* Dynamic Header Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        user={user}
        adminUser={adminUser}
        onLogout={handleLogout}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-1.5 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Render Active Screen Panel */}
        <div id="active-viewport-card" className="w-full animate-fade-in">
          {currentView === 'home' && (
            <ErrorBoundary fallbackTitle="Home View Notice">
              <HomeView
                onNavigate={handleNavigate}
                lang={currentLanguage}
                onSimulateOffline={handleSimulateOfflineToggle}
                isOfflineSimulated={isOfflineSimulated}
              />
            </ErrorBoundary>
          )}

          {currentView === 'about' && (
            <ErrorBoundary fallbackTitle="About View Notice">
              <AboutView lang={currentLanguage} />
            </ErrorBoundary>
          )}

          {currentView === 'features' && (
            <ErrorBoundary fallbackTitle="Features View Notice">
              <FeaturesView lang={currentLanguage} />
            </ErrorBoundary>
          )}

          {(currentView === 'login' || currentView === 'signup') && (
            <ErrorBoundary fallbackTitle="Authentication View Notice">
              <AuthView
                mode={currentView}
                onSuccess={handleAuthSuccess}
                onSwitchMode={handleNavigate}
                lang={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </ErrorBoundary>
          )}

          {currentView === 'dashboard' && user && (
            <ErrorBoundary fallbackTitle="Student Dashboard Notice">
              <DashboardView
                user={user}
                lang={currentLanguage}
                onUpdateUser={handleUpdateUser}
                activeTab={studentActiveTab}
                onTabChange={handleTabChange}
              />
            </ErrorBoundary>
          )}

          {currentView === 'admin-login' && (
            <ErrorBoundary fallbackTitle="Admin Authentication Notice">
              <AdminAuthView
                onSuccess={handleAdminAuthSuccess}
                onBackToMain={() => handleNavigate('home')}
                lang={currentLanguage}
                adminUser={adminUser}
                onGoToDashboard={() => handleNavigate('admin-dashboard')}
              />
            </ErrorBoundary>
          )}

          {currentView === 'admin-dashboard' && (
            adminUser ? (
              <ErrorBoundary fallbackTitle="Admin Dashboard Notice">
                <AdminDashboardView
                  adminUser={adminUser}
                  lang={currentLanguage}
                  onLogoutAdmin={handleLogoutAdmin}
                  onLanguageChange={setCurrentLanguage}
                />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary fallbackTitle="Admin Authentication Notice">
                <AdminAuthView
                  onSuccess={handleAdminAuthSuccess}
                  onBackToMain={() => handleNavigate('home')}
                  lang={currentLanguage}
                  adminUser={adminUser}
                  onGoToDashboard={() => handleNavigate('admin-dashboard')}
                  onLanguageChange={setCurrentLanguage}
                />
              </ErrorBoundary>
            )
          )}
        </div>

      </main>

      {/* Decorative Rural Education Support Footer with Natural Tones elements */}
      <footer className="bg-white border-t border-[#F2CC8F]/30 text-[#3D405B]/80 pt-8 pb-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-[#E07A5F]">
            <GraduationCap className="h-5 w-5" />
            <span className="font-display font-extrabold text-sm tracking-wide uppercase">
              {currentTranslation.appTitle}
            </span>
          </div>
          <p className="font-sans text-xs max-w-md mx-auto text-[#3D405B]/70 leading-relaxed">
            {currentTranslation.footerDesc}
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-[#3D405B]/50 uppercase tracking-widest">
            <span>{currentTranslation.footerCopyright}</span>
            <span>•</span>
            <button
              id="footer-admin-portal-link"
              onClick={() => handleNavigate('admin-login')}
              title={currentTranslation.footerAdminLogin}
              aria-label={currentTranslation.footerAdminLogin}
              className="text-[#3D405B]/60 hover:text-[#E07A5F] transition-colors p-1 rounded-md hover:bg-[#F2CC8F]/20 cursor-pointer flex items-center justify-center"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500" />
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom Decorative Bar mimicking Natural Tones theme instructions */}
      <div className="h-2 w-full flex mb-20 lg:mb-0">
        <div className="flex-1 bg-[#E07A5F]"></div>
        <div className="flex-1 bg-[#F2CC8F]"></div>
        <div className="flex-1 bg-[#81B29A]"></div>
        <div className="flex-1 bg-[#3D405B]"></div>
      </div>

      {showStreakEarnedToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-[#3D405B] text-white p-4 rounded-2xl border-2 border-amber-300 shadow-2xl flex items-center gap-3 max-w-sm text-left hover:scale-101 transition-transform duration-300">
          <div className="bg-amber-100 p-2 rounded-xl text-xl">🔥</div>
          <div className="flex-1">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-amber-300">
              {currentLanguage === 'hi' ? 'आज की स्ट्रीक स्वतः स्वीकृत!' : 'Streak Automatically Claimed!'}
            </h4>
            <p className="text-[10px] text-gray-200 mt-1 font-sans font-medium leading-relaxed">
              {currentLanguage === 'hi' 
                ? 'आपने आज 5 मिनट पढ़ाई की! स्ट्रीक सक्रिय हो गई है और +15 XP अंक जोड़े गए हैं।' 
                : 'You studied for 5+ minutes today! Your consecutive streak is active and +15 XP is claimed.'}
            </p>
          </div>
          <button 
            onClick={() => setShowStreakEarnedToast(false)} 
            className="text-gray-400 hover:text-white text-xs ml-2 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Double-Back Exit Confirmation Floating Pill */}
      <AnimatePresence>
        {showExitToast && (
          <motion.div
            id="mobile-exit-toast"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-16 sm:bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
            <div className="bg-[#2D2F44]/95 text-white backdrop-blur-md px-5 py-3 rounded-full shadow-2xl border border-white/15 flex items-center gap-3 text-xs sm:text-sm font-semibold tracking-wide">
              <div className="p-1.5 bg-[#E07A5F] rounded-full flex items-center justify-center shrink-0">
                <LogOut className="h-3.5 w-3.5 text-white" />
              </div>
              <span>
                {EXIT_TOAST_MESSAGES[currentLanguage] || EXIT_TOAST_MESSAGES.en}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
