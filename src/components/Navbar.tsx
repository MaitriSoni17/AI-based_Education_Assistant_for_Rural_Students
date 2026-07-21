import { useState } from 'react';
import { Menu, X, Globe, LogIn, UserPlus, LogOut, BookOpen, GraduationCap, Wifi, ChevronDown } from 'lucide-react';
import { CurrentView, LanguageCode, User } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';
import { getDeterministicAvatar } from '../utils/avatar';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  currentView: CurrentView;
  onNavigate: (view: CurrentView) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  user: User;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  currentLanguage,
  onLanguageChange,
  user,
  onLogout,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const t = TRANSLATIONS[currentLanguage];
  const activeLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleNavClick = (view: CurrentView) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <nav id="app-navbar" className="sticky top-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-[#F2CC8F]/30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <button
              id="brand-logo"
              onClick={() => handleNavClick(user ? 'dashboard' : 'home')}
              className="flex items-center space-x-2 text-[#3D405B] hover:text-[#E07A5F] transition-colors cursor-pointer"
            >
              <div className="p-2.5 bg-[#E07A5F] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white animate-pulse" />
              </div>
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-[#3D405B]">
                {t.appTitle}
              </span>
            </button>
          </div>
 
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {!user && (
              <>
                <button
                  id="nav-desktop-home"
                  onClick={() => handleNavClick('home')}
                  className={`px-3.5 py-2 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'text-[#3D405B]/85 hover:text-[#E07A5F] hover:bg-white/60'
                  }`}
                >
                  {t.navHome}
                </button>
                <button
                  id="nav-desktop-about"
                  onClick={() => handleNavClick('about')}
                  className={`px-3.5 py-2 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'text-[#3D405B]/85 hover:text-[#E07A5F] hover:bg-white/60'
                  }`}
                >
                  {t.navAbout}
                </button>
                <button
                  id="nav-desktop-features"
                  onClick={() => handleNavClick('features')}
                  className={`px-3.5 py-2 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer ${
                    currentView === 'features'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'text-[#3D405B]/85 hover:text-[#E07A5F] hover:bg-white/60'
                  }`}
                >
                  {t.navFeatures}
                </button>
              </>
            )}
 
            {user ? (
              <>
                <button
                  id="nav-desktop-dashboard"
                  onClick={() => handleNavClick('dashboard')}
                  className={`px-4 py-2 rounded-xl font-sans font-bold text-sm transition-all cursor-pointer flex items-center space-x-1.5 ${
                    currentView === 'dashboard'
                      ? 'bg-[#81B29A] text-white shadow-xs'
                      : 'bg-[#81B29A]/15 text-[#3D405B] hover:bg-[#81B29A]/25'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{t.navDashboard}</span>
                </button>
                <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                <span className="text-xs font-mono bg-[#E07A5F]/10 text-[#E07A5F] px-3 py-1.5 rounded-full font-bold border border-[#E07A5F]/20 flex items-center gap-1">
                  <span>{user.avatar || getDeterministicAvatar(user.name, user.mobile)}</span>
                  <span>{user.name}</span>
                </span>
                <button
                  id="nav-desktop-logout"
                  onClick={onLogout}
                  className="px-3 py-2 rounded-xl font-sans font-semibold text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.navLogout}</span>
                </button>
              </>
            ) : (
              <>
                <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                <button
                  id="nav-desktop-login"
                  onClick={() => handleNavClick('login')}
                  className={`px-3 py-2 rounded-xl font-sans font-semibold text-sm transition-all cursor-pointer flex items-center space-x-1 ${
                    currentView === 'login'
                      ? 'bg-[#E07A5F]/15 text-[#E07A5F]'
                      : 'text-[#3D405B]/85 hover:text-[#E07A5F] hover:bg-white/60'
                  }`}
                >
                  <LogIn className="h-4 w-4 text-[#E07A5F]" />
                  <span>{t.navLogin}</span>
                </button>
                <button
                  id="nav-desktop-signup"
                  onClick={() => handleNavClick('signup')}
                  className="ml-2 px-5 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1"
                >
                  <UserPlus className="h-4 w-4 text-[#F2CC8F]" />
                  <span>{t.navSignUp}</span>
                </button>
              </>
            )}
 
            {/* Custom Premium Language Dropdown Selector */}
            <div className="relative ml-2">
              <button
                id="language-dropdown-toggle-desktop"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 bg-white border border-[#F2CC8F]/50 rounded-xl px-3 py-1.5 hover:bg-[#FAF8F4] transition-all cursor-pointer shadow-3xs active:scale-95"
              >
                <Globe className="h-4 w-4 text-[#E07A5F]" />
                <span className="text-xs font-sans font-extrabold text-[#3D405B]">
                  {activeLanguage.nativeLabel}
                </span>
                <ChevronDown className={`h-3 w-3 text-[#3D405B]/60 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white border border-[#F2CC8F]/40 rounded-2xl shadow-xl z-20 py-2.5 overflow-hidden"
                    >
                      <div className="px-3 pb-1.5 mb-1.5 border-b border-[#F2CC8F]/10 text-[10px] font-mono font-black uppercase tracking-wider text-gray-400">
                        Select Language / भाषा चुनें
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-0.5 px-1.5">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                          const isSelected = lang.code === currentLanguage;
                          return (
                            <button
                              key={lang.code}
                              onClick={() => {
                                onLanguageChange(lang.code);
                                setIsLangOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-extrabold'
                                  : 'text-[#3D405B]/85 hover:bg-[#FAF8F4] hover:text-[#E07A5F] font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {lang.code === 'hi' ? '🇮🇳' : lang.code === 'gu' ? '🌾' : lang.code === 'mr' ? '🚩' : lang.code === 'ta' ? '📜' : lang.code === 'te' ? '🌊' : '🇬🇧'}
                                </span>
                                <div className="flex flex-col">
                                  <span>{lang.nativeLabel}</span>
                                  <span className="text-[9px] opacity-70 font-sans font-medium">{lang.label}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#E07A5F]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
 
            {/* Network Indicator Mockup */}
            {/*<div className="flex items-center space-x-1.5 pl-2" title="Offline Access Ready">
              <Wifi className="h-4 w-4 text-[#81B29A] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-[#81B29A] bg-[#81B29A]/10 px-2.5 py-1 rounded-full border border-[#81B29A]/20 uppercase tracking-widest">
                Offline Ready
              </span>
            </div>*/}
          </div>
 
          {/* Hamburger / Mobile Toggle */}
          <div className="flex items-center lg:hidden space-x-2">
            {/* Custom Mobile Language Selector */}
            <div className="relative">
              <button
                id="language-dropdown-toggle-mobile"
                onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                className="flex items-center gap-1 bg-white border border-[#F2CC8F]/50 rounded-xl px-2.5 py-1.5 cursor-pointer active:scale-95"
              >
                <Globe className="h-3.5 w-3.5 text-[#E07A5F]" />
                <span className="text-[11px] font-sans font-black text-[#3D405B]">
                  {activeLanguage.nativeLabel}
                </span>
                <ChevronDown className={`h-2.5 w-2.5 text-[#3D405B]/60 transition-transform duration-200 ${isMobileLangOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMobileLangOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMobileLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 bg-white border border-[#F2CC8F]/40 rounded-2xl shadow-xl z-20 py-2 space-y-0.5 px-1.5"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = lang.code === currentLanguage;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              onLanguageChange(lang.code);
                              setIsMobileLangOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-[11px] transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-extrabold'
                                : 'text-[#3D405B]/85 hover:bg-[#FAF8F4] hover:text-[#E07A5F] font-bold'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>
                                {lang.code === 'hi' ? '🇮🇳' : lang.code === 'gu' ? '🌾' : lang.code === 'mr' ? '🚩' : lang.code === 'ta' ? '📜' : lang.code === 'te' ? '🌊' : '🇬🇧'}
                              </span>
                              <span>{lang.nativeLabel}</span>
                            </span>
                            {isSelected && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-[#E07A5F]" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
 
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-[#3D405B] hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>       {/* Mobile Drawer */}
      {isOpen && (
        <div id="mobile-menu-drawer" className="lg:hidden border-t border-[#F2CC8F]/20 bg-white px-4 pt-2 pb-4 space-y-2 shadow-inner transition-all animate-fade-in">
          {!user && (
            <>
              <button
                id="nav-mobile-home"
                onClick={() => handleNavClick('home')}
                className={`block w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-medium text-sm transition-all ${
                  currentView === 'home'
                    ? 'bg-[#E07A5F]/10 text-[#E07A5F] border-l-4 border-[#E07A5F]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.navHome}
              </button>
              <button
                id="nav-mobile-about"
                onClick={() => handleNavClick('about')}
                className={`block w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-medium text-sm transition-all ${
                  currentView === 'about'
                    ? 'bg-[#E07A5F]/10 text-[#E07A5F] border-l-4 border-[#E07A5F]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.navAbout}
              </button>
              <button
                id="nav-mobile-features"
                onClick={() => handleNavClick('features')}
                className={`block w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-medium text-sm transition-all ${
                  currentView === 'features'
                    ? 'bg-[#E07A5F]/10 text-[#E07A5F] border-l-4 border-[#E07A5F]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.navFeatures}
              </button>
            </>
          )}
 
          {user ? (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
              <div className="px-3.5 py-2">
                <span className="text-xs text-gray-500 block">Logged in student:</span>
                <span className="font-display font-semibold text-[#E07A5F] text-sm flex items-center gap-1.5">
                  <span>{user.avatar || getDeterministicAvatar(user.name, user.mobile)}</span>
                  <span>{user.name} ({user.mobile})</span>
                </span>
              </div>
              <button
                id="nav-mobile-dashboard"
                onClick={() => handleNavClick('dashboard')}
                className={`block w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all flex items-center space-x-2 ${
                  currentView === 'dashboard'
                    ? 'bg-[#81B29A]/10 text-[#3D405B] border-l-4 border-[#81B29A]'
                    : 'bg-[#81B29A]/5 text-[#3D405B]'
                }`}
              >
                <BookOpen className="h-4 w-4 text-[#81B29A]" />
                <span>{t.navDashboard}</span>
              </button>
              <button
                id="nav-mobile-logout"
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-medium text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 animate-pulse"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.navLogout}</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
              <button
                id="nav-mobile-login"
                onClick={() => handleNavClick('login')}
                className="block w-full text-center py-2.5 rounded-xl font-sans font-medium text-sm text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center space-x-1.5"
              >
                <LogIn className="h-4 w-4 text-[#E07A5F]" />
                <span>{t.navLogin}</span>
              </button>
              <button
                id="nav-mobile-signup"
                onClick={() => handleNavClick('signup')}
                className="block w-full text-center py-2.5 rounded-xl font-sans font-medium text-sm text-white bg-[#3D405B] hover:bg-[#2D2F44] shadow-xs flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="h-4 w-4 text-[#F2CC8F]" />
                <span>{t.navSignUp}</span>
              </button>
            </div>
          )}
 
          {/* Network Indicator Mobile */}
          <div className="flex items-center justify-between bg-[#81B29A]/10 p-2.5 rounded-xl mt-3 border border-[#81B29A]/20">
            <div className="flex items-center space-x-1.5">
              <Wifi className="h-4 w-4 text-[#81B29A]" />
              <span className="text-xs font-sans font-medium text-[#3D405B]">
                Offline Mode Trigger Ready
              </span>
            </div>
            <span className="text-[10px] bg-white border border-[#81B29A]/20 text-[#81B29A] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
              Low Signal OK
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
