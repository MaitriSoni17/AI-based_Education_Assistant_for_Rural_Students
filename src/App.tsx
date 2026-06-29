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
import { updateFirebaseUserFields } from './lib/firebase';

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
          const currentMins = current.studyMins ?? 30;
          const updatedMins = currentMins + 1;
          const updatedUser = { ...current, studyMins: updatedMins };

          // Persist to local storage
          localStorage.setItem('gramin_student_session', JSON.stringify(updatedUser));

          // Sync to Firebase Firestore
          updateFirebaseUserFields(current.mobile, { studyMins: updatedMins })
            .catch(err => console.error("[Timer] Failed to sync studyMins to Firebase:", err));

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

  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  const handleUpdateUser = async (fields: Partial<User>) => {
    if (!user) return;

    // Check if fields actually changed to prevent redundant writes and infinite loops
    const hasChanges = Object.keys(fields).some(
      (key) => fields[key as keyof User] !== user[key as keyof User]
    );
    if (!hasChanges) return;

    const updatedUser = { ...user, ...fields };
    setUser(updatedUser);
    localStorage.setItem('gramin_student_session', JSON.stringify(updatedUser));

    try {
      await updateFirebaseUserFields(user.mobile, fields);
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

    </div>
  );
}
