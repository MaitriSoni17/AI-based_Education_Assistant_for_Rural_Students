import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, User } from '../../types';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Zap, ArrowRight, Sparkles, Volume2, HelpCircle, 
  Award, RefreshCw, Layers, CheckCircle2, Sliders, Play, RotateCcw,
  Binary, Flame, Compass, HelpCircle as HelpIcon,
  Trash2, Paperclip, Send, X, Bot, FileDown, Copy, Check,
  ChevronUp, ChevronDown, BookOpen, Plus, MessageSquare, Calendar
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import SpeechInputButton from '../SpeechInputButton';
import SpeakButton from '../SpeakButton';

interface EquationsTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

interface ChemicalQuestion {
  id: string;
  reactionName: string;
  reactants: string[];
  products: string[];
  correctCoefficients: number[]; // Reactants + Products
  placeholders: string[]; 
  points: number;
  hint: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'j': 'ʲ', 'k': 'ᵏ',
  'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ'
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ'
};

const toSuperscript = (str: string) => {
  return str.split('').map(char => SUPERSCRIPTS[char] || SUPERSCRIPTS[char.toLowerCase()] || char).join('');
};

const toSubscript = (str: string) => {
  return str.split('').map(char => SUBSCRIPTS[char] || SUBSCRIPTS[char.toLowerCase()] || char).join('');
};

const FORMULA_SYMBOLS = [
  { char: '²', label: 'x²', desc: 'Superscript / सुपरस्क्रिप्ट (e.g. select "2" to make it ²)', type: 'super' },
  { char: '₂', label: 'x₂', desc: 'Subscript / सबस्क्रिप्ट (e.g. select "2" to make it ₂)', type: 'sub' },
  { char: '√', label: '√', desc: 'Square Root (वर्गमूल)' },
  { char: 'π', label: 'π', desc: 'Pi' },
  { char: 'θ', label: 'θ', desc: 'Theta (कोण)' },
  { char: 'α', label: 'α', desc: 'Alpha' },
  { char: 'β', label: 'β', desc: 'Beta' },
  { char: 'Δ', label: 'Δ', desc: 'Delta / Change' },
  { char: '→', label: '→', desc: 'Reaction Arrow' },
  { char: '°', label: '°', desc: 'Degree (डिग्री)' },
  { char: '±', label: '±', desc: 'Plus-Minus' },
  { char: '÷', label: '÷', desc: 'Divide' },
  { char: '×', label: '×', desc: 'Multiply' },
  { char: '≠', label: '≠', desc: 'Not Equal' },
];

export const CHATBOT_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

export const CHATBOT_TRANSLATIONS: Record<string, {
  welcome: string;
  placeholder: string;
  placeholderFile: string;
  quickSolvesHeader: string;
  quickSolvesDesc: string;
  mathProblems: string;
  scienceCalculations: string;
  activeChat: string;
  searchHistory: string;
  newChat: string;
  viewHistoryTip: string;
  solvingText: string;
  langLabel: string;
  clearHistory: string;
  entireHistoryTitle: string;
  entireHistoryDesc: string;
  noHistory: string;
  noHistorySub: string;
  chatButton: string;
  deleteButton: string;
  restoreButton: string;
  hideButton: string;
  viewButton: string;
  suggestions: {
    math: string[];
    science: string[];
  };
}> = {
  en: {
    welcome: "Hello! I am your Smart AI Math & Science Solver. Ask me any calculation, formula explanation, chemical equation balancing, or upload an image/PDF of a problem to solve!",
    placeholder: "Type math equations, balance formulas, or select files...",
    placeholderFile: "Ask a query about this file...",
    quickSolvesHeader: "Try Quick Solves",
    quickSolvesDesc: "Click any interactive prompt to query the calculation engine instantly:",
    mathProblems: "Mathematics Problems",
    scienceCalculations: "Science Calculations",
    activeChat: "Active Chat",
    searchHistory: "Search History",
    newChat: "New Chat",
    viewHistoryTip: "You are currently viewing history. Click 'Active Chat' above to message the AI Solver.",
    solvingText: "Solving calculation and processing worksheet...",
    langLabel: "AI Solver Language",
    clearHistory: "Clear All History",
    entireHistoryTitle: "My Entire Solver Chat History",
    entireHistoryDesc: "All your previously asked questions and scientific solutions are listed below.",
    noHistory: "No solver history found.",
    noHistorySub: "Start asking questions to build your solver history!",
    chatButton: "Back to Chat",
    deleteButton: "Delete",
    restoreButton: "Restore Chat",
    hideButton: "Hide",
    viewButton: "View",
    suggestions: {
      math: [
        "Solve quadratic equation: 3x² - 5x + 2 = 0 showing roots",
        "How did Indian sages write the Pythagoras theorem (Baudhayan Sutras)?",
        "Find hypotenuse c if base a = 12 and height b = 5"
      ],
      science: [
        "Balance the equation: Fe + O₂ ➔ Fe₂O₃ and explain rules",
        "Explain Ohm's Law V = IR using a water flow analogy",
        "If a 15kg school block accelerates at 6m/s², find force (F = ma)"
      ]
    }
  },
  hi: {
    welcome: "नमस्ते! मैं आपका विज्ञान और गणित एआई सॉल्वर हूँ। आप मुझसे कोई भी गणना, भौतिकी का नियम, या रासायनिक समीकरण पूछ सकते हैं। आप चित्र या पीडीएफ भी अपलोड कर सकते हैं!",
    placeholder: "बीजीय समीकरण, भौतिकी प्रश्न लिखें या फ़ाइल डालें...",
    placeholderFile: "इस फ़ाइल के बारे में पूछें...",
    quickSolvesHeader: "त्वरित हल",
    quickSolvesDesc: "इन कठिन विषयों और समीकरणों को तुरंत हल करने के लिए किसी भी प्रॉम्प्ट पर क्लिक करें:",
    mathProblems: "गणित के सवाल",
    scienceCalculations: "विज्ञान के सवाल",
    activeChat: "सक्रिय चैट",
    searchHistory: "खोज इतिहास",
    newChat: "नई चैट",
    viewHistoryTip: "आप वर्तमान में इतिहास देख रहे हैं। एआई सॉल्वर से बात करने के लिए ऊपर 'सक्रिय चैट' पर क्लिक करें।",
    solvingText: "गणना कर रहा हूँ और समस्या का समाधान ढूंढ रहा हूँ...",
    langLabel: "एआई सॉल्वर भाषा",
    clearHistory: "इतिहास साफ़ करें",
    entireHistoryTitle: "मेरा सम्पूर्ण सॉल्वर इतिहास",
    entireHistoryDesc: "आपके द्वारा पहले पूछे गए सभी प्रश्न और प्राप्त समाधान यहाँ प्रदर्शित हैं।",
    noHistory: "कोई इतिहास नहीं मिला।",
    noHistorySub: "चैट शुरू करके प्रश्न पूछना आरंभ करें!",
    chatButton: "चैट पर वापस जाएं",
    deleteButton: "हटाएं",
    restoreButton: "चैट बहाल करें",
    hideButton: "छिपाएं",
    viewButton: "देखें",
    suggestions: {
      math: [
        "द्विघात समीकरण हल करें: 3x² - 5x + 2 = 0 और मूल दिखाएं",
        "भारतीय ऋषियों ने पाइथागोरस प्रमेय (बौधायन सूत्र) कैसे लिखा था?",
        "यदि आधार a = 12 और ऊंचाई b = 5 है, तो कर्ण c ज्ञात करें"
      ],
      science: [
        "रासायनिक समीकरण संतुलित करें: Fe + O₂ ➔ Fe₂O₃ और नियम समझाएं",
        "पानी के प्रवाह की सादृश्यता का उपयोग करके ओम के नियम V = IR को समझाएं",
        "यदि 15kg का ब्लॉक 6m/s² पर त्वरित होता है, तो बल ज्ञात करें (F = ma)"
      ]
    }
  },
  gu: {
    welcome: "નમસ્તે! હું તમારો વિજ્ઞાન અને ગણિત AI સોલ્વર છું. તમે મને કોઈ પણ ગણતરી, ભૌતિકશાસ્ત્રના નિયમો, અથવા રાસાયણિક સમીકરણો પૂછી શકો છો. તમે ફોટો અથવા PDF પણ અપલોડ કરી શકો છો!",
    placeholder: "ગણિતના સમીકરણો લખો, સૂત્રો સંતુલિત કરો અથવા ફાઇલ પસંદ કરો...",
    placeholderFile: "આ ફાઇલ વિશે પ્રશ્ન પૂછો...",
    quickSolvesHeader: "ઝડપી ઉકેલો",
    quickSolvesDesc: "ત્વરિત ગણતરી શરૂ કરવા માટે કોઈ પણ પ્રશ્ન પર ક્લિક કરો:",
    mathProblems: "ગણિતની સમસ્યાઓ",
    scienceCalculations: "વિજ્ઞાનની ગણતરીઓ",
    activeChat: "સક્રિય ચેટ",
    searchHistory: "શોધ ઇતિહાસ",
    newChat: "નવી ચેટ",
    viewHistoryTip: "તમે હાલમાં ઇતિહાસ જોઈ રહ્યા છો. AI સોલ્વર સાથે વાત કરવા માટે ઉપર 'સક્રિય ચેટ' પર ક્લિક કરો.",
    solvingText: "ગણતરી કરી રહ્યું છે અને સમસ્યાનો ઉકેલ શોધી રહ્યું છે...",
    langLabel: "AI સોલ્વર ભાષા",
    clearHistory: "ઇતિહાસ સાફ કરો",
    entireHistoryTitle: "મારો સંપૂર્ણ સોલ્વર ઇતિહાસ",
    entireHistoryDesc: "તમારા દ્વારા પહેલા પૂછવામાં આવેલા બધા પ્રશ્નો અને ઉકેલો અહીં છે.",
    noHistory: "કોઈ ઇતિહાસ મળ્યો નથી.",
    noHistorySub: "ચેટ શરૂ કરીને પ્રશ્નો પૂછવાનું શરૂ કરો!",
    chatButton: "ચેટ પર પાછા જાઓ",
    deleteButton: "હટાવો",
    restoreButton: "ચેટ પુનઃસ્થાપિત કરો",
    hideButton: "છુપાવો",
    viewButton: "જુઓ",
    suggestions: {
      math: [
        "દ્વિઘાત સમીકરણ ઉકેલો: 3x² - 5x + 2 = 0",
        "ભારતીય ઋષિઓએ પાયથાગોરસ પ્રમેય (બૌધાયન સૂત્રો) કેવી રીતે લખ્યો હતો?",
        "જો આધાર a = 12 અને ઊંચાઈ b = 5 હોય, તો કર્ણ c શોધો"
      ],
      science: [
        "રાસાયણિક સમીકરણ સંતુલિત કરો: Fe + O₂ ➔ Fe₂O₃",
        "પાણીના પ્રવાહની સરખામણી દ્વારા ઓહ્મનો નિયમ V = IR સમજાવો",
        "જો 15kg નો બ્લોક 6m/s² થી પ્રવેગિત થાય, તો બળ શોધો (F = ma)"
      ]
    }
  },
  mr: {
    welcome: "नमस्कार! मी तुमचा विज्ञान आणि गणित एआय सॉल्वर आहे. तुम्ही मला कोणतीही गणना, भौतिकशास्त्राचे नियम किंवा रासायनिक समीकरण विचारू शकता. तुम्ही फोटो किंवा पीडीएफ देखील अपलोड करू शकता!",
    placeholder: "गणित समीकरणे लिहा, सूत्रे संतुलित करा किंवा फाईल निवडा...",
    placeholderFile: "या फाईलबद्दल प्रश्न विचारा...",
    quickSolvesHeader: "त्वरित सोडवणूक",
    quickSolvesDesc: "त्वरित गणना करण्यासाठी खालीलपैकी कोणत्याही प्रश्नावर क्लिक करा:",
    mathProblems: "गणित समस्या",
    scienceCalculations: "वैज्ञानिक गणना",
    activeChat: "सक्रिय चॅट",
    searchHistory: "शोध इतिहास",
    newChat: "नवीन चॅट",
    viewHistoryTip: "तुम्ही सध्या इतिहास पाहत आहात. AI सॉल्वरशी संवाद साधण्यासाठी वर 'सक्रिय चॅट' वर क्लिक करा.",
    solvingText: "गणना करत आहे आणि समस्येचे उत्तर शोधत आहे...",
    langLabel: "AI सॉल्वर भाषा",
    clearHistory: "सर्व इतिहास साफ करा",
    entireHistoryTitle: "माझा संपूर्ण सॉल्वर इतिहास",
    entireHistoryDesc: "तुमचे पूर्वीचे सर्व प्रश्न आणि उत्तरे खाली सूचीबद्ध आहेत.",
    noHistory: "कोणताही इतिहास सापडला नाही.",
    noHistorySub: "चॅट सुरू करून प्रश्न विचारणे प्रारंभ करा!",
    chatButton: "चॅटवर परत जा",
    deleteButton: "हटवा",
    restoreButton: "चॅट पुनर्संचयित करा",
    hideButton: "लपवा",
    viewButton: "पहा",
    suggestions: {
      math: [
        "वर्गसमीकरण सोडवा: 3x² - 5x + 2 = 0",
        "भारतीय ऋषींनी पायथागोरसचा सिद्धांत (बौधायन सूत्र) कसा लिहिला होता?",
        "जर पाया a = 12 आणि उंची b = 5 असेल, तर कर्ण c काढा"
      ],
      science: [
        "रासायनिक समीकरण संतुलित करा: Fe + O₂ ➔ Fe₂O₃",
        "पाण्याच्या प्रवाहाचे उदाहरण देऊन ओहमचा नियम V = IR स्पष्ट करा",
        "जर 15kg चा ब्लॉक 6m/s² ने प्रवेगित होत असेल, तर बल काढा (F = ma)"
      ]
    }
  },
  bn: {
    welcome: "নমস্কার! আমি আপনার স্মার্ট এআই গণিত ও বিজ্ঞান শিক্ষক। আপনি আমাকে যেকোনো অংক, বিজ্ঞানের নিয়ম বা রাসায়নিক সমীকরণ জিজ্ঞাসা করতে পারেন। ছবি বা পিডিএফ-ও আপলোড করতে পারেন!",
    placeholder: "গণিত সমীকরণ লিখুন, সমীকরণ মেলাুন বা ফাইল নির্বাচন করুন...",
    placeholderFile: "এই ফাইলটি সম্পর্কে প্রশ্ন জিজ্ঞাসা করুন...",
    quickSolvesHeader: "দ্রুত সমাধান",
    quickSolvesDesc: "তাত্ক্ষণিক উত্তর পেতে যেকোনো প্রশ্নে ক্লিক করুন:",
    mathProblems: "গণিত সমাধান",
    scienceCalculations: "বিজ্ঞানের হিসাব",
    activeChat: "সক্রিয় চ্যাট",
    searchHistory: "অনুসন্ধান ইতিহাস",
    newChat: "নতুন চ্যাট",
    viewHistoryTip: "আপনি এখন ইতিহাস দেখছেন। এআই শিক্ষকের সাথে কথা বলতে উপরে 'সक्रिय चॅट'-এ ক্লিক করুন।",
    solvingText: "সমাধান খুঁজছি এবং হিসাব করছি...",
    langLabel: "AI সলভার ভাষা",
    clearHistory: "সব ইতিহাস মুছে দিন",
    entireHistoryTitle: "আমার সম্পূর্ণ সমাধান ইতিহাস",
    entireHistoryDesc: "আপনার পূর্বের সমস্ত প্রশ্ন এবং সমাধান নিচে দেওয়া হল।",
    noHistory: "কোনো ইতিহাস পাওয়া যায়নি।",
    noHistorySub: "প্রশ্ন জিজ্ঞাসা করে সমাধান ইতিহাস তৈরি করুন!",
    chatButton: "চ্যাটে ফিরে যান",
    deleteButton: "মুছে ফেলুন",
    restoreButton: "চ্যাট পুনরুদ্ধার করুন",
    hideButton: "লুকান",
    viewButton: "দেখুন",
    suggestions: {
      math: [
        "দ্বিঘাত সমীকরণ সমাধান করুন: 3x² - 5x + 2 = 0",
        "भारतीय ऋषियों ने पाइथागोरस प्रमेय (बौधायन सूत्र) कैसे लिखा था?",
        "ভূমি a = 12 এবং উচ্চতা b = 5 হলে অতিভুজ c কত?"
      ],
      science: [
        "রাসায়নিক সমীকরণ সমতা বিধান করুন: Fe + O₂ ➔ Fe₂O₃",
        "জলের প্রবাহের উদাহরণ দিয়ে ওহমের সূত্র V = IR ব্যাখ্যা করুন",
        "যদি একটি ১৫ কেজি ব্লক ৬ মি/সেকেন্ড² বেগে ত্বরান্বিত হয়, তবে বল কত (F = ma)?"
      ]
    }
  },
  ta: {
    welcome: "வணக்கம்! நான் உங்கள் அறிவியல் மற்றும் கணித AI தீர்வாளர். ஏதேனும் கணக்கீடு, இயற்பியல் விதி அல்லது வேதியியல் சமன்பாடு பற்றி என்னிடம் கேட்கலாம். படம் அல்லது PDF-ஐயும் பதிவேற்றலாம்!",
    placeholder: "கணித சமன்பாடுகளை தட்டச்சு செய்யவும், கோப்பைத் தேர்ந்தெடுக்கவும்...",
    placeholderFile: "இந்த கோப்பைப் பற்றி கேள்வி கேளுங்கள்...",
    quickSolvesHeader: "விரைவு தீர்வுகள்",
    quickSolvesDesc: "உடனடி தீர்வு பெற ஏதேனும் ஒரு கேள்வியைக் கிளிக் செய்யவும்:",
    mathProblems: "கணிதப் பிரச்சனைகள்",
    scienceCalculations: "அறிவியல் கணக்கீடுகள்",
    activeChat: "செயலில் உள்ள அரட்டை",
    searchHistory: "தேடல் வரலாறு",
    newChat: "புதிய அரட்டை",
    viewHistoryTip: "நீங்கள் தற்போது வரலாற்றைப் பார்க்கிறீர்கள். அரட்டையடிக்க மேலே உள்ள 'செயலில் உள்ள அரட்டை' என்பதைக் கிளிக் செய்யவும்.",
    solvingText: "கணக்கீடு செய்து தீர்வைத் தேடுகிறது...",
    langLabel: "AI தீர்வாளர் மொழி",
    clearHistory: "வரலாற்றை அழி",
    entireHistoryTitle: "எனது முழுமையான வரலாற்றுப் பதிவு",
    entireHistoryDesc: "நீங்கள் முன்பு கேட்ட அனைத்து கேள்விகளும் தீர்வுகளும் கீழே பட்டியலிடப்பட்டுள்ளன.",
    noHistory: "வரலாற்றுப் பதிவு எதுவும் இல்லை.",
    noHistorySub: "கேள்விகளைக் கேட்டு வரலாற்றை உருவாக்குங்கள்!",
    chatButton: "அரட்டைக்குத் திரும்ぶ",
    deleteButton: "நீக்கு",
    restoreButton: "அரட்டையை மீட்டமை",
    hideButton: "மறை",
    viewButton: "காண்பி",
    suggestions: {
      math: [
        "இருபடிச் சமன்பாட்டைத் தீர்க்கவும்: 3x² - 5x + 2 = 0",
        "இந்திய முனிவர்கள் பிதாகர스 தேற்றத்தை (போதாயன சூத்திரம்) எவ்வாறு எழுதினர்?",
        "அடிபாகம் a = 12 மற்றும் உயரம் b = 5 எனில், கர்ணம் c ஐக் கண்டறியவும்"
      ],
      science: [
        "வேதிச் சமன்பாட்டைச் சமன்படுத்தவும்: Fe + O₂ ➔ Fe₂O₃",
        "நீர் ஓட்டத்தை ஒப்பிட்டு ஓம் விதியை (V = IR) விளக்கவும்",
        "15 கிலோ எடையுள்ள பொருள் 6m/s² முடுக்கத்தில் சென்றால், விசையைக் காண்க (F = ma)"
      ]
    }
  },
  te: {
    welcome: "నమస్తే! నేను మీ సైన్స్ మరియు మ్యాథ్స్ AI సాల్వర్‌ని. మీరు నన్ను ఏదైనా లెక్క, భౌతికశాస్త్ర నియమం లేదా రసాయన సమీకరణం అడగవచ్చు. మీరు చిత్రం లేదా PDFని కూడా అప్‌లోడ్ చేయవచ్చు!",
    placeholder: "గణిత సమీకరణాలను టైప్ చేయండి, ఫైల్‌ను ఎంచుకోండి...",
    placeholderFile: "ఈ ఫైల్ గురించి ప్రశ్న అడగండి...",
    quickSolvesHeader: "త్వరిత పరిష్కారాలు",
    quickSolvesDesc: "తక్షణ సమాధానం కోసం ఏదైనా ప్రశ్నపై క్లిక్ చేయండి:",
    mathProblems: "గणిత సమస్యలు",
    scienceCalculations: "సైన్స్ లెక్కలు",
    activeChat: "క్రియాశీల చాట్",
    searchHistory: "శోధన చరిత్ర",
    newChat: "కొత్త చాట్",
    viewHistoryTip: "మీరు ప్రస్తుతం చరిత్రను చూస్తున్నారు. మాట్లాడటానికి పైన ఉన్న 'క్రియాశీల చాట్' క్లిక్ చేయండి.",
    solvingText: "లెక్కలను విశ్ಲೇషించి సమాధానం కనుగొంటోంది...",
    langLabel: "AI సాల్వర్ భాష",
    clearHistory: "చరిత్రను తొలగించు",
    entireHistoryTitle: "నా పూర్తి చాట్ చరిత్ర",
    entireHistoryDesc: "మీరు ఇంతకు ముందు అడిగిన ప్రశ్నలు మరియు సమాధానాలు ఇక్కడ ఉన్నాయి.",
    noHistory: "చరిత్ర ఏమీ లేదు.",
    noHistorySub: "ప్రశ్నలు అడగడం ద్వారా మీ చరిత్రను సృಷ್ಟించండి!",
    chatButton: "తిరిగి చాట్‌కు వెళ్ళు",
    deleteButton: "తొలగించు",
    restoreButton: "చాట్‌ను పునరుద్ధరించు",
    hideButton: "దాచు",
    viewButton: "చూడు",
    suggestions: {
      math: [
        "ద్విఘాత సమీకరణాన్ని సాధించండి: 3x² - 5x + 2 = 0",
        "భారతీయ ఋషులు పైథాగరస్ సిద్ధాಂತాన్ని (ಬೌಧಾಯನ ಸೂತ್ರಗಳು) ఎలా రాశారు?",
        "ఆధారం a = 12 మరియు ఎత్తు b = 5 అయితే, కర్ణం c కనుగొనండి"
      ],
      science: [
        "రసాయన సమీకరణాన్ని సమతుల్యం చేయండి: Fe + O₂ ➔ Fe₂O₃",
        "నీటి ప్రవాహంతో పోలుస్తూ ఓమ్ నియమం V = IR వివరించండి",
        "15 కిలోల బరువు గల వస్తువు 6m/s² త్వరణంతో వెళ్తే, బలాన్ని కనుగొనండి (F = ma)"
      ]
    }
  },
  kn: {
    welcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ವಿಜ್ಞಾನ ಮತ್ತು ಗಣಿತ AI ಸಾಲ್ವರ್. ನೀವು ನನ್ನನ್ನು ಯಾವುದೇ ಲೆಕ್ಕಾಚಾರ, ಭೌತಶಾಸ್ತ್ರದ ನಿಯಮ ಅಥವಾ ರಾಸಾಯನಿಕ ಸಮೀಕರಣವನ್ನು ಕೇಳಬಹುದು. ನೀವು ಚಿತ್ರ ಅಥವಾ PDF ಅನ್ನು ಸಹ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು!",
    placeholder: "ಗಣಿತ ಸಮೀಕರಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ, ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ...",
    placeholderFile: "ಈ ಫೈಲ್ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ...",
    quickSolvesHeader: "ತ್ವರಿತ ಪರಿಹಾರಗಳು",
    quickSolvesDesc: "ತಕ್ಷಣದ ಉತ್ತರಕ್ಕಾಗಿ ಯಾವುದೇ ಪ್ರಶೆಶ್ನೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ:",
    mathProblems: "ಗಣಿತದ ಸಮಸ್ಯೆಗಳು",
    scienceCalculations: "ವಿಜ್ಞಾನದ ಲೆಕ್ಕಾಚಾರಗಳು",
    activeChat: "ಸಕ್ರಿಯ ಚಾಟ್",
    searchHistory: "ಹುಡುಕಾಟದ ಇತಿಹಾಸ",
    newChat: "ಹೊಸ ಚಾಟ್",
    viewHistoryTip: "ನೀವು ಪ್ರಸ್ತುತ ಇತಿಹಾಸವನ್ನು ನೋಡುತ್ತಿದ್ದೀರಿ. AI ಸಾಲ್ವರ್‌ನೊಂದಿಗೆ ಮಾತನಾಡಲು ಮೇಲೆ ಇರುವ 'ಸಕ್ರಿಯ ಚಾಟ್' ಕ್ಲಿಕ್ ಮಾಡಿ.",
    solvingText: "ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ ಉತ್ತರವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
    langLabel: "AI ಸಾಲ್ವರ್ ಭಾಷೆ",
    clearHistory: "ಇತಿಹಾಸವನ್ನು ಅಳಿಸಿ",
    entireHistoryTitle: "ನನ್ನ ಸಂಪೂರ್ಣ ಪರಿಹಾರ ಇತಿಹಾಸ",
    entireHistoryDesc: "ನೀವು ಈ ಹಿಂದೆ ಕೇಳಿದ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಅವುಗಳ ಉತ್ತರಗಳು ಇಲ್ಲಿವೆ.",
    noHistory: "ಯಾವುದೇ ಇತಿಹಾಸ ಕಂಡುಬಂದಿಲ್ಲ.",
    noHistorySub: "ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುವ ಮೂಲಕ ಇತಿಹಾಸವನ್ನು ನಿರ್ಮಿಸಿ!",
    chatButton: "ಚಾಟ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    deleteButton: "ಅಳಿಸಿ",
    restoreButton: "ಚಾಟ್ ಮರುಸ್ಥಾಪಿಸಿ",
    hideButton: "ಮರೆಮಾಡು",
    viewButton: "ನೋಡಿ",
    suggestions: {
      math: [
        "ವರ್ಗ ಸಮೀಕರಣವನ್ನು ಬಿಡಿಸಿ: 3x² - 5x + 2 = 0",
        "ಭಾರತೀಯ ಋಷಿಗಳು ಪೈಥಾಗರಸ್ ಪ್ರಮೇಯವನ್ನು (ಬೌಧಾಯನ ಸೂತ್ರ) ಹೇಗೆ ಬರೆದರು?",
        "ಪಾದ a = 12 ಮತ್ತು ಎತ್ತರ b = 5 ಆಗಿದ್ದರೆ, ವಿಕರ್ಣ c ಅನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ"
      ],
      science: [
        "ರಾಸಾಯನಿಕ ಸಮೀಕರಣವನ್ನು ಸಮತೋಲನಗೊಳಿಸಿ: Fe + O₂ ➔ Fe₂O₃",
        "ನೀರಿನ ಹರಿವಿನ ಹೋಲಿಕೆಯನ್ನು ಬಳಸಿ ಓಮ್‌ನ ನಿಯಮ V = IR ಅನ್ನು ವಿವರಿಸಿ",
        "15 ಕೆಜಿ ತೂಕದ ವಸ್ತುವು 6m/s² ವೇಗವರ್ಧನೆಯಲ್ಲಿದ್ದರೆ, ಬಲವನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ (F = ma)"
      ]
    }
  },
  sa: {
    welcome: "नमो नमः! अहं भवतः विज्ञान-गणितयोः कृत्रिमबुद्धि (AI) बोधकः अस्मि। भवान् मां कामपि गणनां, भौतिकशास्त्रस्य नियमं, रासायनिकसमीकरणं वा प्रष्टुं शक्नोति। चित्रं वा पीडीएफ-सञ्चिकां अपि प्रेषयितुं शक्नोति!",
    placeholder: "गणितीयसमीकरणं लिखतु, सञ्चिकां चिणोतु वा...",
    placeholderFile: "अस्याः सञ्चिकायाः विषये पृच्छतु...",
    quickSolvesHeader: "शीघ्रसमाधानानि",
    quickSolvesDesc: "सद्यः उत्तराय कस्मिंश्चित् प्रश्ने क्लिक् कुर्वन्तु:",
    mathProblems: "गणितसमस्याः",
    scienceCalculations: "विज्ञानगणनाः",
    activeChat: "सक्रियसंवादः",
    searchHistory: "अन्वेषणेतिहासः",
    newChat: "नूतनसंवादः",
    viewHistoryTip: "भवान् सम्प्रति इतिहासम् पश्यति। संवादाय उपरि 'सक्रियसंवादः' इत्यत्र क्लिक् करोतु।",
    solvingText: "गणनां कृत्वा समाधानं अन्विष्यति...",
    langLabel: "AI भाषा",
    clearHistory: "इतिहासम् प्रमार्जतु",
    entireHistoryTitle: "मम सम्पूर्णः संवादतिहासः",
    entireHistoryDesc: "भवता पूर्वं पृष्टाः सर्वे प्रश्नाः समाधानानि च अधः सूचितानि सन्ति।",
    noHistory: "कोऽपि इतिहासः न लब्धः।",
    noHistorySub: "प्रश्नान् प्रष्टुं संवादम् आरभत!",
    chatButton: "संवादं प्रति आगच्छतु",
    deleteButton: "नश्यतु",
    restoreButton: "संवादं पुनस्थापयतु",
    hideButton: "गूहयतु",
    viewButton: "पश्यतु",
    suggestions: {
      math: [
        "द्विघातसमीकरणं साधयतु: 3x² - 5x + 2 = 0",
        "भारतीयऋषयः पायथागोरसप्रमेयं (बौधायनसूत्रम्) कथं लिखितवन्तः?",
        "यदि आधारः a = 12, उन्नतिः b = 5, तर्हि कर्णः c कः?"
      ],
      science: [
        "रासायनिकसमीकरणं सन्तुलयतु: Fe + O₂ ➔ Fe₂O₃",
        "जलप्रवाहस्य दृष्टान्तेन ओम्-नियमं V = IR स्पष्टयतु",
        "यदि १५ किलोग्राम भारयुक्तः पिण्डः ६m/s² वेगेन गच्छति, तर्हि बलं (F = ma) किम?"
      ]
    }
  },
  ur: {
    welcome: "السلام علیکم! میں آپ کا اسمارٹ اے آئی ریاضی اور سائنس حل کرنے والا معاون ہوں۔ مجھ سے کوئی بھی حساب، فارمولا کی وضاحت، کیمیائی مساوات کا توازن پوچھیں، یا حل کرنے کے لیے تصویر/پی ڈی ایف اپ لوڈ کریں!",
    placeholder: "ریاضی کی مساواتیں لکھیں، فارمولے متوازن کریں یا فائل منتخب کریں...",
    placeholderFile: "اس فائل کے بارے میں سوال پوچھیں...",
    quickSolvesHeader: "فوری حل",
    quickSolvesDesc: "حساب کتاب فوری شروع کرنے کے لیے کسی بھی سوال پر کلک کریں:",
    mathProblems: "ریاضی کے مسائل",
    scienceCalculations: "سائنس حساب کتاب",
    activeChat: "فعال چیٹ",
    searchHistory: "سرچ ہسٹری",
    newChat: "نئی چیٹ",
    viewHistoryTip: "آپ فی الحال تاریخ دیکھ رہے ہیں۔ اے آئی سالور سے بات کرنے کے لیے اوپر 'فعال چیٹ' پر کلک کریں۔",
    solvingText: "حساب کتاب حل کر رہا ہے اور جواب تلاش کر رہا ہے...",
    langLabel: "اے آئی سالور کی زبان",
    clearHistory: "تمام ہسٹری صاف کریں",
    entireHistoryTitle: "میری مکمل سالور ہسٹری",
    entireHistoryDesc: "آپ کے پہلے پوچھے گئے تمام سوالات اور ان کے سائنسی حل نیچے درج ہیں۔",
    noHistory: "کوئی ہسٹری نہیں ملی۔",
    noHistorySub: "سوالات پوچھ کر اپنی ہسٹری بنانا شروع کریں!",
    chatButton: "چیٹ پر واپس جائیں",
    deleteButton: "حذف کریں",
    restoreButton: "چیٹ بحال کریں",
    hideButton: "چھپائیں",
    viewButton: "دیکھیں",
    suggestions: {
      math: [
        "دو درجی مساوات حل کریں: 3x² - 5x + 2 = 0",
        "ہندوستانی رشیوں نے مسئلہ فیثاغورث (بودھیان سوترا) کیسے لکھا تھا؟",
        "اگر قاعدہ a = 12 اور اونچائی b = 5 ہو، تو وتر c معلوم کریں"
      ],
      science: [
        "کیمیائی مساوات متوازن کریں: Fe + O₂ ➔ Fe₂O₃",
        "پانی کے بہاؤ کی مثال کے ساتھ اوہم کا قانون V = IR سمجھائیں",
        "اگر 15 کلوگرام کا بلاک 6m/s² پر تیز ہوتا ہے، تو قوت معلوم کریں (F = ma)"
      ]
    }
  },
  es: {
    welcome: "¡Hola! Soy tu resolvedor inteligente de IA para Matemáticas y Ciencias. ¡Pregúntame cualquier cálculo, explicación de fórmulas, balanceo de ecuaciones químicas o sube una imagen/PDF para resolverlo!",
    placeholder: "Escribe ecuaciones matemáticas, balancea fórmulas o selecciona archivos...",
    placeholderFile: "Haz una pregunta sobre este archivo...",
    quickSolvesHeader: "Soluciones Rápidas",
    quickSolvesDesc: "Haz clic en cualquier pregunta interactiva para consultar al motor de cálculo al instante:",
    mathProblems: "Problemas de Matemáticas",
    scienceCalculations: "Cálculos Científicos",
    activeChat: "Chat Activo",
    searchHistory: "Historial de Búsqueda",
    newChat: "Nuevo Chat",
    viewHistoryTip: "Actualmente estás viendo el historial. Haz clic en 'Chat Activo' arriba para enviar un mensaje al resolvedor de IA.",
    solvingText: "Resolviendo cálculo y procesando hoja de trabajo...",
    langLabel: "Idioma del Resolvedor IA",
    clearHistory: "Borrar todo el historial",
    entireHistoryTitle: "Mi Historial Completo del Resolvedor",
    entireHistoryDesc: "Todas tus preguntas formuladas anteriormente y las soluciones científicas se enumeran a continuación.",
    noHistory: "No se encontró historial.",
    noHistorySub: "¡Comienza a hacer preguntas para construir tu historial!",
    chatButton: "Volver al Chat",
    deleteButton: "Eliminar",
    restoreButton: "Restaurar Chat",
    hideButton: "Ocultar",
    viewButton: "Ver",
    suggestions: {
      math: [
        "Resuelve la ecuación cuadrática: 3x² - 5x + 2 = 0 mostrando raíces",
        "¿Cómo escribieron los sabios indios el teorema de Pitágoras (Sutras Baudhayan)?",
        "Encuentra la hipotenusa c si la base a = 12 y la altura b = 5"
      ],
      science: [
        "Balancea la ecuación: Fe + O₂ ➔ Fe₂O₃ y explica las reglas",
        "Explica la ley de Ohm V = IR usando una analogía de flujo de agua",
        "Si un bloque de 15 kg acelera a 6 m/s², encuentra la fuerza (F = ma)"
      ]
    }
  },
  fr: {
    welcome: "Bonjour! Je suis votre solveur IA intelligent en mathématiques et sciences. Posez-moi vos questions de calcul, d'explication de formule, d'équilibrage chimique ou téléchargez une image/PDF!",
    placeholder: "Saisissez des équations, équilibrez des formules ou sélectionnez des fichiers...",
    placeholderFile: "Posez une question sur ce fichier...",
    quickSolvesHeader: "Résolutions Rapides",
    quickSolvesDesc: "Cliquez sur une suggestion pour interroger instantanément le moteur de calcul :",
    mathProblems: "Problèmes de Mathématiques",
    scienceCalculations: "Calculs Scientifiques",
    activeChat: "Chat Actif",
    searchHistory: "Historique",
    newChat: "Nouveau Chat",
    viewHistoryTip: "Vous consultez actuellement l'historique. Cliquez sur 'Chat Actif' ci-dessus pour envoyer un message.",
    solvingText: "Calcul et résolution en cours...",
    langLabel: "Langue du Solveur IA",
    clearHistory: "Effacer l'historique",
    entireHistoryTitle: "Mon Historique Complet",
    entireHistoryDesc: "Toutes vos questions précédentes et les solutions scientifiques sont répertoriées ci-dessous.",
    noHistory: "Aucun historique trouvé.",
    noHistorySub: "Commencez à poser des questions pour alimenter votre historique!",
    chatButton: "Retour au Chat",
    deleteButton: "Supprimer",
    restoreButton: "Restaurer le Chat",
    hideButton: "Masquer",
    viewButton: "Voir",
    suggestions: {
      math: [
        "Résoudre l'équation quadratique: 3x² - 5x + 2 = 0",
        "Comment les sages indiens ont-ils formulé le théorème de Pythagore (Baudhayan Sutras)?",
        "Trouver l'hypoténuse c si la base a = 12 et la hauteur b = 5"
      ],
      science: [
        "Équilibrer l'équation: Fe + O₂ ➔ Fe₂O₃",
        "Expliquer la loi d'Ohm V = IR avec l'analogie du débit d'eau",
        "Si un bloc de 15 kg accélère à 6 m/s², calculer la force (F = ma)"
      ]
    }
  },
  de: {
    welcome: "Hallo! Ich bin dein intelligenter KI-Mathe- und Wissenschaftslöser. Frag mich nach Berechnungen, Formelerklärungen, chemischen Gleichungen oder lade ein Bild/PDF hoch!",
    placeholder: "Gleichungen eingeben, Formeln ausgleichen oder Dateien auswählen...",
    placeholderFile: "Stelle eine Frage zu dieser Datei...",
    quickSolvesHeader: "Schnelllösung",
    quickSolvesDesc: "Klicke auf eine Frage, um sofort eine Berechnung durchzuführen:",
    mathProblems: "Mathematik-Probleme",
    scienceCalculations: "Wissenschaftliche Berechnungen",
    activeChat: "Aktiver Chat",
    searchHistory: "Suchverlauf",
    newChat: "Neuer Chat",
    viewHistoryTip: "Du siehst gerade den Verlauf an. Klicke oben auf 'Aktiver Chat', um dem KI-Löser zu schreiben.",
    solvingText: "Berechnung läuft und Lösungsblatt wird erstellt...",
    langLabel: "KI-Löser Sprache",
    clearHistory: "Verlauf löschen",
    entireHistoryTitle: "Mein vollständiger Lösungsverlauf",
    entireHistoryDesc: "Alle deine zuvor gestellten Fragen und wissenschaftlichen Lösungen sind unten aufgeführt.",
    noHistory: "Kein Verlauf gefunden.",
    noHistorySub: "Stelle Fragen, um deinen Verlauf aufzubauen!",
    chatButton: "Zurück zum Chat",
    deleteButton: "Löschen",
    restoreButton: "Chat wiederherstellen",
    hideButton: "Ausblenden",
    viewButton: "Anzeigen",
    suggestions: {
      math: [
        "Löse die quadratische Gleichung: 3x² - 5x + 2 = 0",
        "Wie haben indische Gelehrte den Satz des Pythagoras (Baudhayan Sutras) formuliert?",
        "Berechne die Hypotenuse c, wenn Basis a = 12 und Höhe b = 5"
      ],
      science: [
        "Gleiche die Gleichung aus: Fe + O₂ ➔ Fe₂O₃",
        "Erkläre das Ohmsche Gesetz V = IR mit einer Wasserfluss-Analogie",
        "Wenn ein 15-kg-Block mit 6 m/s² beschleunigt, berechne die Kraft (F = ma)"
      ]
    }
  }
};

export const EQ_TAB_LABELS: Record<string, Record<string, string>> = {
  en: {
    adjustParameters: "Adjust Parameters",
    massLabel: "Mass (m):",
    accelerationLabel: "Acceleration (a):",
    currentLabel: "Current (I):",
    resistanceLabel: "Resistance (R):",
    einsteinMassLabel: "Mass (m in mg):",
    baseLabel: "Base (Side a):",
    heightLabel: "Height (Side b):",
    distanceLabel: "Distance from Base (d):",
    angleLabel: "Angle of Elevation (θ):",
    coeffALabel: "Coefficient a (≠ 0):",
    coeffBLabel: "Coefficient b:",
    coeffCLabel: "Constant c:",
    liveOutput: "Live Calculation Output",
    forceFormulaText: "Force = Mass × Acceleration",
    voltageFormulaText: "Voltage = Current × Resistance",
    energyFormulaText: "Energy (E) = Mass (m) × c²",
    hypotenuseFormulaText: "Hypotenuse (c) = √(a² + b²)",
    computedRoots: "Computed Roots:",
    pushVectorTitle: "Push Vector Visualization",
    pushLabel: "Push",
    interactiveBulbTitle: "Interactive Bulb Circuit",
    equivalentPowerScale: "Equivalent Power Scale",
    villageSchoolPowerPre: "Can run village primary school for",
    villageSchoolPowerPost: "months!",
    liveTriangleRender: "Live SVG Right-Triangle Render",
    angleElevationTitle: "Angle of Elevation Visualized",
    parabolaPlotter: "Parabola Graph Plotter",
    academicInsight: "Academic Concept Insight",
    interactiveLab: "Interactive Lab Activity",
    balanceChemical: "Balance the Chemical Equation",
    earnPoints: "Earn Study Points",
    validateEquation: "Validate Equation",
    reset: "Reset",
    helpBalancing: "Need Help Balancing?",
    downloadPDF: "Download Solution PDF",
    copyText: "Copy Plain Text",
    copied: "Copied!",
    quickSolves: "Quick Solves",
    formulaSheet: "Formula Sheet",
    tryQuickSolves: "Try Quick Solves",
    physicsEquations: "Physics Equations",
    chemistryFormulae: "Chemistry Formulae",
    mathEquations: "Math Equations",
    explainFormulaDetail: "Please explain this formula in detail",
    explainChemicalFormulaDetail: "Please explain this chemical formula",
    explainMathFormulaDetail: "Please explain this mathematical formula and show derivation",
    useFormula: "Use Formula",
    aiSolve: "AI Solve",
    multiModalSolve: "Multi-Modal Solve Engine",
    mathAndScienceFormulae: "Math & Science Formula Sheet"
  },
  hi: {
    adjustParameters: "पैरामीटर बदलें",
    massLabel: "द्रव्यमान (Mass m):",
    accelerationLabel: "त्वरण (Acceleration a):",
    currentLabel: "विद्युत धारा (Current I):",
    resistanceLabel: "प्रतिरोध (Resistance R):",
    einsteinMassLabel: "द्रव्यमान (Mass m in mg):",
    baseLabel: "आधार (Base side a):",
    heightLabel: "लंब (Height side b):",
    distanceLabel: "जमीनी दूरी (Distance d):",
    angleLabel: "उन्नयन कोण (Angle θ):",
    coeffALabel: "गुणांक a (शून्य नहीं):",
    coeffBLabel: "गुणांक b:",
    coeffCLabel: "अचर पद c:",
    liveOutput: "सक्रिय गणना परिणाम",
    forceFormulaText: "बल = द्रव्यमान × त्वरण",
    voltageFormulaText: "वोल्टेज = विद्युत धारा × प्रतिरोध",
    energyFormulaText: "ऊर्जा (E) = द्रव्यमान (m) × c²",
    hypotenuseFormulaText: "कर्ण (c) = √(a² + b²)",
    computedRoots: "मूल (Roots):",
    pushVectorTitle: "गति की दिशा और बल सदिश",
    pushLabel: "धक्का",
    interactiveBulbTitle: "विद्युत परिपथ और बल्ब की चमक",
    equivalentPowerScale: "ऊर्जा रूपांतरण तुलना",
    villageSchoolPowerPre: "यह ग्रामीण स्कूल को",
    villageSchoolPowerPost: "महीने तक बिजली देगा!",
    liveTriangleRender: "समकोण त्रिभुज SVG दृश्य",
    angleElevationTitle: "उन्नयन कोण और ऊँचाई प्रोजेक्शन",
    parabolaPlotter: "परवलय आरेख (Parabola curve) SVG",
    academicInsight: "अवधारणा की समझ (Physical Insight)",
    interactiveLab: "इंटरैक्टिव गतिविधि",
    balanceChemical: "रासायनिक समीकरण संतुलित करें",
    earnPoints: "बोनस: अंक अर्जित करें",
    validateEquation: "समीकरण जांचें",
    reset: "रीसेट",
    helpBalancing: "समीकरण संतुलित कैसे करें?",
    downloadPDF: "समाधान PDF डाउनलोड करें",
    copyText: "प्लेन टेक्स्ट कॉपी करें",
    copied: "कॉपी हो गया!",
    quickSolves: "त्वरित हल",
    formulaSheet: "सम्पूर्ण सूत्र",
    tryQuickSolves: "त्वरित गणना संकेत",
    physicsEquations: "भौतिक विज्ञान",
    chemistryFormulae: "रसायन विज्ञान",
    mathEquations: "गणित सूत्र",
    explainFormulaDetail: "कृपया इस सूत्र को विस्तार से समझाएं",
    explainChemicalFormulaDetail: "कृपया इस रसायन सूत्र को समझाएं",
    explainMathFormulaDetail: "कृपया इस गणितीय सूत्र को समझाएं और सूत्रपात दिखाएं",
    useFormula: "चैट में डालें",
    aiSolve: "एआई से हल करें",
    multiModalSolve: "चित्र और पीडीएफ सॉल्वर",
    mathAndScienceFormulae: "गणित और विज्ञान सूत्र"
  },
  gu: {
    adjustParameters: "પરિમાણો બદલો",
    massLabel: "દ્રવ્યમાન (Mass m):",
    accelerationLabel: "પ્રવેગ (Acceleration a):",
    currentLabel: "વિદ્યુત પ્રવાહ (Current I):",
    resistanceLabel: "અવરોધ (Resistance R):",
    einsteinMassLabel: "દ્રવ્યમાન (Mass m in mg):",
    baseLabel: "આધાર (Base side a):",
    heightLabel: "લંબ (Height side b):",
    distanceLabel: "જમીનનું અંતર (Distance d):",
    angleLabel: "ઉન્નયન કોણ (Angle θ):",
    coeffALabel: "સહગુણક a (શૂન્ય નહીં):",
    coeffBLabel: "સહગુણક b:",
    coeffCLabel: "અચળ પદ c:",
    liveOutput: "લાઇવ ગણતરી પરિણામ",
    forceFormulaText: "બળ = દ્રવ્યમાન × પ્રવેગ",
    voltageFormulaText: "વોલ્ટેજ = વિદ્યુત પ્રવાહ × અવરોધ",
    energyFormulaText: "ઊર્જા (E) = દ્રવ્યમાન (m) × c²",
    hypotenuseFormulaText: "કર્ણ (c) = √(a² + b²)",
    computedRoots: "ગણતરી કરેલ ઉકેલો (મૂળો):",
    pushVectorTitle: "બળ સદિશ ચિત્રણ",
    pushLabel: "ધક્કો",
    interactiveBulbTitle: "ઇન્ટરેક્ટિવ બલ્બ સર્કિટ",
    equivalentPowerScale: "ઊર્જા રૂપાંતરણ સરખામણી",
    villageSchoolPowerPre: "આ ગામની પ્રાથમિક શાળાને",
    villageSchoolPowerPost: "મહિના સુધી વીજળી આપશે!",
    liveTriangleRender: "કાટકોણ ત્રિકોણ રેન્ડર",
    angleElevationTitle: "ઉન્નયન કોણ રેન્ડર",
    parabolaPlotter: "પેરાબોલા આલેખ પ્લોટર",
    academicInsight: "શૈક્ષણિક ખ્યાલ સમજ",
    interactiveLab: "ઇન્ટરેક્ટિવ પ્રયોગશાળા પ્રવૃત્તિ",
    balanceChemical: "રાસાયણિક સમીકરણ સંતુલિત કરો",
    earnPoints: "બોનસ: અભ્યાસ પોઇન્ટ્સ મેળવો",
    validateEquation: "સમીકરણ ચકાસો",
    reset: "રીસેટ",
    helpBalancing: "સંતુલન કરવામાં મદદ જોઈએ છે?",
    downloadPDF: "ઉકેલ PDF ડાઉનલોડ કરો",
    copyText: "ટેક્સ્ટ કોપી કરો",
    copied: "કોપી થયું!",
    quickSolves: "ઝડપી ઉકેલો",
    formulaSheet: "સૂત્ર પત્રક",
    tryQuickSolves: "ઝડપી ઉકેલોનો પ્રયાસ કરો",
    physicsEquations: "ભૌતિક વિજ્ઞાન સમીકરણો",
    chemistryFormulae: "રસાયણ વિજ્ઞાન સૂત્રો",
    mathEquations: "ગણિતના સમીકરણો",
    explainFormulaDetail: "કૃપા કરીને આ સૂત્ર વિગતવાર સમજાવો",
    explainChemicalFormulaDetail: "કૃપા કરીને આ રાસાયણિક સૂત્ર સમજાવો",
    explainMathFormulaDetail: "કૃપા કરીને આ ગણિતના સૂત્રને સમજાવો અને તેની સાબિતી આપો",
    useFormula: "સૂત્ર વાપરો",
    aiSolve: "AI ઉકેલ મેળવો",
    multiModalSolve: "ચિત્ર અને PDF સોલ્વર",
    mathAndScienceFormulae: "ગણિત અને વિજ્ઞાન સૂત્ર પત્રક"
  },
  mr: {
    adjustParameters: "पॅरामीटर्स बदला",
    massLabel: "वस्तुमान (Mass m):",
    accelerationLabel: "त्वरण (Acceleration a):",
    currentLabel: "विद्युत धारा (Current I):",
    resistanceLabel: "रोध (Resistance R):",
    einsteinMassLabel: "वस्तुमान (Mass m in mg):",
    baseLabel: "पाया (Base side a):",
    heightLabel: "उंची (Height side b):",
    distanceLabel: "जमिनीचे अंतर (Distance d):",
    angleLabel: "उन्नत कोन (Angle θ):",
    coeffALabel: "सहगुणक a (शून्य नाही):",
    coeffBLabel: "सहगुणक b:",
    coeffCLabel: "स्थिर पद c:",
    liveOutput: "थेट गणना निकाल",
    forceFormulaText: "बल = वस्तुमान × त्वरण",
    voltageFormulaText: "विभवांतर = विद्युत धारा × रोध",
    energyFormulaText: "ऊर्जा (E) = वस्तुमान (m) × c²",
    hypotenuseFormulaText: "कर्ण (c) = √(a² + b²)",
    computedRoots: "शोधलेली मुळे:",
    pushVectorTitle: "बल दिशा आणि सदिश रेखाचित्र",
    pushLabel: "धक्का",
    interactiveBulbTitle: "परिपथ आणि बल्बची चमक",
    equivalentPowerScale: "ऊर्जा रूपांतरण तुलना",
    villageSchoolPowerPre: "हे ग्रामीण शाळेला",
    villageSchoolPowerPost: "महिन्यांपर्यंत वीज पुरवेल!",
    liveTriangleRender: "काटकोण त्रिकोण चित्र रेखाटन",
    angleElevationTitle: "उन्नत कोन आणि उंचीचे चित्र",
    parabolaPlotter: "परवलय आलेख चित्र",
    academicInsight: "शैक्षणिक संकल्पना समज",
    interactiveLab: "परस्परसंवादी प्रयोगशाळा कृती",
    balanceChemical: "रासायनिक समीकरण संतुलित करा",
    earnPoints: "बोनस: अभ्यास गुण मिळवा",
    validateEquation: "समीकरण तपासा",
    reset: "पुन्हा सुरू करा (रीसेट)",
    helpBalancing: "संतुलन करण्यासाठी मदत हवी आहे?",
    downloadPDF: "उत्तर PDF डाउनलोड करा",
    copyText: "मजकूर कॉपी करा",
    copied: "copy झाले!",
    quickSolves: "त्वरित सोडवणूक",
    formulaSheet: "सूत्र पत्रक",
    tryQuickSolves: "त्वरित सोडवणूक वापरून पहा",
    physicsEquations: "भौतिकशास्त्र समीकरणे",
    chemistryFormulae: "रसायनशास्त्र सूत्रे",
    mathEquations: "गणित सूत्रे",
    explainFormulaDetail: "कृपया हे सूत्र सविस्तर स्पष्ट करा",
    explainChemicalFormulaDetail: "कृपया हे रासायनिक सूत्र स्पष्ट करा",
    explainMathFormulaDetail: "कृपया हे गणितीय सूत्र स्पष्ट करा आणि सिद्धता दाखवा",
    useFormula: "सूत्र वापरा",
    aiSolve: "एआय द्वारे सोडवा",
    multiModalSolve: "चित्र आणि पीडीएफ सॉल्वर",
    mathAndScienceFormulae: "गणित आणि विज्ञान सूत्रे"
  },
  ta: {
    adjustParameters: "அளவுகோல்களை மாற்று",
    massLabel: "நிறை (Mass m):",
    accelerationLabel: "முடுக்கம் (Acceleration a):",
    currentLabel: "மின்னோட்டம் (Current I):",
    resistanceLabel: "மின்தடை (Resistance R):",
    einsteinMassLabel: "நிறை (Mass m in mg):",
    baseLabel: "அடிபாகம் (Base side a):",
    heightLabel: "உயரம் (Height side b):",
    distanceLabel: "தரைத் தூரம் (Distance d):",
    angleLabel: "ஏற்றக் கோணம் (Angle θ):",
    coeffALabel: "கெழு a (பூஜ்ஜியம் அல்ல):",
    coeffBLabel: "கெழு b:",
    coeffCLabel: "மாறிலி c:",
    liveOutput: "நேரடி கணக்கீட்டு வெளியீடு",
    forceFormulaText: "விசை = நிறை × முடுக்கம்",
    voltageFormulaText: "மின்னழுத்தம் = மின்னோட்டம் × மின்தடை",
    energyFormulaText: "ஆற்றல் (E) = நிறை (m) × c²",
    hypotenuseFormulaText: "கர்ணம் (c) = √(a² + b²)",
    computedRoots: "கணக்கிடப்பட்ட மூலங்கள்:",
    pushVectorTitle: "விசை வெக்டார் காட்சிப்படுத்தல்",
    pushLabel: "தள்ளு",
    interactiveBulbTitle: "மின்சுற்று மற்றும் விளக்கின் ஒளி",
    equivalentPowerScale: "ஆற்றல் மாற்ற ஒப்பீடு",
    villageSchoolPowerPre: "இது கிராமத்து தொடக்கப் பள்ளிக்கு",
    villageSchoolPowerPost: "மாதங்கள் மின்சாரம் வழங்கும்!",
    liveTriangleRender: "செங்கோண முக்கோண காட்சி",
    angleElevationTitle: "ஏற்றக்கோண காட்சிப்படுத்தல்",
    parabolaPlotter: "பரவளைய வரைபடம்",
    academicInsight: "பாடக் கருத்துப் புரிதல்",
    interactiveLab: "ஊடாடும் ஆய்வகச் செயல்பாடு",
    balanceChemical: "வேதியியல் சமன்பாட்டைச் சமன்படுத்துக",
    earnPoints: "போனஸ்: படிப்பு புள்ளிகளைப் பெறுங்கள்",
    validateEquation: "சமன்பாட்டைச் சரிபார்",
    reset: "மீட்டமை",
    helpBalancing: "சமன்படுத்த உதவி வேண்டுமா?",
    downloadPDF: "தீர்வு PDF பதிவிறக்கு",
    copyText: "உரையை நகலெடு",
    copied: "நகலெடுக்கப்பட்டது!",
    quickSolves: "விரைவுத் தீர்வுகள்",
    formulaSheet: "சூத்திரத்தாள்",
    tryQuickSolves: "விரைவு தீர்வுகளை முயற்சிக்கவும்",
    physicsEquations: "இயற்பியல் சமன்பாடுகள்",
    chemistryFormulae: "வேதியியல் சூத்திரங்கள்",
    mathEquations: "கணித சமன்பாடுகள்",
    explainFormulaDetail: "தயவுசெய்து இந்த சூத்திரத்தை விரிவாக விளக்குங்கள்",
    explainChemicalFormulaDetail: "தயவுசெய்து இந்த வேதியியல் சூத்திரத்தை விளக்குங்கள்",
    explainMathFormulaDetail: "தயவுசெய்து இந்தக் கணித சூத்திரத்தை விளக்கி அதன் வழிமுறையைக் காட்டுங்கள்",
    useFormula: "சூத்திரத்தைப் பயன்படுத்து",
    aiSolve: "AI தீர்வு",
    multiModalSolve: "படம் மற்றும் PDF தீர்வு இயந்திரம்",
    mathAndScienceFormulae: "கணிதம் மற்றும் அறிவியல் சூத்திரத் தாள்"
  },
  te: {
    adjustParameters: "పారామితులను సర్దుబాటు చేయి",
    massLabel: "ద్రవ్యరాశి (Mass m):",
    accelerationLabel: "త్వరణం (Acceleration a):",
    currentLabel: "విద్యుత్ ప్రవాహం (Current I):",
    resistanceLabel: "నిరోధం (Resistance R):",
    einsteinMassLabel: "ద్రవ్యరాశి (Mass m in mg):",
    baseLabel: "ఆధారం (Base side a):",
    heightLabel: "ఎత్తు (Height side b):",
    distanceLabel: "నేల దూరం (Distance d):",
    angleLabel: "ఉన్నత కోణం (Angle θ):",
    coeffALabel: "గుణకం a (సున్నా కాదు):",
    coeffBLabel: "గుణకం b:",
    coeffCLabel: "స్థిర పదం c:",
    liveOutput: "లైవ్ లెక్కింపు అవుట్‌పుట్",
    forceFormulaText: "బలం = ద్రవ్యరాశి × త్వరణం",
    voltageFormulaText: "వోల్టేజ్ = విద్యుత్ ప్రవాహం × నిరోధకత",
    energyFormulaText: "శక్తి (E) = ద్రవ్యరాశి (m) × c²",
    hypotenuseFormulaText: "కర్ణం (c) = √(a² + b²)",
    computedRoots: "లెక్కించబడిన మూలాలు:",
    pushVectorTitle: "పుష్ వెక్టర్ విజువలైజేషన్",
    pushLabel: "నెట్టు",
    interactiveBulbTitle: "ఇంటరాక్టివ్ బల్బ్ సర్క్యూట్",
    equivalentPowerScale: "శక్తి పరివర్తన పోలిక",
    villageSchoolPowerPre: "ఇది గ్రామీణ ప్రాథమిక పాఠశాలకు",
    villageSchoolPowerPost: "నెలల పాటు విద్యుత్ అందిస్తుంది!",
    liveTriangleRender: "లైవ్ లంబకోణ త్రిభుజం రెండర్",
    angleElevationTitle: "ఉన్నత కోణం విజువలైజేషన్",
    parabolaPlotter: "పారాబోలా గ్రాఫ్ ప్లాటర్",
    academicInsight: "విద్యా భావన అవగాహన",
    interactiveLab: "ఇంటరాక్టివ్ ల్యాబ్ కార్యాచరణ",
    balanceChemical: "రసాయన సమీకరణాన్ని సమతుల్యం చేయి",
    earnPoints: "బోనస్: స్టడీ పాయింట్లు సంపాదించండి",
    validateEquation: "సమీకరణాన్ని సరిచూడు",
    reset: "రీసెట్",
    helpBalancing: "సమతుల్యం చేయడంలో సహాయం కావాలా?",
    downloadPDF: "పరిష్కారం PDF డౌన్‌లోడ్ చేయి",
    copyText: "టెక్స్ట్ కాపీ చేయి",
    copied: "కాపీ చేయబడింది!",
    quickSolves: "త్వరిక పరిష్కారాలు",
    formulaSheet: "ఫార్ములా షీట్",
    tryQuickSolves: "త్వరిత పరిష్కారాలను ప్రయత్నించండి",
    physicsEquations: "భౌతికశాస్త్ర సమీకరణాలు",
    chemistryFormulae: "రసాయనశాస్త్ర ఫార్ములాలు",
    mathEquations: "గణిత సమీకరణాలు",
    explainFormulaDetail: "దయచేసి ఈ ఫార్ములాను వివరంగా వివరించండి",
    explainChemicalFormulaDetail: "దయచేసి ఈ రసాయన ఫార్ములాను వివరించండి",
    explainMathFormulaDetail: "దయచేసి ఈ గణిత ఫార్ములాను వివరించి, దాని ఉత్పాదనను చూపండి",
    useFormula: "ఫార్ములా ఉపయోగించు",
    aiSolve: "AI పరిష్కారం",
    multiModalSolve: "చిత్రం మరియు PDF సాల్వర్ ఇంజిన్",
    mathAndScienceFormulae: "గణితం మరియు సైన్స్ ఫార్ములా షీట్"
  }
};

export function getEqLabel(key: string, langCode: string): string {
  const dict = EQ_TAB_LABELS[langCode] || EQ_TAB_LABELS.en;
  return dict[key] || EQ_TAB_LABELS.en[key] || key;
}

export function getFormulaLocalized(f: any, lang: string) {
  const translations: Record<string, Record<string, { name: string; description: string }>> = {
    hi: {
      "Newton's Second Law": { name: "न्यूटन का दूसरा नियम", description: "बल द्रव्यमान और त्वरण के गुणनफल के बराबर होता है।" },
      "Ohm's Law": { name: "ओम का नियम", description: "विद्युत विभवान्तर धारा और प्रतिरोध के गुणनफल के बराबर होता है।" },
      "Einstein's Mass-Energy": { name: "आइंस्टीन का द्रव्यमान-ऊर्जा समीकरण", description: "ऊर्जा द्रव्यमान और प्रकाश की गति के वर्ग के गुणनफल के बराबर होती है।" },
      "Gravitational Potential Energy": { name: "गुरुत्वीय स्थितिज ऊर्जा", description: "स्थितिज ऊर्जा द्रव्यमान, गुरुत्वाकर्षण बल और ऊंचाई पर निर्भर करती है।" },
      "Kinetic Energy": { name: "गतिज ऊर्जा", description: "गतिमान वस्तु की ऊर्जा।" },
      "Density Formula": { name: "घनत्व का सूत्र", description: "घनत्व द्रव्यमान को आयतन से विभाजित करने पर प्राप्त होता है।" },
      "Ideal Gas Law": { name: "आदर्श गैस नियम", description: "दाब, आयतन, मोल, गैस नियतांक और तापमान को जोड़ता है।" },
      "Molarity": { name: "मोलरता", description: "विलेय के मोलों की संख्या को विलयन के लीटर आयतन से विभाजित किया जाता है।" },
      "pH Formula": { name: "pH मान सूत्र", description: "विलयन की अम्लता या क्षारीयता की गणना करता है।" },
      "Pythagorean Theorem": { name: "पाइथागोरस प्रमेय", description: "एक समकोण त्रिभुज में, कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है।" },
      "Quadratic Formula": { name: "द्विघात सूत्र", description: "द्विघात समीकरण ax² + bx + c = 0 के मूल निकालता है।" },
      "Area of a Circle": { name: "वृत्त का क्षेत्रफल", description: "त्रिज्या r वाले वृत्त के क्षेत्रफल की गणना करता है।" },
      "Volume of a Sphere": { name: "गोले का आयतन", description: "त्रिज्या r वाले गोले के आयतन की गणना करता है।" },
      "Euler's Identity": { name: "यूलर की पहचान", description: "पांच गणितीय स्थिरांकों को जोड़ने वाला सबसे सुंदर समीकरण।" }
    },
    gu: {
      "Newton's Second Law": {
        name: "ન્યૂટનનો બીજો નિયમ",
        description: "બળ એ દ્રવ્યમાન અને પ્રવેગના ગુણાકાર બરાબર છે."
      },
      "Ohm's Law": {
        name: "ઓહ્મનો નિયમ",
        description: "વોલ્ટેજ એ વિદ્યુત પ્રવાહ અને અવરોધના ગુણાકાર બરાબર છે."
      },
      "Einstein's Mass-Energy": {
        name: "આઇન્સ્ટાઇનનું દ્રવ્યમાન-ઊર્જા સમીકરણ",
        description: "ઊર્જા એ દ્રવ્યમાન અને પ્રકાશની ગતિના વર્ગના ગુણાકાર બરાબર છે."
      },
      "Gravitational Potential Energy": {
        name: "ગુરુત્વાકર્ષણ સ્થિતિજ ઊર્જા",
        description: "સ્થિતિજ ઊર્જા દ્રવ્યમાન, ગુરુત્વાકર્ષણ બળ અને ઊંચાઈ પર આધાર રાખે છે."
      },
      "Kinetic Energy": {
        name: "ગતિજ ઊર્જા",
        description: "ગતિમાન પદાર્થની ઊર્જા."
      },
      "Density Formula": {
        name: "ઘનતાનું સૂત્ર",
        description: "ઘનતા એ દ્રવ્યમાનને કદ વડે ભાગવાથી મળે છે."
      },
      "Ideal Gas Law": {
        name: "આદર્શ વાયુ નિયમ",
        description: "દબાણ, કદ, મોલ, ગેસ અચળાંક અને તાપમાન વચ્ચેનો સંબંધ દર્શાવે છે."
      },
      "Molarity": {
        name: "મોલારિટી",
        description: "દ્રાવકના મોલ સંખ્યાને દ્રાવણના લિટર કદ વડે ભાગવામાં આવે છે."
      },
      "pH Formula": {
        name: "pH સૂત્ર",
        description: "દ્રાવણની એસિડિટી અથવા બેસિસિટીની ગણતરી કરે છે."
      },
      "Pythagorean Theorem": {
        name: "પાયથાગોરસ પ્રમેય",
        description: "કાટકોણ ત્રિકોણમાં, કર્ણનો વર્ગ અન્ય બે બાજુઓના વર્ગોના સરવાળા સમાન હોય છે."
      },
      "Quadratic Formula": {
        name: "દ્વિઘાત સૂત્ર",
        description: "દ્વિઘાત સમીકરણ ax² + bx + c = 0 ના ઉકેલો શોધે છે."
      },
      "Area of a Circle": {
        name: "વર્તુળનું ક્ષેત્રફળ",
        description: "ત્રિજ્યા r ધરાવતા વર્તુળના ક્ષેત્રફળની ગણતરી કરે છે."
      },
      "Volume of a Sphere": {
        name: "ગોળાનું ઘનફળ",
        description: "ત્રિજ્યા r ધરાવતા ગોળાના ઘનફળની ગણતરી કરે છે."
      },
      "Euler's Identity": {
        name: "યુલરની ઓળખ",
        description: "પાંચ ગણિત અચળાંકોને જોડતું સૌથી સુંદર સમીકરણ."
      }
    },
    mr: {
      "Newton's Second Law": {
        name: "न्यूटनचा दुसरा नियम",
        description: "बल हे वस्तुमान आणि प्रवेगाच्या गुणाकाराच्या बरोबर असते."
      },
      "Ohm's Law": {
        name: "ओहमचा नियम",
        description: "विद्युत विभवांतर हे विद्युत धारा आणि रोध यांच्या गुणाकाराच्या बरोबर असते."
      },
      "Einstein's Mass-Energy": {
        name: "आईन्स्टाईनचे वस्तुमान-ऊर्जा समीकरण",
        description: "ऊर्जा ही वस्तुमान आणि प्रकाश वेगाच्या वर्गाच्या गुणाकाराच्या बरोबर असते."
      },
      "Gravitational Potential Energy": {
        name: "गुरुत्वीय स्थितिज ऊर्जा",
        description: "स्थितिज ऊर्जा वस्तुमान, गुरुत्वाकर्षण आणि उंचीवर अवलंबून असते."
      },
      "Kinetic Energy": {
        name: "गतिज ऊर्जा",
        description: "गतिमान वस्तूची ऊर्जा."
      },
      "Density Formula": {
        name: "घनतेचे सूत्र",
        description: "घनता म्हणजे वस्तुमान भागिले आयतन."
      },
      "Ideal Gas Law": {
        name: "आदर्श वायू नियम",
        description: "दाब, आयतन, moल्स, वायू स्थिरांक आणि तापमान यांना जोडतो."
      },
      "Molarity": {
        name: "मोलरता",
        description: "विद्राव्याच्या moल्सची संख्या भागिले द्रावणाचे लिटरमधील आयतन."
      },
      "pH Formula": {
        name: "pH सूत्र",
        description: "द्रावणाची आम्लता किंवा क्षारता मोजते."
      },
      "Pythagorean Theorem": {
        name: "पायथागोरसचा सिद्धांत",
        description: "काटकोन त्रिकोणात, कर्णाचा वर्ग हा इतर दोन बाजूंच्या वर्गांच्या बेरजेइतका असतो."
      },
      "Quadratic Formula": {
        name: "द्विघात सूत्र",
        description: "द्विघात समीकरण ax² + bx + c = 0 ची मुळे शोधते."
      },
      "Area of a Circle": {
        name: "वर्तुळाचे क्षेत्रफळ",
        description: "त्रिज्या r असलेल्या वर्तुळाच्या क्षेत्रफळाची गणना करते."
      },
      "Volume of a Sphere": {
        name: "गोलाचे घनफळ",
        description: "त्रिज्या r असलेल्या गोलाच्या घनफळाची गणना करते."
      },
      "Euler's Identity": {
        name: "युलरचे समीकरण",
        description: "पाच गणितीय स्थिरांक जोडणारे सर्वात सुंदर समीकरण."
      }
    },
    ta: {
      "Newton's Second Law": {
        name: "நியூட்டனின் இரண்டாம் விதி",
        description: "விசையானது நிறை மற்றும் முடுக்கத்தின் பெருக்கற்பலனுக்கு சமம்."
      },
      "Ohm's Law": {
        name: "ஓம் விதி",
        description: "மின்னழுத்தம் மின்னோட்டம் மற்றும் மின்தடையின் பெருக்கற்பலனுக்கு சமம்."
      },
      "Einstein's Mass-Energy": {
        name: "ஐன்ஸ்டீனின் நிறை-ஆற்றல் சமன்பாடு",
        description: "ஆற்றல் நிறை மற்றும் ஒளியின் வேகத்தின் வர்க்கத்தின் பெருக்கற்பலனுக்கு சமம்."
      },
      "Gravitational Potential Energy": {
        name: "ஈர்ப்பு நிலை ஆற்றல்",
        description: "நிலை ஆற்றல் நிறை, ஈர்ப்பு மற்றும் உயரத்தைச் சார்ந்தது."
      },
      "Kinetic Energy": {
        name: "இயக்க ஆற்றல்",
        description: "இயங்கும் பொருளின் ஆற்றல்."
      },
      "Density Formula": {
        name: "அடர்த்தி சூத்திரம்",
        description: "அடர்த்தி என்பது நிறை வகுத்தல் கனஅளவு ஆகும்."
      },
      "Ideal Gas Law": {
        name: "நல்லியல்பு வாயு விதி",
        description: "அழுத்தம், கனஅளவு, மோல்கள், வாயு மாறிலி மற்றும் வெப்பநிலையைத் தொடர்புபடுத்துகிறது."
      },
      "Molarity": {
        name: "மொலாரிட்டி",
        description: "கரைபொருளின் மோல்கள் வகுத்தல் கரைசலின் லிட்டர் அளவு."
      },
      "pH Formula": {
        name: "pH சூத்திரம்",
        description: "ஒரு கரைசலின் அமிலத்தன்மை அல்லது காரத்தன்மையைக் கணக்கிடுகிறது."
      },
      "Pythagorean Theorem": {
        name: "பித்தகோரஸ் தேற்றம்",
        description: "ஒரு செங்கோண முக்கோணத்தில், கர்ணத்தின் வர்க்கம் மற்ற இரு பக்கங்களின் வர்க்கங்களின் கூடுதலுக்குச் சமம்."
      },
      "Quadratic Formula": {
        name: "இருபடிச் சூத்திரம்",
        description: "ax² + bx + c = 0 இருபடிச் சமன்பாட்டின் மூலங்களைத் தீர்க்கிறது."
      },
      "Area of a Circle": {
        name: "வட்டத்தின் பரப்பளவு",
        description: "ஆரம் r கொண்ட வட்டத்தின் பரப்பளவைக் கணக்கிடுகிறது."
      },
      "Volume of a Sphere": {
        name: "கோளத்தின் கனஅளவு",
        description: "ஆரம் r கொண்ட கோளத்தின் கனஅளவைக் கணக்கிடுகிறது."
      },
      "Euler's Identity": {
        name: "ஆய்லரின் சமன்பாடு",
        description: "ஐந்து கணித மாறிலிகளை இணைக்கும் மிக அழகான சமன்பாடு."
      }
    },
    te: {
      "Newton's Second Law": {
        name: "న్యూటన్ రెండవ నియమం",
        description: "బలము ద్రవ్యరాశి మరియు త్వరణం యొక్క లబ్దానికి సమానం."
      },
      "Ohm's Law": {
        name: "ఓమ్ నియమం",
        description: "వోల్టేజ్ విద్యుత్ ప్రవాహం మరియు నిరోధకత యొక్క లబ్దానికి సమానం."
      },
      "Einstein's Mass-Energy": {
        name: "ఐన్‌స్టీన్ ద్రవ్యరాశి-శక్తి సమీకరణం",
        description: "శక్తి ద్రవ్యరాశి మరియు కాంతి వేగం యొక్క వర్గం యొక్క లబ్దానికి సమానం."
      },
      "Gravitational Potential Energy": {
        name: "గురుత్వాకర్షణ శక్తి",
        description: "స్థితిజ శక్తి ద్రవ్యరాశి, గురుత్వాకర్షణ మరియు ఎత్తుపై ఆధారపడి ఉంటుంది."
      },
      "Kinetic Energy": {
        name: "గతి శక్తి",
        description: "చలనంలో ఉన్న వస్తువు యొక్క శక్తి."
      },
      "Density Formula": {
        name: "సాంద్రత ఫార్ములా",
        description: "సాంద్రత అనగా ద్రవ్యరాశి భాగాహారం ఘనపరిమాణం."
      },
      "Ideal Gas Law": {
        name: "ఆదర్శ వాయు నియమం",
        description: "పీడనం, ఘనపరిమాణం, మోల్స్, వాయు స్థిరాంకం మరియు ఉష్ణోగ్రతను సంబంధిస్తుంది."
      },
      "Molarity": {
        name: "మొలారిటీ",
        description: "ద్రావితం యొక్క మోల్స్ భాగాహారం ద్రావణం యొక్క లీటర్ల పరిమాణం."
      },
      "pH Formula": {
        name: "pH ఫార్ములా",
        description: "ద్రావణం యొక్క ఆమ్లత్వం లేదా క్షారత్వాన్ని లెక్కిస్తుంది."
      },
      "Pythagorean Theorem": {
        name: "పైథాగరస్ సిద్ధాంతం",
        description: "లంబకోణ త్రిభుజంలో, కర్ణం యొక్క వర్గం ఇతర రెండు భుజాల వర్గాల మొత్తానికి సమానం."
      },
      "Quadratic Formula": {
        name: "వర్గ సమీకరణ సూత్రం",
        description: "ax² + bx + c = 0 వర్గ సమీకరణం యొక్క మూలాలను సాధిస్తుంది."
      },
      "Area of a Circle": {
        name: "వృత్త వైశాల్యం",
        description: "వ్యాసార్థం r కలిగిన వృత్తం యొక్క వైశాల్యాన్ని లెక్కిస్తుంది."
      },
      "Volume of a Sphere": {
        name: "గోళం ఘనపరిమాణం",
        description: "వ్యాసార్థం r కలిగిన గోళం యొక్క ఘనపరిమాణాన్ని లెక్కిస్తుంది."
      },
      "Euler's Identity": {
        name: "ఆయిలర్ గుర్తింపు",
        description: "ఆయిలర్ గుర్తింపు ఐదు గణిత స్థిరాంకాలను అనుసంధానించే అత్యంత అందమైన సమీకరణం."
      }
    }
  };

  const entry = translations[lang]?.[f.name];
  if (entry) {
    return entry;
  }
  return { name: f.name, description: f.description };
}

function getScienceExplanations(lang: string, { mass, accel, force, current, resistance, voltage, milligrams, energyMWh }: any) {
  const defaultNewton = {
    title: "Newton's Second Law of Motion",
    formula: 'F = m × a',
    variables: 'F = Force (Newtons), m = Mass (kilograms), a = Acceleration (m/s²)',
    explanation: 'This law states that the force applied to an object is equal to its mass multiplied by its acceleration. Simply put, pushing a heavier object faster requires much more physical force!',
    intuition: `Current calculation: Pushing a ${mass} kg wagon at an acceleration of ${accel} m/s² requires ${force.toFixed(1)} Newtons of force. In practical terms, this is about the force needed to pump water or lift deep buckets from a well!`,
    speechText: `Newton's Second Law of Motion. The formula is: Force equals Mass times Acceleration. Here, with a mass of ${mass} kilograms and an acceleration of ${accel} meters per second squared, the total force is ${force.toFixed(1)} Newtons.`
  };
  const defaultOhms = {
    title: "Ohm's Law of Electricity",
    formula: 'V = I × R',
    variables: 'V = Voltage (Volts), I = Current (Amperes), R = Resistance (Ohms Ω)',
    explanation: "Ohm's Law states that the electric current flowing through a conductor is directly proportional to the voltage across its ends, and inversely proportional to the electrical resistance.",
    intuition: `Current calculation: If a bulb has a resistance of ${resistance} Ohms and a current of ${current} Amperes flows through it, the required Voltage is ${voltage.toFixed(1)} Volts. Standard home outlets in India supply about 220 Volts!`,
    speechText: `Ohm's Law. The formula is: Voltage equals Current times Resistance. Currently, with a current of ${current} Amperes and a resistance of ${resistance} Ohms, the calculated voltage is ${voltage.toFixed(1)} Volts.`
  };
  const defaultEinstein = {
    title: "Einstein's Mass-Energy Equivalence",
    formula: 'E = m × c²',
    variables: 'E = Energy (Joules), m = Mass (kilograms), c = Speed of light (~300,000 km/s)',
    explanation: 'This historic equation demonstrates that mass and energy are interchangeable. An incredibly tiny amount of matter can be converted into an immense, overwhelming quantity of pure energy!',
    intuition: `Current scale: Converting just ${milligrams} milligrams of salt or sugar completely into energy yields ${energyMWh.toLocaleString()} Megawatt-hours of electricity. This is enough to power an entire village primary school for over ${((energyMWh) / 10).toFixed(0)} months!`,
    speechText: `Einstein's mass energy equivalence. E equals m c squared. Converting just ${milligrams} milligrams of matter releases ${energyMWh} megawatt hours of energy, capable of powering a rural school for many months.`
  };
  const defaultChemistry = {
    title: 'Chemical Equation Balancing Lab',
    formula: 'a Reactants ➔ b Products',
    variables: 'Conservation of Mass & Atoms',
    explanation: 'During a chemical reaction, atoms are neither created nor destroyed. The total count of each element must remain exactly equal on both the reactant side and the product side.',
    intuition: 'Learn by practice! Try entering the correct integers for each reactant and product, then check if they balance perfectly.',
    speechText: 'Chemical balancing lab. Balance the reactant and product atoms.'
  };

  const data: Record<string, any> = {
    hi: {
      newton: {
        title: 'न्यूटन का गति का दूसरा नियम',
        formula: 'F = m × a',
        variables: 'F = बल (Force, न्यूटन में), m = द्रव्यमान (Mass, kg में), a = त्वरण (Acceleration, m/s² में)',
        explanation: `यह नियम बताता है कि किसी वस्तु पर लगाया गया बल उसके द्रव्यमान और त्वरण के गुणनफल के बराबर होता है। सरल शब्दों में, भारी वस्तु को तेजी से धकेलने के लिए अधिक बल की आवश्यकता होती है!`,
        intuition: `वर्तमान मान: ${mass} किलोग्राम की गाड़ी को ${accel} m/s² से धकेलने के लिए ${force.toFixed(1)} न्यूटन बल चाहिए। गाँव में कुएँ से पानी की 2 भारी बाल्टियाँ उठाने में लगभग इतना ही बल लगता है!`,
        speechText: `न्यूटन का दूसरा नियम। सूत्र है: बल बराबर द्रव्यमान गुना त्वरण। यहाँ द्रव्यमान है ${mass} किलोग्राम और त्वरण है ${accel} मीटर प्रति सेकंड वर्ग। कुल बल ${force.toFixed(1)} न्यूटन बनता है।`
      },
      ohms: {
        title: 'ओम का नियम (विद्युत धारा)',
        formula: 'V = I × R',
        variables: 'V = विभवांतर (Voltage, वोल्ट में), I = विद्युत धारा (Current, एम्पियर में), R = प्रतिरोध (Resistance, ओम Ω में)',
        explanation: `ओम का नियम बताता है कि किसी विद्युत चालक में बहने वाली धारा उसके दोनों सिरों के विभवांतर के सीधे आनुपातिक होती है और प्रतिरोध के विपरीत आनुपातिक होती है।`,
        intuition: `वर्तमान मान: यदि बल्ब का प्रतिरोध ${resistance} ओम है और इसमें ${current} एम्पियर की धारा प्रवाहित होती है, तो वोल्टेज ${voltage.toFixed(1)} वोल्ट होगा। घरेलू बिजली का सॉकेट 220 वोल्ट का होता है!`,
        speechText: `ओम का नियम। सूत्र है: वोल्टेज बराबर करंट गुना प्रतिरोध। वर्तमान में करंट ${current} एम्पियर और प्रतिरोध ${resistance} ओम है। इसका परिणाम ${voltage.toFixed(1)} वोल्ट वोल्टेज है।`
      },
      einstein: {
        title: 'आइंस्टीन का द्रव्यमान-ऊर्जा समीकरण',
        formula: 'E = m × c²',
        variables: 'E = ऊर्जा (Energy, जूल में), m = द्रव्यमान (Mass, kg में), c = प्रकाश की गति (3 × 10⁸ m/s)',
        explanation: `यह प्रसिद्ध समीकरण दिखाता है कि द्रव्यमान और ऊर्जा एक ही सिक्के के दो पहलू हैं। बहुत कम मात्रा में द्रव्यमान को भी नष्ट करके विशाल मात्रा में ऊर्जा प्राप्त की जा सकती है!`,
        intuition: `वर्तमान मान: केवल ${milligrams} मिलीग्राम पदार्थ को पूरी तरह ऊर्जा में बदलने पर ${energyMWh.toLocaleString()} मेगावाट-घंटा ऊर्जा मिलेगी। यह आपके पूरे गाँव के सरकारी स्कूल को लगातार ${((energyMWh) / 10).toFixed(0)} महीनों तक बिजली दे सकता है!`,
        speechText: `आइंस्टीन का समीकरण। ई बराबर एम सी वर्ग। केवल ${milligrams} मिलीग्राम पदार्थ को बदलने पर ${energyMWh} मेगावाट घंटा ऊर्जा मिलेगी, जो गाँव के स्कूल को कई महीनों तक रोशन रख सकती है।`
      },
      chemistry: {
        title: 'रासायनिक समीकरण संतुलन',
        formula: 'a Reactants ➔ b Products',
        variables: 'परमाणुओं का संरक्षण (Conservation of Atoms)',
        explanation: 'रासायनिक क्रिया में कोई नया परमाणु बनता या नष्ट नहीं होता। समीकरण के दोनों ओर प्रत्येक तत्व के कुल परमाणुओं की संख्या बिल्कुल समान होनी चाहिए।',
        intuition: 'अभ्यास द्वारा सीखें! गुणांकों को समायोजित करें और "जांचें" बटन दबाकर अपने उत्तर का परीक्षण करें।',
        speechText: 'रासायनिक समीकरण संतुलन लैब। अभिकारकों और उत्पादों को संतुलित करें।'
      }
    },
    gu: {
      newton: {
        title: "ન્યૂટનનો ગતિનો બીજો નિયમ",
        formula: 'F = m × a',
        variables: "F = બળ (ન્યૂટન), m = દ્રવ્યમાન (કિલોગ્રામ), a = પ્રવેગ (m/s²)",
        explanation: "આ નિયમ દર્શાવે છે કે કોઈપણ વસ્તુ પર લગાડવામાં આવેલું બળ તેના દ્રવ્યમાન અને પ્રવેગના ગુણાકાર બરાબર હોય છે. સરળ શબ્દોમાં, ભારે વસ્તુને વધુ ઝડપથી ધકેલવા માટે વધારે બળની જરૂર પડે છે!",
        intuition: `હાલની ગણતરી: ${mass} કિલોગ્રામની ગાડીને ${accel} m/s² થી ધકેલવા માટે ${force.toFixed(1)} ન્યૂટન બળ જોઈએ. ગામમાં કૂવામાંથી પાણીની ૨ ભારે ડોલ ઉપાડવામાં પણ આટલું જ બળ લાગે છે!`,
        speechText: `ન્યૂટનનો બીજો નિયમ. બળ બરાબર દ્રવ્યમાન ગુણ્યા પ્રવેગ. દ્રવ્યમાન છે ${mass} કિલોગ્રામ અને પ્રવેગ છે ${accel} મીટર પ્રતિ સેકન્ડ વર્ગ. કુલ બળ ${force.toFixed(1)} ન્યૂટન થાય છે.`
      },
      ohms: {
        title: "ઓહ્મનો નિયમ (વિદ્યુત પ્રવાહ)",
        formula: 'V = I × R',
        variables: "V = વોલ્ટેજ (વોલ્ટ), I = વિદ્યુત પ્રવાહ (એમ્પીયર), R = અવરોધ (ઓહ્મ Ω)",
        explanation: "ઓહ્મનો નિયમ દર્શાવે છે કે વાહકમાંથી વહેતો વિદ્યુત પ્રવાહ તેના બે છેડા વચ્ચેના વોલ્ટેજના સમપ્રમાણમાં અને અવરોધના વ્યસ્ત પ્રમાણમાં હોય છે.",
        intuition: `હાલની ગણતરી: જો બલ્બનો અવરોધ ${resistance} ઓહ્મ હોય અને તેમાં ${current} એમ્પીયર પ્રવાહ વહેતો હોય, તો વોલ્ટેજ ${voltage.toFixed(1)} વોલ્ટ થશે. ભારતમાં ઘરેલુ સોકેટ ૨૨૦ વોલ્ટના હોય છે!`,
        speechText: `ઓહ્મનો નિયમ. વોલ્ટેજ બરાબર વિદ્યુત પ્રવાહ ગુણ્યા અવરોધ. પ્રવાહ છે ${current} એમ્પીયર અને અવરોધ છે ${resistance} ઓહ્મ. વોલ્ટેજ ${voltage.toFixed(1)} વોલ્ટ થાય છે.`
      },
      einstein: {
        title: "આઇન્સ્ટાઇનનું દ્રવ્યમાન-ઊર્જા સમીકરણ",
        formula: 'E = m × c²',
        variables: "E = ઊર્જા (જૂલ), m = દ્રવ્યમાન (કિલોગ્રામ), c = પ્રકાશની ગતિ (~૩,૦૦,૦૦૦ કિમી/સેકન્ડ)",
        explanation: "આ પ્રખ્યાત સમીકરણ દર્શાવે છે કે દ્રવ્યમાન અને ઊર્જા એક જ સિક્કાની બે બાજુ છે. અતિ અલ્પ દ્રવ્યમાનનો નાશ કરીને પણ વિશાળ માત્રામાં ઊર્જા મેળવી શકાય છે!",
        intuition: `હાલની ગણતરી: માત્ર ${milligrams} મિલીગ્રામ પદાર્થને સંપૂર્ણ ઊર્જામાં રૂપાંતરિત કરવાથી ${energyMWh.toLocaleString()} મેગાવોટ-કલાક ઊર્જા મળશે. આ તમારા આખા ગામની પ્રાથમિક શાળાને સતત ${((energyMWh) / 10).toFixed(0)} મહિના સુધી વીજળી પૂરી પાડી શકે છે!`,
        speechText: `આઇન્સ્ટાઇનનું સમીકરણ. ઈ બરાબર એમ સી વર્ગ. માત્ર ${milligrams} મિલીગ્રામ પદાર્થને રૂપાંતરિત કરવાથી ${energyMWh} મેગાવોટ કલાક ઊર્જા મળશે.`
      },
      chemistry: {
        title: "રાસાયણિક સમીકરણ સંતુલન પ્રયોગશાળા",
        formula: 'a Reactants ➔ b Products',
        variables: "પરમાણુઓનું સંરક્ષણ (દ્રવ્યમાન સંરક્ષણનો નિયમ)",
        explanation: "રાસાયણિક પ્રક્રિયા દરમિયાન કોઈપણ પરમાણુ નવો ઉત્પન્ન થતો નથી કે તેનો નાશ થતો નથી. સમીકરણની બંને બાજુએ દરેક તત્વના પરમાણુઓની કુલ સંખ્યા બરાબર હોવી જોઈએ.",
        intuition: "પ્રયોગ દ્વારા શીખો! પ્રક્રિયકો અને નીપજોના ગુણાંક બદલો અને 'સમીકરણ ચકાસો' બટન દબાવો.",
        speechText: "રાસાયણિક સમીકરણ સંતુલન પ્રયોગશાળા. પ્રક્રિયકો અને નીપજોને સંતુલિત કરો."
      }
    },
    mr: {
      newton: {
        title: "न्यूटनचा गतीचा दुसरा नियम",
        formula: 'F = m × a',
        variables: "F = बल (न्यूटन), m = वस्तुमान (किलोग्रॅम), a = त्वरण (m/s²)",
        explanation: "हा नियम सांगतो की एखाद्या वस्तूवर लावलेले बल हे तिच्या वस्तुमान आणि त्वरणाच्या गुणाकाराच्या बरोबर असते. सोप्या भाषेत सांगायचे तर, जड वस्तूला वेगाने ढकलण्यासाठी जास्त बल लागते!",
        intuition: `सध्याची गणना: ${mass} किलोग्रॅमची गाडी ${accel} m/s² त्वरणाने ढकलण्यासाठी ${force.toFixed(1)} न्यूटन बल आवश्यक आहे. विहिरीतून पाण्याच्या २ बादल्या ओढण्यासाठी साधारण इतकेच बल लागते!`,
        speechText: `न्यूटनचा दुसरा नियम. बल बरोबर वस्तुमान गुणिले त्वरण. वस्तुमान ${mass} किलोग्रॅम आणि त्वरण ${accel} मीटर प्रति सेकंद वर्ग आहे. एकूण बल ${force.toFixed(1)} न्यूटन आहे.`
      },
      ohms: {
        title: "ओहमचा नियम (विद्युत धारा)",
        formula: 'V = I × R',
        variables: "V = व्होल्टेज (व्होल्ट), I = विद्युत धारा (अँपिअर), R = रोध (ओहम Ω)",
        explanation: "ओहमचा नियम सांगतो की एखाद्या वाहकामधून वाहणारी विद्युत धारा ही त्याच्या दोन टोकांमधील विभवांतराच्या थेट प्रमाणात आणि रोधाच्या व्यस्त प्रमाणात असते.",
        intuition: `सध्याची गणना: जर बल्बचा रोध ${resistance} ओहम असेल आणि त्यातून ${current} अँपिअर विद्युत धारा वाहत असेल, तर व्होल्टेज ${voltage.toFixed(1)} व्होल्ट असेल. घरगुती वीज सॉकेट २२० व्होल्टचे असते!`,
        speechText: `ओहमचा नियम. व्होल्टेज बरोबर विद्युत धारा गुणिले रोध. विद्युत धारा ${current} अँपिअर आणि रोध ${resistance} ओहम आहे. याचे उत्तर ${voltage.toFixed(1)} व्होल्ट आहे.`
      },
      einstein: {
        title: "आईन्स्टाईनचे द्रव्यमान-ऊर्जा समीकरण",
        formula: 'E = m × c²',
        variables: "E = ऊर्जा (ज्यूल), m = वस्तुमान (किलोग्रॅम), c = प्रकाश वेग (~३,००,००० किमी/सेकंद)",
        explanation: "हे प्रसिद्ध समीकरण दर्शवते की वस्तुमान आणि ऊर्जा हे एकाच नाण्याच्या दोन बाजू आहेत. अगदी कमी वस्तुमान नष्ट करूनही प्रचंड ऊर्जा मिळवता येते!",
        intuition: `सध्याची गणना: फक्त ${milligrams} मिग्रॅ पदार्थाचे पूर्ण ऊर्जेत रूपांतर केल्यास ${energyMWh.toLocaleString()} मेगावॅट-तास ऊर्जा मिळेल. ही ऊर्जा संपूर्ण गावातील शाळेला ${((energyMWh) / 10).toFixed(0)} महिन्यांसाठी पुरेशी आहे!`,
        speechText: `आईन्स्टाईनचे समीकरण. ई बरोबर एम सी वर्ग. फक्त ${milligrams} मिग्रॅ पदार्थाचे रूपांतर केल्यास ${energyMWh} मेगावॅट तास ऊर्जा मिळेल.`
      },
      chemistry: {
        title: "रासायनिक समीकरण संतुलन प्रयोगशाळा",
        formula: 'a Reactants ➔ b Products',
        variables: "परमाणूंचे संवर्धन (वस्तुमान संवर्धनाचा नियम)",
        explanation: "रासायनिक अभिक्रियेदरम्यान कोणतेही परमाणू नवीन तयार होत नाहीत किंवा नष्ट होत नाहीत. समीकरणाच्या दोन्ही बाजूला प्रत्येक मूलद्रव्याच्या एकूण परमाणूंची संख्या समान असली पाहिजे.",
        intuition: "सराव करून शिका! सहगुणक बदला आणि 'समीकरण तपासा' बटन दाबून आपले उत्तर तपासा.",
        speechText: "रासायनिक समीकरण संतुलन प्रयोगशाळा. अभिकारक आणि उत्पादने संतुलित करा."
      }
    },
    ta: {
      newton: {
        title: "நியூட்டனின் இரண்டாம் இயக்க விதி",
        formula: 'F = m × a',
        variables: "F = விசை (நியூட்டன்), m = நிறை (கிலோகிராம்), a = முடுக்கம் (m/s²)",
        explanation: "ஒரு பொருளின் மீது செயல்படும் விசையானது அப்பொருளின் நிறை மற்றும் முடுக்கத்தின் பெருக்கற்பலனுக்குச் சமம் என்று இந்த விதி கூறுகிறது. எளிமையாகச் சொன்னால், கனமான பொருளை வேகமாகத் தள்ள அதிக விசை தேவைப்படும்!",
        intuition: `தற்போதைய கணக்கீடு: ${mass} கிலோகிராம் வண்டியை ${accel} m/s² முடுக்கத்தில் தள்ள ${force.toFixed(1)} நியூட்டன் விசை தேவைப்படுகிறது. இது கிணற்றிலிருந்து தண்ணீர் வாலியை மேலே தூக்குவதற்குத் தேவையான விசைக்கு ஒப்பானது!`,
        speechText: `நியூட்டனின் இரண்டாம் விதி. விசை என்பது நிறை மற்றும் முடுக்கத்தின் பெருக்கல் ஆகும். நிறை ${mass} கிலோகிராம், முடுக்கம் ${accel} m/s², மொத்த விசை ${force.toFixed(1)} நியூட்டன் ஆகும்.`
      },
      ohms: {
        title: "ஓம் விதி (மின்னோட்டம்)",
        formula: 'V = I × R',
        variables: "V = மின்னழுத்தம் (வோல்ட்), I = மின்னோட்டம் (ஆம்பியர்), R = மின்தடை (ஓம் Ω)",
        explanation: "ஒரு கடத்தியின் வழியே பாயும் மின்னோட்டம் அதன் இரு முனைகளுக்கிடையே உள்ள மின்னழுத்த வேறுபாட்டிற்கு நேர்த்தகவிலும், மின்தடைக்கு எதிர்த்தகவிலும் இருக்கும் என்று ஓம் விதி கூறுகிறது.",
        intuition: `தற்போதைய கணக்கீடு: விளக்கின் மின்தடை ${resistance} ஓம் மற்றும் மின்னோட்டம் ${current} ஆம்பியராக இருந்தால், தேவையான மின்னழுத்தம் ${voltage.toFixed(1)} வோல்ட் ஆகும். வீடுகளில் பயன்படுத்தப்படும் மின்சாரம் சுமார் 220 வோல்ட் ஆகும்!`,
        speechText: `ஓம் விதி. மின்னழுத்தம் என்பது மின்னோட்டம் மற்றும் மின்தடையின் பெருக்கல் ஆகும். தற்போதைய மின்னோட்டம் ${current} ஆம்பியர், மின்தடை ${resistance} ஓம், மின்னழுத்தம் ${voltage.toFixed(1)} வோல்ட் ஆகும்.`
      },
      einstein: {
        title: "ஐன்ஸ்டீனின் நிறை-ஆற்றல் சமன்பாடு",
        formula: 'E = m × c²',
        variables: "E = ஆற்றல் (ஜூல்), m = நிறை (கிலோகிராம்), c = ஒளியின் வேகம் (~300,000 கிமீ/விநாடி)",
        explanation: "இந்த புகழ்பெற்ற சமன்பாடு நிறையும் ஆற்றலும் ஒன்றோடொன்று மாற்றப்படக்கூடியவை என்பதைக் காட்டுகிறது. மிகக் குறைந்த அளவு நிறையைக் கூட ஆற்றலாக மாற்றும்போது பிரம்மாண்டமான ஆற்றலைப் பெற முடியும்!",
        intuition: `தற்போதைய கணக்கீடு: வெறும் ${milligrams} மில்லிகிராம் பொருளை முழுமையாக ஆற்றலாக மாற்றினால் ${energyMWh.toLocaleString()} மெகாவாட்-மணிநேர மின்சாரம் கிடைக்கும். இது உங்கள் கிராமத்தின் தொடக்கப் பள்ளிக்கு தொடர்ந்து ${((energyMWh) / 10).toFixed(0)} மாதங்கள் மின்சாரம் வழங்க போதுமானது!`,
        speechText: `ஐன்ஸ்டீனின் சமன்பாடு. ஈ என்பது எம் சி ஸ்கொயர். வெறும் ${milligrams} மில்லிகிராம் பொருள் ${energyMWh} மெகாவாட் மணிநேர ஆற்றலை வெளியிடுகிறது.`
      },
      chemistry: {
        title: "வேதியியல் சமன்பாடு சமன்படுத்தும் ஆய்வகம்",
        formula: 'a Reactants ➔ b Products',
        variables: "பொருண்மை அழியா விதி மற்றும் அணுக்களின் பாதுகாப்பு",
        explanation: "ஒரு வேதிவினையின் போது, அணுக்கள் உருவாக்கப்படுவதோ அல்லது அழிக்கப்படுவதோ இல்லை. வினைபடு பொருட்கள் மற்றும் வினைவிளை பொருட்கள் ஆகிய இருபுறமும் உள்ள அணுக்களின் எண்ணிக்கை சமமாக இருக்க வேண்டும்.",
        intuition: "பயிற்சி மூலம் கற்றுக்கொள்ளுங்கள்! எண்களை மாற்றி அமைத்து, 'சமன்பாட்டைச் சரிபார்' பொத்தானை அழுத்திப் பார்க்கவும்.",
        speechText: "வேதியியல் சமன்பாடு சமன்படுத்தும் ஆய்வகம். வினைபடு மற்றும் வினைவிளை பொருட்களைச் சமன்படுத்தவும்."
      }
    },
    te: {
      newton: {
        title: "న్యూటన్ రెండవ గమన నియమం",
        formula: 'F = m × a',
        variables: "F = బలము (న్యూటన్లు), m = ద్రవ్యరాశి (కిలోగ్రాములు), a = త్వరణం (m/s²)",
        explanation: "ఈ నియమం ప్రకారం ఏదైనా వస్తువుపై ప్రయోగించిన బలం, దాని ద్రవ్యరాశి మరియు త్వరణం యొక్క లబ్దానికి సమానంగా ఉంటుంది. సరళంగా చెప్పాలంటే, బరువైన వస్తువును వేగంగా నెట్టడానికి ఎక్కువ బలం కావాలి!",
        intuition: `ప్రస్తుత లెక్కింపు: ${mass} కిలోగ్రాముల బండిని ${accel} m/s² త్వరణంతో నెట్టడానికి ${force.toFixed(1)} న్యూటన్ల బలం అవసరం. బావి నుండి నీటి బకెట్లను పైకి లాగడానికి దాదాపు ఇంతే బలం అవసరమవుతుంది!`,
        speechText: `న్యూటన్ రెండవ నియమం. బలము ద్రవ్యరాశి మరియు త్వరణం యొక్క లబ్దం. ద్రవ్యరాశి ${mass} కిలోగ్రాములు, త్వరణం ${accel} m/s², మొత్తం బలము ${force.toFixed(1)} న్యూటన్లు.`
      },
      ohms: {
        title: "ఓమ్ నియమం (విద్యుత్ ప్రవాహం)",
        formula: 'V = I × R',
        variables: "V = వోల్టేజ్ (వోల్ట్), I = విద్యుత్ ప్రవాహం (ఆంపియర్లు), R = నిరోధం (ఓమ్ Ω)",
        explanation: "స్థిర ఉష్ణోగ్రత వద్ద వాహకం గుండా ప్రవహించే విద్యుత్ ప్రవాహం దాని చివరల మధ్య ఉన్న వోల్టేజ్ భేదానికి నేరుగా అనుపాతంలో ఉంటుంది మరియు నిరోధానికి విలోమానుపాతంలో ఉంటుంది.",
        intuition: `ప్రస్తుత లెక్కింపు: ఒక బల్బ్ యొక్క నిరోధం ${resistance} ఓమ్ మరియు విద్యుత్ ప్రవాహం ${current} ఆంపియర్లు అయితే, కావలసిన వోల్టేజ్ ${voltage.toFixed(1)} వోల్టులు అవుతుంది. మన ఇళ్లలో వాడే వోల్టేజ్ దాదాపు 220 వోల్టులు ఉంటుంది!`,
        speechText: `ఓమ్ నియమం. వోల్టేజ్ విద్యుత్ ప్రవాహం మరియు నిరోధం యొక్క లబ్దం. కరెంట్ ${current} ఆంపియర్లు, నిరోధం ${resistance} ఓమ్స్, వోల్టేజ్ ${voltage.toFixed(1)} వోల్టులు.`
      },
      einstein: {
        title: "ఐన్‌స్టీన్ ద్రవ్యరాశి-శక్తి సమీకరణం",
        formula: 'E = m × c²',
        variables: "E = శక్తి (జౌల్స్), m = ద్రవ్యరాశి (కిలోగ్రాములు), c = కాంతి వేగం (~3,00,000 కిమీ/సెకను)",
        explanation: "ద్రవ్యరాశి మరియు శక్తి పరస్పరం మార్చుకోగలవని ఈ ప్రసిద్ధ సమీకరణం నిరూపిస్తుంది. అత్యంత స్వల్ప పరిమాణంలో ఉన్న పదార్థాన్ని కూడా అపారమైన శక్తిగా మార్చవచ్చు!",
        intuition: `ప్రస్తుత లెక్కింపు: కేవలం ${milligrams} మిల్లీగ్రాముల పదార్థాన్ని పూర్తిగా శక్తిగా మార్చడం వల్ల ${energyMWh.toLocaleString()} మెగావాట్-అవర్ల శక్తి లభిస్తుంది. ఇది మీ ఊరి ప్రాథమిక పాఠశాలకు నిరంతరం ${((energyMWh) / 10).toFixed(0)} నెలల పాటు విద్యుత్ అందించడానికి సరిపోతుంది!`,
        speechText: `ఐన్‌స్టీన్ సమీకరణం. ఈ ఈక్వల్స్ ఎమ్ సి స్క్వేర్. కేవలం ${milligrams} మిల్లీగ్రాముల పదార్థాన్ని మార్చడం వల్ల ${energyMWh} మెగావాట్ అవర్ల శక్తి లభిస్తుంది.`
      },
      chemistry: {
        title: "రసాయన సమీకరణ సమతుల్యత ల్యాబ్",
        formula: 'a Reactants ➔ b Products',
        variables: "ద్రవ్య నిత్యత్వ నియమం మరియు పరమాణువుల సంరక్షణ",
        explanation: "ఒక రసాయన చర్యలో పరమాణువులు సృష్టించబడవు లేదా నాశనం చేయబడవు. సమీకరణానికి ఇరువైపులా ఉన్న ప్రతి మూలకం యొక్క పరమాణువుల సంఖ్య సమానంగా ఉండాలి.",
        intuition: "సాధన ద్వారా నేర్చుకోండి! గుణకాలను మార్చి, 'సమీకరణాన్ని సరిచూడు' బటన్‌ను నొక్కి మీ సమాధానాన్ని పరీక్షించుకోండి.",
        speechText: "రసాయన సమీకరణ సమతుల్యత ల్యాబ్. రియాక్టెంట్లు మరియు ప్రొడక్ట్ పరమాణువులను సమతుల్యం చేయండి."
      }
    }
  };

  const selectedSet = data[lang] || {};
  return {
    newton: selectedSet.newton || defaultNewton,
    ohms: selectedSet.ohms || defaultOhms,
    einstein: selectedSet.einstein || defaultEinstein,
    chemistry: selectedSet.chemistry || defaultChemistry
  };
}

function getMathExplanations(lang: string, { sideA, sideB, hypotenuse, distance, elevationAngle, computedHeight, lineOfSight, coeffA, coeffB, coeffC, discriminant, rootsInfo, angleRad }: any) {
  const defaultPythagoras = {
    title: "Pythagoras Theorem of Geometry",
    formula: 'a² + b² = c²',
    variables: 'a = Base, b = Height, c = Hypotenuse (diagonal)',
    explanation: `In a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. Masons in India use this as the 3-4-5 'Guniya' rule to establish perfect brick corners!`,
    intuition: `Current calculation: Base = ${sideA} cm, Height = ${sideB} cm. The diagonal hypotenuse length is ${hypotenuse.toFixed(2)} cm! (Because ${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
    speechText: `Pythagoras theorem. For right triangles, a squared plus b squared equals c squared.`
  };
  const defaultTrigonometry = {
    title: "Trigonometry: Heights & Distances",
    formula: 'h = d × tan(θ)',
    variables: 'h = Height, d = Horizontal Distance, θ = Angle of elevation (degrees)',
    explanation: `Using trigonometry, we can discover the precise height of tall structures (like mobile towers, trees, or local temples) purely by standing on the ground and measuring distance and angle!`,
    intuition: `Current calculation: Standing ${distance} meters away with an elevation angle of ${elevationAngle}°, the projected height of the tower is ${computedHeight.toFixed(1)} meters! (The total line-of-sight distance is ${lineOfSight.toFixed(1)} meters)`,
    speechText: `Trigonometry heights and distances. The formula is Height equals Distance times tangent of theta. The projected height is ${computedHeight.toFixed(1)} meters.`
  };
  const defaultQuadratic = {
    title: "Quadratic Equations Lab",
    formula: 'ax² + bx + c = 0',
    variables: 'a, b, c = Coefficients, D = Discriminant',
    explanation: `A quadratic equation is a core algebraic equation. Its graph is a 'Parabola' (U-shape curve). The physical path of a thrown cricket ball or water fountain jets trace this exact geometric shape!`,
    intuition: `Current Equation: ${coeffA}x² ${coeffB >= 0 ? `+ ${coeffB}` : `${coeffB}`}x ${coeffC >= 0 ? `+ ${coeffC}` : `${coeffC}`} = 0. Discriminant D = ${discriminant}. Roots: ${rootsInfo.nature}. Root 1 = ${rootsInfo.r1}, Root 2 = ${rootsInfo.r2}`,
    speechText: `Quadratic equation lab. The discriminant is ${discriminant}. The nature of roots is ${rootsInfo.nature}.`
  };

  const data: Record<string, any> = {
    hi: {
      pythagoras: {
        title: 'पाइथागोरस प्रमेय (ज्यामिति)',
        formula: 'a² + b² = c²',
        variables: 'a = आधार (Base side), b = लंब (Height side), c = कर्ण (Hypotenuse)',
        explanation: `समकोण त्रिभुज में, कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है। भारत में राजमिस्त्री सही समकोण कोना जांचने के लिए ३-४-५ की रस्सी मापते हैं, जिसे 'गुनिया' कहा जाता है!`,
        intuition: `वर्तमान मान: आधार = ${sideA} cm, लंब = ${sideB} cm। कर्ण (c) की लंबाई ${hypotenuse.toFixed(2)} cm होगी। (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
        speechText: `पाइथागोरस प्रमेय। समकोण त्रिभुज के लिए सूत्र है ए वर्ग जमा बी वर्ग बराबर सी वर्ग।`
      },
      trigonometry: {
        title: 'त्रिकोणमिति: ऊँचाई और दूरी',
        formula: 'h = d × tan(θ)',
        variables: 'h = ऊँचाई (Height), d = दूरी (Distance), θ = उन्नयन कोण (Angle of Elevation)',
        explanation: `त्रिकोणमिति के सिद्धांतों का उपयोग करके हम बहुत ऊँचे मोबाइल टावर, नारियल के पेड़ या मंदिर के शिखर की ऊँचाई बिना ऊपर चढ़े निकाल सकते हैं! बस जमीन की दूरी और देखने का कोण चाहिए।`,
        intuition: `वर्तमान मान: यदि आप टावर से ${distance} मीटर दूर हैं और उन्नयन कोण ${elevationAngle}° है, तो टावर की ऊँचाई ${computedHeight.toFixed(1)} मीटर है! (दृष्टि रेखा की कुल दूरी ${lineOfSight.toFixed(1)} मीटर है)`,
        speechText: `त्रिकोणमिति ऊँचाई और दूरी। सूत्र है: ऊँचाई बराबर दूरी गुना टेन थीटा। यहाँ ऊँचाई ${computedHeight.toFixed(1)} मीटर है।`
      },
      quadratic: {
        title: 'द्विघात समीकरण प्रयोगशाला',
        formula: 'ax² + bx + c = 0',
        variables: 'a, b, c = गुणांक (Coefficients), D = b² - 4ac (विविक्तकर / Discriminant)',
        explanation: `यह एक अत्यंत महत्वपूर्ण बीजीय सूत्र है। इसका ग्राफ़ एक 'परवलय' (Parabola) यानी यू-शेप बनाता है। हवा में फेंकी गई क्रिकेट गेंद का रास्ता बिल्कुल इसी वक्र पर चलता है!`,
        intuition: `वर्तमान मान: समीकरण ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. विविक्तकर D = ${discriminant}। मूल प्रकार: ${rootsInfo.nature}। मूल १ = ${rootsInfo.r1}, मूल २ = ${rootsInfo.r2}`,
        speechText: `द्विघात समीकरण लैब। वर्तमान समीकरण का विविक्तकर ${discriminant} है। मूलों का प्रकार है ${rootsInfo.nature}।`
      }
    },
    gu: {
      pythagoras: {
        title: "પાયથાગોરસ પ્રમેય (ભૂમિતિ)",
        formula: 'a² + b² = c²',
        variables: "a = આધાર, b = લંબ, c = કર્ણ",
        explanation: "કાટકોણ ત્રિકોણમાં કર્ણનો વર્ગ અન્ય બે બાજુઓના વર્ગોના સરવાળા સમાન હોય છે. ભારતીય કડીયાઓ ખૂણાની ચોકસાઈ તપાસવા માટે ૩-૪-૫ ની માપણી પદ્ધતિ વાપરે છે, જેને 'ગુનિયા' કહેવાય છે!",
        intuition: `હાલની ગણતરી: આધાર = ${sideA} સેમી, લંબ = ${sideB} સેમી. કર્ણ (c) ની લંબાઈ ${hypotenuse.toFixed(2)} સેમી થશે. (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
        speechText: "પાયથાગોરસ પ્રમેય. સમકોણ ત્રિકોણ માટેનું સૂત્ર એ વર્ગ વત્તા બી વર્ગ બરાબર સી વર્ગ છે."
      },
      trigonometry: {
        title: "ત્રિકોણમિતિ: ઊંચાઈ અને અંતર",
        formula: 'h = d × tan(θ)',
        variables: "h = ઊંચાઈ, d = અંતર, θ = ઉન્નયન કોણ",
        explanation: "ત્રિકોણમિતિના નિયમોનો ઉપયોગ કરીને આપણે ઊંચા ટાવર, નાળિયેરીના ઝાડ કે મંદિરના શિખરની ઊંચાઈ તેના પર ચઢ્યા વિના જ શોધી શકીએ છીએ! માત્ર જમીનથી અંતર અને ખૂણો માપવો પડે છે.",
        intuition: `હાલની ગણતરી: જો તમે ટાવરથી ${distance} મીટર દૂર ઊભા છો અને ખૂણો ${elevationAngle}° છે, તો ટાવરની ઊંચાઈ ${computedHeight.toFixed(1)} મીટર છે! (દ્રષ્ટિ રેખાની લંબાઈ ${lineOfSight.toFixed(1)} મીટર છે)`,
        speechText: "ત્રિકોણમિતિ ઊંચાઈ અને અંતર. ઊંચાઈ બરાબર અંતર ગુણ્યા ટેન થીટા."
      },
      quadratic: {
        title: "દ્વિઘાત સમીકરણ પ્રયોગશાળા",
        formula: 'ax² + bx + c = 0',
        variables: "a, b, c = સહગુણકો, D = વિવેચક",
        explanation: "આ એક અત્યંત મહત્વનું બીજગણિતીય સૂત્ર છે. તેનો આલેખ એક પેરાબોલા (પરવલય - U આકાર) બનાવે છે. હવામાં ફેંકવામાં આવેલી ક્રિકેટ બોલનો માર્ગ બરાબર આ જ આકાર પર ચાલે છે!",
        intuition: `હાલની ગણતરી: સમીકરણ ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. વિવેચક D = ${discriminant}. ઉકેલનો પ્રકાર: ${rootsInfo.nature}. ઉકેલ ૧ = ${rootsInfo.r1}, ઉકેલ ૨ = ${rootsInfo.r2}`,
        speechText: `દ્વિઘાત સમીકરણ લેબ. વિવેચક છે ${discriminant}.`
      }
    },
    mr: {
      pythagoras: {
        title: "पायथागोरसचा सिद्धांत (भूमिती)",
        formula: 'a² + b² = c²',
        variables: "a = पाया, b = उंची (लंब), c = कर्ण",
        explanation: "काटकोन त्रिकोणात कर्णाचा वर्ग हा इतर दोन बाजूंच्या वर्गांच्या बेरजेइतका असतो. भारतात गवंडी काम करताना अचूक कोन तपासण्यासाठी ३-४-५ ची फूटपट्टी मोजतात, ज्याला 'गुनिया' म्हटले जाते!",
        intuition: `सध्याची गणना: पाया = ${sideA} सेमी, उंची = ${sideB} सेमी. कर्ण (c) ची लांबी ${hypotenuse.toFixed(2)} सेमी असेल. (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
        speechText: "पायथागोरसचा सिद्धांत. काटकोन त्रिकोणाचे सूत्र ए वर्ग अधिक बी वर्ग बरोबर सी वर्ग आहे."
      },
      trigonometry: {
        title: "त्रिकोणमिती: उंची आणि अंतर",
        formula: 'h = d × tan(θ)',
        variables: "h = उंची, d = अंतर, θ = उन्नत कोन",
        explanation: "त्रिकोणमितीचा वापर करून आपण उंच मोबाईल टॉवर, नारळाचे झाड किंवा मंदिराचे शिखर यांची उंची त्यावर न चढता मोजू शकतो! फक्त जमिनीचे अंतर आणि पाहण्याचा कोन आवश्यक आहे.",
        intuition: `सध्याची गणना: जर आपण टॉवरपासून ${distance} मीटर दूर असू आणि पाहण्याचा कोन ${elevationAngle}° असेल, तर टॉवरची उंची ${computedHeight.toFixed(1)} मीटर आहे! (एकूण दृष्टीरेषेचे अंतर ${lineOfSight.toFixed(1)} मीटर आहे)`,
        speechText: "त्रिकोणमिती उंची आणि अंतर. सूत्रानुसार उंची बरोबर अंतर गुणिले टॅन थिटा."
      },
      quadratic: {
        title: "द्विघात समीकरण प्रयोगशाळा",
        formula: 'ax² + bx + c = 0',
        variables: "a, b, c = सहगुणक, D = विविक्तकर",
        explanation: "हे एक अत्यंत महत्त्वाचे बीजगणितीय सूत्र आहे. त्याचा आलेख 'परवलय' (Parabola - U आकार) बनवतो. हवेत फेकलेल्या क्रिकेट बॉलचा मार्ग याच आकाराचा असतो!",
        intuition: `सध्याची गणना: समीकरण ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. विविक्तकर D = ${discriminant}. मुळांचे स्वरूप: ${rootsInfo.nature}. मूळ १ = ${rootsInfo.r1}, मूळ २ = ${rootsInfo.r2}`,
        speechText: "द्विघात समीकरण प्रयोगशाळा. विविक्तकर " + discriminant + " आहे."
      }
    },
    ta: {
      pythagoras: {
        title: "பித்தகோரஸ் தேற்றம் (வடிவியல்)",
        formula: 'a² + b² = c²',
        variables: "a = அடிபக்கம், b = உயரம், c = கர்ணம்",
        explanation: "ஒரு செங்கோண முக்கோணத்தில் கர்ணத்தின் வர்க்கம் மற்ற இரு பக்கங்களின் வர்க்கங்களின் கூடுதலுக்கு சமம். கட்டுமான வேலை செய்பவர்கள் சரியான செங்கோணத்தை சரிபார்க்க 3-4-5 அளவீட்டைப் பயன்படுத்துகின்றனர்!",
        intuition: `தற்போதைய கணக்கீடு: அடிபக்கம் = ${sideA} செமீ, உயரம் = ${sideB} செமீ. கர்ணத்தின் (c) நீளம் ${hypotenuse.toFixed(2)} செமீ ஆகும்! (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
        speechText: "பித்தகோரஸ் தேற்றம். செங்கோண முக்கோணத்திற்கான சூத்திரம் ஏ ஸ்கொயர் பிளஸ் பி ஸ்கொயர் ஈக்குவல் டூ சி ஸ்கொயர் ஆகும்."
      },
      trigonometry: {
        title: "முக்கோணவியல்: உயரங்களும் தொலைவுகளும்",
        formula: 'h = d × tan(θ)',
        variables: "h = உயரம், d = கிடைமட்டத் தூரம், θ = ஏற்றக்கோணம்",
        explanation: "முக்கோணவியலின் கோட்பாடுகளைப் பயன்படுத்தி, உயரமான அலைபேசிக் கோபுரங்கள், தென்னை மரங்கள் அல்லது உள்ளூர் கோயில்களின் உயரங்களை நாம் மேலே ஏறாமலேயே துல்லியமாகக் கணக்கிட முடியும்!",
        intuition: `தற்போதைய கணக்கீடு: கோபுரத்திலிருந்து ${distance} மீட்டர் தொலைவில் ${elevationAngle}° ஏற்றக்கோணத்தில் நின்றால், கோபுரத்தின் உயரம் ${computedHeight.toFixed(1)} மீட்டர் ஆகும்! (பார்வைக்கோட்டின் நீளம் ${lineOfSight.toFixed(1)} மீட்டர் ஆகும்)`,
        speechText: "முக்கோணவியல் உயரங்களும் தொலைவுகளும். உயரம் என்பது தூரம் மற்றும் டான் தீட்டாவின் பெருக்கல் ஆகும்."
      },
      quadratic: {
        title: "இருபடிச் சமன்பாடுகள் ஆய்வகம்",
        formula: 'ax² + bx + c = 0',
        variables: "a, b, c = கெழுக்கள், D = தன்மைகாட்டி",
        explanation: "இது ஒரு முக்கியமான இயற்கணிதச் சூத்திரம் ஆகும். இதன் வரைபடம் ஒரு பரவளையத்தை (Parabola - U வடிவம்) உருவாக்குகிறது. காற்றில் எறியப்படும் கிரிக்கெட் பந்தின் பாதை இந்த வடிவத்தையே பின்பற்றும்!",
        intuition: `தற்போதைய சமன்பாடு: ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. தன்மைகாட்டி D = ${discriminant}. மூலங்களின் தன்மை: ${rootsInfo.nature}. மூலம் 1 = ${rootsInfo.r1}, மூலம் 2 = ${rootsInfo.r2}`,
        speechText: `இருபடிச் சமன்பாடு ஆய்வகம். தன்மைகாட்டி ${discriminant} ஆகும்.`
      }
    },
    te: {
      pythagoras: {
        title: "పైథాగరస్ సిద్ధాంతం (రేఖాగణితం)",
        formula: 'a² + b² = c²',
        variables: "a = ఆధారం, b = లంబం (ఎత్తు), c = కర్ణం",
        explanation: "లంబకోణ త్రిభుజంలో, కర్ణం యొక్క వర్గం మిగిలిన రెండు భుజాల వర్గాల మొత్తానికి సమానంగా ఉంటుంది. తాపీ పని చేసేవారు ఖచ్చితమైన మూలలను నిర్ధారించడానికి 3-4-5 నియమాన్ని ఉపయోగిస్తారు!",
        intuition: `ప్రస్తుత లెక్కింపు: ఆధారం = ${sideA} సెం.మీ, లంబం = ${sideB} సెం.మీ. కర్ణం (c) పొడవు ${hypotenuse.toFixed(2)} సెం.మీ అవుతుంది! (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
        speechText: "పైథాగరస్ సిద్ధาంతం. లంబకోణ త్రిభుజానికి ఫార్ములా ఏ స్క్వేర్ ప్లస్ బి స్క్వేర్ ఈక్వల్స్ సి స్క్వేర్."
      },
      trigonometry: {
        title: "త్రికోణమితి: ఎత్తులు మరియు దూరాలు",
        formula: 'h = d × tan(θ)',
        variables: "h = ఎత్తు, d = దూరం, θ = ఉన్నత కోణం",
        explanation: "త్రికోణమితి సిద్ధాంతాలను ఉపయోగించి, మనం మొబైల్ టవర్లు, కొబ్బరి చెట్లు లేదా గుడి శిఖరం పైకి ఎక్కకుండానే వాటి ఖచ్చితమైన ఎత్తును కనుగొనవచ్చు!",
        intuition: `ప్రస్తుత లెక్కింపు: మీరు టవర్ నుండి ${distance} మీటర్ల దూరంలో ఉండి ఉన్నత కోణం ${elevationAngle}° ఉంటే, టవర్ ఎత్తు ${computedHeight.toFixed(1)} మీటర్లు! (దృష్టి రేఖ పొడవు ${lineOfSight.toFixed(1)} మీటర్లు)`,
        speechText: "త్రికోణమితి ఎత్తులు మరియు దూరాలు. ఎత్తు ఈక్వల్స్ దూరం ఇంటు టాన్ తీటా."
      },
      quadratic: {
        title: "వర్గ సమీకరణాల ల్యాబ్",
        formula: 'ax² + bx + c = 0',
        variables: "a, b, c = గుణకాలు, D = విచక్షణ",
        explanation: "ఇది ఒక ముఖ్యమైన బీజగణిత సూత్రం. దీని గ్రాఫ్ ఒక పారాబోలా (U-ఆకారం) ను ఏర్పరుస్తుంది. గాల్లోకి విసిరిన క్రికెట్ బంతి ప్రయాణించే మార్గం ఈ ఆకారాన్నే కలిగి ఉంటుంది!",
        intuition: `ప్రస్తుత సమీకరణం: ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. విచక్షణ D = ${discriminant}. మూలాల స్వభావం: ${rootsInfo.nature}. మూలం 1 = ${rootsInfo.r1}, మూలం 2 = ${rootsInfo.r2}`,
        speechText: "వర్గ సమీకరణాల ల్యాబ్. విచక్షణ విలువ " + discriminant + "."
      }
    }
  };

  const selectedSet = data[lang] || {};
  return {
    pythagoras: selectedSet.pythagoras || defaultPythagoras,
    trigonometry: selectedSet.trigonometry || defaultTrigonometry,
    quadratic: selectedSet.quadratic || defaultQuadratic
  };
}

export default function EquationsTab({ user, lang, onUpdateUser }: EquationsTabProps) {
  // Main Category state: 'science' or 'math' or 'chatbot'
  const [activeCategory, setActiveCategory] = useState<'science' | 'math' | 'chatbot'>('chatbot');
  
  // AI Chatbot States
  const [chatbotLang, setChatbotLang] = useState<string>(() => {
    return CHATBOT_TRANSLATIONS[lang] ? lang : 'en';
  });


  const translations = CHATBOT_TRANSLATIONS[chatbotLang] || CHATBOT_TRANSLATIONS.en;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const welcomeText = CHATBOT_TRANSLATIONS[lang]?.welcome || CHATBOT_TRANSLATIONS.en.welcome;
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [solverSessions, setSolverSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = user.solverSessions;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const activeSessionIdRef = React.useRef<string | null>(null);

  const setActiveSessionId = (id: string | null) => {
    activeSessionIdRef.current = id;
    setActiveSessionIdState(id);
  };

  // Helper to append/update messages AND mirror inside the active session
  const updateChatAndSession = (newMsgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatMessages(prev => {
      const updated = typeof newMsgs === 'function' ? newMsgs(prev) : newMsgs;
      const userMsgs = updated.filter(m => m.sender === 'user');
      
      if (userMsgs.length > 0) {
        const currentSessId = activeSessionIdRef.current;
        if (currentSessId) {
          setSolverSessions(prevSessions => prevSessions.map(s => s.id === currentSessId ? { ...s, messages: updated } : s));
        } else {
          const firstUserMsg = userMsgs[0].text;
          const title = firstUserMsg.length > 30 ? firstUserMsg.slice(0, 30) + '...' : firstUserMsg;
          const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const newSessId = 'sess-' + Date.now();
          
          const newSession: ChatSession = {
            id: newSessId,
            title,
            timestamp,
            messages: updated
          };
          
          setActiveSessionId(newSessId);
          setSolverSessions(prevSessions => [newSession, ...prevSessions]);
        }
      }
      return updated;
    });
  };

  // Sync chatbot language if parent language changes
  useEffect(() => {
    if (CHATBOT_TRANSLATIONS[lang]) {
      setChatbotLang(lang);
    }
  }, [lang]);

  // Dynamically translate welcome message if language is switched and chat is empty
  useEffect(() => {
    if (chatMessages.length === 1 && chatMessages[0].id.startsWith('welcome')) {
      const welcomeText = CHATBOT_TRANSLATIONS[chatbotLang]?.welcome || CHATBOT_TRANSLATIONS.en.welcome;
      setChatMessages([
        {
          ...chatMessages[0],
          text: welcomeText
        }
      ]);
    }
  }, [chatbotLang]);

  const handleNewChat = () => {
    const welcomeText = CHATBOT_TRANSLATIONS[chatbotLang]?.welcome || CHATBOT_TRANSLATIONS.en.welcome;
    const welcomeMsg: ChatMessage = {
      id: 'welcome-' + Date.now(),
      sender: 'bot',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([welcomeMsg]);
    setActiveSessionId(null);
  };

  const handleLoadSession = (session: ChatSession) => {
    setChatMessages(session.messages);
    setActiveSessionId(session.id);
    setShowHistory(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSolverSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionIdRef.current === sessionId) {
      handleNewChat();
    }
  };

  const [chatInput, setChatInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const applyFormatting = (type: 'super' | 'sub' | 'symbol', symbolValue?: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const text = chatInput;
    const selectedText = text.substring(start, end);

    let replacement = '';
    if (type === 'symbol' && symbolValue) {
      replacement = symbolValue;
    } else if (type === 'super') {
      if (selectedText) {
        replacement = toSuperscript(selectedText);
      } else {
        replacement = '²';
      }
    } else if (type === 'sub') {
      if (selectedText) {
        replacement = toSubscript(selectedText);
      } else {
        replacement = '₂';
      }
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setChatInput(newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + replacement.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<{
    data: string; // base64 representation
    mimeType: string;
    name: string;
  } | null>(null);

  const [sidebarTab, setSidebarTab] = useState<'prompts' | 'formulas'>('prompts');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const formulasCatalog = [
    {
      name: "Newton's Second Law",
      nameHi: "न्यूटन का दूसरा नियम",
      equation: "F = m * a",
      description: "Force equals mass multiplied by acceleration.",
      descriptionHi: "बल द्रव्यमान और त्वरण के गुणनफल के बराबर होता है।",
      category: "physics"
    },
    {
      name: "Ohm's Law",
      nameHi: "ओम का नियम",
      equation: "V = I * R",
      description: "Voltage equals current multiplied by resistance.",
      descriptionHi: "विद्युत विभवान्तर धारा और प्रतिरोध के गुणनफल के बराबर होता है।",
      category: "physics"
    },
    {
      name: "Einstein's Mass-Energy",
      nameHi: "आइंस्टीन का द्रव्यमान-ऊर्जा समीकरण",
      equation: "E = m * c²",
      description: "Energy equals mass multiplied by speed of light squared.",
      descriptionHi: "ऊर्जा द्रव्यमान और प्रकाश की गति के वर्ग के गुणनफल के बराबर होती है।",
      category: "physics"
    },
    {
      name: "Gravitational Potential Energy",
      nameHi: "गुरुत्वीय स्थितिज ऊर्जा",
      equation: "PE = m * g * h",
      description: "Potential energy depends on mass, gravity, and height.",
      descriptionHi: "स्थितिज ऊर्जा द्रव्यमान, गुरुत्वाकर्षण बल और ऊंचाई पर निर्भर करती है।",
      category: "physics"
    },
    {
      name: "Kinetic Energy",
      nameHi: "गतिज ऊर्जा",
      equation: "KE = 0.5 * m * v²",
      description: "Energy of an object in motion.",
      descriptionHi: "गतिमान वस्तु की ऊर्जा।",
      category: "physics"
    },
    {
      name: "Density Formula",
      nameHi: "घनत्व का सूत्र",
      equation: "ρ = m / V",
      description: "Density is mass divided by volume.",
      descriptionHi: "घनत्व द्रव्यमान को आयतन से विभाजित करने पर प्राप्त होता है।",
      category: "chemistry"
    },
    {
      name: "Ideal Gas Law",
      nameHi: "आदर्श गैस नियम",
      equation: "P * V = n * R * T",
      description: "Relates pressure, volume, moles, gas constant, and temperature.",
      descriptionHi: "दाब, आयतन, मोल, गैस नियतांक और तापमान को जोड़ता है।",
      category: "chemistry"
    },
    {
      name: "Molarity",
      nameHi: "मोलरता",
      equation: "M = n / V",
      description: "Moles of solute divided by liters of solution.",
      descriptionHi: "विलेय के मोलों की संख्या को विलयन के लीटर आयतन से विभाजित किया जाता है।",
      category: "chemistry"
    },
    {
      name: "pH Formula",
      nameHi: "pH मान सूत्र",
      equation: "pH = -log10[H⁺]",
      description: "Calculates the acidity or basicity of a solution.",
      descriptionHi: "विलयन की अम्लता या क्षारीयता की गणना करता है।",
      category: "chemistry"
    },
    {
      name: "Pythagorean Theorem",
      nameHi: "पाइथागोरस प्रमेय",
      equation: "a² + b² = c²",
      description: "In a right triangle, square of hypotenuse is sum of squares of other sides.",
      descriptionHi: "एक समकोण त्रिभुज में, कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है।",
      category: "math"
    },
    {
      name: "Quadratic Formula",
      nameHi: "द्विघात सूत्र",
      equation: "x = (-b ± √(b² - 4ac)) / (2a)",
      description: "Solves the roots of quadratic equation ax² + bx + c = 0.",
      descriptionHi: "द्विघात समीकरण ax² + bx + c = 0 के मूल निकालता है।",
      category: "math"
    },
    {
      name: "Area of a Circle",
      nameHi: "वृत्त का क्षेत्रफल",
      equation: "A = π * r²",
      description: "Calculates the area of a circle with radius r.",
      descriptionHi: "त्रिज्या r वाले वृत्त के क्षेत्रफल की गणना करता है।",
      category: "math"
    },
    {
      name: "Volume of a Sphere",
      nameHi: "गोले का आयतन",
      equation: "V = (4/3) * π * r³",
      description: "Calculates the volume of a sphere with radius r.",
      descriptionHi: "त्रिज्या r वाले गोले के आयतन की गणना करता है।",
      category: "math"
    },
    {
      name: "Euler's Identity",
      nameHi: "यूलर की पहचान",
      equation: "e^(i*π) + 1 = 0",
      description: "The most beautiful equation connecting five mathematical constants.",
      descriptionHi: "पांच गणितीय स्थिरांकों को जोड़ने वाला सबसे सुंदर समीकरण।",
      category: "math"
    }
  ];

  // Sync state to parent user profile whenever solverSessions array updates
  useEffect(() => {
    const serialized = JSON.stringify(solverSessions);
    if (user.solverSessions !== serialized) {
      onUpdateUser({ solverSessions: serialized });
    }
  }, [solverSessions]);

  // Synchronize when the user profile itself updates or session updates externally
  useEffect(() => {
    try {
      const savedSess = user.solverSessions;
      if (savedSess) {
        setSolverSessions(JSON.parse(savedSess));
      } else {
        // Migration code from old key
        const oldSaved = localStorage.getItem(`${user.mobile}_equations_chatbot_history`);
        if (oldSaved) {
          const oldMsgs = JSON.parse(oldSaved);
          if (oldMsgs.length > 1) {
            const userMsgs = oldMsgs.filter((m: ChatMessage) => m.sender === 'user');
            const firstUserMsg = userMsgs.length > 0 ? userMsgs[0].text : 'Previous Chat';
            const title = firstUserMsg.length > 30 ? firstUserMsg.slice(0, 30) + '...' : firstUserMsg;
            const migratedSession: ChatSession = {
              id: 'migrated-' + Date.now(),
              title,
              timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              messages: oldMsgs
            };
            setSolverSessions([migratedSession]);
            setChatMessages(oldMsgs);
            setActiveSessionId(migratedSession.id);
            localStorage.removeItem(`${user.mobile}_equations_chatbot_history`);
            return;
          }
        }
        setSolverSessions([]);
        handleNewChat();
      }
    } catch (e) {
      console.error("Failed to parse user solverSessions:", e);
      setSolverSessions([]);
      handleNewChat();
    }
  }, [user.solverSessions, user.mobile]);

  // Handle selected file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 8MB for Gemini safety)
    if (file.size > 8 * 1024 * 1024) {
      alert(lang === 'hi' ? "फ़ाइल का आकार 8MB से कम होना चाहिए।" : "File size must be under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setSelectedFile({
        data: base64Data,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
  };

  // Handle sending message
  const handleSendMessage = async (customText?: string) => {
    const messageText = customText !== undefined ? customText : chatInput;
    if (!messageText.trim() && !selectedFile) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentName: selectedFile?.name,
      attachmentType: selectedFile?.mimeType.includes('pdf') ? 'pdf' : (selectedFile ? 'image' : undefined),
      attachmentUrl: selectedFile?.mimeType.includes('image') ? selectedFile.data : undefined
    };

    updateChatAndSession(prev => [...prev, userMsg]);
    if (customText === undefined) {
      setChatInput('');
    }
    const tempFile = selectedFile;
    setSelectedFile(null);
    setIsSending(true);

    const langObj = CHATBOT_LANGUAGES.find(l => l.code === chatbotLang) || CHATBOT_LANGUAGES[0];
    const langName = langObj.name;

    const studentName = user.name || 'Student';
    const gradeLevel = user.standard || localStorage.getItem(`${user.mobile}_profile_standard`) || '';
    const studentVillage = user.village || localStorage.getItem(`${user.mobile}_profile_village`) || '';
    const studentSchool = user.school || localStorage.getItem(`${user.mobile}_profile_school`) || '';
    const studentBoard = user.board || localStorage.getItem(`${user.mobile}_profile_board`) || 'CBSE';

    const systemInstruction = `You are GyaanBot's Smart AI Math and Science Solver, an expert teacher. Solve science/math problems, balance equations, explain physics laws, and show step-by-step calculations.
CRITICAL RULE 1: You MUST explain, write, and reply ENTIRELY in the ${langName} language (using its native script/characters, e.g. Devanagari for Hindi/Sanskrit, Bengali script for Bengali, Arabic/Persian script for Urdu, Tamil script for Tamil, etc.). Do not speak English if the requested language is not English.
CRITICAL RULE 2: NEVER use LaTeX symbols, block math wrappers, or LaTeX macros under any circumstances. Do not output LaTeX wrappers like $$, $, \\frac, \\pm, \\sqrt, or curly braces {}. All formulas and equations must be written in normal, clean, readable plain-text expressions using standard keyboard symbols (e.g., / for division, * or x for multiplication, ^2 for power, sqrt() for square root) and clear statements. Example: write 'x_1 = (5 + 1)/6 = 6/6 = 1' instead of LaTeX formatting.
If a user uploads an image or PDF, carefully analyze the visual/document problem and provide a detailed educational walkthrough in the ${langName} language using this clean format.

[EMPATHETIC ADAPTIVE LEARNING GUIDELINES]
Please tailor your explanations, complexity, and vocabulary to match this student's profile:
1. Student Name: ${studentName} (Address the student personally by name occasionally to encourage them!)
2. Grade/Class Level: ${gradeLevel ? gradeLevel : 'General School Math/Science'} (Ensure the level of mathematics, physics, or chemistry complexity and pedagogy perfectly matches this standard).
3. Academic Board: ${studentBoard} (Apply curriculum standards, grading parameters, or definitions aligning with ${studentBoard}).
4. Student Village Location: ${studentVillage ? studentVillage : 'not specified'} (Incorporate local, familiar rural metaphors like crop weight, water pump discharge, seed bags, tractor speed, or village cattle counts in math word problems and science explanations to make learning intuitive).
5. Student School Name: ${studentSchool ? studentSchool : 'not specified'} (Refer to their school context or encourage them as a bright pupil of their academy).`;

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          file: tempFile ? { data: tempFile.data, mimeType: tempFile.mimeType } : undefined,
          systemInstruction,
          board: user.board || localStorage.getItem(`${user.mobile}_profile_board`) || 'CBSE',
          lang: chatbotLang
        })
      });

      const data = await response.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateChatAndSession(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.message || 'API Error');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: chatbotLang === 'hi'
          ? "क्षमा करें, मुझे आपकी समस्या को संसाधित करने में कोई त्रुटि हुई। कृपया दोबारा प्रयास करें।"
          : `Sorry, I encountered an error while processing your request: ${error.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateChatAndSession(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    if (isSending) return;
    handleSendMessage(text);
  };

  // Helper to sanitize any accidental LaTeX syntax into clean plain text
  const sanitizeAccidentalLatex = (rawText: string): string => {
    let t = rawText;
    
    // Remove block delimiters
    t = t.replace(/\$\$/g, "");
    t = t.replace(/\$/g, "");
    t = t.replace(/\\\[/g, "");
    t = t.replace(/\\\]/g, "");
    t = t.replace(/\\\(/g, "");
    t = t.replace(/\\\)/g, "");
    
    // Replace \frac{a}{b} and \fac{a}{b} with (a)/(b)
    let lastT = "";
    while (t !== lastT) {
      lastT = t;
      t = t.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "($1)/($2)");
      t = t.replace(/\\fac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "($1)/($2)");
    }
    
    // Replace \sqrt{a} with sqrt(a)
    lastT = "";
    while (t !== lastT) {
      lastT = t;
      t = t.replace(/\\sqrt\s*\{([^}]*)\}/g, "sqrt($1)");
    }

    // Replace braces like x_{1} with x_1 or x^{2} with x^2
    t = t.replace(/_\{([^}]*)\}/g, "_$1");
    t = t.replace(/\^\{([^}]*)\}/g, "^$1");
    
    // Replace typical LaTeX symbol macros
    t = t.replace(/\\pm/g, "±");
    t = t.replace(/\\times/g, "×");
    t = t.replace(/\\div/g, "÷");
    t = t.replace(/\\alpha/g, "α");
    t = t.replace(/\\beta/g, "β");
    t = t.replace(/\\gamma/g, "γ");
    t = t.replace(/\\theta/g, "θ");
    t = t.replace(/\\pi/g, "π");
    t = t.replace(/\\delta/g, "Δ");
    t = t.replace(/\\Delta/g, "Δ");
    t = t.replace(/\\cdot/g, "•");
    t = t.replace(/\\deg/g, "°");
    t = t.replace(/\\degree/g, "°");
    t = t.replace(/\\approx/g, "≈");
    t = t.replace(/\\ne/g, "≠");
    t = t.replace(/\\le/g, "≤");
    t = t.replace(/\\ge/g, "≥");
    t = t.replace(/\\infty/g, "∞");
    
    // Strip remaining dangling curly braces around single items, e.g. {5+1} -> 5+1
    t = t.replace(/\{([^{}]*)\}/g, "$1");

    return t;
  };

  // Helper to format messages with markdown-like style (bold, bullet, newline)
  const formatMessageText = (text: string) => {
    const sanitizedText = sanitizeAccidentalLatex(text);
    return sanitizedText.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
      const cleanLine = isBullet ? trimmedLine.substring(2) : line;

      // Match **text**
      const parts = [];
      const regex = /\*\*(.*?)\*\*/g;
      let match;
      let lastIndex = 0;

      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-gray-950">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : cleanLine;

      if (isBullet) {
        return (
          <li key={i} className="list-disc ml-4 mt-0.5 text-xs sm:text-sm text-gray-750 leading-relaxed font-sans">
            {content}
          </li>
        );
      }

      return (
        <p key={i} className="text-xs sm:text-sm text-gray-750 leading-relaxed min-h-[1rem] font-sans">
          {content}
        </p>
      );
    });
  };

  const copyMessageToClipboard = (msg: ChatMessage) => {
    const cleanText = sanitizeAccidentalLatex(msg.text);
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedMessageId(msg.id);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const exportMessageToPDF = (msg: ChatMessage) => {
    // Find preceding user question
    let userQuestion = "";
    const activeMsgIndex = chatMessages.findIndex(m => m.id === msg.id);
    if (activeMsgIndex > 0) {
      for (let i = activeMsgIndex - 1; i >= 0; i--) {
        if (chatMessages[i].sender === 'user') {
          userQuestion = chatMessages[i].text;
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
      const pageText = lang === 'hi' ? "पृष्ठ" : "Page";
      doc.text(`${pageText} ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(lang === 'hi' ? "एआई गणित और विज्ञान सॉल्वर" : "AI Math & Science Solver Notes", pageWidth - margin, pageHeight - 8, { align: 'right' });
    };

    // Initial background drawing
    drawPageBackground();
    currentY += 8;

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(61, 64, 91);
    doc.text(lang === 'hi' ? "गणित और विज्ञान समाधान रिपोर्ट" : "MATH & SCIENCE SOLUTION REPORT", margin, currentY);
    currentY += 6;

    // Subtitle
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 120);
    doc.text(lang === 'hi' ? "एआई गणित और विज्ञान सॉल्वर द्वारा तैयार किया गया" : "Curated by AI Math & Science Calculation Engine", margin, currentY);
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
    
    doc.text(lang === 'hi' ? "छात्र:" : "STUDENT:", margin + 5, currentY + 6);
    doc.text(lang === 'hi' ? "एआई सॉल्वर:" : "AI SOLVER:", margin + 5, currentY + 12);
    doc.text(lang === 'hi' ? "तारीख:" : "DATE CURATED:", margin + 5, currentY + 18);
    doc.text(lang === 'hi' ? "सत्यापन:" : "VERIFICATION:", margin + 5, currentY + 24);

    const studentName = user.name || 'Verified Student';
    const gradeLevel = localStorage.getItem(`${user.mobile}_profile_standard`) || user.standard || 'Primary Grade';

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(80, 80, 90);
    doc.text(`${studentName} (${gradeLevel})`, margin + 35, currentY + 6);
    doc.text(lang === 'hi' ? "स्मार्ट एआई गणित और विज्ञान शिक्षक" : "Smart AI Math & Science Tutor (Owl)", margin + 35, currentY + 12);
    doc.text(msg.timestamp || new Date().toLocaleDateString(), margin + 35, currentY + 18);
    doc.text(lang === 'hi' ? "🔒 सत्यापित शैक्षणिक सत्र सिंक" : "🔒 Verified Academic Session Sync", margin + 35, currentY + 24);
    currentY += 36;

    // Question Section
    if (userQuestion) {
      ensureSpace(20);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(224, 122, 95);
      doc.text(lang === 'hi' ? "छात्र का प्रश्न" : "STUDENT QUESTION", margin, currentY);
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
    doc.text(lang === 'hi' ? "सॉल्वर स्पष्टीकरण और समाधान" : "SOLVER EXPLANATION & SOLUTION", margin, currentY);
    currentY += 6;

    const cleanText = sanitizeAccidentalLatex(msg.text);

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

    const safeTitle = (userQuestion || "Explanation").substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Equation_Hub_Solution_${safeTitle}.pdf`);
    
    speakText(
      lang === 'hi' 
        ? "आपका समाधान PDF सफलतापूर्वक डाउनलोड हो गया है!" 
        : "Your calculation solution PDF has been successfully generated and downloaded!",
      lang,
      "AI Solver",
      "🤖 AI Solver"
    );
  };
  
  // Selection states
  const [selectedScienceEq, setSelectedScienceEq] = useState<'newton' | 'ohms' | 'einstein' | 'chemistry'>('newton');
  const [selectedMathEq, setSelectedMathEq] = useState<'pythagoras' | 'trigonometry' | 'quadratic'>('pythagoras');

  // ----------------------------------------------------
  // SCIENCE SLIDERS STATE
  // ----------------------------------------------------
  // Newton's Law: F = m * a
  const [mass, setMass] = useState<number>(15); // kg
  const [accel, setAccel] = useState<number>(6); // m/s²
  
  // Ohm's Law: V = I * R
  const [current, setCurrent] = useState<number>(2.5); // Amperes
  const [resistance, setResistance] = useState<number>(10); // Ohms

  // Einstein: E = m * c²
  const [milligrams, setMilligrams] = useState<number>(2); // mg

  // ----------------------------------------------------
  // MATHEMATICS SLIDERS STATE
  // ----------------------------------------------------
  // Pythagoras: a² + b² = c²
  const [sideA, setSideA] = useState<number>(6); // base
  const [sideB, setSideB] = useState<number>(8); // height

  // Trigonometry: Height = d * tan(θ)
  const [distance, setDistance] = useState<number>(15); // meters away
  const [elevationAngle, setElevationAngle] = useState<number>(30); // degrees

  // Quadratic equation: ax² + bx + c = 0
  const [coeffA, setCoeffA] = useState<number>(1); // a must not be 0
  const [coeffB, setCoeffB] = useState<number>(-2);
  const [coeffC, setCoeffC] = useState<number>(-3);

  // ----------------------------------------------------
  // COMMON STATE
  // ----------------------------------------------------
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Chemical game state
  const [activeChemIndex, setActiveChemIndex] = useState<number>(0);
  const [chemInputs, setChemInputs] = useState<string[]>(['', '', '', '']);
  const [chemStatus, setChemStatus] = useState<'idle' | 'success' | 'incorrect'>('idle');
  const [scoreNotification, setScoreNotification] = useState<string | null>(null);

  // Stop reading when switching tabs, categories or equations
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, [activeCategory, selectedScienceEq, selectedMathEq]);

  // Chemical balancing database
  const chemicalQuestions: ChemicalQuestion[] = [
    {
      id: 'water',
      reactionName: lang === 'hi' ? 'पानी का संश्लेषण (Synthesis of Water)' : 'Synthesis of Water',
      reactants: ['H₂', 'O₂'],
      products: ['H₂O'],
      correctCoefficients: [2, 1, 2],
      placeholders: ['H₂', 'O₂', 'H₂O'],
      points: 10,
      hint: lang === 'hi' 
        ? 'संकेत: दाईं ओर हाइड्रोजन और ऑक्सीजन की संख्या बराबर करने के लिए H₂O से पहले 2 लगाएं।' 
        : 'Hint: Put a 2 in front of H₂O and H₂ to balance both hydrogen and oxygen atoms!'
    },
    {
      id: 'ammonia',
      reactionName: lang === 'hi' ? 'अमोनिया का उत्पादन (Haber Process)' : 'Synthesis of Ammonia',
      reactants: ['N₂', 'H₂'],
      products: ['NH₃'],
      correctCoefficients: [1, 3, 2],
      placeholders: ['N₂', 'H₂', 'NH₃'],
      points: 15,
      hint: lang === 'hi'
        ? 'संकेत: अमोनिया (NH₃) से पहले 2 लगाने से नाइट्रोजन संतुलित होगा। फिर हाइड्रोजन को संतुलित करें।'
        : 'Hint: Put a 2 before NH₃ to balance Nitrogen, then put a 3 before H₂ to balance Hydrogen!'
    },
    {
      id: 'carbon_combust',
      reactionName: lang === 'hi' ? 'कार्बन दहन (Carbon Combustion)' : 'Carbon Combustion',
      reactants: ['C', 'O₂'],
      products: ['CO₂'],
      correctCoefficients: [1, 1, 1],
      placeholders: ['C', 'O₂', 'CO₂'],
      points: 5,
      hint: lang === 'hi'
        ? 'संकेत: यह पहले से ही संतुलित है! सभी स्थानों पर 1 लिखें।'
        : 'Hint: This reaction is already balanced. Just write 1 for each chemical!'
    }
  ];

  const activeQuestion = chemicalQuestions[activeChemIndex];

  // Sync inputs length when chemical question changes
  useEffect(() => {
    setChemInputs(Array(activeQuestion.correctCoefficients.length).fill(''));
    setChemStatus('idle');
  }, [activeChemIndex, lang]);

  // ----------------------------------------------------
  // CALCULATED VALUES
  // ----------------------------------------------------
  // Science outputs
  const force = mass * accel;
  const voltage = current * resistance;
  const energyMWh = milligrams * 25; // standard scaled equivalent

  // Math outputs
  const hypotenuse = Math.sqrt(sideA * sideA + sideB * sideB);
  
  // Trig calculations
  const angleRad = (elevationAngle * Math.PI) / 180;
  const computedHeight = distance * Math.tan(angleRad);
  const lineOfSight = distance / Math.cos(angleRad);

  // Quadratic calculations
  const discriminant = (coeffB * coeffB) - (4 * coeffA * coeffC);
  let rootsInfo = {
    nature: '',
    r1: '',
    r2: '',
    hasReal: false
  };

  if (discriminant > 0) {
    const root1 = (-coeffB + Math.sqrt(discriminant)) / (2 * coeffA);
    const root2 = (-coeffB - Math.sqrt(discriminant)) / (2 * coeffA);
    rootsInfo = {
      nature: lang === 'hi' ? 'वास्तविक और असमान (Real & Distinct)' : 'Real & Distinct Roots',
      r1: root1.toFixed(2),
      r2: root2.toFixed(2),
      hasReal: true
    };
  } else if (discriminant === 0) {
    const root = -coeffB / (2 * coeffA);
    rootsInfo = {
      nature: lang === 'hi' ? 'वास्तविक और समान (Real & Equal)' : 'Real & Equal Roots',
      r1: root.toFixed(2),
      r2: root.toFixed(2),
      hasReal: true
    };
  } else {
    const realPart = (-coeffB / (2 * coeffA)).toFixed(2);
    const imagPart = (Math.sqrt(-discriminant) / (2 * coeffA)).toFixed(2);
    rootsInfo = {
      nature: lang === 'hi' ? 'काल्पनिक / अवास्तविक (Complex / Imaginary)' : 'Complex / Imaginary Roots',
      r1: `${realPart} + ${imagPart}i`,
      r2: `${realPart} - ${imagPart}i`,
      hasReal: false
    };
  }

  // ----------------------------------------------------
  // EXPLANATIONS DICTIONARY
  // ----------------------------------------------------
  const scienceExplanations = getScienceExplanations(lang, { mass, accel, force, current, resistance, voltage, milligrams, energyMWh });
  const mathExplanations = getMathExplanations(lang, { sideA, sideB, hypotenuse, distance, elevationAngle, computedHeight, lineOfSight, coeffA, coeffB, coeffC, discriminant, rootsInfo, angleRad });

  // Select active equation info based on current category tab
  const activeEqInfo = activeCategory === 'science' 
    ? scienceExplanations[selectedScienceEq]
    : mathExplanations[selectedMathEq];

  // Voice text synthesizer
  const handleVoiceExplanation = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToSpeak = `${activeEqInfo.title}. ${activeEqInfo.explanation} ${activeEqInfo.intuition}`;
      speakText(textToSpeak, lang, 'Aryabhata AI 🦉', '🦉 Aryabhata AI', () => {
        setIsSpeaking(false);
      });
    }
  };

  // Chemical quiz verification
  const checkChemicalAnswer = () => {
    let allCorrect = true;
    const currentCorrect = activeQuestion.correctCoefficients;
    
    for (let i = 0; i < currentCorrect.length; i++) {
      const parsedVal = parseInt(chemInputs[i], 10);
      if (isNaN(parsedVal) || parsedVal !== currentCorrect[i]) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      setChemStatus('success');
      const bonus = activeQuestion.points;
      const originalPoints = user.totalPoints || 15;
      const updatedPoints = originalPoints + bonus;
      
      onUpdateUser({ totalPoints: updatedPoints });
      
      const successMsg = lang === 'hi'
        ? `✨ सही संतुलन! आपको +${bonus} अंक मिले! कुल अंक: ${updatedPoints}`
        : `✨ Perfectly Balanced! You earned +${bonus} study points! Total: ${updatedPoints} pts`;
      setScoreNotification(successMsg);
      
      speakText(
        lang === 'hi' ? 'बहुत बढ़िया! रासायनिक समीकरण पूरी तरह से संतुलित है।' : 'Excellent work! The chemical equation is perfectly balanced.',
        lang, 'Swami AI 🤖', '🤖 Swami AI'
      );

      setTimeout(() => {
        setScoreNotification(null);
      }, 5000);
    } else {
      setChemStatus('incorrect');
      speakText(
        lang === 'hi' ? 'यह संतुलित नहीं है। कृपया परमाणु संख्याओं की दोबारा जांच करें।' : 'That is not correct. Please count the atoms on both sides again.',
        lang, 'Swami AI 🤖', '🤖 Swami AI'
      );
    }
  };

  const resetChemicalGame = () => {
    setChemInputs(Array(activeQuestion.correctCoefficients.length).fill(''));
    setChemStatus('idle');
  };

  return (
    <div id="interactive-equation-hub" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-[#3D405B] to-[#2B2D42] text-white p-6 rounded-3xl border border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#F2CC8F]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-20 bg-[#E07A5F]/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl text-[#F2CC8F] border border-white/15 shadow-inner">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[#F2CC8F] tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                {lang === 'hi' ? 'स्मार्ट एआई' : 'Smart AI'}
              </span>
              <span className="text-[10px] uppercase font-mono font-bold bg-[#E07A5F]/20 text-[#E07A5F] px-2 py-0.5 rounded-full border border-[#E07A5F]/30">
                {lang === 'hi' ? 'ऑफ़लाइन सक्षम' : '100% Offline-Ready'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold mt-1">
              {lang === 'hi' ? 'स्मार्ट समीकरण एआई सॉल्वर' : 'Smart Equation AI Solver'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 max-w-xl">
              {lang === 'hi' 
                ? 'गणित और विज्ञान के कठिन सूत्रों और समीकरणों को स्टेप-बाय-स्टेप एआई सॉल्वर के साथ हल करें।'
                : 'Solve complex Science & Mathematics problems, balance equations, and get step-by-step calculations with our advanced AI Solver.'}
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID FOR VISUAL PLAYGROUND */}
      {activeCategory !== 'chatbot' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TOPIC SELECTION LIST (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-2xs">
            <h2 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider mb-3">
              {lang === 'hi' ? 'एक विषय चुनें' : 'Select a topic'}
            </h2>
            
            {/* SCIENCE TOPIC BUTTONS */}
            {activeCategory === 'science' && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedScienceEq('newton')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'newton'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'गति का नियम (Newton)' : "Newton's Force Law"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">F = m × a</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'newton' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('ohms')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'ohms'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'ओम का नियम (Ohm)' : "Ohm's Law"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">V = I × R</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'ohms' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('einstein')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'einstein'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'द्रव्यमान-ऊर्जा समीकरण' : "Mass-Energy Equivalence"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">E = m × c²</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'einstein' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('chemistry')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'chemistry'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'रासायनिक संतुलन लैब' : "Chemical Balancing Lab"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">Reactants ➔ Products</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'chemistry' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>
              </div>
            )}

            {/* MATHEMATICS TOPIC BUTTONS */}
            {activeCategory === 'math' && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedMathEq('pythagoras')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'pythagoras'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'पाइथागोरस प्रमेय (Guniya)' : "Pythagoras Theorem"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">a² + b² = c²</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'pythagoras' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedMathEq('trigonometry')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'trigonometry'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'ऊँचाई और दूरी (Trig)' : "Heights & Distances"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">h = d × tan(θ)</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'trigonometry' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedMathEq('quadratic')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'quadratic'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'द्विघात समीकरण' : "Quadratic Plotter"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">ax² + bx + c = 0</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'quadratic' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE EQUATION PARAMETERS CONTROL (SLIDERS AREA) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-2xs space-y-4">
            <h2 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider">
              {lang === 'hi' ? 'नियंत्रण स्लाइडर्स' : 'Equation Controls'}
            </h2>

            {/* 1. Newton's Force sliders */}
            {activeCategory === 'science' && selectedScienceEq === 'newton' && (
              <div className="space-y-4">
                {/* Mass slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass):' : 'Mass (m):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{mass} kg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={mass}
                    onChange={(e) => setMass(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 kg</span>
                    <span>50 kg</span>
                  </div>
                </div>

                {/* Acceleration slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'त्वरण (Acceleration):' : 'Acceleration (a):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{accel} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={accel}
                    onChange={(e) => setAccel(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 m/s²</span>
                    <span>20 m/s²</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Ohm's Law sliders */}
            {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
              <div className="space-y-4">
                {/* Current slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'विद्युत धारा (Current):' : 'Current (I):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{current} A</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={current}
                    onChange={(e) => setCurrent(parseFloat(e.target.value))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 A</span>
                    <span>10 A</span>
                  </div>
                </div>

                {/* Resistance slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'प्रतिरोध (Resistance):' : 'Resistance (R):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{resistance} Ω</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={resistance}
                    onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 Ω</span>
                    <span>50 Ω</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Einstein's mass-energy sliders */}
            {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
              <div className="space-y-4">
                {/* Tiny Mass in grams */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass):' : 'Mass (m):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{milligrams} mg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={milligrams}
                    onChange={(e) => setMilligrams(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 mg</span>
                    <span>100 mg</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Pythagoras Dynamic Triangle */}
            {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
              <div className="space-y-4">
                {/* Side A slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'आधार (Base side a):' : 'Base (Side a):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{sideA} cm</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={sideA}
                    onChange={(e) => setSideA(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>3 cm</span>
                    <span>15 cm</span>
                  </div>
                </div>

                {/* Side B slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{lang === 'hi' ? 'लंब (Height side b):' : 'Height (Side b):'}</span>
                    <span className="font-mono font-extrabold text-[#E07A5F]">{sideB} cm</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={sideB}
                    onChange={(e) => setSideB(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E07A5F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>3 cm</span>
                    <span>15 cm</span>
                  </div>
                </div>
              </div>
            )}

                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="space-y-4">
                      {/* Ground Distance (d) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'जमीनी दूरी (Distance d):' : 'Distance from Base (d):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{distance} m</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>5 m</span>
                          <span>30 m</span>
                        </div>
                      </div>

                      {/* Angle of Elevation (θ) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'उन्नयन कोण (Angle θ):' : 'Angle of Elevation (θ):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{elevationAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="75"
                          step="5"
                          value={elevationAngle}
                          onChange={(e) => setElevationAngle(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>15°</span>
                          <span>75°</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                    <div className="space-y-4">
                      {/* Coefficient a */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">
                            {lang === 'hi' ? 'गुणांक a (शून्य नहीं):' : 'Coefficient a (≠ 0):'}
                          </span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffA}</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="1"
                          value={coeffA}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCoeffA(val === 0 ? 1 : val); // prevent division by zero
                          }}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-4</span>
                          <span>4 (non-zero)</span>
                        </div>
                      </div>

                      {/* Coefficient b */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'गुणांक b:' : 'Coefficient b:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffB}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffB}
                          onChange={(e) => setCoeffB(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>

                      {/* Coefficient c */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'अचर पद c:' : 'Constant c:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffC}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffC}
                          onChange={(e) => setCoeffC(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* RUNTIME RESULT BOX */}
                <div className="bg-[#3D405B] text-white p-4 rounded-2xl text-left shadow-inner">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#F2CC8F] font-bold block">
                    {lang === 'hi' ? 'सक्रिय गणना परिणाम' : 'Live Calculation Output'}
                  </span>
                  
                  {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                    <div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-3xl font-mono font-black text-[#F2CC8F]">{force}</span>
                        <span className="text-xs font-sans font-bold text-gray-300">Newtons (N)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                        {lang === 'hi' ? 'बल = द्रव्यमान × त्वरण' : 'Force = Mass × Acceleration'}
                      </p>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                    <div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-3xl font-mono font-black text-[#F2CC8F]">{voltage.toFixed(1)}</span>
                        <span className="text-xs font-sans font-bold text-gray-300">Volts (V)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                        {lang === 'hi' ? 'वोल्टेज = विद्युत धारा × प्रतिरोध' : 'Voltage = Current × Resistance'}
                      </p>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                    <div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-2xl font-mono font-black text-[#F2CC8F]">{energyMWh.toLocaleString()}</span>
                        <span className="text-xs font-sans font-bold text-gray-300">MWh</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                        {lang === 'hi' ? 'ऊर्जा (E) = द्रव्यमान (m) × c²' : 'Energy (E) = Mass (m) × c²'}
                      </p>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                    <div>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-3xl font-mono font-black text-[#F2CC8F]">{hypotenuse.toFixed(2)}</span>
                        <span className="text-xs font-sans font-bold text-gray-300">cm</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                        {lang === 'hi' ? 'कर्ण (c) = √(a² + b²)' : 'Hypotenuse (c) = √(a² + b²)'}
                      </p>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="space-y-1 mt-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-black text-[#F2CC8F]">{computedHeight.toFixed(1)}</span>
                        <span className="text-xs font-sans font-bold text-gray-300">meters (Height)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans leading-normal">
                        {lang === 'hi' 
                          ? `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | कर्ण = ${lineOfSight.toFixed(1)} m` 
                          : `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | Hypotenuse = ${lineOfSight.toFixed(1)} m`}
                      </p>
                    </div>
                  )}

              {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                <div className="mt-1.5 space-y-1 text-xs">
                  <div className="font-bold text-[#F2CC8F]">
                    {lang === 'hi' ? 'मूल (Roots):' : 'Computed Roots:'}
                  </div>
                  <div className="font-mono font-extrabold text-sm flex flex-col gap-0.5">
                    <div className="text-white">x₁ = <span className="text-[#F2CC8F]">{rootsInfo.r1}</span></div>
                    <div className="text-white">x₂ = <span className="text-[#F2CC8F]">{rootsInfo.r2}</span></div>
                  </div>
                  <p className="text-[10px] text-slate-300 font-sans leading-none pt-1">
                    D = b² - 4ac = <span className="font-mono font-bold">{discriminant}</span> ({rootsInfo.nature})
                  </p>
                </div>
              )}

            </div>

          {/* DYNAMIC HINDI/ENGLISH DID-YOU-KNOW TRIVIA CARD */}
          <div className="bg-amber-50/70 border border-amber-150 rounded-3xl p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h5 className="font-sans font-bold text-xs text-amber-800">
                  {activeCategory === 'science' 
                    ? (lang === 'hi' ? 'भारतीय विज्ञान धरोहर' : 'Did You Know?') 
                    : (lang === 'hi' ? 'भारतीय वैदिक गणित रहस्य' : 'Vedic Math & Local Trivia')}
                </h5>
                <p className="text-xs text-gray-650 leading-relaxed">
                  {activeCategory === 'science' ? (
                    lang === 'hi'
                      ? "कणाद मुनि ने २५०० वर्ष पहले 'वैशेषिक सूत्र' में लिखा था कि ब्रह्मांड का प्रत्येक पदार्थ सूक्ष्म कणों (परमाणुओं) से बना है, जिसे आधुनिक विज्ञान एटम कहता है!"
                      : "Over 2500 years ago, Indian sage Maharishi Kanada formulated the 'atomic theory of matter', stating everything is made of indivisible particles called 'Anu' (atoms)!"
                  ) : (
                    lang === 'hi'
                      ? "बौधायन सुल्वसूत्र (800 ईसा पूर्व) में पाइथागोरस के जन्म से सदियों पहले ही इस प्रमेय का स्पष्ट उल्लेख मिलता है। भारतीय राजमिस्त्री आज भी इसे दीवार नापने के लिए 'गुनिया सूत्र' कहते हैं।"
                      : "Centuries before Pythagoras, the Indian mathematician Baudhayan written down the exact relationship in the 'Shulba Sutras' (800 BC). It was used to build precise geometric altars!"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SIMULATION PLAYGROUND (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MAIN EXPERIMENT COMPONENT */}
          {!(activeCategory === 'science' && selectedScienceEq === 'chemistry') ? (
            <div className="bg-white rounded-3xl border border-gray-150 shadow-2xs overflow-hidden">
              
              {/* PLAYGROUND TITLE HEADER */}
              <div className="border-b border-gray-100 p-5 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="font-mono text-[10px] text-gray-450 uppercase font-bold tracking-wider block">
                    {lang === 'hi' ? 'इंटरैक्टिव प्रयोग और सैंडबॉक्स' : 'Interactive Sandbox Experiment'}
                  </span>
                  <h2 className="font-display font-extrabold text-base text-gray-900 mt-0.5">
                    {activeEqInfo.title}
                  </h2>
                </div>

                {/* READ OUT LOUD EXPLAINER */}
                <button
                  onClick={handleVoiceExplanation}
                  className={`px-4 py-2 rounded-full font-sans text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-amber-600 text-white shadow-xs animate-pulse'
                      : 'bg-amber-55 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Volume2 className="h-4 w-4 shrink-0" />
                  <span>{isSpeaking ? (lang === 'hi' ? 'आवाज़ बंद करें' : 'Stop Speaking') : (lang === 'hi' ? 'आवाज़ में समझें' : 'Listen Explanation')}</span>
                </button>
              </div>

              {/* THE FORMULA CARD */}
              <div className="p-6 bg-[#FAF8F4] flex flex-col items-center justify-center border-b border-gray-100 py-8">
                <span className="text-xs font-mono font-bold text-[#E07A5F] uppercase tracking-widest">
                  {lang === 'hi' ? 'गणितीय सूत्र' : 'Standard Formula'}
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black text-[#3D405B] tracking-tight mt-2 text-center drop-shadow-3xs">
                  {activeEqInfo.formula}
                </div>
                <div className="text-xs font-sans font-semibold text-gray-550 mt-3 text-center max-w-lg bg-white/70 px-4 py-2 rounded-full border border-gray-100 shadow-3xs">
                  {activeEqInfo.variables}
                </div>
              </div>

              {/* LAYOUT GRID: SLIDERS ON LEFT, VISUAL GRAPHICS ON RIGHT */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* SLIDERS CONTROLLER (5 cols) */}
                <div className="md:col-span-5 space-y-5 border-r border-gray-100/80 pr-0 md:pr-6">
                  <div className="flex items-center gap-2 text-gray-800 pb-1">
                    <Sliders className="h-4 w-4 text-[#E07A5F]" />
                    <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-500">
                      {lang === 'hi' ? 'पैरामीटर बदलें' : 'Adjust Parameters'}
                    </h3>
                  </div>

                  {/* SLIDERS ACCORDING TO SELECTED FORMULA */}
                  {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                    <div className="space-y-4">
                      {/* Mass Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass m):' : 'Mass (m):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{mass} kg</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={mass}
                          onChange={(e) => setMass(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 kg</span>
                          <span>50 kg</span>
                        </div>
                      </div>

                      {/* Acceleration Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'त्वरण (Acceleration a):' : 'Acceleration (a):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{accel} m/s²</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          value={accel}
                          onChange={(e) => setAccel(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 m/s²</span>
                          <span>15 m/s²</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                    <div className="space-y-4">
                      {/* Current Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'विद्युत धारा (Current I):' : 'Current (I):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{current.toFixed(1)} A</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={current}
                          onChange={(e) => setCurrent(parseFloat(e.target.value))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>0.5 A</span>
                          <span>10 A</span>
                        </div>
                      </div>

                      {/* Resistance Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'प्रतिरोध (Resistance R):' : 'Resistance (R):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{resistance} Ω</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={resistance}
                          onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 Ω</span>
                          <span>50 Ω</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                    <div className="space-y-4">
                      {/* Milligrams mass */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass m in mg):' : 'Mass (m in mg):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{milligrams} mg</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={milligrams}
                          onChange={(e) => setMilligrams(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 mg</span>
                          <span>10 mg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MATHS FORMULA SLIDERS */}
                  {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                    <div className="space-y-4">
                      {/* Base side A */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'आधार (Base side a):' : 'Base (Side a):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{sideA} cm</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={sideA}
                          onChange={(e) => setSideA(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>3 cm</span>
                          <span>15 cm</span>
                        </div>
                      </div>

                      {/* Height side B */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'लंब (Height side b):' : 'Height (Side b):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{sideB} cm</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={sideB}
                          onChange={(e) => setSideB(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>3 cm</span>
                          <span>15 cm</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="space-y-4">
                      {/* Ground Distance (d) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'जमीनी दूरी (Distance d):' : 'Distance from Base (d):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{distance} m</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>5 m</span>
                          <span>30 m</span>
                        </div>
                      </div>

                      {/* Angle of Elevation (θ) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'उन्नयन कोण (Angle θ):' : 'Angle of Elevation (θ):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{elevationAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="75"
                          step="5"
                          value={elevationAngle}
                          onChange={(e) => setElevationAngle(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>15°</span>
                          <span>75°</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                    <div className="space-y-4">
                      {/* Coefficient a */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">
                            {lang === 'hi' ? 'गुणांक a (शून्य नहीं):' : 'Coefficient a (≠ 0):'}
                          </span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffA}</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="1"
                          value={coeffA}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCoeffA(val === 0 ? 1 : val); // prevent division by zero
                          }}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-4</span>
                          <span>4 (non-zero)</span>
                        </div>
                      </div>

                      {/* Coefficient b */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'गुणांक b:' : 'Coefficient b:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffB}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffB}
                          onChange={(e) => setCoeffB(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>

                      {/* Coefficient c */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'अचर पद c:' : 'Constant c:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffC}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffC}
                          onChange={(e) => setCoeffC(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RUNTIME RESULT BOX */}
                  <div className="bg-[#3D405B] text-white p-4 rounded-2xl text-left shadow-inner">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#F2CC8F] font-bold block">
                      {lang === 'hi' ? 'सक्रिय गणना परिणाम' : 'Live Calculation Output'}
                    </span>
                    
                    {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{force}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">Newtons (N)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'बल = द्रव्यमान × त्वरण' : 'Force = Mass × Acceleration'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{voltage.toFixed(1)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">Volts (V)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'वोल्टेज = विद्युत धारा × प्रतिरोध' : 'Voltage = Current × Resistance'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-2xl font-mono font-black text-[#F2CC8F]">{energyMWh.toLocaleString()}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">MWh</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'ऊर्जा (E) = द्रव्यमान (m) × c²' : 'Energy (E) = Mass (m) × c²'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{hypotenuse.toFixed(2)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">cm</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'कर्ण (c) = √(a² + b²)' : 'Hypotenuse (c) = √(a² + b²)'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                      <div className="space-y-1 mt-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-black text-[#F2CC8F]">{computedHeight.toFixed(1)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">meters (Height)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-normal">
                          {lang === 'hi' 
                            ? `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | कर्ण = ${lineOfSight.toFixed(1)} m` 
                            : `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | Hypotenuse = ${lineOfSight.toFixed(1)} m`}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="font-bold text-[#F2CC8F]">
                          {lang === 'hi' ? 'मूल (Roots):' : 'Computed Roots:'}
                        </div>
                        <div className="font-mono font-extrabold text-sm flex flex-col gap-0.5">
                          <div className="text-white">x₁ = <span className="text-[#F2CC8F]">{rootsInfo.r1}</span></div>
                          <div className="text-white">x₂ = <span className="text-[#F2CC8F]">{rootsInfo.r2}</span></div>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-none pt-1">
                          D = b² - 4ac = <span className="font-mono font-bold">{discriminant}</span> ({rootsInfo.nature})
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* VISUAL ILLUSTRATION SCREEN (7 cols) */}
                <div className="md:col-span-7 bg-gray-50 rounded-2xl border border-gray-150 p-4 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
                  
                  {/* 1. Newton's Visual Animation */}
                  {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'गति की दिशा और बल सदिश' : 'Push Vector Visualization'}
                      </span>
                      
                      <div className="relative h-28 flex items-center justify-center bg-white border border-gray-100 rounded-xl px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl">🧔</span>
                            <span className="text-[9px] font-bold text-gray-500 font-sans">{lang === 'hi' ? 'धक्का' : 'Push'}</span>
                          </div>

                          {/* Force Arrow */}
                          <div 
                            className="h-4 bg-[#E07A5F] rounded-full relative transition-all duration-300"
                            style={{ width: `${Math.min(30 + force * 2.5, 160)}px` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#E07A5F]"></div>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-[#E07A5F] whitespace-nowrap">
                              {force.toFixed(0)} N
                            </span>
                          </div>

                          {/* Moving Wagon */}
                          <div 
                            className="p-3 bg-[#3D405B] text-white rounded-lg border border-slate-700 shadow flex flex-col items-center justify-center transition-all duration-300 relative"
                            style={{ transform: `scale(${1 + mass / 100})` }}
                          >
                            <span className="text-lg">📦</span>
                            <span className="text-[8px] font-mono font-bold text-[#F2CC8F] mt-0.5">{mass} kg</span>
                            
                            {/* Wheels */}
                            <div className="absolute -bottom-1.5 left-2 h-3 w-3 rounded-full bg-slate-900 border border-slate-400 animate-spin"></div>
                            <div className="absolute -bottom-1.5 right-2 h-3 w-3 rounded-full bg-slate-900 border border-slate-400 animate-spin"></div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi' 
                          ? 'स्लाइडर बदलें! भारी वजन को उसी गति से बढ़ाने के लिए अधिक बल चाहिए।' 
                          : 'Adjust sliders! A heavier box needs a stronger push to accelerate to the same speed.'}
                      </div>
                    </div>
                  )}

                  {/* 2. Ohm's Law Circuit */}
                  {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'विद्युत परिपथ और बल्ब की चमक' : 'Interactive Bulb Circuit'}
                      </span>
                      
                      <div className="relative h-28 flex items-center justify-center bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-10">
                          {/* Battery */}
                          <div className="relative border-2 border-slate-700 w-14 h-8 rounded bg-slate-100 flex items-center justify-center">
                            <span className="text-[10px] font-mono font-black text-slate-700">🔋 {voltage.toFixed(1)}V</span>
                            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-slate-700 rounded-r"></div>
                          </div>

                          {/* Connection wires drawn as line */}
                          <div className="flex-1 h-0.5 bg-slate-400 relative">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-gray-500 font-bold bg-white px-1 border border-gray-150 rounded">
                              {current.toFixed(1)} A
                            </div>
                          </div>

                          {/* Lightbulb with dynamic glow and brightness */}
                          <div className="relative flex flex-col items-center">
                            <div 
                              className="absolute rounded-full transition-all duration-300 blur-md pointer-events-none"
                              style={{ 
                                width: `${Math.min(20 + voltage * 3, 75)}px`, 
                                height: `${Math.min(20 + voltage * 3, 75)}px`, 
                                backgroundColor: `rgba(242, 204, 143, ${Math.min(voltage / 100, 0.95)})` 
                              }}
                            ></div>
                            
                            <div className="z-10 text-3xl transition-transform duration-300" style={{ transform: `scale(${1 + current / 20})` }}>
                              💡
                            </div>
                            <span className="text-[9px] font-bold text-gray-650 font-mono mt-1">Bulb: {resistance} Ω</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'प्रतिरोध (R) बढ़ने से करंट कम होता है, जिससे बल्ब धीमा होता है। वोल्टेज बढ़ने से करंट बढ़ता है!'
                          : 'Increasing resistance reduces current, making the bulb dim. Increasing voltage pumps more current!'}
                      </div>
                    </div>
                  )}

                  {/* 3. Einstein Mass-Energy Equivalence */}
                  {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'ऊर्जा रूपांतरण तुलना' : 'Equivalent Power Scale'}
                      </span>
                      
                      <div className="relative h-28 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center bg-[#FAF8F4] border border-gray-150 p-2 rounded-xl">
                            <span className="text-2xl">🧂</span>
                            <span className="text-[9px] font-mono font-bold text-gray-700">{milligrams} mg Salt</span>
                          </div>

                          <ArrowRight className="h-5 w-5 text-amber-500 animate-bounce" />

                          <div className="flex flex-col items-center bg-[#3D405B] text-white p-2 px-3 rounded-xl">
                            <span className="text-xl">🏫 💡</span>
                            <span className="text-[8px] font-mono text-[#F2CC8F] font-bold text-center mt-0.5">
                              {energyMWh.toLocaleString()} Megawatt Hours
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] font-sans font-bold text-gray-700 mt-2 text-center">
                          ⚡ {lang === 'hi' ? 'यह ग्रामीण स्कूल को' : 'Can run village primary school for'} <span className="text-[#E07A5F] font-extrabold">{((energyMWh) / 10).toFixed(0)}</span> {lang === 'hi' ? 'महीने तक बिजली देगा!' : 'months!'}
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'चूंकि प्रकाश की गति बहुत अधिक है, इसलिए बहुत कम मात्रा में द्रव्यमान नष्ट होने पर भी विशाल ऊर्जा उत्पन्न होती है!'
                          : 'Because the speed of light is exceptionally fast, converting even a speck of dust yields incredible quantities of power!'}
                      </div>
                    </div>
                  )}

                  {/* 4. Pythagoras Dynamic Triangle */}
                  {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'समकोण त्रिभुज SVG दृश्य' : 'Live SVG Right-Triangle Render'}
                      </span>
                      
                      <div className="relative h-32 flex items-center justify-center bg-white border border-gray-100 rounded-xl px-2">
                        <svg width="220" height="120" viewBox="0 0 220 120" className="overflow-visible">
                          {(() => {
                            const startX = 60;
                            const startY = 100;
                            const widthPx = Math.min(sideA * 8.5, 140);
                            const heightPx = Math.min(sideB * 5.5, 80);
                            
                            const ptBaseCorner = `${startX},${startY}`;
                            const ptTop = `${startX},${startY - heightPx}`;
                            const ptRight = `${startX + widthPx},${startY}`;
                            
                            return (
                              <>
                                <polygon 
                                  points={`${ptBaseCorner} ${ptTop} ${ptRight}`} 
                                  fill="#FAF8F4" 
                                  stroke="#3D405B" 
                                  strokeWidth="2.5"
                                  strokeLinejoin="round"
                                />
                                
                                <rect x={startX} y={startY - 8} width="8" height="8" fill="none" stroke="#E07A5F" strokeWidth="1" />

                                <text x={startX - 22} y={startY - (heightPx / 2) + 3} fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#333">
                                  b={sideB}
                                </text>

                                <text x={startX + (widthPx / 2) - 8} y={startY + 15} fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#333">
                                  a={sideA}
                                </text>

                                <text x={startX + (widthPx / 2) + 5} y={startY - (heightPx / 2) - 5} fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#E07A5F">
                                  c={hypotenuse.toFixed(1)}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'भारतीय राजमिस्त्रियों का गुनिया नियम 3:4:5 अनुपात पर आधारित है, क्योंकि 3² + 4² = 5²।'
                          : 'Indian builders utilize the exact 3:4:5 ratio as a simple geometric standard to square foundations perfectly!'}
                      </div>
                    </div>
                  )}

                  {/* 5. Trigonometry Heights & Distances */}
                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'उन्नयन कोण और ऊँचाई प्रोजेक्शन' : 'Angle of Elevation Visualized'}
                      </span>
                      
                      <div className="relative h-36 flex items-center justify-center bg-white border border-gray-100 rounded-xl overflow-hidden px-2">
                        <svg width="240" height="130" viewBox="0 0 240 130" className="overflow-visible">
                          {(() => {
                            const widthPx = distance * 5;
                            const heightPx = computedHeight * 5;
                            const towerX = 30 + widthPx;
                            const towerTopY = Math.max(10, 110 - heightPx);

                            return (
                              <>
                                <line x1="10" y1="110" x2="230" y2="110" stroke="#bbb" strokeWidth="1.5" />
                                <text x="20" y="105" fontSize="20">🧑‍🎓</text>
                                <g transform={`translate(${towerX - 10}, ${towerTopY})`}>
                                  <rect x="2" y="0" width="16" height={110 - towerTopY} fill="#FAF8F4" stroke="#3D405B" strokeWidth="2" />
                                  <line x1="10" y1="0" x2="10" y2="-10" stroke="#E07A5F" strokeWidth="2" />
                                  <circle cx="10" cy="-10" r="3" fill="#E07A5F" />
                                  <rect x="5" y="10" width="10" height="5" fill="#3D405B" opacity="0.3" />
                                  <rect x="5" y="25" width="10" height="5" fill="#3D405B" opacity="0.3" />
                                </g>

                                <line x1="30" y1="95" x2={towerX} y2={towerTopY} stroke="#E07A5F" strokeWidth="2" strokeDasharray="4,3" />
                                <path d={`M 30 115 L ${towerX} 115`} stroke="#3D405B" strokeWidth="1" />
                                <text x={30 + widthPx / 2 - 15} y="125" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                  d={distance}m
                                </text>

                                <path d={`M ${towerX + 10} ${towerTopY} L ${towerX + 10} 110`} stroke="#E07A5F" strokeWidth="1" />
                                <text x={towerX + 15} y={towerTopY + (110 - towerTopY) / 2 + 4} fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#E07A5F">
                                  h={computedHeight.toFixed(1)}m
                                </text>

                                <path d={`M 45 110 A 15 15 0 0 0 ${30 + 14.5} 104`} fill="none" stroke="#E07A5F" strokeWidth="1.5" />
                                <text x="48" y="106" fontSize="8" fontWeight="bold" fill="#E07A5F" fontFamily="monospace">
                                  {elevationAngle}°
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'कोण (θ) या दूरी (d) बढ़ाने पर मीनार की आनुमानिक ऊँचाई भी बढ़ जाती है!'
                          : 'Increasing angle (θ) or walking further away updates the dynamic heights & distances model!'}
                      </div>
                    </div>
                  )}

                  {/* 6. Quadratic Equation Plotter */}
                  {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'परवलय आरेख (Parabola curve) SVG' : 'Parabola Graph Plotter'}
                      </span>
                      
                      <div className="relative h-32 flex items-center justify-center bg-white border border-gray-100 rounded-xl p-2 overflow-hidden">
                        <svg width="220" height="110" viewBox="0 0 220 110" className="overflow-visible">
                          {(() => {
                            const originX = 110;
                            const originY = 55;
                            const scaleX = 12;
                            const scaleY = 6;
                            const points: string[] = [];
                            for (let x = -8; x <= 8; x += 0.5) {
                              const y = coeffA * x * x + coeffB * x + coeffC;
                              const svgX = originX + x * scaleX;
                              const svgY = originY - y * scaleY;
                              if (svgY >= 5 && svgY <= 105 && svgX >= 5 && svgX <= 215) {
                                points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                              }
                            }
                            const polylinePoints = points.join(" ");

                            return (
                              <>
                                <line x1="5" y1={originY} x2="215" y2={originY} stroke="#eee" strokeWidth="1.5" />
                                <line x1={originX} y1="5" x2={originX} y2="105" stroke="#eee" strokeWidth="1.5" />
                                
                                {/* Axis ticks */}
                                <circle cx={originX} cy={originY} r="2" fill="#3D405B" />
                                
                                {/* Label for Origin */}
                                <text x={originX + 4} y={originY + 11} fontSize="7" fill="#888">0</text>
                                
                                {/* Parabola Curve */}
                                {polylinePoints && (
                                  <polyline 
                                    points={polylinePoints} 
                                    fill="none" 
                                    stroke="#E07A5F" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round"
                                  />
                                )}

                                {/* Real Roots markers on the graph if any */}
                                {rootsInfo.hasReal && (() => {
                                  const r1Val = parseFloat(rootsInfo.r1);
                                  const r2Val = parseFloat(rootsInfo.r2);
                                  const svgR1X = originX + (r1Val * scaleX);
                                  const svgR2X = originX + (r2Val * scaleX);

                                  return (
                                    <>
                                      {svgR1X >= 5 && svgR1X <= 215 && (
                                        <g>
                                          <circle cx={svgR1X} cy={originY} r="4" fill="#3D405B" stroke="white" strokeWidth="1" />
                                          <text x={svgR1X - 8} y={originY - 6} fontSize="7" fontWeight="bold" fill="#3D405B">r₁</text>
                                        </g>
                                      )}
                                      {svgR2X >= 5 && svgR2X <= 215 && Math.abs(svgR1X - svgR2X) > 5 && (
                                        <g>
                                          <circle cx={svgR2X} cy={originY} r="4" fill="#3D405B" stroke="white" strokeWidth="1" />
                                          <text x={svgR2X - 8} y={originY - 6} fontSize="7" fontWeight="bold" fill="#3D405B">r₂</text>
                                        </g>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'गुणांक a ऋणात्मक (-) होने पर परवलय नीचे की तरफ घूमता है, धनात्मक (+) होने पर ऊपर की तरफ!'
                          : 'If "a" is positive, the parabola opens upward. If "a" is negative, it opens downward!'}
                      </div>
                    </div>
                  )}

                  {/* COMMON DYNAMIC INSIGHT TEXT BOX */}
                  <div className="bg-white border border-gray-150 rounded-xl p-3.5 text-left text-xs text-gray-750 font-sans leading-relaxed shadow-3xs">
                    <div className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E07A5F]"></span>
                      {lang === 'hi' ? 'अवधारणा की समझ (Physical Insight)' : 'Academic Concept Insight'}
                    </div>
                    {activeEqInfo.explanation}
                    <div className="mt-2 text-gray-650 pt-2 border-t border-gray-100 text-[11px]">
                      {activeEqInfo.intuition}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            
            // SPECIAL DETACHED CHEMISTRY GAME (Rendered only when Science -> Chemistry is selected)
            <div id="chemistry-balancing-lab" className="bg-white rounded-3xl border border-gray-150 shadow-2xs overflow-hidden">
              
              <div className="bg-[#FAF8F4] border-b border-gray-150 p-5 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-55 text-amber-900 rounded-xl">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#E07A5F] tracking-wider block">
                      {lang === 'hi' ? 'इंटरैक्टिव गतिविधि' : 'Interactive Lab Activity'}
                    </span>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-gray-900">
                      {lang === 'hi' ? 'रासायनिक समीकरण संतुलित करें' : 'Balance the Chemical Equation'}
                    </h3>
                  </div>
                </div>
                <div className="bg-white/95 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-800 flex items-center gap-1.5 shadow-3xs">
                  <span>🌟</span>
                  <span>{lang === 'hi' ? 'बोनस: अंक अर्जित करें' : 'Earn Study Points'}</span>
                </div>
              </div>

              <div className="p-6 space-y-6 text-left">
                <p className="text-xs text-gray-650 font-sans leading-relaxed">
                  {lang === 'hi'
                    ? 'अभिकारकों (Reactants) और उत्पादों (Products) के प्रत्येक तत्व के कुल परमाणुओं को समान बनाने के लिए सही पूर्णांक (Coefficients) भरें।'
                    : 'Type in the correct integers to balance the elements on both sides of the reaction arrow.'}
                </p>

                {/* LEVEL CONTROLLERS */}
                <div className="flex flex-wrap gap-2">
                  {chemicalQuestions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setActiveChemIndex(idx)}
                      className={`px-4 py-2 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                        activeChemIndex === idx
                          ? 'bg-emerald-650 text-white border-transparent shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-150 border border-gray-200'
                      }`}
                    >
                      {lang === 'hi' ? `अभ्यास ${idx + 1}: ` : `Reaction ${idx + 1}: `} {q.reactionName}
                    </button>
                  ))}
                </div>

                {/* REACTION FORMULA EDITOR PANEL */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-inner py-8">
                  
                  {scoreNotification && (
                    <div className="w-full max-w-md bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold text-center animate-bounce">
                      {scoreNotification}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-4 text-gray-800 font-mono font-black text-xl sm:text-2xl select-none">
                    
                    {/* Reactants loop */}
                    {activeQuestion.reactants.map((reactant, rIdx) => (
                      <React.Fragment key={`react-${rIdx}`}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="9"
                            placeholder="?"
                            value={chemInputs[rIdx]}
                            onChange={(e) => {
                              const copy = [...chemInputs];
                              copy[rIdx] = e.target.value;
                              setChemInputs(copy);
                            }}
                            className={`w-10 h-10 rounded-xl text-center border-2 font-mono font-extrabold text-sm sm:text-base focus:outline-none transition-all ${
                              chemStatus === 'success'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : chemStatus === 'incorrect'
                                ? 'border-rose-300 bg-rose-50 text-rose-600'
                                : 'border-slate-300 focus:border-[#E07A5F] bg-white'
                            }`}
                          />
                          <span className="bg-white/80 border border-slate-150 px-2.5 py-1 rounded-xl text-sm sm:text-base text-slate-800 font-bold shadow-3xs">
                            {reactant}
                          </span>
                        </div>
                        
                        {rIdx < activeQuestion.reactants.length - 1 && (
                          <span className="text-slate-400 font-sans text-lg">+</span>
                        )}
                      </React.Fragment>
                    ))}

                    <span className="text-[#E07A5F] px-1 font-sans text-xl sm:text-2xl">➔</span>

                    {/* Products loop */}
                    {activeQuestion.products.map((product, pIdx) => {
                      const idxInCorrectList = activeQuestion.reactants.length + pIdx;
                      return (
                        <React.Fragment key={`prod-${pIdx}`}>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="9"
                              placeholder="?"
                              value={chemInputs[idxInCorrectList]}
                              onChange={(e) => {
                                const copy = [...chemInputs];
                                copy[idxInCorrectList] = e.target.value;
                                setChemInputs(copy);
                              }}
                              className={`w-10 h-10 rounded-xl text-center border-2 font-mono font-extrabold text-sm sm:text-base focus:outline-none transition-all ${
                                chemStatus === 'success'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : chemStatus === 'incorrect'
                                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                                  : 'border-slate-300 focus:border-[#E07A5F] bg-white'
                              }`}
                            />
                            <span className="bg-white/80 border border-slate-150 px-2.5 py-1 rounded-xl text-sm sm:text-base text-slate-800 font-bold shadow-3xs">
                              {product}
                            </span>
                          </div>
                          
                          {pIdx < activeQuestion.products.length - 1 && (
                            <span className="text-slate-400 font-sans text-lg">+</span>
                          )}
                        </React.Fragment>
                      );
                    })}

                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={checkChemicalAnswer}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-sans text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{lang === 'hi' ? 'समीकरण जांचें' : 'Validate Equation'}</span>
                    </button>

                    <button
                      onClick={resetChemicalGame}
                      className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-full font-sans text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{lang === 'hi' ? 'रीसेट' : 'Reset'}</span>
                    </button>
                  </div>
                </div>

                {/* STUDY GUIDE HELPER */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 flex gap-3">
                  <div className="p-1 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-sans font-bold text-xs text-amber-800 block">
                      {lang === 'hi' ? 'समीकरण संतुलित कैसे करें?' : 'Need Help Balancing?'}
                    </span>
                    <p className="text-xs text-gray-650 leading-relaxed">
                      {activeQuestion.hint}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
      ) : (
        /* AI SOLVER CHATBOT WORKSPACE */
        <div className="bg-white rounded-3xl border border-gray-150 shadow-2xs overflow-hidden flex flex-col lg:flex-row h-[620px] sm:h-[650px] animate-fade-in">
          
          {/* MAIN CHAT WORKSPACE (LHS) */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100">
            
            {/* CHAT HEADER */}
            <div className="border-b border-gray-100 p-4 bg-gray-50/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-[#E07A5F] rounded-2xl border border-rose-100 flex items-center justify-center shadow-3xs">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-extrabold text-sm text-gray-900 leading-snug">
                    {chatbotLang === 'hi' ? 'एआई गणित और विज्ञान सॉल्वर' : chatbotLang === 'gu' ? 'AI ગણિત અને વિજ્ઞાન સોલ્વર' : chatbotLang === 'mr' ? 'AI गणित आणि विज्ञान सॉल्वर' : chatbotLang === 'bn' ? 'AI গণিত ও বিজ্ঞান সমাধানকারী' : chatbotLang === 'ta' ? 'AI கணிதம் & அறிவியல் தீர்வு' : chatbotLang === 'te' ? 'AI గణితం & సైన్స్ సాల్వర్' : 'AI Math & Science Calculations Solver'}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    {chatbotLang === 'hi' ? 'सक्रिय सॉल्वर इंजन' : chatbotLang === 'gu' ? 'સક્રિય સોલ્વર એન્જિન' : chatbotLang === 'mr' ? 'सक्रिय सॉલ્वर इंजिन' : chatbotLang === 'bn' ? 'সক্রিয় সমাধানকারী ইঞ্জিন' : chatbotLang === 'ta' ? 'செயலில் உள்ள தீர்வு எஞ்சின்' : chatbotLang === 'te' ? 'క్రియాశీల సాల్వర్ ఇంజిన్' : 'Active Solver Engine Online'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                {/* Search History Toggle button */}
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`text-[11px] sm:text-xs border px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    showHistory 
                      ? 'bg-[#FAF8F4] text-[#3D405B] border-[#F2CC8F]' 
                      : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-200'
                  }`}
                  title={showHistory 
                    ? translations.chatButton
                    : translations.searchHistory}
                >
                  <BookOpen className={`h-3.5 w-3.5`} style={{color: showHistory ? '#E07A5F' : '#3D405B'}} />
                  <span>
                    {showHistory 
                      ? translations.activeChat
                      : translations.searchHistory}
                  </span>
                </button>

                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleNewChat();
                    setShowHistory(false);
                  }}
                  className="text-[11px] sm:text-xs bg-[#E07A5F] hover:bg-[#CE6B50] text-white border border-transparent px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  title={translations.newChat}
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span>{translations.newChat}</span>
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES STREAM OR HISTORY PANEL */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white/50 min-h-0">
              {showHistory ? (
                /* INLINE FULL SEARCH HISTORY VIEW WITH NATIVE CHAT BUBBLES */
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="bg-white border border-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-3xs shrink-0">
                    <div>
                      <h3 className="font-display font-extrabold text-sm text-[#3D405B] flex items-center gap-2">
                        <BookOpen className="h-4.5 w-4.5 text-[#E07A5F]" />
                        <span>{translations.entireHistoryTitle}</span>
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {translations.entireHistoryDesc}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                      {solverSessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const isHi = chatbotLang === 'hi';
                            const confirmMsg = isHi 
                              ? "क्या आप सचमुच पूरा इतिहास मिटाना चाहते हैं?" 
                              : "Are you sure you want to permanently clear all solver history?";
                            if (confirm(confirmMsg)) {
                              setSolverSessions([]);
                              setActiveSessionId(null);
                              handleNewChat();
                            }
                          }}
                          className="text-[10px] sm:text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{translations.clearHistory}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowHistory(false)}
                        className="text-[10px] sm:text-xs bg-[#3D405B] hover:bg-[#2D2F44] text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all active:scale-95"
                      >
                        {translations.chatButton}
                      </button>
                    </div>
                  </div>

                  {solverSessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-sans bg-white rounded-2xl border border-gray-150 p-6 flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📚</span>
                      <p className="font-bold">{translations.noHistory}</p>
                      <p className="text-[10px] text-gray-400">{translations.noHistorySub}</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {solverSessions.map((session) => (
                        <div key={session.id} className="space-y-4">
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
                                type="button"
                                onClick={() => {
                                  setExpandedSessions(prev => ({
                                    ...prev,
                                    [session.id]: !prev[session.id]
                                  }));
                                }}
                                className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#E07A5F] hover:text-[#CE6B50] font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 active:scale-95 shadow-3xs"
                              >
                                {expandedSessions[session.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                <span>{expandedSessions[session.id] ? translations.hideButton : translations.viewButton}</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleLoadSession(session)}
                                className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#81B29A] hover:text-[#5fa383] font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 active:scale-95 shadow-3xs"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{translations.restoreButton}</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="flex items-center gap-1.5 text-[10px] sm:text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100 active:scale-95"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{translations.deleteButton}</span>
                              </button>
                            </div>
                          </div>

                          {/* Render Messages in exact native bubble styling, collapsible */}
                          {expandedSessions[session.id] && (
                            <div className="space-y-4 pl-1 sm:pl-3 border-t border-gray-150/40 pt-3 animate-fade-in">
                              {session.messages
                                .filter(msg => msg.sender === 'user' || (msg.sender === 'bot' && !msg.id.startsWith('welcome')))
                                .map((msg, idx) => {
                                  const isMe = msg.sender === 'user';
                                  return (
                                    <div 
                                      key={msg.id || idx}
                                      className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                                    >
                                      {/* Sender Avatar indicator */}
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                        isMe 
                                          ? 'bg-[#3D405B] text-white font-mono' 
                                          : 'bg-rose-100 text-[#E07A5F]'
                                      }`}>
                                        {isMe ? 'U' : 'Owl'}
                                      </div>

                                      {/* Bubble content */}
                                      <div className="space-y-1">
                                        <div className={`p-4 rounded-2xl relative shadow-3xs text-xs sm:text-sm text-left border ${
                                          isMe 
                                            ? 'bg-[#E07A5F] text-white rounded-tr-none' 
                                            : 'bg-slate-50 border-slate-150 rounded-tl-none'
                                        }`}>
                                          {msg.attachmentName && (
                                            <div className={`mb-3 p-2 rounded-xl flex items-center gap-2 max-w-xs text-xs font-mono font-bold ${
                                              isMe 
                                                ? 'bg-white/10 border border-white/15 text-white' 
                                                : 'bg-white border border-slate-150 text-slate-700'
                                            }`}>
                                              <span>{msg.attachmentType === 'pdf' ? '📄' : '🖼️'}</span>
                                              <span className="truncate flex-1">{msg.attachmentName}</span>
                                            </div>
                                          )}
                                          
                                          {msg.attachmentUrl && (
                                            <div className="mb-3 max-w-xs overflow-hidden rounded-xl border border-gray-100 shadow-3xs bg-white">
                                              <img src={msg.attachmentUrl} alt="Problem attachment" className="max-h-40 w-auto object-contain mx-auto" referrerPolicy="no-referrer" />
                                            </div>
                                          )}

                                          <div className="space-y-1.5 break-words">
                                            {isMe ? (
                                              <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            ) : (
                                              formatMessageText(msg.text)
                                            )}
                                          </div>
                                          
                                          <div className={`text-[9px] font-mono mt-2 text-right ${isMe ? 'text-white/70' : 'text-gray-450'}`}>
                                            {msg.timestamp}
                                          </div>

                                          {/* Action buttons (Download PDF, Copy Plain Text) inside bot box */}
                                          {!isMe && (
                                            <div className="absolute -bottom-3 -right-1 flex items-center gap-1 bg-white p-0.5 rounded-full border border-gray-150 shadow-xs z-10">
                                              <button
                                                type="button"
                                                onClick={() => exportMessageToPDF(msg)}
                                                className="p-1 rounded-full text-xs text-blue-600 hover:bg-slate-50 cursor-pointer transition-all"
                                                title={lang === 'hi' ? "समाधान PDF डाउनलोड करें" : "Download Solution PDF"}
                                              >
                                                <FileDown className="h-3.5 w-3.5" />
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => copyMessageToClipboard(msg)}
                                                className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                                                  copiedMessageId === msg.id 
                                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                                    : 'text-gray-500 hover:bg-slate-50'
                                                }`}
                                                title={copiedMessageId === msg.id 
                                                  ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') 
                                                  : (lang === 'hi' ? 'प्लेन टेक्स्ट कॉपी करें' : 'Copy Plain Text')}
                                              >
                                                {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            </div>
                                          )}
                                        </div>
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
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Sender Avatar indicator */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === 'user' 
                        ? 'bg-[#3D405B] text-white font-mono' 
                        : 'bg-rose-100 text-[#E07A5F]'
                    }`}>
                      {msg.sender === 'user' ? 'U' : 'Owl'}
                    </div>

                    <div className={`p-4 rounded-2xl text-left shadow-3xs relative ${
                      msg.sender === 'user'
                        ? 'bg-[#E07A5F] text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-150 rounded-tl-none'
                    }`}>
                      {/* Attachment description pill */}
                      {msg.attachmentName && (
                        <div className={`mb-3 p-2 rounded-xl flex items-center gap-2 max-w-xs text-xs font-mono font-bold ${
                          msg.sender === 'user' 
                            ? 'bg-white/10 border border-white/15 text-white' 
                            : 'bg-white border border-slate-150 text-slate-700'
                        }`}>
                          <span>{msg.attachmentType === 'pdf' ? '📄' : '🖼️'}</span>
                          <span className="truncate flex-1">{msg.attachmentName}</span>
                        </div>
                      )}
                      
                      {/* Image Preview attachment */}
                      {msg.attachmentUrl && (
                        <div className="mb-3 max-w-xs overflow-hidden rounded-xl border border-gray-100 shadow-3xs bg-white">
                          <img src={msg.attachmentUrl} alt="Problem attachment" className="max-h-40 w-auto object-contain mx-auto" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      <div className="space-y-1.5 break-words">
                        {msg.sender === 'user' ? (
                          <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        ) : (
                          formatMessageText(msg.text)
                        )}
                      </div>
                      
                      <div className={`text-[9px] font-mono mt-2 text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-450'}`}>
                        {msg.timestamp}
                      </div>

                      {/* Action buttons (Download PDF, Copy Plain Text) inside bot box */}
                      {msg.sender === 'bot' && (
                        <div className="absolute -bottom-3 -right-1 flex items-center gap-1 bg-white p-0.5 rounded-full border border-gray-150 shadow-xs z-10">
                          <SpeakButton
                            text={msg.text}
                            lang={chatbotLang as LanguageCode}
                            size="sm"
                            className="!bg-transparent !border-0 !shadow-none hover:!bg-slate-50 text-emerald-600"
                          />

                          <button
                            type="button"
                            onClick={() => exportMessageToPDF(msg)}
                            className="p-1 rounded-full text-xs text-blue-600 hover:bg-slate-50 cursor-pointer transition-all"
                            title={lang === 'hi' ? "समाधान PDF डाउनलोड करें" : "Download Solution PDF"}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyMessageToClipboard(msg)}
                            className={`p-1 rounded-full text-xs cursor-pointer transition-all ${
                              copiedMessageId === msg.id 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-slate-50'
                            }`}
                            title={copiedMessageId === msg.id 
                              ? (lang === 'hi' ? 'कॉपी हो गया!' : 'Copied!') 
                              : (lang === 'hi' ? 'प्लेन टेक्स्ट कॉपी करें' : 'Copy Plain Text')}
                          >
                            {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Loader indicator */}
              {!showHistory && isSending && (
                <div className="flex gap-3 max-w-[85%] animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-rose-100 text-[#E07A5F] flex items-center justify-center shrink-0 text-xs">
                    Owl
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl rounded-tl-none text-left shadow-3xs flex items-center gap-3">
                    <span className="animate-spin text-[#E07A5F] text-sm">⏳</span>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {translations.solvingText || (lang === 'hi' ? 'गणना कर रहा हूँ और समस्या का समाधान ढूंढ रहा हूँ...' : 'Solving calculation and processing worksheet...')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE ATTACHMENT SELECTION CONTAINER */}
            {!showHistory && selectedFile && (
              <div className="px-5 py-2.5 bg-amber-50/80 border-t border-amber-100 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-lg">
                    {selectedFile.mimeType.includes('pdf') ? '📄' : '🖼️'}
                  </div>
                  <div>
                    <span className="text-xs font-sans font-bold text-gray-800 block truncate max-w-[200px] sm:max-w-md">
                      {selectedFile.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-700 uppercase">
                      {selectedFile.mimeType.split('/').pop() || 'File'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-gray-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* CHAT INPUT FORM */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/60">
              {showHistory ? (
                <div className="py-2 text-center text-xs text-gray-500 font-sans">
                  {lang === 'hi' 
                    ? "आप वर्तमान में इतिहास देख रहे हैं। एआई सॉल्वर से बात करने के लिए ऊपर 'सक्रिय चैट' पर क्लिक करें।" 
                    : "You are currently viewing history. Click 'Active Chat' above to message the AI Solver."}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Formatting Toolbar */}
                  <div className="flex flex-col gap-1 text-left select-none bg-white p-2 rounded-xl border border-gray-150 shadow-3xs">
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider select-none pb-1 border-b border-gray-100 mb-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <span>📝</span> Formatting Helper:
                      </span>
                      <span className="text-[8px] text-gray-400 font-normal italic lowercase hidden sm:inline">
                        scroll vertically to see all symbols
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 max-h-[44px] overflow-y-auto pr-1">
                      {FORMULA_SYMBOLS.map((sym, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (sym.type === 'super') {
                              applyFormatting('super');
                            } else if (sym.type === 'sub') {
                              applyFormatting('sub');
                            } else {
                              applyFormatting('symbol', sym.char);
                            }
                          }}
                          title={sym.desc}
                          className="py-1 bg-gray-50 hover:bg-[#FAF8F4] active:bg-amber-50 border border-gray-200 hover:border-[#F2CC8F]/60 text-[11px] text-gray-700 font-bold rounded transition-all cursor-pointer text-center"
                        >
                          {sym.label || sym.char}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Hidden File Picker and Custom Label */}
                    <label className="p-3 bg-white border border-gray-200 hover:border-[#E07A5F] hover:bg-rose-50/30 text-gray-500 hover:text-[#E07A5F] rounded-2xl transition-all shadow-3xs cursor-pointer flex items-center justify-center shrink-0">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Paperclip className="h-5 w-5" />
                    </label>

                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          selectedFile
                            ? (translations.placeholderFile || "Ask a query about this file...")
                            : (translations.placeholder || "Type math equations, balance formulas, or select files...")
                        }
                        className="w-full bg-white border border-gray-200 focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F] rounded-2xl pl-4 pr-12 py-3.5 text-xs sm:text-sm focus:outline-none transition-all placeholder-gray-450 shadow-3xs"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10">
                        <SpeechInputButton
                          lang={chatbotLang as LanguageCode}
                          onTranscript={(text) => setChatInput(prev => prev ? prev + ' ' + text : text)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSending || (!chatInput.trim() && !selectedFile)}
                      className="p-3 bg-[#E07A5F] hover:bg-[#c25f44] text-white rounded-2xl transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-[#E07A5F] cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

          {/* SIDEBAR SUGGESTED PROMPTS / FORMULA SHEET PANEL (RHS) */}
          <div className="w-full lg:w-85 p-5 bg-slate-50/50 flex flex-col gap-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-100 max-h-[600px] lg:max-h-none">
            
            {/* SEGMENTED TAB CONTROLLER */}
            <div className="flex bg-gray-200/80 p-1 rounded-xl border border-gray-300/30 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setSidebarTab('prompts')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'prompts'
                    ? 'bg-white text-gray-900 shadow-3xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {getEqLabel('quickSolves', lang)}
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('formulas')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  sidebarTab === 'formulas'
                    ? 'bg-white text-gray-900 shadow-3xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {getEqLabel('formulaSheet', lang)}
              </button>
            </div>

            {sidebarTab === 'prompts' ? (
              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="text-left border-b border-gray-100 pb-3">
                  <h4 className="text-xs font-mono uppercase font-black text-gray-400 tracking-wider">
                    {getEqLabel('tryQuickSolves', lang)}
                  </h4>
                  <p className="text-[11px] text-gray-550 mt-1 leading-normal">
                    {lang === 'hi'
                      ? 'इन कठिन विषयों और समीकरणों को तुरंत हल करने के लिए किसी भी प्रॉम्प्ट पर क्लिक करें:'
                      : lang === 'gu'
                      ? 'આ મુશ્કેલ વિષયો અને સમીકરણોને ઝડપથી હલ કરવા માટે કોઈપણ પ્રોમ્પ્ટ પર ક્લિક કરો:'
                      : lang === 'mr'
                      ? 'या कठीण विषयांचे आणि समीकरणांचे त्वरित निराकरण करण्यासाठी कोणत्याही प्रॉमप्टवर क्लिक करा:'
                      : lang === 'ta'
                      ? 'இந்த கடினமான தலைப்புகள் மற்றும் சமன்பாடுகளை விரைவாக தீர்க்க ஏதேனும் ஒரு உரையாடலை கிளிக் செய்யவும்:'
                      : lang === 'te'
                      ? 'ఈ కష్టమైన అంశాలు మరియు సమీకరణాలను త్వరగా పరిష్కరించడానికి ఏదైనా ప్రాంప్ట్‌ను క్లిક చేయండి:'
                      : 'Click any interactive prompt to query the calculation engine instantly:'}
                  </p>
                </div>

                {/* ACCORDION/LIST OF PROMPTS */}
                <div className="space-y-4 text-left overflow-y-auto pr-1 flex-1 max-h-[350px]">
                  {/* MATHEMATICS PROMPTS */}
                  <div>
                    <span className="text-[10px] font-mono font-black text-[#E07A5F] uppercase block tracking-wider mb-2">
                      📐 {getEqLabel('mathEquations', lang)}
                    </span>
                    <div className="space-y-1.5">
                      {[
                        "Solve quadratic equation: 3x² - 5x + 2 = 0 showing roots",
                        "How did Indian sages write the Pythagoras theorem (Baudhayan Sutras)?",
                        "Find hypotenuse c if base a = 12 and height b = 5"
                      ].map((q, idx) => (
                        <button
                           key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(q)}
                          disabled={isSending}
                          className="w-full p-2.5 bg-white border border-gray-150 hover:border-[#E07A5F] hover:bg-rose-50/20 rounded-xl text-xs text-gray-700 text-left transition-all hover:shadow-3xs cursor-pointer block truncate font-sans"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SCIENCE PROMPTS */}
                  <div>
                    <span className="text-[10px] font-mono font-black text-[#E07A5F] uppercase block tracking-wider mb-2">
                      🧪 {getEqLabel('physicsEquations', lang)}
                    </span>
                    <div className="space-y-1.5">
                      {[
                        "Balance the equation: Fe + O₂ ➔ Fe₂O₃ and explain rules",
                        "Explain Ohm's Law V = IR using a water flow analogy",
                        "If a 15kg school block accelerates at 6m/s², find force (F = ma)"
                      ].map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(q)}
                          disabled={isSending}
                          className="w-full p-2.5 bg-white border border-gray-150 hover:border-[#E07A5F] hover:bg-rose-50/20 rounded-xl text-xs text-gray-700 text-left transition-all hover:shadow-3xs cursor-pointer block truncate font-sans"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* THE COMPLETE FORMULA SHEET */
              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="border-b border-gray-100 pb-2.5">
                  <h4 className="text-xs font-mono uppercase font-black text-gray-400 tracking-wider">
                    {getEqLabel('mathAndScienceFormulae', lang)}
                  </h4>
                  <p className="text-[11px] text-gray-550 mt-1 leading-normal">
                    {lang === 'hi'
                      ? 'नीचे दिए गए किसी भी महत्वपूर्ण समीकरण को चैट में डालने या एआई से तुरंत हल कराने के लिए चुनें:'
                      : lang === 'gu'
                      ? 'ચેટમાં દાખલ કરવા અથવા AI દ્વારા તરત જ હલ કરવા માટે નીચે આપેલા કોઈપણ મહત્વપૂર્ણ સમીકરણો પસંદ કરો:'
                      : lang === 'mr'
                      ? 'खालीलपैकी कोणतेही महत्त्वाचे समीकरण चॅटमध्ये टाकण्यासाठी किंवा एआय द्वारे त्वरित सोडवण्यासाठी निवडा:'
                      : lang === 'ta'
                      ? 'சாட்டில் நுழைக்க அல்லது AI மூலம் உடனடியாக தீர்க்க கீழே உள்ள ஏதேனும் முக்கிய சமன்பாட்டைத் தேர்ந்தெடுக்கவும்:'
                      : lang === 'te'
                      ? 'చాట్‌లో చేర్చడానికి లేదా AI ద్వారా తక్షణమే పరిష్కరించడానికి దిగువ పేర్కొన్న ఏదైనా ముఖ్యమైన సమీకరణాన్ని ఎంచుకోండి:'
                      : 'Choose any complete key formula to auto-insert or solve instantly with AI:'}
                  </p>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[350px]">
                  {/* Category physics */}
                  <div>
                    <span className="text-[10px] font-mono font-black text-rose-500 uppercase block tracking-wider mb-2">
                      ⚡ {getEqLabel('physicsEquations', lang)}
                    </span>
                    <div className="space-y-2">
                      {formulasCatalog.filter(f => f.category === 'physics').map((f, i) => {
                        const loc = getFormulaLocalized(f, lang);
                        return (
                          <div key={i} className="p-3 bg-white border border-gray-150 rounded-2xl hover:border-[#E07A5F] transition-all hover:shadow-3xs">
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-bold text-gray-800 font-sans block leading-snug">
                                {loc.name}
                              </span>
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-mono font-bold uppercase shrink-0">
                                Physics
                              </span>
                            </div>
                            
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs font-bold text-[#E07A5F] text-center">
                              {f.equation}
                            </div>

                            <p className="text-[10px] text-gray-500 mt-1.5 font-sans leading-normal">
                              {loc.description}
                            </p>

                            <div className="flex gap-1.5 mt-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setChatInput(`${getEqLabel('explainFormulaDetail', lang)}: ${loc.name} (${f.equation})`);
                                }}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              >
                                {getEqLabel('useFormula', lang)}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendMessage(lang === 'hi' 
                                    ? `कृपया मुझे सूत्र ${loc.name} (${f.equation}) का उपयोग करके चरण-दर-चरण गणना का एक अभ्यास प्रश्न और उसका हल दिखाएं।`
                                    : lang === 'gu'
                                    ? `કૃપા કરીને મને સૂત્ર ${loc.name} (${f.equation}) નો ઉપયોગ કરીને વિગતવાર ગણતરી બતાવો.`
                                    : lang === 'mr'
                                    ? `कृपया मला सूत्र ${loc.name} (${f.equation}) चा वापर करून पायरी-पायरीने सोडवलेले उदाहरण दाखवा.`
                                    : lang === 'ta'
                                    ? `தயவுசெய்து சூத்திரம் ${loc.name} (${f.equation}) ஐப் பயன்படுத்தி படிப்படியான தீர்வைக் காட்டுங்கள்.`
                                    : lang === 'te'
                                    ? `దయచేసి ఫార్ములా ${loc.name} (${f.equation}) ఉపయోగించి దశలవారీగా పరిష్కారం చూపించండి.`
                                    : `Please generate a step-by-step example calculation and solution using the formula: ${f.name} (${f.equation}).`);
                                }}
                                disabled={isSending}
                                className="flex-1 py-1.5 px-2 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#E07A5F] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center disabled:opacity-40"
                              >
                                {getEqLabel('aiSolve', lang)}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category chemistry */}
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-500 uppercase block tracking-wider mb-2">
                      🧪 {getEqLabel('chemistryFormulae', lang)}
                    </span>
                    <div className="space-y-2">
                      {formulasCatalog.filter(f => f.category === 'chemistry').map((f, i) => {
                        const loc = getFormulaLocalized(f, lang);
                        return (
                          <div key={i} className="p-3 bg-white border border-gray-150 rounded-2xl hover:border-[#E07A5F] transition-all hover:shadow-3xs">
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-bold text-gray-800 font-sans block leading-snug">
                                {loc.name}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-mono font-bold uppercase shrink-0">
                                Chem
                              </span>
                            </div>
                            
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs font-bold text-[#E07A5F] text-center">
                              {f.equation}
                            </div>

                            <p className="text-[10px] text-gray-500 mt-1.5 font-sans leading-normal">
                              {loc.description}
                            </p>

                            <div className="flex gap-1.5 mt-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setChatInput(`${getEqLabel('explainChemicalFormulaDetail', lang)}: ${loc.name} (${f.equation})`);
                                }}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              >
                                {getEqLabel('useFormula', lang)}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendMessage(lang === 'hi'
                                    ? `कृपया मुझे सूत्र ${loc.name} (${f.equation}) का उपयोग करके चरण-दर-चरण रासायनिक गणना का एक अभ्यास प्रश्न हल करके दिखाएं।`
                                    : lang === 'gu'
                                    ? `કૃપા કરીને મને સૂત્ર ${loc.name} (${f.equation}) નો ઉપયોગ કરીને વિગતવાર રાસાયણિક ઉકેલ બતાવો.`
                                    : lang === 'mr'
                                    ? `कृपया मला रासायनिक सूत्र ${loc.name} (${f.equation}) चा वापर करून सोडवलेले उदाहरण दाखवा.`
                                    : lang === 'ta'
                                    ? `தயவுசெய்து வேதியியல் சூத்திரம் ${loc.name} (${f.equation}) ஐப் பயன்படுத்தி படிப்படியான தீர்வைக் காட்டுங்கள்.`
                                    : lang === 'te'
                                    ? `దయచేసి రసాయన ఫార్ములా ${loc.name} (${f.equation}) ఉపయోగించి దశలవారీగా పరిష్కారం చూపించండి.`
                                    : `Please generate a step-by-step example chemistry calculation and solution using the formula: ${f.name} (${f.equation}).`);
                                }}
                                disabled={isSending}
                                className="flex-1 py-1.5 px-2 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#E07A5F] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center disabled:opacity-40"
                              >
                                {getEqLabel('aiSolve', lang)}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category math */}
                  <div>
                    <span className="text-[10px] font-mono font-black text-emerald-500 uppercase block tracking-wider mb-2">
                      📐 {getEqLabel('mathEquations', lang)}
                    </span>
                    <div className="space-y-2">
                      {formulasCatalog.filter(f => f.category === 'math').map((f, i) => {
                        const loc = getFormulaLocalized(f, lang);
                        return (
                          <div key={i} className="p-3 bg-white border border-gray-150 rounded-2xl hover:border-[#E07A5F] transition-all hover:shadow-3xs">
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-bold text-gray-800 font-sans block leading-snug">
                                {loc.name}
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-mono font-bold uppercase shrink-0">
                                Math
                              </span>
                            </div>
                            
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs font-bold text-[#E07A5F] text-center">
                              {f.equation}
                            </div>

                            <p className="text-[10px] text-gray-500 mt-1.5 font-sans leading-normal">
                              {loc.description}
                            </p>

                            <div className="flex gap-1.5 mt-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setChatInput(`${getEqLabel('explainMathFormulaDetail', lang)}: ${loc.name} (${f.equation})`);
                                }}
                                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              >
                                {getEqLabel('useFormula', lang)}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendMessage(lang === 'hi'
                                    ? `कृपया मुझे सूत्र ${loc.name} (${f.equation}) का उपयोग करके चरण-दर-चरण गणितीय हल का एक उदाहरण दें।`
                                    : lang === 'gu'
                                    ? `કૃપા કરીને મને ગણિત સૂત્ર ${loc.name} (${f.equation}) નો ઉપયોગ કરીને વિગતવાર ઉકેલ આપો.`
                                    : lang === 'mr'
                                    ? `कृपया मला गणितीय सूत्र ${loc.name} (${f.equation}) चा वापर करून पायरी-पायरीने सोडवलेले उदाहरण दाखवा.`
                                    : lang === 'ta'
                                    ? `தயவுசெய்து கணிதச் சூத்திரம் ${loc.name} (${f.equation}) ஐப் பயன்படுத்தி படிப்படியான தீர்வைக் காட்டுங்கள்.`
                                    : lang === 'te'
                                    ? `దయచేసి గణిత ఫార్ములా ${loc.name} (${f.equation}) ఉపయోగించి దశలవారీగా పరిష్కారం చూపించండి.`
                                    : `Please generate a step-by-step math problem and solution using the formula: ${f.name} (${f.equation}).`);
                                }}
                                disabled={isSending}
                                className="flex-1 py-1.5 px-2 bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 text-[#E07A5F] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center disabled:opacity-40"
                              >
                                {getEqLabel('aiSolve', lang)}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEXT MATTERS NOTICE */}
            <div className="mt-auto p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-left text-[11px] text-amber-900 font-sans leading-relaxed shrink-0">
              <span className="font-bold block text-amber-800 mb-0.5">
                📄 {getEqLabel('multiModalSolve', lang)}
              </span>
              {lang === 'hi'
                ? 'आप गृहकार्य, सूत्रों या चित्रों की तस्वीरें खींचकर या अपनी वर्कशीट की पीडीएफ अपलोड करके सीधे सवाल पूछ सकते हैं। एआई उन्हें डिकोड कर पूरा समाधान देगा।'
                : lang === 'gu'
                ? 'તમે હોમવર્ક, સૂત્રો અથવા ચિત્રોના ફોટા પાડીને અથવા તમારી વર્કશીટની પીડીએફ અપલોડ કરીને સીધા પ્રશ્નો પૂછી શકો છો. એઆઈ તેનો ઉકેલ આપશે.'
                : lang === 'mr'
                ? 'तुम्ही गृहपाठ, सूत्रे किंवा चित्रांचे फोटो काढून किंवा तुमच्या वर्कशीटची पीडीएफ अपलोड करून थेट प्रश्न विचारू शकता. एआय पूर्ण उत्तर देईल.'
                : lang === 'ta'
                ? 'வீட்டுப்பாடம், சூத்திரங்கள் அல்லது படங்களின் புகைப்படங்களை எடுப்பதன் மூலம் அல்லது உங்கள் பணித்தாளின் PDF ஐ பதிவேற்றுவதன் மூலம் நீங்கள் நேரடியாக கேள்விகளைக் கேட்கலாம். AI அவற்றுக்கான முழுமையான தீர்வை வழங்கும்.'
                : lang === 'te'
                ? 'మీరు హోంవర్క్, ఫార్ములాలు లేదా చిత్రాల ఫోటోలు తీయడం ద్వారా లేదా మీ వర్క్‌షీట్ పిడిఎఫ్‌ను అప్‌లోడ్ చేయడం ద్వారా నేరుగా ప్రశ్నలు అడగవచ్చు. AI పూర్తి పరిష్కారాన్ని అందిస్తుంది.'
                : 'Upload images of science diagrams, hand-written formulas, or complete PDF worksheets. The AI will parse details and provide step-by-step guidance.'}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
