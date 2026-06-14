import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import SpeakButton from './SpeakButton';
import { PlayCircle, Mic, Server, Award, BatteryCharging } from 'lucide-react';

interface FeaturesViewProps {
  lang: LanguageCode;
}

export default function FeaturesView({ lang }: FeaturesViewProps) {
  const t = TRANSLATIONS[lang];
  const mascotImgUrl = '/src/assets/images/ai_video_tutor_1781415967174.jpg';

  return (
    <div id="features-view-container" className="space-y-12 pb-16">
      {/* Header section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="flex items-center justify-center space-x-1.5">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#3D405B] tracking-tight">
            {t.featuresTitle}
          </h1>
          <SpeakButton text={`${t.featuresTitle}. ${t.featuresSubtitle}`} lang={lang} size="sm" />
        </div>
        <p className="font-sans text-base sm:text-lg text-[#3D405B]/70 leading-relaxed">
          {t.featuresSubtitle}
        </p>
      </section>

      {/* Main Feature Showcases */}
      <section className="max-w-6xl mx-auto space-y-10">
        {/* Row 1: Left Mascot, Right Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-8 rounded-[32px] border border-[#F2CC8F]/25 shadow-xs">
          
          {/* Mascot Video Tutor Card */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#F2CC8F]/30 shadow-md aspect-4/3">
              <img
                src={mascotImgUrl}
                alt="AI tutor character showing simple educational charts with subtitles"
                referrerPolicy="no-referrer"
                className="object-cover w-full h-full"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                <div className="flex items-center space-x-2 text-white">
                  <span className="h-2 w-2 bg-[#81B29A] rounded-full animate-ping" />
                  <span className="text-xs font-mono font-bold tracking-wider uppercase">AI Teacher Active</span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono mt-1">
                  Offline-ready synthetic tutoring characters
                </p>
              </div>
            </div>
            <div className="text-center bg-[#FAF8F4] border border-[#F2CC8F]/20 rounded-xl py-2 px-3 text-xs text-[#3D405B] font-mono flex items-center justify-center gap-1.5">
              <BatteryCharging className="h-4 w-4 text-[#E07A5F]" />
              <span>Optimized for solar charging screens & e-learning tabs</span>
            </div>
          </div>

          {/* Features Column */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-6">
            
            {/* 1. AI Response Videos */}
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF8F4] transition-colors border border-transparent hover:border-[#F2CC8F]/30">
              <div className="p-3 bg-[#E07A5F]/15 text-[#E07A5F] rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#3D405B]">
                    {t.featureVideos}
                  </h3>
                  <SpeakButton text={`${t.featureVideos}. ${t.featureVideosDesc}`} lang={lang} />
                </div>
                <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
                  {t.featureVideosDesc}
                </p>
              </div>
            </div>

            {/* 2. Text-to-Speech Assistant */}
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF8F4] transition-colors border border-transparent hover:border-[#F2CC8F]/30">
              <div className="p-3 bg-[#F2CC8F]/20 text-[#8B6E32] rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                <Mic className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#3D405B]">
                    {t.featureTTS}
                  </h3>
                  <SpeakButton text={`${t.featureTTS}. ${t.featureTTSDesc}`} lang={lang} />
                </div>
                <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
                  {t.featureTTSDesc}
                </p>
              </div>
            </div>

            {/* 3. Offline Access */}
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF8F4] transition-colors border border-transparent hover:border-[#F2CC8F]/30">
              <div className="p-3 bg-[#81B29A]/15 text-[#81B29A] rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                <Server className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#3D405B]">
                    {t.featureOffline}
                  </h3>
                  <SpeakButton text={`${t.featureOffline}. ${t.featureOfflineDesc}`} lang={lang} />
                </div>
                <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
                  {t.featureOfflineDesc}
                </p>
              </div>
            </div>

            {/* 4. Gamified Quizzes */}
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF8F4] transition-colors border border-transparent hover:border-[#F2CC8F]/30">
              <div className="p-3 bg-[#3D405B]/10 text-[#3D405B] rounded-xl h-11 w-11 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#3D405B]">
                    {t.featureQuizzes}
                  </h3>
                  <SpeakButton text={`${t.featureQuizzes}. ${t.featureQuizzesDesc}`} lang={lang} />
                </div>
                <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
                  {t.featureQuizzesDesc}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
