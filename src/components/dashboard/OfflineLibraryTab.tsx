import React, { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { OFFLINE_CHAPTERS, OfflineChapter, ChapterSection } from '../../data/offlineChapters';
import { 
  BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Sparkles, Smile, ArrowLeft, RefreshCw, Trash2, 
  Wifi, WifiOff, FileText, Compass, Check, Layers, Play
} from 'lucide-react';
import { offlineSyncManager } from '../../utils/offlineSync';

interface OfflineLibraryTabProps {
  user: User;
  lang: LanguageCode;
}

export default function OfflineLibraryTab({ user, lang }: OfflineLibraryTabProps) {
  // Sync manager online status tracking
  const [appOnline, setAppOnline] = useState(offlineSyncManager.isOnline());
  
  // Simulated offline mode (local user override for testing)
  const [simulatedOffline, setSimulatedOffline] = useState(() => {
    return localStorage.getItem('sim_offline_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sim_offline_mode', simulatedOffline ? 'true' : 'false');
    // Notify the rest of the UI if they want to check local overrides
  }, [simulatedOffline]);

  // Track downloaded chapter IDs in localStorage
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`${user.mobile}_offline_library_downloaded_ids`);
    // Pre-download the water cycle to give a starting point, others are downloadable
    return saved ? JSON.parse(saved) : ['ch-water-cycle'];
  });

  useEffect(() => {
    localStorage.setItem(`${user.mobile}_offline_library_downloaded_ids`, JSON.stringify(downloadedIds));
  }, [downloadedIds, user.mobile]);

  // Sync when active user changes
  useEffect(() => {
    const saved = localStorage.getItem(`${user.mobile}_offline_library_downloaded_ids`);
    setDownloadedIds(saved ? JSON.parse(saved) : ['ch-water-cycle']);
  }, [user.mobile]);

  // Track download progress for individual chapters
  const [downloadProgress, setDownloadProgress] = useState<Record<string, { pct: number; stage: string }>>({});

  // Active viewing state
  const [selectedChapter, setSelectedChapter] = useState<OfflineChapter | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'read' | 'diagrams' | 'quiz'>('read');
  
  // Interactive diagram active nodes
  const [diagramNode, setDiagramNode] = useState<string | null>(null);

  // Practice Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Auto-detect browser connection status
  useEffect(() => {
    const checkConnection = () => {
      setAppOnline(offlineSyncManager.isOnline());
    };
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const isCurrentOnline = appOnline && !simulatedOffline;

  // Handle module download simulation
  const startDownload = (chapterId: string) => {
    if (downloadedIds.includes(chapterId)) return;

    setDownloadProgress(prev => ({
      ...prev,
      [chapterId]: { pct: 0, stage: lang === 'hi' ? 'कनेक्ट हो रहा है...' : 'Initializing connection...' }
    }));

    const stages = lang === 'hi' ? [
      { pct: 15, msg: 'अध्याय दस्तावेज़ ला रहे हैं...' },
      { pct: 40, msg: 'इंटरएक्टिव आरेख संकलित कर रहे हैं...' },
      { pct: 70, msg: 'स्व-मूल्यांकन क्विज़ लोड हो रहा है...' },
      { pct: 90, msg: 'स्थानीय कैश में संपीड़ित किया जा रहा है...' },
      { pct: 100, msg: 'सफलतापूर्वक सहेजा गया! ऑफ़लाइन तैयार।' }
    ] : [
      { pct: 15, msg: 'Fetching chapter resources...' },
      { pct: 40, msg: 'Compiling interactive vector diagrams...' },
      { pct: 70, msg: 'Buffering self-assessment quiz deck...' },
      { pct: 90, msg: 'Compressing assets to local cache...' },
      { pct: 100, msg: 'Module Saved! Ready for offline study.' }
    ];

    let currentStageIndex = 0;
    const interval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        const current = stages[currentStageIndex];
        setDownloadProgress(prev => ({
          ...prev,
          [chapterId]: { pct: current.pct, stage: current.msg }
        }));
        currentStageIndex++;
      } else {
        clearInterval(interval);
        setDownloadedIds(prev => [...prev, chapterId]);
        
        const chapter = OFFLINE_CHAPTERS.find(ch => ch.id === chapterId);
        if (chapter) {
          offlineSyncManager.addLearningFeedEvent(user.mobile, {
            type: 'download',
            title: lang === 'hi' 
              ? `ऑफ़लाइन अध्ययन पैक सिंक किया गया: ${chapter.title[lang] || chapter.title['en']}` 
              : `Synced Offline Cache Pack: ${chapter.title[lang] || chapter.title['en']}`,
            subtitle: lang === 'hi' 
              ? `आज • सहेजा गया ${chapter.packageSize} स्थानीय मेमोरी` 
              : `Today • Saved ${chapter.packageSize} offline local storage`,
            icon: '📥',
            bgClass: 'bg-indigo-50',
            textClass: 'text-indigo-600',
            timestamp: 'Today'
          });
        }

        setDownloadProgress(prev => {
          const updated = { ...prev };
          delete updated[chapterId];
          return updated;
        });
      }
    }, 850);
  };

  const removeDownload = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(lang === 'hi' ? 'क्या आप इस अध्याय को स्थानीय मेमोरी से हटाना चाहते हैं?' : 'Are you sure you want to remove this chapter from local offline memory?')) {
      setDownloadedIds(prev => prev.filter(id => id !== chapterId));
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
    }
  };

  const handleOpenReader = (chapter: OfflineChapter) => {
    // Check if downloaded
    if (!downloadedIds.includes(chapter.id)) {
      alert(lang === 'hi' ? 'ऑफ़लाइन पढ़ने से पहले कृपया इस अध्याय को डाउनलोड करें!' : 'Please download this chapter pack before attempting to open it offline!');
      return;
    }
    setSelectedChapter(chapter);
    setActiveSubTab('read');
    setDiagramNode(null);
    setQuizAnswers({});
    setQuizScore(null);
    setQuizCompleted(false);
  };

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    if (quizCompleted) return;
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitQuiz = () => {
    if (!selectedChapter) return;
    let score = 0;
    selectedChapter.practiceQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.answerIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizCompleted(true);

    if (selectedChapter) {
      offlineSyncManager.addLearningFeedEvent(user.mobile, {
        type: 'quiz',
        title: lang === 'hi'
          ? `प्रश्नोत्तरी उत्तीर्ण की: ${selectedChapter.title[lang] || selectedChapter.title['en']}`
          : `Passed Quiz: ${selectedChapter.title[lang] || selectedChapter.title['en']}`,
        subtitle: lang === 'hi'
          ? `आज • परीक्षा में ${score}/${selectedChapter.practiceQuestions.length} अंक प्राप्त किए`
          : `Today • Scored ${score}/${selectedChapter.practiceQuestions.length} in chapter review`,
        icon: '🏆',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-600',
        timestamp: 'Today'
      });
    }

    // Queue offline sync progress if offline
    if (!isCurrentOnline) {
      // Award 10 points per correct answer to sync to user stats
      offlineSyncManager.queuePendingProgress('quiz_points', score * 10, user.mobile);
    }
  };

  return (
    <div id="offline-knowledge-library" className="space-y-6">
      
      {/* 1. TOP STATUS PANEL & CONNECTIVITY CONTROLLER */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              isCurrentOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {isCurrentOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isCurrentOnline ? (lang === 'hi' ? 'सक्रिय ऑनलाइन मोड' : 'Active Online Mode') : (lang === 'hi' ? 'ऑफ़लाइन अध्ययन मोड' : 'Offline Study Mode')}
            </span>
            <span className="bg-[#FAF8F4] border border-[#F2CC8F]/40 text-[#8B6E32] text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              No Data Required
            </span>
          </div>
          <h2 className="font-display font-black text-base text-[#3D405B]">
            {lang === 'hi' ? 'ऑफ़लाइन ज्ञान पुस्तकालय' : 'Offline Knowledge Library'}
          </h2>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            {lang === 'hi' 
              ? 'इंटरनेट न होने पर भी अपने गाँव के खेत, घर या यात्रा के दौरान विज्ञान और गणित के इंटरएक्टिव अध्यायों को पढ़ें, आरेख देखें और क्विज़ खेलें।' 
              : 'Download structured textbook chapters and visual interactive science/math study packs to read and quiz yourself even in the deep interior fields with zero signal.'}
          </p>
        </div>

        {/* CONNECTIVITY SIMULATION TOGGLE FOR DEMONSTRATION */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 flex items-center justify-between gap-4 shrink-0">
          <div className="text-left">
            <span className="text-[9px] font-mono font-extrabold text-gray-400 uppercase tracking-wider block">
              Simulation Control
            </span>
            <span className="text-[11px] font-bold text-gray-700 block mt-0.5">
              {simulatedOffline ? (lang === 'hi' ? 'सिम्युलेटेड: ऑफ़लाइन' : 'Simulating: Offline 📴') : (lang === 'hi' ? 'सिम्युलेटेड: ऑनलाइन' : 'Simulating: Online 🌐')}
            </span>
          </div>
          
          <button
            onClick={() => setSimulatedOffline(!simulatedOffline)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulatedOffline ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulatedOffline ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {!selectedChapter ? (
        /* =================== CHAPTERS LIST MODE =================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OFFLINE_CHAPTERS.map((chapter) => {
            const isDownloaded = downloadedIds.includes(chapter.id);
            const progress = downloadProgress[chapter.id];
            const title = chapter.title[lang] || chapter.title['en'];
            const desc = chapter.description[lang] || chapter.description['en'];
            const isMath = chapter.subject === 'Math';

            return (
              <div 
                key={chapter.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col text-left overflow-hidden h-full ${
                  isDownloaded 
                    ? 'border-emerald-150 shadow-xs hover:border-emerald-250' 
                    : 'border-gray-200 hover:border-gray-300 shadow-3xs'
                }`}
              >
                {/* Header tag */}
                <div className={`p-4 pb-3 flex justify-between items-start border-b border-gray-50 ${
                  isMath ? 'bg-amber-50/20' : 'bg-emerald-50/10'
                }`}>
                  <div>
                    <span className={`inline-block text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isMath ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {chapter.subjectDisplay[lang] || chapter.subjectDisplay['en']}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 block mt-1">
                      Time: {chapter.readingTime} • Size: {chapter.packageSize}
                    </span>
                  </div>

                  {isDownloaded && (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="h-3 w-3 stroke-[3]" /> OFF-READY
                    </span>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-black text-sm text-[#3D405B] leading-snug">
                      {title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-sans leading-relaxed line-clamp-3">
                      {desc}
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-3">
                    {progress ? (
                      /* Download progress bar state */
                      <div className="w-full space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-mono font-black text-gray-500">
                          <span className="animate-pulse">{progress.stage}</span>
                          <span>{progress.pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                      </div>
                    ) : isDownloaded ? (
                      /* Downloaded -> Open Reader with Trash support */
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleOpenReader(chapter)}
                          className="flex-1 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-97"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{lang === 'hi' ? 'अध्याय खोलें' : 'Read Offline'}</span>
                        </button>
                        <button
                          onClick={(e) => removeDownload(chapter.id, e)}
                          className="p-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl transition-colors cursor-pointer"
                          title={lang === 'hi' ? 'हटाएं' : 'Delete Local Cache'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      /* Not downloaded -> Trigger download (Requires simulation check) */
                      <button
                        onClick={() => startDownload(chapter.id)}
                        className={`w-full py-2 px-3.5 rounded-xl text-xs font-black shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-97 ${
                          isCurrentOnline
                            ? 'bg-[#E07A5F] hover:bg-[#D16B51] text-white'
                            : 'bg-gray-100 text-gray-400 border border-dashed border-gray-200 cursor-not-allowed'
                        }`}
                        disabled={!isCurrentOnline}
                        title={!isCurrentOnline ? 'Requires online connection' : undefined}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>
                          {isCurrentOnline 
                            ? (lang === 'hi' ? 'लोकल मेमोरी में डाउनलोड' : 'Download Chapter Pack') 
                            : (lang === 'hi' ? 'कनेक्शन आवश्यक' : 'Connect to Download')}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================== OFFLINE INTERACTIVE READER MODE =================== */
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden text-left">
          
          {/* Reader Sub-Header bar with Back button */}
          <div className="bg-gray-50/60 p-4 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => setSelectedChapter(null)}
              className="flex items-center gap-1.5 text-xs font-black text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 stroke-[3]" />
              <span>{lang === 'hi' ? 'पुस्तकालय में वापस जाएं' : 'Back to Library'}</span>
            </button>

            <div className="text-right">
              <span className="text-[9px] font-mono text-gray-400 block uppercase tracking-wide">
                Active Local Module • Offline Verified
              </span>
              <h4 className="font-display font-extrabold text-xs text-[#3D405B]">
                {selectedChapter.title[lang] || selectedChapter.title['en']}
              </h4>
            </div>
          </div>

          {/* READER NAVIGATION SUB-TABS */}
          <div className="border-b border-gray-150 flex">
            <button
              onClick={() => { setActiveSubTab('read'); setDiagramNode(null); }}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'read' 
                  ? 'border-[#E07A5F] text-[#E07A5F] bg-[#FAF8F4]/20' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{lang === 'hi' ? 'पाठ्यपुस्तक पढ़ें' : 'Read Chapter'}</span>
            </button>

            <button
              onClick={() => { setActiveSubTab('diagrams'); setDiagramNode(null); }}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'diagrams' 
                  ? 'border-[#81B29A] text-[#81B29A] bg-[#81B29A]/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>{lang === 'hi' ? 'इंटरएक्टिव आरेख' : 'Visual Diagrams'}</span>
            </button>

            <button
              onClick={() => { setActiveSubTab('quiz'); setDiagramNode(null); }}
              className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'quiz' 
                  ? 'border-amber-500 text-amber-600 bg-amber-500/5' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>{lang === 'hi' ? 'अभ्यास क्विज़' : 'Practice Test'}</span>
            </button>
          </div>

          {/* READER MAIN CANVAS */}
          <div className="p-6">
            
            {/* SUB-TAB 1: TEXTBOOK READER */}
            {activeSubTab === 'read' && (
              <div className="max-w-3xl mx-auto space-y-6">
                {selectedChapter.sections.map((section, sIdx) => {
                  const sectionTitle = section.title[lang] || section.title['en'];
                  const paras = section.paragraphs[lang] || section.paragraphs['en'] || [];

                  return (
                    <article key={sIdx} className="space-y-3.5 border-b border-gray-150/60 pb-6 last:border-b-0">
                      <h3 className="font-display font-extrabold text-sm text-[#3D405B] flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-[#E07A5F] rounded-full shrink-0" />
                        {sectionTitle}
                      </h3>
                      <div className="space-y-3 pl-3.5">
                        {paras.map((pText, pIdx) => (
                          <p key={pIdx} className="text-xs text-gray-600 leading-relaxed font-sans text-justify">
                            {pText}
                          </p>
                        ))}
                      </div>

                      {/* Prompt to see diagram if this section has one */}
                      {section.diagramType && (
                        <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-150/60 max-w-max flex items-center gap-3">
                          <span className="text-[10px] font-sans text-gray-500 font-medium">
                            {lang === 'hi' 
                              ? '💡 इस विषय पर आधारित एक इंटरएक्टिव आरेख उपलब्ध है!' 
                              : '💡 A high-resolution interactive diagram is available for this section!'}
                          </span>
                          <button
                            onClick={() => setActiveSubTab('diagrams')}
                            className="py-1 px-3 bg-[#81B29A] hover:bg-[#6FA38B] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{lang === 'hi' ? 'आरेख देखें' : 'View Schema'}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* SUB-TAB 2: INTERACTIVE DIAGRAM CANVAS */}
            {activeSubTab === 'diagrams' && (
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Visual SVG Box (Left side of grid) */}
                <div className="md:col-span-7 bg-[#FAF8F4] border border-[#F2CC8F]/40 p-4 rounded-3xl flex flex-col justify-center items-center shadow-3xs select-none">
                  <span className="text-[9px] font-mono font-bold text-[#E07A5F] mb-3 self-start uppercase tracking-wider">
                    Interactive Vectors • Click Nodes to Learn
                  </span>

                  {/* RENDER SPECIFIC SVGS BASED ON CHAPTER DIAGRAMTYPE */}
                  {selectedChapter.id === 'ch-water-cycle' && (
                    <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto drop-shadow-sm">
                      {/* Sky & Clouds background */}
                      <rect x="0" y="0" width="400" height="180" fill="#EBF4FA" rx="16" />
                      {/* Earth / Ocean base */}
                      <rect x="0" y="180" width="400" height="120" fill="#D3EAF2" rx="16" />
                      <path d="M 0 190 Q 100 160, 200 190 T 400 190 L 400 300 L 0 300 Z" fill="#A8D5E5" />
                      <path d="M 0 210 Q 120 180, 250 210 T 400 220 L 400 300 L 0 300 Z" fill="#81B29A" />

                      {/* Node 1: SUN (Evaporation trigger) */}
                      <g 
                        className="cursor-pointer group"
                        onClick={() => setDiagramNode('evap')}
                      >
                        <circle 
                          cx="70" cy="60" r="32" 
                          fill={diagramNode === 'evap' ? '#E07A5F' : '#F2CC8F'} 
                          className="transition-colors duration-200" 
                        />
                        <circle cx="70" cy="60" r="24" fill="#F4E285" />
                        {/* Sun rays */}
                        <line x1="70" y1="15" x2="70" y2="28" stroke="#F4E285" strokeWidth="4" strokeLinecap="round" />
                        <line x1="70" y1="92" x2="70" y2="105" stroke="#F4E285" strokeWidth="4" strokeLinecap="round" />
                        <line x1="25" y1="60" x2="38" y2="60" stroke="#F4E285" strokeWidth="4" strokeLinecap="round" />
                        <line x1="102" y1="60" x2="115" y2="60" stroke="#F4E285" strokeWidth="4" strokeLinecap="round" />
                        <text x="70" y="64" textAnchor="middle" className="text-[10px] font-mono font-bold fill-gray-800 pointer-events-none">
                          1. SUN
                        </text>
                      </g>

                      {/* Rising water vapor arrows */}
                      <g stroke="#E07A5F" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-pulse">
                        <path d="M 160 210 Q 155 170, 160 140" />
                        <path d="M 160 140 L 155 145 M 160 140 L 165 145" />
                        <path d="M 200 230 Q 195 180, 200 150" />
                        <path d="M 200 150 L 195 155 M 200 150 L 205 155" />
                      </g>

                      {/* Node 2: CLOUDS (Condensation node) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => setDiagramNode('condens')}
                      >
                        <path 
                          d="M 270 70 a 20 20 0 0 1 20 -10 a 25 25 0 0 1 45 -5 a 20 20 0 0 1 15 25 a 20 20 0 0 1 -10 20 L 260 100 a 20 20 0 0 1 10 -30 Z" 
                          fill={diagramNode === 'condens' ? '#81B29A' : '#FFFFFF'} 
                          className="transition-colors duration-200 stroke-gray-200 stroke-[2]"
                        />
                        <text x="305" y="82" textAnchor="middle" className="text-[10px] font-mono font-black fill-[#3D405B] pointer-events-none">
                          2. CLOUD
                        </text>
                      </g>

                      {/* Rain drops falling */}
                      <g stroke="#3D405B" strokeWidth="2" strokeDasharray="3,6" className="opacity-75">
                        <line x1="285" y1="120" x2="285" y2="160" />
                        <line x1="305" y1="120" x2="305" y2="160" />
                        <line x1="325" y1="120" x2="325" y2="160" />
                      </g>

                      {/* Node 3: OCEAN / GROUND (Precipitation collection) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => setDiagramNode('precip')}
                      >
                        <circle 
                          cx="270" cy="240" r="30" 
                          fill={diagramNode === 'precip' ? '#E07A5F' : '#F4F1DE'} 
                          className="transition-colors duration-200 border stroke-gray-200" 
                        />
                        <text x="270" y="244" textAnchor="middle" className="text-[9px] font-mono font-black fill-[#3D405B] pointer-events-none">
                          3. RAIN
                        </text>
                      </g>
                    </svg>
                  )}

                  {selectedChapter.id === 'ch-photosynthesis' && (
                    <svg viewBox="0 0 400 300" className="w-full max-w-[340px] h-auto drop-shadow-sm">
                      {/* Outdoor context */}
                      <rect x="0" y="0" width="400" height="200" fill="#F0F8FF" rx="16" />
                      <rect x="0" y="200" width="400" height="100" fill="#E6CCB2" rx="16" />

                      {/* Sun node */}
                      <g className="cursor-pointer" onClick={() => setDiagramNode('photo-sun')}>
                        <circle cx="60" cy="50" r="22" fill="#F4E285" />
                        <circle cx="60" cy="50" r="26" fill="none" stroke="#F4E285" strokeWidth="2" strokeDasharray="4,4" />
                        <text x="60" y="53" textAnchor="middle" className="text-[8px] font-mono font-bold fill-gray-800">SUN</text>
                      </g>

                      {/* Huge green leaf vector */}
                      <g className="cursor-pointer" onClick={() => setDiagramNode('photo-leaf')}>
                        <path 
                          d="M 120 160 Q 200 40, 320 120 Q 240 220, 120 160 Z" 
                          fill={diagramNode === 'photo-leaf' ? '#3D5A45' : '#81B29A'} 
                          className="transition-colors duration-200 stroke-[#2C5E43] stroke-[3]" 
                        />
                        {/* Leaf veins */}
                        <path d="M 120 160 Q 220 130, 320 120" stroke="#2C5E43" strokeWidth="2.5" fill="none" />
                        <path d="M 180 148 Q 200 110, 210 95" stroke="#2C5E43" strokeWidth="1.5" fill="none" />
                        <path d="M 220 140 Q 250 110, 260 90" stroke="#2C5E43" strokeWidth="1.5" fill="none" />
                        <path d="M 200 143 Q 190 170, 180 185" stroke="#2C5E43" strokeWidth="1.5" fill="none" />
                        <path d="M 240 135 Q 230 170, 220 180" stroke="#2C5E43" strokeWidth="1.5" fill="none" />

                        <text x="210" y="125" className="text-[10px] font-mono font-black fill-white pointer-events-none">
                          CHLOROPHYLL
                        </text>
                      </g>

                      {/* Plant Stem / roots */}
                      <path d="M 120 160 L 100 240" stroke="#7F5539" strokeWidth="6" fill="none" />
                      <g className="cursor-pointer" onClick={() => setDiagramNode('photo-water')}>
                        <rect x="60" y="225" width="80" height="35" rx="8" fill={diagramNode === 'photo-water' ? '#3D405B' : '#EBF4FA'} className="stroke-blue-200" />
                        <text x="100" y="246" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#3D405B]">H2O (Water)</text>
                      </g>

                      {/* Carbon intake */}
                      <g className="cursor-pointer" onClick={() => setDiagramNode('photo-co2')}>
                        <circle cx="340" cy="180" r="28" fill={diagramNode === 'photo-co2' ? '#E07A5F' : '#FFF2E6'} className="stroke-orange-200" />
                        <text x="340" y="183" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#E07A5F]">CO2 In</text>
                      </g>

                      {/* Oxygen output */}
                      <g className="cursor-pointer" onClick={() => setDiagramNode('photo-o2')}>
                        <circle cx="280" cy="40" r="26" fill={diagramNode === 'photo-o2' ? '#81B29A' : '#F4F1DE'} className="stroke-emerald-200" />
                        <text x="280" y="43" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#2C5E43]">O2 Out</text>
                      </g>
                    </svg>
                  )}

                  {selectedChapter.id === 'ch-multiplication' && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-150/60 w-full flex flex-col items-center">
                      <span className="text-[10px] font-mono font-bold text-gray-400 mb-2">
                        Repeated Addition Grid: 4 rows × 5 stars = 20 stars
                      </span>

                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((rowIdx) => (
                          <div 
                            key={rowIdx} 
                            onClick={() => setDiagramNode(`multi-row-${rowIdx}`)}
                            className={`flex gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                              diagramNode === `multi-row-${rowIdx}` 
                                ? 'bg-amber-50 border-amber-300 scale-102' 
                                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <span className="text-[9px] font-mono font-bold text-[#E07A5F] self-center pr-1 border-r border-gray-200">
                              Row {rowIdx}:
                            </span>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((starIdx) => (
                                <span 
                                  key={starIdx} 
                                  className="text-lg text-amber-500 animate-pulse"
                                  style={{ animationDelay: `${starIdx * 100}ms` }}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-[9px] font-mono font-bold text-gray-500 self-center pl-1">
                              (+ 5)
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 text-xs font-mono font-black text-[#3D405B] bg-[#FAF8F4] px-4 py-1.5 rounded-lg border border-[#F2CC8F]/30">
                        Total Sum: 5 + 5 + 5 + 5 = 20 stars
                      </div>
                    </div>
                  )}

                  <p className="text-[9px] font-sans text-gray-400 mt-2 text-center">
                    {lang === 'hi' 
                      ? '💡 विस्तृत विवरण देखने के लिए आरेख के किसी भी भाग पर क्लिक करें।' 
                      : '💡 Tap on any colored segment of the diagram for descriptive offline explanations.'}
                  </p>
                </div>

                {/* Explanatory Node text (Right side of grid) */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-3xs min-h-[220px] flex flex-col justify-center text-left">
                    
                    {!diagramNode ? (
                      /* Zero state explanation */
                      <div className="space-y-2 text-center py-6">
                        <Smile className="h-8 w-8 text-[#81B29A] mx-auto opacity-75" />
                        <h4 className="font-display font-extrabold text-xs text-[#3D405B]">
                          {lang === 'hi' ? 'आरेख एक्सप्लोरर' : 'Visual Node Explanations'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                          {lang === 'hi' 
                            ? 'वैज्ञानिक और गणितीय प्रक्रियाओं को समझने के लिए बाईं ओर के आरेख के नोड्स (Nodes) पर क्लिक करें!' 
                            : 'Click on any diagram nodes on the left to see simplified, localized breakdowns of the core system processes.'}
                        </p>
                      </div>
                    ) : (
                      /* Active Node Description text */
                      <div className="space-y-3">
                        <span className="text-[9px] font-mono font-black text-[#E07A5F] uppercase tracking-wide bg-[#E07A5F]/10 px-2 py-0.5 rounded">
                          Concept Node Detail
                        </span>

                        {/* WATER CYCLE EXPLANATIONS */}
                        {selectedChapter.id === 'ch-water-cycle' && (
                          <>
                            {diagramNode === 'evap' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? '1. सूरज की गर्मी और वाष्पीकरण' : '1. Solar Heat & Evaporation'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'सूरज चमकता है और तालाबों और नदियों के पानी को गर्म करता है। यह गर्म पानी अदृश्य भाप बनकर आसमान में ऊपर उठने लगता है।' 
                                    : 'The bright sun acts as the thermal engine, warming up surface waters. Water transitions from a liquid state into light, invisible water vapor gas and ascends.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'condens' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? '2. ठंडक और संघनन' : '2. Atmospheric Cooling & Condensation'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'ऊपर उठने वाली भाप जब ठंडी हवा से टकराती है, तो वह वापस पानी की छोटी बूंदों में बदल जाती है। ये बूंदें आपस में मिलकर बादलों का निर्माण करती हैं।' 
                                    : 'As vapor reaches higher, colder air layers, it cools and converts back into microscopic liquid water droplets, clustering to form fluffy white clouds.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'precip' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? '3. वर्षण (बारिश की बूँदें)' : '3. Precipitation (Rain Shower)'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'जब बादल बहुत भारी हो जाते हैं और बूंदों को संभाल नहीं पाते, तो वे बारिश के रूप में बरसते हैं। यह खेतों और कुओं को भरता है।' 
                                    : 'When water droplets inside clouds aggregate and become too heavy for drafts to support, gravity pulls them down as precipitation to feed fields.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* PHOTOSYNTHESIS EXPLANATIONS */}
                        {selectedChapter.id === 'ch-photosynthesis' && (
                          <>
                            {diagramNode === 'photo-sun' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? 'सूर्य का प्रकाश (Solar Energy)' : 'Sunlight: The Power Source'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'सूरज पौधों के लिए असीमित ऊर्जा का स्रोत है। पत्तियां इस धूप को पकड़ती हैं ताकि वे भोजन पकाने के लिए रासायनिक ईंधन बना सकें।' 
                                    : 'Sunlight supplies pure radiant energy to the plant. Chlorophyll collects this light, using its energy to split water molecules.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'photo-leaf' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? 'क्लोरोफिल (The Green Magic Chef)' : 'Chlorophyll: Leaf Solar Panels'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'पत्तियों में मौजूद क्लोरोफिल धूप को अवशोषित करता है। इसी तत्व के कारण पेड़ की पत्तियां हरी दिखाई देती हैं।' 
                                    : 'The green chemical pigment that absorbs red and blue light, converting solar photon waves into chemical energy pathways.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'photo-water' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? 'पानी सोखना (Root H2O Absorption)' : 'Root Systems & Stem Pipeways'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'पौधे की जड़ें जमीन से पानी सोखती हैं और तने के ज़रिए बारीक पाइपों की तरह पत्तियों तक पहुँचाती हैं।' 
                                    : 'Roots absorb moisture and minerals from the subterranean soil. The plant vascular xylem system pumps it up the stem into the leaf kitchen.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'photo-co2' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? 'कार्बन डाइऑक्साइड (CO2 Gas Intake)' : 'Stomata Pores & CO2 Gas'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'पत्तियाँ स्टोमेटा नामक छोटे छिद्रों के ज़रिए हवा से कार्बन डाइऑक्साइड गैस को अपने अंदर सोखती हैं।' 
                                    : 'Leaves inhale Carbon Dioxide gas through tiny micro-mouths called stomata distributed on the underside of green leaves.'}
                                </p>
                              </div>
                            )}
                            {diagramNode === 'photo-o2' && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? 'ऑक्सीजन का निष्कासन (O2 Release)' : 'Fresh Oxygen Byproduct'}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? 'भोजन बनाने की प्रक्रिया के बाद पत्तियाँ हवा में ताज़ी ऑक्सीजन गैस छोड़ती हैं। यह गैस हम सभी के जीवित रहने के लिए ज़रूरी है।' 
                                    : 'After synthesizing sweet glucose food, the leaf exhales pure Oxygen gas as a byproduct back into the atmosphere for humans and animals.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* MULTIPLICATION EXPLANATIONS */}
                        {selectedChapter.id === 'ch-multiplication' && (
                          <>
                            {diagramNode.startsWith('multi-row-') && (
                              <div className="space-y-1">
                                <h4 className="font-display font-extrabold text-sm text-[#3D405B]">
                                  {lang === 'hi' ? `पंक्ति ${diagramNode.split('-')[2]}: समूह संख्या` : `Row ${diagramNode.split('-')[2]}: Groups of Items`}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                                  {lang === 'hi' 
                                    ? `इस पंक्ति में ठीक 5 तारे हैं। बार-बार 5 जोड़ने (5 + 5 + 5 + 5) के बजाय, हम कह सकते हैं कि 5 के 4 समूह हैं, जो गुणा के रूप में व्यक्त होता है।` 
                                    : `This row represents a single cluster of exactly 5 stars. By duplicating this group 4 times, we solve the addition equation 5 + 5 + 5 + 5 rapidly via 4 × 5.`}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Clear button */}
                        <button
                          onClick={() => setDiagramNode(null)}
                          className="mt-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer block"
                        >
                          {lang === 'hi' ? '← वापस एक्सप्लोर करें' : '← Reset Selector'}
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 3: PRACTICE QUIZ TESTING */}
            {activeSubTab === 'quiz' && (
              <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Score display header */}
                {quizScore !== null && (
                  <div className={`p-4 rounded-3xl border flex items-center gap-3.5 ${
                    quizScore === selectedChapter.practiceQuestions.length
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <Award className={`h-8 w-8 shrink-0 ${quizScore === selectedChapter.practiceQuestions.length ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <div className="text-left font-sans">
                      <h4 className="font-display font-black text-xs uppercase tracking-wider">
                        {lang === 'hi' ? 'स्थानीय स्व-मूल्यांकन परिणाम' : 'Offline Self-Assessment Score'}
                      </h4>
                      <p className="text-xs font-bold">
                        {lang === 'hi' 
                          ? `आपने ${selectedChapter.practiceQuestions.length} में से ${quizScore} प्रश्नों का सही उत्तर दिया!` 
                          : `You correctly answered ${quizScore} out of ${selectedChapter.practiceQuestions.length} practice questions offline!`}
                      </p>
                      {!isCurrentOnline && (
                        <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                          {lang === 'hi' 
                            ? '🔔 डिवाइस ऑफ़लाइन है। स्कोर सिंक होने के लिए सुरक्षित कतारबद्ध कर दिया गया है।' 
                            : '🔔 Device offline. Score has been queued to sync automatically when internet is available.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Questions card decks */}
                <div className="space-y-5 text-left">
                  {selectedChapter.practiceQuestions.map((q, qIdx) => {
                    const questionText = q.question[lang] || q.question['en'];
                    const optionsList = q.options[lang] || q.options['en'] || [];
                    const selectedOpt = quizAnswers[q.id];
                    const hasAnswered = selectedOpt !== undefined;

                    return (
                      <div key={q.id} className="p-5 bg-white border border-gray-150 rounded-3xl shadow-3xs space-y-3.5">
                        <span className="inline-block text-[9px] font-mono font-black text-[#E07A5F] bg-[#E07A5F]/10 px-2 py-0.5 rounded">
                          Question {qIdx + 1} of {selectedChapter.practiceQuestions.length}
                        </span>

                        <h4 className="font-display font-extrabold text-xs text-[#3D405B] leading-relaxed">
                          {questionText}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {optionsList.map((option, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            const isCorrect = optIdx === q.answerIndex;
                            let buttonStyle = 'border-gray-150 hover:border-gray-300 bg-white hover:bg-gray-50';

                            if (quizCompleted) {
                              if (isCorrect) {
                                buttonStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                              } else if (isSelected) {
                                buttonStyle = 'bg-red-50 border-red-300 text-red-950';
                              } else {
                                buttonStyle = 'bg-gray-50 border-gray-100 opacity-60';
                              }
                            } else if (isSelected) {
                              buttonStyle = 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizAnswer(q.id, optIdx)}
                                className={`p-3 rounded-xl border text-left text-[11px] font-sans transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                                disabled={quizCompleted}
                              >
                                <span>{option}</span>
                                {quizCompleted && isCorrect && <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Shows bilingual explanation post-completion */}
                        {quizCompleted && (
                          <div className="mt-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-150/60 font-sans text-left">
                            <span className="text-[9px] font-mono font-bold text-[#81B29A] block uppercase">
                              Concept Explanation
                            </span>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                              {q.explanation[lang] || q.explanation['en']}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submission CTA */}
                {!quizCompleted ? (
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < selectedChapter.practiceQuestions.length}
                    className={`w-full py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      Object.keys(quizAnswers).length === selectedChapter.practiceQuestions.length
                        ? 'bg-[#E07A5F] hover:bg-[#D16B51] text-white active:scale-98'
                        : 'bg-gray-100 text-gray-400 border border-dashed border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>{lang === 'hi' ? 'क्विज़ सबमिट करें' : 'Submit Practice Quiz'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizScore(null);
                      setQuizCompleted(false);
                    }}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>{lang === 'hi' ? 'फिर से खेलें' : 'Restart Practice Quiz'}</span>
                  </button>
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
