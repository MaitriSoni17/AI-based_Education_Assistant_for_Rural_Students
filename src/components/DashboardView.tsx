import { useState, useEffect, FormEvent } from 'react';
import { LanguageCode, User, QuizQuestion, OfflineResource } from '../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import SpeakButton from './SpeakButton';
import { speakText, stopSpeaking } from '../utils/speech';
import { 
  Play, BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Volume2, Search, Sparkles, Smile, Video, ArrowLeft, RefreshCw 
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  lang: LanguageCode;
}

interface LessonQuery {
  id: string;
  query: string;
  subject: string;
  explanation: string;
  videoThumbColor: string;
  avatarChar: string;
  avatarName: string;
  quiz: QuizQuestion[];
}

const SAMPLE_LESSONS: Record<LanguageCode, LessonQuery[]> = {
  en: [
    {
      id: 'rain',
      query: "How do clouds produce rain?",
      subject: "Science 🔬",
      avatarChar: "👵 Dadi AI",
      avatarName: "Dadi AI (Village Elder)",
      explanation: "When water in lakes gets heated by the sun, it turns into gas called vapor. It goes up and gathers in the sky to form clouds! When these clouds get too cold and heavy with water droplets, they fall back to the earth as rain! That is the water cycle.",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "What heats the water in lakes to start the cycle?",
          options: ["The Moon", "The Sun", "Huge Fans", "Forest Fires"],
          answerIndex: 1,
          explanation: "The Sun rises and heats the water, turning it into gas vapor!"
        },
        {
          id: 'q2',
          question: "What are clouds made of?",
          options: ["Cotton candies", "Smoke from stoves", "Water droplets and vapor", "White paint"],
          answerIndex: 2,
          explanation: "Clouds are collections of tiny water droplets and vapor in very cold air!"
        }
      ]
    },
    {
      id: 'photo',
      query: "What is Photosynthesis?",
      subject: "Science 🔬",
      avatarChar: "🤖 Swami AI",
      avatarName: "Swami AI (Smart Mascot)",
      explanation: "Photosynthesis is how green leaves make food! Leaves use Sunlight, Water from soil, and Air (Carbon Dioxide). Using green Chlorophyll, they mix these to produce sweet glucose food and release fresh Oxygen for us to breathe!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "What gas is released by green leaves during photosynthesis?",
          options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Smoke"],
          answerIndex: 1,
          explanation: "Plants breathe in carbon dioxide and release fresh oxygen for us!"
        }
      ]
    },
    {
      id: 'math',
      query: "Why do we use multiplication?",
      subject: "Mathematics 📐",
      avatarChar: "🦊 Chanda AI",
      avatarName: "Chanda AI (Smart Fox)",
      explanation: "Multiplication is just very fast addition! Instead of adding 5 + 5 + 5 (which is 15), we simply do 5 times 3, which is 15! It makes counting items or currency infinitely faster.",
      videoThumbColor: "from-orange-400 to-red-500",
      quiz: [
        {
          id: 'q1',
          question: "What is another way to write 4 + 4 + 4?",
          options: ["4 x 1", "4 x 4", "4 x 3", "4 x 2"],
          answerIndex: 2,
          explanation: "Adding 4 three times is exactly same as 4 times 3 (which is 12)!"
        }
      ]
    }
  ],
  hi: [
    {
      id: 'rain',
      query: "बादल बारिश कैसे करते हैं?",
      subject: "विज्ञान 🔬",
      avatarChar: "👵 दादी AI",
      avatarName: "दादी AI (गाँव की सयानी)",
      explanation: "जब सूरज नदियों और झीलों के पानी को गर्म करता है, तो पानी भाप बनकर उड़ जाता है। ऊपर जाकर यह भाप ठंडी हवा में मिलकर बादलों का रूप ले लेती है! जब बादल बहुत भारी और ठंडे हो जाते हैं, तब पानी की बूँदें धरती पर गिरती हैं, जिसे हम बारिश कहते हैं!",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "पानी को गर्म करके भाप में बदलने का काम कौन करता है?",
          options: ["चन्द्रमा", "सूरज", "पेड़-पौधे", "हवा"],
          answerIndex: 1,
          explanation: "सूरज की गर्मी से पानी भाप (वाष्प) में परिवर्तित होता है।"
        },
        {
          id: 'q2',
          question: "भाप ठंडी होकर क्या बनाती है?",
          options: ["मिट्टी", "बादल", "पहाड़", "कोयला"],
          answerIndex: 1,
          explanation: "भाप ऊपर जाकर संघनित होती है और बादल बनाती है।"
        }
      ]
    },
    {
      id: 'photo',
      query: "प्रकाश संश्लेषण (Photosynthesis) क्या है?",
      subject: "विज्ञान 🔬",
      avatarChar: "🤖 स्वामी AI",
      avatarName: "स्वामी AI (स्मार्ट साथी)",
      explanation: "प्रकाश संश्लेषण पौधों द्वारा भोजन बनाने की प्रक्रिया है! हरी पत्तियां धूप, मिट्टी से पानी और हवा से कार्बन डाइऑक्साइड लेकर क्लोरोफिल की मदद से मीठा ग्लूकोज बनाती हैं और हमें सांस लेने के लिए साफ ऑक्सीजन प्रदान करती हैं!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "पौधे अपना भोजन बनाने के लिए धूप के साथ क्या लेते हैं?",
          options: ["पानी और हवा", "दूध", "फल", "लकड़ी"],
          answerIndex: 0,
          explanation: "पौधों को भोजन के लिए धूप, पानी और हवा की आवश्यकता होती है।"
        }
      ]
    }
  ],
  gu: [
    {
      id: 'rain',
      query: "વાદળાં કેવી રીતે વરસાદ લાવે છે?",
      subject: "વિજ્ઞાન 🔬",
      avatarChar: "👵 દાદી AI",
      avatarName: "દાદી AI (ગામડાના વડીલ)",
      explanation: "જ્યારે સૂર્યની ગરમીથી નદીઓ અને તળાવનું પાણી ગરમ થાય છે, ત્યારે તેનું વરાળમાં રૂપાંતર થાય છે. આ વરાળ આકાશમાં ઊંચે જઈને ભેગી થાય છે અને વાદળાં બને છે! જ્યારે આ વાદળ ઠંડા અને પાણીના ટીપાંથી ભારે થઈ જાય છે, ત્યારે તે પૃથ્વી પર વરસાદ તરીકે પડે છે!",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "નદીના પાણીને ગરમ કરી વરાળ કોણ બનાવે છે?",
          options: ["ચંદ્રમા", "સૂર્યદેવ", "પવન", "વૃક્ષો"],
          answerIndex: 1,
          explanation: "સૂર્યની તીવ્ર ગરમીથી પાણી ગરમ થઈને વરાળ બને છે."
        }
      ]
    },
    {
      id: 'photo',
      query: "પ્રકાશસંશ્લેષણ એટલે શું?",
      subject: "વિજ્ઞાન 🔬",
      avatarChar: "🤖 સ્વામી AI",
      avatarName: "સ્વામી AI (સ્માર્ટ દોસ્ત)",
      explanation: "પ્રકાશસંશ્લેષણ એટલે વનસ્પતિની રસોઈ બનાવવાની રીત! લીલા પાંદડા સૂર્યપ્રકાશ, જમીનમાંથી પાણી અને હવામાંથી કાર્બન ડાયોક્સાઈડ મેળવીને ખોરાક બનાવે છે અને આપણને શ્વાસ લેવા માટે ચોખ્ખો ઓક્સિજન આપે છે!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "વનસ્પતિ શ્વાસમાં કયો ગેસ લઈને આપણને ઓક્સિજન આપે છે?",
          options: ["કાર્બન ડાયોક્સાઈડ", "નાઇટ્રોજન", "ધૂળ", "હાઇડ્રોજન"],
          answerIndex: 0,
          explanation: "વનસ્પતિ હવામાંથી કાર્બન ડાયોક્સાઈડ શોષીને આપણને ઓક્સિજન આપે છે."
        }
      ]
    }
  ],
  mr: [],
  ta: [],
  te: []
};

const INITIAL_OFFLINE_RESOURCES: OfflineResource[] = [
  { id: 'pdf-science', title: 'Basic Science Level 1 (with Pictures)', subject: 'Science', size: '2.4 MB', category: 'pdf', downloaded: true },
  { id: 'aud-alphabet', title: 'English Alphabets and Phonics', subject: 'Languages', size: '4.1 MB', category: 'audio', downloaded: false },
  { id: 'vid-numbers', title: 'Counting 1 to 100 Mascot Song', subject: 'Mathematics', size: '9.8 MB', category: 'video', downloaded: false },
  { id: 'quiz-animals', title: 'Farming & Animal Life Interactive game', subject: 'General Knowledge', size: '1.2 MB', category: 'quiz', downloaded: true }
];

export default function DashboardView({ user, lang }: DashboardViewProps) {
  const t = TRANSLATIONS[lang];

  // Retrieve lessons based on language (fallback to English if empty)
  const currentLanguageLessons = SAMPLE_LESSONS[lang]?.length > 0 
    ? SAMPLE_LESSONS[lang] 
    : SAMPLE_LESSONS['en'];

  // Active Lesson States
  const [selectedLesson, setSelectedLesson] = useState<LessonQuery>(currentLanguageLessons[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  
  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [claimedMedals, setClaimedMedals] = useState<string[]>([]);

  // Local Offline Resources State
  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>(INITIAL_OFFLINE_RESOURCES);
  const [subtitleWordIndex, setSubtitleWordIndex] = useState(0);

  // Subtitle animator simulation during lesson speech
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setSubtitleWordIndex((prev) => (prev + 1) % selectedLesson.explanation.split(' ').length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo, selectedLesson]);

  const handleLessonSelect = (lesson: LessonQuery) => {
    setSelectedLesson(lesson);
    setIsPlayingVideo(false);
    setShowQuiz(false);
    setOtpResetQuiz();
  };

  const handleAskCustomQuery = (e: FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    // Mimic generating a custom interactive video response from the AI characters
    const querySlug = customQuery.toLowerCase();
    let matchesLesson = currentLanguageLessons.find(l => 
      querySlug.includes(l.id) || querySlug.includes(l.query.toLowerCase())
    );

    if (!matchesLesson) {
      // Create a dynamic on-the-fly interactive mock response matching their query!
      matchesLesson = {
        id: 'custom-' + Math.random().toString(36).substring(2, 5),
        query: customQuery,
        subject: "AI Generator ✨",
        avatarChar: "🤖 Swami AI",
        avatarName: "Swami AI (Mascot Tutor)",
        explanation: `Excellent curiosity! You asked about "${customQuery}". The AI generated character explains: Everything in nature is connected. We study these topics step by step to build super logic inside our brains! Try completing the special conceptual games that follow.`,
        videoThumbColor: "from-fuchsia-400 to-indigo-600",
        quiz: [
          {
            id: 'cq-1',
            question: `Which AI character is teaching you about "${customQuery}" today?`,
            options: ["Dadi AI", "Swami AI", "No one", "A scary computer"],
            answerIndex: 1,
            explanation: "Swami AI is your smart cartoon companion!"
          }
        ]
      };
    }

    setSelectedLesson(matchesLesson);
    setIsPlayingVideo(true);
    setCustomQuery('');
    setShowQuiz(false);
    setOtpResetQuiz();

    // Trigger Speech synthesis voice assist automatically to assist kids
    speakText(matchesLesson.explanation, lang);
  };

  const handlePlayVoiceResponse = () => {
    setIsPlayingVideo(true);
    speakText(selectedLesson.explanation, lang);
  };

  const handleStopVoiceResponse = () => {
    setIsPlayingVideo(false);
    stopSpeaking();
  };

  const setOtpResetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswerSubmit = (optionIdx: number) => {
    if (selectedQuizAnswer !== null) return; // Only submit once
    
    setSelectedQuizAnswer(optionIdx);
    const isCorrect = optionIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      // Play brief local reward voice
      speakText("Perfect! correct answer.", lang);
    } else {
      speakText("Don't worry, try again next time!", lang);
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedQuizAnswer(null);
    if (currentQuizIndex + 1 < selectedLesson.quiz.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (quizScore + 1 >= selectedLesson.quiz.length) {
        // Award badge
        setClaimedMedals((prev) => [...prev, selectedLesson.id]);
      }
    }
  };

  const toggleDownloadResource = (id: string) => {
    setOfflineResources(prev => prev.map(res => {
      if (res.id === id) {
        return { ...res, downloaded: !res.downloaded };
      }
      return res;
    }));
  };

  return (
    <div id="classroom-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      
      {/* Welcome Board */}
      <header className="bg-white rounded-[24px] p-4 sm:p-6 border border-[#F2CC8F]/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-left shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#E07A5F] font-mono font-bold bg-[#FAF8F4] border border-[#F2CC8F]/30 px-2.5 py-0.5 rounded-full uppercase">
            🟢 Active Classroom Room
          </div>
          <h1 className="font-display font-bold text-2xl text-[#3D405B] leading-tight tracking-tight">
            Namaste, {user.name}! 📚
          </h1>
          <p className="font-sans text-xs sm:text-sm text-gray-650">
            Default study language of your classroom is currently registered as:{' '}
            <span className="font-bold underline text-[#E07A5F] capitalize">
              {SUPPORTED_LANGUAGES.find(l => l.code === user.defaultLanguage)?.label}
            </span>
          </p>
        </div>

        {/* Dynamic score summary badges */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-white border border-yellow-200 shadow-2xs rounded-xl px-3.5 py-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500 animate-bounce" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">My Medals</div>
              <div className="text-sm font-black text-gray-950">
                {claimedMedals.length} / {currentLanguageLessons.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Lesson List & Offline Files */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Classroom Lessons Quick Deck */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-sm text-[#3D405B] uppercase tracking-widest text-left flex items-center gap-1.5">
              <Video className="h-4 w-4 text-[#81B29A]" />
              Interactive Lesson Hub
            </h3>

            <div className="space-y-2.5">
              {currentLanguageLessons.map((item) => (
                <button
                  key={item.id}
                  id={`lesson-selector-${item.id}`}
                  onClick={() => handleLessonSelect(item)}
                  className={`w-full p-3 rounded-xl border text-left transition-all hover:bg-[#FAF8F4] cursor-pointer flex items-center gap-3 ${
                    selectedLesson.id === item.id
                      ? 'border-[#81B29A] bg-[#81B29A]/10 ring-1 ring-[#81B29A]'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.videoThumbColor} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                    {item.avatarChar.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-gray-400 block uppercase">
                      {item.subject}
                    </span>
                    <span className="font-sans font-semibold text-xs sm:text-sm text-gray-900 block truncate">
                      {item.query}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* 2. Offline resource syncing logs (Demonstrates rural limits offline) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-sm text-[#3D405B] uppercase tracking-widest text-left flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4 text-[#E07A5F]" />
                Offline Files Sync
              </span>
              <span className="text-[10px] bg-[#FAF8F4] border border-[#F2CC8F]/40 text-[#8B6E32] font-mono px-2 py-0.5 rounded font-black uppercase shadow-xs border">
                2G Ready
              </span>
            </h3>

            <div className="space-y-2 text-left">
              {offlineResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-gray-50/60 rounded-xl border border-gray-150 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-mono font-bold text-[#E07A5F] block bg-[#E07A5F]/10 px-1.5 py-0.5 rounded-sm max-w-max uppercase tracking-wider">
                      {res.category} • {res.subject}
                    </span>
                    <h5 className="font-sans font-bold text-xs text-[#3D405B] truncate mt-1">
                      {res.title}
                    </h5>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
                      Size: {res.size}
                    </span>
                  </div>
                  <button
                    id={`download-toggle-${res.id}`}
                    onClick={() => toggleDownloadResource(res.id)}
                    className={`p-2 rounded-lg cursor-pointer ${
                      res.downloaded
                        ? 'bg-[#81B29A]/20 text-[#81B29A]'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                    title={res.downloaded ? "Delete local copy" : "Download local copy"}
                  >
                    {res.downloaded ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active AI Video Player & Gamified Quiz (Interactive game experience!) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Custom AI query input bar */}
          <form onSubmit={handleAskCustomQuery} className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-2xs flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#81B29A]" />
              <input
                type="text"
                id="custom-classroom-query"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ask me any science or math question... (e.g., How do birds fly?)"
                className="w-full pl-9 pr-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
              />
            </div>
            <button
              type="submit"
              id="submit-classroom-query"
              className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-5 rounded-xl text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-[#F2CC8F]" />
              <span>Ask AI</span>
            </button>
          </form>

          {/* 2. Visual active AI character video box */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
            
            {/* Player Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-3 px-4 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs font-mono font-bold tracking-widest text-gray-300 uppercase">
                  AI Video Character Tutoring Response
                </span>
              </div>
              <span className="text-[10px] bg-white/15 text-white/90 border border-white/20 font-mono px-2 py-0.5 rounded uppercase">
                {selectedLesson.avatarName}
              </span>
            </div>

            {/* Video Canvas Sandbox */}
            <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-900 flex flex-col justify-between p-6 overflow-hidden">
              {/* Background ambient animation bubbles */}
              <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-xl uppercase" />
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#FAF8F4]/10 blur-xl uppercase" />

              {/* Avatar Mascot Container */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                {isPlayingVideo ? (
                  /* Running/talking active face mockup */
                  <div className="relative space-y-2 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#E07A5F] to-[#C8644B] border-4 border-white shadow-lg flex items-center justify-center text-4xl animate-bounce duration-1000">
                      {selectedLesson.avatarChar.split(' ')[0]}
                    </div>
                    {/* Pulsing voice lines mapping */}
                    <div className="flex items-center justify-center space-x-1">
                      <span className="h-3 w-1 bg-[#E07A5F] rounded-lg animate-pulse" />
                      <span className="h-5 w-1 bg-[#E07A5F] rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="h-2 w-1 bg-[#E07A5F] rounded-lg animate-pulse" style={{ animationDelay: '0.4s' }} />
                      <span className="h-4 w-1 bg-[#E07A5F] rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }} />
                    </div>
                  </div>
                ) : (
                  /* Idle face / play button overlay */
                  <button
                    id="trigger-play-video-mascot"
                    onClick={handlePlayVoiceResponse}
                    className="w-20 h-20 bg-[#3D405B] hover:bg-[#2D2F44] border-4 border-[#F2CC8F]/30 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Play className="h-8 w-8 text-white fill-current ml-1" />
                  </button>
                )}

                <div className="text-white text-center">
                  <h4 className="font-display font-extrabold text-sm sm:text-base tracking-tight">
                    {selectedLesson.query}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isPlayingVideo ? "Currently reading the answer aloud..." : "Click to view AI video answer response"}
                  </p>
                </div>
              </div>

              {/* Live Caption/Subtitle Subtitle bar (Awesome helper mechanism!) */}
              <div className="w-full bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center relative">
                <div className="absolute right-2 top-2">
                  <SpeakButton text={selectedLesson.explanation} lang={lang} size="sm" className="bg-black/40 text-[#E07A5F] border-white/10" />
                </div>
                <div className="pr-8 text-center">
                  <p className="text-xs sm:text-sm font-sans font-medium text-white italic">
                    "{selectedLesson.explanation}"
                  </p>
                </div>
              </div>

            </div>

            {/* Video Controls Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                {isPlayingVideo ? (
                  <button
                    id="stop-lesson-speech"
                    onClick={handleStopVoiceResponse}
                    className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans font-bold cursor-pointer"
                  >
                    ⏹️ Stop Speaking
                  </button>
                ) : (
                  <button
                    id="start-lesson-speech"
                    onClick={handlePlayVoiceResponse}
                    className="px-4 py-2 bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 hover:bg-[#81B29A]/25 rounded-xl text-xs font-sans font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Volume2 className="h-4 w-4 text-[#81B29A]" />
                    <span>🔊 Listen Response</span>
                  </button>
                )}
              </div>

              {/* EXPLICIT REQUESTED COMPONENT: Take Quiz Button! */}
              <button
                id="classroom-take-quiz-btn"
                onClick={() => {
                  setShowQuiz(true);
                  setOtpResetQuiz();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-sans font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-103"
              >
                <HelpCircle className="h-4.5 w-4.5" />
                <span>📝 Take Lesson Quiz</span>
              </button>
            </div>

          </div>

          {/* 3. Sliding / expandable quiz box below response video */}
          {showQuiz && (
            <div id="active-lesson-quiz-drawer" className="bg-amber-50 rounded-3xl p-5 border border-amber-250 text-left space-y-4 animate-fade-in">
              
              {/* Quiz Header */}
              <div className="flex justify-between items-center border-b border-amber-205 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h4 className="font-display font-extrabold text-base text-amber-950">
                      Gamified Lesson Quiz
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">
                      Pass to unlock study medals
                    </span>
                  </div>
                </div>
                <button
                  id="close-quiz-panel"
                  onClick={() => setShowQuiz(false)}
                  className="p-1 px-2.5 rounded bg-white text-xs font-mono font-bold hover:bg-amber-100 text-amber-900 border border-amber-205 cursor-pointer"
                >
                  Close X
                </button>
              </div>

              {!quizFinished ? (
                /* Question screen */
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-amber-700">
                    Question {currentQuizIndex + 1} of {selectedLesson.quiz.length}
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-amber-150">
                    <h5 className="font-display font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {selectedLesson.quiz[currentQuizIndex].question}
                    </h5>
                  </div>

                  {/* Option stack */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    {selectedLesson.quiz[currentQuizIndex].options.map((opt, oIdx) => {
                      const isSelected = selectedQuizAnswer === oIdx;
                      const isCorrect = oIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
                      
                      let btnStyle = "bg-white border-gray-200 text-gray-800 hover:bg-amber-150/40";
                      if (selectedQuizAnswer !== null) {
                        if (isCorrect) {
                          btnStyle = "bg-[#81B29A]/20 text-[#3D405B] border-[#81B29A] font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-100 text-rose-800 border-rose-400 font-medium";
                        } else {
                          btnStyle = "bg-white/40 text-gray-400 border-gray-100 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          id={`quiz-option-${oIdx}`}
                          disabled={selectedQuizAnswer !== null}
                          onClick={() => handleAnswerSubmit(oIdx)}
                          className={`w-full p-3 text-left rounded-xl border text-xs sm:text-sm font-sans transition-all cursor-pointer ${btnStyle}`}
                        >
                          <span className="font-bold mr-2 font-mono">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation reveal */}
                  {selectedQuizAnswer !== null && (
                    <div className="p-3 bg-white border border-amber-100 rounded-xl space-y-2 animate-fade-in text-xs sm:text-sm">
                      <div className="font-black text-amber-900 flex items-center gap-1.5">
                        {selectedQuizAnswer === selectedLesson.quiz[currentQuizIndex].answerIndex ? (
                          <span className="text-[#81B29A]">🎉 Correct!</span>
                        ) : (
                          <span className="text-rose-600">🌱 Learning Spot:</span>
                        )}
                      </div>
                      <p className="text-gray-650 leading-snug">
                        {selectedLesson.quiz[currentQuizIndex].explanation}
                      </p>
                      
                      <button
                        type="button"
                        id="quiz-next-question-btn"
                        onClick={handleNextQuizQuestion}
                        className="mt-2 text-xs font-semibold px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                      >
                        Next Concept {currentQuizIndex + 1 < selectedLesson.quiz.length ? "➡️" : "🏁"}
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* Completion screen */
                <div className="text-center p-6 space-y-5">
                  <div className="text-5xl">🏆</div>
                  <div>
                    <h4 className="font-display font-bold text-[#3D405B] text-lg">
                      Lesson Completed!
                    </h4>
                    <p className="font-sans text-sm text-gray-650 mt-1">
                      You scored <span className="font-black text-[#81B29A]">{quizScore}</span> correct answers!
                    </p>
                  </div>

                  {quizScore === selectedLesson.quiz.length ? (
                    <div className="bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 p-3 rounded-2xl text-xs sm:text-sm font-sans font-bold flex items-center justify-center gap-2">
                      <Smile className="h-5 w-5 text-[#81B29A]" />
                      <span>Incredible! You earned the active lesson golden medal!</span>
                    </div>
                  ) : (
                    <div className="bg-amber-100 text-amber-800 p-3 rounded-2xl text-xs font-sans font-semibold">
                      Keep practicing to score 100% and earn medals!
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      id="quiz-retry-btn"
                      onClick={setOtpResetQuiz}
                      className="px-5 py-2 bg-white hover:bg-gray-50 text-[#3D405B] border border-gray-200 text-xs font-sans font-bold rounded-xl cursor-pointer"
                    >
                      Retry Quiz
                    </button>
                    <button
                      type="button"
                      id="quiz-leave-btn"
                      onClick={() => setShowQuiz(false)}
                      className="px-5 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-sans font-bold rounded-xl cursor-pointer"
                    >
                      Finish Lessons
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
