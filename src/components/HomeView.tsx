import { CurrentView, LanguageCode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import SpeakButton from './SpeakButton';
import { Sparkles, BookOpen, DownloadCloud, Volume2 } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: CurrentView) => void;
  lang: LanguageCode;
  onSimulateOffline: () => void;
  isOfflineSimulated: boolean;
}

export default function HomeView({
  onNavigate,
  lang,
  onSimulateOffline,
  isOfflineSimulated,
}: HomeViewProps) {
  const t = TRANSLATIONS[lang];

  // AI-generated image loaded with standard referrerPolicy and responsive wrapper
  const heroImgUrl = '/src/assets/images/rural_student_hero_1781415950173.jpg';

  return (
    <div id="home-view-container" className="space-y-12 pb-16">
      {/* Hero Visual Section using Natural Tones style rules */}
      <section className="relative overflow-hidden bg-white pt-8 pb-10 rounded-[32px] border border-[#F2CC8F]/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Content Info */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-[#F2CC8F]/30 text-[#8B6E32] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#F2CC8F]/50">
              <Sparkles className="h-3.5 w-3.5 text-[#E07A5F] animate-spin" />
              <span>{t.connectivityLabel}</span>
            </div>

            <div className="flex items-start gap-3">
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-[#3D405B] leading-[1.1] tracking-tight">
                {t.heroTitle}
              </h1>
              <div className="mt-1.5 shrink-0">
                <SpeakButton text={`${t.heroTitle}. ${t.heroSubtitle}`} lang={lang} size="md" />
              </div>
            </div>

            <p className="font-sans text-base sm:text-lg text-[#3D405B]/70 max-w-xl leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Offline Simulation Switch styled with Slate and Sage components */}
            <div className="bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-2xl p-5 max-w-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#3D405B] flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#81B29A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#81B29A]"></span>
                    </span>
                    Simulate Rural Network Signal
                  </h4>
                  <p className="text-xs text-[#3D405B]/60 mt-1 font-sans">
                    Toggle offline mode to see how the app caches lesson resources instantly!
                  </p>
                </div>
                <button
                  id="simulate-offline-toggle"
                  onClick={onSimulateOffline}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOfflineSimulated ? 'bg-[#81B29A]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isOfflineSimulated ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {isOfflineSimulated && (
                <div className="mt-2.5 text-xs font-mono font-bold text-[#E07A5F] bg-[#E07A5F]/10 rounded-lg p-2 border border-[#E07A5F]/20 animate-pulse">
                  ⚠️ 2G Internet Simulation Active — Serving locally cached educational files.
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="cta-start-learning"
                onClick={() => onNavigate('signup')}
                className="px-6 py-3.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-sans font-bold text-base rounded-2xl shadow-lg shadow-[#3D405B]/25 cursor-pointer transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <BookOpen className="h-5 w-5 text-[#F2CC8F]" />
                <span>{t.getStarted}</span>
              </button>
              <button
                id="cta-features-view"
                onClick={() => onNavigate('features')}
                className="px-6 py-3.5 bg-white hover:bg-[#FAF8F4] text-[#3D405B] font-sans font-bold text-base rounded-2xl border border-gray-200 cursor-pointer transition-all flex items-center justify-center space-x-2"
              >
                <span>{t.howItWorks}</span>
              </button>
            </div>
          </div>

          {/* AI Banner Image */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-gray-55 aspect-16/9">
              <img
                src={heroImgUrl}
                alt="Rural student sitting under a tree learning math with a digital tablet"
                referrerPolicy="no-referrer"
                className="object-cover w-full h-full transition-transform hover:scale-105 duration-700"
              />
              {/*<div className="absolute top-3 left-3 bg-[#FAF8F4]/95 backdrop-blur-xs text-[10px] font-mono font-bold text-[#3D405B] px-2 py-1 rounded shadow-xs uppercase tracking-wide">
                AI Generated Illustration
              </div>*/}
            </div>
          </div>
        </div>
      </section>

      {/* Connectivity & Offline focus Highlights */}
      <section className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#F2CC8F]/20 shadow-xs">
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#3D405B] text-center mb-8">
          🛠️ How We Make Offline Study Possible For Rural Areas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Feature Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-[#F2CC8F]/20 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#81B29A]/15 text-[#81B29A] rounded-xl">
                  <DownloadCloud className="h-6 w-6" />
                </div>
                <SpeakButton text={`${t.offlineReadyTitle}. ${t.offlineReadyDesc}`} lang={lang} />
              </div>
              <h4 className="font-display font-bold text-base text-[#3D405B] mt-4">
                {t.offlineReadyTitle}
              </h4>
              <p className="font-sans text-sm text-[#3D405B]/70 mt-2 leading-relaxed">
                {t.offlineReadyDesc}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold bg-[#81B29A]/10 text-[#81B29A] px-2.5 py-1 rounded border border-[#81B29A]/20">
                Smart SD Card Support
              </span>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-[#F2CC8F]/20 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#E07A5F]/15 text-[#E07A5F] rounded-xl">
                  <Volume2 className="h-6 w-6" />
                </div>
                <SpeakButton text={`${t.lowInternetMode}. ${t.lowInternetModeDesc}`} lang={lang} />
              </div>
              <h4 className="font-display font-bold text-base text-[#3D405B] mt-4">
                {t.lowInternetMode}
              </h4>
              <p className="font-sans text-sm text-[#3D405B]/70 mt-2 leading-relaxed">
                {t.lowInternetModeDesc}
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold bg-[#E07A5F]/10 text-[#E07A5F] px-2.5 py-1 rounded border border-[#E07A5F]/20">
                Optimized 2G Core
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
