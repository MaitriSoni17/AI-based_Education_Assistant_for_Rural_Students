import { useState, useEffect } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Award, Clock, HelpCircle, ArrowRight, CheckCircle2, Lock, Sparkles, BookOpen } from 'lucide-react';

interface ExamPrepTabProps {
  lang: LanguageCode;
}

const EXAM_TRACKS = [
  {
    id: 'nmms',
    title: 'NMMS Academic Scholarship 🏆',
    description: 'National Means-cum-Merit Scholarship Exam (Class 8 Candidates)',
    type: 'Mental Ability & SAT Prep',
    questions: [
      {
        question: "Find the missing number in the logic pattern: 3, 7, 15, 31, __?",
        options: ["45", "63", "55", "60"],
        answerIndex: 1,
        explanation: "Each successor multiplies by 2 and adds 1: (3 x 2)+1=7; (7 x 2)+1=15; (15 x 2)+1=31. Hence, (31 x 2)+1 = 63. This is standard mental ability (MAT) series!"
      },
      {
        question: "If 'TIGER' is coded as 'SZHDQ' in secret code, how is 'APPLE' coded?",
        options: ["BQQMF", "ZOOKD", "ZOKKD", "BOPLD"],
        answerIndex: 1,
        explanation: "Each letter shifts back by exactly one alphabetical position: T->S, I->Z (in cyclic order or standard reverse keys). Shifting back: A->Z, P->O, P->O, L->K, E->D. Hence, ZOOKD!"
      }
    ]
  },
  {
    id: 'jnvst',
    title: 'JNVST Navodaya Selection Test 🏫',
    description: 'Jawahar Navodaya Vidyalaya Selection entrance exam',
    type: 'Math & Odd-Man-Out Visual puzzles',
    questions: [
      {
        question: "Select the odd compound out of the group: Oxygen, Carbon dioxide, Wood, Nitrogen.",
        options: ["Oxygen", "Carbon dioxide", "Wood", "Nitrogen"],
        answerIndex: 2,
        explanation: "Oxygen, Carbon dioxide, and Nitrogen are ambient scientific gases. Wood is a solid organic cellulose structure. Hence, Wood is the odd compound!"
      },
      {
        question: "Calculate the highest common divisor (HCF) of 12 and 18:",
        options: ["2", "3", "6", "12"],
        answerIndex: 2,
        explanation: "Dividing factors of 12 are {1,2,3,4,6,12} and of 18 are {1,2,3,6,9,18}. The greatest shared factor is 6!"
      }
    ]
  }
];

export default function ExamPrepTab({ lang }: ExamPrepTabProps) {
  const [activeTrack, setActiveTrack] = useState<typeof EXAM_TRACKS[0] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Solvers timer countdown states
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerSeconds, timerActive]);

  const startTrack = (track: typeof EXAM_TRACKS[0]) => {
    setActiveTrack(track);
    setQIndex(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
    setTimerSeconds(75); // 75 seconds per paper solver block
    setTimerActive(true);
  };

  const handleSelectAnswerIndex = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    
    const isCorrect = idx === activeTrack?.questions[qIndex].answerIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      speakText("Aha! Exceptional mental logic. Perfect response!", lang, "Swami AI", "🤖 Swami AI");
    } else {
      speakText("Check the solved secret step-by-step trick diagram below!", lang, "Swami AI", "🤖 Swami AI");
    }
  };

  const handleNextQuestion = () => {
    setSelectedOpt(null);
    if (!activeTrack) return;

    if (qIndex + 1 < activeTrack.questions.length) {
      setQIndex(prev => prev + 1);
      setTimerSeconds(75); // Reset timer for next question
    } else {
      setIsFinished(true);
      setTimerActive(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER RIBBON */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-lg text-[#3D405B] flex items-center gap-1.5">
            <Award className="h-5.5 w-5.5 text-amber-500" />
            Competitive Exams Preparation Suite
          </h2>
          <p className="text-xs text-gray-400">Master NMMS Scholastic Scholarship challenges and JNVST model exams with time drills!</p>
        </div>
        
        <div className="flex gap-2">
          <span className="text-[10px] bg-[#81B29A]/10 text-emerald-800 px-3 py-1.5 border border-[#81B29A]/30 rounded-full font-mono uppercase tracking-wide font-extrabold">
            Scholarship Syllabus 2026
          </span>
        </div>
      </div>

      {activeTrack === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          
          {EXAM_TRACKS.map(track => (
            <div 
              key={track.id}
              className="bg-white p-5 rounded-2xl border border-gray-150 hover:border-[#81B29A] transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-1 px-2.5 rounded uppercase">
                  {track.type}
                </span>
                <h3 className="font-display font-bold text-[#3D405B] text-base pt-1">
                  {track.title}
                </h3>
                <p className="text-xs text-gray-500 leading-normal">
                  {track.description}
                </p>
              </div>

              <button
                onClick={() => startTrack(track)}
                className="w-full mt-5 py-2.5 bg-[#FAF8F4] border border-[#F2CC8F]/50 hover:bg-[#81B29A] hover:text-white hover:border-transparent text-xs font-sans font-bold text-[#3D405B] rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Launch Mock Questions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Locked future exam tracks */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-dashed border-gray-200 opacity-65 flex flex-col justify-between items-start">
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-bold text-gray-400 bg-gray-100 p-1 px-2 rounded uppercase flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked
              </span>
              <h3 className="font-display font-bold text-gray-400 text-sm">
                NTSE State Talent Search Puzzles
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Advanced mental logic & General Olympiad subjects (Syllabus updates pending board release).
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* SOLVER PLATFORM */
        <div className="bg-white rounded-3xl border border-gray-200 p-6 text-left max-w-2xl mx-auto space-y-6 shadow-sm">
          
          {/* Header Panel info */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <span className="text-[9px] font-mono bg-blue-50 text-blue-700 p-1 px-1.5 rounded uppercase font-bold">
                {activeTrack.title}
              </span>
              <h4 className="text-xs text-gray-400 mt-1">Solving Question {qIndex + 1}/{activeTrack.questions.length}</h4>
            </div>

            {/* Countdown Widget */}
            {timerActive && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 px-3 text-rose-700 font-mono font-black text-xs flex items-center gap-1.5 shadow-3xs animate-pulse">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Timer: {timerSeconds}s</span>
              </div>
            )}
          </div>

          {!isFinished ? (
            <div className="space-y-5 animate-fade-in">
              
              {/* Question card */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl relative overflow-hidden">
                <div className="absolute -right-3 -top-3 text-8xl text-white/5 font-black pointer-events-none select-none">MAT</div>
                <span className="text-[9px] font-mono text-[#F2CC8F] bg-[#F2CC8F]/15 p-1 px-2 rounded font-black max-w-max uppercase tracking-wider block mb-2">
                  Interactive Practice Card
                </span>
                <p className="font-display font-bold text-sm sm:text-base leading-relaxed">
                  {activeTrack.questions[qIndex].question}
                </p>
              </div>

              {/* Options Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTrack.questions[qIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedOpt === oIdx;
                  const isCorrect = oIdx === activeTrack.questions[qIndex].answerIndex;
                  
                  let btnStyle = "bg-white border-gray-250 text-gray-850 hover:bg-gray-50";
                  if (selectedOpt !== null) {
                    if (isCorrect) {
                      btnStyle = "bg-[#81B29A]/15 border-[#81B29A] text-emerald-800 font-bold";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-50 border-rose-300 text-rose-800 font-semibold";
                    } else {
                      btnStyle = "bg-white/40 text-gray-350 border-gray-100 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={selectedOpt !== null}
                      onClick={() => handleSelectAnswerIndex(oIdx)}
                      className={`p-3 text-left border rounded-xl font-sans text-xs sm:text-sm cursor-pointer transition-all ${btnStyle}`}
                    >
                      <span className="font-mono font-black mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </button>
                  );
                })}
              </div>

              {/* Solved logic outline card */}
              {selectedOpt !== null && (
                <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl space-y-2.5 animate-fade-in text-xs sm:text-sm">
                  <div className="font-black text-rose-950 flex items-center gap-1.5 text-xs font-mono uppercase">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Swami AI Solved Strategy Explainer:
                  </div>
                  <p className="text-gray-700 leading-relaxed text-xs">
                    {activeTrack.questions[qIndex].explanation}
                  </p>

                  <button
                    onClick={handleNextQuestion}
                    className="mt-2 text-xs font-bold px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <span>Proceed Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* CONGRATS ON COMPLETING PAPER */
            <div className="text-center p-6 space-y-4">
              <div className="text-4xl">🎓</div>
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-[#3D405B] text-base">Paper Exercises Complete</h4>
                <p className="text-xs text-gray-500">
                  Scholastic quiz record: <span className="font-black text-emerald-600">{score}/{activeTrack.questions.length} solved</span>
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-250 text-left text-xs max-w-sm mx-auto space-y-1 font-sans text-emerald-950">
                <p className="font-black flex items-center gap-1 shadow-3xs"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 animate-bounce" /> Academic diagnostic feed:</p>
                <p className="leading-relaxed text-[11px] text-emerald-900 pt-1">
                  You resolved logical puzzles exceptionally! Regular practice increases spatial logic and boosts scholarship success rate. Complete the other subjects.
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => startTrack(activeTrack)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#3D405B] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Retry Paper
                </button>
                <button
                  onClick={() => { stopSpeaking(); setActiveTrack(null); }}
                  className="px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Other Exam Syllabus
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
