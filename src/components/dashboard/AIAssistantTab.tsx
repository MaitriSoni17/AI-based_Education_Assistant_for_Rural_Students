import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import { 
  Sparkles, Send, Volume2, VolumeX, Smile, ArrowRight, CornerDownRight,
  Paperclip, X, Trash, Image as ImageIcon, BookOpen, Compass, Map, 
  GraduationCap, Leaf, Sun, CloudRain, Award, Check, RotateCcw, Play
} from 'lucide-react';
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
  lang: LanguageCode;
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
  },
  { 
    id: 'dadi', 
    name: 'Dadi AI 👵', 
    role: 'Village Storyteller', 
    char: '👵 Dadi AI',
    color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
    welcome: {
      en: "Greetings, my child. Come sit with me. I have many traditional folk stories of stars, rain, crops, and animals to tell you. Ask me questions, or show me an image you would like to know about!",
      hi: "खुश रहो मेरे बच्चे। यहाँ मेरे पास बैठो। मेरे पास तुम्हें सुनाने के लिए तारों, बारिश, फसलों और पशु-पक्षियों की कहानियां हैं। सवाल पूछिए, या मुझे कोई तस्वीर दिखाएं!",
      gu: "ખુશ રહે બેટા. મારી પાસે બેસ. વાદળો, તારા, પશુ-પક્ષીઓ અને ખેતરની ખૂબ સરસ વાર્તાઓ સંભળાવું. કોઈ પણ ચિત્ર બતાવીને ઉત્તર પૂછો!",
      mr: "बाळा, माझ्या शेजारी बस. माझ्याकडे तुला सांगायला ढग, तारे, कोडे आणि प्राण्यांच्या छान गोष्टी आहेत. मला काहीही विचारा किंवा चित्र दाखवा!",
      ta: "வா மகனே. என்னருகில் அமர். உனக்கு விண்மீன்கள், மழை, பயிர்கள் மற்றும் விலங்குகள் பற்றிய கிராமியக் கதைகள் பல சொல்வேன். ஏதாவது படம் காட்டி கேள்!",
      te: "సంతోషం బాబు. ఇటు వచ్చి కూర్చో. నీకు నక్షత్రాలు, వానలు, పంటలు మరియు జంతువుల జానపద కథలెన్నో చెబుతా. చిత్రాలను చూపించి అడుగు!"
    }
  },
  { 
    id: 'chanda', 
    name: 'Chanda AI 🦊', 
    role: 'Witty Mathematics Fox', 
    char: '🦊 Chanda AI',
    color: 'border-orange-250 bg-orange-50/50 hover:bg-orange-50 text-orange-950',
    welcome: {
      en: "Aha! I am Chanda, the clever forest fox. I can multiply, divide, and puzzle you with speedy, trick questions. Ask or scan any math question paper to start!",
      hi: "अहा! मैं हूँ चंदा, जंगल की चालाक लोमड़ी। मैं तुम्हें गणित के अनोखे पहाड़ों और पहेलियों से हैरान कर सकती हूँ। गणित की कोई भी तस्वीर दिखाओ!",
      gu: "અરે વાહ! હું ચંદા, જંગલની હોશિયાર શિયાળ. હું તને ગણિતના જાદુઈ પ્રશ્નો પૂછીને મજા કરાવીશ. ગણિતના પ્રશ્નપત્રનો ફોટો મોકલો!",
      mr: "वा! मी आहे चंदा, जंगलातील चतुर कोल्हा. मी तुला गणित आणि बुद्धिमत्ताच्या मजेशीर ट्रिक्स शिकवीन. चला, गणिताचे कोडे किंवा पानाचा फोटो पाठवा!",
      ta: "ஆஹா! நான் தான் சண்டா, காட்டின் தந்திர நரி. கணிதப் புதிர்களால் உன்னை சோதிக்க வந்துள்ளேன். கணித வீட்டுப்பாடப் படத்தை அனுப்பு!",
      te: "ఆహా! నేను చందాని, అడవి తెలివైన నక్కని. మ్యాథ్స్ ట్రిక్స్ తో నిన్ను ఆశ్చర్యపరుస్తా. ఏదైనా లెక్కల ఫోటో చూపిస్తే చాలు!"
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

export default function AIAssistantTab({ lang }: AIAssistantTabProps) {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [inputText, setInputText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [msgHistory, setMsgHistory] = useState<Record<string, ChatMessage[]>>({});
  const [mascotAction, setMascotAction] = useState<'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think'>('idle');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Multi-modal state managers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Local Learning Path Database states & persistence
  const [activePathId, setActivePathId] = useState<string | null>(() => {
    return localStorage.getItem('ai_active_learning_path_id') || null;
  });

  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai_completed_milestones');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (activePathId) {
      localStorage.setItem('ai_active_learning_path_id', activePathId);
    } else {
      localStorage.removeItem('ai_active_learning_path_id');
    }
  }, [activePathId]);

  useEffect(() => {
    localStorage.setItem('ai_completed_milestones', JSON.stringify(completedMilestones));
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
    offlineSyncManager.saveChatHistory(selectedChar.id, historyWithUser);

    if (!online) {
      offlineSyncManager.queuePendingChat({
        id: userMsg.id,
        characterId: selectedChar.id,
        message: queryText,
        image: imagePayload,
        timestamp: userMsg.timestamp
      });

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
      offlineSyncManager.saveChatHistory(selectedChar.id, finalWithNotice);
      setMascotAction('idle');
      return;
    }

    setMascotAction('think');

    try {
      const bodyPayload: any = {
        message: queryText,
        systemInstruction: getSystemInstructionForMascot()
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
          
          offlineSyncManager.saveChatHistory(selectedChar.id, updated);

          setTimeout(() => {
            speakMessageAloud(aiMsg);
          }, 300);

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
        offlineSyncManager.saveChatHistory(selectedChar.id, updated);
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
    const history = offlineSyncManager.getChatHistory(selectedChar.id);
    if (history && history.length > 0) {
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: history
      }));
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
      offlineSyncManager.saveChatHistory(selectedChar.id, [welcomeMsg]);
    }
  }, [selectedChar, lang]);

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

    const baseInstruction = (() => {
      switch (selectedChar.id) {
        case 'dadi':
          return `You are Dadi AI 👵, a wise, warm village grandmother and traditional storyteller. 
Your goal is to teach rural Indian children concept of stars, clouds, rain, farming, or moral life lessons.
Always speak very warmly and use parental language (like "Dear child", "my child", "खुश रहो मेरे बच्चे").
Teach concepts by spinning them into short folk tales or traditional grandmother wisdom, but back it up with simple science so they learn. 
When analyzing images or PDF documents, explain the handwritten notes, textbook pages, or educational chapters in a gentle, warm storyteller style using simple village terms.

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.

Keep answers sweet, engaging, and under 150 words.`;
        case 'chanda':
          return `You are Chanda AI 🦊, a clever, hyperactive forest fox who is a master of Mathematics. 
You love challenges, speed tricks, multiplication tables, fast divisions, and fun logic riddles!
Challenge the student playfully with quick sums or teach them smart maths hacks (like multiplying by 5 or 9) using rural examples like counting cows, mango fruits, or seed sacks.
When analyzing images, textbook pages, or mathematical PDFs, spot any math problems, write out the step-by-step solution, and provide a quick witty calculation hack!
Keep your response highly energetic, fun, and extremely clear. Use playful fox actions in text descriptions (e.g., *twirls bushy tail*).

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.`;
        default: // swami
          return `You are Swami AI 🤖, a friendly, encouraging robot educational mascot designed for rural Indian students. 
You are an expert tutor in Science, Logic, History, and general topics.
You explain complex modern subjects using humble, easy-to-understand village analogies (like crops, cycle pumps, rainfall, solar energy, local cattle).
When students upload pictures of textbook pages, PDF document chapters, assignments, diagrams, or science experiment charts, analyze and summarize them thoroughly, dissect any diagrams, and give a highly interesting breakdown.
Always stay positive, encourage their curiosity, and say words like "Smart friend!" or "Amazing curiosity!". 

CRITICAL RULE: The student has selected "${targetLanguageName}" as their preferred language. You MUST ALWAYS write your response entirely in "${targetLanguageName}" using its proper native script/alphabets, even if the student asks their question/message in English or another language. DO NOT respond in English or any other language unless English is explicitly selected as the preferred language.

Keep replies compact and structured.`;
      }
    })();

    // Fetch active learning path guidelines to steer the companion tutor
    let learningPathBonus = '';
    if (activePathId) {
      const matchedPath = LOCAL_LEARNING_PATHS.find(p => p.id === activePathId);
      if (matchedPath) {
        learningPathBonus = `\n\n[STRUCTURED LEARNING PATH MODE ACTIVE]\n${matchedPath.systemInstructionBonus}\n\n`;
      }
    }

    // Append the visual mapping guidelines for multi-modal diagrams and concept flowcharts
    return `${baseInstruction}${learningPathBonus}

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

    await sendMessageWithPayload(queryText, filePayload);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* LEFT: CHARACTER SQUAD PICKER & MASCOT PREVIEW */}
      <div className="lg:col-span-4 space-y-5">
        
        {/* CHARACTER GRID */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Sparkles className="h-4 w-4 text-[#E07A5F]" />
            {COMPANION_TITLE_LABELS[lang] || COMPANION_TITLE_LABELS['en']}
          </h3>
          <div className="space-y-2">
            {CHARACTERS.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedChar.id === char.id 
                    ? 'ring-2 ring-[#E07A5F] border-transparent font-extrabold ' + char.color
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-sans font-bold">{char.name}</h4>
                  <p className="text-[10px] text-gray-500 font-sans font-medium">
                    {COMPANION_ROLE_LABELS[lang]?.[char.id] || char.role}
                  </p>
                </div>
                <ArrowRight className={`h-4 w-4 transition-transform ${selectedChar.id === char.id ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE MASCOT RETREAT CANVASES */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center space-y-4 shadow-md relative overflow-hidden h-64 flex flex-col justify-center items-center">
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-[8px] font-mono text-gray-400 font-bold uppercase tracking-widest">
              {ACTIVE_MASCOT_LABELS[lang] || ACTIVE_MASCOT_LABELS['en']}
            </span>
          </div>

          <InteractiveAITeacher
            avatarChar={selectedChar.char}
            avatarName={selectedChar.name}
            action={mascotAction}
            isPlaying={isPlayingVoice !== null}
          />
          <span className="text-xs font-mono font-bold text-[#F2CC8F] bg-white/10 px-2.5 py-1 rounded truncate max-w-full">
            {selectedChar.name} ({mascotAction === 'idle' ? (MASCOT_STATUS_LABELS[lang]?.listening || 'Listening...') : (MASCOT_STATUS_LABELS[lang]?.[mascotAction] || mascotAction).toUpperCase()})
          </span>
        </div>

        {/* LEARNING PATH SELECTOR & PROGRESS TRACKER */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Compass className="h-4 w-4 text-[#81B29A]" />
            {LEARNING_PATH_TITLE_LABELS[lang] || LEARNING_PATH_TITLE_LABELS['en']}
          </h3>

          {!activePath ? (
            // No active learning path -> Show List of Paths from our Local Database
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                {LEARNING_PATH_INTRO_LABELS[lang] || LEARNING_PATH_INTRO_LABELS['en']}
              </p>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {LOCAL_LEARNING_PATHS.map((path) => {
                  const title = path.title[lang] || path.title['en'];
                  const desc = path.description[lang] || path.description['en'];
                  return (
                    <button
                      key={path.id}
                      onClick={() => handleStartLearningPath(path)}
                      className="w-full p-3 rounded-xl border border-gray-100 hover:border-[#81B29A] hover:bg-[#81B29A]/5 text-left transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black text-[#3D405B] group-hover:text-[#81B29A] transition-colors">
                          {title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wide">
                          {path.subject}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 font-sans leading-relaxed">
                        {desc}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-[#81B29A] font-extrabold">
                        <span>{path.milestones.length} {STEPS_BADGE_LABELS[lang] || STEPS_BADGE_LABELS['en']}</span>
                        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {START_TOPIC_LABELS[lang] || START_TOPIC_LABELS['en']} <Play className="h-2 w-2 fill-current" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Active Learning Path details with checkbox milestones & auto prompts!
            <div className="space-y-3">
              <div className="bg-[#81B29A]/10 p-3 rounded-xl border border-[#81B29A]/20">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-black text-[#2C5E43] uppercase tracking-wide">
                    {activePath.subject} • Grade {activePath.grade}
                  </span>
                  <button
                    onClick={() => setActivePathId(null)}
                    className="text-[10px] text-gray-500 hover:text-red-500 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                    title="Change learning path"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {CHANGE_BUTTON_LABELS[lang] || CHANGE_BUTTON_LABELS['en']}
                  </button>
                </div>
                <h4 className="text-sm font-extrabold text-[#3D405B]">
                  {activePath.title[lang] || activePath.title['en']}
                </h4>
                <p className="text-[10px] text-gray-600 font-sans mt-1 leading-relaxed">
                  {activePath.description[lang] || activePath.description['en']}
                </p>
              </div>

              {/* Steps/Milestones Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-sans font-bold text-gray-500">
                  <span>{MILESTONE_TRACK_LABELS[lang] || MILESTONE_TRACK_LABELS['en']}</span>
                  <span className="text-[#81B29A] font-extrabold">
                    {activePath.milestones.filter(m => completedMilestones.includes(m.id)).length} {COMPLETED_RATIO_LABELS[lang]?.of || COMPLETED_RATIO_LABELS['en'].of} {activePath.milestones.length} {COMPLETED_RATIO_LABELS[lang]?.done || COMPLETED_RATIO_LABELS['en'].done}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#81B29A] to-[#3D405B] h-full transition-all duration-500"
                    style={{ 
                      width: `${(activePath.milestones.filter(m => completedMilestones.includes(m.id)).length / activePath.milestones.length) * 100}%` 
                    }}
                  />
                </div>

                {/* Checklist steps */}
                <div className="space-y-2 pt-1 max-h-[190px] overflow-y-auto pr-1">
                  {activePath.milestones.map((milestone, idx) => {
                    const isDone = completedMilestones.includes(milestone.id);
                    return (
                      <div 
                        key={milestone.id}
                        className={`p-2.5 rounded-xl border transition-all flex gap-2.5 items-start ${
                          isDone 
                            ? 'bg-gray-50/50 border-gray-150 opacity-75' 
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => toggleMilestone(milestone.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-all ${
                            isDone 
                              ? 'bg-[#81B29A] border-transparent text-white' 
                              : 'border-gray-300 hover:border-[#81B29A] bg-white'
                          }`}
                        >
                          {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <div className="space-y-1">
                          <span className={`text-[11px] font-black block leading-none ${isDone ? 'line-through text-gray-400' : 'text-[#3D405B]'}`}>
                            {(lang === 'hi' ? 'कदम' : lang === 'gu' ? 'પગલું' : lang === 'mr' ? 'टप्पा' : lang === 'ta' ? 'படி' : lang === 'te' ? 'మెట్టు' : 'Step')} {idx + 1}: {milestone.title[lang] || milestone.title['en']}
                          </span>
                          <span className={`text-[10px] font-sans block leading-relaxed ${isDone ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                            {milestone.description[lang] || milestone.description['en']}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Run Starter Prompt button */}
              <button
                onClick={() => handleStartLearningPath(activePath)}
                className="w-full py-2 bg-[#81B29A] hover:bg-[#6FA38B] text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {RESTART_RESUME_LABELS[lang] || RESTART_RESUME_LABELS['en']}
                </span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: LIVE CHAT DIALOGUE BOX */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-150 shadow-sm flex flex-col h-[520px] overflow-hidden">
        
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
          
          {isPlayingVoice && (
            <button
              onClick={() => { stopSpeaking(); setIsPlayingVoice(null); setMascotAction('idle'); }}
              className="text-xs bg-red-500/20 text-rose-300 border border-red-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>{STOP_ALOUD_LABELS[lang] || STOP_ALOUD_LABELS['en']}</span>
            </button>
          )}
        </div>



        {/* Message Log Container */}
        <div 
          ref={chatScrollRef}
          className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F4]/45 rounded-b-xl"
        >
          {activeMessages.map((msg) => {
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
                    
                    {/* Speak bubble aloud helper button inside character box */}
                    {!isMe && (
                      <button
                        onClick={() => speakMessageAloud(msg)}
                        className={`absolute -bottom-2.5 -right-2 p-1 rounded-full border text-xs shadow cursor-pointer transition-colors ${
                          isPlayingVoice === msg.id 
                            ? 'bg-rose-500 border-rose-400 text-white animate-bounce' 
                            : 'bg-white border-gray-200 text-[#E07A5F] hover:bg-gray-50'
                        }`}
                        title={READ_ALOUD_TOOLTIP_LABELS[lang] || READ_ALOUD_TOOLTIP_LABELS['en']}
                      >
                        {isPlayingVoice === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  
                  <span className={`text-[9px] font-mono text-gray-400 block ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp} {msg.pending && <span className="text-amber-600 font-bold ml-1 animate-pulse">⏱️ ({SYNC_PENDING_LABELS[lang] || SYNC_PENDING_LABELS['en']})</span>}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Simulated thinking indicator */}
          {mascotAction === 'think' && (
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
