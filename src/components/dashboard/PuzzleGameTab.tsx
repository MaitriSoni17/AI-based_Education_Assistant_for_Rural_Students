import { useState, useEffect, useMemo } from 'react';
import { User, LanguageCode } from '../../types';
import { speakText } from '../../utils/speech';
import { 
  Puzzle, Sparkles, Award, ArrowRight, RotateCcw, CheckCircle2, 
  XCircle, Lightbulb, BookOpen, Brain, Trophy, ChevronRight, Check, Volume2, GraduationCap, Timer, BarChart3, Target, Zap
} from 'lucide-react';

interface PuzzleGameTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

type PuzzleStep = 
  | 'group-hub' 
  | 'select-class' 
  | 'select-subject' 
  | 'select-topic' 
  | 'select-type' 
  | 'select-difficulty' 
  | 'generating' 
  | 'solving' 
  | 'feedback' 
  | 'final-score'
  | 'daily-challenge-intro'
  | 'daily-challenge-solving'
  | 'daily-challenge-result';

interface PuzzleData {
  id: string;
  question: string;
  puzzleType: string;
  options?: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  groupIdentified: string;
  difficulty: string;
}

export default function PuzzleGameTab({ user, lang, onUpdateUser }: PuzzleGameTabProps) {
  const PUZZLE_TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
    en: {
      bannerSubtitle: "MY CLASS CHANNELS • AI PUZZLE ARENA",
      bannerTitle: "Adaptive AI Puzzle & Game Channel",
      bannerDesc: "Automatic Class & Group Identification active. Solve age-appropriate curriculum puzzles, earn XP points, and update your AI learning profile.",
      currentXp: "Current XP Balance",
      systemGroup: "System Identified Group",
      classLabel: "Class",
      dailyChallenge: "Today's AI Learning Challenge",
      dailyChallengeDesc: "“Your AI-generated daily challenge based on your learning progress, weak topics, and curriculum.”",
      startChallenge: "Start Challenge",
      puzzlesSolved: "Puzzles Solved",
      accuracy: "Accuracy",
      pointsEarned: "Points Earned",
      currentStreak: "Current Streak",
      subjectProficiency: "Subject Proficiency Breakdown",
      strongTopics: "Strong Topics",
      topicsToImprove: "Topics to Improve",
      selectSubject: "Select Subject for",
      backToHub: "Back to Puzzle Hub",
      selectTopic: "Select Topic",
      backToSubjects: "Back to Subjects",
      selectDifficulty: "Select Difficulty & Generate Puzzle",
      back: "Back",
      easyBadge: "Foundation",
      mediumBadge: "Intermediate",
      hardBadge: "Advanced Master",
      correctAnswer: "Correct answer! Great job.",
      incorrectAnswer: "Incorrect. Review hint and try again.",
      sessionComplete: "Puzzle session complete! Progress saved successfully.",
      selectPuzzle: "Select Puzzle",
      listen: "Listen",
      submitAnswer: "Submit Answer",
      hint: "Hint",
      aiHint: "AI Hint:",
      tryAgain: "Try Again",
      nextPuzzle: "Next Puzzle",
      finalScore: "Final Score",
      challengeCompleted: "Challenge Completed!",
      score: "Score",
      returnHub: "Return to Puzzle Hub",
      generatingPuzzle: "AI is Generating Your Custom Puzzle...",
      generatingDesc: "Creating age-appropriate content for",
      selectDiffHeading: "Select Difficulty & Generate Puzzle",
    },
    hi: {
      bannerSubtitle: "मेरी कक्षा चैनल • एआई पहेली अरीना",
      bannerTitle: "अनुकूली एआई पहेली और गेम चैनल",
      bannerDesc: "स्वचालित कक्षा और समूह पहचान सक्रिय। आयु-उपयुक्त पाठ्यक्रम पहेलियाँ हल करें, एक्सपी अंक अर्जित करें, और अपनी एआई शिक्षण प्रोफ़ाइल अपडेट करें।",
      currentXp: "वर्तमान एक्सपी शेष",
      systemGroup: "सिस्टम द्वारा पहचाना गया समूह",
      classLabel: "कक्षा",
      dailyChallenge: "आज की एआई शिक्षण चुनौती",
      dailyChallengeDesc: "“आपकी शिक्षण प्रगति, कमजोर विषयों और पाठ्यक्रम के आधार पर आपकी एआई-जनित दैनिक चुनौती।”",
      startChallenge: "चुनौती शुरू करें",
      puzzlesSolved: "हल की गई पहेलियाँ",
      accuracy: "सटीकता",
      pointsEarned: "अर्जित अंक",
      currentStreak: "वर्तमान स्ट्रीक",
      subjectProficiency: "विषय दक्षता विवरण",
      strongTopics: "मजबूत विषय",
      topicsToImprove: "सुधारने योग्य विषय",
      selectSubject: "के लिए विषय चुनें",
      backToHub: "पहेली हब पर वापस जाएं",
      selectTopic: "विषय चुनें",
      backToSubjects: "विषयों पर वापस जाएं",
      selectDifficulty: "कठिनाई चुनें और पहेली जनरेट करें",
      back: "वापस",
      easyBadge: "बुनियादी",
      mediumBadge: "मध्यम",
      hardBadge: "उन्नत मास्टर",
      correctAnswer: "सही उत्तर! बहुत बढ़िया।",
      incorrectAnswer: "गलत। संकेत की समीक्षा करें और पुनः प्रयास करें।",
      sessionComplete: "पहेली सत्र पूर्ण! प्रगति सफलतापूर्वक सहेजी गई।",
      selectPuzzle: "पहेली चुनें",
      listen: "सुनें",
      submitAnswer: "उत्तर सबमिट करें",
      hint: "संकेत",
      aiHint: "एआई संकेत:",
      tryAgain: "पुनः प्रयास करें",
      nextPuzzle: "अगली पहेली",
      finalScore: "अंतिम स्कोर",
      challengeCompleted: "चुनौती पूर्ण!",
      score: "स्कोर",
      returnHub: "पहेली हब पर लौटें",
      generatingPuzzle: "एआई आपकी कस्टम पहेली जनरेट कर रहा है...",
      generatingDesc: "के लिए आयु-उपयुक्त सामग्री बनाई जा रही है",
      selectDiffHeading: "कठिनाई चुनें और पहेली जनरेट करें",
    },
    gu: {
      bannerSubtitle: "મારી વર્ગ ચેનલ • એઆઈ પઝલ અરેના",
      bannerTitle: "અનુકૂલનશીલ એઆઈ પઝલ અને ગેમ ચેનલ",
      bannerDesc: "स्वचालित वर्ग અને જૂથ ઓળખ સક્રિય. વય-યોગ્ય અભ્યાસક્રમ કોયડાઓ ઉકેલો, XP પોઈન્ટ કમાઓ, અને તમારી એઆઈ લર્નિંગ પ્રોફાઇલ અપડેટ કરો.",
      currentXp: "વર્તમાન XP બેલેન્સ",
      systemGroup: "સિસ્ટમ દ્વારા ઓળખાયેલ જૂથ",
      classLabel: "વર્ગ",
      dailyChallenge: "આજની એઆઈ લર્નિંગ ચેલેન્જ",
      dailyChallengeDesc: "“તમારી શીખવાની પ્રગતિ, નબળા વિષયો અને અભ્યાસક્રમ પર આધારિત તમારી એઆઈ-જનરેટેડ દૈનિક પડકાર.”",
      startChallenge: "ચેલેન્જ શરૂ કરો",
      puzzlesSolved: "ઉકેલાયેલા કોયડાઓ",
      accuracy: "ચોકસાઈ",
      pointsEarned: "મેળવેલ પોઈન્ટ્સ",
      currentStreak: "વર્તમાન સ્ટ્રીક",
      subjectProficiency: "વિષય કુશળતા વિગત",
      strongTopics: "મજબૂત વિષયો",
      topicsToImprove: "સુધારવાના વિષયો",
      selectSubject: "માટે વિષય પસંદ કરો",
      backToHub: "પઝલ હબ પર પાછા જાઓ",
      selectTopic: "વિષય પસંદ કરો",
      backToSubjects: "વિષયો પર પાછા જાઓ",
      selectDifficulty: "મુશ્કેલી પસંદ કરો અને પઝલ બનાવો",
      back: "પાછા",
      easyBadge: "પાયાની",
      mediumBadge: "મધ્યમ",
      hardBadge: "ઉન્નત માસ્ટર",
      correctAnswer: "સાચો જવાબ! ખૂબ સરસ.",
      incorrectAnswer: "ખોટું. સંકેત તપાસો અને ફરી પ્રયાસ કરો.",
      sessionComplete: "પઝલ સત્ર સમાપ્ત! પ્રગતિ સફળતાપૂર્વક સાચવવામાં આવી.",
      selectPuzzle: "પઝલ પસંદ કરો",
      listen: "સાંભળો",
      submitAnswer: "જવાબ સબમિટ કરો",
      hint: "સંકેત",
      aiHint: "એઆઈ સંકેત:",
      tryAgain: "ફરી પ્રયાસ કરો",
      nextPuzzle: "اگلی પઝલ",
      finalScore: "અંતિમ સ્કોર",
      challengeCompleted: "ચેલેન્જ પૂર્ણ!",
      score: "સ્કોર",
      returnHub: "પઝલ હબ પર પાછા જાઓ",
      generatingPuzzle: "એઆઈ તમારી કસ્ટમ પઝલ જનરેટ કરી રહ્યું છે...",
      generatingDesc: "માટે વય-યોગ્ય સામગ્રી બનાવી રહી છે",
      selectDiffHeading: "મુશ્કેલી પસંદ કરો અને પઝલ બનાવો",
    },
    mr: {
      bannerSubtitle: "माझा वर्ग चॅनेल • एआय कोडे अरेना",
      bannerTitle: "अनुकूलक एआय कोडे आणि खेळ चॅनेल",
      bannerDesc: "स्वयंचलित वर्ग आणि गट ओळख सक्रिय. वयानुसार अभ्यासक्रम कोडी सोडवा, XP गुण मिळवा आणि तुमची एआय शिक्षण प्रोफाइल अपडेट करा.",
      currentXp: "सध्याचे XP शिल्लक",
      systemGroup: "सिस्टम द्वारे ओळखलेला गट",
      classLabel: "वर्ग",
      dailyChallenge: "आजचे एआय शिक्षण आव्हान",
      dailyChallengeDesc: "“तुमच्या शिकण्याच्या प्रगती, कमकुवत विषय आणि अभ्यासक्रमावर आधारित तुमचे एआय-निर्मित दैनिक आव्हान.”",
      startChallenge: "आव्हान सुरू करा",
      puzzlesSolved: "सोडवलेली कोडी",
      accuracy: "अचूकता",
      pointsEarned: "कमावलेले गुण",
      currentStreak: "सध्याची मालिका",
      subjectProficiency: "विषय कौशल्य तपशील",
      strongTopics: "मजबूत विषय",
      topicsToImprove: "सुधारण्यासाठीचे विषय",
      selectSubject: "साठी विषय निवडा",
      backToHub: "कोडे हबवर परत जा",
      selectTopic: "विषय निवडा",
      backToSubjects: "विषयांवर परत जा",
      selectDifficulty: "अडचण निवडा आणि कोडे तयार करा",
      back: "परत",
      easyBadge: "पायाभूत",
      mediumBadge: "मध्यम",
      hardBadge: "प्रगत मास्टर",
      correctAnswer: "योग्य उत्तर! खूप छान.",
      incorrectAnswer: "चूक. इशारा तपासा आणि पुन्हा प्रयत्न करा.",
      sessionComplete: "कोडे सत्र पूर्ण! प्रगती यशस्वीरित्या जतन केली.",
      selectPuzzle: "कोडे निवडा",
      listen: "ऐका",
      submitAnswer: "उत्तर सबमिट करा",
      hint: "इशारा",
      aiHint: "एआय इशारा:",
      tryAgain: "पुन्हा प्रयत्न करा",
      nextPuzzle: "पुढील कोडे",
      finalScore: "अंतिम गुण",
      challengeCompleted: "आव्हान पूर्ण!",
      score: "गुण",
      returnHub: "कोडे हबवर परत जा",
      generatingPuzzle: "एआय तुमचे कस्टम कोडे तयार करत आहे...",
      generatingDesc: "साठी वयानुसार योग्य सामग्री तयार करत आहे",
      selectDiffHeading: "अडचण निवडा आणि कोडे तयार करा",
    },
    ta: {
      bannerSubtitle: "எனது வகுப்பு சேனல் • AI புதிர் அரங்கம்",
      bannerTitle: "தகவமைப்பு AI புதிர் & விளையாட்டு சேனல்",
      bannerDesc: "தானியங்கி வகுப்பு & குழு அடையாளம் செயலில் உள்ளது. வயதுக்கு ஏற்ற பாடத்திட்ட புதிர்களை தீர்க்கவும், XP புள்ளிகளைப் பெறவும், உங்கள் AI கற்றல் சுயவிவரத்தைப் புதுப்பிக்கவும்.",
      currentXp: "தற்போதைய XP இருப்பு",
      systemGroup: "அமைப்பால் அடையாளம் காணப்பட்ட குழு",
      classLabel: "வகுப்பு",
      dailyChallenge: "இன்றைய AI கற்றல் சவால்",
      dailyChallengeDesc: "“உங்கள் கற்றல் முன்னேற்றம், பலவீனமான தலைப்புகள் மற்றும் பாடத்திட்டத்தின் அடிப்படையில் உருவாக்கப்பட்ட AI சவால்.”",
      startChallenge: "சவாலைத் தொடங்கு",
      puzzlesSolved: "தீர்க்கப்பட்ட புதிர்கள்",
      accuracy: "துல்லியம்",
      pointsEarned: "பெற்ற புள்ளிகள்",
      currentStreak: "தற்போதைய தொடர்ச்சி",
      subjectProficiency: "பாடத்தில் தேர்ச்சி விவரம்",
      strongTopics: "வலுவான தலைப்புகள்",
      topicsToImprove: "முன்னேற்ற வேண்டிய தலைப்புகள்",
      selectSubject: "இதற்கான பாடத்தைத் தேர்ந்தெடுக்கவும்",
      backToHub: "புதிர் மையத்திற்குத் திரும்பு",
      selectTopic: "தலைப்பைத் தேர்ந்தெடுக்கவும்",
      backToSubjects: "பாடங்களுக்குத் திரும்பு",
      selectDifficulty: "சிரமத்தைத் தேர்ந்தெடுத்து புதிரை உருவாக்கவும்",
      back: "பின்",
      easyBadge: "அடிப்படைகள்",
      mediumBadge: "நடுத்தரம்",
      hardBadge: "மேம்பட்ட மாஸ்டர்",
      correctAnswer: "சரியான பதில்! நல்வாழ்த்துக்கள்.",
      incorrectAnswer: "தவறு. குறிப்பைப் பார்த்து மீண்டும் முயற்சிக்கவும்.",
      sessionComplete: "புதிர் அமர்வு முடிந்தது! முன்னேற்றம் சேமிக்கப்பட்டது.",
      selectPuzzle: "புதிரைத் தேர்ந்தெடு",
      listen: "கேளுங்கள்",
      submitAnswer: "பதிலைச் சமர்ப்பிக்கவும்",
      hint: "குறிப்பு",
      aiHint: "AI குறிப்பு:",
      tryAgain: "மீண்டும் முயற்சிக்கவும்",
      nextPuzzle: "அடுத்த புதிர்",
      finalScore: "இறுதி மதிப்பெண்",
      challengeCompleted: "சவால் நிறைவுற்றது!",
      score: "மதிப்பெண்",
      returnHub: "புதிர் மையத்திற்குத் திரும்பு",
      generatingPuzzle: "AI உங்கள் தனிப்பயன் புதிரை உருவாக்குகிறது...",
      generatingDesc: "இதற்கு பொருத்தமான உள்ளடக்கம் உருவாக்கப்படுகிறது",
      selectDiffHeading: "சிரமத்தைத் தேர்ந்தெடுத்து புதிரை உருவாக்கவும்",
    },
    te: {
      bannerSubtitle: "నా తరగతి ఛానెల్ • AI పజిల్ అరేనా",
      bannerTitle: "అడాప్టివ్ AI పజిల్ & గేమ్ ఛానెల్",
      bannerDesc: "ఆటోమేటిక్ క్లాస్ & గ్రూప్ గుర్తింపు సక్రియంగా ఉంది. వయసుకు తగిన సిలబస్ పజిల్స్ పరిష్కరించండి, XP పాయింట్లు సంపాదించండి.",
      currentXp: "ప్రస్తుత XP బ్యాలెన్స్",
      systemGroup: "సిస్టమ్ గుర్తించిన సమూహం",
      classLabel: "తరగతి",
      dailyChallenge: "నేటి AI లెర్నింగ్ ఛాలెంజ్",
      dailyChallengeDesc: "“మీ అభ్యాస పురోగతి, బలహీనమైన అంశాలు మరియు సిలబస్ ఆధారంగా రూపొందించిన AI ఛాలెంజ్.”",
      startChallenge: "ఛాలెంజ్ ప్రారంభించండి",
      puzzlesSolved: "పరిష్కరించిన పజిల్స్",
      accuracy: "ఖచ్చితత్వం",
      pointsEarned: "సంపాదించిన పాయింట్లు",
      currentStreak: "ప్రస్తుత స్ట్రీక్",
      subjectProficiency: "సబ్జెక్ట్ నైపుణ్య వివరాలు",
      strongTopics: "బలమైన అంశాలు",
      topicsToImprove: "మెరుగుపరచవలసిన అంశాలు",
      selectSubject: "కోసం సబ్జెక్ట్ ఎంచుకోండి",
      backToHub: "పజిల్ హబ్‌కి వెళ్ళండి",
      selectTopic: "అంశాన్ని ఎంచుకోండి",
      backToSubjects: "సబ్జెక్ట్‌లకు వెళ్ళండి",
      selectDifficulty: "కఠినతను ఎంచుకుని పజిల్ సృష్టించండి",
      back: "వెనుకకు",
      easyBadge: "ప్రాథమిక",
      mediumBadge: "మధ్యస్థ",
      hardBadge: "అధునాతన మాస్టర్",
      correctAnswer: "సరైన సమాధానం! అద్భుతం.",
      incorrectAnswer: "తప్పు. సూచనను సమీక్షించి మళ్లీ ప్రయత్నించండి.",
      sessionComplete: "పజిల్ సెషన్ పూర్తయింది! పురోగతి విజయవంతంగా సేవ్ చేయబడింది.",
      selectPuzzle: "పజిల్ ఎంచుకోండి",
      listen: "వినండి",
      submitAnswer: "సమాధానం సమర్పించండి",
      hint: "సూచన",
      aiHint: "AI సూచన:",
      tryAgain: "మళ్లీ ప్రయత్నించండి",
      nextPuzzle: "తదుపరి పజిల్",
      finalScore: "అంతిమ స్కోర్",
      challengeCompleted: "ఛాలెంజ్ పూర్తయింది!",
      score: "స్కోర్",
      returnHub: "పజిల్ హబ్‌కి వెళ్ళండి",
      generatingPuzzle: "AI మీ కస్టమ్ పజిల్‌ని సృష్టిస్తోంది...",
      generatingDesc: "కోసం తగిన కంటెంట్ సృష్టించబడుతోంది",
      selectDiffHeading: "కఠినతను ఎంచుకుని పజిల్ సృష్టించండి",
    }
  };

  const t = (key: string): string => {
    return PUZZLE_TRANSLATIONS[lang]?.[key] || PUZZLE_TRANSLATIONS['en'][key] || key;
  };

  // Helper to map Class format (ProfileTab) to Std format (PuzzleGameTab / Admin)
  const toStdFormat = (val: string): string => {
    if (!val) return 'Std 8';
    return val.replace(/^Class\b/i, 'Std');
  };

  // Helper to map Std format to Class format (expected by ProfileTab / database)
  const toClassFormat = (val: string): string => {
    if (!val) return 'Class 8';
    return val.replace(/^Std\b/i, 'Class');
  };

  // Determine initial standard / class from user profile (normalized to "Std X")
  const initialClass = toStdFormat(user.standard || 'Std 8');
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);

  // Helper to determine group number from standard string (e.g. "Std 3" -> 1, "Std 7" -> 2, "Std 11" -> 3)
  const getGroupNumberForStandard = (std: string): number => {
    const match = std.match(/\d+/);
    if (!match) return 2;
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 5) return 1;
    if (num >= 6 && num <= 9) return 2;
    return 3;
  };

  // Helper to generate initial class-appropriate stats profile
  const getInitialStatsForClass = (cls: string) => {
    const grpNum = getGroupNumberForStandard(cls);
    if (grpNum === 1) {
      return {
        solved: 0,
        attempted: 0,
        accuracy: 0,
        streak: 0,
        proficiency: {
          'Environmental Studies (EVS)': 0,
          'Basic Arithmetic & Numbers': 0,
          'Phonics & Vocabulary': 0,
          'General Knowledge & Fun': 0
        },
        strongTopics: [],
        weakTopics: []
      };
    } else if (grpNum === 2) {
      return {
        solved: 0,
        attempted: 0,
        accuracy: 0,
        streak: 0,
        proficiency: {
          'Science (Physics, Chem, Bio)': 0,
          'Mathematics & Algebra': 0,
          'English Grammar & Literature': 0,
          'Social Science & Civics': 0,
          'Computer & Logic': 0
        },
        strongTopics: [],
        weakTopics: []
      };
    } else {
      return {
        solved: 0,
        attempted: 0,
        accuracy: 0,
        streak: 0,
        proficiency: {
          'Advanced Physics & Mechanics': 0,
          'Calculus & Quantitative Analysis': 0,
          'Data Structures & Algorithms': 0,
          'Economics & Case Studies': 0,
          'Competitive Exam Reasoning': 0
        },
        strongTopics: [],
        weakTopics: []
      };
    }
  };

  // Dynamically resolve metrics for the currently selected class
  const currentClassStats = useMemo(() => {
    let parsedStats: Record<string, any> = {};
    if (user.puzzleStatsByClass) {
      try {
        parsedStats = JSON.parse(user.puzzleStatsByClass);
      } catch (e) {
        console.warn("Error parsing puzzleStatsByClass:", e);
      }
    }
    
    if (!parsedStats[selectedClass]) {
      return getInitialStatsForClass(selectedClass);
    }
    return parsedStats[selectedClass];
  }, [user.puzzleStatsByClass, selectedClass]);

  const puzzlesSolved = currentClassStats.solved;
  const puzzlesAttempted = currentClassStats.attempted;
  const puzzleAccuracy = currentClassStats.accuracy;
  const puzzleStreak = currentClassStats.streak;
  const parsedProficiency = currentClassStats.proficiency;
  const parsedStrong = currentClassStats.strongTopics;
  const parsedWeak = currentClassStats.weakTopics;

  // Dynamic Scholar Level calculation
  const getScholarLevel = (points: number): string => {
    if (points >= 1500) return 'Level 5 Grandmaster';
    if (points >= 1000) return 'Level 4 Expert';
    if (points >= 500) return 'Level 3 Scholar';
    if (points >= 200) return 'Level 2 Apprentice';
    return 'Level 1 Scholar';
  };
  const scholarLevel = getScholarLevel(user.totalPoints ?? 545);

  // Helper to construct updating statistics payload per standard
  const updatePuzzleStats = (correctCount: number, attemptedCount: number, subject: string, topic: string) => {
    let parsedStats: Record<string, any> = {};
    if (user.puzzleStatsByClass) {
      try {
        parsedStats = JSON.parse(user.puzzleStatsByClass);
      } catch (e) {
        console.warn("Error parsing puzzleStatsByClass:", e);
      }
    }

    const clsStats = parsedStats[selectedClass] || getInitialStatsForClass(selectedClass);

    const nextSolved = clsStats.solved + correctCount;
    const nextAttempted = clsStats.attempted + attemptedCount;
    const nextAccuracy = nextAttempted > 0 ? Math.round((nextSolved / nextAttempted) * 100) : 100;
    
    // Update subject proficiency via a learning moving average
    const currentSubjectProf = clsStats.proficiency[subject] !== undefined ? clsStats.proficiency[subject] : 0;
    const sessionAccuracy = Math.round((correctCount / attemptedCount) * 100);
    const nextSubjectProf = Math.round(currentSubjectProf * 0.7 + sessionAccuracy * 0.3);
    
    const nextProficiency = {
      ...clsStats.proficiency,
      [subject]: Math.max(0, Math.min(100, nextSubjectProf))
    };

    // Update Strong & Weak Topics lists
    let nextStrong = [...clsStats.strongTopics];
    let nextWeak = [...clsStats.weakTopics];

    if (sessionAccuracy >= 70) {
      if (!nextStrong.includes(topic)) {
        nextStrong.push(topic);
      }
      nextWeak = nextWeak.filter(t => t !== topic);
    } else {
      if (!nextWeak.includes(topic)) {
        nextWeak.push(topic);
      }
      nextStrong = nextStrong.filter(t => t !== topic);
    }

    // Keep lists capped at 4 items for UI sanity
    if (nextStrong.length > 4) nextStrong.shift();
    if (nextWeak.length > 4) nextWeak.shift();

    // Increment puzzle streak if completing a full session or daily challenge
    const nextStreak = clsStats.streak + (correctCount > 0 ? 1 : 0);

    const updatedStats = {
      ...parsedStats,
      [selectedClass]: {
        solved: nextSolved,
        attempted: nextAttempted,
        accuracy: nextAccuracy,
        streak: nextStreak,
        proficiency: nextProficiency,
        strongTopics: nextStrong,
        weakTopics: nextWeak
      }
    };

    return {
      puzzlesSolved: nextSolved,
      puzzlesAttempted: nextAttempted,
      puzzleAccuracy: nextAccuracy,
      puzzleStreak: nextStreak,
      puzzleSubjectProficiency: JSON.stringify(nextProficiency),
      puzzleStrongTopics: JSON.stringify(nextStrong),
      puzzleWeakTopics: JSON.stringify(nextWeak),
      puzzleStatsByClass: JSON.stringify(updatedStats)
    };
  };

  const [activeGroupNum, setActiveGroupNum] = useState<number>(getGroupNumberForStandard(initialClass));
  const [step, setStep] = useState<PuzzleStep>('group-hub');

  // Selection state
  const getGroupName = (grpNum: number): string => {
    return grpNum === 1 ? 'Group 1 — Fun & Visual Learning (Std 1–5)' : grpNum === 2 ? 'Group 2 — Concept & Skill-Based Learning (Std 6–9)' : 'Group 3 — Advanced & Critical Thinking (Std 10–12)';
  };
  const [groupIdentified, setGroupIdentified] = useState<string>(getGroupName(getGroupNumberForStandard(initialClass)));
  const [selectedSubject, setSelectedSubject] = useState<string>('Science');
  const [selectedTopic, setSelectedTopic] = useState<string>('Chemical Reactions & Elements');
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<string>('Match the Pair');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');

  // Sync selected class with prop updates from user profile
  useEffect(() => {
    if (user.standard) {
      setSelectedClass(toStdFormat(user.standard));
    }
  }, [user.standard]);

  // Sync group number and group name with selected class
  useEffect(() => {
    const grpNum = getGroupNumberForStandard(selectedClass);
    setActiveGroupNum(grpNum);
    setGroupIdentified(getGroupName(grpNum));
  }, [selectedClass]);

  // Game session state
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [totalPuzzlesInSession] = useState<number>(5);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Active puzzle state
  const [activePuzzle, setActivePuzzle] = useState<PuzzleData | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [aiProfileUpdate, setAiProfileUpdate] = useState<string>('');
  const [nextChallengeIdea, setNextChallengeIdea] = useState<string>('');

  // Daily Challenge state
  const [dailyPuzzles, setDailyPuzzles] = useState<PuzzleData[]>([]);
  const [dailyIndex, setDailyIndex] = useState<number>(0);
  const [dailyScore, setDailyScore] = useState<number>(0);
  const [dailyCorrectCount, setDailyCorrectCount] = useState<number>(0);

  // Timer effect during solving
  useEffect(() => {
    let timer: any = null;
    if (step === 'solving' || step === 'daily-challenge-solving') {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  const classesList = [
    'Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5',
    'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10',
    'Std 11 (Science)', 'Std 11 (Commerce)', 'Std 11 (Arts)',
    'Std 12 (Science)', 'Std 12 (Commerce)', 'Std 12 (Arts)'
  ];

  // Group definitions as requested by user
  const group1Cards = [
    { id: 'Picture Puzzle', label: '🖼️ Picture Puzzle', desc: 'Select the correct visual match' },
    { id: 'Number Puzzle', label: '🔢 Number Puzzle', desc: 'Basic count & arithmetic' },
    { id: 'Word Puzzle', label: '🔤 Word Puzzle', desc: 'Letter sorting & spelling' },
    { id: 'Jigsaw Puzzle', label: '🧩 Jigsaw Puzzle', desc: 'Arrange puzzle pieces' },
    { id: 'Color & Identify', label: '🎨 Color & Identify', desc: 'Match colors and objects' },
  ];

  const group2Cards = [
    { id: 'Match the Pair', label: '🃏 Match the Pair', desc: 'Connect related scientific/math concepts' },
    { id: 'Mystery Solve', label: '🕵️ Mystery Solve', desc: 'Analyze clues to find the truth' },
    { id: 'Word Puzzle', label: '🔤 Word Puzzle', desc: 'Vocabulary and terminology' },
    { id: 'Math Puzzle', label: '➗ Math Puzzle', desc: 'Equations and word problems' },
    { id: 'Science Puzzle', label: '🔬 Science Puzzle', desc: 'Concept-based experimentation' },
  ];

  const group3Cards = [
    { id: 'Case Study Challenge', label: '🕵️ Case Study Challenge', desc: 'Read complex scenarios and deduce conclusions' },
    { id: 'Data Detective', label: '📊 Data Detective', desc: 'Analyze charts, statistics and tables' },
    { id: 'Code Breaker', label: '🔐 Code Breaker', desc: 'Logical keys and algorithmic puzzles' },
    { id: 'Decision Challenge', label: '🎯 Decision Challenge', desc: 'Evaluate trade-offs and policy decisions' },
    { id: 'Escape Challenge', label: '🌀 Escape Challenge', desc: 'Multi-stage rigorous critical thinking test' },
  ];

  const subjectsByGroup: Record<number, { id: string; name: string; icon: string }[]> = {
    1: [
      { id: 'EVS', name: 'Environmental Studies (EVS)', icon: '🌱' },
      { id: 'Maths', name: 'Basic Arithmetic & Numbers', icon: '🔢' },
      { id: 'English', name: 'Phonics & Vocabulary', icon: '📖' },
      { id: 'GeneralKnowledge', name: 'General Knowledge & Fun', icon: '🌟' }
    ],
    2: [
      { id: 'Science', name: 'Science (Physics, Chem, Bio)', icon: '🔬' },
      { id: 'Math', name: 'Mathematics & Algebra', icon: '📐' },
      { id: 'English', name: 'English Grammar & Literature', icon: '📚' },
      { id: 'SocialScience', name: 'Social Science & Civics', icon: '🌍' },
      { id: 'ComputerScience', name: 'Computer & Logic', icon: '💻' }
    ],
    3: [
      { id: 'AdvancedPhysics', name: 'Advanced Physics & Mechanics', icon: '⚛️' },
      { id: 'Calculus', name: 'Calculus & Quantitative Analysis', icon: '📈' },
      { id: 'DataScience', name: 'Data Structures & Algorithms', icon: '💻' },
      { id: 'Economics', name: 'Economics & Case Studies', icon: '📊' },
      { id: 'GeneralStudies', name: 'Competitive Exam Reasoning', icon: '🎯' }
    ]
  };

  const topicsMap: Record<string, string[]> = {
    'Environmental Studies (EVS)': ['Plants Around Us', 'Water Cycle', 'Animals & Habitats', 'My Family & Neighborhood'],
    'Basic Arithmetic & Numbers': ['Addition & Subtraction', 'Multiplication Tables', 'Shapes & Patterns', 'Measurement'],
    'Phonics & Vocabulary': ['Alphabet Sounds', 'Simple Sight Words', 'Rhyming Words', 'Animal Names'],
    'General Knowledge & Fun': ['National Symbols', 'Solar System Basics', 'Famous Landmarks', 'Good Habits'],
    
    'Science': ['Chemical Reactions & Equations', 'Photosynthesis & Plants', 'Forces & Motion', 'Human Digestive System', 'Electricity & Circuits'],
    'Mathematics': ['Real Numbers & Polynomials', 'Linear Equations', 'Triangles & Geometry', 'Quadratic Equations', 'Statistics'],
    'English': ['Grammar & Active/Passive Voice', 'Vocabulary & Synonyms', 'Reading Comprehension', 'Direct/Indirect Speech'],
    'SocialScience': ['The Indian Constitution', 'Nationalism in India', 'Resources & Sustainable Development', 'Federalism'],
    'ComputerScience': ['Python Loops & Functions', 'HTML & Web Basics', 'Data Structures & Arrays', 'Cyber Safety'],

    'AdvancedPhysics': ['Electromagnetic Induction', 'Quantum Mechanics Basics', 'Thermodynamics Laws', 'Wave Optics'],
    'Calculus': ['Limits & Derivatives', 'Integration Techniques', 'Differential Equations', 'Vector Calculus'],
    'DataScience': ['Trees & Graphs', 'Dynamic Programming', 'Big O Complexity', 'Database Queries'],
    'Economics': ['Market Equilibrium', 'Fiscal Policy', 'Microeconomic Consumer Theory', 'GDP & Inflation'],
    'GeneralStudies': ['Logical Deductions', 'Syllogism & Statements', 'Data Interpretation Sets', 'Critical Reasoning']
  };

  const difficultiesList = [
    { id: 'Easy', label: 'Easy (10 XP)', points: 10, badge: '🟢 Foundation' },
    { id: 'Medium', label: 'Medium (25 XP)', points: 25, badge: '🟡 Intermediate' },
    { id: 'Hard', label: 'Hard (50 XP)', points: 50, badge: '🔴 Advanced Master' },
  ];

  // Handle class selection change
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    onUpdateUser({ standard: toClassFormat(cls) });
  };

  // Select puzzle card from group hub
  const handleSelectPuzzleCardFromHub = (puzzleTypeId: string) => {
    setSelectedPuzzleType(puzzleTypeId);
    setStep('select-subject');
  };

  const handleSelectSubject = (subjName: string) => {
    setSelectedSubject(subjName);
    const topics = topicsMap[subjName] || ['Core Principles', 'Advanced Analysis', 'Practical Applications'];
    setSelectedTopic(topics[0]);
    setStep('select-topic');
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setStep('select-difficulty');
  };

  const handleSelectDifficultyAndGenerate = async (diffId: string) => {
    setSelectedDifficulty(diffId);
    setStep('generating');
    setCurrentPuzzleIndex(0);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setElapsedSeconds(0);
    await generateAiPuzzle(0, diffId);
  };

  // AI Puzzle Generation via backend API
  const generateAiPuzzle = async (puzzleNum: number, diff: string) => {
    setActivePuzzle(null);
    setStudentAnswer('');
    setIsCorrect(null);
    setShowHint(false);
    setAttempts(0);

    try {
      const response = await fetch('/api/gemini/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.name,
          studentClass: selectedClass,
          subject: selectedSubject,
          topic: selectedTopic,
          puzzleType: selectedPuzzleType,
          difficulty: diff,
          puzzleNumber: puzzleNum + 1,
          lang
        })
      });

      const data = await response.json();
      if (data.success && data.puzzle) {
        setActivePuzzle(data.puzzle);
      } else {
        throw new Error(data.message || 'AI generation failed');
      }
    } catch (err) {
      console.warn("AI puzzle fallback activated:", err);
      const fallbackPuzzle: PuzzleData = {
        id: `fb-${puzzleNum}`,
        question: `[${selectedPuzzleType} #${puzzleNum + 1}] For ${selectedClass} studying ${selectedSubject} (${selectedTopic}), what is the primary theorem or correct outcome?`,
        puzzleType: selectedPuzzleType,
        options: ['Optimal Equilibrium Value', 'Direct Linear Progression', 'Invariant Constant Ratio', 'Catalytic Equilibrium State'],
        correctAnswer: 'Optimal Equilibrium Value',
        hint: `Think about core principles taught in ${selectedClass} ${selectedSubject}.`,
        explanation: `In ${selectedTopic}, correct application ensures accurate problem resolution across board criteria.`,
        groupIdentified: groupIdentified,
        difficulty: diff
      };
      setActivePuzzle(fallbackPuzzle);
    } finally {
      setStep('solving');
    }
  };

  // Start Daily AI Challenge
  const handleStartDailyChallenge = async () => {
    setStep('generating');
    setDailyScore(0);
    setDailyCorrectCount(0);
    setDailyIndex(0);
    setElapsedSeconds(0);

    try {
      // Generate 5 questions in parallel or sequence
      const promises = Array.from({ length: 5 }).map(async (_, idx) => {
        const resp = await fetch('/api/gemini/generate-puzzle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: user.name,
            studentClass: selectedClass,
            subject: selectedSubject,
            topic: selectedTopic,
            puzzleType: idx % 2 === 0 ? 'Match the Pair' : 'Science Puzzle',
            difficulty: 'Medium',
            puzzleNumber: idx + 1,
            lang
          })
        });
        const d = await resp.json();
        return d.success ? d.puzzle : null;
      });

      const results = await Promise.all(promises);
      const valid = results.filter(Boolean);
      if (valid.length > 0) {
        setDailyPuzzles(valid);
        setActivePuzzle(valid[0]);
        setStep('daily-challenge-solving');
      } else {
        throw new Error('Failed to generate daily challenge');
      }
    } catch (e) {
      // Fallback daily puzzles
      const fb: PuzzleData[] = Array.from({ length: 5 }).map((_, i) => ({
        id: `daily-fb-${i}`,
        question: `[Daily AI Challenge Q${i + 1}] For ${selectedClass} ${selectedSubject}, evaluate and select the correct concept for ${selectedTopic}.`,
        puzzleType: 'Science Puzzle',
        options: ['Correct Hypothesis A', 'Incorrect Alternative B', 'Unrelated Theory C', 'None of the Above'],
        correctAnswer: 'Correct Hypothesis A',
        hint: 'Review core notes for this topic.',
        explanation: 'Correct Hypothesis A directly solves the problem statement.',
        groupIdentified,
        difficulty: 'Medium'
      }));
      setDailyPuzzles(fb);
      setActivePuzzle(fb[0]);
      setStep('daily-challenge-solving');
    }
  };

  const handleCheckAnswer = () => {
    if (!activePuzzle || !studentAnswer.trim()) return;
    const cleanStudent = studentAnswer.trim().toLowerCase();
    const cleanCorrect = activePuzzle.correctAnswer.trim().toLowerCase();
    const matched = cleanStudent === cleanCorrect || cleanCorrect.includes(cleanStudent) || cleanStudent.includes(cleanCorrect);

    if (matched) {
      setIsCorrect(true);
      const pts = selectedDifficulty === 'Hard' ? 50 : selectedDifficulty === 'Medium' ? 25 : 10;
      if (step === 'solving') {
        setSessionScore(prev => prev + pts);
        setSessionCorrectCount(prev => prev + 1);
      } else {
        setDailyScore(prev => prev + 10);
        setDailyCorrectCount(prev => prev + 1);
      }
      speakText("Correct answer! Great job.", lang);
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      speakText("Incorrect. Review hint and try again.", lang);
    }
    setStep(step === 'solving' ? 'feedback' : 'daily-challenge-solving');
  };

  const handleNextPuzzleOrFinish = async () => {
    if (step === 'daily-challenge-solving' || step === 'feedback') {
      if (step === 'daily-challenge-solving') {
        const nextIdx = dailyIndex + 1;
        if (nextIdx < dailyPuzzles.length) {
          setDailyIndex(nextIdx);
          setActivePuzzle(dailyPuzzles[nextIdx]);
          setStudentAnswer('');
          setIsCorrect(null);
          setShowHint(false);
        } else {
          setStep('daily-challenge-result');
          const newPts = (user.totalPoints || 15) + dailyScore + 10;
          
          // Calculate dynamic puzzle progress metrics
          const statsUpdates = updatePuzzleStats(dailyCorrectCount, dailyPuzzles.length, selectedSubject, selectedTopic);
          
          onUpdateUser({ 
            totalPoints: newPts, 
            studyMins: (user.studyMins || 30) + 10,
            ...statsUpdates,
            updatedAt: Date.now()
          });
        }
        return;
      }

      const nextIdx = currentPuzzleIndex + 1;
      if (nextIdx < totalPuzzlesInSession) {
        setCurrentPuzzleIndex(nextIdx);
        setStep('generating');
        await generateAiPuzzle(nextIdx, selectedDifficulty);
      } else {
        setStep('final-score');
        const newTotalPoints = (user.totalPoints || 15) + sessionScore + 20;
        const newStudyMins = (user.studyMins || 30) + 15;
        
        setAiProfileUpdate(`Student successfully completed ${totalPuzzlesInSession} puzzles in ${selectedSubject} (${selectedTopic}) for ${selectedClass}. AI learning profile updated with enhanced cognitive mastery score.`);
        setNextChallengeIdea(`Next Personalized Challenge: Advanced cross-disciplinary synthesis for ${selectedClass} ${selectedSubject}.`);

        // Calculate dynamic puzzle progress metrics
        const statsUpdates = updatePuzzleStats(sessionCorrectCount, totalPuzzlesInSession, selectedSubject, selectedTopic);

        onUpdateUser({
          totalPoints: newTotalPoints,
          studyMins: newStudyMins,
          ...statsUpdates,
          updatedAt: Date.now()
        });

        speakText("Puzzle session complete! Progress saved successfully.", lang);
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentGroupCards = activeGroupNum === 1 ? group1Cards : activeGroupNum === 2 ? group2Cards : group3Cards;
  const currentGroupSubjects = subjectsByGroup[activeGroupNum] || subjectsByGroup[2];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto pb-16">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#2D3047] via-[#3D405B] to-[#1D2037] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Puzzle className="w-64 h-64 text-white" />
        </div>
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3.5 py-1 rounded-full text-xs font-mono font-bold text-[#F4F1DE] backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>{t('bannerSubtitle')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
            {t('bannerTitle')}
          </h2>
          <p className="text-sm text-gray-200 max-w-xl font-sans leading-relaxed">
            {t('bannerDesc')}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center z-10 shrink-0 shadow-inner">
          <span className="text-[10px] uppercase font-mono text-amber-300 font-bold block">{t('currentXp')}</span>
          <span className="text-3xl font-black font-mono text-white">⭐ {user.totalPoints ?? 15} XP</span>
        </div>
      </div>

      {/* CLASS SELECTOR BAR (Automatic Group Identification) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase font-mono">{t('systemGroup')}</span>
            <div className="text-sm font-display font-bold text-[#3D405B]">
              {activeGroupNum === 1 ? '🟢 Group 1 — Fun & Visual Learning (Std 1–5)' : activeGroupNum === 2 ? '🟡 Group 2 — Concept & Skill-Based Learning (Std 6–9)' : '🔴 Group 3 — Advanced & Critical Thinking (Std 10–12)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-500 font-mono shrink-0">{t('classLabel')}:</label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-xs font-bold font-sans text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
          >
            {classesList.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STEP: GROUP HUB / PUZZLE CARDS (Step 1-2 Flow) */}
      {step === 'group-hub' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-display font-extrabold text-[#3D405B]">
                  {activeGroupNum === 1 ? '🟢 Group 1: Fun & Visual Learning (Std 1–5)' : activeGroupNum === 2 ? '🟡 Group 2: Concept & Skill-Based Learning (Std 6–9)' : '🔴 Group 3: Advanced & Critical Thinking (Std 10–12)'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing tailored puzzle cards for <span className="font-bold text-[#E07A5F]">{selectedClass}</span>. Click any puzzle card to start.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-mono font-bold">
                Auto-Grouped
              </span>
            </div>

            {/* 5 Puzzle Cards for the active group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {currentGroupCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectPuzzleCardFromHub(card.id)}
                  className="p-5 rounded-2xl border-2 border-gray-200 hover:border-[#E07A5F] bg-white hover:bg-[#FAF8F4] transition-all duration-200 text-left flex flex-col justify-between gap-3 cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#E07A5F]/10 text-[#3D405B] group-hover:text-[#E07A5F] flex items-center justify-center font-bold text-lg transition-colors">
                      🧩
                    </div>
                    <div className="font-display font-bold text-base text-[#3D405B] group-hover:text-[#E07A5F]">
                      {card.label}
                    </div>
                    <p className="text-xs text-gray-500 font-sans leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#E07A5F] pt-2">
                    <span>Select Puzzle</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 🎯 TODAY'S AI LEARNING CHALLENGE CARD */}
          <div className="bg-gradient-to-br from-indigo-900 to-[#3D405B] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <Zap className="w-48 h-48 text-amber-300" />
            </div>
            <div className="space-y-3 z-10">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI CURATED DAILY CHALLENGE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white">
                Today's AI Learning Challenge
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 max-w-lg leading-relaxed">
                “Your AI-generated daily challenge based on your learning progress, weak topics, and {selectedClass} curriculum.”
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs font-mono text-amber-300">
                <span>⏱️ 2 Minutes</span>
                <span>•</span>
                <span>⭐ 50 Points</span>
                <span>•</span>
                <span>📝 5 Questions</span>
              </div>
            </div>
            <button
              onClick={handleStartDailyChallenge}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-gray-900 font-sans font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer z-10 shrink-0 hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Challenge</span>
            </button>
          </div>

          {/* 📊 PROGRESS TRACKING DASHBOARD */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-[#3D405B]">Puzzle Mastery & Progress Tracking</h3>
                  <p className="text-xs text-gray-500">Real-time performance metrics for <span className="font-bold text-[#E07A5F]">{selectedClass}</span></p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-mono font-bold">
                {scholarLevel}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center">
                <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Puzzles Solved</span>
                <span className="text-2xl font-black font-mono text-[#3D405B]">{puzzlesSolved}</span>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold block">Accuracy</span>
                <span className="text-2xl font-black font-mono text-emerald-700">{puzzleAccuracy}%</span>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-mono text-amber-800 uppercase font-bold block">Points Earned</span>
                <span className="text-2xl font-black font-mono text-amber-700">{user.totalPoints ?? 15} XP</span>
              </div>
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] font-mono text-purple-800 uppercase font-bold block">Current Streak</span>
                <span className="text-2xl font-black font-mono text-purple-700">{puzzleStreak} Days 🔥</span>
              </div>
            </div>

            {/* Subject Mastery Progress Bars */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider">Subject Proficiency Breakdown</h4>
              
              <div className="space-y-3">
                {currentGroupSubjects.map((subj, idx) => {
                  const colors = [
                    { text: 'text-emerald-600', bg: 'bg-emerald-500' },
                    { text: 'text-amber-600', bg: 'bg-amber-500' },
                    { text: 'text-indigo-600', bg: 'bg-indigo-500' },
                    { text: 'text-rose-600', bg: 'bg-rose-500' },
                    { text: 'text-sky-600', bg: 'bg-sky-500' }
                  ];
                  const color = colors[idx % colors.length];
                  const profValue = parsedProficiency[subj.name] ?? parsedProficiency[subj.id] ?? 0;
                  return (
                    <div key={subj.id}>
                      <div className="flex justify-between items-center text-xs font-bold text-[#3D405B] mb-1">
                        <span>{subj.name}</span>
                        <span className={`font-mono ${color.text}`}>{profValue}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color.bg} rounded-full`} style={{ width: `${profValue}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strong & Weak Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-50/40 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Strong Topics</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedStrong.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                      {topic}
                    </span>
                  ))}
                  {parsedStrong.length === 0 && (
                    <span className="text-xs text-gray-400 italic">None yet. Complete puzzles to build skills!</span>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Topics to Improve</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedWeak.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-xs font-medium border border-amber-200">
                      {topic}
                    </span>
                  ))}
                  {parsedWeak.length === 0 && (
                    <span className="text-xs text-gray-400 italic">None yet. Good job!</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP: SELECT SUBJECT */}
      {step === 'select-subject' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold font-mono">2</div>
              <div>
                <h3 className="text-lg font-display font-bold text-[#3D405B]">Select Subject for {selectedPuzzleType}</h3>
                <p className="text-xs text-gray-500">Class: <span className="font-bold text-[#E07A5F]">{selectedClass}</span></p>
              </div>
            </div>
            <button onClick={() => setStep('group-hub')} className="text-xs font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer">
              Back to Puzzle Hub
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentGroupSubjects.map((subj) => (
              <button
                key={subj.id}
                onClick={() => handleSelectSubject(subj.name)}
                className={`p-4 rounded-2xl border-2 font-sans font-bold text-sm transition-all duration-200 flex items-center justify-between cursor-pointer hover:scale-101 ${
                  selectedSubject === subj.name
                    ? 'border-[#81B29A] bg-[#81B29A]/10 text-[#2D3047] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subj.icon}</span>
                  <span className="font-bold text-[#3D405B]">{subj.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP: SELECT TOPIC */}
      {step === 'select-topic' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold font-mono">3</div>
              <div>
                <h3 className="text-lg font-display font-bold text-[#3D405B]">Select Topic</h3>
                <p className="text-xs text-gray-500">Subject: <span className="font-bold text-[#E07A5F]">{selectedSubject}</span></p>
              </div>
            </div>
            <button onClick={() => setStep('select-subject')} className="text-xs font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer">
              Back to Subjects
            </button>
          </div>

          <div className="space-y-3">
            {(topicsMap[selectedSubject] || ['General Concepts', 'Core Analysis']).map((top) => (
              <button
                key={top}
                onClick={() => handleSelectTopic(top)}
                className={`w-full p-4 rounded-2xl border-2 font-sans font-bold text-sm transition-all duration-200 flex items-center justify-between cursor-pointer hover:scale-101 ${
                  selectedTopic === top
                    ? 'border-[#F2CC8F] bg-[#FAF8F4] text-[#3D405B] shadow-sm ring-1 ring-[#F2CC8F]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#E07A5F]" />
                  <span>{top}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP: SELECT DIFFICULTY */}
      {step === 'select-difficulty' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold font-mono">4</div>
              <div>
                <h3 className="text-lg font-display font-bold text-[#3D405B]">Select Difficulty & Generate Puzzle</h3>
                <p className="text-xs text-gray-500">Puzzle Type: <span className="font-bold text-purple-600">{selectedPuzzleType}</span></p>
              </div>
            </div>
            <button onClick={() => setStep('select-topic')} className="text-xs font-bold text-gray-400 hover:text-gray-700 underline cursor-pointer">
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {difficultiesList.map((diff) => (
              <button
                key={diff.id}
                onClick={() => handleSelectDifficultyAndGenerate(diff.id)}
                className="p-5 rounded-2xl border-2 border-gray-200 hover:border-rose-500 bg-white hover:bg-rose-50/30 transition-all duration-200 font-sans font-bold text-center flex flex-col items-center gap-3 cursor-pointer group shadow-sm"
              >
                <span className="text-xs font-mono px-3 py-1 bg-gray-100 group-hover:bg-white rounded-full border border-gray-200">{diff.badge}</span>
                <span className="text-lg font-display font-extrabold text-[#3D405B]">{diff.label}</span>
                <span className="text-xs text-gray-500 font-normal">AI generates age-appropriate puzzle for {selectedClass} without exceeding level.</span>
                <div className="w-full mt-2 py-2 rounded-xl bg-[#E07A5F] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Puzzle</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GENERATING LOADING STATE */}
      {step === 'generating' && (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-[#3D405B]">AI is Generating Your Custom Puzzle...</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Creating age-appropriate content for <span className="font-bold text-[#E07A5F]">{selectedClass}</span> • {selectedSubject} • {selectedPuzzleType} ({selectedDifficulty}).
            </p>
          </div>
        </div>
      )}

      {/* INTERACTIVE SOLVING PUZZLE SCREEN (Regular or Daily Challenge) */}
      {(step === 'solving' || step === 'daily-challenge-solving') && activePuzzle && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          
          {/* Top HUD bar with Question count, Score, Timer */}
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-[#3D405B] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1">
                <Puzzle className="w-3.5 h-3.5 text-amber-300" />
                <span>{step === 'daily-challenge-solving' ? `Daily Q ${dailyIndex + 1} of ${dailyPuzzles.length}` : `Question ${currentPuzzleIndex + 1} of ${totalPuzzlesInSession}`}</span>
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-mono font-bold">
                Score: {step === 'daily-challenge-solving' ? dailyScore : sessionScore} Points
              </span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>Time: {formatTimer(elapsedSeconds)}</span>
              </span>
            </div>

            <button 
              onClick={() => speakText(activePuzzle.question, lang)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#E07A5F]" />
              <span>Listen</span>
            </button>
          </div>

          {/* Puzzle Question & Content */}
          <div className="space-y-4">
            <div className="text-xs font-mono text-indigo-600 uppercase font-bold tracking-wider">
              {activePuzzle.puzzleType} • {selectedTopic}
            </div>

            <h3 className="text-lg sm:text-xl font-display font-bold text-[#3D405B] leading-relaxed">
              {activePuzzle.question}
            </h3>

            {/* Multiple Choice Options or Text Input */}
            {activePuzzle.options && activePuzzle.options.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activePuzzle.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStudentAnswer(opt)}
                    className={`p-4 rounded-2xl border-2 font-sans font-bold text-sm text-left transition-all duration-200 flex items-center justify-between cursor-pointer hover:scale-101 ${
                      studentAnswer === opt
                        ? 'border-[#E07A5F] bg-[#FAF8F4] text-[#E07A5F] shadow-sm ring-1 ring-[#E07A5F]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${studentAnswer === opt ? 'border-[#E07A5F] bg-[#E07A5F] text-white' : 'border-gray-300'}`}>
                      {studentAnswer === opt && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E07A5F] font-sans text-sm text-gray-900 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Hint Area */}
          <div className="pt-2">
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 cursor-pointer bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Hint</span>
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 font-sans leading-relaxed">
                  <span className="font-bold block mb-1">AI Hint:</span>
                  {activePuzzle.hint}
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleCheckAnswer}
              disabled={!studentAnswer.trim()}
              className="px-6 py-3 rounded-2xl bg-[#E07A5F] hover:bg-[#d86d50] text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Submit Answer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK STEP (Correct / Incorrect) */}
      {step === 'feedback' && activePuzzle && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 ${isCorrect ? 'bg-emerald-50/50 border-emerald-250' : 'bg-rose-50/50 border-rose-250'}`}>
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <XCircle className="w-7 h-7" />
              </div>
            )}
            <div>
              <h3 className={`text-xl font-display font-extrabold ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                {isCorrect ? 'Correct! +10 Points' : 'Not Quite!'}
              </h3>
              <p className="text-xs text-gray-600 font-sans mt-0.5">
                {isCorrect ? 'Well solved! Proceed to next puzzle.' : `Hint: ${activePuzzle.hint}`}
              </p>
            </div>
          </div>

          <div className="bg-white/90 rounded-2xl p-5 border border-gray-200 space-y-3 shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block">Correct Answer</span>
              <span className="text-sm font-bold text-gray-900 font-sans">{activePuzzle.correctAnswer}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block">Explanation</span>
              <p className="text-xs text-gray-700 font-sans leading-relaxed mt-1">{activePuzzle.explanation}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!isCorrect && attempts < 2 ? (
              <button
                onClick={() => {
                  setStudentAnswer('');
                  setStep('solving');
                }}
                className="px-6 py-3 rounded-2xl bg-[#3D405B] text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:bg-[#2D3047]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            ) : null}

            <button
              onClick={handleNextPuzzleOrFinish}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{currentPuzzleIndex + 1 < totalPuzzlesInSession ? 'Next Puzzle' : 'Final Score'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DAILY CHALLENGE RESULT SCREEN */}
      {step === 'daily-challenge-result' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold text-[#3D405B]">🎉 Challenge Completed!</h3>
            <p className="text-xs text-gray-500">
              Daily AI Challenge for <span className="font-bold text-[#E07A5F]">{selectedClass}</span> successfully completed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold block">Score</span>
              <span className="text-2xl font-black font-mono text-emerald-700">{dailyCorrectCount} / 5</span>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-mono text-blue-800 uppercase font-bold block">Accuracy</span>
              <span className="text-2xl font-black font-mono text-blue-700">{Math.round((dailyCorrectCount / 5) * 100)}%</span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
              <span className="text-[10px] font-mono text-amber-800 uppercase font-bold block">Points Earned</span>
              <span className="text-2xl font-black font-mono text-amber-700">{dailyScore} / 50</span>
            </div>
          </div>

          {/* Topics to Improve */}
          <div className="bg-amber-50/50 border border-amber-250 rounded-2xl p-5 text-left space-y-2">
            <h4 className="font-display font-bold text-amber-900 text-xs uppercase tracking-wider">Topics to Improve:</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold border border-amber-200">Science</span>
              <span className="px-3 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold border border-amber-200">Fractions</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={handleStartDailyChallenge}
              className="px-6 py-3 rounded-2xl bg-[#3D405B] text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:bg-[#2D3047]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>[🔄 Try Again]</span>
            </button>
            <button
              onClick={() => setStep('group-hub')}
              className="px-6 py-3 rounded-2xl bg-[#E07A5F] hover:bg-[#d86d50] text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>[➡️ Continue Learning]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FINAL SCORE & PROGRESS SAVED & AI PROFILE UPDATE */}
      {step === 'final-score' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold text-[#3D405B]">Puzzle Session Completed!</h3>
            <p className="text-xs text-gray-500">
              You successfully completed the session for <span className="font-bold text-[#E07A5F]">{selectedClass}</span> • {selectedSubject}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold block">Final Score (XP)</span>
              <span className="text-2xl font-black font-mono text-emerald-700">+{sessionScore + 20} XP</span>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
              <span className="text-[10px] font-mono text-blue-800 uppercase font-bold block">Correct Puzzles</span>
              <span className="text-2xl font-black font-mono text-blue-700">{sessionCorrectCount} / {totalPuzzlesInSession}</span>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200">
              <span className="text-[10px] font-mono text-purple-800 uppercase font-bold block">Progress Saved</span>
              <span className="text-xs font-bold text-purple-900 block mt-1">Synced to Profile</span>
            </div>
          </div>

          {/* AI Updates Learning Profile & Next Personalized Challenge */}
          <div className="bg-indigo-50/60 border border-indigo-250 rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              <h4 className="font-display font-bold text-indigo-900 text-sm">AI Updates Learning Profile</h4>
            </div>
            <p className="text-xs text-indigo-800 font-sans leading-relaxed">
              {aiProfileUpdate}
            </p>
            <div className="pt-2 border-t border-indigo-200/60 flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{nextChallengeIdea}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setStep('group-hub');
              }}
              className="px-6 py-3 rounded-2xl bg-[#3D405B] text-white font-sans font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:bg-[#2D3047]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Puzzle Hub</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
