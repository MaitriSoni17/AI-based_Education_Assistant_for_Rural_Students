import { useState, useEffect } from 'react';
import { User, LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { AVATARS, getDeterministicAvatar } from '../../utils/avatar';
import { 
  Award, Flame, Clock, BookOpen, Database, MapPin, School, Phone, Calendar, 
  Sparkles, Settings, Globe, ShieldCheck, Edit3, Save, CheckCircle,
  Trophy, Zap, Star, Compass, Brain, CheckCircle2, ChevronRight, ChevronDown, Check
} from 'lucide-react';

const STANDARDS = [
  { value: "Class 1", label: "Class 1" },
  { value: "Class 2", label: "Class 2" },
  { value: "Class 3", label: "Class 3" },
  { value: "Class 4", label: "Class 4" },
  { value: "Class 5", label: "Class 5" },
  { value: "Class 6", label: "Class 6" },
  { value: "Class 7", label: "Class 7" },
  { value: "Class 8", label: "Class 8" },
  { value: "Class 9", label: "Class 9" },
  { value: "Class 10", label: "Class 10" },
  { value: "Class 11 (Science)", label: "Class 11 (Science)" },
  { value: "Class 11 (Commerce)", label: "Class 11 (Commerce)" },
  { value: "Class 11 (Arts)", label: "Class 11 (Arts)" },
  { value: "Class 12 (Science)", label: "Class 12 (Science)" },
  { value: "Class 12 (Commerce)", label: "Class 12 (Commerce)" },
  { value: "Class 12 (Arts)", label: "Class 12 (Arts)" },
];
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { offlineSyncManager } from '../../utils/offlineSync';
import { fireContinuousFireworks, fireConfetti } from '../../utils/confetti';
import { getSafeDateString, getCurrentWeekDates, formatDateInfo } from '../../utils/dateUtils';

export const formatStudyTime = (minutes: number, langOrHindi?: LanguageCode | boolean) => {
  const lang: LanguageCode = typeof langOrHindi === 'string' 
    ? langOrHindi 
    : (langOrHindi === true ? 'hi' : 'en');

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (lang === 'hi') {
    if (minutes < 60) return `${minutes} मिनट`;
    const hrLabel = hrs === 1 ? 'घंटा' : 'घंटे';
    return mins > 0 ? `${hrs} ${hrLabel} ${mins} मिनट` : `${hrs} ${hrLabel}`;
  }
  if (lang === 'gu') {
    if (minutes < 60) return `${minutes} મિનિટ`;
    const hrLabel = 'કલાક';
    return mins > 0 ? `${hrs} ${hrLabel} ${mins} મિનિટ` : `${hrs} ${hrLabel}`;
  }
  if (lang === 'mr') {
    if (minutes < 60) return `${minutes} मिनिटे`;
    const hrLabel = 'तास';
    return mins > 0 ? `${hrs} ${hrLabel} ${mins} मिनिटे` : `${hrs} ${hrLabel}`;
  }
  if (lang === 'ta') {
    if (minutes < 60) return `${minutes} நிமிடங்கள்`;
    const hrLabel = 'மணி';
    return mins > 0 ? `${hrs} ${hrLabel} ${mins} நிமிடங்கள்` : `${hrs} ${hrLabel}`;
  }
  if (lang === 'te') {
    if (minutes < 60) return `${minutes} నిమిషాలు`;
    const hrLabel = 'గంటలు';
    return mins > 0 ? `${hrs} ${hrLabel} ${mins} నిమిషాలు` : `${hrs} ${hrLabel}`;
  }

  // Default English
  if (minutes < 60) return `${minutes} Mins`;
  const hrLabel = hrs === 1 ? 'hr' : 'hrs';
  return mins > 0 ? `${hrs} ${hrLabel} ${mins} mins` : `${hrs} ${hrLabel}`;
};

interface ProfileTabProps {
  user: User;
  lang: LanguageCode;
  claimedMedals: string[];
  offlineCount: number;
  onNavigateToTab: (tab: 'ai-assistant' | 'tutor' | 'quiz' | 'exam' | 'career' | 'settings' | 'profile' | 'certificates' | 'equations' | 'puzzles' | 'admin-pdfs') => void;
  onUpdateUser: (fields: Partial<User>) => void;
}

// Comprehensive multi-language translations for Profile Overview
const PROFILE_I18N: Record<string, Record<string, string>> = {
  en: {
    activeStudent: "Active Student 🌟",
    noClassSchool: "No school/class specified",
    noLocation: "No location specified",
    selectClass: "Select Class / Grade",
    chooseAvatar: "Choose your AI Animal Character:",
    level: "Level",
    scholar: "Rural Scholar",
    xpHint: "Earn points from quizzes or daily check-ins to level up!",
    editProfile: "Edit Profile",
    saveDetails: "Save Details",
    golden: "Golden",
    myMedals: "My Medals",
    unlocked: "Unlocked",
    locked: "Locked",
    hot: "Hot",
    dailyStreak: "Daily Streak",
    daysStudied: "Days Studied",
    active: "Active",
    timeStudied: "Time Studied",
    weeklyArea: "Weekly Learning Area",
    weeklySub: "Minutes of customized voice lessons & reading logs",
    avg: "Avg",
    perDay: "day",
    studyTime: "Study Time",
    streakPath: "Daily Consistency Streak Path",
    streakSub: "Study for 5 minutes daily to automatically accept today's streak and claim +15 XP bonus!",
    streakAccepted: "Today's Streak Accepted (+15 XP)",
    studyProgress: "Study",
    autoCompletes: "Auto-completes at 5 mins",
    today: "Today",
    missed: "Missed",
    upcoming: "Upcoming",
    showcaseTitle: "Milestones & Badges Showcase",
    showcaseSub: "Showcase your subject mastery, caching efforts, and study consistency.",
    filterAll: "All",
    filterUnlocked: "Unlocked",
    filterAcademic: "Academic",
    filterStreak: "Streak",
    filterOffline: "Offline",
    noBadges: "No matching badges found. Keep learning to expand your shelf!",
    science: "Science 🔬",
    math: "Mathematics 📐",
    languages: "Languages 🗣️",
    gk: "General Knowledge 🧠"
  },
  hi: {
    activeStudent: "सक्रिय छात्र 🌟",
    noClassSchool: "कोई स्कूल/कक्षा निर्दिष्ट नहीं",
    noLocation: "कोई स्थान निर्दिष्ट नहीं",
    selectClass: "अपनी कक्षा चुनें",
    chooseAvatar: "अपना एआई पशु चरित्र चुनें:",
    level: "स्तर",
    scholar: "ग्रामीण अध्येता",
    xpHint: "लेवल अप करने के लिए क्विज़ या दैनिक चेक-इन से अंक अर्जित करें!",
    editProfile: "प्रोफ़ाइल संपादित करें",
    saveDetails: "विवरण सहेजें",
    golden: "स्वर्ण",
    myMedals: "मेरे पदक",
    unlocked: "अनलॉक किया",
    locked: "लॉक्ड",
    hot: "सक्रिय",
    dailyStreak: "दैनिक निरंतरता",
    daysStudied: "दिन अध्ययन किया",
    active: "सक्रिय",
    timeStudied: "अध्ययन का समय",
    weeklyArea: "साप्ताहिक अध्ययन क्षेत्र",
    weeklySub: "अनुकूलित आवाज पाठों और पढ़ने का समय",
    avg: "औसत",
    perDay: "दिन",
    studyTime: "अध्ययन का समय",
    streakPath: "दैनिक अध्ययन निरंतरता पथ",
    streakSub: "प्रतिदिन 5 मिनट अध्ययन करें और +15 XP बोनस प्राप्त करें!",
    streakAccepted: "आज की स्ट्रीक स्वीकृत (+15 XP)",
    studyProgress: "अध्ययन",
    autoCompletes: "5 मिनट पर स्वतः पूर्ण",
    today: "आज",
    missed: "छूटा",
    upcoming: "आगामी",
    showcaseTitle: "मेरा पदक और बैज शोकेस",
    showcaseSub: "अपनी विषय महारत और अध्ययन निरंतरता प्रदर्शित करें।",
    filterAll: "सभी",
    filterUnlocked: "अनलॉक",
    filterAcademic: "शैक्षणिक",
    filterStreak: "निरंतरता",
    filterOffline: "ऑफ़लाइन",
    noBadges: "कोई बैज नहीं मिला। सीखना जारी रखें!",
    science: "विज्ञान 🔬",
    math: "गणित 📐",
    languages: "भाषाएँ 🗣️",
    gk: "सामान्य ज्ञान 🧠"
  },
  gu: {
    activeStudent: "સક્રિય વિદ્યાર્થી 🌟",
    noClassSchool: "કોઈ શાળા/ધોરણ દર્શાવેલ નથી",
    noLocation: "કોઈ સ્થળ દર્શાવેલ નથી",
    selectClass: "તમારું ધોરણ પસંદ કરો",
    chooseAvatar: "તમારું AI પ્રાણી પાત્ર પસંદ કરો:",
    level: "સ્તર",
    scholar: "ગ્રામીણ વિદ્વાન",
    xpHint: "લેવલ વધારવા માટે ક્વિઝ અથવા દૈનિક ચેક-ઇનથી પોઇન્ટ મેળવો!",
    editProfile: "પ્રોફાઇલ સંપાદિત કરો",
    saveDetails: "વિગતો સાચવો",
    golden: "સુવર્ણ",
    myMedals: "મારા ચંદ્રકો",
    unlocked: "અનલૉક",
    locked: "લૉક",
    hot: "સક્રિય",
    dailyStreak: "દૈનિક સાતત્ય",
    daysStudied: "દિવસો અભ્યાસ કર્યો",
    active: "સક્રિય",
    timeStudied: "અભ્યાસનો સમય",
    weeklyArea: "સાપ્તાહિક શિક્ષણ ક્ષેત્ર",
    weeklySub: "અવાજ પાઠ અને વાંચનનો સમયગાળો",
    avg: "સરેરાશ",
    perDay: "દિવસ",
    studyTime: "અભ્યાસ સમય",
    streakPath: "દૈનિક અભ્યાસ સાતત્ય માર્ગ",
    streakSub: "દરરોજ 5 મિનિટ અભ્યાસ કરો અને +15 XP બોનસ મેળવો!",
    streakAccepted: "આજનો સ્ટ્રીક સ્વીકારાયો (+15 XP)",
    studyProgress: "અભ્યાસ",
    autoCompletes: "5 મિનિટે સ્વચાલિત પૂર્ણ",
    today: "આજે",
    missed: "ચૂકી ગયા",
    upcoming: "આગામી",
    showcaseTitle: "મારા મેડલ અને બેજ શોકેસ",
    showcaseSub: "તમારી વિષય નિપુણતા અને અભ્યાસ સાતત્ય દર્શાવો.",
    filterAll: "બધા",
    filterUnlocked: "અનલૉક",
    filterAcademic: "શૈક્ષણિક",
    filterStreak: "સાતત્ય",
    filterOffline: "ઑફલાઇન",
    noBadges: "કોઈ બેજ મળ્યા નથી. શીખવાનું ચાલુ રાખો!",
    science: "વિજ્ઞાન 🔬",
    math: "ગણિત 📐",
    languages: "ભાષાઓ 🗣️",
    gk: "સામાન્ય જ્ઞાન 🧠"
  },
  mr: {
    activeStudent: "सक्रिय विद्यार्थी 🌟",
    noClassSchool: "शाळा/इयत्ता नमूद केलेली नाही",
    noLocation: "स्थान नमूद केलेले नाही",
    selectClass: "तुमची इयत्ता निवडा",
    chooseAvatar: "तुमचे AI प्राणी पात्र निवडा:",
    level: "पातळी",
    scholar: "ग्रामीण विद्यार्थी",
    xpHint: "लेव्हल अप करण्यासाठी क्विझ किंवा दैनंदिन चेक-इनमधून गुण मिळवा!",
    editProfile: "प्रोफाईल संपादित करा",
    saveDetails: "माहिती जतन करा",
    golden: "सुवर्ण",
    myMedals: "माझी पदके",
    unlocked: "अनलॉक",
    locked: "लॉक",
    hot: "सक्रिय",
    dailyStreak: "दैनंदिन सातत्य",
    daysStudied: "दिवस अभ्यास केला",
    active: "सक्रिय",
    timeStudied: "अभ्यासाचा वेळ",
    weeklyArea: "साप्ताहिक शिक्षण क्षेत्र",
    weeklySub: "व्हॉइस धडे आणि वाचनाचा वेळ",
    avg: "सरासरी",
    perDay: "दिवस",
    studyTime: "अभ्यास वेळ",
    streakPath: "दैनंदिन अभ्यास सातत्य मार्ग",
    streakSub: "रोज ५ मिनिटे अभ्यास करा आणि +15 XP बोनस मिळवा!",
    streakAccepted: "आजचा स्ट्रिक स्वीकारला (+15 XP)",
    studyProgress: "अभ्यास",
    autoCompletes: "५ मिनिटांत स्वयंचलित पूर्ण",
    today: "आज",
    missed: "चुकले",
    upcoming: "आगामी",
    showcaseTitle: "माझे पदक आणि बॅज शोकेस",
    showcaseSub: "तुमचे विषय प्रभुत्व आणि अभ्यास सातत्य दाखवा.",
    filterAll: "सर्व",
    filterUnlocked: "अनलॉक",
    filterAcademic: "शैक्षणिक",
    filterStreak: "सातत्य",
    filterOffline: "ऑफलाईन",
    noBadges: "कोणतेही बॅज आढळले नाहीत. शिकत राहा!",
    science: "विज्ञान 🔬",
    math: "गणित 📐",
    languages: "भाषा 🗣️",
    gk: "सामान्य ज्ञान 🧠"
  },
  ta: {
    activeStudent: "சுறுசுறுப்பான மாணவர் 🌟",
    noClassSchool: "பள்ளி/வகுப்பு குறிப்பிடப்படவில்லை",
    noLocation: "இடம் குறிப்பிடப்படவில்லை",
    selectClass: "வகுப்பைத் தேர்ந்தெடுக்கவும்",
    chooseAvatar: "உங்கள் AI அவதாரத்தைத் தேர்ந்தெடுக்கவும்:",
    level: "நிலை",
    scholar: "கிராமப்புற மாணவர்",
    xpHint: "புள்ளிகள் பெற தினமும் வினாடி வினாக்களில் பங்கேற்கவும்!",
    editProfile: "சுயவிவரத்தைத் திருத்து",
    saveDetails: "விவரங்களைச் சேமி",
    golden: "தங்கம்",
    myMedals: "என் பதக்கங்கள்",
    unlocked: "திறக்கப்பட்டது",
    locked: "பூட்டப்பட்டது",
    hot: "சிறப்பு",
    dailyStreak: "தொடர் கற்றல் நாட்கள்",
    daysStudied: "நாட்கள் படித்தார்",
    active: "செயலில்",
    timeStudied: "படித்த நேரம்",
    weeklyArea: "வாராந்திர கற்றல் வரைபடம்",
    weeklySub: "குரல் பாடங்கள் மற்றும் வாசிப்பு நேரம்",
    avg: "சராசரி",
    perDay: "நாள்",
    studyTime: "படித்த நேரம்",
    streakPath: "தினசரி கற்றல் தொடர்ச்சி வழி",
    streakSub: "தினமும் 5 நிமிடங்கள் படித்து +15 XP போனஸ் பெறுங்கள்!",
    streakAccepted: "இன்றைய தொடர்ச்சி ஏற்கப்பட்டது (+15 XP)",
    studyProgress: "படித்தது",
    autoCompletes: "5 நிமிடத்தில் தானாக முற்றுப்பெறும்",
    today: "இன்று",
    missed: "தவறியது",
    upcoming: "அடுத்தது",
    showcaseTitle: "என் பதக்கங்கள் & பேட்ஜ்கள்",
    showcaseSub: "உங்கள் பாடத் திறமையைக் காட்டுங்கள்.",
    filterAll: "அனைத்தும்",
    filterUnlocked: "திறக்கப்பட்டது",
    filterAcademic: "கல்வி",
    filterStreak: "தொடர்ச்சி",
    filterOffline: "ஆஃப்லைன்",
    noBadges: "பேட்ஜ்கள் எதுவும் இல்லை. தொடர்ந்து கற்றுக்கொள்ளுங்கள்!",
    science: "அறிவியல் 🔬",
    math: "கணிதம் 📐",
    languages: "மொழிகள் 🗣️",
    gk: "பொது அறிவு 🧠"
  },
  te: {
    activeStudent: "యాక్టివ్ విద్యార్థి 🌟",
    noClassSchool: "పాఠశాల/తరగతి పేర్కొనబడలేదు",
    noLocation: "స్థలం పేర్కొనబడలేదు",
    selectClass: "తరగతిని ఎంచుకోండి",
    chooseAvatar: "మీ AI క్యారెక్టర్‌ను ఎంచుకోండి:",
    level: "స్థాయి",
    scholar: "గ్రామీణ విద్యార్థి",
    xpHint: "లెవెల్ అప్ కావడానికి ప్రతిరోజూ క్విజ్ లేదా చెక్-ఇన్ చేయండి!",
    editProfile: "ప్రొఫైల్ సవరించు",
    saveDetails: "వివరాలను సేవ్ చేయి",
    golden: "స్వర్ణ",
    myMedals: "నా పతకాలు",
    unlocked: "అన్‌లాక్ అయింది",
    locked: "లాక్ అయింది",
    hot: "హాట్",
    dailyStreak: "రోజువారీ అధ్యయనం",
    daysStudied: "రోజులు చదివారు",
    active: "సక్రియం",
    timeStudied: "చదివిన సమయం",
    weeklyArea: "వారపు అభ్యసన ప్రాంతం",
    weeklySub: "వాయిస్ పాఠాలు మరియు చదివిన సమయం",
    avg: "సగటు",
    perDay: "రోజు",
    studyTime: "అధ్యయన సమయం",
    streakPath: "రోజువారీ అధ్యయన నిలకడ మార్గం",
    streakSub: "రోజుకు 5 నిమిషాలు చదివి +15 XP బోనస్ పొందండి!",
    streakAccepted: "ఈరోజు స్ట్రీక్ ఆమోదించబడింది (+15 XP)",
    studyProgress: "చదివినది",
    autoCompletes: "5 నిమిషాల్లో ఆటో-కంప్లీట్ అవుతుంది",
    today: "ఈరోజు",
    missed: "మిస్ అయింది",
    upcoming: "రాబోయేది",
    showcaseTitle: "నా మెడల్స్ & బ్యాడ్జెస్",
    showcaseSub: "మీ విషయ పాండిత్యాన్ని ప్రదర్శించండి.",
    filterAll: "అన్నీ",
    filterUnlocked: "అన్‌లాక్",
    filterAcademic: "అకడమిక్",
    filterStreak: "నిలకడ",
    filterOffline: "ఆఫ్‌లైన్",
    noBadges: "బ్యాడ్జెలు ఏవీ లభించలేదు. చదవడం కొనసాగించండి!",
    science: "సైన్స్ 🔬",
    math: "గణితం 📐",
    languages: "భాషలు 🗣️",
    gk: "సాధారణ పరిజ్ఞానం 🧠"
  }
};

export default function ProfileTab({ user, lang, claimedMedals, offlineCount, onNavigateToTab, onUpdateUser }: ProfileTabProps) {
  const t = TRANSLATIONS[lang];
  const pText = PROFILE_I18N[lang] || PROFILE_I18N.en;

  // Load custom student attributes from the user prop for Firebase dynamics
  const [village, setVillage] = useState(() => user.village || '');
  const [school, setSchool] = useState(() => user.school || '');
  const [standard, setStandard] = useState(() => user.standard || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => user.avatar || getDeterministicAvatar(user.name, user.mobile));
  const [isEditing, setIsEditing] = useState(false);
  const [isStandardOpen, setIsStandardOpen] = useState(false);

  // Gamified statistics from user prop
  const [userPoints, setUserPoints] = useState(() => user.totalPoints ?? 15);
  const [streakDays, setStreakDays] = useState(() => user.streakDays ?? 1);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(() => user.lastCheckedInDate === getSafeDateString());
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked' | 'general' | 'streak' | 'offline'>('all');
  const [streakCelebration, setStreakCelebration] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  // Celebratory effect when streak celebration is active
  useEffect(() => {
    if (streakCelebration) {
      fireContinuousFireworks(4500);
    }
  }, [streakCelebration]);

  // Set chartReady to true after mount to avoid Recharts 0/negative dimension warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize student data when logged-in student session changes
  useEffect(() => {
    setVillage(user.village || '');
    setSchool(user.school || '');
    setStandard(user.standard || '');
    setSelectedAvatar(user.avatar || getDeterministicAvatar(user.name, user.mobile));
    setUserPoints(user.totalPoints ?? 15);
    setStreakDays(user.streakDays ?? 1);
    setHasCheckedInToday(user.lastCheckedInDate === getSafeDateString());
  }, [user]);

  // Generate date-based weekly analytics data for current week (Mon-Sun)
  const currentWeekDateObjs = getCurrentWeekDates();

  let checkInDatesList: string[] = [];
  try {
    if (user.checkInDates) checkInDatesList = JSON.parse(user.checkInDates);
  } catch(e) {}

  let dailyStudyLogMap: Record<string, number> = {};
  try {
    if (user.dailyStudyLog) dailyStudyLogMap = JSON.parse(user.dailyStudyLog);
  } catch(e) {}

  function loggedMinutesToday() {
    return user.todayMins ?? 0;
  }

  const weeklyData = currentWeekDateObjs.map((dateObj) => {
    const info = formatDateInfo(dateObj, lang);
    const dateStr = info.dateStr;

    // Actual recorded study minutes from database log or active session today
    let mins = 0;
    if (dailyStudyLogMap[dateStr] !== undefined) {
      mins = dailyStudyLogMap[dateStr];
    } else if (info.isToday) {
      mins = loggedMinutesToday();
    } else {
      mins = 0; // Strictly 0 for unstudied past/future dates
    }

    const shortLabel = `${info.dayName} ${dateObj.getDate()}`;

    return {
      day: shortLabel,
      dayName: info.dayName,
      monthDayStr: info.monthDayStr,
      dateStr: info.dateStr,
      mins,
      isToday: info.isToday,
      isPast: info.isPast,
      isFuture: info.isFuture,
      fullLabel: info.fullDisplayLabel
    };
  });

  const saveProfileDetails = () => {
    onUpdateUser({
      village,
      school,
      standard,
      avatar: selectedAvatar
    });
    setIsEditing(false);
  };

  const totalWeeklyMins = weeklyData.reduce((acc, curr) => acc + curr.mins, 0);

  // Dynamic curriculum stats based on actual claimedMedals and activities
  const completedScience = (claimedMedals.includes('rain') ? 1 : 0) + (claimedMedals.includes('photo') || claimedMedals.includes('ch-photosynthesis') ? 1 : 0);
  const completedMath = (claimedMedals.includes('math') || claimedMedals.includes('ch-multiplication') ? 1 : 0);
  const completedLanguages = claimedMedals.includes('lang') ? 1 : 0;
  const completedGK = claimedMedals.includes('gk') ? 1 : 0;

  const subjects = [
    { 
      name: lang === 'hi' ? 'विज्ञान 🔬' : 'Science 🔬', 
      completed: completedScience, 
      total: 2, 
      color: '#81B29A', 
      accuracy: completedScience > 0 ? '85%' : '-' 
    },
    { 
      name: lang === 'hi' ? 'गणित 📐' : 'Mathematics 📐', 
      completed: completedMath, 
      total: 1, 
      color: '#F2CC8F', 
      accuracy: completedMath > 0 ? '75%' : '-' 
    },
    { 
      name: lang === 'hi' ? 'भाषाएँ 🗣️' : 'Languages 🗣️', 
      completed: completedLanguages, 
      total: 1, 
      color: '#E07A5F', 
      accuracy: completedLanguages > 0 ? '95%' : '-' 
    },
    { 
      name: lang === 'hi' ? 'सामान्य ज्ञान 🧠' : 'General Knowledge 🧠', 
      completed: completedGK, 
      total: 1, 
      color: '#3D405B', 
      accuracy: completedGK > 0 ? '80%' : '-' 
    },
  ];

  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) return;

    const newStreak = streakDays + 1;
    const newPoints = userPoints + 15;
    const todayStr = getSafeDateString();

    let checkInList: string[] = [];
    try {
      if (user.checkInDates) checkInList = JSON.parse(user.checkInDates);
    } catch(e) {}
    if (!checkInList.includes(todayStr)) {
      checkInList.push(todayStr);
    }

    let logMap: Record<string, number> = {};
    try {
      if (user.dailyStudyLog) logMap = JSON.parse(user.dailyStudyLog);
    } catch(e) {}
    logMap[todayStr] = Math.max(logMap[todayStr] || 0, user.todayMins ?? 5);

    // Update state
    setStreakDays(newStreak);
    setUserPoints(newPoints);
    setHasCheckedInToday(true);
    setStreakCelebration(true);

    // Call onUpdateUser to sync up to Firebase
    onUpdateUser({
      streakDays: newStreak,
      totalPoints: newPoints,
      lastCheckedInDate: todayStr,
      checkInDates: JSON.stringify(checkInList),
      dailyStudyLog: JSON.stringify(logMap)
    });

    // Queue offline sync progress to user stats
    offlineSyncManager.queuePendingProgress('quiz_points', 15, user.mobile);

    // Auto-clear celebration banner
    setTimeout(() => {
      setStreakCelebration(false);
    }, 4500);
  };

  const badgesList = [
    {
      id: 'first_step',
      name: lang === 'hi' ? 'पहला कदम' : 'First Step',
      title: lang === 'hi' ? 'ग्रामीण शुरुआत' : 'Rural Scholar Launch',
      emoji: '🚀',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      desc: lang === 'hi' ? 'अपना पहला ग्रामीण छात्र आईडी प्रोफाइल पंजीकृत करने पर प्राप्त।' : 'Awarded for successfully creating and activating your custom student academy profile.',
      required: lang === 'hi' ? 'पंजीकृत छात्र आईडी' : 'Created Student ID Profile',
      unlocked: true,
      category: 'general'
    },
    {
      id: 'knowledge_seeker',
      name: lang === 'hi' ? 'ज्ञान खोजी' : 'Knowledge Seeker',
      title: lang === 'hi' ? 'सक्रिय अध्येता' : 'Active XP Accumulator',
      emoji: '📚',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      desc: lang === 'hi' ? 'क्विज़, चेक-इन या समीकरणों को पूरा करके 50 से अधिक शैक्षणिक अंक (XP) अर्जित करने पर।' : 'Earned by accumulating 50 or more academic XP points through quizzes, study time, or equations.',
      required: lang === 'hi' ? '50+ शैक्षणिक अंक (XP) अर्जित करें' : 'Earn 50+ total Academic XP points',
      unlocked: userPoints >= 50,
      category: 'general'
    },
    {
      id: 'streak_flame',
      name: lang === 'hi' ? 'अखंड ज्योति' : 'Consistent Scholar',
      title: lang === 'hi' ? 'नियमित अध्येता' : 'Unstoppable Mindset',
      emoji: '🔥',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      desc: lang === 'hi' ? 'लगातार 2 या अधिक दिनों तक पढ़ने का रिकॉर्ड बनाने पर।' : 'Study consistently to active a study streak of 2 or more consecutive days.',
      required: lang === 'hi' ? '2+ दिनों की लगातार पढ़ाई' : 'Reach a 2-Day study streak or more',
      unlocked: streakDays >= 2,
      category: 'streak'
    },
    {
      id: 'medalist_club',
      name: lang === 'hi' ? 'मेडल क्लब' : 'Medalist Club',
      title: lang === 'hi' ? 'स्वर्ण पदक विजेता' : 'Gold Medal Collector',
      emoji: '🏅',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      desc: lang === 'hi' ? 'ट्यूटरिंग क्विज़ में शानदार प्रदर्शन करके कम से कम 1 स्वर्ण पदक अर्जित करने पर।' : 'Unlock by mastering any tutorial quizzes and earning at least 1 gold medal.',
      required: lang === 'hi' ? 'कम से कम 1 स्वर्ण पदक प्राप्त करें' : 'Earn at least 1 academic medal',
      unlocked: claimedMedals && claimedMedals.length > 0,
      category: 'general'
    },
    {
      id: 'offline_pioneer',
      name: lang === 'hi' ? 'ऑफ़लाइन अग्रदूत' : 'Offline Pioneer',
      title: lang === 'hi' ? 'बिना इंटरनेट के पढ़ाई' : 'Zero-Data Hero',
      emoji: '📦',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      desc: lang === 'hi' ? 'ऑफ़लाइन अध्ययन के लिए कम से कम एक पाठ का पीडीएफ़ या डेटा सिंक करने पर।' : 'Sync lessons or quizzes offline to study with zero active mobile network.',
      required: lang === 'hi' ? 'ऑफ़लाइन कैश में फ़ाइलें सहेजें' : 'Save at least 1 lesson offline',
      unlocked: offlineCount > 0,
      category: 'offline'
    },
    {
      id: 'storyteller',
      name: lang === 'hi' ? 'संवाद गुरु' : 'AI Dialog Master',
      title: lang === 'hi' ? 'जिज्ञासु छात्र' : 'Inquisitive Mind',
      emoji: '💬',
      color: 'bg-teal-50 border-teal-200 text-teal-700',
      desc: lang === 'hi' ? 'दादी माँ, स्वामी या शुभम भैया एआई ट्यूटर के साथ बातचीत करके विज्ञान या गणित के प्रश्न पूछने पर।' : 'Earned by initiating dialogue with our interactive AI village mentors to clarify academic questions.',
      required: lang === 'hi' ? 'एआई ट्यूटर से पहली बातचीत' : 'First chat with an AI teacher',
      unlocked: offlineSyncManager.getChatHistory('swami', user.mobile).some(msg => msg.sender === 'user') ||
                offlineSyncManager.getChatHistory('dadi', user.mobile).some(msg => msg.sender === 'user') ||
                offlineSyncManager.getChatHistory('shubham', user.mobile).some(msg => msg.sender === 'user'),
      category: 'general'
    }
  ];

  const filteredBadges = badgesList.filter(badge => {
    if (badgeFilter === 'all') return true;
    if (badgeFilter === 'unlocked') return badge.unlocked;
    if (badgeFilter === 'locked') return !badge.unlocked;
    if (badgeFilter === 'general') return badge.category === 'general';
    if (badgeFilter === 'streak') return badge.category === 'streak';
    if (badgeFilter === 'offline') return badge.category === 'offline';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS HERO CARD */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-36 h-36 bg-[#81B29A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/2 w-48 h-48 bg-[#E07A5F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Avatar and Name */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full sm:w-auto">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#FAF8F4] border-4 border-[#F2CC8F] rounded-full flex items-center justify-center text-5xl shadow-md select-none transition-transform duration-300 hover:rotate-6">
                {selectedAvatar}
              </div>
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 bg-[#3D405B] text-white p-1 rounded-full text-xs shadow">
                  ✏️
                </div>
              )}
            </div>

            <div className="space-y-2 w-full sm:w-auto">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="font-display font-extrabold text-2xl text-[#3D405B]">
                    {user.name}
                  </h2>
                  <span className="inline-flex self-center sm:self-auto items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#81B29A]/10 text-emerald-700 border border-[#81B29A]/30">
                    {pText.activeStudent}
                  </span>
                </div>
                
                {/* School/College subtitle */}
                {!isEditing ? (
                  <p className="font-sans text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <School className="h-4 w-4 text-[#81B29A]" />
                    <span>
                      {standard && school 
                        ? `${standard} • ${school}` 
                        : standard || school || pText.noClassSchool}
                    </span>
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {/* Standard / Class Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsStandardOpen(!isStandardOpen)}
                        className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] cursor-pointer text-left transition-all hover:bg-gray-100"
                      >
                        <span className="font-medium">{standard || pText.selectClass}</span>
                        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${isStandardOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isStandardOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-52 overflow-y-auto p-1.5 space-y-0.5 animate-fade-in text-left">
                          {STANDARDS.map((std) => (
                            <button
                              key={std.value}
                              type="button"
                              onClick={() => {
                                setStandard(std.value);
                                setIsStandardOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer text-left ${
                                standard === std.value
                                  ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-bold'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>{std.label}</span>
                              {standard === std.value && <Check className="h-3.5 w-3.5 text-[#E07A5F]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Rampur Primary School"
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] w-full"
                    />
                  </div>
                )}
              </div>

              {/* Village Location */}
              {!isEditing ? (
                <p className="font-sans text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#E07A5F]" />
                  <span>
                    {village 
                      ? `${village}${user.state ? `, ${user.state}` : ''}, India` 
                      : (user.state ? `${user.state}, India` : pText.noLocation)}
                  </span>
                </p>
              ) : (
                <div className="flex gap-2">
                  <span className="text-xs self-center font-bold text-gray-500">Village:</span>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Village Name"
                    className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E07A5F] w-full"
                  />
                </div>
              )}

              {/* Gamified level progress bar */}
              <div className="pt-2.5 animate-fade-in flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex justify-between items-center w-full max-w-[256px] mb-1">
                  <span className="text-[11px] font-extrabold text-[#E07A5F] flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>{pText.level} {Math.floor(userPoints / 100) + 1} {pText.scholar}</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-extrabold">
                    {userPoints % 100}/100 XP
                  </span>
                </div>
                <div className="h-2 w-full max-w-[256px] bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-3xs">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F2CC8F] to-[#E07A5F] rounded-full transition-all duration-700"
                    style={{ width: `${userPoints % 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 font-sans mt-1">
                  {pText.xpHint}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex gap-2">
            {!isEditing ? (
              <button
                id="edit-profile-details"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-[#3D405B] font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{pText.editProfile}</span>
              </button>
            ) : (
              <button
                id="save-profile-details"
                onClick={saveProfileDetails}
                className="px-4 py-2 bg-gradient-to-r from-[#3D405B] to-[#E07A5F] text-white font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{pText.saveDetails}</span>
              </button>
            )}
          </div>
        </div>

        {/* Avatar Picker popup if editing */}
        {isEditing && (
          <div className="mt-5 p-4 bg-gray-50/60 rounded-2xl border border-gray-150 text-left space-y-2 animate-fade-in">
            <h4 className="font-display font-black text-xs text-[#3D405B] uppercase tracking-wider">
              {pText.chooseAvatar}
            </h4>
            <div className="flex flex-wrap gap-3">
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.emoji)}
                  className={`p-2.5 rounded-xl text-3xl transition-all cursor-pointer border ${
                    selectedAvatar === av.emoji 
                      ? 'bg-amber-100 border-[#F2CC8F] scale-110 shadow-3xs' 
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  }`}
                  title={av.name}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. CORE SCHOLASTIC METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Medals */}
        <div 
          onClick={() => onNavigateToTab('tutor')}
          className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left cursor-pointer transition-transform duration-300 hover:scale-102 flex flex-col justify-between h-28"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 block bg-amber-50 px-1.5 py-0.5 rounded uppercase">
              {pText.golden}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">{pText.myMedals}</span>
            <span className="text-xl font-black text-[#3D405B]">{claimedMedals.length} {pText.unlocked}</span>
          </div>
        </div>

        {/* Metric 2: Daily Streak */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 pointer-events-none scale-150 opacity-10">🔥</div>
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-50 rounded-xl border border-orange-100 text-[#E07A5F]">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#E07A5F] block bg-orange-50 px-1.5 py-0.5 rounded uppercase">
              {pText.hot}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">{pText.dailyStreak}</span>
            <span className="text-xl font-black text-[#3D405B]">{streakDays} {pText.daysStudied}</span>
          </div>
        </div>

        {/* Metric 3: Screen Minutes */}
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-3xs text-left flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal-50 rounded-xl border border-teal-100 text-[#81B29A]">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 block bg-teal-50 px-1.5 py-0.5 rounded uppercase">
              {pText.active}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 block font-bold uppercase tracking-wider">{pText.timeStudied}</span>
            <span className="text-xl font-black text-[#3D405B]">{formatStudyTime(Math.max(user.studyMins ?? 30, totalWeeklyMins), lang === 'hi')}</span>
          </div>
        </div>

      </div>

      {/* 3. RECHARTS STUDY ANALYTICS */}
      <div className="w-full">
        
        {/* Weekly Study Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left">
          <div className="md:flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider flex items-center gap-2">
                {pText.weeklyArea}
              </h3>
              <p className="text-[11px] text-gray-400">{pText.weeklySub}</p>
            </div>
            <div className="text-left">
              <span className="text-xs font-mono font-bold text-[#E07A5F] bg-[#FAF8F4] px-2 py-1 rounded-sm border border-[#F2CC8F]/40 uppercase">
                {pText.avg}: {formatStudyTime(Math.round(totalWeeklyMins / 7), lang === 'hi')}/{pText.perDay}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartReady ? (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#E07A5F" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value < 60) return `${value}m`;
                      const hrs = Math.floor(value / 60);
                      const mins = value % 60;
                      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
                    }}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1" 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', padding: '10px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#3d405b' }}
                    formatter={(value: any) => [
                      formatStudyTime(Number(value), lang === 'hi'),
                      lang === 'hi' ? 'अध्ययन का समय' : 'Study Time'
                    ]}
                  />
                  <Area type="monotone" dataKey="mins" name="Study Time (Mins)" stroke="#E07A5F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMins)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-55 rounded-2xl border border-dashed border-gray-200">
                <span className="text-xs text-gray-400 font-mono">Loading study analytics...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. DAILY STREAK PATH ROADMAP (Gamified Continuity) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-3xs space-y-4 text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-display font-extrabold text-[#3D405B] text-base uppercase tracking-wider flex items-center gap-2 text-sm">
              {pText.streakPath}
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              {pText.streakSub}
            </p>
          </div>
          <div className="shrink-0">
            {hasCheckedInToday ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                <span>{pText.streakAccepted}</span>
              </span>
            ) : (
              <div className="flex flex-col items-left gap-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-black rounded-xl border border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>{pText.studyProgress}: {user.todayMins ?? 0} / 5 Mins</span>
                </span>
                <span className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-wider">
                  {pText.autoCompletes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day sequence map with actual calendar dates */}
        <div className="flex flex-row sm:grid sm:grid-cols-4 md:grid-cols-7 gap-2 text-center pt-2 overflow-x-auto snap-x snap-mandatory">
          {currentWeekDateObjs.map((dateObj) => {
            const info = formatDateInfo(dateObj, lang);
            const dateStr = info.dateStr;
            
            // Determine actual recorded time for this date:
            const dayMinsRecorded = info.isToday 
              ? Math.max(loggedMinutesToday(), dailyStudyLogMap[dateStr] ?? 0)
              : (dailyStudyLogMap[dateStr] ?? 0);
            
            // Determine if checked in strictly based on actual records or >=5 mins logged:
            const isExplicitCheckIn = checkInDatesList.includes(dateStr) || dayMinsRecorded >= 5;
            const isDayCompleted = isExplicitCheckIn || (info.isToday && hasCheckedInToday);
            const isToday = info.isToday;
            
            return (
              <div 
                key={dateStr} 
                onClick={() => {
                  if (isToday && !hasCheckedInToday) {
                    handleDailyCheckIn();
                  }
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all duration-300 flex-none w-28 sm:w-auto snap-start ${
                  isToday && !hasCheckedInToday ? 'cursor-pointer hover:border-[#E07A5F] hover:shadow-md' : ''
                } ${
                  isDayCompleted 
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950' 
                    : isToday 
                    ? 'bg-white border-[#E07A5F] border-2 shadow-2xs text-[#E07A5F]' 
                    : info.isPast
                    ? 'bg-gray-50/80 border-gray-200 text-gray-400'
                    : 'bg-gray-50 border-gray-150 text-gray-300'
                }`}
              >
                <div className="w-full flex flex-col items-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider block">
                    {info.dayName}
                  </span>
                  <span className={`text-[11px] font-black font-sans block ${isToday ? 'text-[#E07A5F]' : 'text-gray-700'}`}>
                    {info.monthDayStr}
                  </span>
                  {isToday && (
                    <span className="mt-0.5 px-1.5 py-0.2 bg-[#E07A5F] text-white text-[8px] font-black rounded-xs uppercase tracking-wider">
                      {lang === 'hi' ? 'आज' : 'Today'}
                    </span>
                  )}
                </div>

                <div className="text-2xl my-1.5 select-none">
                  {isDayCompleted ? '🔥' : isToday ? '⭐' : info.isPast ? '❌' : '🔒'}
                </div>

                <div className="w-full flex justify-center">
                  {isDayCompleted ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 bg-white rounded-full shadow-3xs" />
                      <span className="text-[9px] font-mono font-black text-emerald-700">+15 XP</span>
                    </div>
                  ) : isToday ? (
                    <span className="text-[9px] font-mono font-bold text-[#E07A5F] bg-orange-50 px-1 py-0.5 rounded border border-orange-100">
                      {user.todayMins ?? 0}m/5m
                    </span>
                  ) : info.isPast ? (
                    <span className="text-[9px] font-mono font-bold text-gray-400">
                      {lang === 'hi' ? 'छूटा' : 'Missed'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-gray-400">
                      {lang === 'hi' ? 'आगामी' : 'Upcoming'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak milestone alert banner if celebration is active */}
        {streakCelebration && (
          <div className="bg-[#81B29A] text-white p-3 rounded-2xl border border-emerald-600 animate-pulse flex items-center justify-center gap-2.5 shadow-sm text-xs font-sans font-bold">
            <Trophy className="h-5 w-5 text-yellow-300 animate-spin" />
            <span>
              {lang === 'hi' 
                ? `वाह! शानदार निरंतरता! +15 XP अंक अर्जित हुए। आपका नया लेवल: ${Math.floor(userPoints / 100) + 1}!` 
                : `Awesome Consistency Streak! +15 XP claimed. Your current Level: ${Math.floor(userPoints / 100) + 1}!`}
            </span>
          </div>
        )}
      </div>

      {/* 5. VISUAL BADGE SYSTEM (Achievements Showcase) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-4 text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-display font-extrabold text-[#3D405B] text-sm uppercase tracking-wider flex items-center gap-1.5">
              {/*<Trophy className="h-4.5 w-4.5 text-amber-500" />*/}
              {pText.showcaseTitle}
            </h3>
            <p className="text-[11px] text-gray-400 font-sans">
              {pText.showcaseSub}
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: pText.filterAll },
              { id: 'unlocked', label: pText.filterUnlocked },
              { id: 'general', label: pText.filterAcademic },
              { id: 'streak', label: pText.filterStreak },
              { id: 'offline', label: pText.filterOffline }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setBadgeFilter(f.id as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer border transition-colors ${
                  badgeFilter === f.id 
                    ? 'bg-[#3D405B] text-white border-[#3D405B]' 
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge grid */}
        <div className="flex flex-row sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-5 overflow-x-auto snap-x snap-mandatory">
          {filteredBadges.map((badge) => (
            <div 
              key={badge.id}
              onClick={() => {
                setSelectedBadge(badge);
                if (badge.unlocked) {
                  fireConfetti();
                }
              }}
              className={`p-3.5 rounded-2xl border text-center relative flex flex-col justify-between items-center cursor-pointer transition-all duration-300 group md:hover:scale-103 flex-none w-36 sm:w-auto snap-start ${
                badge.unlocked 
                  ? 'bg-gradient-to-br from-white to-amber-50/10 border-amber-250 shadow-3xs' 
                  : 'bg-gray-50/70 border-gray-200 opacity-60'
              }`}
            >
              <div className={`p-2 rounded-xl text-3xl filter drop-shadow-sm select-none mb-1 group-hover:scale-110 transition-transform duration-300 ${
                badge.unlocked ? 'bg-amber-50/50' : 'bg-gray-100'
              }`}>
                {badge.unlocked ? badge.emoji : '🔒'}
              </div>
              
              <div className="space-y-0.5">
                <div className="text-[11px] font-sans font-black text-gray-800 line-clamp-1">
                  {badge.name}
                </div>
                <div className="text-[9px] font-semibold text-gray-400 font-mono tracking-wider line-clamp-1 uppercase">
                  {badge.unlocked ? pText.unlocked : pText.locked}
                </div>
              </div>

              {/* Achievement progress indicators */}
              <div className="w-full mt-2 pt-1.5 border-t border-gray-100/60 flex items-center justify-between text-[8px] font-mono font-bold text-gray-400">
                <span>{badge.category.toUpperCase()}</span>
                <span className={badge.unlocked ? 'text-emerald-600' : 'text-gray-400'}>
                  {badge.unlocked ? '100%' : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6 font-mono">
            {pText.noBadges}
          </p>
        )}
      </div>

      {/* Badge Detail Modal popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xl max-w-sm w-full text-center space-y-4 relative animate-scale-up">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <span className="text-xl font-bold font-sans">✕</span>
            </button>
            <div className="text-6xl mx-auto py-2 filter drop-shadow-sm select-none animate-bounce">
              {selectedBadge.emoji}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#E07A5F] uppercase tracking-widest block mb-1">
                {selectedBadge.category} Milestone
              </span>
              <h4 className="font-display font-extrabold text-[#3D405B] text-lg leading-tight">
                {selectedBadge.name}
              </h4>
              <p className="text-xs text-[#81B29A] font-bold mt-0.5">
                {selectedBadge.title}
              </p>
            </div>
            <div className="bg-[#FAF8F4] p-3.5 rounded-2xl border border-amber-100 text-left text-xs text-gray-600 font-sans space-y-1.5">
              <p className="font-semibold text-gray-800">
                {lang === 'hi' ? 'बैज विवरण:' : 'Badge Description:'}
              </p>
              <p>{selectedBadge.desc}</p>
              <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-gray-500">
                  {lang === 'hi' ? 'आवश्यकता:' : 'Requirement:'}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedBadge.unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {selectedBadge.unlocked ? (lang === 'hi' ? 'पूर्ण' : 'Mastered') : (lang === 'hi' ? 'अनलॉक करें' : 'To Unlock')}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono italic">
                {selectedBadge.required}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              {!selectedBadge.unlocked && (
                <button
                  onClick={() => {
                    setSelectedBadge(null);
                    onNavigateToTab('tutor');
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-[#3D405B] to-[#E07A5F] text-white text-xs font-sans font-black rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all text-center"
                >
                  {lang === 'hi' ? 'चैप्टर पढ़ें 📚' : 'Go to Lessons 📚'}
                </button>
              )}
              <button
                onClick={() => setSelectedBadge(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-[#3D405B] text-xs font-sans font-bold rounded-xl cursor-pointer transition-all"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
