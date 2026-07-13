import React, { useState, useEffect, FormEvent } from 'react';
import { LanguageCode, User, QuizQuestion, OfflineResource } from '../../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../../data/translations';
import { offlineSyncManager } from '../../utils/offlineSync';
import { fireContinuousFireworks, fireConfetti } from '../../utils/confetti';
import SpeakButton from '../SpeakButton';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import SlideVisualBoard from './SlideVisualBoard';
import { speakText, stopSpeaking, cleanTextForTTS, detectLanguageOfText, splitTextIntoTTSChunks } from '../../utils/speech';
import { 
  Play, BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Volume2, Search, Sparkles, Smile, Video, ArrowLeft, RefreshCw,
  ChevronLeft, Pause, Eye, MonitorPlay, Paperclip, FileText, X, FileUp,
  Trash2, Clock, History, ExternalLink, Star
} from 'lucide-react';

interface LessonQuery {
  id: string;
  query: string;
  subject: string;
  explanation: string;
  videoThumbColor: string;
  avatarChar: string;
  avatarName: string;
  quiz: QuizQuestion[];
  slides?: any[];
  starred?: boolean;
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
      explanation: "જ્યાર સૂર્યની ગરમીથી નદીઓ અને તળાવનું પાણી ગરમ થાય છે, ત્યારે તેનું વરાળમાં રૂપાંતર થાય છે. આ વરાળ આકાશમાં ઊંચે જઈને ભેગી થાય છે અને વાદળાં બને છે! જ્યારે આ વાદળ ઠંડા અને પાણીના ટીપાંથી ભારે થઈ જાય છે, ત્યારે તે પૃથ્વી પર વરસાદ તરીકે પડે છે!",
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
  mr: [
    {
      id: 'rain',
      query: "ढग पाऊस कसा पाडतात?",
      subject: "विज्ञान 🔬",
      avatarChar: "👵 दादी AI",
      avatarName: "दादी AI (गावातील अनुभवी)",
      explanation: "जेव्हा सूर्य नद्या आणि तलावांचे पाणी गरम करतो, तेव्हा त्याचे रूपांतर वाफेमध्ये होते. ही वाफ आकाशात वर जाऊन एकत्र होते आणि ढग तयार असतात! जेव्हा हे ढग खूप थंड आणि पाण्याच्या थेंबांनी जड होतात, तेव्हा ते जमिनीवर पाऊस म्हणून पडतात! यालाच जलचक्र म्हणतात.",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "तलावातील पाणी गरम करून वाफ बनवण्याचे काम कोण करते?",
          options: ["चंद्र", "सूर्य", "मोठे पंखे", "वारा"],
          answerIndex: 1,
          explanation: "सूर्याच्या तीव्र उष्णतेमुळे पाणी गरम होऊन वाफेमध्ये बदलते."
        },
        {
          id: 'q2',
          question: "वाफ थंड झाल्यावर काय तयार होते?",
          options: ["माती", "ढग", "दगड", "कोळसा"],
          answerIndex: 1,
          explanation: "वर गेलेली वाफ थंड हवेच्या संपर्कात आल्यावर त्याचे ढग बनतात."
        }
      ]
    },
    {
      id: 'photo',
      query: "प्रकाशसंश्लेषण म्हणजे काय?",
      subject: "विज्ञान 🔬",
      avatarChar: "🤖 स्वामी AI",
      avatarName: "स्वामी AI (स्मार्ट सोबती)",
      explanation: "प्रकाशसंश्लेषण म्हणजे वनस्पतींची स्वतःचे अन्न तयार करण्याची पद्धत! हिरवी पाने सूर्यप्रकाश, जमिनीतील पाणी आणि हवेतील कार्बन डायऑक्साइड शोषून घेऊन क्लोरोफिलच्या मदतीने अन्न तयार करतात आणि आपल्याला श्वास घेण्यासाठी शुद्ध ऑक्सिजन देतात!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "वनस्पती अन्न तयार करताना कोणती वायू हवेत सोडतात?",
          options: ["कार्बन डायऑक्साइड", "ऑक्सिजन", "धूर", "नायट्रोजन"],
          answerIndex: 1,
          explanation: "वनस्पती हवेतील कार्बन डायऑक्साइड शोषून घेऊन हवेमध्ये शुद्ध ऑक्सिजन सोडतात."
        }
      ]
    }
  ],
  ta: [
    {
      id: 'rain',
      query: "மேகங்கள் எவ்வாறு மழையை உருவாக்குகின்றன?",
      subject: "Science 🔬",
      avatarChar: "👵 பாட்டி AI",
      avatarName: "பாட்டி AI (கிராமத்து மூத்தவர்)",
      explanation: "சூரிய வெப்பத்தால் ஏரிகள் மற்றும் ஆறுகளிலுள்ள நீர் சூடாகி நீராவியாக மாறி வான்வெளிக்கு மேலே சென்று மேகங்களை உருவாக்குகிறது. மேகங்கள் குளிர்ந்து கனமாகும்போது மழையாகப் பொழிகிறது!",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "மேகம் குளிர்ந்து கனமாகும்போது என்னவாகப் பொழிகிறது?",
          options: ["மழை", "பனி", "காற்று", "வெப்பம்"],
          answerIndex: 0,
          explanation: "மேகம் குளிர்ந்து கனமாகும்போது மழையாகப் பொழிகிறது."
        }
      ]
    },
    {
      id: 'photo',
      query: "தாவரங்களின் ஒளிச்சேர்க்கை என்றால் என்ன?",
      subject: "Science 🔬",
      avatarChar: "🤖 சுவாமி AI",
      avatarName: "சுவாமி AI (ஸ்மார்ட் தோழர்)",
      explanation: "தாவரங்கள் சூரிய ஒளி, நீர், மற்றும் பச்சையம் ஆகியவற்றைப் பயன்படுத்தி தங்களுக்குத் தேவையான உணவைத் தயாரிக்கும் முறை ஒளிச்சேர்க்கை ஆகும். இதன் மூலம் அவை நமக்கு ஆக்சிஜனை வழங்குகின்றன!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "ஒளிச்சேர்க்கைக்கு தாவரங்களுக்குத் தேவையானது எது?",
          options: ["சூரிய ஒளி", "கல்", "தங்கம்", "நெருப்பு"],
          answerIndex: 0,
          explanation: "ஒளிச்சேர்க்கைக்கு தாவரங்களுக்கு சூரிய ஒளி, நீர், และ பச்சையம் இன்றியமையாதவை."
        }
      ]
    }
  ],
  te: [
    {
      id: 'rain',
      query: "మేఘాలు వర్షాన్ని ఎలా కురిపిస్తాయి?",
      subject: "Science 🔬",
      avatarChar: "👵 బామ్మ AI",
      avatarName: "బామ్మ AI (గ్రామ పెద్ద)",
      explanation: "సూర్యుడి వేడి వల్ల చెరువులు, నదులలోని నీరు ఆవిరిగా మారి పైకి వెళ్ళి మేఘాలుగా ఏర్పడుతుంది. ఈ మేఘాలు చల్లబడి బరువెక్కినప్పుడు వర్షం కురుస్తుంది!",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "నీరు వేడెక్కినప్పుడు ఏ రూపంలోకి మారుతుంది?",
          options: ["మంచు", "ఆవిరి", "రాయి", "పచ్చడి"],
          answerIndex: 1,
          explanation: "నీరు వేడెక్కినప్పుడు ఆవిరిగా మారి పైకి వెళుతుంది."
        }
      ]
    },
    {
      id: 'photo',
      query: "కిరణజన్య సంయోగ క్రియ అంటే ఏమిటి?",
      subject: "Science 🔬",
      avatarChar: "🤖 స్వామి AI",
      avatarName: "స్వామి AI (స్మార్ట్ మిత్రుడు)",
      explanation: "మొక్కలు సూర్యరశ్మి, పత్రహరితం, నీరు మరియు కార్బన్ డై ఆక్సైడ్ సహాయంతో ఆహారాన్ని తయారు చేసుకునే ప్రక్రియను కిరణజన్య సంయోగ క్రియ అంటారు. దీని వల్ల మనకు ప్రాణవాయువు లభిస్తుంది!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "కిరణజన్య సంయోగ క్రియలో మొక్కలు ఏ వాయువును విడుదల చేస్తాయి?",
          options: ["ఆక్సిజన్", "కార్బన్ డై ఆక్సైడ్", "హైడ్రోజన్", "నైట్రోజన్"],
          answerIndex: 0,
          explanation: "మొక్కలు కిరణజన్య సంయోగ క్రియ సమయంలో మనకు ఆక్సిజన్ (ప్రాణవాయువు) అందిస్తాయి."
        }
      ]
    }
  ]
};

interface TutorTabProps {
  user: User;
  lang: LanguageCode;
  claimedMedals: string[];
  setClaimedMedals: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateUser?: (fields: Partial<User>) => void;
}

export default function TutorTab({
  user,
  lang,
  claimedMedals,
  setClaimedMedals,
  onUpdateUser
}: TutorTabProps) {
  const DOWNLOAD_LABELS: Record<LanguageCode, string> = {
    en: "DOWNLOAD VIDEO LECTURE",
    hi: "लेक्चर वीडियो डाउनलोड करें",
    gu: "લેક્ચર વિડીયો ડાઉનલોડ કરો",
    mr: "लेक्चर व्हिडिओ डाउनलोड करा",
    ta: "விரிவுரை வீடியோ பதிவிறக்கு",
    te: "ఉపన్యాస వీడియో డౌన్లోడ్"
  };

  const DOWNLOAD_TOOLTIPS: Record<LanguageCode, string> = {
    en: "Download complete interactive video lecture, slides and quiz pack for offline learning!",
    hi: "ऑफ़लाइन पढ़ाई के लिए पूरा लेक्चर वीडियो, स्लाइड और क्विज़ पैक डाउनलोड करें!",
    gu: "ઓફલાઇન અભ્યાસ માટે સંપૂર્ણ લેક્ચર વિડીયો, સ્લાઇડ્સ અને ક્વિઝ ડાઉનલોડ કરો!",
    mr: "ऑफलाइन अभ्यासासाठी संपूर्ण लेक्चर व्हिडिओ, स्लाइड्स आणि क्विझ डाउनलोड करा!",
    ta: "ஆஃப்லைன் கற்றலுக்கான முழு விரிவுரை வீடியோ, ஸ்லைடு மற்றும் வினாடி வினா பேக்கைப் பதிவிறக்கவும்!",
    te: "ఆఫ్‌లైన్ అభ్యాసం కోసం పూర్తి ఉపన్యాస వీడియో, స్లయిడ్‌లు మరియు క్విజ్ ప్యాక్‌ను డౌన్‌లోడ్ చేసుకోండి!"
  };

  const downloadLessonVideoAndSlidesSpecific = (lesson: LessonQuery) => {
    if (!lesson) return;
    
    const slides = getSlidesForLesson(lesson, lang);
    const lessonTitle = lesson.query;
    const subject = lesson.subject;
    const avatarName = lesson.avatarName || "Swami AI";
    const avatarChar = lesson.avatarChar || "🤖";
    const quizzes = lesson.quiz || [];
    
    // Build JSON strings safely
    const slidesJson = JSON.stringify(slides);
    const quizJson = JSON.stringify(quizzes);

    const htmlContent = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline Lesson: ${lessonTitle.replace(/"/g, '&quot;')}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <div>
                <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full">\${subject}</span>
                <h1 class="text-xl sm:text-2xl font-black tracking-tight mt-2 text-slate-100">\${lessonTitle.replace(/"/g, '&quot;')}</h1>
                <p class="text-xs text-slate-400 mt-1">Guided offline by <span class="font-bold text-[#E07A5F]">\${avatarName} \${avatarChar}</span></p>
            </div>
            <div class="flex items-center gap-2">
                <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span class="text-[10px] font-mono text-emerald-400 uppercase font-black tracking-widest">OFFLINE PLAYBACK READY</span>
            </div>
        </div>

        <!-- Dynamic Stage Canvas & Player -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden">
            <!-- Slide Visual Panel -->
            <div id="slide-stage" class="min-h-[220px] sm:min-h-[300px] bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                <!-- Top Header -->
                <div class="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span id="slide-step" class="text-[10px] font-mono font-bold text-amber-400 tracking-wider">STAGE 1</span>
                    <span class="text-[10px] font-mono text-slate-500">Mascot Class Tutor</span>
                </div>

                <!-- Mascot & Speech Visualizer -->
                <div class="flex items-center gap-4 my-4">
                    <div id="mascot-avatar" class="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-inner border border-slate-800 transition-all">
                        \${avatarChar}
                    </div>
                    <div class="flex-1 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 relative">
                        <p id="slide-content" class="text-sm sm:text-base leading-relaxed text-slate-200">Loading slide content...</p>
                    </div>
                </div>

                <!-- Bullets & Details -->
                <div id="slide-bullets" class="flex flex-wrap gap-2 my-2">
                    <!-- Bullets injected dynamically -->
                </div>

                <!-- Bottom Fact Card -->
                <div id="slide-fact" class="bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl mt-3 flex items-start gap-2.5">
                    <span class="text-sm">💡</span>
                    <p id="slide-fact-text" class="text-xs text-slate-400 italic">Fact details...</p>
                </div>
            </div>

            <!-- Speech Audio & Slide Controls -->
            <div class="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <button id="btn-play-pause" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md">
                        <span id="play-icon">▶</span> <span id="play-text">PLAY NARRATION</span>
                    </button>
                    <button id="btn-prev" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40" disabled>
                        ◀ PREV
                    </button>
                    <button id="btn-next" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40">
                        NEXT ▶
                    </button>
                </div>
                <div class="text-[11px] font-mono text-slate-500">
                    SLIDE <span id="current-slide-num" class="font-bold text-slate-300">1</span> OF <span id="total-slides-num" class="font-bold text-slate-300">3</span>
                </div>
            </div>
        </div>

        <!-- Quiz Section -->
        <div id="quiz-card" class="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
            <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 class="text-md font-bold tracking-tight text-slate-200">📝 Interactive Lesson Quiz</h3>
                <span id="quiz-score-badge" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2.5 py-1 rounded-full">SCORE: 0</span>
            </div>

            <div id="quiz-content" class="flex flex-col gap-4">
                <!-- Quiz content goes here -->
                <p id="quiz-question" class="text-sm sm:text-base font-semibold text-slate-200">Question goes here</p>
                <div id="quiz-options" class="grid grid-cols-1 gap-2.5">
                    <!-- Options buttons go here -->
                </div>
                <div id="quiz-explanation" class="hidden bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300">
                    <!-- Explanation -->
                </div>
                <div class="flex justify-between items-center mt-2">
                    <button id="btn-prev-quiz" class="text-xs bg-slate-800 text-slate-300 px-3.5 py-2 rounded-lg font-bold" disabled>Previous Question</button>
                    <button id="btn-next-quiz" class="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-40">Next Question</button>
                </div>
            </div>
        </div>

        <!-- Back to Top / Source credit -->
        <div class="text-center py-4 border-t border-slate-800 text-slate-600 text-[10px] font-mono uppercase tracking-widest mt-4">
            Generated by Mascot Class Tutor • Gramin Student Companion
        </div>
    </div>

    <script>
        const slides = \${slidesJson};
        const quizzes = \${quizJson};
        let currentSlideIdx = 0;
        let isSpeaking = false;
        let currentQuizIdx = 0;
        let selectedAnswers = Array(quizzes.length).fill(null);
        let score = 0;

        // TTS reference
        let synth = window.speechSynthesis;
        let utterance = null;

        // Slide view updater
        function updateSlide() {
            const slide = slides[currentSlideIdx];
            if (!slide) return;

            document.getElementById('slide-step').innerText = slide.title || ('STAGE ' + (currentSlideIdx + 1));
            document.getElementById('slide-content').innerText = slide.content || '';
            
            // Render bullets
            const bulletsContainer = document.getElementById('slide-bullets');
            bulletsContainer.innerHTML = '';
            if (slide.bullets && slide.bullets.length > 0) {
                slide.bullets.forEach(bullet => {
                    const span = document.createElement('span');
                    span.className = 'text-[11px] bg-slate-800/80 text-amber-300 px-2 py-1 rounded-lg border border-slate-700/50';
                    span.innerText = '• ' + bullet;
                    bulletsContainer.appendChild(span);
                });
            }

            // Render fact
            const factText = document.getElementById('slide-fact-text');
            if (slide.keyFact) {
                document.getElementById('slide-fact').classList.remove('hidden');
                factText.innerText = slide.keyFact;
            } else {
                document.getElementById('slide-fact').classList.add('hidden');
            }

            // Update indices
            document.getElementById('current-slide-num').innerText = currentSlideIdx + 1;
            document.getElementById('total-slides-num').innerText = slides.length;

            // Update buttons
            document.getElementById('btn-prev').disabled = currentSlideIdx === 0;
            document.getElementById('btn-next').disabled = currentSlideIdx === slides.length - 1;

            // Stop any ongoing speech when moving slides
            stopVoice();
        }

        function speakVoice() {
            if (!synth) return;
            stopVoice();

            const slide = slides[currentSlideIdx];
            if (!slide) return;

            utterance = new SpeechSynthesisUtterance(slide.content);
            
            // Match appropriate voices based on language code
            const langCode = "${lang}";
            if (langCode === 'hi') utterance.lang = 'hi-IN';
            else if (langCode === 'gu') utterance.lang = 'gu-IN';
            else if (langCode === 'mr') utterance.lang = 'mr-IN';
            else if (langCode === 'ta') utterance.lang = 'ta-IN';
            else if (langCode === 'te') utterance.lang = 'te-IN';
            else utterance.lang = 'en-IN';

            utterance.rate = 0.9;
            utterance.onend = () => {
                isSpeaking = false;
                updateVoiceControls();
            };

            isSpeaking = true;
            synth.speak(utterance);
            updateVoiceControls();
        }

        function stopVoice() {
            if (synth) {
                synth.cancel();
            }
            isSpeaking = false;
            updateVoiceControls();
        }

        function updateVoiceControls() {
            const playIcon = document.getElementById('play-icon');
            const playText = document.getElementById('play-text');
            const btn = document.getElementById('btn-play-pause');

            if (isSpeaking) {
                playIcon.innerText = '⏸';
                playText.innerText = 'PAUSE NARRATION';
                btn.className = 'bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md';
                document.getElementById('mascot-avatar').classList.add('scale-105', 'border-amber-500');
            } else {
                playIcon.innerText = '▶';
                playText.innerText = 'PLAY NARRATION';
                btn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md';
                document.getElementById('mascot-avatar').className = 'w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-inner border border-slate-800 transition-all';
            }
        }

        // Quiz Renderer
        function updateQuiz() {
            if (quizzes.length === 0) {
                document.getElementById('quiz-card').classList.add('hidden');
                return;
            }

            const quiz = quizzes[currentQuizIdx];
            document.getElementById('quiz-question').innerText = (currentQuizIdx + 1) + '. ' + quiz.question;
            
            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';

            const selectedAns = selectedAnswers[currentQuizIdx];

            quiz.options.forEach((option, idx) => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left p-3.5 rounded-2xl border transition-all text-xs sm:text-sm flex justify-between items-center ';
                
                if (selectedAns === null) {
                    btn.className += 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700';
                    btn.onclick = () => selectQuizAnswer(idx);
                } else {
                    if (idx === quiz.answerIndex) {
                        btn.className += 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold';
                        btn.innerHTML = '<span>' + option + '</span><span class="text-xs">✓ Correct</span>';
                    } else if (idx === selectedAns) {
                        btn.className += 'bg-red-500/10 border-red-500/40 text-red-400 font-bold';
                        btn.innerHTML = '<span>' + option + '</span><span class="text-xs">✗ Incorrect</span>';
                    } else {
                        btn.className += 'bg-slate-950/40 border-slate-850 text-slate-500 cursor-not-allowed';
                        btn.innerHTML = '<span>' + option + '</span>';
                    }
                }
                optionsContainer.appendChild(btn);
            });

            const explanationBox = document.getElementById('quiz-explanation');
            if (selectedAns !== null && quiz.explanation) {
                explanationBox.classList.remove('hidden');
                explanationBox.innerHTML = '<strong>Guide Explanation:</strong> ' + quiz.explanation;
            } else {
                explanationBox.classList.add('hidden');
            }

            document.getElementById('btn-prev-quiz').disabled = currentQuizIdx === 0;
            document.getElementById('btn-next-quiz').disabled = currentQuizIdx === quizzes.length - 1;

            // Update scores
            let calculatedScore = 0;
            selectedAnswers.forEach((ans, qIdx) => {
                if (ans !== null && ans === quizzes[qIdx].answerIndex) {
                    calculatedScore++;
                }
            });
            score = calculatedScore;
            document.getElementById('quiz-score-badge').innerText = 'SCORE: ' + score + '/' + quizzes.length;
        }

        function selectQuizAnswer(ansIdx) {
            if (selectedAnswers[currentQuizIdx] !== null) return;
            selectedAnswers[currentQuizIdx] = ansIdx;
            updateQuiz();
        }

        // Setup event handlers
        document.getElementById('btn-play-pause').onclick = () => {
            if (isSpeaking) {
                stopVoice();
            } else {
                speakVoice();
            }
        };

        document.getElementById('btn-prev').onclick = () => {
            if (currentSlideIdx > 0) {
                currentSlideIdx--;
                updateSlide();
            }
        };

        document.getElementById('btn-next').onclick = () => {
            if (currentSlideIdx < slides.length - 1) {
                currentSlideIdx++;
                updateSlide();
            }
        };

        document.getElementById('btn-prev-quiz').onclick = () => {
            if (currentQuizIdx > 0) {
                currentQuizIdx--;
                updateQuiz();
            }
        };

        document.getElementById('btn-next-quiz').onclick = () => {
            if (currentQuizIdx < quizzes.length - 1) {
                currentQuizIdx++;
                updateQuiz();
            }
        };

        // Initialize view
        updateSlide();
        updateQuiz();
    </script>
</body>
</html>`;

    // Download flow
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate clean filename
    const sanitizedTitle = lessonTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 40);
    link.download = `mascot_lesson_\${sanitizedTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentLanguageLessons = SAMPLE_LESSONS[lang] || SAMPLE_LESSONS['en'];
  const [selectedLesson, setSelectedLesson] = useState<LessonQuery>(currentLanguageLessons[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // --- VIDEO EXPORT GENERATOR STATES ---
  const [showDownloadSelectionModal, setShowDownloadSelectionModal] = useState(false);
  const [isRecordingVideoFile, setIsRecordingVideoFile] = useState(false);
  const [videoRecordProgress, setVideoRecordProgress] = useState(0);
  const [videoRecordStatus, setVideoRecordStatus] = useState('');
  const exportCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const recordingActiveRef = React.useRef(false);
  const animationFrameIdRef = React.useRef<number | null>(null);
  const tutorAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const slideSwitchTimeoutRef = React.useRef<any>(null);

  const playAmbientStudyBeat = (audioContext: AudioContext, destinationNode: AudioNode) => {
    const chordProgression = [
      [261.63, 329.63, 392.00, 493.88], // C major 7 (C, E, G, B)
      [220.00, 261.63, 329.63, 392.00], // A minor 7 (A, C, E, G)
      [349.23, 440.00, 523.25, 587.33], // F major 7/9 (F, A, C, E, G)
      [392.00, 493.88, 587.33, 659.25]  // G major 7/9 (G, B, D, F#, A)
    ];
    let progressionIndex = 0;

    const playNextChord = () => {
      if (audioContext.state === 'closed') return;
      const now = audioContext.currentTime;
      const notes = chordProgression[progressionIndex];
      
      notes.forEach((freq) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(destinationNode);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.04, now + 1.0);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);
        
        osc.start(now);
        osc.stop(now + 6.0);
      });
      
      // Kick beat
      const kickOsc = audioContext.createOscillator();
      const kickGain = audioContext.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(100, now);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      kickGain.gain.setValueAtTime(0.08, now);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      kickOsc.connect(kickGain);
      kickGain.connect(destinationNode);
      kickOsc.start(now);
      kickOsc.stop(now + 0.3);

      setTimeout(() => {
        if (audioContext.state === 'closed') return;
        const chimeNow = audioContext.currentTime;
        const chimeOsc = audioContext.createOscillator();
        const chimeGain = audioContext.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(523.25, chimeNow);
        chimeGain.gain.setValueAtTime(0.01, chimeNow);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + 1.5);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(destinationNode);
        chimeOsc.start(chimeNow);
        chimeOsc.stop(chimeNow + 1.5);
      }, 1500);

      progressionIndex = (progressionIndex + 1) % chordProgression.length;
    };

    playNextChord();
    const intervalId = setInterval(playNextChord, 4000);
    return intervalId;
  };

  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  const startVideoExport = async (lesson: LessonQuery) => {
    if (!lesson) return;
    setShowDownloadSelectionModal(false);
    setIsRecordingVideoFile(true);
    setVideoRecordProgress(0);
    setVideoRecordStatus(lang === 'hi' ? 'ऑडियो और वीडियो इंजन शुरू किया जा रहा है...' : 'Initializing audio and video render engines...');
    recordingActiveRef.current = true;

    setTimeout(async () => {
      const canvas = exportCanvasRef.current;
      if (!canvas) {
        console.error("Recording canvas not found");
        setIsRecordingVideoFile(false);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Canvas context not supported");
        setIsRecordingVideoFile(false);
        return;
      }

      const slides = getSlidesForLesson(lesson, lang);
      const avatarChar = lesson.avatarChar || "🤖";
      const avatarName = lesson.avatarName || "Swami AI";
      const subject = lesson.subject || "General 📚";
      const query = lesson.query;

      // 1. Build speech audio queue for all slides
      interface AudioQueueItem {
        slideIndex: number;
        text: string;
        url: string;
      }
      
      const audioQueue: AudioQueueItem[] = [];
      slides.forEach((slide, sIdx) => {
        const cleanText = cleanTextForTTS(slide.content || '');
        const detectedLang = detectLanguageOfText(slide.content || '', lang);
        const chunks = splitTextIntoTTSChunks(cleanText);
        if (chunks.length === 0) {
          audioQueue.push({
            slideIndex: sIdx,
            text: '',
            url: ''
          });
        } else {
          chunks.forEach(chunk => {
            audioQueue.push({
              slideIndex: sIdx,
              text: chunk,
              url: `/api/tts?tl=${detectedLang}&q=${encodeURIComponent(chunk)}`
            });
          });
        }
      });

      let audioCtx: AudioContext | null = null;
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      let beatIntervalId: any = null;
      let tutorAudio: HTMLAudioElement | null = null;
      let tutorSource: MediaElementAudioSourceNode | null = null;

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        audioDest = audioCtx.createMediaStreamDestination();
        beatIntervalId = playAmbientStudyBeat(audioCtx, audioDest);
        
        tutorAudio = new Audio();
        tutorAudio.crossOrigin = "anonymous";
        tutorAudioRef.current = tutorAudio;

        tutorSource = audioCtx.createMediaElementSource(tutorAudio);
        tutorSource.connect(audioDest);
        tutorSource.connect(audioCtx.destination); // Let user hear the narration during encoding

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
      } catch (err) {
        console.warn("Could not start Web Audio:", err);
      }

      let stream: MediaStream;
      try {
        stream = canvas.captureStream(30);
      } catch (e) {
        console.error("captureStream not supported:", e);
        setIsRecordingVideoFile(false);
        return;
      }

      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        const audioTrack = audioDest.stream.getAudioTracks()[0];
        stream.addTrack(audioTrack);
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      let recordedChunks: Blob[] = [];
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        mediaRecorder.start(100);
      } catch (err) {
        console.error("Failed to create MediaRecorder:", err);
        setIsRecordingVideoFile(false);
        return;
      }

      const startTime = Date.now();
      let lastTime = Date.now();

      const bubbles = Array.from({ length: 15 }, () => ({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        r: Math.random() * 40 + 10,
        alpha: Math.random() * 0.15 + 0.05,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5
      }));

      // Active states driven by speech playback
      let currentQueueIdx = 0;
      let isAudioPlaying = false;
      let currentSlideIdx = 0;
      let exportCompleted = false;

      const finishRecording = () => {
        if (exportCompleted) return;
        exportCompleted = true;
        recordingActiveRef.current = false;
        
        setVideoRecordProgress(100);
        setVideoRecordStatus(lang === 'hi' ? 'वीडियो फ़ाइल सहेज रहा है...' : 'Saving movie file to device...');
        
        if (slideSwitchTimeoutRef.current) {
          clearTimeout(slideSwitchTimeoutRef.current);
          slideSwitchTimeoutRef.current = null;
        }
        if (tutorAudioRef.current) {
          try {
            tutorAudioRef.current.pause();
            tutorAudioRef.current.src = '';
          } catch (e) {
            // Safe ignore
          }
          tutorAudioRef.current = null;
        }

        setTimeout(() => {
          try {
            mediaRecorder.stop();
            setTimeout(() => {
              const blob = new Blob(recordedChunks, { type: mimeType });
              const videoUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = videoUrl;
              
              const sanitizedTitle = query
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .substring(0, 40);
              const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
              a.download = `mascot_lecture_${sanitizedTitle}.${extension}`;
              
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(videoUrl);

              if (beatIntervalId) clearInterval(beatIntervalId);
              if (audioCtx) audioCtx.close();

              setIsRecordingVideoFile(false);
            }, 500);
          } catch (err) {
            console.error("Error finalizing recording:", err);
            setIsRecordingVideoFile(false);
          }
        }, 1000);
      };

      const playNextChunk = () => {
        if (!recordingActiveRef.current || exportCompleted) return;

        if (currentQueueIdx >= audioQueue.length) {
          setVideoRecordStatus(lang === 'hi' ? 'व्याख्यान समाप्त हो रहा है...' : 'Wrapping up lecture...');
          slideSwitchTimeoutRef.current = setTimeout(() => {
            finishRecording();
          }, 2000);
          return;
        }

        const item = audioQueue[currentQueueIdx];
        currentSlideIdx = item.slideIndex;

        if (!item.url) {
          isAudioPlaying = false;
          setVideoRecordStatus(
            lang === 'hi' 
              ? `लेक्चर रिकॉर्ड किया जा रहा है: स्लाइड ${currentSlideIdx + 1}/${slides.length}`
              : `Recording Lecture Movie: Slide ${currentSlideIdx + 1}/${slides.length}`
          );
          slideSwitchTimeoutRef.current = setTimeout(() => {
            currentQueueIdx++;
            playNextChunk();
          }, 3000);
          return;
        }

        if (tutorAudioRef.current) {
          tutorAudioRef.current.src = item.url;
          isAudioPlaying = true;

          setVideoRecordStatus(
            lang === 'hi' 
              ? `लेक्चर रिकॉर्ड किया जा रहा है: स्लाइड ${currentSlideIdx + 1}/${slides.length}`
              : `Recording Lecture Movie: Slide ${currentSlideIdx + 1}/${slides.length}`
          );

          tutorAudioRef.current.play().catch(err => {
            console.warn("Failed to play tutor audio chunk, skipping:", err);
            isAudioPlaying = false;
            slideSwitchTimeoutRef.current = setTimeout(() => {
              currentQueueIdx++;
              playNextChunk();
            }, 4000);
          });
        } else {
          isAudioPlaying = false;
          slideSwitchTimeoutRef.current = setTimeout(() => {
            currentQueueIdx++;
            playNextChunk();
          }, 4000);
        }
      };

      if (tutorAudioRef.current) {
        tutorAudioRef.current.onended = () => {
          isAudioPlaying = false;
          currentQueueIdx++;
          slideSwitchTimeoutRef.current = setTimeout(() => {
            playNextChunk();
          }, 600);
        };
        tutorAudioRef.current.onerror = (e) => {
          console.warn("Tutor audio error, skipping to next chunk:", e);
          isAudioPlaying = false;
          currentQueueIdx++;
          slideSwitchTimeoutRef.current = setTimeout(() => {
            playNextChunk();
          }, 600);
        };
      }

      // Start sequential play of the narration queue
      playNextChunk();

      const renderFrame = () => {
        if (!recordingActiveRef.current) return;

        const now = Date.now();
        const elapsed = now - startTime;
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const progress = audioQueue.length > 0 ? Math.min((currentQueueIdx / audioQueue.length) * 100, 99) : 0;
        setVideoRecordProgress(Math.floor(progress));
        
        const currentSlide = slides[currentSlideIdx];

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1280, 720);

        const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
        bgGrad.addColorStop(0, '#0d1527');
        bgGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1280, 720);

        bubbles.forEach(b => {
          b.x += b.dx;
          b.y += b.dy;
          if (b.x < -b.r) b.x = 1280 + b.r;
          if (b.x > 1280 + b.r) b.x = -b.r;
          if (b.y < -b.r) b.y = 720 + b.r;
          if (b.y > 720 + b.r) b.y = -b.r;

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(129, 178, 154, ${b.alpha})`;
          ctx.fill();
        });

        // 1. HEADER CARD
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(40, 30, 1200, 110, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#81B29A';
        ctx.font = '900 13px "JetBrains Mono", monospace';
        ctx.fillText(subject.toUpperCase(), 70, 68);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Inter", sans-serif';
        const displayQuery = query.length > 70 ? query.substring(0, 67) + '...' : query;
        ctx.fillText(displayQuery, 70, 105);
        
        ctx.fillStyle = '#e07a5f';
        ctx.font = '900 11px "JetBrains Mono", monospace';
        ctx.fillText("🔴 RECORDING HD LECTURE", 1040, 68);
        ctx.restore();

        // 2. TUTOR PANEL
        ctx.save();
        ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(40, 170, 320, 480, 32);
        ctx.fill();
        ctx.stroke();

        const avatarPulse = 1 + Math.sin(now * 0.005) * 0.04;
        const avatarX = 40 + 160;
        const avatarY = 170 + 160;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, 90 * avatarPulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 122, 95, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(224, 122, 95, 0.2)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(avatarX, avatarY, 75, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.font = '90px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        ctx.translate(avatarX, avatarY);
        const talkBounce = isAudioPlaying ? Math.sin(now * 0.015) * 5 : 0;
        ctx.translate(0, talkBounce);
        ctx.fillText(avatarChar.split(' ')[0], 0, 0);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(avatarName, avatarX, 170 + 295);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText("YOUR CLASSROOM NARRATOR", avatarX, 170 + 320);

        ctx.fillStyle = 'rgba(129, 178, 154, 0.7)';
        const barWidth = 6;
        const barGap = 4;
        const startBarX = avatarX - 70;
        for (let idx = 0; idx < 15; idx++) {
          const heightFactor = isAudioPlaying ? Math.sin(now * 0.01 + idx * 0.3) * 0.5 + 0.5 : 0;
          const barHeight = 15 + heightFactor * 25;
          const barX = startBarX + idx * (barWidth + barGap);
          ctx.beginPath();
          ctx.roundRect(barX, 170 + 380 - barHeight / 2, barWidth, barHeight, 3);
          ctx.fill();
        }
        ctx.restore();

        // 3. SLIDE PANEL
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(390, 170, 850, 480, 32);
        ctx.fill();
        ctx.stroke();

        if (currentSlide) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 22px "Inter", sans-serif';
          ctx.fillText(currentSlide.title || `STAGE ${currentSlideIdx + 1}`, 430, 220);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(430, 245);
          ctx.lineTo(1200, 245);
          ctx.stroke();

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '18px/1.6 "Inter", sans-serif';
          const slideTextY = drawWrappedText(
            ctx,
            currentSlide.content || '',
            430,
            285,
            770,
            30
          );

          if (currentSlide.bullets && currentSlide.bullets.length > 0) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '15px "Inter", sans-serif';
            let bulletY = slideTextY + 15;
            
            currentSlide.bullets.slice(0, 3).forEach((bullet: string) => {
              if (bulletY < 170 + 370) {
                ctx.fillStyle = '#81B29A';
                ctx.fillText("⚡", 430, bulletY);
                ctx.fillStyle = '#cbd5e1';
                ctx.fillText(bullet, 455, bulletY);
                bulletY += 26;
              }
            });
          }

          if (currentSlide.keyFact) {
            ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.beginPath();
            ctx.roundRect(430, 170 + 380, 770, 65, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px "Inter", sans-serif';
            drawWrappedText(
              ctx,
              currentSlide.keyFact,
              455,
              170 + 418,
              720,
              20
            );
          }
        }
        ctx.restore();

        // 4. FOOTER TIMELINE
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(40, 680, 1200, 6);

        ctx.fillStyle = '#e07a5f';
        ctx.fillRect(40, 680, 1200 * (progress / 100), 6);

        for (let i = 1; i < slides.length; i++) {
          const dotX = 40 + (1200 * (i / slides.length));
          ctx.beginPath();
          ctx.arc(dotX, 683, 4, 0, Math.PI * 2);
          ctx.fillStyle = progress >= (i / slides.length) * 100 ? '#e07a5f' : '#334155';
          ctx.fill();
        }

        const secondsElapsed = Math.floor(elapsed / 1000);
        const secondsTotal = Math.max(secondsElapsed + 2, audioQueue.length * 5);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(
          `SLIDE ${currentSlideIdx + 1} OF ${slides.length}  |  ${secondsElapsed}s / ${secondsTotal}s`,
          40,
          708
        );

        ctx.textAlign = 'right';
        ctx.fillText(
          "MASCOT CLASS TUTOR • HIGH DEFINITION OFFLINE MOVIE",
          1240,
          708
        );
        ctx.restore();

        animationFrameIdRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    }, 100);
  };

  const cancelVideoExport = () => {
    recordingActiveRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (slideSwitchTimeoutRef.current) {
      clearTimeout(slideSwitchTimeoutRef.current);
      slideSwitchTimeoutRef.current = null;
    }
    if (tutorAudioRef.current) {
      try {
        tutorAudioRef.current.pause();
        tutorAudioRef.current.src = '';
      } catch (err) {
        console.warn("Error pausing tutor audio:", err);
      }
      tutorAudioRef.current = null;
    }
    setIsRecordingVideoFile(false);
  };

  // File upload state for custom queries
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    previewUrl: string;
    base64Data: string;
    mimeType: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(lang === 'hi' ? 'केवल PDF या चित्र ही अपलोड किए जा सकते हैं!' : 'Only PDF documents or image files are allowed!');
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        setAttachedFile({
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);

  const [activeDeckTab, setActiveDeckTab] = useState<'curriculum' | 'history'>('history');
  const [customHistory, setCustomHistory] = useState<LessonQuery[]>(() => {
    try {
      if (user.mascotLessonsHistory) {
        return JSON.parse(user.mascotLessonsHistory);
      }
      const saved = localStorage.getItem(`${user.mobile}_mascot_lessons_history`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse mascot lessons history:", e);
      return [];
    }
  });

  // Synchronize local storage and Firebase database when customHistory changes
  useEffect(() => {
    try {
      const serialized = JSON.stringify(customHistory);
      localStorage.setItem(`${user.mobile}_mascot_lessons_history`, serialized);
      if (onUpdateUser && user.mascotLessonsHistory !== serialized) {
        onUpdateUser({ mascotLessonsHistory: serialized });
      }
    } catch (e) {
      console.error("Failed to sync custom history to storage:", e);
    }
  }, [customHistory]);

  // Load and update customHistory when user.mobile or user.mascotLessonsHistory changes
  useEffect(() => {
    try {
      if (user.mascotLessonsHistory) {
        const parsed = JSON.parse(user.mascotLessonsHistory);
        if (JSON.stringify(customHistory) !== user.mascotLessonsHistory) {
          setCustomHistory(parsed);
        }
      } else {
        const saved = localStorage.getItem(`${user.mobile}_mascot_lessons_history`);
        const parsed = saved ? JSON.parse(saved) : [];
        if (JSON.stringify(customHistory) !== JSON.stringify(parsed)) {
          setCustomHistory(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse mascot lessons history:", e);
    }
  }, [user.mobile, user.mascotLessonsHistory]);
  const [isNewLecture, setIsNewLecture] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'starred'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  const handleToggleStarLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomHistory(prev => prev.map(item => item.id === lessonId ? { ...item, starred: !item.starred } : item));
  };

  const [showPlayGesturePrompt, setShowPlayGesturePrompt] = useState(false);

  const isAutoplayEnabledRef = React.useRef(isAutoplayEnabled);
  React.useEffect(() => {
    isAutoplayEnabledRef.current = isAutoplayEnabled;
  }, [isAutoplayEnabled]);

  const currentSlideIndexRef = React.useRef(currentSlideIndex);
  React.useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  // AI Video live generation simulation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  
  // Mascot expressions
  const [avatarAction, setAvatarAction] = useState<'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think'>('idle');

  // Interactive Reactions floating state
  interface FloatingReaction {
    id: number;
    emoji: string;
    text: string;
    left: number;
    delay: number;
  }
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const LANGUAGE_NAMES: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    gu: "Gujarati",
    mr: "Marathi",
    ta: "Tamil",
    te: "Telugu"
  };

  const getSlidesForLesson = (lesson: LessonQuery, targetLang: string): any[] => {
    if (lesson.slides && lesson.slides.length > 0) {
      return lesson.slides;
    }

    if (lesson.id === 'rain') {
      switch (targetLang) {
        case 'hi':
          return [
            {
              id: 'rain-s1',
              title: "भाग 1: ऊपर उठना (वाष्पीकरण) 💧☀️",
              content: "जब सूरज नदियों और झीलों के पानी को गर्म करता है, तो पानी एक अदृश्य गैस में बदल जाता है जिसे वाष्प कहते हैं! यह हल्की वाष्प ऊपर उठकर नीले आकाश में चली जाती है।",
              bullets: ["सूरज एक प्राकृतिक हीटर का काम करता है", "पानी तरल से गैस वाष्प में बदलता है", "गर्म हवा वाष्प को ऊपर ले जाती है"],
              keyFact: "☀️ सूरज की गर्मी के बिना जल चक्र और बारिश संभव नहीं है!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "भाग 2: बादल बनना (संघनन) ☁️❄️",
              content: "जैसे-जैसे पानी की वाष्प ऊपर जाती है, हवा ठंडी होने लगती है। ठंडी हवा वाष्प को वापस पानी की छोटी-छोटी बूंदों में बदल देती है, जो मिलकर सुंदर सफेद बादल बनाते हैं!",
              bullets: ["ऊंचाई पर हवा बहुत ठंडी होती है", "वाष्प ठंडी होकर पानी की बूंदें बनती है", "करोड़ों बूंदें मिलकर बादल बनाती हैं"],
              keyFact: "☁️ एक बड़े सफेद बादल का वजन सौ हाथियों के बराबर हो सकता है!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "भाग 3: बारिश होना (वर्षा) 🌧️🌍",
              content: "बादल के अंदर बूंदें आपस में टकराकर बड़ी और भारी हो जाती हैं! जब बादल बहुत भारी हो जाता है, तो गुरुत्वाकर्षण उन्हें नीचे खींचता है और वे बारिश बनकर गिरती हैं!",
              bullets: ["बूंदें टकराकर बड़ी और भारी होती हैं", "ज्यादा पानी होने पर बादल काले हो जाते हैं", "गुरुत्वाकर्षण भारी बूंदों को नीचे खींचता है"],
              keyFact: "🌧️ अगर नीचे तक हवा बहुत ठंडी हो, तो बारिश बर्फ के रूप में गिरती है!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
        case 'gu':
          return [
            {
              id: 'rain-s1',
              title: "ભાગ 1: વરાળ બનવી (બાષ્પીભવન) 💧☀️",
              content: "જ્યારે સૂર્ય નદીઓ અને તળાવના પાણીને ગરમ કરે છે, ત્યારે પાણી અદ્રશ્ય ગેસમાં બદલાય છે જેને વાષ્પ કહેવાય છે! આ હલકી વરાળ આકાશમાં ઊંચે જાય છે.",
              bullets: ["સૂર્ય કુદરતી હીટરનું કામ કરે છે", "પાણી પ્રવાહીમાંથી વાષ્પ ગેસમાં ફરે છે", "ગરમ હવા વરાળને ઊંચે લઈ જાય છે"],
              keyFact: "☀️ સૂર્યની ગરમી વિના જળચક્ર અને વરસાદ શક્ય નથી!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "ભાગ 2: વાદળ બનવું (સંઘનન) ☁️❄️",
              content: "જેમ જેમ વરાળ ઊંચે જાય છે તેમ હવા ઠંડી થાય છે. ઠંડી હવા વરાળને ફરી પાણીના નાના ટીપાંમાં ફેરવે છે, જે ભેગા થઈને વાદળો બનાવે છે!",
              bullets: ["ઊંચાઈ પર હવા ખૂબ જ ઠંડી હોય છે", "વરાળ ઠંડી થઈને ટીપાં બને છે", "કરોડો ટીપાં ભેગા થઈને વાદળ બને છે"],
              keyFact: "☁️ એક વાદળનું વજન ૧૦૦ હાથીઓ જેટલું હોઈ શકે છે!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "ભાગ 3: વરસાદ પડવો (વર્ષા) 🌧️🌍",
              content: "વાદળમાં નાના ટીપાં ભેગા થઈ મોટા અને ભારે બને છે! જ્યારે વાદળ ભારે થઈ જાય છે, ત્યારે ગુરુત્વાકર્ષણ તેમને નીચે ખેંચે છે અને તે વરસાદ રૂપે પડે છે!",
              bullets: ["ટીપાંઓ ભેગા થઈને મોટા બને છે", "પાણી ભરાવાથી વાદળો કાળા થાય છે", "ગુરુત્વાકર્ષણ ટીપાંને નીચે ખેંચે છે"],
              keyFact: "🌧️ જો નીચે ખૂબ જ ઠંડી હોય, તો વરસાદ બરફ તરીકે પડે છે!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
        case 'mr':
          return [
            {
              id: 'rain-s1',
              title: "भाग 1: वाफ होणे (बाष्पीभवन) 💧☀️",
              content: "जेव्हा सूर्य नद्या आणि तलावांचे पाणी गरम करतो, तेव्हा पाण्याचे रूपांतर अदृश्य वाफेमध्ये होते! ही हलकी वाफ आकाशात वर जाते.",
              bullets: ["सूर्य नैसर्गिक हिटरचे काम करतो", "पाण्याचे रूपांतर वाफेमध्ये होते", "उष्ण हवा वाफेला वर घेऊन जाते"],
              keyFact: "☀️ सूर्याच्या उष्णतेशिवाय जलचक्र आणि पाऊस शक्य नाही!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "भाग 2: ढग तयार होणे (संघनन) ☁️❄️",
              content: "जशी वाफ वर जाते, तशी हवा थंड होते. थंड हवा वाफेचे रूपांतर पाण्याच्या लहान थेंबांमध्ये करते आणि हे थेंब एकत्र येऊन ढग बनतात!",
              bullets: ["उंचीवर हवा अतिशय थंड असते", "वाफ थंड होऊन पाण्याचे थेंब बनतात", "करोडो थेंब मिळून ढग बनतात"],
              keyFact: "☁️ एका मोठ्या ढगाचे वजन १०० हत्तींच्या बरोबर असू शकते!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "भाग 3: पाऊस पडणे (वर्षा) 🌧️🌍",
              content: "ढगाच्या आत हे लहान थेंब एकत्र येऊन मोठे आणि जड होतात! जेव्हा ढग जास्त जड होतात, तेव्हा ते जमिनीवर पाऊस म्हणून पडतात!",
              bullets: ["थेंब एकत्र येऊन मोठे व जड बनतात", "पाणी साठल्याने ढग काळे होतात", "गुरुत्वाकर्षण जड थेंबांना खाली खेचते"],
              keyFact: "🌧️ जर खाली खूप थंडी असेल, तर पाऊस बर्फाच्या स्वरूपात पडतो!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
        case 'ta':
          return [
            {
              id: 'rain-s1',
              title: "பகுதி 1: மேலே செல்லுதல் (ஆவியாதல்) 💧☀️",
              content: "சூரியனின் வெப்பத்தால் ஏரிகள் மற்றும் ஆறுகளிலுள்ள நீர் சூடாகி நீராவியாக மாறி வான்வெளிக்கு மேலே செல்கிறது.",
              bullets: ["சூரியன் இயற்கை சூடாக்கியாக செயல்படுகிறது", "நீரானது வாயுவாக மாறுகிறது", "வெப்ப காற்று நீராவியை மேலே கொண்டு செல்கிறது"],
              keyFact: "☀️ சூரிய வெப்பம் இல்லாவிட்டால் நீர் சுழற்சியும் மழையும் இல்லை!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "பகுதி 2: மேகம் உருவாவது (சுருங்குதல்) ☁️❄️",
              content: "நீராவி மேலே செல்ல செல்ல காற்று குளிர்கிறது. குளிர்ந்த காற்று நீராவியை மீண்டும் சிறிய நீர் துளிகளாக மாற்றி மேகங்களை உருவாக்குகிறது!",
              bullets: ["உயரத்தில் காற்று மிகவும் குளிர்ச்சியாக இருக்கும்", "நீராவி குளிர்ந்து நீர் துளிகளாக மாறுகிறது", "மில்லியன் கணக்கான நீர் துளிகள் மேகமாகிறது"],
              keyFact: "☁️ ஒரு மேகத்தின் எடை நூறு யானைகளின் எடைக்கு சமமாக இருக்கும்!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "பகுதி 3: மழை பெய்தல் (பொழிதல்) 🌧️🌍",
              content: "மேகத்திற்குள் நீர் துளிகள் மோதி பெரியதாகவும் கனமாகவும் மாறுகின்றன! மேகம் கனமாகும்போது, ஈர்ப்பு விசை அவற்றை மழையாக பூமியில் வீழ்த்துகிறது!",
              bullets: ["துளிகள் ஒன்றோடொன்று மோதி பெரிதாகிறது", "அதிக நீர் சேர்வதால் மேகங்கள் கறுக்கின்றன", "ஈர்ப்பு விசை துளிகளை மழையாக கீழே இழுக்கிறது"],
              keyFact: "🌧️ கீழே மிகவும் குளிராக இருந்தால், மழை பனியாக பொழியும்!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
        case 'te':
          return [
            {
              id: 'rain-s1',
              title: "భాగం 1: పైకి వెళ్ళడం (ఆవిరి కావడం) 💧☀️",
              content: "సూర్యుడి వేడి వల్ల చెరువులు మరియు నదులలో ఉన్న నీరు ఆవిరిగా మారి పైకి వెళ్తుంది.",
              bullets: ["సూర్యుడు సహజ హీటర్ లా పనిచేస్తాడు", "నీరు ద్రవ రూపం నుండి ఆవిరిగా మారుతుంది", "వేడి గాలి ఆవిరిని పైకి తీసుకువెళుతుంది"],
              keyFact: "☀️ సూర్యుడి వేడి లేకుండా నీటి చక్రం మరియు వర్షం సాధ్యం కాదు!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "భాగం 2: మేఘాలు ఏర్పడటం (ఘనీభవనం) ☁️❄️",
              content: "ఆవిరి పైకి వెళ్ళే కొద్దీ గాలి చల్లబడుతుంది. చల్లటి గాలి ఆవిరిని నీటి బిందువులుగా మార్చి మేఘాలను ఏర్పరుస్తుంది!",
              bullets: ["ఎత్తుకు వెళ్లేకొద్దీ గాలి చాలా చల్లగా ఉంటుంది", "ఆవిరి చల్లబడి నీటి బిందువులుగా మారుతుంది", "కోట్లాది బిందువులు కలిసి మేఘంగా ఏర్పడతాయి"],
              keyFact: "☁️ ఒక సాధారణ మేఘం బరువు వంద ఏనుగుల బరువుతో సమానం!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "భాగం 3: వర్షం కురవడం (వర్షపాతం) 🌧️🌍",
              content: "మేఘంలో నీటి బిందువులు కలిసి పెద్దవిగా, బరువుగా మారతాయి! మేఘం బరువెక్కినప్పుడు, గురుత్వాకర్షణ వల్ల వర్షంగా కురుస్తాయి!",
              bullets: ["నీటి బిందువులు కలిసి పెద్దవిగా మారతాయి", "ఎక్కువ నీరు చేరడంతో మేఘాలు నల్లగా మారతాయి", "గురుత్वाకర్షణ వల్ల వర్షపు బిందువులు కిందకు పడతాయి"],
              keyFact: "🌧️ కింద చాలా చల్లగా ఉంటే, వర్షం మంచుగా కురుస్తుంది!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
        default:
          return [
            {
              id: 'rain-s1',
              title: "Part 1: Rising Up (Evaporation) 💧☀️",
              content: "When lakes, rivers, and oceans are warmed up by the golden Sun, the water turns into an invisible gas called water vapor! This warm water vapor is lightweight, so it rises high up into the blue sky.",
              bullets: ["The sun acts as a natural heater", "Water changes from liquid to gas vapor", "Rising air carries the invisible vapor high up"],
              keyFact: "☀️ Without the Sun's warm heat, there would be no water cycle and no rain!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'evaporation' }
            },
            {
              id: 'rain-s2',
              title: "Part 2: Cloud Assembly (Condensation) ☁️❄️",
              content: "As the water vapor ascends, the air gets cooler and colder. The cold air makes the tiny water vapor particles gather together, turning back into millions of minuscule liquid water droplets! Together, they form beautiful fluffy clouds.",
              bullets: ["High altitude air is freezing cold", "Vapor condenses back into tiny liquid drops", "Dust particles in the air help hold the droplets"],
              keyFact: "☁️ A single fluffy cloud can weigh as much as a hundred elephants!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'condensation' }
            },
            {
              id: 'rain-s3',
              title: "Part 3: Falling Down (Precipitation) 🌧️🌍",
              content: "Inside the cloud, the tiny droplets bump into each other and grow larger and heavier! When the cloud gets too cold and packed with water, it can no longer hold them up. Gravity pulls them down, and they fall to Earth as refreshing rain!",
              bullets: ["Droplets bump together to grow larger", "Clouds turn grey as they get packed with water", "Gravity pulls the heavy droplets down as rain"],
              keyFact: "🌧️ If it is freezing cold all the way down, the rain turns into white fluffy snow!",
              visualLayout: "water-cycle",
              visualAttributes: { stage: 'precipitation' }
            }
          ];
      }
    }

    if (lesson.id === 'photo') {
      switch (targetLang) {
        case 'hi':
          return [
            {
              id: 'photo-s1',
              title: "पत्ती के सोलर पैनल ☀️🍃",
              content: "हरी पत्तियों में क्लोरोफिल नामक एक विशेष वर्णक होता है जो सूर्य की सुनहरी रोशनी को पकड़ता है और भोजन पकाने की तैयारी करता है!",
              bullets: ["क्लोरोफिल पत्तियों को हरा रंग देता है", "यह सूर्य की ऊर्जा को अवशोषित करता है", "पत्तियां पौधे की रसोई जैसी होती हैं"],
              keyFact: "🍃 क्लोरोफिल पौधों के लिए सौर ऊर्जा जनरेटर की तरह है!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "सामग्री का मिश्रण 💧🌬️",
              content: "पौधा अपनी जड़ों से मिट्टी से पानी सोखता है जो तने से होते हुए पत्तियों तक पहुंचता है। साथ ही, पत्तियां हवा से कार्बन डाइऑक्साइड गैस सोखती हैं!",
              bullets: ["जड़ें मिट्टी से पानी और पोषक तत्व सोखती हैं", "पत्तियों में मौजूद छोटे छिद्र हवा को सोखते हैं", "पानी और गैस भोजन की मुख्य सामग्री हैं"],
              keyFact: "🌬️ कार्बन डाइऑक्साइड सोखकर पौधे हवा को साफ करते हैं!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "भोजन और ताजी हवा 🍬💨",
              content: "सूर्य की ऊर्जा का उपयोग करके पत्ती पानी और कार्बन डाइऑक्साइड को मिलाती है! इससे मीठा ग्लूकोज भोजन बनता है और सांस लेने के लिए ताजी ऑक्सीजन निकलती है!",
              bullets: ["पानी और कार्बन डाइऑक्साइड मिलकर ग्लूकोज बनते हैं", "ग्लूकोज पौधे को बढ़ने में मदद करता है", "पौधे सांस लेने के लिए ऑक्सीजन छोड़ते हैं"],
              keyFact: "🌳 एक बड़ा पेड़ चार इंसानों के लिए दैनिक ऑक्सीजन प्रदान कर सकता है!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
        case 'gu':
          return [
            {
              id: 'photo-s1',
              title: "પાંદડાના સોલર પેનલ ☀️🍃",
              content: "લીલા પાંદડાઓમાં ક્લોરોફિલ નામનું તત્વ હોય છે જે સૂર્યપ્રકાશને પકડે છે અને છોડ માટે રસોઈ બનાવવાની શરૂઆત કરે છે!",
              bullets: ["ક્લોરોફિલ પાંદડાને લીલો રંગ આપે છે", "તે સૂર્યની ઉર્જા શોષી લે છે", "પાંદડા છોડનું રસોડું છે"],
              keyFact: "🍃 ક્લોરોફિલ છોડ માટે સોલર પાવર જેવું કામ કરે છે!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "રસોઈની સામગ્રી ભેગી કરવી 💧🌬️",
              content: "છોડ મૂળ દ્વારા જમીનમાંથી પાણી શોષી પાંદડા સુધી પહોંચાડે છે અને હવામાંથી કાર્બન ડાયોક્સાઈડ વાયુ લે છે!",
              bullets: ["મૂળ જમીનમાંથી પાણી શોષી લે છે", "પાંદડા પરના નાના છિદ્રો હવા લે છે", "પાણી અને ગેસ રસોઈની મુખ્ય સામગ્રી છે"],
              keyFact: "🌬️ કાર્બન ડાયોક્સાઈડ શોષીને છોડ હવાને ચોખ્ખી કરે છે!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "ગ્લુકોઝ અને ઓક્સિજન 🍬💨",
              content: "સૂર્યની શક્તિથી પાંદડું પાણી અને કાર્બન ડાયોક્સાઈડ મિક્સ કરે છે! આમાંથી ગ્લુકોઝ (ખોરાક) બને છે અને આપણને શ્વાસ લેવા ઓક્સિજન મળે છે!",
              bullets: ["પાણી અને કાર્બન ડાયોક્સાઈડ ગ્લુકોઝ બને છે", "આ ગ્લુકોઝ છોડના વિકાસ માટે વપરાય છે", "છોડ વાતાવરણમાં ઓક્સિજન છોડે છે"],
              keyFact: "🌳 એક મોટું વૃક્ષ ચાર માણસોને આખા દિવસનો ઓક્સિજન આપી શકે છે!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
        case 'mr':
          return [
            {
              id: 'photo-s1',
              title: "पानांचे सोलर पॅनेल ☀️🍃",
              content: "हिरव्या पानांमध्ये क्लोरोफिल नावाचे एक विशेष रंगद्रव्य असते, जे सूर्याचा प्रकाश शोषून घेते आणि अन्न बनवण्याची प्रक्रिया सुरू करते!",
              bullets: ["क्लोरोफिलमुळे पानांना हिरवा रंग मिळतो", "ते सूर्यप्रकाश शोषून घेते", "पाने म्हणजे झाडांचे स्वयंपाकघर असते"],
              keyFact: "🍃 क्लोरोफिल झाडांसाठी सौर ऊर्जा निर्मितीचे काम करते!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "साहित्य एकत्र करणे 💧🌬️",
              content: "झाड मुळांद्वारे जमिनीतील पाणी शोषून घेते जे पानांपर्यंत पोहोचते. तसेच, पाने हवेतील कार्बन डायऑक्साइड शोषून घेतात!",
              bullets: ["मुळे जमिनीतून पाणी शोषून घेतात", "पानांवरील सूक्ष्म छिद्रे हवा शोषून घेतात", "पाणी आणि कार्बन डायऑक्साइड हे मुख्य साहित्य आहे"],
              keyFact: "🌬️ झाडे कार्बन डायऑक्साइड शोषून घेऊन हवा शुद्ध करतात!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "ग्लुकोज आणि ऑक्सिजन निर्मिती 🍬💨",
              content: "सूर्याच्या ऊर्जेचा वापर करून झाड पाणी आणि कार्बन डायऑक्साइड एकत्र करते! यामुळे झाडांचे अन्न (ग्लुकोज) तयार होते आणि ऑक्सिजन हवेत सोडला जातो!",
              bullets: ["पाणी आणि हवेपासून ग्लुकोज तयार होते", "अन्नामुळे झाडांची वाढ होते", "झाडे हवेत शुद्ध ऑक्सिजन सोडतात"],
              keyFact: "🌳 एक मोठे झाड चार माणसांना पुरेल एवढा रोजचा ऑक्सिजन देऊ शकते!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
        case 'ta':
          return [
            {
              id: 'photo-s1',
              title: "இலையின் சூரிய ஒளி சேகரிப்பான் ☀️🍃",
              content: "பச்சை இலைகளில் பச்சையம் (Chlorophyll) உள்ளது. இது சூரிய ஒளியை உறிஞ்சி தாவரத்திற்கான உணவு தயாரிப்பைத் தொடங்குகிறது!",
              bullets: ["பச்சையம் இலைகளுக்கு பச்சை நிறத்தைத் தருகிறது", "இது சூரிய ஆற்றலை ஈர்க்கிறது", "இலைகள் தாவரங்களின் சமையலறையாகும்"],
              keyFact: "🍃 பச்சையம் என்பது தாவரங்களின் இயற்கை சூரிய ஒளி மின்சாரம்!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "தேவையான பொருட்கள் 💧🌬️",
              content: "வேர்கள் மண்ணிலிருந்து நீரை உறிஞ்சி இலைகளுக்கு அனுப்புகின்றன. அதே சமயம் இலைகள் காற்றிலுள்ள கார்பன் டை ஆக்சைடை உறிஞ்சுகின்றன!",
              bullets: ["வேர்கள் மண்ணிலிருந்து நீர் மற்றும் சத்துக்களை உறிஞ்சுகின்றன", "இலைத் துளைகள் காற்றை உறிஞ்சுகின்றன", "நீரும் வாயுவும் உணவுக்கான முக்கிய பொருட்கள்"],
              keyFact: "🌬️ கார்பன் டை ஆக்சைடை உறிஞ்சி தாவரங்கள் காற்றைத் தூய்மைப்படுத்துகின்றன!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "சர்க்கரையும் ஆக்சிஜனும் 🍬💨",
              content: "சூரிய ஆற்றலால் இலை நீரை கார்பன் டை ஆக்சைடுடன் சேர்க்கிறது! இதனால் குளுக்கோஸ் உணவு தயாராகிறது மற்றும் நாம் சுவாசிக்க ஆக்சிஜன் வெளியாகிறது!",
              bullets: ["நீரும் வாயுவும் சேர்ந்து குளுக்கோஸ் ஆகிறது", "குளுக்கோஸ் தாவர வளர்ச்சிக்கு உதவுகிறது", "செடிகள் நமக்குத் தேவையான ஆக்சிஜனை வெளியிடுகின்றன"],
              keyFact: "🌳 ஒரு பெரிய மரம் நான்கு மனிதர்களுக்குத் தேவையான தினசரி ஆக்சிஜனைத் தரும்!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
        case 'te':
          return [
            {
              id: 'photo-s1',
              title: "ఆకుల సోలార్ ప్యానెల్స్ ☀️🍃",
              content: "ఆకుపచ్చని ఆకులలో పత్రహరితం (Chlorophyll) ఉంటుంది. ఇది సూర్యరశ్మిని గ్రహించి ఆహారాన్ని తయారు చేయడానికి సహాయపడుతుంది!",
              bullets: ["పత్రహరితం ఆకులకు ఆకుపచ్చ రంగును ఇస్తుంది", "ఇది సూర్య శక్తిని గ్రహిస్తుంది", "ఆకులు మొక్కల వంటశాలల లాంటివి"],
              keyFact: "🍃 పత్రహరితం మొక్కలకు సోలార్ పవర్ లాంటిది!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "కావలసిన పదార్థాలు 💧🌬️",
              content: "వేర్లు నేల నుండి నీటిని పీల్చుకుని ఆకులకు పంపుతాయి. అదే సమయంలో, ఆకులు గాలి నుండి కార్బన్ డై ఆక్సైడ్ ను గ్రహిస్తాయి!",
              bullets: ["వేర్లు నేల నుండి నీటిని గ్రహిస్తాయి", "ఆకులపై ఉండే చిన్న రంధ్రాలు గాలిని పీల్చుకుంటాయి", "నీరు మరియు గాలి ఆహారానికి కావలసిన ముఖ్య పదార్థాలు"],
              keyFact: "🌬️ కార్బన్ డై ఆక్సైడ్ గ్రహించి మొక్కలు గాలిని శుభ్రపరుస్తాయి!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "గ్లూకోజ్ మరియు ఆక్సిజన్ 🍬💨",
              content: "సూర్యుడి శక్తితో ఆకులు నీటిని మరియు కార్బన్ డై ఆక్సైడ్ ను కలుపుతాయి! దీనివల్ల గ్లూకోజ్ (ఆహారం) తయారవుతుంది మరియు ఆక్సిజన్ విడుదలవుతుంది!",
              bullets: ["నీరు మరియు వాయువు కలిసి గ్లూకోజ్ గా మారుతాయి", "గ్లూకోజ్ మొక్క ఎదుగుదలకు ఉపయోగపడుతుంది", "మొక్కలు మన శ్వాస కోసం ఆక్సిజన్ విడుదల చేస్తాయి"],
              keyFact: "🌳 ఒక పెద్ద చెట్టు నలుగురు మనుషులకు కావలసిన ఆక్సిజన్ ను ఇస్తుంది!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
        default:
          return [
            {
              id: 'photo-s1',
              title: "Leaf Solar Panels ☀️🍃",
              content: "Green leaves have tiny solar-catching receptors called Chlorophyll. This amazing green pigment absorbs bright golden light from the Sun, capturing its energy to start the cooking process!",
              bullets: ["Chlorophyll gives leaves their green color", "It captures solar energy from sunlight", "Leaves act as tiny food factories"],
              keyFact: "🍃 Green chlorophyll is the key solar-power generator for plants!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'sunlight' }
            },
            {
              id: 'photo-s2',
              title: "Mixing the Ingredients 💧🌬️",
              content: "The plant drinks fresh water from the soil using its deep roots, traveling up the stem to the leaves. At the same time, leaves breathe in Carbon Dioxide gas from the air through microscopic mouth-like pores called Stomata!",
              bullets: ["Roots absorb water and nutrients from soil", "Microscopic pores called Stomata breathe in air", "CO2 and water are the raw ingredients"],
              keyFact: "🌬️ Plants clean the air by absorbing carbon dioxide gas!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'ingredients' }
            },
            {
              id: 'photo-s3',
              title: "Cooking Food & Fresh Air 🍬💨",
              content: "Using the Sun's energy, the leaf merges water and carbon dioxide together! This chemical reaction cooks sweet glucose (sugar food) for the plant to grow. As a wonderful gift, they release fresh Oxygen into the air for us to breathe!",
              bullets: ["Leaves combine water & carbon dioxide into glucose", "Glucose is stored in the plant for growth", "Fresh, clean Oxygen is released into the atmosphere"],
              keyFact: "🌳 One large tree can provide enough daily oxygen for four humans!",
              visualLayout: "photosynthesis",
              visualAttributes: { stage: 'glucose' }
            }
          ];
      }
    }

    if (lesson.id === 'math') {
      switch (targetLang) {
        case 'hi':
          return [
            {
              id: 'math-s1',
              title: "जोड़, लेकिन सुपर फास्ट! ➕⚡",
              content: "सोचिए आपके पास 3 टोकरियाँ हैं, और हर टोकरी में 5 मिठाइयाँ हैं। कुल पता लगाने के लिए आप 5 + 5 + 5 जोड़ सकते हैं। लेकिन एक तेज़ तरीका है: 5 का 3 गुना, यानी 5 x 3 = 15!",
              bullets: ["गुणा वास्तव में बार-बार जोड़ना ही है", "संकेत 'x' का अर्थ है 'का समूह'", "यह लंबी जोड़ियों से समय बचाता है"],
              keyFact: "⚡ गुणा तेजी से गिनने की गणितीय महाशक्ति है!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 3, cols: 5, stage: 'addition' }
            },
            {
              id: 'math-s2',
              title: "ग्रिड का जादू 🟦⭐",
              content: "जब हम चीजों को पंक्तियों और स्तंभों में व्यवस्थित करते हैं, तो एक ग्रिड बनता है! यदि हमारे पास 4 पंक्तियाँ और 6 स्तंभ हैं, तो कुल 4 x 6 = 24 सितारे होंगे!",
              bullets: ["पंक्तियाँ आड़ी लाइनें होती हैं", "स्तंभ खड़ी लाइनें होती हैं", "ग्रिड कुल संख्या तुरंत दिखाता है"],
              keyFact: "⭐ ग्रिड दिखाते हैं कि गुणा कैसे काम करता है!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 4, cols: 6, stage: 'grid' }
            },
            {
              id: 'math-s3',
              title: "दैनिक जीवन में गुणा 🛒🎒",
              content: "हम हर दिन गुणा का उपयोग करते हैं! चाहे चॉकलेट गिनना हो या पैसे बचाना। यदि आप रोज 10 रुपये बचाते हैं, तो 7 दिनों में आपके पास 10 x 7 = 70 रुपये होंगे!",
              bullets: ["दुकानों और पैकेटों में ग्रिड उपयोग होते हैं", "पैसों और बचत के लिए शानदार शॉर्टकट है", "प्रोग्रामर को कोडिंग में मदद करता है"],
              keyFact: "🪙 पहाड़े याद रखना दिमाग में कैलकुलेटर होने जैसा है!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 2, cols: 8, stage: 'shortcut' }
            }
          ];
        default:
          return [
            {
              id: 'math-s1',
              title: "Addition, but Super Fast! ➕⚡",
              content: "Imagine you have 3 baskets, and each basket contains 5 sweet candies. To find the total, you could add 5 + 5 + 5. But there is a faster trick! We have 3 groups of 5, which we write as 5 times 3, or 5 x 3!",
              bullets: ["Multiplication is just repeated addition", "The 'x' symbol means 'groups of'", "Saves us from adding long lines of numbers"],
              keyFact: "⚡ Multiplication is the math superpower of fast counting!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 3, cols: 5, stage: 'addition' }
            },
            {
              id: 'math-s2',
              title: "Organizing in Rows & Columns 🟦⭐",
              content: "When we arrange items in clean rows and columns, we get a beautiful math grid! If we have a grid with 4 rows and 6 columns of stars, we can instantly count them all as 4 x 6, which equals 24 stars!",
              bullets: ["Rows are horizontal lines", "Columns are vertical lines", "The grid area gives the total count instantly"],
              keyFact: "⭐ Grids make it super easy to see why multiplication works!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 4, cols: 6, stage: 'grid' }
            },
            {
              id: 'math-s3',
              title: "The Math Shield of Speed 🛒🎒",
              content: "We use multiplication every day! Whether counting tile patterns on the floor, packets of toys in a store, or pocket money savings. If you save 10 rupees every day for 7 days, you instantly know you have 10 x 7 = 70 rupees!",
              bullets: ["Tiles, rows of chairs, and boxes use grids", "Great for calculating shop prices and savings", "Helps computer programmers build smart software"],
              keyFact: "🪙 Knowing your tables is like having a calculator inside your head!",
              visualLayout: "multiplication",
              visualAttributes: { rows: 2, cols: 8, stage: 'shortcut' }
            }
          ];
      }
    }

    // Fallback split sentences
    const sentences = lesson.explanation.split(/[.!?।]\s*/).filter(Boolean);
    const slidesCount = Math.min(Math.max(sentences.length, 1), 3);
    const slidesList = [];
    for (let i = 0; i < slidesCount; i++) {
      const textPart = sentences[i] || lesson.explanation;
      slidesList.push({
        id: `${lesson.id}-fallback-s${i}`,
        title: `${lesson.query} - Phase ${i + 1}`,
        content: textPart + ".",
        bullets: [`Focusing on ${lesson.subject}`, "Visual study and interaction"],
        keyFact: `💡 Tip: Active listening increases memory power by 80%!`,
        visualLayout: "conceptual-flow",
        visualAttributes: { stepNumber: i + 1, totalSteps: slidesCount, stepTitle: `Phase ${i + 1}`, keywords: ['Study', 'AIdesigned'], accentColor: '#E07A5F' }
      });
    }
    return slidesList;
  };

  const playSlideVoice = (slideIndex: number) => {
    if (!selectedLesson) return;
    const slides = getSlidesForLesson(selectedLesson, lang);
    const activeSlide = slides[slideIndex] || slides[0];
    if (!activeSlide) return;

    setIsPlayingVideo(true);
    setAvatarAction('explaining');
    speakText(activeSlide.content, lang, selectedLesson.avatarName, selectedLesson.avatarChar, () => {
      setIsPlayingVideo(false);
      setAvatarAction('idle');

      if (isAutoplayEnabledRef.current && slideIndex < slides.length - 1) {
        setTimeout(() => {
          if (currentSlideIndexRef.current === slideIndex && isAutoplayEnabledRef.current) {
            const nextIdx = slideIndex + 1;
            setCurrentSlideIndex(nextIdx);
            playSlideVoice(nextIdx);
          }
        }, 1200);
      }
    });
  };

  const simulateVideoGeneration = (lesson: LessonQuery, autoPlay: boolean) => {
    setIsGeneratingVideo(true);
    setGenerationProgress(0);
    setAvatarAction('wave');

    const getLocalizationStage = (pct: number, name?: string) => {
      if (pct < 35) {
        switch (lang) {
          case 'hi': return `📖 आपके प्यारे चरित्र '${name}' का ऑफलाइन अध्ययन पैक लोड हो रहा है...`;
          case 'gu': return `📖 તમારા પ્રિય શિક્ષક '${name}' નો પાઠ્યક્રમ લોડ થઈ રહ્યો છે...`;
          case 'mr': return `📖 तुमच्या आवडीच्या पात्राचा '${name}' अभ्यास संच तयार होत आहे...`;
          case 'ta': return `📖 உங்கள் ஆசிரியர் '${name}' பாடங்கள் சேகரிக்கப்படுகின்றன...`;
          case 'te': return `📖 మీ గురువు '${name}' పాఠాల వివరాలు పరిశీలిస్తోంది...`;
          default: return `📖 Fetching localized study modules for ${name}...`;
        }
      } else if (pct < 65) {
        switch (lang) {
          case 'hi': return `🎙️ ${name} की आवाज़ और लयात्मक ट्यूनिंग सेट हो रही है...`;
          case 'gu': return `🎙️ ${name} નો અવાજ અને પિચ સેટ થઈ રહ્યો છે...`;
          case 'mr': return `🎙️ ${name} चा स्वर आणि संगीत समक्रमित होत आहे...`;
          case 'ta': return `🎙️ ${name} குரல்வடிவம் சேர்க்கப்படுகிறது...`;
          case 'te': return `🎙️ ${name} వాయిస్ రికార్డింగ్ జతచేస్తోంది...`;
          default: return `🎙️ Synthesizing voice waveforms for ${name}...`;
        }
      } else if (pct < 90) {
        switch (lang) {
          case 'hi': return `🎬 रीयल-टाइम एनिमेशन और चेष्टाएँ सिंक हो रही हैं...`;
          case 'gu': return `🎬 રિયલ-ટાઇમ ચહેરાના હાવભાવ બની રહ્યાં છે...`;
          case 'mr': return `🎬 प्रत्यक्ष कृती आणि व्हिडिओ जोडला जात आहे...`;
          case 'ta': return `🎬 பாவனைகள் மற்றும் அசைவூட்டம் தயாராகிறது...`;
          case 'te': return `🎬 ముఖ కవళికలు మరియు చేష్టలను సమకాలీకరిస్తోంది...`;
          default: return `🎬 Syncing real-time facial tracks & gestures...`;
        }
      } else {
        switch (lang) {
          case 'hi': return `✨ ऑफ़लाइन खेलने योग्य पाठ संकलित किया जा रहा है...`;
          case 'gu': return `✨ ઓફલાઇન વિડીયો પેક કમ્પાઇલ થઈ રહ્યો છે...`;
          case 'mr': return `✨ ऑफलाइन चालणारा पाठ एकत्रित होत आहे...`;
          case 'ta': return `✨ இறுதி எடிட்டிங் செய்யப்படுகிறது...`;
          case 'te': return `✨ అంతిమ ఇంటరాక్టివ్ పాఠాన్ని సిద్ధం చేస్తోంది...`;
          default: return `✨ Bundling interactive offline playable video...`;
        }
      }
    };

    setGenerationStage(getLocalizationStage(0, lesson.avatarName));
    const totalSteps = 20;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setGenerationProgress(currentProgress);

      if (currentProgress === 30) {
        setAvatarAction('think');
      } else if (currentProgress === 65) {
        setAvatarAction('idea');
      } else if (currentProgress === 85) {
        setAvatarAction('thumbsup');
      }

      setGenerationStage(getLocalizationStage(currentProgress, lesson.avatarName));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsGeneratingVideo(false);
        setSelectedLesson(lesson);
        setCurrentSlideIndex(0);
        if (autoPlay) {
          setIsPlayingVideo(true);
          const slides = getSlidesForLesson(lesson, lang);
          const firstSlide = slides[0] || { content: lesson.explanation };
          speakText(firstSlide.content, lang, lesson.avatarName, lesson.avatarChar, () => {
            setIsPlayingVideo(false);
            setAvatarAction('idle');
          });
          setAvatarAction('celebrate');
          setTimeout(() => {
            setAvatarAction((prev) => prev === 'celebrate' ? 'explaining' : prev);
          }, 2000);
        } else {
          setAvatarAction('wave');
          setTimeout(() => {
            setAvatarAction('idle');
          }, 2000);
        }
      }
    }, 100);
  };

  const handleLessonSelect = (lesson: LessonQuery) => {
    setSelectedLesson(lesson);
    setCurrentSlideIndex(0);
    setShowQuiz(false);
    setOtpResetQuiz();
    setIsNewLecture(false);
    setShowHistory(false);
    setShowPlayGesturePrompt(false);
    simulateVideoGeneration(lesson, false);
  };

  const handleDeleteLesson = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'hi' ? "क्या आप सचमुच इस लेक्चर को इतिहास से हटाना चाहते हैं?" : "Are you sure you want to delete this lecture from your history?")) {
      setCustomHistory(prev => {
        const updated = prev.filter(item => item.id !== lessonId);
        localStorage.setItem(`${user.mobile}_mascot_lessons_history`, JSON.stringify(updated));
        return updated;
      });
      if (selectedLesson.id === lessonId) {
        setIsNewLecture(true);
      }
    }
  };

  const handleClearAllHistory = () => {
    if (confirm(lang === 'hi' ? "क्या आप पूरा इतिहास हटाना चाहते हैं?" : "Are you sure you want to permanently clear your lecture history?")) {
      setCustomHistory([]);
      localStorage.removeItem(`${user.mobile}_mascot_lessons_history`);
      setIsNewLecture(true);
    }
  };

  const handleAskCustomQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    const queryText = customQuery.trim();
    setIsGeneratingVideo(true);
    setGenerationProgress(10);
    
    const mascotName = selectedLesson.avatarName || "Swami AI";
    const targetLangName = LANGUAGE_NAMES[lang] || "English";

    // Retrieve customized student context
    const studentName = user.name || 'Student';
    const gradeLevel = user.standard || localStorage.getItem(`${user.mobile}_profile_standard`) || 'Grade 6 Science';
    const studentVillage = user.village || localStorage.getItem(`${user.mobile}_profile_village`) || 'Rampur Vilas';
    const studentSchool = user.school || localStorage.getItem(`${user.mobile}_profile_school`) || 'Rampur Primary Public School';
    const studentPoints = user.totalPoints ?? Number(localStorage.getItem(`${user.mobile}_quizzes_total_points`)) ?? 15;
    const currentProgress = studentPoints < 100 ? "Beginner" : studentPoints < 300 ? "Intermediate" : "Reviewing & Advanced";
    
    setGenerationStage(
      lang === 'hi' ? `🧠 एआई शिक्षक आपके विषय "${queryText}" पर शोध कर रहे हैं...` :
      lang === 'gu' ? `🧠 એઆઈ શિક્ષક તમારા વિષય "${queryText}" પર સંશોધન કરી રહ્યા છે...` :
      lang === 'mr' ? `🧠 एआय शिक्षक तुमच्या विषयावर "${queryText}" संशोधन करत आहेत...` :
      lang === 'ta' ? `🧠 AI ஆசிரியர் உங்கள் தலைப்பு "${queryText}" பற்றி ஆராய்கிறார்...` :
      lang === 'te' ? `🧠 AI ఉపాధ్యాయుడు మీ అంశం "${queryText}" పై పరిశోధన చేస్తున్నాడు...` :
      `🧠 AI Tutor is researching your topic "${queryText}"...`
    );

    try {
      const systemInstruction = `You are ${mascotName}, an empathetic, highly adaptive school tutor designed specifically for rural Indian students. You explain difficult concepts in highly visual, exciting, and step-by-step ways.

[EMPATHETIC ADAPTIVE TUTOR PROFILE]
- Target Student Name: ${studentName} (Address them personally by their name "${studentName}" occasionally in slide content, key facts, or question explanations to build rapport).
- Student Grade/Class Level: ${gradeLevel} (Scale the complexity, vocabulary, and logic of your explanations to match exactly this grade level).
- Student Home Village: ${studentVillage} (Incorporate or refer to their local village "${studentVillage}" or village school "${studentSchool}" if relevant).
- Student Progress Level: ${currentProgress} (Tailor slide details for this progress level: beginners get extra step-by-step guidance, intermediate gets active application prompts, and advanced gets reviewing concepts).
- Target Language: ${targetLangName} (All slide content, quiz questions, options, and explanations MUST be written in ${targetLangName} using its native alphabet/script. Use simple, local, and culturally relevant analogies like farming, local markets, village festivals, crops, or animals to explain complex topics).

[BEHAVIOR & PEDAGOGICAL GUIDELINES]
- Do not give wall-of-text answers. Use short paragraphs and bullet points in the slides.
- In explanations of quiz answers, Socratic guidance is key. Instead of just giving the correct answer flatly, write explanations that guide the student to understand the underlying concept step-by-step.

CRITICAL REQUIREMENTS:
1. Generate a structured lesson presentation with exactly 3 sequential slides explaining the requested topic: "${queryText}".
2. All lesson title, content, bullet points, key facts, quiz questions, options, and explanations MUST be written in ${targetLangName} using its native alphabet/script.
3. The slides should be highly detailed, educational, and easy for school kids to understand.
4. Each slide must specify a "visualLayout": choosing from "water-cycle" (if related to weather/water), "photosynthesis" (if related to plants/biology), "multiplication" (if related to math/counting/arithmetic), or "conceptual-flow" (for general science, history, geography, physics, or any other topic).
5. Return ONLY valid raw JSON that strictly matches the JSON schema below. Do NOT wrap in markdown code blocks like \`\`\`json. Return the raw JSON string directly.

JSON Schema:
{
  "query": "${queryText}",
  "subject": "Academic Category (e.g., Biology, Space Science, Chemistry, Math, History, Physics) 🔬",
  "videoThumbColor": "from-purple-400 to-indigo-600",
  "slides": [
    {
      "id": "custom-s1",
      "title": "Exciting and catchy slide title in ${targetLangName}",
      "content": "A detailed 2-3 sentence paragraph explaining the first phase of this concept simply, in ${targetLangName}.",
      "bullets": ["Interactive detail 1", "Interactive detail 2", "Interactive detail 3"],
      "keyFact": "A surprising, memorable, or fun fact related to this slide",
      "visualLayout": "conceptual-flow",
      "visualAttributes": {
        "stepNumber": 1,
        "totalSteps": 3,
        "stepTitle": "Name of Phase 1",
        "keywords": ["keyword1", "keyword2"],
        "accentColor": "#F2CC8F"
      }
    },
    {
      "id": "custom-s2",
      "title": "Catchy slide title in ${targetLangName}",
      "content": "A detailed 2-3 sentence paragraph explaining the second phase of this concept simply, in ${targetLangName}.",
      "bullets": ["Interactive detail 1", "Interactive detail 2", "Interactive detail 3"],
      "keyFact": "A surprising, memorable, or fun fact related to this slide",
      "visualLayout": "conceptual-flow",
      "visualAttributes": {
        "stepNumber": 2,
        "totalSteps": 3,
        "stepTitle": "Name of Phase 2",
        "keywords": ["keyword1", "keyword2"],
        "accentColor": "#E07A5F"
      }
    },
    {
      "id": "custom-s3",
      "title": "Catchy slide title in ${targetLangName}",
      "content": "A detailed 2-3 sentence paragraph explaining the summary or real-world application of this concept simply, in ${targetLangName}.",
      "bullets": ["Application detail 1", "Application detail 2", "Application detail 3"],
      "keyFact": "A surprising, memorable, or fun fact related to this slide",
      "visualLayout": "conceptual-flow",
      "visualAttributes": {
        "stepNumber": 3,
        "totalSteps": 3,
        "stepTitle": "Name of Phase 3",
        "keywords": ["keyword1", "keyword2"],
        "accentColor": "#81B29A"
      }
    }
  ],
  "quiz": [
    {
      "id": "custom-q1",
      "question": "First multiple choice question related to slide concepts, in ${targetLangName}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Clear explanation of why this answer is correct, in ${targetLangName}"
    },
    {
      "id": "custom-q2",
      "question": "Second multiple choice question related to slide concepts, in ${targetLangName}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 1,
      "explanation": "Clear explanation of why this answer is correct, in ${targetLangName}"
    }
  ]
}`;

      setGenerationProgress(40);
      setGenerationStage(
        lang === 'hi' ? `🎙️ स्वर और एनिमेशन ट्रैक को सिंक किया जा रहा है...` :
        lang === 'gu' ? `🎙️ અવાજ અને અનીમેશન સિંક થઈ રહ્યું છે...` :
        lang === 'mr' ? `🎙️ आवाज आणि एनिमेटेड ग्राफिक्स समक्रमित होत आहेत...` :
        lang === 'ta' ? `🎙️ குரல் மற்றும் அசைவூட்டங்கள் ஒத்திசைக்கப்படுகின்றன...` :
        lang === 'te' ? `🎙️ వాయిస్ మరియు యానిమేషన్ సమకాలీకరిస్తోంది...` :
        `🎙️ Syncing voice tracks and interactive animation layers...`
      );

      const reqPayload: any = {
        message: attachedFile 
          ? `Generate a structured 3-slide lesson presentation with quiz questions in ${targetLangName} about "${queryText}". Please analyze the attached document or image (${attachedFile.file.name}) and incorporate its teachings, context, formulas, or diagrams directly into the slides and quiz questions.`
          : `Generate a structured 3-slide lesson presentation with quiz questions in ${targetLangName} about "${queryText}".`,
        systemInstruction,
        board: user.board || localStorage.getItem(`${user.mobile}_profile_board`) || 'CBSE',
        lang: lang
      };

      if (attachedFile) {
        reqPayload.image = {
          data: attachedFile.base64Data,
          mimeType: attachedFile.mimeType
        };
      }

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload)
      });

      setGenerationProgress(75);
      const data = await response.json();

      if (data.success && data.text) {
        let cleanText = data.text.trim();
        if (cleanText.startsWith('```')) {
          const lines = cleanText.split('\n');
          if (lines[0].startsWith('```')) {
            lines.shift();
          }
          if (lines[lines.length - 1].startsWith('```')) {
            lines.pop();
          }
          cleanText = lines.join('\n').trim();
        }

        const parsedLesson = JSON.parse(cleanText);
        
        const newLesson: LessonQuery = {
          id: 'custom-' + Math.random().toString(36).substring(2, 5),
          query: parsedLesson.query || queryText,
          subject: parsedLesson.subject || "AI Generator ✨",
          avatarChar: selectedLesson.avatarChar || "🤖 Swami AI",
          avatarName: selectedLesson.avatarName || "Swami AI (Mascot Tutor)",
          explanation: parsedLesson.slides?.[0]?.content || "Dynamic AI Lesson created!",
          videoThumbColor: parsedLesson.videoThumbColor || "from-fuchsia-400 to-indigo-600",
          slides: parsedLesson.slides || [],
          quiz: parsedLesson.quiz || [
            {
              id: 'custom-q1',
              question: `What did we learn about "${queryText}"?`,
              options: ["A lot of cool facts", "Nothing", "Something scary", "A hard equation"],
              answerIndex: 0,
              explanation: "We learned many cool facts about this amazing topic!"
            }
          ]
        };

        setGenerationProgress(100);
        setIsGeneratingVideo(false);
        
        // Add to history list and persist
        setCustomHistory(prev => {
          const updated = [newLesson, ...prev];
          localStorage.setItem(`${user.mobile}_mascot_lessons_history`, JSON.stringify(updated));
          return updated;
        });
        setActiveDeckTab('history');
        setIsNewLecture(false);
        setShowHistory(false);

        setSelectedLesson(newLesson);
        setCurrentSlideIndex(0);
        setShowQuiz(false);
        setOtpResetQuiz();
        setCustomQuery('');
        setAttachedFile(null);

        setShowPlayGesturePrompt(true);
        setIsPlayingVideo(false);
        setAvatarAction('celebrate');

      } else {
        throw new Error(data.message || "Failed to generate lesson content.");
      }

    } catch (err) {
      console.error("Error generating custom lesson:", err);
      let explanation = "";
      let quizQuestion = "";
      let quizOptions: string[] = [];
      let quizExplanation = "";
      let avatarName = selectedLesson.avatarName || "Swami AI";
      let avatarChar = selectedLesson.avatarChar || "🤖 Swami";

      switch (lang) {
        case 'hi':
          explanation = `अद्भुत जिज्ञासा! आपने "${queryText}" के बारे में पूछा। प्रकृति में सब कुछ एक दूसरे से जुड़ा हुआ है। हम अपने मस्तिष्क में सुपर लॉजिक बनाने के लिए इन विषयों का चरण-दर-चरण अध्ययन करते हैं! सीखने के लिए नीचे खेल खेलें।`;
          quizQuestion = `आज आपको "${queryText}" के बारे में कौन सा एआई शिक्षक पढ़ा रहा है?`;
          quizOptions = ["दादी एआई", "स्वामी एआई", "कोई नहीं", "एक डरावना कंप्यूटर"];
          quizExplanation = "स्वामी एआई आपका बुद्धिमान एआई साथी है!";
          break;
        default:
          explanation = `Excellent curiosity! You asked about "${queryText}". Everything in nature is connected. We study these topics step by step to build super logic inside our brains! Try completing the special conceptual games that follow.`;
          quizQuestion = `Which AI character is teaching you about "${queryText}" today?`;
          quizOptions = ["Dadi AI", "Swami AI", "No one", "A scary computer"];
          quizExplanation = "Swami AI is your smart cartoon companion!";
          break;
      }

      const matchesLesson: LessonQuery = {
        id: 'custom-' + Math.random().toString(36).substring(2, 5),
        query: queryText,
        subject: "AI Generator ✨",
        avatarChar,
        avatarName,
        explanation,
        videoThumbColor: "from-fuchsia-400 to-indigo-600",
        slides: [
          {
            id: 'custom-s1',
            title: `Introduction: ${queryText}`,
            content: explanation,
            bullets: ["Interactive study step", "Fun exploration block", "Academic feedback"],
            keyFact: `💡 The universe is packed with incredible answers waiting to be found!`,
            visualLayout: "conceptual-flow",
            visualAttributes: { stepNumber: 1, totalSteps: 3, stepTitle: "Introduction", keywords: ['Curiosity', 'Science'], accentColor: '#3D405B' }
          }
        ],
        quiz: [
          {
            id: 'custom-q1',
            question: quizQuestion,
            options: quizOptions,
            answerIndex: 1,
            explanation: quizExplanation
          }
        ]
      };

      setIsGeneratingVideo(false);
      setSelectedLesson(matchesLesson);
      setCurrentSlideIndex(0);
      setShowQuiz(false);
      setOtpResetQuiz();
      setCustomQuery('');

      setShowPlayGesturePrompt(true);
      setIsPlayingVideo(false);
      setAvatarAction('celebrate');
    }
  };

  const handlePlayVoiceResponse = () => {
    playSlideVoice(currentSlideIndex);
  };

  const handleStopVoiceResponse = () => {
    setIsPlayingVideo(false);
    setAvatarAction('idle');
    stopSpeaking();
  };

  const triggerLiveAction = (actionType: 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think') => {
    setAvatarAction(actionType);
    
    const emojiMap = {
      wave: '👋',
      idea: '💡',
      thumbsup: '👍',
      celebrate: '🎉',
      think: '🤔',
    };

    const textMap = {
      wave: 'Hello!',
      idea: 'Aha!',
      thumbsup: 'Great!',
      celebrate: 'Hurrah!',
      think: 'Hmm...',
    };

    const newReaction = {
      id: Date.now(),
      emoji: emojiMap[actionType],
      text: textMap[actionType],
      left: 15 + Math.random() * 70, 
      delay: 0,
    };

    setFloatingReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 4000);

    // Keep state active momentarily then ease back to explaining/idle
    setTimeout(() => {
      setAvatarAction((prev) => (prev === actionType ? (isPlayingVideo ? 'explaining' : 'idle') : prev));
    }, 2000);
  };

  const setOtpResetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswerSubmit = (optionIdx: number) => {
    if (selectedQuizAnswer !== null) return;
    
    setSelectedQuizAnswer(optionIdx);
    const isCorrect = optionIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
    
    let feedbackText = "";
    if (isCorrect) {
      switch (lang) {
        case 'hi': feedbackText = "बिल्कुल सही! सही उत्तर।"; break;
        case 'gu': feedbackText = "અદ્ભુત! સાચો જવાબ છે."; break;
        case 'mr': feedbackText = "उत्कृष्ट! अचूक उत्तर."; break;
        case 'ta': feedbackText = "அற்புதம்! சரியான விடை."; break;
        case 'te': feedbackText = "అద్భుతం! సరైన సమాధానం."; break;
        default: feedbackText = "Perfect! Correct answer."; break;
      }
      setQuizScore((prev) => prev + 1);
      speakText(feedbackText, lang, selectedLesson.avatarName, selectedLesson.avatarChar);
    } else {
      switch (lang) {
        case 'hi': feedbackText = "चिंता न करें, अगली बार फिर प्रयास करें!"; break;
        case 'gu': feedbackText = "ચિંતા ન કરો, બીજી વખત પ્રયત્ન કરજો!"; break;
        case 'mr': feedbackText = "काळजी करू नका, पुढच्या वेळी नक्की जमेल!"; break;
        case 'ta': feedbackText = "கவலைப்படாதீர்கள், அடுத்த முறை மீண்டும் முயற்சிக்கவும்!"; break;
        case 'te': feedbackText = "ఆందోళన పడకండి, తదుపరి సారి ప్రయత్నించండి!"; break;
        default: feedbackText = "Don't worry, try again next time!"; break;
      }
      speakText(feedbackText, lang, selectedLesson.avatarName, selectedLesson.avatarChar);
    }
  };

  const handleNextQuizQuestion = () => {
    // Calculate final actual score taking into account the current question's answer before clearing it
    const isCurrentCorrect = selectedQuizAnswer === selectedLesson.quiz[currentQuizIndex].answerIndex;
    const finalScore = quizScore + (isCurrentCorrect ? 1 : 0);

    setSelectedQuizAnswer(null);
    if (currentQuizIndex + 1 < selectedLesson.quiz.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (finalScore >= selectedLesson.quiz.length) {
        // Fire continuous golden fireworks for a perfect score!
        fireContinuousFireworks(4000);
        
        if (!claimedMedals.includes(selectedLesson.id)) {
          setClaimedMedals((prev) => [...prev, selectedLesson.id]);
          
          offlineSyncManager.addLearningFeedEvent(user.mobile, {
            type: 'quiz',
            title: lang === 'hi' 
              ? `चैंपियन पदक अर्जित किया: ${selectedLesson.subject}` 
              : `Earned Academic Medal: ${selectedLesson.subject}`,
            subtitle: lang === 'hi'
              ? `आज • पूर्णतः उत्तीर्ण ${selectedLesson.query}`
              : `Today • Fully passed lesson quiz on ${selectedLesson.query}`,
            icon: '🏆',
            bgClass: 'bg-amber-50',
            textClass: 'text-amber-600',
            timestamp: 'Today'
          });

          if (!offlineSyncManager.isOnline()) {
            offlineSyncManager.queuePendingProgress('medal_earned', selectedLesson.id, user.mobile);
          }
        }
      } else if (finalScore >= selectedLesson.quiz.length * 0.6) {
        // Fire a standard confetti burst for passing with a good score!
        fireConfetti();
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      
      {/* 1. Custom AI query input bar (Full width) with PDF/image support */}
      <form 
        onSubmit={handleAskCustomQuery} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-white p-3.5 rounded-2xl border transition-all duration-200 relative flex flex-col gap-3 shadow-2xs ${
          isDragging 
            ? 'border-2 border-dashed border-[#E07A5F] bg-[#FAF8F4]' 
            : 'border-gray-150'
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-[#FAF8F4]/90 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
            <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center text-[#E07A5F] animate-bounce">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-gray-700">
              {lang === 'hi' ? 'पीडीएफ या चित्र यहाँ छोड़ें' : 'Drop your PDF or image here!'}
            </p>
            <p className="text-[10px] text-gray-400">
              {lang === 'hi' ? 'दादी और स्वामी इसे पाठ में उपयोग करेंगे' : 'Our Mascot AI will read & explain it!'}
            </p>
          </div>
        )}

        <div className="flex gap-2 w-full items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#81B29A]" />
            <input
              type="text"
              id="custom-classroom-query"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={lang === 'hi' ? "मुझसे कोई भी विज्ञान या गणित का प्रश्न पूछें... (जैसे, हवा ठंडी क्यों होती है?)" : "Ask me any science or math question... (e.g., Why is wind cold?)"}
              className="w-full pl-9 pr-24 py-3 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
            />
            
            <input
              type="file"
              id="classroom-file-upload"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => document.getElementById('classroom-file-upload')?.click()}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#E07A5F] transition-all flex items-center justify-center cursor-pointer"
                title={lang === 'hi' ? "पीडीएफ या चित्र संलग्न करें" : "Attach PDF or Image"}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <SpeechInputButton 
                lang={lang} 
                onTranscript={(text) => setCustomQuery(text)} 
              />
            </div>
          </div>
          
          <button
            type="submit"
            id="submit-classroom-query"
            className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-5 py-3 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-stretch"
          >
            <Sparkles className="h-4 w-4 text-[#F2CC8F]" />
            <span>{lang === 'hi' ? 'पाठ उत्पन्न करें' : 'Generate Lesson'}</span>
          </button>
        </div>

        {/* File Attachment Preview Panel */}
        {attachedFile && (
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              {attachedFile.mimeType.startsWith('image/') ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                  <img 
                    src={attachedFile.previewUrl} 
                    alt="attachment preview" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-150 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate text-[11px] sm:text-xs">
                  {attachedFile.file.name}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-mono font-bold tracking-wide">
                  {(attachedFile.file.size / 1024).toFixed(1)} KB • {attachedFile.mimeType.startsWith('image/') ? (lang === 'hi' ? 'चित्र' : 'Image') : 'PDF'}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (attachedFile.previewUrl) {
                  URL.revokeObjectURL(attachedFile.previewUrl);
                }
                setAttachedFile(null);
              }}
              className="p-1 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 hover:text-gray-900 transition-all cursor-pointer flex items-center justify-center"
              title={lang === 'hi' ? "हटाएं" : "Remove"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </form>

      {/* 3. Visual active AI character video box (Lecture section - Full width) */}
      <div className="w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
          
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-3 px-4 flex flex-col sm:flex-row justify-between sm:items-center text-white gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-gray-300 uppercase">
                Interactive Lecture Module
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {/* View History Button */}
              <button
                type="button"
                onClick={() => {
                  setShowHistory(!showHistory);
                }}
                className={`text-[10px] border px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  showHistory 
                    ? 'bg-[#FAF8F4] text-[#3D405B] border-[#F2CC8F]' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title={showHistory 
                  ? (lang === 'hi' ? 'सक्रिय लेक्चर पर वापस जाएं' : 'Back to Active Lecture') 
                  : (lang === 'hi' ? 'लेक्चर इतिहास' : 'Lecture History')}
              >
                <BookOpen className={`h-3.5 w-3.5 ${showHistory ? 'text-[#E07A5F]' : 'text-[#F2CC8F]'}`} />
                <span>
                  {showHistory 
                    ? (lang === 'hi' ? 'सक्रिय लेक्चर' : 'Active Lecture') 
                    : (lang === 'hi' ? 'मेरा इतिहास' : 'My History')}
                </span>
              </button>

              {!isNewLecture && !showHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLecture(true);
                    setCustomQuery('');
                    setAttachedFile(null);
                  }}
                  className="text-[10px] bg-[#E07A5F] hover:bg-[#D56B4E] text-white font-sans font-bold px-2.5 py-1.5 rounded flex items-center gap-1 transition-all cursor-pointer border-none"
                  title={lang === 'hi' ? "नया लेक्चर शुरू करें" : "Start New Lecture"}
                >
                  <span>{lang === 'hi' ? "नया लेक्चर ＋" : "New Lecture ＋"}</span>
                </button>
              )}
              <span className="text-[10px] bg-white/15 text-white/90 border border-white/20 font-mono px-2 py-0.5 rounded uppercase">
                {isNewLecture ? (lang === 'hi' ? "नया स्लॉट" : "NEW SLOT") : selectedLesson.avatarName}
              </span>
            </div>
          </div>

          <div className="relative bg-slate-950 p-1 sm:p-3 overflow-hidden flex flex-col gap-3">
            <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />

            {/* Floating Live Reactions Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingReactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className="absolute bottom-16 animate-float-up flex flex-col items-center bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-lg border border-white/25 select-none"
                  style={{
                    left: `${reaction.left}%`,
                    animationDelay: `${reaction.delay}s`,
                  }}
                >
                  <span className="text-xl leading-none">{reaction.emoji}</span>
                  {reaction.text && (
                    <span className="text-[9px] font-extrabold font-sans text-[#3D405B] mt-0.5 leading-none px-1 whitespace-nowrap">
                      {reaction.text}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isGeneratingVideo ? (
              <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-sm mx-auto py-10">
                <InteractiveAITeacher 
                  avatarChar={selectedLesson.avatarChar}
                  avatarName={selectedLesson.avatarName}
                  action={avatarAction}
                  isPlaying={false}
                />

                <div className="space-y-1.5 text-center w-full">
                  <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest px-1">
                    <span>🤖 Synergizing Pack...</span>
                    <span className="text-[#F2CC8F] font-black">{generationProgress}%</span>
                  </div>
                  
                  <div className="h-2 w-full bg-gray-950/80 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#F2CC8F] via-[#E07A5F] to-[#81B29A] rounded-full transition-all duration-150"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  
                  <p className="text-[10px] sm:text-xs font-sans font-extrabold text-[#F2CC8F] leading-tight px-2 min-h-8 flex items-center justify-center animate-pulse">
                    {generationStage}
                  </p>
                </div>
              </div>
            ) : showHistory ? (
              /* MY LECTURE HISTORY PANEL */
              <div className="relative w-full flex flex-col gap-5 py-6 px-4 sm:px-6 text-left text-white bg-slate-950/40 rounded-2xl min-h-[350px]">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-[#F2CC8F] flex items-center gap-2">
                      <History className="h-4.5 w-4.5 text-[#E07A5F]" />
                      <span>{lang === 'hi' ? 'मेरा लेक्चर इतिहास' : 'My Entire Lecture & Study History'}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {lang === 'hi' 
                        ? 'आपके द्वारा पहले पूछे गए सभी प्रश्न और उत्पन्न लेक्चर यहाँ सहेजे गए हैं।' 
                        : 'All your previously generated customized lectures and studied topics are saved below.'}
                    </p>
                  </div>
                  {customHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 self-end sm:self-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{lang === 'hi' ? 'इतिहास साफ़ करें' : 'Clear All History'}</span>
                    </button>
                  )}
                </div>

                {/* Search and Filters Controls */}
                {customHistory.length > 0 && (
                  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl shadow-3xs space-y-3.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'hi' ? 'लेक्चर विषय या प्रश्न में खोजें...' : 'Search lecture subject or question...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] bg-slate-950/50 text-slate-100"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter Controls */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {/* Starred filter button */}
                        <button
                          type="button"
                          onClick={() => setFilterType(filterType === 'starred' ? 'all' : 'starred')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            filterType === 'starred'
                              ? 'bg-amber-500 text-white shadow-3xs'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${filterType === 'starred' ? 'fill-current text-white' : 'text-amber-400'}`} />
                          <span>{lang === 'hi' ? 'तारांकित' : 'Starred'}</span>
                        </button>

                        {/* Subject dropdown filter */}
                        <div className="relative">
                          <select
                            value={selectedSubjectFilter}
                            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                            className="bg-slate-900 text-slate-300 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#E07A5F] cursor-pointer"
                          >
                            <option value="all" className="bg-slate-900 text-slate-200">{lang === 'hi' ? 'सभी विषय' : 'All Subjects'}</option>
                            {Array.from(new Set(customHistory.map(item => item.subject))).map(subj => (
                              <option key={subj} value={subj} className="bg-slate-900 text-slate-200">{subj}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {customHistory.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs font-sans bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center gap-2.5 my-4">
                    <span className="text-3xl">📚</span>
                    <p className="font-bold text-gray-300">{lang === 'hi' ? 'कोई लेक्चर इतिहास नहीं मिला।' : 'No lecture history found.'}</p>
                    <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                      {lang === 'hi' 
                        ? 'ऊपर दिए गए खोज बार में कोई प्रश्न पूछें और अपना पहला एआई लेक्चर उत्पन्न करें!' 
                        : 'Type any science or math question in the bar above and click Generate to start learning!'}
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filtered = customHistory.filter(item => {
                      const queryLower = searchQuery.toLowerCase();
                      const matchesSearch = item.query.toLowerCase().includes(queryLower) || item.subject.toLowerCase().includes(queryLower);

                      let matchesStarred = true;
                      if (filterType === 'starred') {
                        matchesStarred = !!item.starred;
                      }

                      let matchesSubject = true;
                      if (selectedSubjectFilter !== 'all') {
                        matchesSubject = item.subject === selectedSubjectFilter;
                      }

                      return matchesSearch && matchesStarred && matchesSubject;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-16 text-gray-400 text-xs font-sans bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center gap-2.5 my-4">
                          <span className="text-3xl">🔍</span>
                          <p className="font-bold text-gray-300">{lang === 'hi' ? 'कोई मेल खाता परिणाम नहीं मिला।' : 'No matching results found.'}</p>
                          <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                            {lang === 'hi' 
                              ? 'कृपया अपने खोज शब्द या फ़िल्टर बदलें।' 
                              : 'Try resetting your filters or search query.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                        {filtered.map((item) => {
                          const isActive = !isNewLecture && selectedLesson.id === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 hover:bg-slate-900/95 ${
                                isActive
                                  ? 'border-[#E07A5F] bg-[#E07A5F]/5 shadow-md shadow-[#E07A5F]/5'
                                  : 'border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 text-lg shadow-inner">
                                  📚
                                </div>
                                <div className="min-w-0 flex-1 font-sans">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-mono font-black text-[#81B29A] uppercase tracking-wider bg-[#81B29A]/10 px-2 py-0.5 rounded border border-[#81B29A]/20">
                                      {item.subject}
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] font-mono font-black text-[#E07A5F] uppercase tracking-wider bg-[#E07A5F]/15 px-2 py-0.5 rounded border border-[#E07A5F]/25 animate-pulse">
                                        ACTIVE VIEW
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-snug mt-1.5 break-words">
                                    "{item.query}"
                                  </h4>
                                  <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-1 font-mono">
                                    <Clock className="h-3 w-3 text-gray-500 shrink-0" />
                                    <span>Guided by {item.avatarName}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-3.5 md:pt-0 border-white/5 w-full md:w-auto justify-end">
                                {/* Star Toggle Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleStarLesson(item.id, e)}
                                  className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
                                    item.starred
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-300 hover:bg-white/10'
                                  }`}
                                  title={item.starred ? "Unstar lesson" : "Star lesson"}
                                >
                                  <Star className={`h-3.5 w-3.5 ${item.starred ? 'fill-current' : ''}`} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleLessonSelect(item);
                                    setShowHistory(false);
                                  }}
                                  className="px-3.5 py-2 bg-[#81B29A] hover:bg-[#6FA38B] text-[#1E293B] hover:text-white rounded-xl text-xs font-sans font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
                                  title="Restore and play this lecture"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>{lang === 'hi' ? 'लेक्चर चलाएं' : 'Restore & Play'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => downloadLessonVideoAndSlidesSpecific(item)}
                                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                  title="Download complete lesson package"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Download</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteLesson(item.id, e)}
                                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl hover:text-rose-200 transition-all cursor-pointer flex items-center justify-center border border-rose-500/20"
                                  title="Delete lecture"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
                
                <div className="flex justify-end pt-2 border-t border-white/5 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-xs bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                  >
                    {lang === 'hi' ? 'लेक्चर पर वापस जाएं' : 'Close History'}
                  </button>
                </div>
              </div>
            ) : isNewLecture ? (
              <div className="relative w-full flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-[#F2CC8F] bg-slate-900 flex items-center justify-center overflow-hidden shadow-xl animate-pulse">
                    <span className="text-3xl">🎓</span>
                  </div>
                </div>

                <h4 className="text-[#F2CC8F] font-display font-bold text-sm sm:text-base mb-1.5">
                  {lang === 'hi' ? 'नया एआई लेक्चर शुरू करें! 🎓' : 'Start a New AI Lecture! 🎓'}
                </h4>
                <p className="text-gray-300 text-[11px] sm:text-xs max-w-md mx-auto mb-5 leading-relaxed">
                  {lang === 'hi' 
                    ? 'ऊपर दिए गए बार में विज्ञान या गणित का कोई भी प्रश्न लिखें, या संदर्भ के लिए पीडीएफ/चित्र अपलोड करें। एआई तुरंत इंटरएक्टिव स्लाइड और क्विज़ के साथ एक कस्टमाइज्ड क्लास तैयार करेगा!' 
                    : 'Type any science or mathematics question in the bar above, or upload a reference PDF/image. The AI will generate a customized presentation with animated slides and an interactive quiz instantly!'}
                </p>

                <div className="flex flex-col gap-2 w-full max-w-xs sm:max-w-sm">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500 font-bold mb-1">
                    {lang === 'hi' ? 'कुछ मजेदार सुझाव:' : 'Or try one of these suggestions:'}
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    {[
                      lang === 'hi' ? "आसमान नीला क्यों दिखाई देता है? 🌌" : "Why is the sky blue? 🌌",
                      lang === 'hi' ? "बैटरी बिजली कैसे स्टोर करती है? ⚡" : "How do batteries store electricity? ⚡",
                      lang === 'hi' ? "सोलर सिस्टम (सौर मंडल) क्या है? 🪐" : "What is the solar system? 🪐"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const cleanQuery = suggestion.replace(/ [🌌⚡🪐]/g, '');
                          setCustomQuery(cleanQuery);
                          const inputEl = document.getElementById('custom-classroom-query');
                          if (inputEl) {
                            inputEl.focus();
                            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className="py-2 px-3 bg-white/5 hover:bg-[#FAF8F4]/10 rounded-xl text-left text-[11px] sm:text-xs font-medium text-gray-250 transition-all border border-white/10 flex justify-between items-center cursor-pointer hover:border-[#E07A5F]"
                      >
                        <span>{suggestion}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full flex flex-col gap-3">
                {/* Main slide display board */}
                {(() => {
                  const slides = getSlidesForLesson(selectedLesson, lang);
                  const activeSlide = slides[currentSlideIndex] || slides[0] || { id: 'fallback', title: selectedLesson.query, content: selectedLesson.explanation, bullets: [], visualLayout: 'conceptual-flow' };
                  return (
                    <div className="relative w-full">
                      <SlideVisualBoard 
                        slide={activeSlide} 
                        currentSlideIndex={currentSlideIndex} 
                        isPlaying={isPlayingVideo} 
                        lang={lang} 
                        avatarChar={selectedLesson.avatarChar}
                        avatarName={selectedLesson.avatarName}
                        avatarAction={avatarAction}
                      />

                      {showPlayGesturePrompt && (
                        <div 
                          onClick={() => {
                            setShowPlayGesturePrompt(false);
                            handlePlayVoiceResponse();
                          }}
                          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3.5 cursor-pointer z-50 animate-fadeIn rounded-2xl border-2 border-[#E07A5F]/40"
                        >
                          <div className="w-16 h-16 rounded-full bg-[#E07A5F] hover:bg-[#D56B4E] text-white flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all animate-bounce">
                            <Play className="h-8 w-8 fill-current ml-1" />
                          </div>
                          <div className="space-y-1 text-center px-4">
                            <p className="text-white font-sans font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2">
                              <span>🔊 {lang === 'hi' ? 'लेक्चर की आवाज़ शुरू करने के लिए यहाँ क्लिक करें!' : 'Click to Play Voice Lesson!'}</span>
                            </p>
                            <p className="text-gray-300 text-xs font-sans max-w-xs">
                              {lang === 'hi' 
                                ? `${selectedLesson.avatarName} आपको कहानी और सुंदर चित्रों के साथ समझाना शुरू करेंगे।` 
                                : `${selectedLesson.avatarName} will explain everything with sound and beautiful slides.`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Interactive Transcript Player (Line by Line) */}
                {(() => {
                  const slides = getSlidesForLesson(selectedLesson, lang);
                  return (
                    <div className="w-full flex flex-col gap-3">
                      
                      {/* Control Bar */}
                      <div className="bg-slate-950 border border-white/5 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
                        {/* Left: Play / Pause Controls & Autoplay */}
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={isPlayingVideo ? handleStopVoiceResponse : handlePlayVoiceResponse}
                            className={`px-4 py-2 rounded-full font-mono text-[10px] sm:text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                              isPlayingVideo 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-[#E07A5F] hover:bg-[#D06A4F] text-white'
                            }`}
                          >
                            {isPlayingVideo ? (
                              <>
                                <Pause className="h-3.5 w-3.5 fill-current text-white" />
                                <span>PAUSE LECTURE</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 fill-current text-white ml-0.5" />
                                <span>PLAY LECTURE</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowDownloadSelectionModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-mono text-[10px] sm:text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                            title={DOWNLOAD_TOOLTIPS[lang] || DOWNLOAD_TOOLTIPS['en']}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{DOWNLOAD_LABELS[lang] || DOWNLOAD_LABELS['en']}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-widest">
                              AUTOPLAY NEXT:
                            </span>
                            <button 
                              type="button"
                              onClick={() => setIsAutoplayEnabled(!isAutoplayEnabled)}
                              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isAutoplayEnabled ? 'bg-[#81B29A]' : 'bg-slate-700'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isAutoplayEnabled ? 'translate-x-3' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Right info label */}
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>TAP ANY LINE TO JUMP & PLAY</span>
                        </div>
                      </div>

                      {/* Line-by-Line Transcript List */}
                      <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/5 flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                        <span className="text-[8px] font-mono font-bold text-[#F2CC8F] block uppercase tracking-wider mb-1">
                          📋 Interactive Lecture Transcript (Line by Line)
                        </span>
                        
                        <div className="flex flex-col gap-2">
                          {slides.map((s, idx) => {
                            const isActive = currentSlideIndex === idx;
                            return (
                              <div
                                key={s.id || idx}
                                onClick={() => {
                                  stopSpeaking();
                                  setCurrentSlideIndex(idx);
                                  playSlideVoice(idx);
                                }}
                                className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs sm:text-sm flex gap-3 cursor-pointer items-start ${
                                  isActive 
                                    ? 'bg-[#E07A5F]/15 border-[#E07A5F]/40 text-[#F4F1DE] font-semibold' 
                                    : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                                }`}
                              >
                                {/* Left Indicator */}
                                <div className="mt-0.5 shrink-0">
                                  {isActive && isPlayingVideo ? (
                                    <div className="flex items-end gap-0.5 h-3.5 w-3.5 justify-center">
                                      <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-pulse" />
                                      <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                      <span className="w-0.5 h-3.5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-mono font-bold text-slate-500">
                                      {idx + 1}
                                    </div>
                                  )}
                                </div>

                                {/* Content text */}
                                <div className="flex-1 flex flex-col gap-1">
                                  <p className="leading-relaxed font-sans text-left">
                                    "{s.content}"
                                  </p>
                                  
                                  {/* Inline bullets/highlights if active */}
                                  {isActive && s.bullets && s.bullets.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5 pt-1.5 border-t border-[#E07A5F]/15">
                                      {s.bullets.map((bullet, bIdx) => (
                                        <span 
                                          key={bIdx} 
                                          className="text-[9px] bg-slate-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-white/5 font-sans"
                                        >
                                          ✦ {bullet}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Speak trigger trigger */}
                                <div className="shrink-0 self-center">
                                  <SpeakButton 
                                    text={s.content} 
                                    lang={lang} 
                                    size="sm" 
                                    className={`shrink-0 transition-all ${
                                      isActive 
                                        ? 'bg-[#E07A5F] text-white border-transparent' 
                                        : 'bg-slate-800 text-slate-400 border-white/5'
                                    }`} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}
          </div>

          {/* Live Reactions Panel */}
          {!isGeneratingVideo && !showHistory && !isNewLecture && (
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
              <span className="text-[10px] font-mono font-bold text-[#F2CC8F] uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                Audience Reaction Burst:
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['wave', 'idea', 'thumbsup', 'celebrate', 'think'].map((act) => {
                  const mapEmoji = { wave: '👋 Wave', idea: '💡 Idea', thumbsup: '👍 Praise', celebrate: '🎉 Victory', think: '🤔 Think' };
                  return (
                    <button
                      key={act}
                      onClick={() => triggerLiveAction(act as any)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/15 active:scale-95 text-white rounded-lg text-[10px] sm:text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all border border-white/5"
                    >
                      <span>{mapEmoji[act as keyof typeof mapEmoji]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player Media Bar */}
          {!isGeneratingVideo && !showHistory && !isNewLecture && (
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                {isPlayingVideo ? (
                  <button
                    id="stop-lesson-speech"
                    onClick={handleStopVoiceResponse}
                    className="px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans font-bold cursor-pointer"
                  >
                    ⏹️ Stop Speaking
                  </button>
                ) : (
                  <button
                    id="start-lesson-speech"
                    onClick={handlePlayVoiceResponse}
                    className="px-4 py-1.5 bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 hover:bg-[#81B29A]/25 rounded-xl text-xs font-sans font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Volume2 className="h-4 w-4 text-[#81B29A]" />
                    <span>Listen Aloud</span>
                  </button>
                )}
              </div>

              <button
                id="classroom-take-quiz-btn"
                onClick={() => {
                  setShowQuiz(true);
                  setOtpResetQuiz();
                }}
                className="w-full sm:w-auto px-5 py-2 bg-amber-500 hover:bg-amber-650 active:bg-amber-700 text-white font-sans font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-102"
              >
                <HelpCircle className="h-4 w-4" />
                <span>📝 Take Lesson Quiz</span>
              </button>
            </div>
          )}

        </div>

        {/* 3. Embedded Slide-Out Quiz Panel */}
        {showQuiz && (
          <div id="active-lesson-quiz-drawer" className="bg-amber-50 rounded-3xl p-5 border border-amber-250 text-left space-y-4 animate-fade-in">
            
            <div className="flex justify-between items-center border-b border-amber-205 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🏆</span>
                <div>
                  <h4 className="font-display font-extrabold text-sm text-amber-950">
                    Interactive Concept Quiz
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-amber-700 uppercase">
                    Earn medals for 100% scores
                  </span>
                </div>
              </div>
              <button
                id="close-quiz-panel"
                onClick={() => setShowQuiz(false)}
                className="p-1 px-2.5 rounded bg-white text-[10px] font-mono font-bold hover:bg-amber-100 text-amber-900 border border-amber-205 cursor-pointer"
              >
                Close X
              </button>
            </div>

            {!quizFinished ? (
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-bold text-amber-700">
                  Question {currentQuizIndex + 1} of {selectedLesson.quiz.length}
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-amber-150">
                  <h5 className="font-display font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                    {selectedLesson.quiz[currentQuizIndex].question}
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                  {selectedLesson.quiz[currentQuizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedQuizAnswer === oIdx;
                    const isCorrect = oIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
                    
                    let btnStyle = "bg-white border-gray-200 text-gray-800 hover:bg-amber-100/55";
                    if (selectedQuizAnswer !== null) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                      } else if (isSelected) {
                        btnStyle = "bg-rose-50 text-rose-800 border-rose-300 font-medium";
                      } else {
                        btnStyle = "bg-white/40 text-gray-405 border-gray-100 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={selectedQuizAnswer !== null}
                        onClick={() => handleAnswerSubmit(oIdx)}
                        className={`w-full p-2.5 text-left rounded-xl border text-xs sm:text-sm font-sans transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span className="font-bold mr-1.5 font-mono">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizAnswer !== null && (
                  <div className="p-3.5 bg-white border border-amber-100 rounded-xl space-y-2 animate-fade-in text-xs sm:text-sm">
                    <div className="font-black text-amber-900 flex items-center gap-1.5 text-xs">
                      {selectedQuizAnswer === selectedLesson.quiz[currentQuizIndex].answerIndex ? (
                        <span className="text-[#81B29A]">🎉 Brilliant! Correct!</span>
                      ) : (
                        <span className="text-rose-600">🌱 Learning spot explanation:</span>
                      )}
                    </div>
                    <p className="text-gray-650 leading-normal text-xs sm:text-sm">
                      {selectedLesson.quiz[currentQuizIndex].explanation}
                    </p>
                    
                    <button
                      type="button"
                      id="quiz-next-question-btn"
                      onClick={handleNextQuizQuestion}
                      className="mt-2 text-[10px] font-bold font-sans px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                    >
                      Next Question {currentQuizIndex + 1 < selectedLesson.quiz.length ? "➡️" : "🏁"}
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center p-5 space-y-4">
                <div className="text-4xl">🏆</div>
                <div>
                  <h4 className="font-display font-bold text-[#3D405B] text-base">
                    Concept Completed!
                  </h4>
                  <p className="font-sans text-xs sm:text-sm text-gray-600 mt-1">
                    You scored <span className="font-black text-emerald-600">{quizScore}</span> correct answers!
                  </p>
                </div>

                {quizScore === selectedLesson.quiz.length ? (
                  <div className="bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 p-3 rounded-xl text-xs sm:text-sm font-sans font-bold flex items-center justify-center gap-2">
                    <Smile className="h-4.5 w-4.5 text-[#81B29A]" />
                    <span>Incredible! You earned the active lesson golden medal!</span>
                  </div>
                ) : (
                  <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl text-xs sm:text-sm font-sans font-semibold">
                    Keep practicing to score 100% and earn medals!
                  </div>
                )}

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={setOtpResetQuiz}
                    className="px-4 py-1.5 bg-white hover:bg-gray-50 text-[#3D405B] border border-gray-200 text-xs font-sans font-bold rounded-lg cursor-pointer"
                  >
                    Retry Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(false)}
                    className="px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-sans font-bold rounded-lg cursor-pointer"
                  >
                    Finish Lesson
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      {/* 📥 DOWNLOAD OPTIONS SELECTION MODAL */}
      {showDownloadSelectionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowDownloadSelectionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3 text-xl">
                📥
              </div>
              <h3 className="text-xl font-black font-display tracking-tight text-slate-100">
                {lang === 'hi' ? 'पाठ सहेजें और डाउनलोड करें' : 'Save & Download Lesson'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {lang === 'hi' 
                  ? 'अपनी पसंद के अनुसार ऑफ़लाइन पढ़ने का प्रारूप चुनें' 
                  : 'Choose your preferred format for offline learning'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Direct Video File */}
              <button
                type="button"
                onClick={() => startVideoExport(selectedLesson)}
                className="w-full text-left bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-indigo-500/30 p-4 rounded-2xl transition-all flex items-start gap-4 active:scale-98 cursor-pointer animate-none"
              >
                <div className="bg-[#E07A5F]/10 text-[#E07A5F] border border-[#E07A5F]/20 p-2.5 rounded-xl text-lg shrink-0 mt-0.5">
                  🎥
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    {lang === 'hi' ? 'एचडी वीडियो लेक्चर (.mp4 / .webm)' : 'HD Video Lecture (.mp4 / .webm)'}
                    <span className="bg-[#E07A5F]/10 text-[#E07A5F] border border-[#E07A5F]/20 text-[9px] font-mono px-2 py-0.5 rounded-full font-black">
                      RECOMMENDED
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                    {lang === 'hi' 
                      ? 'अपने फ़ोन, टैबलेट या टीवी पर सीधे चलाने के लिए संगीत के साथ पूरा वीडियो डाउनलोड करें।' 
                      : 'Download a standalone movie file with slide-by-slide transitions and ambient study background music.'}
                  </p>
                </div>
              </button>

              {/* Option 2: Interactive Slides & Quiz HTML Package */}
              <button
                type="button"
                onClick={() => {
                  downloadLessonVideoAndSlidesSpecific(selectedLesson);
                  setShowDownloadSelectionModal(false);
                }}
                className="w-full text-left bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-500/30 p-4 rounded-2xl transition-all flex items-start gap-4 active:scale-98 cursor-pointer animate-none"
              >
                <div className="bg-[#81B29A]/10 text-[#81B29A] border border-[#81B29A]/20 p-2.5 rounded-xl text-lg shrink-0 mt-0.5">
                  📚
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-100">
                    {lang === 'hi' ? 'इंटरएक्टिव स्लाइड और स्व-मूल्यांकन पैक (.html)' : 'Interactive Slide & Quiz Pack (.html)'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                    {lang === 'hi' 
                      ? 'स्लाइड प्लेयर, वॉयस-ओवर और स्व-जांच क्विज़ के साथ संपूर्ण इंटरएक्टिव ऑफ़लाइन पैकेज डाउनलोड करें।' 
                      : 'Download the complete slide presentation, interactive self-test quiz game, and voice-over narration as an offline app.'}
                  </p>
                </div>
              </button>
            </div>

            <div className="text-center mt-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t border-slate-800/60 pt-4">
              Mascot Class Tutor • Offline Classroom
            </div>
          </div>
        </div>
      )}

      {/* 🎥 ACTIVE HD VIDEO RECORDING / RENDERING MODAL */}
      {isRecordingVideoFile && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white shadow-2xl relative text-center">
            
            <div className="mb-4">
              <span className="inline-flex h-3 w-3 rounded-full bg-red-500 animate-ping mr-2"></span>
              <span className="text-[11px] font-mono text-red-400 uppercase font-extrabold tracking-widest">
                {lang === 'hi' ? 'लाइव रेंडरिंग और रिकॉर्डिंग' : 'LIVE RENDERING & RECORDING'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-slate-100">
              {lang === 'hi' ? 'वीडियो व्याख्यान रेंडर किया जा रहा है...' : 'Generating Video Lecture...'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed font-sans">
              {lang === 'hi' 
                ? 'हम आपके लिए सभी स्लाइड्स और पृष्ठभूमि संगीत को उच्च-गुणवत्ता वाली वीडियो फ़ाइल में संयोजित कर रहे हैं। कृपया इस टैब को चालू रखें!' 
                : 'We are blending your customized tutor, animated slides, subtitles, and cozy ambient lofi music into a playable movie. Please do not close this tab!'}
            </p>

            {/* LIVE PREVIEW CANVAS */}
            <div className="my-5 relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 aspect-video w-full max-w-md mx-auto">
              <canvas
                ref={exportCanvasRef}
                width={1280}
                height={720}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                REC 720P
              </div>
            </div>

            {/* STATUS & PROGRESS */}
            <div className="space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span className="truncate max-w-[80%] text-left font-sans italic">{videoRecordStatus}</span>
                <span className="font-bold text-indigo-400 shrink-0">{videoRecordProgress}%</span>
              </div>

              {/* Progress track */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#E07A5F] rounded-full transition-all duration-300"
                  style={{ width: `${videoRecordProgress}%` }}
                />
              </div>
            </div>

            {/* CANCEL EXPORT */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={cancelVideoExport}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              >
                {lang === 'hi' ? 'रेंडरिंग रद्द करें' : 'Cancel Rendering'}
              </button>
            </div>

            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-6 pt-4 border-t border-slate-800/60">
              Direct Hardware Accel Canvas Encoder
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
