import { useState } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Award, HelpCircle, BookOpen, Brain, Sparkles, AlertTriangle, CheckCircle, Flame, RefreshCw } from 'lucide-react';

interface QuizTabProps {
  lang: LanguageCode;
}

interface CustomQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const GENERAL_QUIZZES = [
  {
    id: 'sci-env',
    title: 'Earth & Environment Quiz 🌍',
    subject: 'Science',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which of the following is essential for standard plant growth?",
        options: ["Cold Soda", "Salt Water", "Sunlight & Water", "White Paint"],
        answerIndex: 2,
        explanation: "Plants require light from the sun, water from the soil, and minerals to photosynthesize and grow robustly!"
      },
      {
        question: "What is gaseous atmosphere layer around the Earth called?",
        options: ["Atmosphere", "Lithosphere", "Water tank", "Glass cover"],
        answerIndex: 0,
        explanation: "The atmosphere is the envelope of gases surrounding the earth, keeping it warm and breathable!"
      }
    ]
  },
  {
    id: 'math-brain',
    title: 'Speed Multiplication Puzzles 📐',
    subject: 'Mathematics',
    difficulty: 'Medium',
    questions: [
      {
        question: "If a farmer plants 4 rows of maize, and each row has 9 plants, how many plants are there in total?",
        options: ["13 plants", "36 plants", "40 plants", "32 plants"],
        answerIndex: 1,
        explanation: "Multiplying 4 times 9 (4 x 9) yields exactly 36. This is fast multiplication!"
      },
      {
        question: "Solve: (7 x 3) + 5",
        options: ["26", "21", "15", "30"],
        answerIndex: 0,
        explanation: "7 times 3 equals 21. Adding 5 yields 26!"
      }
    ]
  },
  {
    id: 'lang-spell',
    title: 'Spelling Bees & Homophones 🗣️',
    subject: 'Languages',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which word means 'correct' and is also the opposite of 'left'?",
        options: ["Write", "Rite", "Right", "Writ"],
        answerIndex: 2,
        explanation: "'Right' is spelled R-I-G-H-T and denotes correctness or directions!"
      },
      {
        question: "Complete the spelling: AC_C_DE_T (unplanned event)",
        options: ["O, I, N", "C, I, N", "C, I, T", "K, I, D"],
        answerIndex: 1,
        explanation: "The correct word is ACCIDENT: A-C-C-I-D-E-N-T."
      }
    ]
  },
  {
    id: 'gk-animals',
    title: 'Wonderful Animal Kingdom 🦁',
    subject: 'General Knowledge',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which mammal is famous for having a long trunk and big ears?",
        options: ["Kangaroo", "Lion", "Giraffe", "Elephant"],
        answerIndex: 3,
        explanation: "Elephants use their long trunk for drinking, smelling, bathing, and picking food!"
      }
    ]
  }
];

export default function QuizTab({ lang }: QuizTabProps) {
  // Global cumulative states
  const [totalQuizPoints, setTotalQuizPoints] = useState(() => {
    return Number(localStorage.getItem('quizzes_total_points')) || 40;
  });

  // Current active quiz states
  const [activeQuiz, setActiveQuiz] = useState<typeof GENERAL_QUIZZES[0] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [roundMinsScore, setRoundMinsScore] = useState(0);
  const [roundFinished, setRoundFinished] = useState(false);

  // Creative "Quiz Generator" states
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const startQuizDeck = (quiz: typeof GENERAL_QUIZZES[0]) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedOpt(null);
    setRoundMinsScore(0);
    setRoundFinished(false);
  };

  const handleOptSelect = (optIdx: number) => {
    if (selectedOpt !== null || !activeQuiz) return;
    
    setSelectedOpt(optIdx);
    const isCorrect = optIdx === activeQuiz.questions[currentQuestionIndex].answerIndex;
    
    // Play voice feedback based on selection
    if (isCorrect) {
      setRoundMinsScore(prev => prev + 1);
      speakText("Wonderful! You hit the correct answer.", lang, "Swami AI", "🤖 Swami AI");
    } else {
      speakText("Nice try! Read the explanation below to learn.", lang, "Swami AI", "🤖 Swami AI");
    }
  };

  const handleNextQ = () => {
    setSelectedOpt(null);
    if (!activeQuiz) return;

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setRoundFinished(true);
      // Update global quiz points: +15 points for passing!
      const pointsGain = roundMinsScore * 10 + (roundMinsScore === activeQuiz.questions.length ? 15 : 0);
      const updatedPoints = totalQuizPoints + pointsGain;
      setTotalQuizPoints(updatedPoints);
      localStorage.setItem('quizzes_total_points', String(updatedPoints));
    }
  };

  const handleGenerateCustomQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setIsGeneratingCustom(true);
    speakText(`Assembling quiz questions on ${customTopic}...`, lang, "Swami AI", "🤖 Swami AI");

    setTimeout(() => {
      // Assemble standard custom schema matching their topic!
      const capitalizedTopic = customTopic.charAt(0).toUpperCase() + customTopic.slice(1);
      
      const customQuiz = {
        id: 'cust-' + Math.random().toString(36).substring(2, 5),
        title: `${capitalizedTopic} Genius Pack 🧠`,
        subject: 'Custom AI Science',
        difficulty: 'Medium',
        questions: [
          {
            question: `Which basic school concept best relates to understanding "${capitalizedTopic}"?`,
            options: ["Logical science observation", "Throwing stones", "Sleeping early", "Ignoring lessons"],
            answerIndex: 0,
            explanation: `Understanding ${capitalizedTopic} is rooted in systematic scientific inquiry, step-by-step observation, and logic!`
          },
          {
            question: `Which factor is most likely to change or affect "${capitalizedTopic}"?`,
            options: ["The date on calendar", "Controlled research & core heat factors", "The color of study books", "Loud stadium music"],
            answerIndex: 1,
            explanation: "In science and research, temperature shifts and controlled logical testing are paramount to determining outcomes."
          },
          {
            question: `Identify true statement regarding "${capitalizedTopic}":`,
            options: ["It can be studied with cartoon guides", "It's a military secret", "It was invented this week", "It is illegal to learn"],
            answerIndex: 0,
            explanation: "India's rural curriculums encourage students to read interactive tutorials to digest complex modern concepts!"
          }
        ]
      };

      setIsGeneratingCustom(false);
      setActiveQuiz(customQuiz);
      setCurrentQuestionIndex(0);
      setSelectedOpt(null);
      setRoundMinsScore(0);
      setRoundFinished(false);
      setCustomTopic('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. QUIZ HIGHLIGHTS HEADER PANEL */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-lg text-[#3D405B] flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-500 animate-pulse" />
            Interactive Testing Hall
          </h2>
          <p className="text-xs text-gray-400">Play standard school challenges or draft Custom AI Games about raw topics!</p>
        </div>

        <div className="bg-gradient-to-tr from-[#3D405B] to-[#4D506F] text-white rounded-2xl p-3 px-4 flex items-center gap-3 shrink-0 shadow-2xs">
          <Award className="h-6 w-6 text-amber-300 animate-bounce" />
          <div className="font-mono">
            <div className="text-[9px] text-[#F2CC8F] font-black uppercase tracking-wider">Cumulative Quiz Score</div>
            <div className="text-base font-bold">{totalQuizPoints} points cumulative</div>
          </div>
        </div>
      </div>

      {activeQuiz === null ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* STATIC SUBJECT DECKS (Left) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-display font-extrabold text-xs text-gray-500 uppercase tracking-widest text-left">
              Standard Subjects Challenges
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GENERAL_QUIZZES.map((quiz) => (
                <div 
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-gray-150 p-4 shadow-3xs flex flex-col justify-between hover:border-[#81B29A] hover:shadow-2xs transition-all text-left group"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
                      <span className="p-1 px-2 rounded-sm bg-gray-100 text-gray-650">{quiz.subject}</span>
                      <span className="text-[#E07A5F]">{quiz.difficulty}</span>
                    </div>
                    <h4 className="font-display font-extrabold text-sm text-[#3D405B] group-hover:text-[#E07A5F] transition-colors leading-snug">
                      {quiz.title}
                    </h4>
                    <p className="text-[11px] text-gray-450 pr-4">
                      {quiz.questions.length} question concept checkpoints
                    </p>
                  </div>
                  
                  <button
                    onClick={() => startQuizDeck(quiz)}
                    className="w-full mt-4 py-2 bg-[#FAF8F4] border border-[#F2CC8F]/50 group-hover:bg-[#E07A5F] group-hover:text-white group-hover:border-transparent rounded-xl text-xs font-sans font-bold text-[#3D405B] text-center transition-all cursor-pointer"
                  >
                    Start Game 🎬
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI QUIZ GENERATOR BLOCK (Right) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <h3 className="font-display font-extrabold text-xs text-gray-500 uppercase tracking-widest">
              AI Quiz Synthesizer
            </h3>

            <div className="bg-white rounded-2xl border border-[#F2CC8F]/30 p-5 shadow-3xs space-y-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-xs text-gray-900 flex items-center gap-1.5 uppercase">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Custom Quiz Generator
                </h4>
                <p className="text-[10px] text-gray-400">Type any chapter topic (e.g. Birds, Crops, Fractions) and play a custom game.</p>
              </div>

              <form onSubmit={handleGenerateCustomQuiz} className="space-y-3">
                <input
                  type="text"
                  value={customTopic}
                  disabled={isGeneratingCustom}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Village farming or Magnetism"
                  className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
                />
                
                <button
                  type="submit"
                  disabled={!customTopic.trim() || isGeneratingCustom}
                  className="w-full py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-sans font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingCustom ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      <span>Writing custom questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5 text-[#F2CC8F]" />
                      <span>Assemble AI game</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      ) : (
        /* ACTIVE QUIZ VIEWPORT */
        <div className="bg-white rounded-3xl border border-gray-200 p-6 text-left max-w-2xl mx-auto space-y-5 shadow-sm">
          
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-2 text-[10px] bg-amber-50 text-amber-800 rounded-sm font-bold uppercase">
                {activeQuiz.title}
              </span>
            </div>
            
            <button
              onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
              className="text-xs bg-gray-100 px-3 py-1 hover:bg-gray-200 rounded-lg font-bold font-sans cursor-pointer text-gray-500"
            >
              Exit X
            </button>
          </div>

          {!roundFinished ? (
            <div className="space-y-5">
              
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>PROGRESS: Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span className="font-bold text-[#E07A5F]">Current accuracy: {roundMinsScore}/{currentQuestionIndex}</span>
              </div>

              {/* Question Screen */}
              <div className="p-5 bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-2xl">
                <span className="text-[10px] uppercase font-mono font-bold block text-gray-400 mb-1">Standard Concept Probe</span>
                <h4 className="font-display font-extrabold text-[#3D405B] text-sm sm:text-base leading-snug">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h4>
              </div>

              {/* Options array */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedOpt === oIdx;
                  const isCorrect = oIdx === activeQuiz.questions[currentQuestionIndex].answerIndex;
                  
                  let optStyle = "bg-white border-gray-200 text-gray-800 hover:bg-gray-50";
                  if (selectedOpt !== null) {
                    if (isCorrect) {
                      optStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                    } else if (isSelected) {
                      optStyle = "bg-rose-50 text-rose-800 border-rose-300 font-medium";
                    } else {
                      optStyle = "bg-white/40 text-gray-400 border-gray-100 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={selectedOpt !== null}
                      onClick={() => handleOptSelect(optIdx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-sans cursor-pointer transition-all ${optStyle}`}
                    >
                      <span className="font-mono font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanations reveals */}
              {selectedOpt !== null && (
                <div className="p-4 bg-amber-50/50 border border-amber-250 rounded-2xl space-y-2 animate-fade-in text-xs sm:text-sm">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase font-mono">
                    {selectedOpt === activeQuiz.questions[currentQuestionIndex].answerIndex ? (
                      <span className="text-emerald-700">🎉 Bravo! Correct</span>
                    ) : (
                      <span className="text-rose-600">🌱 Study Point explanation</span>
                    )}
                  </div>
                  <p className="text-gray-650 leading-relaxed text-xs">
                    {activeQuiz.questions[currentQuestionIndex].explanation}
                  </p>

                  <button
                    onClick={handleNextQ}
                    className="mt-2.5 text-xs font-bold px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                  >
                    Next Question {currentQuestionIndex + 1 < activeQuiz.questions.length ? "➡️" : "🏁完成"}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* CONGRATULATIONS PANEL */
            <div className="text-center p-6 space-y-4">
              <div className="text-5xl animate-bounce">🏆</div>
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-lg text-[#3D405B]">Challenge Complete!</h4>
                <p className="text-xs text-gray-500">
                  You scored <span className="font-bold text-emerald-600">{roundMinsScore} correct</span> answers out of {activeQuiz.questions.length} questions.
                </p>
              </div>

              <div className="bg-[#81B29A]/15 border border-[#81B29A]/20 text-gray-800 p-4 rounded-xl text-left text-xs space-y-2 max-w-sm mx-auto">
                <h5 className="font-bold flex items-center gap-1 text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Score payout rewards:
                </h5>
                <ul className="list-disc pl-5 font-mono text-[10px] text-gray-500 space-y-1 font-bold">
                  <li>Points gained: +{roundMinsScore * 10} points</li>
                  {roundMinsScore === activeQuiz.questions.length && (
                    <li className="text-amber-600">Streak clean sheet sweep bonus: +15 points!</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => startQuizDeck(activeQuiz)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#3D405B] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Retry Game
                </button>
                <button
                  onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
                  className="px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
