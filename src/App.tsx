import { useState } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import FeaturesView from './components/FeaturesView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import { CurrentView, LanguageCode, User } from './types';
import { TRANSLATIONS } from './data/translations';
import { GraduationCap } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [user, setUser] = useState<User | null>(() => {
    // Attempt local storage cache retrieval for offline reliability
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gramin_student_session');
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

  // Default language is 'en' (English), as requested by user
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    if (user) return user.defaultLanguage;
    return 'en';
  });

  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    if (user) {
      const updatedUser = { ...user, defaultLanguage: lang };
      setUser(updatedUser);
      localStorage.setItem('gramin_student_session', JSON.stringify(updatedUser));
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
