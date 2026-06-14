import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import SpeakButton from './SpeakButton';
import { GraduationCap, Users, HeartHandshake, Eye } from 'lucide-react';

interface AboutViewProps {
  lang: LanguageCode;
}

export default function AboutView({ lang }: AboutViewProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div id="about-view-container" className="space-y-12 pb-16">
      {/* Page Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="flex items-center justify-center space-x-1.5">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#3D405B] tracking-tight">
            {t.aboutTitle}
          </h1>
          <SpeakButton text={`${t.aboutTitle}. ${t.aboutSubtitle}`} lang={lang} size="sm" />
        </div>
        <p className="font-sans text-base sm:text-lg text-[#3D405B]/70 leading-relaxed">
          {t.aboutSubtitle}
        </p>
      </section>

      {/* Grid of Core Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Core Pillar 1 */}
        <div className="bg-white rounded-[24px] p-6 border border-[#F2CC8F]/20 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#81B29A]/15 rounded-xl text-[#81B29A] border border-[#81B29A]/10">
                <Users className="h-6 w-6" />
              </div>
              <SpeakButton text={`${t.missionTitle}. ${t.missionDesc}`} lang={lang} />
            </div>
            <h3 className="font-display font-bold text-lg text-[#3D405B]">
              {t.missionTitle}
            </h3>
            <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
              {t.missionDesc}
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-[#81B29A] bg-[#81B29A]/10 px-2.5 py-1 rounded inline-self-start border border-[#81B29A]/20">
            60%+ Impact Metric
          </div>
        </div>

        {/* Core Pillar 2 */}
        <div className="bg-white rounded-[24px] p-6 border border-[#F2CC8F]/20 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#E07A5F]/15 rounded-xl text-[#E07A5F] border border-[#E07A5F]/10">
                <GraduationCap className="h-6 w-6" />
              </div>
              <SpeakButton text={`${t.visionTitle}. ${t.visionDesc}`} lang={lang} />
            </div>
            <h3 className="font-display font-bold text-lg text-[#3D405B]">
              {t.visionTitle}
            </h3>
            <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
              {t.visionDesc}
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-[#E07A5F] bg-[#E07A5F]/10 px-2.5 py-1 rounded inline-self-start border border-[#E07A5F]/20">
            Curiosity Guided
          </div>
        </div>

        {/* Core Pillar 3 */}
        <div className="bg-white rounded-[24px] p-6 border border-[#F2CC8F]/20 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#F2CC8F]/20 rounded-xl text-[#8B6E32] border border-[#F2CC8F]/30">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <SpeakButton text={`${t.ruralReachTitle}. ${t.ruralReachDesc}`} lang={lang} />
            </div>
            <h3 className="font-display font-bold text-lg text-[#3D405B]">
              {t.ruralReachTitle}
            </h3>
            <p className="font-sans text-sm text-[#3D405B]/70 leading-relaxed">
              {t.ruralReachDesc}
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-[#8B6E32] bg-[#F2CC8F]/20 px-2.5 py-1 rounded inline-self-start border border-[#F2CC8F]/30">
            Local Dialects
          </div>
        </div>
      </section>

      {/* Inspirational Quote Callout */}
      <section className="bg-[#3D405B] text-white rounded-[32px] p-6 sm:p-10 max-w-4xl mx-auto shadow-lg relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-[#E07A5F] opacity-15" />
        <div className="absolute -left-16 -top-16 w-32 h-32 rounded-full bg-[#81B29A] opacity-20" />
        
        <div className="relative text-center space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <Eye className="h-5 w-5 text-[#F2CC8F]" />
            <span className="text-xs uppercase tracking-widest font-mono text-[#F2CC8F]">Our Shared Vision</span>
          </div>
          
          <h4 className="font-display font-bold text-lg sm:text-xl md:text-2xl italic leading-relaxed max-w-2xl mx-auto text-white/95">
            "Education is not the learning of facts, but the training of the mind to think."
          </h4>
          
          <div className="h-[1px] w-24 bg-[#E07A5F] mx-auto" />
          
          <p className="font-sans text-xs text-[#F2CC8F] font-mono tracking-wider">
            Optimized for rural tablets with native translation lookup grids.
          </p>
        </div>
      </section>
    </div>
  );
}
