import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import FeaturesView from './components/FeaturesView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import { CurrentView, LanguageCode, User } from './types';
import { TRANSLATIONS } from './data/translations';
import { GraduationCap } from 'lucide-react';
import { updateFirebaseUserFields, syncFirebaseUserWithLWW } from './lib/firebase';
import { offlineSyncManager } from './utils/offlineSync';
import { fireContinuousFireworks } from './utils/confetti';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [user, setUser] = useState<User | null>(() => {
    // Attempt local storage cache retrieval for offline reliability
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gramin_student_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User;
          if (parsed.streakDays === 5) parsed.streakDays = 1;
          if (parsed.totalPoints === 40) parsed.totalPoints = 15;
          if (parsed.studyMins === undefined) parsed.studyMins = 30;
          return parsed;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [showStreakEarnedToast, setShowStreakEarnedToast] = useState(false);

  // Celebratory effect when daily goal is completed
  useEffect(() => {
    if (showStreakEarnedToast) {
      fireContinuousFireworks(4000);
    }
  }, [showStreakEarnedToast]);

  // Helper to compute calendar day differences from locale strings safely
  const getDaysDifference = (dateStr1?: string, dateStr2?: string): number => {
    if (!dateStr1 || !dateStr2) return 999;
    try {
      const d1 = new Date(dateStr1);
      const d2 = new Date(dateStr2);
      d1.setHours(12, 0, 0, 0);
      d2.setHours(12, 0, 0, 0);
      const diffMs = d2.getTime() - d1.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 999;
    }
  };

  // Manage daily reset and streak checks when user is loaded or day changes
  useEffect(() => {
    if (!user) return;

    const todayStr = new Date().toLocaleDateString();
    
    // Check if the user's lastActiveDate is different from today
    if (user.lastActiveDate !== todayStr) {
      const lastCheckedIn = user.lastCheckedInDate;
      let updatedStreak = user.streakDays ?? 0;
      
      // If they missed a day (i.e. didn't check in/work yesterday), reset their streak to 0
      const daysSinceLastCheckIn = lastCheckedIn ? getDaysDifference(lastCheckedIn, todayStr) : 999;
      
      if (daysSinceLastCheckIn > 1) {
        updatedStreak = 0; // Streak is broken!
      }
      
      const updatedFields: Partial<User> = {
        lastActiveDate: todayStr,
        todayMins: 0, // Reset today's study minutes
        streakDays: updatedStreak
      };
      
      setUser(current => {
        if (!current) return null;
        const nextUser = { ...current, ...updatedFields };
        localStorage.setItem('gramin_student_session', JSON.stringify(nextUser));
        return nextUser;
      });
      
      updateFirebaseUserFields(user.mobile, updatedFields)
        .catch(err => console.error("[Daily Reset] Failed to sync reset to Firebase:", err));
    }
  }, [user?.mobile]);

  // Ensure any existing user session with stale defaults is automatically migrated
  useEffect(() => {
    if (user) {
      let needsUpdate = false;
      const updated = { ...user };
      if (user.streakDays === 5) {
        updated.streakDays = 1;
        needsUpdate = true;
      }
      if (user.totalPoints === 40) {
        updated.totalPoints = 15;
        needsUpdate = true;
      }
      if (user.studyMins === undefined) {
        updated.studyMins = 30;
        needsUpdate = true;
      }
      if (needsUpdate) {
        setUser(updated);
        localStorage.setItem('gramin_student_session', JSON.stringify(updated));
        updateFirebaseUserFields(user.mobile, {
          streakDays: updated.streakDays,
          totalPoints: updated.totalPoints,
          studyMins: updated.studyMins
        }).catch(err => console.error(err));
      }
    }
  }, []);

  // Background study timer: tracks actual active dashboard time in real-time
  useEffect(() => {
    if (!user) return;

    let activeSecs = 0;
    const interval = setInterval(() => {
      activeSecs += 10; // Add 10 seconds of active browsing time

      // Every 60 seconds (1 minute), we increment user's total study minutes
      if (activeSecs >= 60) {
        activeSecs = 0;
        setUser((current) => {
          if (!current) return null;
          
          const todayStr = new Date().toLocaleDateString();
          
          const currentMins = current.studyMins ?? 30;
          const updatedMins = currentMins + 1;
          
          const currentTodayMins = current.todayMins ?? 0;
          const updatedTodayMins = currentTodayMins + 1;
          
          let nextStreak = current.streakDays ?? 0;
          let nextPoints = current.totalPoints ?? 15;
          let nextLastCheckedIn = current.lastCheckedInDate;
          let earnedTodayStreak = false;
          
          // Check if today's streak can be automatically claimed:
          // Criteria: works for at least 5 minutes today AND has not claimed today yet
          if (updatedTodayMins >= 5 && current.lastCheckedInDate !== todayStr) {
            // Yes! Auto-accept today's streak!
            nextLastCheckedIn = todayStr;
            
            // If they completed yesterday, streak increments. If missed, starts at 1.
            const daysSinceLastCheckIn = current.lastCheckedInDate ? getDaysDifference(current.lastCheckedInDate, todayStr) : 999;
            if (daysSinceLastCheckIn === 1) {
              nextStreak = nextStreak + 1;
            } else {
              nextStreak = 1; // Starts a new streak!
            }
            
            nextPoints = nextPoints + 15; // Bonus +15 XP claimed automatically!
            earnedTodayStreak = true;
          }
          
          const updatedUser: User = { 
            ...current, 
            studyMins: updatedMins,
            todayMins: updatedTodayMins,
            streakDays: nextStreak,
            totalPoints: nextPoints,
            lastCheckedInDate: nextLastCheckedIn,
            lastActiveDate: todayStr
          };

          // Persist to local storage
          localStorage.setItem('gramin_student_session', JSON.stringify(updatedUser));

          // Sync to Firebase Firestore
          updateFirebaseUserFields(current.mobile, { 
            studyMins: updatedMins,
            todayMins: updatedTodayMins,
            streakDays: nextStreak,
            totalPoints: nextPoints,
            lastCheckedInDate: nextLastCheckedIn,
            lastActiveDate: todayStr
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
    localStorage.setItem('gramin_student_session', JSON.stringify(updatedUser));

    try {
      if (navigator.onLine && !isOfflineSimulated) {
        const { resolvedUser, conflictResolved, source } = await syncFirebaseUserWithLWW(user.mobile, updatedUser);
        if (conflictResolved && source === 'remote') {
          // A newer remote update was found (e.g. from another shared device). Remote wins.
          setUser(resolvedUser as User);
          localStorage.setItem('gramin_student_session', JSON.stringify(resolvedUser));
          console.log("[LWW Sync] Resolved conflict: remote data was newer and has overwritten local changes.");
        }
      } else {
        console.log("[LWW Sync] Saved update locally while offline. Sync will reconcile via LWW once online.");
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
    localStorage.setItem('gramin_student_session', JSON.stringify(userWithUpdatedLanguage));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gramin_student_session');
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
        onNavigate={setCurrentView}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render Active Screen Panel */}
        <div id="active-viewport-card" className="w-full animate-fade-in">
          {currentView === 'home' && (
            <HomeView
              onNavigate={setCurrentView}
              lang={currentLanguage}
              onSimulateOffline={handleSimulateOfflineToggle}
              isOfflineSimulated={isOfflineSimulated}
            />
          )}

          {currentView === 'about' && (
            <AboutView lang={currentLanguage} />
          )}

          {currentView === 'features' && (
            <FeaturesView lang={currentLanguage} />
          )}

          {(currentView === 'login' || currentView === 'signup') && (
            <AuthView
              mode={currentView}
              onSuccess={handleAuthSuccess}
              onSwitchMode={setCurrentView}
              lang={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          )}

          {currentView === 'dashboard' && user && (
            <DashboardView
              user={user}
              lang={currentLanguage}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </div>

      </main>

      {/* Decorative Rural Education Support Footer with Natural Tones elements */}
      <footer className="bg-white border-t border-[#F2CC8F]/30 text-[#3D405B]/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-[#E07A5F]">
            <GraduationCap className="h-5 w-5" />
            <span className="font-display font-extrabold text-sm tracking-wide uppercase">
              {currentTranslation.appTitle}
            </span>
          </div>
          <p className="font-sans text-xs max-w-md mx-auto text-[#3D405B]/70 leading-relaxed">
            A specialized digital learning assistant designed to operate securely under 2G bandwidth. Built for local offline synchronization and text-to-speech literacy assistance.
          </p>
          <div className="text-[10px] font-mono text-[#3D405B]/50 uppercase tracking-widest">
            © 2026 GyaanBot. India Primary Rural Classrooms Initiatives.
          </div>
        </div>
      </footer>

      {/* Bottom Decorative Bar mimicking Natural Tones theme instructions */}
      <div className="h-2 w-full flex">
        <div className="flex-1 bg-[#E07A5F]"></div>
        <div className="flex-1 bg-[#F2CC8F]"></div>
        <div className="flex-1 bg-[#81B29A]"></div>
        <div className="flex-1 bg-[#3D405B]"></div>
      </div>

      {showStreakEarnedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3D405B] text-white p-4 rounded-2xl border-2 border-amber-300 shadow-2xl flex items-center gap-3 max-w-sm text-left hover:scale-101 transition-transform duration-300">
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

    </div>
  );
}
