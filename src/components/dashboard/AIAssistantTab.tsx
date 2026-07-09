import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, User } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import { 
  Sparkles, Send, Volume2, VolumeX, Smile, ArrowRight, CornerDownRight,
  Paperclip, X, Trash, Image as ImageIcon, BookOpen, Compass, Map, 
  GraduationCap, Leaf, Sun, CloudRain, Award, Check, RotateCcw, Play, Plus,
  ChevronDown, ChevronUp, MessageSquare, FileText, FileDown, Copy
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { offlineSyncManager } from '../../utils/offlineSync';
import InteractiveDiagram from './InteractiveDiagram';
import { LOCAL_LEARNING_PATHS, LearningPath } from '../../data/learningPaths';

// Utility helper to safely extract and parse diagram-data JSON blocks from AI responses
const parseMessageContent = (text: string) => {
  const regex = /```diagram-data\s*([\s\S]*?)```/;
  const match = text.match(regex);
  if (match) {
    const rawJson = match[1].trim();
    const cleanText = text.replace(regex, '').trim();
    try {
      const parsedData = JSON.parse(rawJson);
      return {
        text: cleanText,
        diagram: parsedData
      };
    } catch (e) {
      console.error("Failed to parse diagram JSON", e);
    }
  }
  return {
    text: text,
    diagram: null
  };
};

interface AIAssistantTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  image?: {
    data: string;
    mimeType: string;
    name?: string;
  };
  pending?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

const CHARACTERS = [
  { 
    id: 'swami', 
    name: 'Swami AI 🤖', 
    role: 'Mascot Companion', 
    char: '🤖 Swami AI',
    color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
    welcome: {
      en: "Hello, smart friend! I am Swami. Let's solve amazing science, logic, or math puzzles together. Ask me anything, or attach a picture of your notes/homework and let's study!",
      hi: "नमस्ते साथी! मैं स्वामी हूँ। आइए मिलकर विज्ञान, तार्किक पहेलियाँ या गणित हल करें। मुझसे कुछ भी पूछें, या अपने नोट्स/होमवर्क की तस्वीर भेजें!",
      gu: "નમસ્તે દોસ્ત! હું સ્વામી છું. ચાલો સાથે મળીને વિજ્ઞાન અને ગણિતના કોયડા ઉકેલીએ. ગમે તે પૂછો અથવા તમારા પ્રશ્નની તસવીર મોકલો!",
      mr: "नमस्कार मित्रा! मी स्वामी आहे. चला एकत्र येऊन विज्ञान, तर्कशास्त्र आणि अंकगणित सोडवूया! काहीही विचारा किंवा तुमच्या वहीचा फोटो पाठवा!",
      ta: "வணக்கம் நண்பா! நான் சுவாமி. அறிவியல், கணிதம் மற்றும் தர்க்க புதிர்களை ஒன்றாக தீர்ப்போம். எதையும் கேள் அல்லது உங்கள் கேள்வித்தாள் படத்தைப் பதிவேற்று!",
      te: "నమస్తే స్నేహితుడా! నేను స్వామిని. సైన్స్, మ్యాథ్స్ మరియు పజిల్స్ ని కలిసి చేధిద్దాం. ఏదైనా అడుగు లేదా మీ హోంవర్క్ ఫోటోని పంపించు!"
    }
  }
];


const COMPANION_TITLE_LABELS: Record<LanguageCode, string> = {
  en: "Select Your AI Companion",
  hi: "अपने AI साथी का चयन करें",
  gu: "તમારા AI સાથીદારને પસંદ કરો",
  mr: "तुमचा AI सोबती निवडा",
  ta: "உங்கள் AI துணையைத் தேர்ந்தெடுக்கவும்",
  te: "మీ AI సహచరుడిని ఎంచుకోండి"
};

const ACTIVE_MASCOT_LABELS: Record<LanguageCode, string> = {
  en: "Active Mascot State",
  hi: "सक्रिय शुभंकर स्थिति",
  gu: "સક્રિય કાર્ટૂન સ્થિતિ",
  mr: "सक्रिय शुभंकर स्थिती",
  ta: "செயலில் உள்ள சின்னம் நிலை",
  te: "యాక్టివ్ మస్కట్ స్థితి"
};

const MASCOT_STATUS_LABELS: Record<LanguageCode, Record<string, string>> = {
  en: { listening: "Listening...", thinking: "Thinking...", explaining: "Explaining..." },
  hi: { listening: "सुन रहा हूँ...", thinking: "सोच रहा हूँ...", explaining: "समझा रहा हूँ..." },
  gu: { listening: "સાંભળે છે...", thinking: "વિચારે છે...", explaining: "સમજાવે છે..." },
  mr: { listening: "ऐकत आहे...", thinking: "विचार करत आहे...", explaining: "स्पष्टीकरण देत आहे..." },
  ta: { listening: "கேட்கிறது...", thinking: "யோசிக்கிறது...", explaining: "விளக்குகிறது..." },
  te: { listening: "వింటోంది...", thinking: "ఆలోచిస్తోంది...", explaining: "వివరిస్తోంది..." }
};

const LEARNING_PATH_TITLE_LABELS: Record<LanguageCode, string> = {
  en: "Structured Learning Path",
  hi: "संरचित सीखने का मार्ग",
  gu: "વ્યવસ્થિત ભણવાનો માર્ગ",
  mr: "संरचित अभ्यास मार्ग",
  ta: "கட்டமைக்கப்பட்ட கற்றல் வழி",
  te: "క్రమబద్ధమైన అభ్యసన మార్గం"
};

const LEARNING_PATH_INTRO_LABELS: Record<LanguageCode, string> = {
  en: "Select a structured subject topic or learning track from our educational database below:",
  hi: "अपने अध्ययन सत्र को संरचित करने के लिए नीचे दिए गए स्थानीय डेटाबेस से एक विषय या सीखने का मार्ग चुनें:",
  gu: "તમારા અભ્યાસ સત્રને વ્યવસ્થિત કરવા માટે નીચેના શૈક્ષણિક ડેટાબેઝમાંથી એક વિષય અથવા ભણવાનો માર્ગ પસંદ કરો:",
  mr: "तुमचे अभ्यासाचे नियोजन करण्यासाठी खालील शैक्षणिक डेटाबेसमधून एक विषय किंवा अभ्यास मार्ग निवडा:",
  ta: "உங்கள் ஆய்வு அமர்வை கட்டமைக்க கீழே உள்ள கல்வி தரவுத்தளத்திலிருந்து ஒரு தலைப்பு அல்லது கற்றல் வழியைத் தேர்ந்தெடுக்கவும்:",
  te: "మీ అధ్యయన సెషన్‌ను క్రమబద్ధీకరించడానికి క్రింది విద్యా డేటాబేస్ నుండి ఒక అంశాన్ని లేదా అభ్యసన మార్గాన్ని ఎంచుకోండి:"
};

const MILESTONE_TRACK_LABELS: Record<LanguageCode, string> = {
  en: "Track Milestones",
  hi: "मील के पत्थर ट्रैक करें",
  gu: "પગલાંઓ ટ્રૅક કરો",
  mr: "अभ्यास टप्पे ट्रॅक करा",
  ta: "மைல்கற்களைக் கண்காணிக்கவும்",
  te: "మైలురాళ్లను ట్రాక్ చేయండి"
};

const COMPLETED_RATIO_LABELS: Record<LanguageCode, { of: string; done: string }> = {
  en: { of: "of", done: "Done" },
  hi: { of: "में से", done: "पूर्ण" },
  gu: { of: "માંથી", done: "પૂર્ણ" },
  mr: { of: "पैकी", done: "पूर्ण" },
  ta: { of: "இல்", done: "முடிந்தது" },
  te: { of: "లో", done: "పూర్తయింది" }
};

const STEPS_BADGE_LABELS: Record<LanguageCode, string> = {
  en: "Steps",
  hi: "कदम",
  gu: "પગલાં",
  mr: "टप्पे",
  ta: "படிகள்",
  te: "మెట్లు"
};

const START_TOPIC_LABELS: Record<LanguageCode, string> = {
  en: "Start Topic",
  hi: "विषय शुरू करें",
  gu: "વિષય શરૂ કરો",
  mr: "विषय सुरू करा",
  ta: "தலைப்பைத் தொடங்குக",
  te: "అంశాన్ని ప్రారంభించండి"
};

const CHANGE_BUTTON_LABELS: Record<LanguageCode, string> = {
  en: "Change",
  hi: "बदलें",
  gu: "બદલો",
  mr: "बदला",
  ta: "மாற்று",
  te: "మార్చండి"
};

const RESTART_RESUME_LABELS: Record<LanguageCode, string> = {
  en: "Restart/Resume Topic Chat",
  hi: "विषय चैट फिर से शुरू करें",
  gu: "વિષય ચેટ ફરી શરૂ કરો",
  mr: "विषय चॅट पुन्हा सुरू करा",
  ta: "தலைப்பு அரட்டையை மீண்டும் தொடங்கவும்",
  te: "అంశం చాట్‌ను పునఃప్రారంభించండి"
};

const READY_EXPLAIN_LABELS: Record<LanguageCode, string> = {
  en: "Ready to explain in regional Indian tongues",
  hi: "क्षेत्रीय भारतीय भाषाओं में समझाने के लिए तैयार",
  gu: "પ્રાદેશિક ભારતીય ભાષાઓમાં સમજાવવા માટે તૈયાર",
  mr: "प्रादेशिक भारतीय भाषांमध्ये स्पष्टीकरण देण्यासाठी तयार",
  ta: "வட்டார இந்திய மொழிகளில் விளக்கத் தயார்",
  te: "ప్రాంతీయ భారతీయ భాషలలో వివరించడానికి సిద్ధంగా ఉంది"
};

const STOP_ALOUD_LABELS: Record<LanguageCode, string> = {
  en: "Stop Aloud",
  hi: "आवाज़ बंद करें",
  gu: "અવાજ બંધ કરો",
  mr: "आवाज बंद करा",
  ta: "ஒலியை நிறுத்து",
  te: "ఆపండి"
};

const READ_ALOUD_TOOLTIP_LABELS: Record<LanguageCode, string> = {
  en: "Read this reply out loud",
  hi: "इस उत्तर को ज़ोर से पढ़ें",
  gu: "આ જવાબ મોટેથી વાંચો",
  mr: "हे उत्तर मोठ्याने वाचा",
  ta: "இந்த பதிலை சத்தமாக வாசிக்கவும்",
  te: "ఈ సమాధానాన్ని గట్టిగా చదవండి"
};

const SYNC_PENDING_LABELS: Record<LanguageCode, string> = {
  en: "Sync Pending...",
  hi: "सिंक लंबित है...",
  gu: "સિંક બાકી છે...",
  mr: "सिंक प्रलंबित आहे...",
  ta: "ஒத்திசைవు நிலுவையில் உள்ளது...",
  te: "సింక్ పెండింగ్‌లో ఉంది..."
};

const THINKING_INDICATOR_LABELS: Record<LanguageCode, string> = {
  en: "is thinking...",
  hi: "सोच रहा है...",
  gu: "વિચારી રહ્યું છે...",
  mr: "विचार करत आहे...",
  ta: "யோசித்துக்கொண்டிருக்கிறது...",
  te: "ఆలోచిస్తోంది..."
};

const ATTACHMENT_READY_LABELS: Record<LanguageCode, string> = {
  en: "Ready to send with next query",
  hi: "अगले प्रश्न के साथ भेजने के लिए तैयार",
  gu: "આગામী પ્રશ્ન સાથે મોકલવા માટે તૈયાર",
  mr: "पुढील प्रश्नासोबत पाठवण्यासाठी तयार",
  ta: "அடுத்த கேள்வியுடன் அனுப்பத் தயார்",
  te: "తదుపరి ప్రశ్నతో పంపడానికి సిద్ధంగా ఉంది"
};

const INPUT_PLACEHOLDER_LABELS: Record<LanguageCode, string> = {
  en: "Ask AI companion anything, drag-and-drop or upload a file (Image/PDF)!",
  hi: "AI साथी से कुछ भी पूछें, फ़ाइल (छवि/PDF) खींचें या अपलोड करें!",
  gu: "AI સાથીદારને કંઈપણ પૂછો, ફાઇલ (ઈમેજ/PDF) ખેંચો અથવા અપલોડ કરો!",
  mr: "AI सोबतीला काहीही विचारा, फाईल (इमेज/PDF) ड्रॅग करा किंवा अपलोड करा!",
  ta: "AI துணையிடம் எதையும் கேளுங்கள், கோப்பை (படம்/PDF) இழுத்து அல்லது பதிવેற்றவும்!",
  te: "AI సహచరుడిని ఏదైనా అడగండి, ఫైల్ (చిత్రం/PDF) లాగండి లేదా అప్‌లోడ్ చేయండి!"
};

const DRAG_DROP_PLACEHOLDER_LABELS: Record<LanguageCode, string> = {
  en: "Drop your file here!",
  hi: "अपनी फ़ाइल यहाँ छोड़ें!",
  gu: "તમારી ફાઇલ અહીં મૂકો!",
  mr: "तुमची फाईल येथे टाका!",
  ta: "உங்கள் கோப்பை இங்கே பதிவிடவும்!",
  te: "మీ ఫైల్‌ను ఇక్కడ వదిలివేయండి!"
};

const ATTACH_TOOLTIP_LABELS: Record<LanguageCode, string> = {
  en: "Attach notes, diagrams, question papers, assignments, or PDF textbooks",
  hi: "नोट्स, आरेख, प्रश्न पत्र, असाइनमेंट या PDF पाठ्यपुस्तकें संलग्न करें",
  gu: "નોંધો, આકૃતિઓ, પ્રશ્નપત્રો, અસાઇનમેન્ટ અથવા PDF પાઠ્યપુસ્તકો જોડો",
  mr: "नोट्स, आकृत्या, प्रश्नपत्रिका, असाइनमेंट किंवा PDF पाठ्यपुस्तके जोडा",
  ta: "குறிப்புகள், வரைபடங்கள், வினாத்தாள்கள், பணிகள் அல்லது PDF பாடப்புத்தகங்களை இணைக்கவும்",
  te: "నోట్స్, రేఖాచిత్రాలు, ప్రశ్న పత్రాలు, అసైన్‌మెంట్‌లు లేదా PDF పాఠ్యపుస్తకాలను జత చేయండి"
};

const OFFLINE_DEVICE_TITLE: Record<LanguageCode, string> = {
  en: "Device Offline 📴",
  hi: "डिवाइस ऑफ़लाइन है 📴",
  gu: "ડિવાઇસ ઓફલાઇન છે 📴",
  mr: "डिव्हाइस ऑफलाइन आहे 📴",
  ta: "சாதனம் ஆஃப்லைனில் உள்ளது 📴",
  te: "పరికరం ఆఫ్‌లైన్‌లో ఉంది 📴"
};

const OFFLINE_DEVICE_BODY: Record<LanguageCode, string> = {
  en: "I've saved your homework inquiry safely! I will automatically transmit and solve this as soon as you step back into a signal area.",
  hi: "मैंने आपकी पूछताछ को सुरक्षित रूप से सहेज लिया है! जैसे ही आप नेटवर्क क्षेत्र में वापस आएंगे, मैं इसे स्वचालित रूप से भेजकर हल कर दूंगा।",
  gu: "મેં તમારો પ્રશ્ન સુરક્ષિત રીતે સાચવી લીધો છે! જેવો તમે નેટવર્ક વિસ્તારમાં પાછા આવશો, હું તેને મોકલીને આપમેળે ઉકેલી આપીશ.",
  mr: "मी तुमची चौकशी सुरक्षितपणे जतन केली आहे! तुम्ही नेटवर्क क्षेत्रात परत येताच मी ते स्वयंचलितपणे पाठवून सोडवून देईन.",
  ta: "உங்கள் வீட்டுப்பாட கேள்விய道を நான் பாதுகாப்பாகச் சேமித்துள்ளேன்! சிக்னல் பகுதிக்குத் திரும்பியதும் இதைத் தானாகவே தீர்த்து வைப்பேன்.",
  te: "నేను మీ హోంవర్క్ ప్రశ్నను సురక్షితంగా సేవ్ చేసాను! మీరు తిరిగి నెట్‌వర్క్ పరిధిలోకి రాగానే దీనిని స్వయంచాలకంగా పంపి పరిష్కరిస్తాను."
};

const COMPANION_ROLE_LABELS: Record<LanguageCode, Record<string, string>> = {
  en: { swami: "Mascot Companion", dadi: "Village Storyteller", chanda: "Witty Mathematics Fox" },
  hi: { swami: "शुभंकर साथी", dadi: "गाँव की कहानीकार", chanda: "चतुर गणितज्ञ लोमड़ी" },
  gu: { swami: "કાર્ટૂન સાથીદાર", dadi: "ગામડાની વાર્તાકાર", chanda: "હોશિયાર ગણિતજ્ઞ શિયાળ" },
  mr: { swami: "शुभंकर सोबती", dadi: "गावातील गोष्ट सांगणारी", chanda: "चतुर गणितज्ञ कोल्हा" },
  ta: { swami: "சின்னம் துணை", dadi: "கிராமத்துக் கதைசொல்லி", chanda: "புத்திசాలి கணிత நரி" },
  te: { swami: "మస్కట్ సహచరుడు", dadi: "గ్రామ కథకురాలు", chanda: "తెలివైన గణిత నక్క" }
};

const NEW_CHAT_LABELS: Record<LanguageCode, string> = {
  en: "New Chat",
  hi: "नया चैट",
  gu: "નવી ચેટ",
  mr: "नवीन चॅट",
  ta: "புதிய அரட்டை",
  te: "కొత్త చాట్"
};

const VIEW_HISTORY_LABELS: Record<LanguageCode, string> = {
  en: "View History",
  hi: "इतिहास देखें",
  gu: "ઇતિહાસ જુઓ",
  mr: "इतिहास पहा",
  ta: "வரலாற்றைக் காண்க",
  te: "చరిత్రను వీక్షించండి"
};

const HISTORY_TITLE_LABELS: Record<LanguageCode, string> = {
  en: "Chat History",
  hi: "चैट इतिहास",
  gu: "ચેટ ઇતિહાસ",
  mr: "चॅट इतिहास",
  ta: "அரட்டை வரலாறு",
  te: "చాట్ చరిత్ర"
};

const NO_HISTORY_LABELS: Record<LanguageCode, string> = {
  en: "No saved chat history found.",
  hi: "कोई सहेजा गया चैट इतिहास नहीं मिला।",
  gu: "કોઈ સાચવેલ ચેટ ઇતિહાસ મળ્યો નથી.",
  mr: "कोणताही जतन केलेला चॅट इतिहास आढळला नाही.",
  ta: "சேமிக்கப்பட்ட அரட்டை வரலாறு எதுவும் இல்லை.",
  te: "సేవ్ చేసిన చాట్ చరిత్ర ఏదీ కనుగొనబడలేదు."
};

const QUERY_LABEL: Record<LanguageCode, string> = {
  en: "Question / Search",
  hi: "प्रश्न / खोज",
  gu: "પ્રશ્ન / શોધ",
  mr: "प्रश्न / शोध",
  ta: "கேள்வி / தேடல்",
  te: "ప్రశ్న / శోధన"
};

const ANSWER_LABEL: Record<LanguageCode, string> = {
  en: "Answer / Response",
  hi: "उत्तर / समाधान",
  gu: "જવાબ / ઉકેલ",
  mr: "उत्तर / समाधान",
  ta: "பதில்",
  te: "సమాధానం"
};

const RESTORE_CHAT_LABEL: Record<LanguageCode, string> = {
  en: "Open in Chat",
  hi: "चैट में खोलें",
  gu: "ચેટમાં ખોલો",
  mr: "चॅटमध्ये उघडा",
  ta: "அரட்டையில் திறக்கவும்",
  te: "చాట్‌లో తెరవండి"
};

const DELETE_CHAT_LABEL: Record<LanguageCode, string> = {
  en: "Delete",
  hi: "हटाएं",
  gu: "કાઢી નાખો",
  mr: "हटवा",
  ta: "அழி",
  te: "తొలగించు"
};

const PDF_LABELS: Record<LanguageCode, {
  documentTitle: string;
  subTitle: string;
  student: string;
  mentor: string;
  date: string;
  verification: string;
  academicQuestion: string;
  explanation: string;
  page: string;
  downloadSuccess: string;
  verifiedText: string;
  docSubtitle: string;
  conceptMap: string;
  flowchart: string;
  mainSubject: string;
  step: string;
  branches: string;
  connectedConcepts: string;
}> = {
  en: {
    documentTitle: "ACADEMIC STUDY NOTES LOG",
    subTitle: "Personal study notes curated by AI Mentor",
    student: "STUDENT:",
    mentor: "AI MENTOR:",
    date: "DATE CURATED:",
    verification: "VERIFICATION:",
    academicQuestion: "STUDENT QUESTION",
    explanation: "MENTOR RESPONSE & EXPLANATION",
    page: "Page",
    downloadSuccess: "Your study note PDF has been successfully generated and downloaded!",
    verifiedText: "🔒 Verified Academic Session Sync",
    docSubtitle: "AI Study Companion | Secure Study Log",
    conceptMap: "CONCEPT MIND MAP",
    flowchart: "INTERACTIVE FLOWCHART",
    mainSubject: "MAIN SUBJECT",
    step: "STEP",
    branches: "BRANCHES / CONCEPTS",
    connectedConcepts: "Connected Sub-concepts"
  },
  hi: {
    documentTitle: "शैक्षणिक अध्ययन नोट्स लॉग",
    subTitle: "AI मेंटर द्वारा तैयार व्यक्तिगत अध्ययन नोट्स",
    student: "छात्र:",
    mentor: "AI मेंटर:",
    date: "तैयार तिथि:",
    verification: "सत्यापन:",
    academicQuestion: "छात्र का प्रश्न",
    explanation: "मेंटर का उत्तर और स्पष्टीकरण",
    page: "पृष्ठ",
    downloadSuccess: "आपका अध्ययन नोट PDF सफलतापूर्वक डाउनलोड हो गया है!",
    verifiedText: "🔒 सत्यापित शैक्षणिक सत्र सिंक",
    docSubtitle: "AI अध्ययन साथी | सुरक्षित अध्ययन लॉग",
    conceptMap: "अवधारणा माइंड मैप",
    flowchart: "इंटरएक्टिव फ्लोचार्ट",
    mainSubject: "मुख्य विषय",
    step: "चरण",
    branches: "शाखाएँ / अवधारणाएँ",
    connectedConcepts: "जुड़े हुए उप-विषय"
  },
  gu: {
    documentTitle: "શૈક્ષણિક અભ્યાસ નોંધ લોગ",
    subTitle: "AI મેન્ટર દ્વારા ક્યુરેટ કરાયેલ વ્યક્તિગત અભ્યાસ નોંધો",
    student: "વિદ્યાર્થી:",
    mentor: "AI મેન્ટર:",
    date: "ક્યુરેટ કરેલી તારીખ:",
    verification: "ચકાસણી:",
    academicQuestion: "વિદ્યાર્થીનો પ્રશ્ન",
    explanation: "મેન્ટરનો જવાબ અને સ્પષ્ટીકરણ",
    page: "પૃષ્ઠ",
    downloadSuccess: "તમારી અભ્યાસ નોંધ PDF સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!",
    verifiedText: "🔒 પ્રમાણિત શૈક્ષણિક સત્ર સમન્વયન",
    docSubtitle: "AI અભ્યાસ સાથી | સુરક્ષિત અભ્યાસ લોગ",
    conceptMap: "ખ્યાલ માઇન્ડ મેપ",
    flowchart: "ઇન્ટરેક્ટિવ ફ્લોચાર્ટ",
    mainSubject: "મુખ્ય વિષય",
    step: "પગલું",
    branches: "શાખાઓ / વિભાવનાઓ",
    connectedConcepts: "જોડાયેલા પેટા-ખ્યાલો"
  },
  mr: {
    documentTitle: "शैक्षणिक अभ्यास नोट्स लॉग",
    subTitle: "AI मेंटरद्वारे क्युरेट केलेले वैयक्तिक अभ्यास नोट्स",
    student: "विद्यार्थी:",
    mentor: "AI मेंटर:",
    date: "क्युरेट केलेली तारीख:",
    verification: "पडताळणी:",
    academicQuestion: "विद्यार्थ्याचा प्रश्न",
    explanation: "मेंटरचे उत्तर आणि स्पष्टीकरण",
    page: "पृष्ठ",
    downloadSuccess: "तुमचे अभ्यास नोट PDF यशस्वीरित्या डाउनलोड झाले आहे!",
    verifiedText: "🔒 प्रमाणित शैक्षणिक सत्र संकालन",
    docSubtitle: "AI अभ्यास सोबती | सुरक्षित अभ्यास लॉग",
    conceptMap: "संकल्पना माइंड मॅप",
    flowchart: "परस्परसंवादी फ्लोचार्ट",
    mainSubject: "मुख्य विषय",
    step: "पायरी",
    branches: "शाखा / संकल्पना",
    connectedConcepts: "संबंधित उप-संकल्पना"
  },
  ta: {
    documentTitle: "கல்வி ஆய்வு குறிப்புகள் பதிவு",
    subTitle: "AI வழிகாட்டியால் நிர்வகிக்கப்படும் தனிப்பட்ட ஆய்வு குறிப்புகள்",
    student: "மாணவர்:",
    mentor: "AI வழிகாட்டி:",
    date: "நிர்வகிக்கப்பட்ட தேதி:",
    verification: "சரிபார்ப்பு:",
    academicQuestion: "மாணவர் கேள்வி",
    explanation: "வழிகாட்டி பதில் & விளக்கம்",
    page: "பக்கம்",
    downloadSuccess: "உங்கள் ஆய்வு குறிப்பு PDF வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டது!",
    verifiedText: "🔒 சரிபார்க்கப்பட்ட கல்வி அமர்வு ஒத்திசைவு",
    docSubtitle: "AI கல்வித் துணை | பாதுகாப்பான ஆய்வுப் பதிவு",
    conceptMap: "கருத்து மைண்ட் மேப்",
    flowchart: "ஊடாடும் பாய்வுப்படம்",
    mainSubject: "முதன்மை பொருள்",
    step: "படி",
    branches: "கிளைகள் / கருத்துக்கள்",
    connectedConcepts: "தொடர்புடைய துணை கருத்துக்கள்"
  },
  te: {
    documentTitle: "అకడమిక్ స్టడీ నోట్స్ లాగ్",
    subTitle: "AI మెంటర్ ద్వారా క్యూరేట్ చేయబడిన వ్యక్తిగత స్టడీ నోట్స్",
    student: "విద్యార్థి:",
    mentor: "AI మెంటర్:",
    date: "క్యూరేట్ చేసిన తేదీ:",
    verification: "ధృవీకరణ:",
    academicQuestion: "విద్యార్థి ప్రశ్న",
    explanation: "మెంటర్ సమాధానం & వివరణ",
    page: "పేజీ",
    downloadSuccess: "మీ స్టడీ నోట్ PDF విజయవంతంగా డౌన్‌లోడ్ చేయబడింది!",
    verifiedText: "🔒 ధృవీకరించబడిన విద్యా సెషన్ సమకాలీకరణ",
    docSubtitle: "AI అధ్యయన సహచరుడు | సురక్షిత అధ్యయన లాగ్",
    conceptMap: "భావన మైండ్ మ్యాప్",
    flowchart: "ఇంటరాక్టివ్ ఫ్లోచార్ట్",
    mainSubject: "ప్రధాన అంశం",
    step: "దశ",
    branches: "శాఖలు / భావనలు",
    connectedConcepts: "అనుబంధ ఉప-భావనలు"
  }
};

export default function AIAssistantTab({ user, lang, onUpdateUser }: AIAssistantTabProps) {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [inputText, setInputText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [msgHistory, setMsgHistory] = useState<Record<string, ChatMessage[]>>({});
  const [mascotAction, setMascotAction] = useState<'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think'>('idle');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = user.chatSessions;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const setActiveSessionId = (id: string | null) => {
    activeSessionIdRef.current = id;
    setActiveSessionIdState(id);
  };

  useEffect(() => {
    const serialized = JSON.stringify(chatSessions);
    if (user.chatSessions !== serialized) {
      onUpdateUser({ chatSessions: serialized });
    }
  }, [chatSessions]);

  // Synchronize student data when logged-in student session changes
  useEffect(() => {
    try {
      const savedSess = user.chatSessions;
      setChatSessions(savedSess ? JSON.parse(savedSess) : []);
    } catch {
      setChatSessions([]);
    }
  }, [user.chatSessions]);

  useEffect(() => {
    setActivePathId(user.activePathId || null);
  }, [user.activePathId]);

  useEffect(() => {
    try {
      const savedMilestones = user.completedMilestones;
      setCompletedMilestones(savedMilestones ? JSON.parse(savedMilestones) : []);
    } catch {
      setCompletedMilestones([]);
    }
  }, [user.completedMilestones]);

  // Reset temporary chat message state for security ONLY when the actual logged-in user changes
  useEffect(() => {
    setMsgHistory({});
    setActiveSessionId(null);
  }, [user.mobile]);

  const updateActiveSessionMessages = (updatedMsgs: ChatMessage[]) => {
    const userMsgs = updatedMsgs.filter(m => m.sender === 'user');
    if (userMsgs.length === 0) return;

    const currentSessId = activeSessionIdRef.current;

    if (currentSessId) {
      setChatSessions(prev => prev.map(s => s.id === currentSessId ? { ...s, messages: updatedMsgs } : s));
    } else {
      const firstUserMsg = userMsgs[0].text;
      const title = firstUserMsg.length > 30 ? firstUserMsg.slice(0, 30) + '...' : firstUserMsg;
      const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newSessId = 'sess-' + Date.now();
      
      const newSession: ChatSession = {
        id: newSessId,
        title,
        timestamp,
        messages: updatedMsgs
      };
      
      setActiveSessionId(newSessId);
      setChatSessions(prev => [newSession, ...prev]);
    }
  };

  const handleNewChat = () => {
    // Re-initialize active chat with a new welcome message
    const defaultWelcomeText = selectedChar.welcome[lang] || selectedChar.welcome['en'];
    const welcomeMsg: ChatMessage = {
      id: 'welcome-' + Date.now(),
      sender: 'assistant',
      text: defaultWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMsgHistory(prev => ({
      ...prev,
      [selectedChar.id]: [welcomeMsg]
    }));
    offlineSyncManager.saveChatHistory(selectedChar.id, [welcomeMsg], user.mobile);
    
    // Reset active session so next message starts a fresh session
    setActiveSessionId(null);
  };

  const handleLoadSession = (session: ChatSession) => {
    // Load the selected session's messages
    setMsgHistory(prev => ({
      ...prev,
      [selectedChar.id]: session.messages
    }));
    offlineSyncManager.saveChatHistory(selectedChar.id, session.messages, user.mobile);

    // Bind this session as the currently active one
    setActiveSessionId(session.id);
    
    // Close history sidebar without removing the session from the list!
    setShowHistory(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionIdRef.current === sessionId) {
      setActiveSessionId(null);
      // Reset active chat window
      const defaultWelcomeText = selectedChar.welcome[lang] || selectedChar.welcome['en'];
      const welcomeMsg: ChatMessage = {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: defaultWelcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: [welcomeMsg]
      }));
      offlineSyncManager.saveChatHistory(selectedChar.id, [welcomeMsg], user.mobile);
    }
  };

  // Multi-modal state managers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Local Learning Path Database states & persistence
  const [activePathId, setActivePathId] = useState<string | null>(() => {
    return user.activePathId || null;
  });

  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() => {
    try {
      const saved = user.completedMilestones;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user.activePathId !== (activePathId || '')) {
      onUpdateUser({ activePathId: activePathId || '' });
    }
  }, [activePathId]);

  useEffect(() => {
    const serialized = JSON.stringify(completedMilestones);
    if (user.completedMilestones !== serialized) {
      onUpdateUser({ completedMilestones: serialized });
    }
  }, [completedMilestones]);

  const activePath = LOCAL_LEARNING_PATHS.find(p => p.id === activePathId);

  const toggleMilestone = (milestoneId: string) => {
    setCompletedMilestones(prev => 
      prev.includes(milestoneId) 
        ? prev.filter(id => id !== milestoneId) 
        : [...prev, milestoneId]
    );
  };

  const handleStartLearningPath = async (path: typeof LOCAL_LEARNING_PATHS[0]) => {
    setActivePathId(path.id);
    // Send starter prompt
    const promptText = path.starterPrompt[lang] || path.starterPrompt['en'];
    await sendMessageWithPayload(promptText);
  };

  // Unified message sender to handle regular inputs & learning path starter prompts
  const sendMessageWithPayload = async (queryText: string, imagePayload?: { data: string; mimeType: string; name?: string }) => {
    const online = offlineSyncManager.isOnline();

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: imagePayload,
      pending: !online
    };

    const baseHistory = msgHistory[selectedChar.id] || [];
    const historyWithUser = [...baseHistory, userMsg];

    setMsgHistory(prev => ({
      ...prev,
      [selectedChar.id]: historyWithUser
    }));
    offlineSyncManager.saveChatHistory(selectedChar.id, historyWithUser, user.mobile);
    updateActiveSessionMessages(historyWithUser);

    offlineSyncManager.addLearningFeedEvent(user.mobile, {
      type: 'chat',
      title: lang === 'hi' ? `स्वामी एआई के साथ सहायक पठन` : `Assisted voice-reading with Swami AI`,
      subtitle: lang === 'hi' ? `आज • एआई अध्ययन साथी के साथ बातचीत की` : `Today • Engaged in AI study companion dialog`,
      icon: '🗣️',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600',
      timestamp: 'Today'
    });

    if (!online) {
      offlineSyncManager.queuePendingChat({
        id: userMsg.id,
        characterId: selectedChar.id,
        message: queryText,
        image: imagePayload,
        timestamp: userMsg.timestamp
      }, user.mobile);

      const offlineNotice: ChatMessage = {
        id: 'ai-off-' + Date.now(),
        sender: 'assistant',
        text: `${OFFLINE_DEVICE_TITLE[lang] || OFFLINE_DEVICE_TITLE['en']}\n${OFFLINE_DEVICE_BODY[lang] || OFFLINE_DEVICE_BODY['en']}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalWithNotice = [...historyWithUser, offlineNotice];
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: finalWithNotice
      }));
      offlineSyncManager.saveChatHistory(selectedChar.id, finalWithNotice, user.mobile);
      updateActiveSessionMessages(finalWithNotice);
      setMascotAction('idle');
      return;
    }

    setMascotAction('think');

    try {
      const bodyPayload: any = {
        message: queryText,
        systemInstruction: getSystemInstructionForMascot(),
        board: user.board || localStorage.getItem(`${user.mobile}_profile_board`) || 'CBSE',
        lang: lang
      };

      if (imagePayload) {
        bodyPayload.image = imagePayload;
      }

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();

      if (data.success) {
        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMsgHistory(prev => {
          const history = prev[selectedChar.id] || [];
          const unpendUserHistory = history.map(h => h.id === userMsg.id ? { ...h, pending: false } : h);
          const updated = [...unpendUserHistory, aiMsg];
          
          offlineSyncManager.saveChatHistory(selectedChar.id, updated, user.mobile);

          setTimeout(() => {
            speakMessageAloud(aiMsg);
          }, 300);

          updateActiveSessionMessages(updated);

          return {
            ...prev,
            [selectedChar.id]: updated
          };
        });

        // Dynamic motion trigger based on Gemini output
        const lowerRes = data.text.toLowerCase();
        let nextAction: typeof mascotAction = 'explaining';
        if (lowerRes.includes('excellent') || lowerRes.includes('great') || lowerRes.includes('superb') || lowerRes.includes('શાબાશ') || lowerRes.includes('बढ़िया') || lowerRes.includes('congrats')) {
          nextAction = 'celebrate';
        } else if (lowerRes.includes('think') || lowerRes.includes('riddle') || lowerRes.includes('puzz') || lowerRes.includes('सोचो') || lowerRes.includes('why')) {
          nextAction = 'think';
        } else if (lowerRes.includes('idea') || lowerRes.includes('trick') || lowerRes.includes('science') || lowerRes.includes('विज्ञान') || lowerRes.includes('fact')) {
          nextAction = 'idea';
        } else if (lowerRes.includes('welcome') || lowerRes.includes('hello') || lowerRes.includes('namaste') || lowerRes.includes('नमस्ते')) {
          nextAction = 'wave';
        }

        setMascotAction(nextAction);
        setTimeout(() => setMascotAction('idle'), 4000);

      } else {
        throw new Error(data.message || "Failed to contact Gemini engine");
      }

    } catch (err: any) {
      console.error("AI class query failed:", err);
      const errResponse: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        text: `Oh! I had a little hiccup connecting to the classroom orbital tower (Error: ${err.message || 'Signal lost'}). Double-check your network or retry in a moment!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMsgHistory(prev => {
        const history = prev[selectedChar.id] || [];
        const updated = [...history, errResponse];
        offlineSyncManager.saveChatHistory(selectedChar.id, updated, user.mobile);
        updateActiveSessionMessages(updated);
        return {
          ...prev,
          [selectedChar.id]: updated
        };
      });
      setMascotAction('idle');
    }
  };

  // Initialize welcome message or load historical conversations for selected character on mount or character update
  useEffect(() => {
    const history = offlineSyncManager.getChatHistory(selectedChar.id, user.mobile);
    if (history && history.length > 0) {
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: history
      }));

      // Restore activeSessionId if the loaded history matches a saved session
      let parsedSessions: ChatSession[] = [];
      try {
        parsedSessions = user.chatSessions ? JSON.parse(user.chatSessions) : [];
      } catch {}
      const matchedSession = parsedSessions.find(s => 
        s.messages.length === history.length && 
        s.messages[s.messages.length - 1]?.text === history[history.length - 1]?.text
      );
      if (matchedSession) {
        setActiveSessionId(matchedSession.id);
      } else {
        setActiveSessionId(null);
      }
    } else {
      const defaultWelcomeText = selectedChar.welcome[lang] || selectedChar.welcome['en'];
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        text: defaultWelcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: [welcomeMsg]
      }));
      offlineSyncManager.saveChatHistory(selectedChar.id, [welcomeMsg], user.mobile);
      setActiveSessionId(null);
    }
  }, [selectedChar.id, lang, user.mobile]);

  // Keep chat scrolled down
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [msgHistory, selectedChar]);

  // Stop synthesis when moving away/switching character
  useEffect(() => {
    stopSpeaking();
    setIsPlayingVoice(null);
    setMascotAction('idle');
    setAttachedFile(null);
  }, [selectedChar]);

  const activeMessages = msgHistory[selectedChar.id] || [];
  
  const exportMessageToPDF = (msg: ChatMessage) => {
    // Find preceding user question
    let userQuestion = "";
    
    const activeMsgIndex = activeMessages.findIndex(m => m.id === msg.id);
    if (activeMsgIndex > 0) {
      for (let i = activeMsgIndex - 1; i >= 0; i--) {
        if (activeMessages[i].sender === 'user') {
          userQuestion = activeMessages[i].text;
          break;
        }
      }
    }
    
    if (!userQuestion) {
      for (const session of chatSessions) {
        const idx = session.messages.findIndex(m => m.id === msg.id);
        if (idx > 0) {
          for (let i = idx - 1; i >= 0; i--) {
            if (session.messages[i].sender === 'user') {
              userQuestion = session.messages[i].text;
              break;
            }
          }
          break;
        }
      }
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = 15;

    // Helper to check and handle page break
    const ensureSpace = (height: number) => {
      if (currentY + height > pageHeight - margin - 12) {
        doc.addPage();
        currentY = margin + 10;
        drawPageBackground();
      }
    };

    const drawPageBackground = () => {
      // Draw border
      doc.setDrawColor(220, 215, 205);
      doc.setLineWidth(0.2);
      doc.rect(margin - 5, margin - 5, pageWidth - (margin - 5) * 2, pageHeight - (margin - 5) * 2);
      
      // Header accent bar
      doc.setFillColor(61, 64, 91); // #3D405B Slate
      doc.rect(margin - 5, margin - 5, pageWidth - (margin - 5) * 2, 4, 'F');

      // Thin accent bar at bottom
      doc.setFillColor(224, 122, 95); // #E07A5F Coral
      doc.rect(margin - 5, pageHeight - margin + 1, pageWidth - (margin - 5) * 2, 4, 'F');

      // Page Number Footer
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageNum = doc.getNumberOfPages();
      const labels = PDF_LABELS[lang] || PDF_LABELS['en'];
      doc.text(`${labels.page} ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(labels.docSubtitle, pageWidth - margin, pageHeight - 8, { align: 'right' });
    };

    // Initial background drawing
    drawPageBackground();
    currentY += 8;

    const labels = PDF_LABELS[lang] || PDF_LABELS['en'];

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(61, 64, 91);
    doc.text(labels.documentTitle, margin, currentY);
    currentY += 6;

    // Subtitle
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 120);
    doc.text(`${labels.subTitle} ${selectedChar.name}`, margin, currentY);
    currentY += 8;

    // Meta box
    ensureSpace(35);
    doc.setFillColor(250, 248, 244);
    doc.setDrawColor(230, 225, 215);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, contentWidth, 28, 'FD');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(61, 64, 91);
    
    doc.text(labels.student, margin + 5, currentY + 6);
    doc.text(labels.mentor, margin + 5, currentY + 12);
    doc.text(labels.date, margin + 5, currentY + 18);
    doc.text(labels.verification, margin + 5, currentY + 24);

    const studentName = user.name || 'Verified Student';
    const gradeLevel = localStorage.getItem(`${user.mobile}_profile_standard`) || user.standard || 'Primary Grade';

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(80, 80, 90);
    doc.text(`${studentName} (${gradeLevel})`, margin + 35, currentY + 6);
    doc.text(`${selectedChar.name} (${selectedChar.role || 'Mascot Companion'})`, margin + 35, currentY + 12);
    doc.text(msg.timestamp || new Date().toLocaleDateString(), margin + 35, currentY + 18);
    doc.text(labels.verifiedText, margin + 35, currentY + 24);
    currentY += 36;

    // Question Section
    if (userQuestion) {
      ensureSpace(20);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(224, 122, 95);
      doc.text(labels.academicQuestion, margin, currentY);
      currentY += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 70);
      
      const splitQuestion = doc.splitTextToSize(userQuestion, contentWidth - 8);
      const boxHeight = splitQuestion.length * 5 + 6;
      
      ensureSpace(boxHeight + 5);
      doc.setFillColor(253, 251, 247);
      doc.setDrawColor(242, 204, 143);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, contentWidth, boxHeight, 'FD');
      
      doc.setFillColor(242, 204, 143);
      doc.rect(margin, currentY, 2.5, boxHeight, 'F');

      doc.text(splitQuestion, margin + 6, currentY + 5);
      currentY += boxHeight + 8;
    }

    // Answer Section
    ensureSpace(20);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(129, 178, 154);
    doc.text(labels.explanation, margin, currentY);
    currentY += 6;

    const parsed = parseMessageContent(msg.text);
    const cleanText = parsed.text;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 50);

    const lines = cleanText.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        currentY += 3.5;
        return;
      }

      const isHeading = trimmedLine.startsWith('#') || (trimmedLine.startsWith('**') && trimmedLine.endsWith('**'));
      const cleanLine = trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '');

      if (isHeading) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(61, 64, 91);
        const splitHeading = doc.splitTextToSize(cleanLine, contentWidth);
        const height = splitHeading.length * 4.5;
        ensureSpace(height + 2);
        doc.text(splitHeading, margin, currentY);
        currentY += height + 2.5;
      } else if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 60);
        
        let symbol = "•";
        let textOffset = 6;
        let contentPart = trimmedLine;
        if (/^\d+\./.test(trimmedLine)) {
          const match = trimmedLine.match(/^(\d+\.)/);
          symbol = match ? match[1] : "•";
          textOffset = 8;
          contentPart = trimmedLine.replace(/^\d+\.\s*/, '');
        } else {
          contentPart = trimmedLine.replace(/^[-*]\s*/, '');
        }
        contentPart = contentPart.replace(/\*\*/g, '');

        ensureSpace(5);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(224, 122, 95);
        doc.text(symbol, margin + 2, currentY);
        
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(50, 50, 60);
        const splitBullet = doc.splitTextToSize(contentPart, contentWidth - textOffset);
        const height = splitBullet.length * 4.5;
        ensureSpace(height + 1);
        doc.text(splitBullet, margin + textOffset, currentY);
        currentY += height + 2;
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 65);
        const splitParagraph = doc.splitTextToSize(cleanLine, contentWidth);
        const height = splitParagraph.length * 4.5;
        ensureSpace(height + 1);
        doc.text(splitParagraph, margin, currentY);
        currentY += height + 1.5;
      }
    });

    // Add Diagram Section if present
    if (parsed.diagram) {
      currentY += 8;
      ensureSpace(30);
      
      // Divider line
      doc.setDrawColor(220, 215, 205);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, margin + contentWidth, currentY);
      currentY += 6;
      
      // Section header title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(61, 64, 91); // #3D405B Slate
      const sectionHeader = parsed.diagram.type === 'mindmap' ? labels.conceptMap : labels.flowchart;
      doc.text(`${sectionHeader}: ${parsed.diagram.title || 'Visual Study Chart'}`, margin, currentY);
      currentY += 6;

      if (parsed.diagram.type === 'mindmap') {
        const mm = parsed.diagram;
        if (mm.root) {
          // Render Main Subject Box
          const mainLabel = mm.root.label || 'Subject';
          const mainDesc = mm.root.description || '';
          
          // Let's determine height of Main Subject box
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          const splitMainLabel = doc.splitTextToSize(mainLabel, contentWidth - 10);
          
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(8.5);
          const splitMainDesc = mainDesc ? doc.splitTextToSize(mainDesc, contentWidth - 10) : [];
          
          const mainBoxHeight = 8 + (splitMainLabel.length * 4.5) + (splitMainDesc.length > 0 ? (splitMainDesc.length * 4) + 2 : 0);
          
          ensureSpace(mainBoxHeight + 5);
          
          // Draw Main Subject Box background (Slate Solid background)
          doc.setFillColor(61, 64, 91); // #3D405B
          doc.rect(margin, currentY, contentWidth, mainBoxHeight, 'F');
          
          // Add a border accent
          doc.setDrawColor(242, 204, 143); // #F2CC8F Yellow accent
          doc.setLineWidth(0.8);
          doc.rect(margin, currentY, contentWidth, mainBoxHeight, 'D');
          
          // Small badge
          doc.setFillColor(242, 204, 143);
          doc.rect(margin + 4, currentY - 2.5, 28, 5, 'F');
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(61, 64, 91);
          doc.text(labels.mainSubject, margin + 6, currentY + 1);
          
          // Text inside Main Subject Box
          let textY = currentY + 6;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text(splitMainLabel, margin + 5, textY);
          textY += splitMainLabel.length * 4.5;
          
          if (splitMainDesc.length > 0) {
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(230, 230, 240);
            doc.text(splitMainDesc, margin + 5, textY);
            textY += splitMainDesc.length * 4;
          }
          
          currentY += mainBoxHeight + 8;
          
          // Render branches
          if (mm.root.branches && Array.isArray(mm.root.branches)) {
            mm.root.branches.forEach((branch: any, bIdx: number) => {
              const bLabel = branch.label || '';
              const bDesc = branch.description || '';
              const bSubs = branch.subBranches || [];
              
              // Prepare texts
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(9.5);
              const splitBLabel = doc.splitTextToSize(bLabel, contentWidth - 12);
              
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              const splitBDesc = bDesc ? doc.splitTextToSize(bDesc, contentWidth - 12) : [];
              
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8);
              const subsText = bSubs.length > 0 ? `${labels.connectedConcepts}: ${bSubs.join(', ')}` : '';
              const splitBSubs = subsText ? doc.splitTextToSize(subsText, contentWidth - 12) : [];
              
              const bBoxHeight = 8 + (splitBLabel.length * 4) 
                + (splitBDesc.length > 0 ? (splitBDesc.length * 3.8) + 2 : 0)
                + (splitBSubs.length > 0 ? (splitBSubs.length * 3.5) + 3 : 0);
              
              ensureSpace(bBoxHeight + 6);
              
              // Background (Soft tint card)
              // Color cyclic accent
              const colors = [
                { r: 224, g: 122, b: 95 }, // Coral
                { r: 129, g: 178, b: 154 }, // Green
                { r: 242, g: 204, b: 143 }  // Yellow/Amber
              ];
              const accentColor = colors[bIdx % colors.length];
              
              doc.setFillColor(253, 252, 250);
              doc.setDrawColor(220, 215, 205);
              doc.setLineWidth(0.3);
              doc.rect(margin, currentY, contentWidth, bBoxHeight, 'FD');
              
              // Left side vertical stripe
              doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
              doc.rect(margin, currentY, 3, bBoxHeight, 'F');
              
              // Small branch badge index on the right
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(7.5);
              doc.setTextColor(140, 140, 140);
              doc.text(`BRANCH ${bIdx + 1}`, margin + contentWidth - 22, currentY + 4.5);
              
              let bTextY = currentY + 5;
              
              // Title
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(9.5);
              doc.setTextColor(61, 64, 91);
              doc.text(splitBLabel, margin + 6, bTextY);
              bTextY += splitBLabel.length * 4;
              
              // Description
              if (splitBDesc.length > 0) {
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8.5);
                doc.setTextColor(80, 80, 90);
                doc.text(splitBDesc, margin + 6, bTextY);
                bTextY += (splitBDesc.length * 3.8) + 2;
              }
              
              // Connected concepts (sub-branches)
              if (splitBSubs.length > 0) {
                doc.setFillColor(245, 243, 238);
                doc.rect(margin + 5, bTextY - 1, contentWidth - 10, (splitBSubs.length * 3.5) + 2, 'F');
                
                doc.setFont("Helvetica", "italic");
                doc.setFontSize(8);
                doc.setTextColor(110, 110, 120);
                doc.text(splitBSubs, margin + 8, bTextY + 2.5);
                bTextY += (splitBSubs.length * 3.5) + 3;
              }
              
              currentY += bBoxHeight + 5;
            });
          }
        }
      } else if (parsed.diagram.type === 'flowchart') {
        // Render Flowchart Step-by-Step path
        const fc = parsed.diagram;
        if (fc.nodes && Array.isArray(fc.nodes)) {
          fc.nodes.forEach((node: any, nIdx: number) => {
            const nLabel = node.label || '';
            const nDesc = node.description || '';
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9.5);
            const splitNLabel = doc.splitTextToSize(nLabel, contentWidth - 15);
            
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            const splitNDesc = nDesc ? doc.splitTextToSize(nDesc, contentWidth - 15) : [];
            
            const nBoxHeight = 8 + (splitNLabel.length * 4) + (splitNDesc.length > 0 ? (splitNDesc.length * 3.8) + 1 : 0);
            
            ensureSpace(nBoxHeight + 8);
            
            // Draw visual step connection line if not first
            if (nIdx > 0) {
              doc.setDrawColor(224, 122, 95); // Coral arrow/line
              doc.setLineWidth(1.2);
              doc.line(margin + 8, currentY - 5, margin + 8, currentY);
              // Draw an arrowhead
              doc.setFillColor(224, 122, 95);
              doc.triangle(margin + 6.5, currentY - 1.5, margin + 9.5, currentY - 1.5, margin + 8, currentY, 'F');
            }
            
            // Card background
            doc.setFillColor(253, 252, 250);
            doc.setDrawColor(220, 215, 205);
            doc.setLineWidth(0.3);
            doc.rect(margin + 15, currentY, contentWidth - 15, nBoxHeight, 'FD');
            
            // Accent border on left side of Card
            doc.setFillColor(61, 64, 91); // #3D405B Slate
            doc.rect(margin + 15, currentY, 2.5, nBoxHeight, 'F');
            
            // Draw a circle on the left with Step index (Timeline style)
            doc.setFillColor(224, 122, 95); // Coral circle
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.5);
            doc.circle(margin + 8, currentY + (nBoxHeight / 2), 4, 'FD');
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            doc.text(`${nIdx + 1}`, margin + 8, currentY + (nBoxHeight / 2) + 1, { align: 'center' });
            
            let nTextY = currentY + 5;
            
            // Step title
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(61, 64, 91);
            doc.text(splitNLabel, margin + 21, nTextY);
            nTextY += splitNLabel.length * 4;
            
            // Step Description
            if (splitNDesc.length > 0) {
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(80, 80, 90);
              doc.text(splitNDesc, margin + 21, nTextY);
            }
            
            currentY += nBoxHeight + 5;
          });
        }
      }
    }

    const safeTitle = (userQuestion || "Explanation").substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`AI_Study_Note_${selectedChar.id}_${safeTitle}.pdf`);
    
    speakText(
      labels.downloadSuccess,
      lang,
      selectedChar.name,
      `🤖 ${selectedChar.name}`
    );
  };

  const copyMessageToClipboard = (msg: ChatMessage) => {
    const parsed = parseMessageContent(msg.text);
    navigator.clipboard.writeText(parsed.text).then(() => {
      setCopiedMessageId(msg.id);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const speakMessageAloud = (msg: ChatMessage) => {
    if (isPlayingVoice === msg.id) {
      stopSpeaking();
      setIsPlayingVoice(null);
      setMascotAction('idle');
      return;
    }

    setIsPlayingVoice(msg.id);
    setMascotAction('explaining');
    
    // Parse message to read only the human-readable explanation aloud, preventing voice reading of JSON raw strings!
    const parsed = parseMessageContent(msg.text);
    
    speakText(
      parsed.text, 
      lang, 
      selectedChar.name, 
      selectedChar.char, 
      () => {
        setIsPlayingVoice(null);
        setMascotAction('idle');
      }
    );
  };

  const getSystemInstructionForMascot = () => {
    const languageNames: Record<LanguageCode, string> = {
      en: "English",
      hi: "Hindi (हिंदी)",
      gu: "Gujarati (ગુજરાતી)",
      mr: "Marathi (मराठी)",
      ta: "Tamil (தமிழ்)",
      te: "Telugu (తెలుగు)"
    };
    const targetLanguageName = languageNames[lang] || "English";

    // Retrieve customized student context
    const studentName = user.name || 'Student';
    const gradeLevel = localStorage.getItem(`${user.mobile}_profile_standard`) || user.standard || 'Grade 6 Science';
    const studentVillage = localStorage.getItem(`${user.mobile}_profile_village`) || user.village || 'Rampur Vilas';
    const studentSchool = localStorage.getItem(`${user.mobile}_profile_school`) || user.school || 'Rampur Primary Public School';
    const studentPoints = Number(localStorage.getItem(`${user.mobile}_quizzes_total_points`)) || 40;
    const currentProgress = studentPoints < 100 ? "Beginner" : studentPoints < 300 ? "Intermediate" : "Reviewing & Advanced";

    const baseInstruction = (() => {
      switch (selectedChar.id) {
        case 'dadi':
          return `You are Dadi AI 👵, an empathetic, wise, warm village grandmother and traditional storyteller designed specifically for rural students. 
Your goal is to teach rural Indian children concepts of stars, clouds, rain, farming, or moral life lessons.
Always speak very warmly and use parental language (like "Dear child", "my child", "खुश रहो मेरे बच्चे").
Teach concepts by spinning them into short folk tales or traditional grandmother wisdom, but back it up with simple science so they learn. 
When analyzing images or PDF documents, explain the handwritten notes, textbook pages, or educational chapters in a gentle, warm storyteller style using simple village terms.

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.

Keep answers sweet, engaging, and under 150 words.`;
        case 'chanda':
          return `You are Chanda AI 🦊, a clever, hyperactive forest fox who is a master of Mathematics, serving as an empathetic tutor for rural students. 
You love challenges, speed tricks, multiplication tables, fast divisions, and fun logic riddles!
Challenge the student playfully with quick sums or teach them smart maths hacks (like multiplying by 5 or 9) using rural examples like counting cows, mango fruits, or seed sacks.
When analyzing images, textbook pages, or mathematical PDFs, spot any math problems, write out the step-by-step solution, and provide a quick witty calculation hack!
Keep your response highly energetic, fun, and extremely clear. Use playful fox actions in text descriptions (e.g., *twirls bushy tail*).

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.`;
        default: // swami
          return `You are Swami AI 🤖, a friendly, encouraging robot educational mascot and an empathetic, highly adaptive tutor designed specifically for rural Indian students. 
You are an expert tutor in Science, Logic, History, and general topics.
You explain complex modern subjects using humble, easy-to-understand village analogies (like crops, cycle pumps, rainfall, solar energy, local cattle).
When students upload pictures of textbook pages, PDF document chapters, assignments, diagrams, or science experiment charts, analyze and summarize them thoroughly, dissect any diagrams, and give a highly interesting breakdown.
Always stay positive, encourage their curiosity, and say words like "Smart friend!" or "Amazing curiosity!". 

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.

Keep replies compact and structured.`;
      }
    })();

    // Dynamic adaptive student guidelines
    const studentBoard = user.board || localStorage.getItem(`${user.mobile}_profile_board`) || 'CBSE';

    const adaptationInstruction = `

[EMPATHETIC ADAPTIVE LEARNING GUIDELINES]
You MUST adapt your personality and teaching strictly based on the following student profile:
1. [Student_Name]: Address the student personally as "${studentName}" to build strong rapport and trust.
2. [Grade_Level]: Scale the complexity of your explanations and terminology to match exactly "${gradeLevel}". Do not be too complex or too basic.
3. [Language/Dialect]: Respond strictly in the student's preferred language ("${targetLanguageName}"). You MUST use simple, local, and culturally relevant analogies (such as farming, village crops, local markets, cattle, or village festivals) to explain complex topics.
4. [Subject/Topic]: Dynamically detect the subject/topic based on the student's message, and focus strictly on it.
5. [Current_Progress]: The student's current progress level is "${currentProgress}". Tailor your explanation:
   - For Beginner: Break things down step-by-step, explain starting terms simply, and be extra encouraging.
   - For Intermediate: Pose questions, use active application prompts, and encourage independent reasoning.
   - For Reviewing: Summarize key takeaways, connect concepts together, and challenge them to explain it.
6. [Village_Location]: The student is from the village "${studentVillage || 'not specified'}". Incorporate or refer to their village/rural life in examples, stories, or math problems if relevant to ground concepts locally.
7. [School_Name]: The student studies at "${studentSchool || 'their school'}". Refer to their school context to make explanations personal and relatable.
8. [Academic_Board]: The student follows the "${studentBoard}" curriculum. Ensure explanation styles, marking formats, or curricular terminology align beautifully with this educational board.

[BEHAVIOR & PEDAGOGICAL GUIDELINES]
- Do not give wall-of-text answers. Use short, beautifully spaced paragraphs and bullet points for high legibility.
- Always ask exactly ONE clear concept-checking question at the end of your response to test understanding.
- If the student makes a mistake or gives an incorrect answer, gently guide them with hints or Socratic questions to the correct answer rather than just giving it to them.
`;

    // Fetch active learning path guidelines to steer the companion tutor
    let learningPathBonus = '';
    if (activePathId) {
      const matchedPath = LOCAL_LEARNING_PATHS.find(p => p.id === activePathId);
      if (matchedPath) {
        learningPathBonus = `\n\n[STRUCTURED LEARNING PATH MODE ACTIVE]\n${matchedPath.systemInstructionBonus}\n\n`;
      }
    }

    // Append the visual mapping guidelines for multi-modal diagrams and concept flowcharts
    return `${baseInstruction}${adaptationInstruction}${learningPathBonus}

CRITICAL: If the student's request or the concept you are explaining can be structured visually (like processes, water/nitrogen cycles, plant/animal anatomy, step-by-step math solutions, story timeline events, or classifications), you MUST ALWAYS append a visual structure block at the very end of your response in one of the following JSON formats inside a \`\`\`diagram-data ... \`\`\` block.
Do not use markdown formatting (like asterisks or bolding) inside the JSON string values. Keep string values plain and clean.

JSON structure options:

Option 1: For Sequential Processes/Flowcharts:
\`\`\`diagram-data
{
  "type": "flowchart",
  "title": "Title of the Flowchart",
  "nodes": [
    { "id": "1", "label": "Step 1 Label", "description": "Short explanation of Step 1." },
    { "id": "2", "label": "Step 2 Label", "description": "Short explanation of Step 2." }
  ]
}
\`\`\`

Option 2: For Hierarchical Concepts/Mind Maps/Concept Maps:
\`\`\`diagram-data
{
  "type": "mindmap",
  "title": "Title of the Concept Map",
  "root": {
    "label": "Central Subject",
    "description": "Short introduction to the subject.",
    "branches": [
      {
        "label": "Branch 1 Name",
        "description": "Explanation of branch 1.",
        "subBranches": ["Sub-category A", "Sub-category B"]
      }
    ]
  }
}
\`\`\`
`;
  };

  const processUploadedFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      alert("Please select a valid image file (PNG, JPG, JPEG, WEBP) or an educational PDF document.");
      return;
    }
    
    // Check file size (limit to 10MB to prevent browser memory crashes or payload limits)
    if (file.size > 10 * 1024 * 1024) {
      alert("Selected file is too large. Please upload a file smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedFile({
          name: file.name,
          data: event.target.result as string,
          mimeType: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let queryText = inputText.trim();
    if (!queryText && !attachedFile) return;

    if (!queryText && attachedFile) {
      if (attachedFile.mimeType === "application/pdf") {
        queryText = "Please analyze this educational document / PDF textbook chapter, summarize it comprehensively, and explain its key concepts in simple terms.";
      } else {
        queryText = "Please analyze this image (handwritten notes, diagram, textbook chapter, or assignment) and explain its concept or solve the problem clearly.";
      }
    }

    const filePayload = attachedFile ? { data: attachedFile.data, mimeType: attachedFile.mimeType, name: attachedFile.name } : undefined;
    
    setInputText('');
    setAttachedFile(null);
    setShowHistory(false);

    await sendMessageWithPayload(queryText, filePayload);
  };

  return (
    <div className="max-w-4xl mx-auto text-left">
      
      {/* RIGHT: LIVE CHAT DIALOGUE BOX */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm flex flex-col h-[520px] overflow-hidden relative">
        
        {/* Chat Ribbon Header */}
        <div className="bg-[#3D405B] text-white p-3.5 px-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{selectedChar.char.split(' ')[0]}</span>
            <div>
              <h4 className="font-display font-extrabold text-sm">{selectedChar.name}</h4>
              <p className="text-[10px] text-[#FAF8F4]/80 font-sans flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-green-400 rounded-full" />
                <span>{READY_EXPLAIN_LABELS[lang] || READY_EXPLAIN_LABELS['en']}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`text-[11px] sm:text-xs border px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                showHistory 
                  ? 'bg-[#FAF8F4] text-[#3D405B] border-[#F2CC8F]' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title={showHistory 
                ? (lang === 'hi' ? 'सक्रिय संवाद पर वापस जाएं' : 'Back to Active Chat') 
                : (VIEW_HISTORY_LABELS[lang] || VIEW_HISTORY_LABELS['en'])}
            >
              <BookOpen className={`h-3.5 w-3.5 ${showHistory ? 'text-[#E07A5F]' : 'text-[#F2CC8F]'}`} />
              <span className="hidden sm:inline">
                {showHistory 
                  ? (lang === 'hi' ? 'सक्रिय संवाद' : 'Active Chat') 
                  : (VIEW_HISTORY_LABELS[lang] || VIEW_HISTORY_LABELS['en'])}
              </span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={() => {
                handleNewChat();
                setShowHistory(false);
              }}
              className="text-[11px] sm:text-xs bg-[#E07A5F] hover:bg-[#CE6B50] text-white border border-transparent px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title={NEW_CHAT_LABELS[lang] || NEW_CHAT_LABELS['en']}
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              <span className="hidden sm:inline">{NEW_CHAT_LABELS[lang] || NEW_CHAT_LABELS['en']}</span>
            </button>
          
            {isPlayingVoice && (
              <button
                onClick={() => { stopSpeaking(); setIsPlayingVoice(null); setMascotAction('idle'); }}
                className="text-xs bg-red-500/20 text-rose-300 border border-red-500/40 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <VolumeX className="h-3.5 w-3.5" />
                <span>{STOP_ALOUD_LABELS[lang] || STOP_ALOUD_LABELS['en']}</span>
              </button>
            )}
          </div>
        </div>



        {/* Message Log Container */}
        <div 
          ref={chatScrollRef}
          className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F4]/45 rounded-b-xl"
        >
          {showHistory ? (
            /* INLINE FULL SEARCH HISTORY VIEW WITH NATIVE CHAT BUBBLES */
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white border border-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-3xs shrink-0">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-[#3D405B] flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-[#E07A5F]" />
                    <span>{lang === 'hi' ? 'मेरा सम्पूर्ण खोज इतिहास' : 'My Entire Search & Study History'}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {lang === 'hi' 
                      ? 'आपके द्वारा पहले पूछे गए सभी प्रश्न और प्राप्त उत्तर यहाँ प्रदर्शित हैं।' 
                      : 'All your previously asked questions and answers are listed below.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                  {chatSessions.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(lang === 'hi' ? "क्या आप सचमुच पूरा इतिहास मिटाना चाहते हैं?" : "Are you sure you want to permanently clear all search history?")) {
                          setChatSessions([]);
                          setActiveSessionId(null);
                          // Reset active chat window to welcome message
                          const defaultWelcomeText = selectedChar.welcome[lang] || selectedChar.welcome['en'];
                          const welcomeMsg: ChatMessage = {
                            id: 'welcome-' + Date.now(),
                            sender: 'assistant',
                            text: defaultWelcomeText,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };
                          setMsgHistory(prev => ({
                            ...prev,
                            [selectedChar.id]: [welcomeMsg]
                          }));
                          offlineSyncManager.saveChatHistory(selectedChar.id, [welcomeMsg], user.mobile);

                          if (onUpdateUser) {
                            onUpdateUser({
                              chatSessions: JSON.stringify([])
                            });
                          }
                        }
                      }}
                      className="text-[10px] sm:text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Trash className="h-3 w-3" />
                      <span>{lang === 'hi' ? 'इतिहास साफ़ करें' : 'Clear All'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-[10px] sm:text-xs bg-[#3D405B] hover:bg-[#2D2F44] text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all active:scale-95"
                  >
                    {lang === 'hi' ? 'चैट पर वापस जाएं' : 'Back to Chat'}
                  </button>
                </div>
              </div>

              {chatSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-sans bg-white rounded-2xl border border-gray-150 p-6 flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">📚</span>
                  <p className="font-bold">{lang === 'hi' ? 'कोई इतिहास नहीं मिला।' : 'No search history found.'}</p>
                  <p className="text-[10px] text-gray-400">{lang === 'hi' ? 'चैट शुरू करके प्रश्न पूछना आरंभ करें!' : 'Start asking questions to build your search history!'}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className="space-y-4"
                    >
                      {/* Session Elegant Divider Header */}
                      <div className="border border-gray-200 bg-[#FAF8F4]/80 p-3 px-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-3xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">📖</span>
                          <div className="truncate">
                            <span className="text-xs font-extrabold text-[#3D405B] block truncate leading-tight">
                              {session.title}
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono block mt-0.5">
                              📅 {session.timestamp}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                          {/* Toggle expand/collapse button */}
                          <button
                            onClick={() => {
                              setExpandedSessions(prev => ({
                                ...prev,
                                [session.id]: !prev[session.id]
                              }));
                            }}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#E07A5F] hover:text-[#CE6B50] font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 active:scale-95 shadow-3xs"
                            title={expandedSessions[session.id] ? "Hide conversation history" : "Show conversation history"}
                          >
                            {expandedSessions[session.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            <span>{expandedSessions[session.id] ? (lang === 'hi' ? 'छिपाएं' : 'Hide') : (lang === 'hi' ? 'देखें' : 'View')}</span>
                          </button>
                          
                          <button
                            onClick={() => handleLoadSession(session)}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#81B29A] hover:text-[#5fa383] font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 active:scale-95 shadow-3xs"
                            title="Restore this conversation in the active chat view"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{RESTORE_CHAT_LABEL[lang] || RESTORE_CHAT_LABEL['en']}</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100 active:scale-95"
                            title="Permanently delete this search history item"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Render Messages in exact native bubble styling, collapsible */}
                      {expandedSessions[session.id] && (
                        <div className="space-y-4 pl-1 sm:pl-3 border-t border-gray-150/40 pt-3 animate-fade-in">
                          {session.messages
                            .filter(msg => msg.sender === 'user' || (msg.sender === 'assistant' && !msg.text.includes(selectedChar.welcome[lang] || '')))
                            .map((msg, idx) => {
                              const isMe = msg.sender === 'user';
                              return (
                                <div 
                                  key={msg.id || idx}
                                  className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                                >
                                  {/* Character Icon bubble / Student icon */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-lg shadow-2xs select-none ${
                                    isMe ? 'bg-[#F2CC8F] border border-orange-200' : 'bg-white border border-gray-200'
                                  }`}>
                                    {isMe ? '🎒' : selectedChar.char.split(' ')[0]}
                                  </div>

                                  {/* Bubble content */}
                                  <div className="space-y-1">
                                    <div className={`p-3.5 rounded-2xl relative shadow-3xs text-xs sm:text-sm border text-left ${
                                      isMe 
                                        ? 'bg-gradient-to-tr from-[#3D405B] to-[#4D506F] text-white border-transparent rounded-tr-none' 
                                        : 'bg-white text-gray-850 border-gray-150 rounded-tl-none'
                                    }`}>
                                      
                                      {msg.image && (
                                        <div className="mb-2 overflow-hidden rounded-xl border border-gray-150 bg-gray-50 flex justify-center items-center max-w-sm">
                                          {msg.image.mimeType === "application/pdf" ? (
                                            <div className="p-3.5 w-full bg-rose-50/70 rounded-lg flex items-center gap-3 border border-rose-100 text-left select-none">
                                              <div className="h-10 w-10 rounded-lg bg-red-600 text-white font-black flex items-center justify-center shadow-sm text-xs shrink-0">
                                                PDF
                                              </div>
                                              <div className="truncate flex-1">
                                                <span className="text-xs font-black text-rose-950 block truncate">
                                                  {msg.image.name || "Educational Document.pdf"}
                                                </span>
                                                <span className="text-[10px] text-rose-700/80 font-sans block">
                                                  Educational PDF Document
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <img 
                                              src={msg.image.data} 
                                              alt="Student academic upload" 
                                              referrerPolicy="no-referrer"
                                              className="max-h-52 w-auto max-w-full rounded-lg object-contain"
                                            />
                                          )}
                                        </div>
                                      )}

                                      {(() => {
                                        const parsed = parseMessageContent(msg.text);
                                        return (
                                          <>
                                            <p className="leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                                            {parsed.diagram && (
                                              <InteractiveDiagram data={parsed.diagram} lang={lang} />
                                            )}
                                          </>
                                        );
                                      })()}
                                      
                                      {/* Action buttons (Speak aloud, Download PDF, & Copy Plain Text) inside character box */}
                                      {!isMe && (
                                        <div className="absolute -bottom-3 -right-2 flex items-center gap-1 bg-white p-0.5 rounded-full border border-gray-100 shadow-sm z-10">
                                          <button
                                            onClick={() => speakMessageAloud(msg)}
                                            className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                                              isPlayingVoice === msg.id 
                                                ? 'bg-rose-500 text-white animate-bounce shadow-sm' 
                                                : 'text-[#E07A5F] hover:bg-gray-50'
                                            }`}
                                            title={READ_ALOUD_TOOLTIP_LABELS[lang] || READ_ALOUD_TOOLTIP_LABELS['en']}
                                          >
                                            {isPlayingVoice === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                          </button>
                                          
                                          <button
                                            onClick={() => exportMessageToPDF(msg)}
                                            className="p-1 rounded-full text-xs text-blue-600 hover:bg-gray-50 cursor-pointer transition-all"
                                            title={lang === 'en' ? "Download PDF Version" : "PDF संस्करण डाउनलोड करें"}
                                          >
                                            <FileDown className="h-3 w-3" />
                                          </button>

                                          <button
                                            onClick={() => copyMessageToClipboard(msg)}
                                            className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                                              copiedMessageId === msg.id 
                                                ? 'bg-emerald-500 text-white shadow-sm' 
                                                : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                            title={copiedMessageId === msg.id 
                                              ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') 
                                              : (lang === 'hi' ? 'प्लेन टेक्स्ट कॉपी करें' : 'Copy plain-text version')}
                                          >
                                            {copiedMessageId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <span className={`text-[9px] font-mono text-gray-400 block ${isMe ? 'text-right' : 'text-left'}`}>
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* NORMAL ACTIVE CONVERSATION FLOW */
            activeMessages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Character Icon bubble / Student icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-lg shadow-2xs select-none ${
                    isMe ? 'bg-[#F2CC8F] border border-orange-200' : 'bg-white border border-gray-200'
                  }`}>
                    {isMe ? '🎒' : selectedChar.char.split(' ')[0]}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-1">
                    <div className={`p-3.5 rounded-2xl relative shadow-3xs text-xs sm:text-sm border ${
                      isMe 
                        ? 'bg-gradient-to-tr from-[#3D405B] to-[#4D506F] text-white border-transparent rounded-tr-none' 
                        : 'bg-white text-gray-850 border-gray-150 rounded-tl-none'
                    }`}>
                      
                      {msg.image && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-gray-150 bg-gray-50 flex justify-center items-center max-w-sm">
                          {msg.image.mimeType === "application/pdf" ? (
                            <div className="p-3.5 w-full bg-rose-50/70 rounded-lg flex items-center gap-3 border border-rose-100 text-left select-none">
                              <div className="h-10 w-10 rounded-lg bg-red-600 text-white font-black flex items-center justify-center shadow-sm text-xs shrink-0">
                                PDF
                              </div>
                              <div className="truncate flex-1">
                                <span className="text-xs font-black text-rose-950 block truncate">
                                  {msg.image.name || "Educational Document.pdf"}
                                </span>
                                <span className="text-[10px] text-rose-700/80 font-sans block">
                                  Educational PDF Document
                                </span>
                              </div>
                            </div>
                          ) : (
                            <img 
                              src={msg.image.data} 
                              alt="Student academic upload" 
                              referrerPolicy="no-referrer"
                              className="max-h-52 w-auto max-w-full rounded-lg object-contain"
                            />
                          )}
                        </div>
                      )}

                      {(() => {
                        const parsed = parseMessageContent(msg.text);
                        return (
                          <>
                            <p className="leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                            {parsed.diagram && (
                              <InteractiveDiagram data={parsed.diagram} lang={lang} />
                            )}
                          </>
                        );
                      })()}
                      
                      {/* Action buttons (Speak aloud, Download PDF, & Copy Plain Text) inside character box */}
                      {!isMe && (
                        <div className="absolute -bottom-3 -right-2 flex items-center gap-1 bg-white p-0.5 rounded-full border border-gray-100 shadow-sm z-10">
                          <button
                            onClick={() => speakMessageAloud(msg)}
                            className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                              isPlayingVoice === msg.id 
                                ? 'bg-rose-500 text-white animate-bounce shadow-sm' 
                                : 'text-[#E07A5F] hover:bg-gray-50'
                            }`}
                            title={READ_ALOUD_TOOLTIP_LABELS[lang] || READ_ALOUD_TOOLTIP_LABELS['en']}
                          >
                            {isPlayingVoice === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          </button>
                          
                          <button
                            onClick={() => exportMessageToPDF(msg)}
                            className="p-1 rounded-full text-xs text-blue-600 hover:bg-gray-50 cursor-pointer transition-all"
                            title={lang === 'en' ? "Download PDF Version" : "PDF संस्करण डाउनलोड करें"}
                          >
                            <FileDown className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => copyMessageToClipboard(msg)}
                            className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                              copiedMessageId === msg.id 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                            title={copiedMessageId === msg.id 
                              ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') 
                              : (lang === 'hi' ? 'प्लेन टेक्स्ट कॉपी करें' : 'Copy plain-text version')}
                          >
                            {copiedMessageId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[9px] font-mono text-gray-400 block ${isMe ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp} {msg.pending && <span className="text-amber-600 font-bold ml-1 animate-pulse">⏱️ ({SYNC_PENDING_LABELS[lang] || SYNC_PENDING_LABELS['en']})</span>}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Simulated thinking indicator */}
          {!showHistory && mascotAction === 'think' && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-lg shadow-2xs bg-white border border-gray-200">
                {selectedChar.char.split(' ')[0]}
              </div>
              <div className="bg-white text-gray-400 p-3.5 rounded-2xl border border-gray-150 rounded-tl-none text-xs flex items-center gap-1 shadow-3xs">
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="text-[10px] ml-1 font-sans italic font-semibold text-gray-400">
                  {selectedChar.name} {THINKING_INDICATOR_LABELS[lang] || THINKING_INDICATOR_LABELS['en']}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Attached image preview draft panel above Form area */}
        {attachedFile && (
          <div className="px-5 py-2 bg-amber-50/50 border-t border-gray-150 flex items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              {attachedFile.mimeType === "application/pdf" ? (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-[#F2CC8F] bg-red-50 text-red-600 font-extrabold text-xs shadow-2xs select-none">
                  PDF
                </div>
              ) : (
                <img 
                  src={attachedFile.data} 
                  alt="Attached asset" 
                  className="h-10 w-10 rounded-lg object-cover border border-[#F2CC8F] bg-white pointer-events-none shadow-2xs"
                />
              )}
              <div>
                <span className="text-[9px] font-bold text-[#E07A5F] block uppercase tracking-wider">{ATTACHMENT_READY_LABELS[lang] || ATTACHMENT_READY_LABELS['en']}</span>
                <span className="text-xs font-semibold text-[#3D405B] max-w-[200px] sm:max-w-xs truncate block">{attachedFile.name}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
              title="Remove attached file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input Bar with drag and drop support */}
        <form 
          onSubmit={handleSendMessage} 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-3 bg-gray-50 border-t border-gray-150 shrink-0 flex gap-2 transition-all duration-200 ${
            isDragging ? 'bg-[#FAF8F4]/90 border-[#E07A5F] ring-2 ring-[#E07A5F]/20' : ''
          }`}
        >
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={ATTACH_TOOLTIP_LABELS[lang] || ATTACH_TOOLTIP_LABELS['en']}
            className="p-3 bg-white border border-gray-200 hover:border-[#E07A5F] hover:text-[#E07A5F] text-gray-500 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isDragging ? (DRAG_DROP_PLACEHOLDER_LABELS[lang] || DRAG_DROP_PLACEHOLDER_LABELS['en']) : (INPUT_PLACEHOLDER_LABELS[lang] || INPUT_PLACEHOLDER_LABELS['en']).replace("AI companion", selectedChar.name.split(' ')[0])}
              className="w-full pl-3.5 pr-12 py-3 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
            />
            <div className="absolute right-2.5 top-2.5">
              <SpeechInputButton
                lang={lang}
                onTranscript={(text) => setInputText(text)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedFile) || mascotAction === 'think'}
            className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-4 rounded-xl text-xs font-sans font-bold flex items-center justify-center shrink-0 shadow-3xs cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>



      </div>

    </div>
  );
}
