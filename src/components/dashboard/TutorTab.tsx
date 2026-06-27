import React, { useState, useEffect, FormEvent } from 'react';
import { LanguageCode, User, QuizQuestion, OfflineResource } from '../../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../../data/translations';
import { offlineSyncManager } from '../../utils/offlineSync';
import SpeakButton from '../SpeakButton';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import SlideVisualBoard from './SlideVisualBoard';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Play, BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Volume2, Search, Sparkles, Smile, Video, ArrowLeft, RefreshCw,
  ChevronLeft, Pause, Eye, MonitorPlay, Paperclip, FileText, X, FileUp
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
}

export default function TutorTab({
  user,
  lang,
  claimedMedals,
  setClaimedMedals
}: TutorTabProps) {
  const currentLanguageLessons = SAMPLE_LESSONS[lang] || SAMPLE_LESSONS['en'];
  const [selectedLesson, setSelectedLesson] = useState<LessonQuery>(currentLanguageLessons[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

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

  const [activeDeckTab, setActiveDeckTab] = useState<'curriculum' | 'history'>('curriculum');
  const [customHistory, setCustomHistory] = useState<LessonQuery[]>(() => {
    try {
      const saved = localStorage.getItem('mascot_lessons_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse mascot lessons history:", e);
      return [];
    }
  });
  const [isNewLecture, setIsNewLecture] = useState(false);
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
    setShowPlayGesturePrompt(false);
    simulateVideoGeneration(lesson, false);
  };

  const handleAskCustomQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    const queryText = customQuery.trim();
    setIsGeneratingVideo(true);
    setGenerationProgress(10);
    
    const mascotName = selectedLesson.avatarName || "Swami AI";
    const targetLangName = LANGUAGE_NAMES[lang] || "English";
    
    setGenerationStage(
      lang === 'hi' ? `🧠 एआई शिक्षक आपके विषय "${queryText}" पर शोध कर रहे हैं...` :
      lang === 'gu' ? `🧠 એઆઈ શિક્ષક તમારા વિષય "${queryText}" પર સંશોધન કરી રહ્યા છે...` :
      lang === 'mr' ? `🧠 एआय शिक्षक तुमच्या विषयावर "${queryText}" संशोधन करत आहेत...` :
      lang === 'ta' ? `🧠 AI ஆசிரியர் உங்கள் தலைப்பு "${queryText}" பற்றி ஆராய்கிறார்...` :
      lang === 'te' ? `🧠 AI ఉపాధ్యాయుడు మీ అంశం "${queryText}" పై పరిశోధన చేస్తున్నాడు...` :
      `🧠 AI Tutor is researching your topic "${queryText}"...`
    );

    try {
      const systemInstruction = `You are ${mascotName}, a brilliant, creative, and enthusiastic school tutor. You explain difficult concepts to children in highly visual, exciting, and step-by-step ways.
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
        systemInstruction
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
          localStorage.setItem('mascot_lessons_history', JSON.stringify(updated));
          return updated;
        });
        setActiveDeckTab('history');
        setIsNewLecture(false);

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
    setSelectedQuizAnswer(null);
    if (currentQuizIndex + 1 < selectedLesson.quiz.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (quizScore + 1 >= selectedLesson.quiz.length) {
        if (!claimedMedals.includes(selectedLesson.id)) {
          setClaimedMedals((prev) => [...prev, selectedLesson.id]);
          if (!offlineSyncManager.isOnline()) {
            offlineSyncManager.queuePendingProgress('medal_earned', selectedLesson.id);
          }
        }
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

      {/* 2. Classroom Lessons Quick Deck (Below input, Full width) */}
      <div className="w-full bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-2.5 gap-3">
          <div className="flex items-center gap-1.5">
            <Video className="h-4 w-4 text-[#81B29A]" />
            <h3 className="font-display font-bold text-xs text-[#3D405B] uppercase tracking-widest text-left">
              {lang === 'hi' ? "स्कॉलैस्टिक लेसन डेक" : "Scholastic Lesson Deck"}
            </h3>
          </div>
          
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveDeckTab('curriculum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
                activeDeckTab === 'curriculum'
                  ? 'bg-white text-[#3D405B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {lang === 'hi' ? "पाठ्यचर्या पाठ" : "Curriculum Lessons"}
            </button>
            <button
              type="button"
              onClick={() => setActiveDeckTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDeckTab === 'history'
                  ? 'bg-white text-[#3D405B] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{lang === 'hi' ? "मेरा इतिहास" : "My Lecture History"}</span>
              {customHistory.length > 0 && (
                <span className="bg-[#E07A5F]/10 text-[#E07A5F] text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full">
                  {customHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeDeckTab === 'curriculum' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentLanguageLessons.map((item) => (
              <button
                key={item.id}
                id={`lesson-selector-${item.id}`}
                onClick={() => handleLessonSelect(item)}
                className={`w-full p-3 rounded-xl border text-left transition-all hover:bg-[#FAF8F4] cursor-pointer flex items-center gap-3 ${
                  !isNewLecture && selectedLesson.id === item.id
                    ? 'border-[#81B29A] bg-[#81B29A]/10 ring-1 ring-[#81B29A]'
                    : 'border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.videoThumbColor} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                  {item.avatarChar.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0 font-sans">
                  <span className="text-[9px] font-mono font-bold text-[#E07A5F] block uppercase tracking-wide">
                    {item.subject}
                  </span>
                  <span className="font-semibold text-xs text-gray-900 block truncate mt-0.5">
                    {item.query}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {customHistory.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(lang === 'hi' ? "क्या आप पूरा इतिहास हटाना चाहते हैं?" : "Are you sure you want to clear your lecture history?")) {
                      setCustomHistory([]);
                      localStorage.removeItem('mascot_lessons_history');
                    }
                  }}
                  className="text-[10px] font-mono text-gray-400 hover:text-red-500 underline flex items-center gap-1 cursor-pointer transition-all"
                >
                  {lang === 'hi' ? "इतिहास साफ़ करें" : "Clear History"}
                </button>
              </div>
            )}

            {customHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customHistory.map((item) => (
                  <button
                    key={item.id}
                    id={`lesson-selector-${item.id}`}
                    onClick={() => handleLessonSelect(item)}
                    className={`w-full p-3 rounded-xl border text-left transition-all hover:bg-[#FAF8F4] cursor-pointer flex items-center gap-3 ${
                      !isNewLecture && selectedLesson.id === item.id
                        ? 'border-[#E07A5F] bg-[#E07A5F]/5 ring-1 ring-[#E07A5F]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-400 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                      ✨
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                      <span className="text-[9px] font-mono font-bold text-[#81B29A] block uppercase tracking-wide">
                        {item.subject}
                      </span>
                      <span className="font-semibold text-xs text-gray-900 block truncate mt-0.5">
                        {item.query}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 font-sans mb-1">
                  {lang === 'hi' ? "कोई उत्पन्न व्याख्यान नहीं मिला!" : "No custom generated lectures found!"}
                </p>
                <p className="text-[10px] text-gray-400 font-sans">
                  {lang === 'hi' ? "ऊपर दिए गए बार में कोई प्रश्न पूछें और अपना पहला अनुकूलित व्याख्यान उत्पन्न करें।" : "Type a question in the ask bar above and click Generate to build your first live lecture."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Visual active AI character video box (Lecture section - Full width) */}
      <div className="w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
          
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-3 px-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-gray-350 uppercase">
                Interactive Lecture Module
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isNewLecture && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLecture(true);
                    setCustomQuery('');
                    setAttachedFile(null);
                  }}
                  className="text-[10px] bg-[#E07A5F] hover:bg-[#D56B4E] text-white font-sans font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer border-none"
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

          {/* Player Media Bar */}
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

    </div>
  );
}
