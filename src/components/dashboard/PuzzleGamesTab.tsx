import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, User } from '../../types';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Sparkles, Gamepad2, Brain, Flame, Clock, Award, CheckCircle2, 
  XCircle, Lightbulb, Volume2, VolumeX, RotateCcw, ArrowRight, 
  ChevronRight, RefreshCw, Zap, Star, Compass, Layers, 
  Atom, Binary, Check, Shuffle, Trophy, BookOpen, 
  Activity, Play, Info, ArrowUp, ArrowDown, Target, Globe, GraduationCap
} from 'lucide-react';
import { fireConfetti } from '../../utils/confetti';

interface PuzzleGamesTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

export type PuzzleType = 
  | 'number_grid' 
  | 'food_chain' 
  | 'circuit_puzzle' 
  | 'history_timeline' 
  | 'memory_match' 
  | 'odd_one_out';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// Reliable Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Guaranteed non-sequential shuffle for ordering puzzles
function guaranteeNonSequential<T extends { id: string }>(items: T[], correctOrder: string[]): T[] {
  if (items.length <= 1) return items;
  let attempts = 0;
  let shuffled = shuffleArray(items);
  while (attempts < 10 && JSON.stringify(shuffled.map(x => x.id)) === JSON.stringify(correctOrder)) {
    shuffled = shuffleArray(items);
    attempts++;
  }
  return shuffled;
}

// Multi-language Translations for the Puzzle Arena Page
export const PUZZLE_I18N: Record<LanguageCode, Record<string, string>> = {
  en: {
    arenaTitle: 'AI Puzzle Arena',
    arenaSubtitle: 'Interactive brain challenges generated and evaluated by AI for your grade',
    gradeFromSettings: 'Grade (Settings)',
    langFromSettings: 'Language',
    solvedPuzzles: 'Solved',
    streak: 'Streak',
    points: 'XP',
    difficultyLabel: 'Difficulty',
    allGamesTitle: 'All Challenges',
    allGamesDesc: 'Varied educational brain teasers',
    numberGridTitle: 'Number Grid',
    foodChainTitle: 'Food Chain',
    circuitTitle: 'Physics Circuit',
    timelineTitle: 'History Timeline',
    memoryTitle: 'Memory Match',
    oddOneTitle: 'Odd One Out',
    numberGridDesc: 'Arithmetic equations and logic matrix',
    foodChainDesc: 'Organize trophic levels from producers to predators',
    circuitDesc: 'Assemble working electrical schematic loops',
    timelineDesc: 'Order historical eras and scientific breakthroughs',
    memoryDesc: 'Pair terms, formulas, and definitions',
    oddOneDesc: 'Identify the conceptual anomaly',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    newPuzzleBtn: 'Generate New Puzzle',
    generating: 'Generating AI Puzzle...',
    evaluating: 'AI Evaluating...',
    hintBtn: 'AI Hint',
    listenBtn: 'Listen',
    stopBtn: 'Stop',
    submitBtn: 'Submit Answer',
    nextPuzzleBtn: 'Next Puzzle ➔',
    tryAgainBtn: 'Try Again',
    solvedCongrats: 'Brilliant! Puzzle Solved Correctly!',
    incorrectMessage: 'Not quite right. Review the AI feedback below and try again!',
    aiFeedbackTitle: 'AI Pedagogical Analysis',
    keyTakeaway: 'Key Scientific Takeaway',
    recommendedNext: 'Recommended Next Step',
    timeTaken: 'Time Taken',
    seconds: 's',
    score: 'Score',
    flips: 'Flips',
    matches: 'Matches',
    selectOddPrompt: 'Select the item that does NOT belong with the others:',
    orderPrompt: 'Arrange items in the correct order (top to bottom):',
    circuitPrompt: 'Select the missing components to complete the electrical circuit:',
    gridPrompt: 'Fill in the missing values to balance all rows and columns:',
    memoryPrompt: 'Flip cards to find and match corresponding concept pairs:',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    resetOrder: 'Reset Order',
    gradeBadge: 'Grade',
  },
  hi: {
    arenaTitle: 'एआई पहेली अखाड़ा',
    arenaSubtitle: 'आपकी कक्षा के लिए एआई द्वारा निर्मित और मूल्यांकित इंटरैक्टिव दिमागी खेल',
    gradeFromSettings: 'कक्षा (सेटिंग्स)',
    langFromSettings: 'भाषा',
    solvedPuzzles: 'हल किए',
    streak: 'लगातार',
    points: 'अंक',
    difficultyLabel: 'कठिनाई स्तर',
    allGamesTitle: 'सभी खेल',
    allGamesDesc: 'हर बार अलग और रोचक खेल',
    numberGridTitle: 'गणित ग्रिड',
    foodChainTitle: 'खाद्य श्रृंखला',
    circuitTitle: 'विद्युत परिपथ',
    timelineTitle: 'इतिहास कालक्रम',
    memoryTitle: 'स्मृति मिलान',
    oddOneTitle: 'असंगत पहचान',
    numberGridDesc: 'अंकगणितीय समीकरण और तर्क मैट्रिक्स',
    foodChainDesc: 'उत्पादकों से शीर्ष शिकारियों तक क्रमबद्ध करें',
    circuitDesc: 'विद्युत परिपथ में सही घटक लगाएं',
    timelineDesc: 'ऐतिहासिक घटनाओं को कालक्रमानुसार लगाएं',
    memoryDesc: 'संकल्पनाओं और सूत्रों के जोड़े बनाएं',
    oddOneDesc: 'समूह से अलग तत्व की पहचान करें',
    easy: 'सरल',
    medium: 'मध्यम',
    hard: 'कठिन',
    newPuzzleBtn: 'नई पहेली बनाएं',
    generating: 'एआई पहेली तैयार हो रही है...',
    evaluating: 'एआई मूल्यांकन कर रहा है...',
    hintBtn: 'एआई संकेत',
    listenBtn: 'सुनें',
    stopBtn: 'रोकें',
    submitBtn: 'उत्तर सबमिट करें',
    nextPuzzleBtn: 'अगली पहेली ➔',
    tryAgainBtn: 'पुनः प्रयास करें',
    solvedCongrats: 'अद्भुत! आपने पहेली को सही हल किया!',
    incorrectMessage: 'उत्तर पूरी तरह सही नहीं है। नीचे एआई फीडबैक देखें और फिर से प्रयास करें!',
    aiFeedbackTitle: 'एआई शैक्षणिक विश्लेषण',
    keyTakeaway: 'मुख्य वैज्ञानिक सीख',
    recommendedNext: 'अनुशंसित अगला कदम',
    timeTaken: 'लिया गया समय',
    seconds: 'सेकंड',
    score: 'अंक',
    flips: 'पलटे कार्ड',
    matches: 'जोड़े',
    selectOddPrompt: 'वह विकल्प चुनें जो अन्य से मेल नहीं खाता:',
    orderPrompt: 'तत्वों को सही क्रम में व्यवस्थित करें (ऊपर से नीचे):',
    circuitPrompt: 'परिपथ पूरा करने के लिए लुप्त घटक चुनें:',
    gridPrompt: 'पंक्तियों और स्तंभों को संतुलित करने के लिए सही मान भरें:',
    memoryPrompt: 'अवधारणाओं के सही जोड़े खोजने के लिए कार्ड पलटें:',
    moveUp: 'ऊपर करें',
    moveDown: 'नीचे करें',
    resetOrder: 'पुनर्स्थापित करें',
    gradeBadge: 'कक्षा',
  },
  gu: {
    arenaTitle: 'AI કોયડા મેદાન',
    arenaSubtitle: 'તમારા ધોરણ માટે AI દ્વારા બનાવેલ અને મૂલ્યાંકન કરેલ મગજની રમતો',
    gradeFromSettings: 'ધોરણ (સેટિંગ્સ)',
    langFromSettings: 'ભાષા',
    solvedPuzzles: 'ઉકેલેલા',
    streak: 'સતત',
    points: 'XP',
    allGamesTitle: 'મિશ્ર કોયડા',
    allGamesDesc: 'દરેક વખતે અલગ કોયડો',
    numberGridTitle: 'સંખ્યા ગ્રીડ',
    foodChainTitle: 'આહાર શૃંખલા',
    circuitTitle: 'વિદ્યુત પરિપથ',
    timelineTitle: 'ઇતિહાસ સમયરેખા',
    memoryTitle: 'યાદશક્તિ મેચ',
    oddOneTitle: 'અલગ તારવો',
    numberGridDesc: 'ગણિત સમીકરણો અને તર્ક ગ્રીડ',
    foodChainDesc: 'ઉત્પાદકોથી માંસાહારી સુધી ક્રમબદ્ધ કરો',
    circuitDesc: 'વીજળી પરિપથ પૂર્ણ કરો',
    timelineDesc: 'ઘટનાઓને કાળક્રમે ગોઠવો',
    memoryDesc: 'સૂત્રો અને વ્યાખ્યાઓની જોડી બનાવો',
    oddOneDesc: 'જૂથથી અલગ પડતો ઘટક શોધો',
    easy: 'સરળ',
    medium: 'મધ્યમ',
    hard: 'કઠિન',
    newPuzzleBtn: 'નવો કોયડો બનાવો',
    generating: 'AI કોયડો બની રહ્યો છે...',
    evaluating: 'AI મૂલ્યાંકન કરી રહ્યું છે...',
    hintBtn: 'AI સંકેત',
    listenBtn: 'સાંભળો',
    stopBtn: 'રોકો',
    submitBtn: 'જવાબ સબમિટ કરો',
    nextPuzzleBtn: 'આગળનો કોયડો ➔',
    tryAgainBtn: 'ફરી પ્રયાસ કરો',
    solvedCongrats: 'ખૂબ સરસ! કોયડો સાચો ઉકેલ્યો!',
    incorrectMessage: 'જવાબ સાચો નથી. નીચેનું AI ફીડબેક જુઓ!',
    aiFeedbackTitle: 'AI શૈક્ષણિક વિશ્લેષણ',
    keyTakeaway: 'મુખ્ય વૈજ્ઞાનિક સમજ',
    recommendedNext: 'આગલું પગલું',
    timeTaken: 'લીધેલો સમય',
    seconds: 'સેકન્ડ',
    score: 'ગુણ',
    flips: 'કાર્ડ ફ્લિપ',
    matches: 'જોડીઓ',
    selectOddPrompt: 'અન્ય ઘટકો સાથે મેળ ન ખાતો વિકલ્પ પસંદ કરો:',
    orderPrompt: 'ઘટકોને સાચા ક્રમમાં ગોઠવો:',
    circuitPrompt: 'પરિપથ પૂર્ણ કરવા માટે ખૂટતા ઘટક પસંદ કરો:',
    gridPrompt: 'બધા સમીકરણો સંતુલિત કરવા માટે ખાલી જગ્યા ભરો:',
    memoryPrompt: 'સંકલ્પનાઓની જોડી શોધવા કાર્ડ પલટો:',
    moveUp: 'ઉપર કરો',
    moveDown: 'નીચે કરો',
    resetOrder: 'રીસેટ',
    gradeBadge: 'ધોરણ',
  },
  mr: {
    arenaTitle: 'एआय कोडे मैदान',
    arenaSubtitle: 'तुमच्या इयत्तेसाठी एआय द्वारे तयार आणि मूल्यमापन केलेले बौद्धिक खेळ',
    gradeFromSettings: 'इयत्ता (सेटिंग्ज)',
    langFromSettings: 'भाषा',
    solvedPuzzles: 'सोडवलेले',
    streak: 'सातत्य',
    points: 'XP',
    allGamesTitle: 'मिश्र आव्हाने',
    allGamesDesc: 'विविध शैक्षणिक खेळ',
    numberGridTitle: 'गणित ग्रिड',
    foodChainTitle: 'अन्न साखळी',
    circuitTitle: 'विद्युत परिपथ',
    timelineTitle: 'इतिहास कालरेषा',
    memoryTitle: 'स्मृती जुळवणी',
    oddOneTitle: 'विसंगत घटक',
    numberGridDesc: 'अंकगणित समीकरणे आणि तर्कशास्त्र',
    foodChainDesc: 'उत्पादकांपासून भक्षकांपर्यंत योग्य क्रम लावा',
    circuitDesc: 'विद्युत परिपथ योग्य घटकांसह पूर्ण करा',
    timelineDesc: 'ऐतिहासिक घटना योग्य क्रमाने लावा',
    memoryDesc: 'संकल्पना आणि सूत्रांच्या जोड्या जुळवा',
    oddOneDesc: 'गटात न बसणारा घटक ओळखा',
    easy: 'सोपे',
    medium: 'मध्यम',
    hard: 'कठीण',
    newPuzzleBtn: 'नवीन कोडे तयार करा',
    generating: 'एआय कोडे तयार होत आहे...',
    evaluating: 'एआय मूल्यमापन करत आहे...',
    hintBtn: 'एआय संकेत',
    listenBtn: 'ऐका',
    stopBtn: 'थांबवा',
    submitBtn: 'उत्तर सबमिट करा',
    nextPuzzleBtn: 'पुढील कोडे ➔',
    tryAgainBtn: 'पुन्हा प्रयत्न करा',
    solvedCongrats: 'उत्कृष्ट! कोडे अगदी बरोबर सोडवले!',
    incorrectMessage: 'उत्तर बरोबर नाही. खालील एआय विश्लेषण वाचा आणि पुन्हा प्रयत्न करा!',
    aiFeedbackTitle: 'एआय शैक्षणिक विश्लेषण',
    keyTakeaway: 'मुख्य वैज्ञानिक शिकवण',
    recommendedNext: 'पुढील शिफारस',
    timeTaken: 'घेतलेला वेळ',
    seconds: 'सेकंद',
    score: 'गुण',
    flips: 'उलटलेले कार्ड',
    matches: 'जोड्या',
    selectOddPrompt: 'गटाशी न जुळणारा घटक निवडा:',
    orderPrompt: 'घटक योग्य क्रमाने लावा:',
    circuitPrompt: 'परिपथ पूर्ण करण्यासाठी योग्य घटक निवडा:',
    gridPrompt: 'सर्व समीकरणे संतुलित करण्यासाठी संख्या भरा:',
    memoryPrompt: 'संकल्पनांच्या जोड्या शोधण्यासाठी कार्ड उलटा:',
    moveUp: 'वर घ्या',
    moveDown: 'खाली घ्या',
    resetOrder: 'रीसेट करा',
    gradeBadge: 'इयत्ता',
  },
  ta: {
    arenaTitle: 'AI புதிர்கள் அரங்கம்',
    arenaSubtitle: 'உங்கள் வகுப்பிற்கு ஏற்ப AI உருவாக்கிய கல்வி சார்ந்த சிந்தனை விளையாட்டுகள்',
    gradeFromSettings: 'வகுப்பு (அமைப்புகள்)',
    langFromSettings: 'மொழி',
    solvedPuzzles: 'தீர்க்கப்பட்டவை',
    streak: 'தொடர்ச்சி',
    points: 'XP',
    allGamesTitle: 'கலவை புதிர்கள்',
    allGamesDesc: 'பல்வேறு சிந்தனை விளையாட்டுகள்',
    numberGridTitle: 'எண் கட்டம்',
    foodChainTitle: 'உணவு சங்கிலி',
    circuitTitle: 'மின்னியல் சுற்று',
    timelineTitle: 'வரலாற்று வரிசை',
    memoryTitle: 'நினைவாற்றல் போட்டி',
    oddOneTitle: 'வேறுபட்டது எது',
    numberGridDesc: 'கணித சமன்பாடுகள் மற்றும் தர்க்க கட்டம்',
    foodChainDesc: 'உற்பத்தியாளர்கள் முதல் வேட்டையாடுபவர்கள் வரை வரிசைப்படுத்துங்கள்',
    circuitDesc: 'மின்சுற்றை முழுமையாக்குங்கள்',
    timelineDesc: 'வரலாற்று நிகழ்வுகளை காலவரிசைப்படுத்துங்கள்',
    memoryDesc: 'கருத்துகள் மற்றும் சூத்திரங்களை பொருத்துங்கள்',
    oddOneDesc: 'குழுவில் பொருந்தாததை கண்டறியுங்கள்',
    easy: 'எளிது',
    medium: 'நடுத்தரம்',
    hard: 'கடினம்',
    newPuzzleBtn: 'புதிய புதிர் உருவாக்கு',
    generating: 'AI புதிர் தயாராகிறது...',
    evaluating: 'AI மதிப்பிடுகிறது...',
    hintBtn: 'AI குறிப்பு',
    listenBtn: 'கேளுங்கள்',
    stopBtn: 'நிறுத்து',
    submitBtn: 'விடையை சமர்ப்பி',
    nextPuzzleBtn: 'அடுத்த புதிர் ➔',
    tryAgainBtn: 'மீண்டும் முயற்சி செய்',
    solvedCongrats: 'அற்புதம்! புதிர் சரியாக தீர்க்கப்பட்டது!',
    incorrectMessage: 'விடை சரியாக இல்லை. AI வழிகாட்டுதலைப் பார்த்து மீண்டும் முயலுங்கள்!',
    aiFeedbackTitle: 'AI கல்வி பகுப்பாய்வு',
    keyTakeaway: 'முக்கிய அறிவியல் கருத்து',
    recommendedNext: 'அடுத்த பரிந்துரை',
    timeTaken: 'எடுத்துக்கொண்ட நேரம்',
    seconds: 'வினாடிகள்',
    score: 'மதிப்பெண்',
    flips: 'திருப்பிய அட்டைகள்',
    matches: 'பொருத்தங்கள்',
    selectOddPrompt: 'பொருந்தாத ஒன்றை தேர்ந்தெடுக்கவும்:',
    orderPrompt: 'சரியான வரிசையில் அடுக்கவும்:',
    circuitPrompt: 'மின்சுற்றை பூர்த்தி செய்ய தேவையான கூறுகளை தேர்ந்தெடுக்கவும்:',
    gridPrompt: 'சமன்பாடுகளை சரிசெய்ய விடுபட்ட எண்களை நிரப்பவும்:',
    memoryPrompt: 'பொருந்தும் இணைகளை கண்டுபிடிக்க அட்டைகளை திருப்புங்கள்:',
    moveUp: 'மேலே',
    moveDown: 'கீழே',
    resetOrder: 'மீட்டமை',
    gradeBadge: 'வகுப்பு',
  },
  te: {
    arenaTitle: 'AI పజిల్ అరేనా',
    arenaSubtitle: 'మీ తరగతి కోసం AI రూపొందించిన మేధో విద్యా ఆటలు',
    gradeFromSettings: 'తరగతి (సెట్టింగ్‌లు)',
    langFromSettings: 'భాష',
    solvedPuzzles: 'పరిష్కరించినవి',
    streak: 'వరుస క్రమం',
    points: 'XP',
    allGamesTitle: 'మిశ్రమ ఆటలు',
    allGamesDesc: 'రకరకాల విద్యా పజిల్స్',
    numberGridTitle: 'నంబర్ గ్రిడ్',
    foodChainTitle: 'ఆహార గొలుసు',
    circuitTitle: 'విద్యుత్ వలయం',
    timelineTitle: 'చారిత్రక కాలరేఖ',
    memoryTitle: 'జ్ఞాపకశక్తి మ్యాచింగ్',
    oddOneTitle: 'భిన్నమైనది గుర్తించండి',
    numberGridDesc: 'గణిత సమీకరణాలు మరియు తర్క గ్రిడ్',
    foodChainDesc: 'ఉత్పత్తిదారుల నుండి పరాన్నజీవుల వరకు క్రమం చేయండి',
    circuitDesc: 'విద్యుత్ వలయాన్ని సరైన భాగాలతో పూర్తి చేయండి',
    timelineDesc: 'చారిత్రక సంఘటనలను కాలక్రమంలో అమర్చండి',
    memoryDesc: 'సూత్రాలు మరియు భావనల జతలను కలపండి',
    oddOneDesc: 'సమూహానికి చెందని అంశాన్ని గుర్తించండి',
    easy: 'సులభం',
    medium: 'మధ్యస్థం',
    hard: 'కఠినం',
    newPuzzleBtn: 'కొత్త పజిల్ సృష్టించండి',
    generating: 'AI పజిల్ తయారవుతోంది...',
    evaluating: 'AI మూల్యాంకనం చేస్తోంది...',
    hintBtn: 'AI సూచన',
    listenBtn: 'వినండి',
    stopBtn: 'ఆపండి',
    submitBtn: 'సమాధానం సమర్పించండి',
    nextPuzzleBtn: 'తదుపరి పజిల్ ➔',
    tryAgainBtn: 'మళ్ళీ ప్రయత్నించండి',
    solvedCongrats: 'అద్భుతం! పజిల్‌ను సరిగ్గా పరిష్కరించారు!',
    incorrectMessage: 'సమాధానం సరైనది కాదు. క్రింద ఉన్న AI ఫీడ్‌బ్యాక్ చూసి మళ్ళీ ప్రయత్నించండి!',
    aiFeedbackTitle: 'AI విద్యా విశ్లేషణ',
    keyTakeaway: 'ప్రధాన శాస్త్రీయ అంశం',
    recommendedNext: 'తదుపరి సిఫార్సు',
    timeTaken: 'తీసుకున్న సమయం',
    seconds: 'సెకన్లు',
    score: 'స్కోరు',
    flips: 'తిప్పిన కార్డులు',
    matches: 'జతలు',
    selectOddPrompt: 'సరిపోలని అంశాన్ని ఎంచుకోండి:',
    orderPrompt: 'సరైన క్రమంలో అమర్చండి:',
    circuitPrompt: 'వలయం పూర్తి చేయడానికి అవసరమైన భాగాన్ని ఎంచుకోండి:',
    gridPrompt: 'సమీకరణాలను సమతుల్యం చేయడానికి సంఖ్యలను పూరించండి:',
    memoryPrompt: 'భావనల జతలను కనుగొనడానికి కార్డులను తిప్పండి:',
    moveUp: 'పైకి',
    moveDown: 'క్రిందికి',
    resetOrder: 'రీసెట్ చేయండి',
    gradeBadge: 'తరగతి',
  }
};

export default function PuzzleGamesTab({ user, lang, onUpdateUser }: PuzzleGamesTabProps) {
  // Use active language from props / settings with fallback
  const activeLang = lang || user.defaultLanguage || 'en';
  const t = PUZZLE_I18N[activeLang] || PUZZLE_I18N.en;

  // Grade is directly fetched from user settings/profile
  const activeGrade = user.standard || 'Class 8';

  // Game Type Selection State
  const [selectedGameType, setSelectedGameType] = useState<PuzzleType>('number_grid');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');

  // Request counter and title history to guarantee different puzzle on EVERY click
  const requestCounterRef = useRef<number>(0);
  const recentPuzzleTitlesRef = useRef<string[]>([]);

  // Active Puzzle State
  const [activePuzzle, setActivePuzzle] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Game Play States
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const [puzzlesSolved, setPuzzlesSolved] = useState<number>(user.puzzlesSolved || 0);
  const [puzzlesAttempted, setPuzzlesAttempted] = useState<number>(user.puzzlesAttempted || 0);
  const [puzzleStreak, setPuzzleStreak] = useState<number>(user.puzzleStreak || 0);

  // Memory Match Specific
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [memoryFlippedIndices, setMemoryFlippedIndices] = useState<number[]>([]);
  const [memoryMatchedIds, setMemoryMatchedIds] = useState<string[]>([]);
  const [memoryMoves, setMemoryMoves] = useState<number>(0);

  // Sync user state
  useEffect(() => {
    if (user.puzzlesSolved !== undefined) setPuzzlesSolved(user.puzzlesSolved);
    if (user.puzzlesAttempted !== undefined) setPuzzlesAttempted(user.puzzlesAttempted);
    if (user.puzzleStreak !== undefined) setPuzzleStreak(user.puzzleStreak);
  }, [user]);

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Initial load or when activeGrade / activeLang changes
  useEffect(() => {
    generateNewPuzzle(selectedGameType, activeGrade, difficulty, activeLang);
    return () => {
      stopSpeaking();
    };
  }, [activeGrade, activeLang]);

  // Main Generator Function (Guarantees brand new puzzle on every call)
  const generateNewPuzzle = async (
    type: PuzzleType = selectedGameType,
    grade: string = activeGrade,
    diff: DifficultyLevel = difficulty,
    targetLang: LanguageCode = activeLang
  ) => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsLoading(true);
    setErrorMsg(null);
    setActivePuzzle(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setIsCorrect(false);
    setAiAnalysis(null);
    setShowHint(false);
    setSecondsElapsed(0);
    setTimerActive(false);
    setMemoryFlippedIndices([]);
    setMemoryMatchedIds([]);
    setMemoryMoves(0);

    requestCounterRef.current += 1;

    try {
      const uniqueEntropy = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}_req${requestCounterRef.current}`;
      const response = await fetch('/api/gemini/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleType: type,
          studentName: user.name || 'Student',
          studentClass: grade,
          difficulty: diff,
          lang: targetLang,
          puzzleNumber: puzzlesAttempted + requestCounterRef.current,
          entropy: uniqueEntropy
        })
      });

      const data = await response.json();
      if (!data.success || !data.puzzle) {
        throw new Error(data.message || 'Failed to generate puzzle');
      }

      const puzzle = data.puzzle;
      recentPuzzleTitlesRef.current = [puzzle.title, ...recentPuzzleTitlesRef.current.slice(0, 10)];
      setActivePuzzle(puzzle);
      setTimerActive(true);

      // Initialize interactive data structures with guaranteed random shuffling
      if (type === 'memory_match' && puzzle.interactiveData?.pairs) {
        const deck: any[] = [];
        puzzle.interactiveData.pairs.forEach((pair: any, idx: number) => {
          deck.push({
            id: `card_${idx}_a`,
            pairId: pair.pairId || `pair_${idx}`,
            text: pair.label,
            icon: pair.icon || '💡',
            isMatchTarget: false
          });
          deck.push({
            id: `card_${idx}_b`,
            pairId: pair.pairId || `pair_${idx}`,
            text: pair.matchLabel,
            icon: pair.icon || '💡',
            isMatchTarget: true
          });
        });
        // Shuffle deck
        setMemoryCards(shuffleArray(deck));
      } else if (type === 'food_chain' && puzzle.interactiveData?.items) {
        const rawItems = puzzle.interactiveData.items;
        const correctOrder = puzzle.interactiveData.correctOrder || rawItems.map((i: any) => i.id);
        const randomized = guaranteeNonSequential(rawItems, correctOrder);
        setUserAnswers({
          currentOrder: randomized.map((i: any) => i.id)
        });
      } else if (type === 'history_timeline' && puzzle.interactiveData?.events) {
        const rawEvents = puzzle.interactiveData.events;
        const correctOrder = puzzle.interactiveData.correctOrder || rawEvents.map((e: any) => e.id);
        const randomized = guaranteeNonSequential(rawEvents, correctOrder);
        setUserAnswers({
          currentOrder: randomized.map((e: any) => e.id)
        });
      } else if (type === 'circuit_puzzle' && puzzle.interactiveData?.availableComponents) {
        // Shuffle available component choices
        puzzle.interactiveData.availableComponents = shuffleArray(puzzle.interactiveData.availableComponents);
        setUserAnswers({
          placedComponents: {}
        });
      } else if (type === 'odd_one_out' && puzzle.interactiveData?.items) {
        // Shuffle items so odd item position is completely random
        puzzle.interactiveData.items = shuffleArray(puzzle.interactiveData.items);
        setUserAnswers({
          selectedOddId: null
        });
      } else if (type === 'number_grid') {
        setUserAnswers({
          inputs: {}
        });
      }

    } catch (err: any) {
      console.error("[Puzzle Generator UI Error]:", err);
      setErrorMsg(activeLang === 'hi' 
        ? "पहेली लोड नहीं हो सकी। कृपया पुनः प्रयास करें।" 
        : "Could not load AI puzzle. Please try refreshing or picking another game mode.");
    } finally {
      setIsLoading(false);
    }
  };

  // Switch Game Mode
  const handleSelectGameType = (type: PuzzleType) => {
    setSelectedGameType(type);
    generateNewPuzzle(type, activeGrade, difficulty, activeLang);
  };

  // Switch Difficulty Level (Easy, Medium, Hard)
  const handleSelectDifficulty = (newDiff: DifficultyLevel) => {
    if (isLoading) return;
    setDifficulty(newDiff);
    generateNewPuzzle(selectedGameType, activeGrade, newDiff, activeLang);
  };

  // Toggle Speech
  const handleToggleSpeech = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, activeLang, user.avatar || 'Guru', '🎓', () => {
        setIsSpeaking(false);
      });
    }
  };

  // Move Item Up / Down in Order (Food Chain & History Timeline)
  const moveItemInOrder = (arrayKey: string, fromIndex: number, toIndex: number) => {
    if (isSubmitted) return;
    const current = [...(userAnswers[arrayKey] || [])];
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setUserAnswers({
      ...userAnswers,
      [arrayKey]: current
    });
  };

  // Handle Memory Card Click
  const handleCardClick = (cardIndex: number) => {
    if (isSubmitted || memoryFlippedIndices.includes(cardIndex)) return;
    const card = memoryCards[cardIndex];
    if (memoryMatchedIds.includes(card.pairId)) return;

    if (memoryFlippedIndices.length === 0) {
      setMemoryFlippedIndices([cardIndex]);
    } else if (memoryFlippedIndices.length === 1) {
      const firstIndex = memoryFlippedIndices[0];
      const firstCard = memoryCards[firstIndex];
      setMemoryMoves(prev => prev + 1);
      setMemoryFlippedIndices([firstIndex, cardIndex]);

      if (firstCard.pairId === card.pairId && firstCard.id !== card.id) {
        // Matched!
        setTimeout(() => {
          setMemoryMatchedIds(prev => [...prev, card.pairId]);
          setMemoryFlippedIndices([]);
        }, 500);
      } else {
        // Not matched
        setTimeout(() => {
          setMemoryFlippedIndices([]);
        }, 1100);
      }
    }
  };

  // Submit & AI Evaluation
  const handleSubmitPuzzle = async () => {
    if (!activePuzzle || isSubmitted) return;

    setTimerActive(false);
    setIsEvaluating(true);

    let evaluatedCorrect = false;

    if (activePuzzle.puzzleType === 'food_chain') {
      const correctOrder = activePuzzle.interactiveData?.correctOrder || [];
      const currentOrder = userAnswers.currentOrder || [];
      evaluatedCorrect = JSON.stringify(correctOrder) === JSON.stringify(currentOrder);
    } else if (activePuzzle.puzzleType === 'history_timeline') {
      const correctOrder = activePuzzle.interactiveData?.correctOrder || [];
      const currentOrder = userAnswers.currentOrder || [];
      evaluatedCorrect = JSON.stringify(correctOrder) === JSON.stringify(currentOrder);
    } else if (activePuzzle.puzzleType === 'circuit_puzzle') {
      const missingSlots = activePuzzle.interactiveData?.missingSlots || [];
      const placed = userAnswers.placedComponents || {};
      evaluatedCorrect = missingSlots.every((slot: any) => placed[slot.slotIndex] === slot.correctComponentId);
    } else if (activePuzzle.puzzleType === 'number_grid') {
      const missingPositions = activePuzzle.interactiveData?.missingPositions || [];
      const rows = activePuzzle.interactiveData?.rows || [];
      const inputs = userAnswers.inputs || {};
      
      if (missingPositions.length > 0) {
        evaluatedCorrect = missingPositions.every((pos: any) => {
          const userVal = inputs[pos.id] || inputs[pos.cellId] || inputs[`cell_${pos.row}_${pos.col}`];
          return Number(userVal) === Number(pos.expectedVal);
        });
      } else if (rows.length > 0) {
        let allCorrect = true;
        rows.forEach((row: any, rIdx: number) => {
          row.cells?.forEach((cell: any, cIdx: number) => {
            if (cell.isMissing) {
              const cellKey = cell.id || cell.cellId || `cell_${rIdx}_${cIdx}`;
              const userVal = inputs[cellKey] || inputs[`cell_${rIdx}_${cIdx}`];
              const expected = cell.expectedVal ?? cell.value;
              if (Number(userVal) !== Number(expected)) {
                allCorrect = false;
              }
            }
          });
        });
        evaluatedCorrect = allCorrect;
      }
    } else if (activePuzzle.puzzleType === 'memory_match') {
      const totalPairs = activePuzzle.interactiveData?.pairs?.length || 4;
      evaluatedCorrect = memoryMatchedIds.length >= totalPairs;
    } else if (activePuzzle.puzzleType === 'odd_one_out') {
      const correctOddId = activePuzzle.interactiveData?.oddItemId;
      evaluatedCorrect = userAnswers.selectedOddId === correctOddId;
    }

    setIsCorrect(evaluatedCorrect);
    setIsSubmitted(true);

    if (evaluatedCorrect) {
      fireConfetti();
    }

    // Update Stats
    const newAttempted = puzzlesAttempted + 1;
    const newSolved = evaluatedCorrect ? puzzlesSolved + 1 : puzzlesSolved;
    const newStreak = evaluatedCorrect ? puzzleStreak + 1 : 0;
    const xpEarned = evaluatedCorrect ? (secondsElapsed <= 45 ? 100 : 75) : 25;
    const newTotalPoints = (user.totalPoints || 0) + xpEarned;

    setPuzzlesAttempted(newAttempted);
    setPuzzlesSolved(newSolved);
    setPuzzleStreak(newStreak);

    onUpdateUser({
      puzzlesAttempted: newAttempted,
      puzzlesSolved: newSolved,
      puzzleStreak: newStreak,
      totalPoints: newTotalPoints
    });

    // Request AI Evaluation in activeLang
    try {
      const evalRes = await fetch('/api/gemini/analyze-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzle: activePuzzle,
          userSubmission: userAnswers,
          isCorrect: evaluatedCorrect,
          studentName: user.name || 'Student',
          timeTaken: secondsElapsed,
          lang: activeLang
        })
      });
      const evalData = await evalRes.json();
      if (evalData.success && evalData.analysis) {
        setAiAnalysis(evalData.analysis);
      }
    } catch (e) {
      console.warn("[AI Evaluation error]:", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Game Catalogue Configuration (Concrete games only)
  const gameTabs: { id: PuzzleType; title: string; desc: string; icon: any }[] = [
    { id: 'number_grid', title: t.numberGridTitle, desc: t.numberGridDesc, icon: Binary },
    { id: 'food_chain', title: t.foodChainTitle, desc: t.foodChainDesc, icon: Atom },
    { id: 'circuit_puzzle', title: t.circuitTitle, desc: t.circuitDesc, icon: Zap },
    { id: 'history_timeline', title: t.timelineTitle, desc: t.timelineDesc, icon: Clock },
    { id: 'memory_match', title: t.memoryTitle, desc: t.memoryDesc, icon: Brain },
    { id: 'odd_one_out', title: t.oddOneTitle, desc: t.oddOneDesc, icon: Target },
  ];

  return (
    <div id="ai-puzzle-arena-page" className="max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-6 text-gray-800">
      
      {/* 1. COMPACT & ELEGANT HEADER */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 tracking-tight">
              {t.arenaTitle}
            </h1>
          </div>
          <p className="text-xs text-gray-500 max-w-xl">
            {t.arenaSubtitle}
          </p>
        </div>

        {/* Sync Badges & Quick Stats */}
        <div className="flex items-center flex-wrap gap-2 sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 text-blue-800 border border-blue-200/70 rounded-xl text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
            <span>{activeGrade}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50/80 text-purple-800 border border-purple-200/70 rounded-xl text-xs font-semibold uppercase">
            <Globe className="h-3.5 w-3.5 text-purple-600" />
            <span>{activeLang}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-amber-600" />
            <span>{puzzleStreak} {t.streak}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 text-emerald-800 border border-emerald-200/70 rounded-xl text-xs font-bold">
            <Trophy className="h-3.5 w-3.5 text-emerald-600" />
            <span>{puzzlesSolved} {t.solvedPuzzles}</span>
          </div>
        </div>
      </div>

      {/* 2. GAME SELECTION & DIFFICULTY CONTROL HUB */}
      <div className="space-y-3">
        {/* Game Mode Grid (Clean, responsive, full puzzle names always fully visible) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {gameTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedGameType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectGameType(tab.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 sm:py-3.5 sm:px-2 rounded-2xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md ring-2 ring-violet-500/20'
                    : 'bg-white text-gray-700 border-gray-200/90 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-xs'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/15 text-violet-300' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="w-full px-0.5">
                  <span className="block font-bold text-xs sm:text-[13px] leading-tight text-center">
                    {tab.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Difficulty Level Selector Banner */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-3 sm:px-4 sm:py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
              {t.difficultyLabel || 'Difficulty'}:
            </span>
            <span className="hidden sm:inline text-gray-400 text-xs">• Select challenge intensity</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl w-full sm:w-auto">
            {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => {
              const isCurrent = difficulty === lvl;
              let activeStyle = 'bg-white text-gray-900 shadow-xs border border-gray-200';
              if (isCurrent && lvl === 'Easy') activeStyle = 'bg-emerald-600 text-white shadow-xs';
              if (isCurrent && lvl === 'Medium') activeStyle = 'bg-amber-600 text-white shadow-xs';
              if (isCurrent && lvl === 'Hard') activeStyle = 'bg-rose-600 text-white shadow-xs';

              const lvlLabel = lvl === 'Easy' ? t.easy : lvl === 'Medium' ? t.medium : t.hard;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSelectDifficulty(lvl)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? activeStyle
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <span>{lvl === 'Easy' ? '🌱' : lvl === 'Medium' ? '⚡' : '🔥'}</span>
                  <span>{lvlLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAIN GAME WORKSPACE */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden text-left">
        
        {/* Workspace Top Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {activePuzzle?.subject || 'Science & Logic'}
            </span>
            <span className="text-gray-300">•</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
              (activePuzzle?.difficulty || difficulty) === 'Easy'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : (activePuzzle?.difficulty || difficulty) === 'Hard'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {activePuzzle?.difficulty || difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className="flex items-center gap-1 text-xs font-mono text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span>{secondsElapsed}s</span>
            </div>

            {/* Read Aloud Audio */}
            {activePuzzle && (
              <button
                onClick={() => handleToggleSpeech(`${activePuzzle.title}. ${activePuzzle.question}. ${showHint ? activePuzzle.hint : ''}`)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  isSpeaking ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                title={isSpeaking ? t.stopBtn : t.listenBtn}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline text-[11px]">{isSpeaking ? t.stopBtn : t.listenBtn}</span>
              </button>
            )}

            {/* Hint Button */}
            {activePuzzle?.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                  showHint ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>{t.hintBtn}</span>
              </button>
            )}

            {/* Generate New Puzzle */}
            <button
              onClick={() => generateNewPuzzle(selectedGameType, activeGrade, difficulty, activeLang)}
              disabled={isLoading}
              className="px-3 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.newPuzzleBtn}</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-700">{t.generating}</p>
            <p className="text-xs text-gray-400">Tailoring unique challenges for {activeGrade}...</p>
          </div>
        )}

        {/* Error State */}
        {errorMsg && !isLoading && (
          <div className="p-8 text-center space-y-3">
            <XCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-xs text-gray-600">{errorMsg}</p>
            <button
              onClick={() => generateNewPuzzle(selectedGameType, activeGrade, difficulty, activeLang)}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t.tryAgainBtn}
            </button>
          </div>
        )}

        {/* Active Puzzle Canvas */}
        {!isLoading && !errorMsg && activePuzzle && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Puzzle Title & Instruction */}
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold font-display text-gray-900">
                {activePuzzle.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {activePuzzle.question}
              </p>
              {showHint && activePuzzle.hint && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fade-in">
                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>{t.hintBtn}:</strong> {activePuzzle.hint}</span>
                </div>
              )}
            </div>

            {/* GAME 1: FOOD CHAIN */}
            {activePuzzle.puzzleType === 'food_chain' && activePuzzle.interactiveData?.items && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  {t.orderPrompt}
                </div>
                <div className="space-y-2">
                  {(userAnswers.currentOrder || []).map((itemId: string, index: number) => {
                    const item = activePuzzle.interactiveData.items.find((i: any) => i.id === itemId);
                    if (!item) return null;
                    const isFirst = index === 0;
                    const isLast = index === (userAnswers.currentOrder.length - 1);

                    return (
                      <div
                        key={itemId}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xl">{item.emoji || '🌿'}</span>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                            {item.trophicLevel && (
                              <div className="text-[11px] text-gray-500 font-medium">{item.trophicLevel}</div>
                            )}
                          </div>
                        </div>

                        {!isSubmitted && (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={isFirst}
                              onClick={() => moveItemInOrder('currentOrder', index, index - 1)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                              title={t.moveUp}
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveItemInOrder('currentOrder', index, index + 1)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                              title={t.moveDown}
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GAME 2: HISTORY TIMELINE */}
            {activePuzzle.puzzleType === 'history_timeline' && activePuzzle.interactiveData?.events && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  {t.orderPrompt}
                </div>
                <div className="space-y-2">
                  {(userAnswers.currentOrder || []).map((eventId: string, index: number) => {
                    const evt = activePuzzle.interactiveData.events.find((e: any) => e.id === eventId);
                    if (!evt) return null;
                    const isFirst = index === 0;
                    const isLast = index === (userAnswers.currentOrder.length - 1);

                    return (
                      <div
                        key={eventId}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{evt.title}</div>
                            <div className="text-[11px] text-gray-500">{evt.description || evt.era}</div>
                          </div>
                        </div>

                        {!isSubmitted && (
                          <div className="flex items-center gap-1">
                            <button
                              disabled={isFirst}
                              onClick={() => moveItemInOrder('currentOrder', index, index - 1)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                              title={t.moveUp}
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveItemInOrder('currentOrder', index, index + 1)}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                              title={t.moveDown}
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GAME 3: ODD ONE OUT */}
            {activePuzzle.puzzleType === 'odd_one_out' && activePuzzle.interactiveData?.items && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  {t.selectOddPrompt}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePuzzle.interactiveData.items.map((item: any) => {
                    const isSelected = userAnswers.selectedOddId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setUserAnswers({ ...userAnswers, selectedOddId: item.id })}
                        className={`p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-400/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon || '🔬'}</span>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                            {item.detail && <div className="text-xs text-gray-500">{item.detail}</div>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GAME 4: MEMORY MATCH */}
            {activePuzzle.puzzleType === 'memory_match' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.memoryPrompt}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span>{t.flips}: {memoryMoves}</span>
                    <span>{t.matches}: {memoryMatchedIds.length}/{activePuzzle.interactiveData?.pairs?.length || 4}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {memoryCards.map((card, idx) => {
                    const isFlipped = memoryFlippedIndices.includes(idx) || memoryMatchedIds.includes(card.pairId);
                    const isMatched = memoryMatchedIds.includes(card.pairId);

                    return (
                      <button
                        key={card.id}
                        type="button"
                        disabled={isMatched || isSubmitted}
                        onClick={() => handleCardClick(idx)}
                        className={`h-24 p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isMatched
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : isFlipped
                            ? 'bg-white border-violet-400 shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200/80 border-gray-200 text-gray-400'
                        }`}
                      >
                        {isFlipped ? (
                          <>
                            <span className="text-xl mb-1">{card.icon}</span>
                            <span className="text-xs font-semibold leading-tight">{card.text}</span>
                          </>
                        ) : (
                          <Brain className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GAME 5: NUMBER GRID */}
            {activePuzzle.puzzleType === 'number_grid' && activePuzzle.interactiveData && (() => {
              const matrix = activePuzzle.interactiveData.matrix;
              const missingPositions = activePuzzle.interactiveData.missingPositions || [];
              const rawRows = activePuzzle.interactiveData.rows;
              
              const rows = rawRows || (matrix ? matrix.map((rowArr: string[], rIdx: number) => ({
                cells: rowArr.map((val: string, cIdx: number) => {
                  const isMissing = val.startsWith("?");
                  const missingObj = missingPositions.find((m: any) => m.id === val || m.cellId === `cell_${rIdx}_${cIdx}`);
                  const isOperator = ["+", "-", "×", "÷", "=", " "].includes(val);
                  return {
                    value: isMissing ? "?" : val,
                    isMissing,
                    isOperator,
                    cellId: `cell_${rIdx}_${cIdx}`,
                    id: isMissing ? (missingObj?.id || `cell_${rIdx}_${cIdx}`) : undefined,
                    expectedVal: missingObj?.expectedVal
                  };
                })
              })) : []);

              return (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {t.gridPrompt}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3">
                    {rows.map((row: any, rIdx: number) => (
                      <div key={rIdx} className="flex items-center gap-2">
                        {row.cells?.map((cell: any, cIdx: number) => {
                          const cellKey = cell.id || cell.cellId || `cell_${rIdx}_${cIdx}`;
                          const isMissing = cell.isMissing;

                          if (isMissing) {
                            return (
                              <input
                                key={cIdx}
                                type="number"
                                disabled={isSubmitted}
                                value={userAnswers.inputs?.[cellKey] || userAnswers.inputs?.[`cell_${rIdx}_${cIdx}`] || ''}
                                onChange={(e) => {
                                  setUserAnswers({
                                    ...userAnswers,
                                    inputs: { 
                                      ...(userAnswers.inputs || {}), 
                                      [cellKey]: e.target.value,
                                      [`cell_${rIdx}_${cIdx}`]: e.target.value 
                                    }
                                  });
                                }}
                                placeholder="?"
                                className="w-12 h-12 text-center text-base font-bold bg-white border-2 border-violet-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                              />
                            );
                          }

                          return (
                            <div
                              key={cIdx}
                              className={`w-12 h-12 flex items-center justify-center font-bold text-sm rounded-lg ${
                                cell.isOperator ? 'text-gray-400 text-lg' : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              {cell.value || cell.text}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {activePuzzle.interactiveData.candidateNumbers && (
                    <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-500">
                      <span className="font-medium">Candidates:</span>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        {activePuzzle.interactiveData.candidateNumbers.map((num: number, nIdx: number) => (
                          <span key={nIdx} className="px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 font-mono font-semibold rounded">
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* GAME 6: PHYSICS CIRCUIT */}
            {activePuzzle.puzzleType === 'circuit_puzzle' && activePuzzle.interactiveData && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-gray-500">
                  {t.circuitPrompt}
                </div>

                {/* Slots */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePuzzle.interactiveData.missingSlots?.map((slot: any) => {
                    const currentPlaced = userAnswers.placedComponents?.[slot.slotIndex];
                    const placedObj = activePuzzle.interactiveData.availableComponents?.find((c: any) => c.id === currentPlaced);

                    return (
                      <div key={slot.slotIndex} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-gray-700">{slot.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {activePuzzle.interactiveData.availableComponents?.map((comp: any) => {
                            const isSelected = currentPlaced === comp.id;
                            return (
                              <button
                                key={comp.id}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => {
                                  setUserAnswers({
                                    ...userAnswers,
                                    placedComponents: { ...(userAnswers.placedComponents || {}), [slot.slotIndex]: comp.id }
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <span>{comp.icon || '⚡'}</span>
                                <span>{comp.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACTION CONTROLS */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitPuzzle}
                    disabled={isEvaluating}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    {isEvaluating ? t.evaluating : t.submitBtn}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => generateNewPuzzle(selectedGameType, activeGrade, difficulty, activeLang)}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all shadow-xs"
                  >
                    {t.nextPuzzleBtn}
                  </button>
                )}
              </div>

              {isSubmitted && (
                <div className={`text-xs font-bold flex items-center gap-1.5 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{isCorrect ? t.solvedCongrats : t.incorrectMessage}</span>
                </div>
              )}
            </div>

            {/* 4. AI PEDAGOGICAL EVALUATION RESULT */}
            {isSubmitted && (
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200/90 space-y-3 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      {t.aiFeedbackTitle}
                    </h3>
                  </div>
                  {aiAnalysis?.badge && (
                    <span className="px-2.5 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold">
                      {aiAnalysis.badge}
                    </span>
                  )}
                </div>

                {/* Feedback */}
                <p className="text-xs text-gray-700 leading-relaxed">
                  {aiAnalysis?.feedback || activePuzzle.explanation}
                </p>

                {/* Key Insight */}
                {(aiAnalysis?.masteryInsight || activePuzzle.explanation) && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-1">
                    <div className="font-bold text-gray-900">{t.keyTakeaway}:</div>
                    <div className="text-gray-600 leading-relaxed">
                      {aiAnalysis?.masteryInsight || activePuzzle.explanation}
                    </div>
                  </div>
                )}

                {/* Recommended Next Step */}
                {aiAnalysis?.nextChallengeRecommendation && (
                  <div className="text-[11px] text-gray-500 italic">
                    <strong>{t.recommendedNext}:</strong> {aiAnalysis.nextChallengeRecommendation}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
