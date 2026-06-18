import { useState } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Compass, BookOpen, GraduationCap, ChevronRight, Sparkles, Smile, ArrowRight, Heart } from 'lucide-react';

interface CareerGuidanceTabProps {
  lang: LanguageCode;
}

const CAREERS = [
  {
    id: 'agri-sci',
    title: 'Agriculture Scientist 🌾',
    category: 'Rural Science & Farming',
    desc: 'Automates yield processes, protects cash crops, analyzes soil health, and creates organic fertilizers.',
    subjects: 'Biology, Chemistry, Modern Farming Tech',
    roadmap: 'Pass Class 10 -> Science Stream (PCB) -> Bachelors in Agricultural Science (B.Sc. Agri) -> Research Scientist.',
    scholarship: 'ICAR National Talent Scholarships (NTS), India Agri-Research Fellowship.'
  },
  {
    id: 'renew-tech',
    title: 'Solar & Renewable Grid Engineer ☀️',
    category: 'Engineering & Green Power',
    desc: 'Sets up localized solar panel mini-grids and wind setups to provide continuous electricity to rural villages.',
    subjects: 'Physics, Mathematics, Electrical Circuits',
    roadmap: 'Pass Class 10 -> Vocational ITI Diploma or Science Stream (PCM) -> B.Tech in Power Engineering.',
    scholarship: 'PRERANA Rural Engineering Scholarships, National Solar Mission training aids.'
  },
  {
    id: 'vet-doc',
    title: 'Community Veterinary Doctor 🩺',
    category: 'Livestock Care & Healthcare',
    desc: 'Keeps livestock, dairy cattle, poultry, and farming companions clean, vaccinated, and healthy.',
    subjects: 'Animal Physiology, Biology, Veterinary Medicines',
    roadmap: 'Pass Class 10 -> Biology Stream (PCB) -> Bachelor of Veterinary Science (B.V.Sc & AH) -> Registered Veterinary Doctor.',
    scholarship: 'VCI Merit Scholarships, Indian Animal Welfare Research Assistances.'
  },
  {
    id: 'cyber-code',
    title: 'Software Developer & Cyber Security 💻',
    category: 'Information Technology',
    desc: 'Codes localized mobile utility applications, manages cloud storage architectures securely, and guides cyber security.',
    subjects: 'Computer science, Algebra, English literacy',
    roadmap: 'Pass Class 10 -> PCM stream or Polytechnic CS -> Bachelor in Computer Applications (BCA) or B.Tech CS.',
    scholarship: 'PM Narendra Modi Scholarship Scheme for Technical streams, AICTE rural coder awards.'
  },
  {
    id: 'gov-teacher',
    title: 'Civil Servant or Educator 🏛️',
    category: 'Administration & Education',
    desc: 'Guides local administration, manages rural welfare schemes, or teaches primary and secondary schools.',
    subjects: 'Civics, History, Language Literature, Pedagogy',
    roadmap: 'Pass Class 10 -> Arts/Science stream -> Bachelor Degree (BA/B.Sc) -> Clear UPSC/State Civil exams or B.Ed.',
    scholarship: 'National Fellowship Schemes, State Welfare training grant vouchers.'
  }
];

export default function CareerGuidanceTab({ lang }: CareerGuidanceTabProps) {
  const [selectedCareer, setSelectedCareer] = useState<typeof CAREERS[0] | null>(null);

  // Matchmaker Questionnaire states
  const [inQuiz, setInQuiz] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [resultCareer, setResultCareer] = useState<typeof CAREERS[0] | null>(null);

  const startQuiz = () => {
    setInQuiz(true);
    setStep(1);
    setAnswers({});
    setResultCareer(null);
    speakText("Welcome! Answer three simple questions, and I will matching your career pathway!", lang, "Swami AI", "🤖 Swami AI");
  };

  const handleSelectAnswer = (ansKey: string) => {
    const updated = { ...answers, [step]: ansKey };
    setAnswers(updated);

    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      // Evaluate result career
      const likesField = updated[1] === 'fields';
      const favSub = updated[2];
      
      let matched = CAREERS[0]; // Default Agriculture
      
      if (likesField) {
        if (favSub === 'science') matched = CAREERS[0]; // Agri Scientist
        else if (favSub === 'math') matched = CAREERS[1]; // Renewable Eng
        else matched = CAREERS[2]; // Vet Doctor
      } else {
        if (favSub === 'math' || favSub === 'science') matched = CAREERS[3]; // Software Coder
        else matched = CAREERS[4]; // Civil Servant/Teacher
      }

      setResultCareer(matched);
      setInQuiz(false);
      speakText(`Evaluation complete! Your natural interests point beautifully to: ${matched.title}. Read the detail roadmap!`, lang, "Swami AI", "🤖 Swami AI");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-lg text-[#3D405B] flex items-center gap-1.5">
            <Compass className="h-5.5 w-5.5 text-amber-500" />
            Rural Career Companion & Mentor
          </h2>
          <p className="text-xs text-gray-400">Discover sustainable, highly paid professions, scholarship systems, and custom study timelines.</p>
        </div>

        <button
          onClick={startQuiz}
          className="bg-gradient-to-tr from-[#3D405B] to-[#E07A5F] hover:opacity-90 active:scale-95 text-white p-3 py-2 px-4 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
        >
          <Sparkles className="h-4 w-4 text-[#F2CC8F] animate-spin" />
          <span>Discover Matchmaker ➡️</span>
        </button>
      </div>

      {inQuiz ? (
        /* INTERACTIVE CAREER MATCHING GAME */
        <div className="bg-white rounded-3xl border border-[#F2CC8F]/30 p-6 text-left max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <h4 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              Syllabus Interests Matching Game
            </h4>
            <button 
              onClick={() => { stopSpeaking(); setInQuiz(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 font-mono"
            >
              Cancel X
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-amber-700">
            Quest Checklist: Step {step} of 3
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                "Where do you naturally love spending your holidays or free hours?"
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleSelectAnswer('fields')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                >
                  <span>Outside checking green fields, crops, or caring livestock cows 🌾</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all" />
                </button>
                <button
                  onClick={() => handleSelectAnswer('desk')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                >
                  <span>At a table reading books, drawing, or exploring on cell phones 💻</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                "Which subject do you score highest in or study with absolute excitement?"
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'science', label: 'Ecology & Biology 🔬' },
                  { key: 'math', label: 'Speed Mathematics 📐' },
                  { key: 'lang', label: 'Languages & Stories 🗣️' },
                  { key: 'art', label: 'Logic & GK Brain Puzzles 🧠' }
                ].map(sub => (
                  <button
                    key={sub.key}
                    onClick={() => handleSelectAnswer(sub.key)}
                    className="p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                  >
                    <span>{sub.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                "If you could have one superpower, which would you pick to help your hometown?"
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleSelectAnswer('heal')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>Caring, curing, or healing sick animals and crops 🩺</span>
                </button>
                <button
                  onClick={() => handleSelectAnswer('build')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>Erecting solar energy grids or coding modern phone software 💻</span>
                </button>
                <button
                  onClick={() => handleSelectAnswer('leader')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>Teaching children or administering village welfare councils 🏛️</span>
                </button>
              </div>
            </div>
          )}

        </div>
      ) : resultCareer !== null ? (
        /* MATCH RESUL DECK */
        <div className="bg-emerald-50 rounded-3xl border border-emerald-350 p-6 text-left max-w-xl mx-auto space-y-4 animate-fade-in">
          <div className="text-center space-y-1 pb-2 border-b border-emerald-200">
            <span className="text-4xl">🌟</span>
            <h4 className="font-display font-extrabold text-[#3D405B] text-base">Your Recommended Career Profile</h4>
            <h3 className="font-display font-black text-emerald-800 text-lg sm:text-xl pt-1">
              {resultCareer.title}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">Role Description</span>
              <p className="text-gray-700 leading-normal font-sans font-medium">{resultCareer.desc}</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">Study Pathway Milestones</span>
              <p className="text-[#3D405B] font-bold leading-normal">{resultCareer.roadmap}</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">Recommended Indian Scholarships</span>
              <p className="text-amber-800 font-semibold italic">{resultCareer.scholarship}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-3">
            <button
              onClick={startQuiz}
              className="px-4 py-1.5 bg-white border border-emerald-300 text-[#3D405B] hover:bg-emerald-100 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all"
            >
              Replay Matchmaker
            </button>
            <button
              onClick={() => { stopSpeaking(); setResultCareer(null); }}
              className="px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-all"
            >
              Browse All Paths
            </button>
          </div>
        </div>
      ) : (
        /* MAIN CAREERS DIRECTORY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* List panel (Left) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-3">
            <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Browse Professional Streams
            </h3>
            <div className="space-y-2">
              {CAREERS.map(car => (
                <button
                  key={car.id}
                  onClick={() => setSelectedCareer(car)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedCareer?.id === car.id
                      ? 'border-[#81B29A] bg-[#81B29A]/15 font-bold text-gray-900 ring-1 ring-[#81B29A]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-sans font-bold">{car.title}</h4>
                    <p className="text-[10px] text-gray-400 font-sans font-medium leading-none mt-1">{car.category}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedCareer?.id === car.id ? 'translate-x-1 text-[#81B29A]' : 'text-gray-350'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Details canvas panel (Right) */}
          <div className="lg:col-span-7">
            {selectedCareer ? (
              <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs space-y-5 animate-fade-in">
                
                <div className="border-b border-gray-100 pb-3 space-y-1">
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 rounded p-1 px-1.5 uppercase max-w-max block">
                    {selectedCareer.category}
                  </span>
                  <h3 className="font-display font-extrabold text-[#3D405B] text-base pt-1">
                    {selectedCareer.title}
                  </h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">Role & Scope</span>
                    <p className="text-gray-650 font-sans font-medium">{selectedCareer.desc}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">Recommended subjects</span>
                    <p className="text-gray-800 font-semibold">{selectedCareer.subjects}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">Academic Roadmap (Grades)</span>
                    <div className="p-3 bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-xl font-bold text-[#E07A5F] flex items-start gap-1.5 shadow-3xs text-xs">
                      <GraduationCap className="h-4.5 w-4.5 text-[#E07A5F] shrink-0 mt-0.5" />
                      <span>{selectedCareer.roadmap}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">Scholarships In India</span>
                    <p className="text-emerald-700 font-extrabold bg-emerald-50 max-w-max p-1 px-2.5 rounded-sm border border-emerald-200">
                      {selectedCareer.scholarship}
                    </p>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center h-full flex flex-col justify-center items-center text-gray-400 space-y-2">
                <Compass className="h-10 w-10 text-gray-300 animate-spin" style={{ animationDuration: '6s' }} />
                <p className="font-sans text-xs font-semibold">Select a Career pathway from the list on the left to review its scholarship structure and academics roadmap.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
