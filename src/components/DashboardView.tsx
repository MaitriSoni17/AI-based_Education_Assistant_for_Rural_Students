import { useState, useEffect, FormEvent } from 'react';
import { LanguageCode, User, QuizQuestion, OfflineResource } from '../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import SpeakButton from './SpeakButton';
import SpeechInputButton from './SpeechInputButton';
import InteractiveAITeacher from './InteractiveAITeacher';
import { speakText, stopSpeaking } from '../utils/speech';
import { 
  Play, BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Volume2, Search, Sparkles, Smile, Video, ArrowLeft, RefreshCw 
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  lang: LanguageCode;
}

interface LessonQuery {
  id: string;
  query: string;
  subject: string;
  explanation: string;
  videoThumbColor: string;
  avatarChar: string;
  avatarName: string;
  quiz: QuizQuestion[];
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
      explanation: "જ્યારે સૂર્યની ગરમીથી નદીઓ અને તળાવનું પાણી ગરમ થાય છે, ત્યારે તેનું વરાળમાં રૂપાંતર થાય છે. આ વરાળ આકાશમાં ઊંચે જઈને ભેગી થાય છે અને વાદળાં બને છે! જ્યારે આ વાદળ ઠંડા અને પાણીના ટીપાંથી ભારે થઈ જાય છે, ત્યારે તે પૃથ્વી પર વરસાદ તરીકે પડે છે!",
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
      explanation: "जेव्हा सूर्य नद्या आणि तलावांचे पाणी गरम करतो, तेव्हा त्याचे रूपांतर वाफेमध्ये होते. ही वाफ आकाशात वर जाऊन एकत्र होते आणि ढग तयार होतात! जेव्हा हे ढग खूप थंड आणि पाण्याच्या थेंबांनी जड होतात, तेव्हा ते जमिनीवर पाऊस म्हणून पडतात! यालाच जलचक्र म्हणतात.",
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
          explanation: "वनस्पती हवेतील कार्बन डायऑक्साइड घेऊन शुद्ध ऑक्सिजन बाहेर सोडतात!"
        }
      ]
    }
  ],
  ta: [
    {
      id: 'rain',
      query: "மேகங்கள் எவ்வாறு மழையைத் தருகின்றன?",
      subject: "அறிவியல் 🔬",
      avatarChar: "👵 பாட்டி AI",
      avatarName: "பாட்டி AI (கிராமத்து பெரியவர்)",
      explanation: "சூரியனின் வெப்பத்தால் ஏரிகள் மற்றும் ஆறுகளிலுள்ள நீர் சூடாகி நீராவியாக மேலே செல்கிறது. இந்த நீராவி வான்வெளியில் குளிர்ந்து மேகங்களாக மாறுகிறது! மேகங்கள் மிகவும் கனமாகவும் குளிர்ச்சியாகவும் மாறும்போது, அவை மழையாக பூमीக்கு வருகின்றன! இதுவே நீர் சுழற்சி ஆகும்.",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "நீரை நீராவியாக மாற்றும் ஆற்றல் கொண்டது எது?",
          options: ["நிலா", "சூரியன்", "பெரிய விசிறிகள்", "காற்று"],
          answerIndex: 1,
          explanation: "சூரியனே நீரைச் சூடாக்கி நீராவியாக மாற்றுகிறது!"
        },
        {
          id: 'q2',
          question: "நீராவி குளிர்ந்து வான்வெளியில் என்னவாக மாறும்?",
          options: ["மண்", "மேகம்", "மலை", "நெருப்பு"],
          answerIndex: 1,
          explanation: "மேலே செல்லும் நீராவி குளிர்ந்த காற்றில் மேகங்களாக மாறுகிறது."
        }
      ]
    },
    {
      id: 'photo',
      query: "ஒளிச்சேர்க்கை என்றால் என்ன?",
      subject: "அறிவியல் 🔬",
      avatarChar: "🤖 சுவாமி AI",
      avatarName: "சுவாமி AI (ஸ்மார்ட் நண்பன்)",
      explanation: "ஒளிச்சேர்க்கை என்பது தாவரங்கள் உணவு தயாரிக்கும் முறை! பச்சை இலைகள் சூரிய ஒளி, மண்ணிலிருந்து நீர், மற்றும் காற்றிலிருந்து கார்பன் டை ஆக்சைடை உறிஞ்சி, பச்சையத்தின் உதவியுடன் தங்களுக்குத் தேவையான குளுக்கோஸ் உணவைத் தயாரித்து, நாம் சுவாசிக்க புதிய ஆக்சிஜனை வெளியிடுகின்றன!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "ஒளிச்சேர்க்கையின் போது தாவரங்கள் வெளியிடும் வாயு எது?",
          options: ["கார்பன் டை ஆக்சைடு", "ஆக்சிஜன்", "நைட்ரஜன்", "புகை"],
          answerIndex: 1,
          explanation: "செடிகள் நமக்குத் தேவையான தூய்மையான ஆக்சிஜன் வாயுவை வெளியிடுகின்றன!"
        }
      ]
    }
  ],
  te: [
    {
      id: 'rain',
      query: "మేఘాలు వర్షాన్ని ఎలా కురిపిస్తాయి?",
      subject: "సైన్స్ 🔬",
      avatarChar: "👵 నానమ్మ AI",
      avatarName: "నానమ్మ AI (గ్రామ వృద్ధురాలు)",
      explanation: "సూర్యుడి వేడి వల్ల చెరువులు మరియు నదులలో ఉన్న నీరు ఆవిరిగా మారి పైకి వెళ్తుంది. ఈ ఆవిరి ఆకాశంలో చల్లబడి మేఘాలుగా మారుతుంది! ఆ మేఘాలు మరీ చల్లబడి బరువెక్కినప్పుడు, నీటి బిందువులు మన భూమిపై వర్షంగా కురుస్తాయి! దీనినే నీటి చక్రం అంటారు.",
      videoThumbColor: "from-blue-400 to-sky-600",
      quiz: [
        {
          id: 'q1',
          question: "చెరువులలో నీటిని వేడి చేసి ఆవిరిగా మార్చేది ఎవరు?",
          options: ["చంద్రుడు", "సూర్యుడు", "భారీ ఫ్యాన్లు", "అడవి మంటలు"],
          answerIndex: 1,
          explanation: "సూర్యుడి వేడి వల్లే నీరు ఆవిరిగా మారుతుంది."
        },
        {
          id: 'q2',
          question: "ఆవిరి చల్లబడినప్పుడు ఆకాశంలో ఏమి ఏర్పాడతాయి?",
          options: ["మట్టి", "మేఘాలు", "కొండలు", "బొగ్గు"],
          answerIndex: 1,
          explanation: "పైకి వెళ్ళిన ఆవిరి ఘనీభవించి మేఘాలను ఏర్పరుస్తుంది."
        }
      ]
    },
    {
      id: 'photo',
      query: "キరణజన్య సంయోగ క్రియ అంటే ఏమిటి?",
      subject: "సైన్స్ 🔬",
      avatarChar: "🤖 స్వామి AI",
      avatarName: "స్వామి AI (తెలివైన స్నేహితుడు)",
      explanation: "キరణజన్య సంయోగ క్రియ అంటే మొక్కలు ఆహారాన్ని తయారు చేసుకునే విధానం! ఆకుపచ్చని ఆకులు సూర్యరశ్మి, నేల నుండి నీరు, మరియు గాలి నుండి కార్బన్ డై ఆక్సైడ్ గ్రహించి, పత్రహరితం సహాయంతో ఆహారాన్ని తయారు చేసి, మన శ్వాస కోసం స్వచ్ఛమైన ఆక్సిజన్ విడుదల చేస్తాయి!",
      videoThumbColor: "from-emerald-400 to-teal-600",
      quiz: [
        {
          id: 'q1',
          question: "ఆహారం తయారుచేసే సమయంలో మొక్కలు విడుదల చేసే వాయువు ఏది?",
          options: ["కార్బన్ డై ఆక్సైడ్", "ఆక్సిజన్", "నైట్రోజన్", "పొగ"],
          answerIndex: 1,
          explanation: "మొక్కలు మన శ్వాస కోసం స్వచ్ఛమైన ఆక్సిజన్ గాలిని విడుదల చేస్తాయి!"
        }
      ]
    }
  ]
};

const INITIAL_OFFLINE_RESOURCES: OfflineResource[] = [
  { id: 'pdf-science', title: 'Basic Science Level 1 (with Pictures)', subject: 'Science', size: '2.4 MB', category: 'pdf', downloaded: true },
  { id: 'aud-alphabet', title: 'English Alphabets and Phonics', subject: 'Languages', size: '4.1 MB', category: 'audio', downloaded: false },
  { id: 'vid-numbers', title: 'Counting 1 to 100 Mascot Song', subject: 'Mathematics', size: '9.8 MB', category: 'video', downloaded: false },
  { id: 'quiz-animals', title: 'Farming & Animal Life Interactive game', subject: 'General Knowledge', size: '1.2 MB', category: 'quiz', downloaded: true }
];

export default function DashboardView({ user, lang }: DashboardViewProps) {
  const t = TRANSLATIONS[lang];

  // Retrieve lessons based on language (fallback to English if empty)
  const currentLanguageLessons = SAMPLE_LESSONS[lang]?.length > 0 
    ? SAMPLE_LESSONS[lang] 
    : SAMPLE_LESSONS['en'];

  // Active Lesson States
  const [selectedLesson, setSelectedLesson] = useState<LessonQuery>(currentLanguageLessons[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // Synchronize active selected lesson when studying language changes
  useEffect(() => {
    const matched = currentLanguageLessons.find(l => l.id === selectedLesson.id);
    if (matched) {
      setSelectedLesson(matched);
    } else {
      setSelectedLesson(currentLanguageLessons[0]);
    }
    // Since language shifted, stop current video narration
    setIsPlayingVideo(false);
    stopSpeaking();
  }, [lang]);

  // AI Video live generation and simulation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  
  // Mascot Expression & Live Actions States
  const [avatarAction, setAvatarAction] = useState<'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think'>('idle');
  interface FloatingReaction {
    id: number;
    emoji: string;
    text: string;
    left: number;
    delay: number;
  }
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Helper functions for Mascot appearance
  const getAvatarAnimationClass = (action: string) => {
    switch (action) {
      case 'wave':
        return 'animate-bounce [animation-duration:0.4s] rotate-6 scale-105';
      case 'idea':
        return 'scale-110 ring-4 ring-amber-400 duration-300';
      case 'thumbsup':
        return 'animate-pulse scale-105 ring-4 ring-emerald-400 [animation-duration:0.5s]';
      case 'celebrate':
        return 'animate-bounce [animation-duration:0.35s] ring-4 ring-[#E07A5F] scale-110';
      case 'think':
        return 'scale-95 duration-500 opacity-90 -rotate-6';
      case 'explaining':
        return 'animate-bounce duration-1000';
      default:
        return 'hover:scale-105 duration-300';
    }
  };

  const getActionOverlayEmoji = (action: string) => {
    switch (action) {
      case 'wave': return '👋';
      case 'idea': return '💡';
      case 'thumbsup': return '👍';
      case 'celebrate': return '🎉';
      case 'think': return '🤔';
      case 'explaining': return '💬';
      default: return '';
    }
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
    
    const reactionTexts: Record<LanguageCode, Record<string, string>> = {
      en: { wave: "Hello!", idea: "Aha! Idea!", thumbsup: "Awesome!", celebrate: "Yay!", think: "Thinking..." },
      hi: { wave: "नमस्ते!", idea: "गजब विचार!", thumbsup: "शाबाश!", celebrate: "बधाई हो!", think: "सोच रहे हैं..." },
      gu: { wave: "નમસ્તે!", idea: "વાહ ભાઈ વાહ!", thumbsup: "ખૂબ સરસ!", celebrate: "આનંદ કરો!", think: "વિચારે છે..." },
      mr: { wave: "नमस्कार!", idea: "सुंदर कल्पना!", thumbsup: "शाब्बास!", celebrate: "धमाल!", think: "विचार चालू..." },
      ta: { wave: "வணக்கம்!", idea: "அற்புதம் யோசனை!", thumbsup: "மிக நன்று!", celebrate: "கொண்டாடுவோம்!", think: "யோசனை..." },
      te: { wave: "నమస్కారం!", idea: "అద్భుత ఆలోచన!", thumbsup: "శభాష్!", celebrate: "విజయం!", think: "ఆలోచన..." },
    };

    const text = reactionTexts[lang]?.[actionType] || reactionTexts['en'][actionType] || "";
    const emoji = emojiMap[actionType];

    // Add multiple floating reactions to create a satisfying live stream burst effect
    const newReactions = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + Math.random() + i,
      emoji,
      text: i === 0 ? text : '', // Only primary has text label to prevent clustering
      left: 20 + Math.random() * 60, // Keep in bounds of center screen
      delay: i * 0.2,
    }));

    setFloatingReactions(prev => [...prev, ...newReactions]);

    // Cleanup after animation completes (3s)
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => !newReactions.some(nr => nr.id === r.id)));
    }, 3500);

    // Revert mascot gesture back to default explaining
    setTimeout(() => {
      setAvatarAction(prev => prev === actionType ? (isPlayingVideo ? 'explaining' : 'idle') : prev);
    }, 2800);
  };

  // Automated spontaneous mascot reactions while speaking
  useEffect(() => {
    let actionInterval: NodeJS.Timeout;
    if (isPlayingVideo) {
      setAvatarAction('explaining');
      // Trigger a random joyful motion every 9 seconds to keep kids glued
      actionInterval = setInterval(() => {
        const gestureList: ('wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think')[] = ['wave', 'idea', 'thumbsup', 'celebrate', 'think'];
        const randomGesture = gestureList[Math.floor(Math.random() * gestureList.length)];
        triggerLiveAction(randomGesture);
      }, 9500);
    } else {
      setAvatarAction('idle');
    }
    return () => clearInterval(actionInterval);
  }, [isPlayingVideo]);

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [claimedMedals, setClaimedMedals] = useState<string[]>([]);

  // Local Offline Resources State
  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>(INITIAL_OFFLINE_RESOURCES);
  const [subtitleWordIndex, setSubtitleWordIndex] = useState(0);

  // Subtitle animator simulation during lesson speech
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setSubtitleWordIndex((prev) => (prev + 1) % selectedLesson.explanation.split(' ').length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo, selectedLesson]);

  const simulateVideoGeneration = (lesson: LessonQuery, autoPlay = true) => {
    setIsGeneratingVideo(true);
    setGenerationProgress(0);
    setIsPlayingVideo(false);
    stopSpeaking();
    
    // Choose appropriate initial live action: think
    setAvatarAction('think');
    
    const getLocalizationStage = (pct: number, name: string) => {
      if (pct < 30) {
        switch (lang) {
          case 'hi': return `✍️ ${name} पाठ स्क्रिप्ट तैयार कर रहे हैं...`;
          case 'gu': return `✍️ ${name} પાઠ સ્ક્રિપ્ટ તૈયાર કરી રહ્યા છે...`;
          case 'mr': return `✍️ ${name} पाठ्य आराखडा तयार करत आहेत...`;
          case 'ta': return `✍️ ${name} பாடத் திட்டத்தை எழுதிக்கொண்டிருக்கிறார்...`;
          case 'te': return `✍️ ${name} పాఠ్య ప్రణాళికను రూపొందిస్తున్నారు...`;
          default: return `✍️ ${name} drafting lesson script...`;
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

    const totalSteps = 20; // 20 * 100ms = 2 seconds loading duration (Perfect fluid pace)
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setGenerationProgress(currentProgress);

      // Trigger spontaneous AI Teacher live actions during compiling
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
        if (autoPlay) {
          setIsPlayingVideo(true);
          speakText(lesson.explanation, lang, lesson.avatarName, lesson.avatarChar, () => {
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
    setShowQuiz(false);
    setOtpResetQuiz();
    // Simulate interactive generation so kids see live compile/sync on switch
    simulateVideoGeneration(lesson, false);
  };

  const handleAskCustomQuery = (e: FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    // Mimic generating a custom interactive video response from the AI characters
    const querySlug = customQuery.toLowerCase();
    let matchesLesson = currentLanguageLessons.find(l => 
      querySlug.includes(l.id) || querySlug.includes(l.query.toLowerCase())
    );

    if (!matchesLesson) {
      let explanation = "";
      let quizQuestion = "";
      let quizOptions: string[] = [];
      let quizExplanation = "";
      let avatarName = "";
      let avatarChar = "";

      switch (lang) {
        case 'hi':
          avatarChar = "🤖 स्वामी AI";
          avatarName = "स्वामी AI (स्मार्ट साथी)";
          explanation = `अद्भुत जिज्ञासा! आपने "${customQuery}" के बारे में पूछा। आपके शिक्षक स्वामी एआई समझाते हैं: प्रकृति में सब कुछ एक दूसरे से जुड़ा हुआ है। हम अपने मस्तिष्क में सुपर लॉजिक बनाने के लिए इन विषयों का चरण-दर-चरण अध्ययन करते हैं! सीखने के लिए नीचे खेल खेलें।`;
          quizQuestion = `आज आपको "${customQuery}" के बारे में कौन सा एआई शिक्षक पढ़ा रहा है?`;
          quizOptions = ["दादी एआई", "स्वामी एआई", "कोई नहीं", "एक डरावना कंप्यूटर"];
          quizExplanation = "स्वामी एआई आपका बुद्धिमान एआई साथी है!";
          break;
        case 'gu':
          avatarChar = "🤖 સ્વામી AI";
          avatarName = "સ્વામી AI (સ્માર્ટ દોસ્ત)";
          explanation = `અદ્ભુત જિજ્ઞાસા! તમે "${customQuery}" વિશે પૂછ્યું. તમારા શિક્ષક સ્વામી એઆઈ સમજાવે છે: પ્રકૃતિમાં બધું એકબીજાથી જોડાયેલું છે. આપણા મગજમાં સુપર લોજિક બનાવવા માટે આપણે આ વિષયોનો શાંતિથી અભ્યાસ કરીએ છીએ! ભણવા માટે આગળની રમત રમો.`;
          quizQuestion = `આજે તમને "${customQuery}" વિશે કયા એઆઈ શિક્ષક ભણાવી રહ્યા છે?`;
          quizOptions = ["દાદી એઆઈ", "સ્વામી એઆઈ", "કોઈ નહીં", "એક કોમ્પ્યુટર"];
          quizExplanation = "સ્વામી એઆઈ તમારા હોશિયાર કાર્ટૂન મિત્ર છે!";
          break;
        case 'mr':
          avatarChar = "🤖 स्वामी AI";
          avatarName = "स्वामी AI (स्मार्ट सोबती)";
          explanation = `अद्भुत जिज्ञासा! तुम्ही "${customQuery}" बद्दल विचारले. तुमचे शिक्षक स्वामी एआय स्पष्ट करतात: निसर्गातील प्रत्येक गोष्ट एकमेकांशी जोडलेली आहे. आपल्या मेंदूमध्ये सुपर लॉजिक तयार करण्यासाठी आपण या विषयांचा पद्धतशीर अभ्यास करतो! खालील खेळ खेळा आणि शिका.`;
          quizQuestion = `आज तुम्हाला "${customQuery}" बद्दल कोणते एआई शिक्षक शिकवत आहेत?`;
          quizOptions = ["दादी एआई", "स्वामी एआई", "कोणीही नाही", "एक संगणक"];
          quizExplanation = "स्वामी एआय तुमचे बुद्धिमान कार्टून मित्र आहेत!";
          break;
        case 'ta':
          avatarChar = "🤖 சுவாமி AI";
          avatarName = "சுவாமி AI (ஸ்மார்ட் நண்பன்)";
          explanation = `அற்புதமான ஆர்வம்! நீங்கள் "${customQuery}" பற்றி கேட்டீர்கள். உங்கள் ஆசிரியர் சுவாமி ஏஐ விளக்குகிறார்: இயற்கையில் அனைத்தும் ஒன்றோடொன்று இணைக்கப்பட்டுள்ளன. நமது மூளையில் சிறந்த அறிவை உருவாக்க இந்த தலைப்புகளைப் படிப்படியாகப் படிக்கிறோம்! விளையாட்டைத் தொடர்ந்து விளையாடுங்கள்.`;
          quizQuestion = `இன்று உங்களுக்கு "${customQuery}" பற்றி கற்பிக்கும் AI ஆசிரியர் யார்?`;
          quizOptions = ["பாட்டி ஏஐ", "சுவாமி ஏஐ", "யாரும் இல்லை", "ஒரு கணினி"];
          quizExplanation = "சுவாமி ஏஐ உங்கள் அன்பான அனிமேஷன் நண்பன்!";
          break;
        case 'te':
          avatarChar = "🤖 స్వామి AI";
          avatarName = "స్వామి AI (తెలివైన స్నేహితుడు)";
          explanation = `అద్భుతమైన ఉత్సుకత! మీరు "${customQuery}" గురించి అడిగారు. మీ గురువు స్వామి ఏఐ వివరిస్తారు: ప్రకృతిలో ప్రతిదీ ఒకదానికొకటి అనుసంధానించబడి ఉంటుంది. మన మెదడులో గొప్ప తెలివితేటలను పెంపొందించడానికి మనం ఈ విషయాలను చదువుతాము! కింద ఉన్న ఆటను పూర్తి చేయండి.`;
          quizQuestion = `ఈ రోజు మీకు "${customQuery}" గురించి బోధిస్తున్న AI ఉపాధ్యాయుడు ఎవరు?`;
          quizOptions = ["నానమ్మ ఏఐ", "స్వామి ఏఐ", "ఎవరూ లేరు", "ఒక కంప్యూటర్"];
          quizExplanation = "స్వామి ఏఐ మీ తెలివైన కార్టూన్ స్నేహితుడు!";
          break;
        default:
          avatarChar = "🤖 Swami AI";
          avatarName = "Swami AI (Mascot Tutor)";
          explanation = `Excellent curiosity! You asked about "${customQuery}". The AI generated character explains: Everything in nature is connected. We study these topics step by step to build super logic inside our brains! Try completing the special conceptual games that follow.`;
          quizQuestion = `Which AI character is teaching you about "${customQuery}" today?`;
          quizOptions = ["Dadi AI", "Swami AI", "No one", "A scary computer"];
          quizExplanation = "Swami AI is your smart cartoon companion!";
          break;
      }

      // Create a dynamic on-the-fly interactive mock response matching their query!
      matchesLesson = {
        id: 'custom-' + Math.random().toString(36).substring(2, 5),
        query: customQuery,
        subject: "AI Generator ✨",
        avatarChar,
        avatarName,
        explanation,
        videoThumbColor: "from-fuchsia-400 to-indigo-600",
        quiz: [
          {
            id: 'cq-1',
            question: quizQuestion,
            options: quizOptions,
            answerIndex: 1,
            explanation: quizExplanation
          }
        ]
      };
    }

    setCustomQuery('');
    setShowQuiz(false);
    setOtpResetQuiz();
    
    // Core Requested functionality: Put live actions by AI Teacher in generating videos!
    simulateVideoGeneration(matchesLesson, true);
  };

  const handlePlayVoiceResponse = () => {
    setIsPlayingVideo(true);
    setAvatarAction('explaining');
    speakText(selectedLesson.explanation, lang, selectedLesson.avatarName, selectedLesson.avatarChar, () => {
      setIsPlayingVideo(false);
      setAvatarAction('idle');
    });
  };

  const handleStopVoiceResponse = () => {
    setIsPlayingVideo(false);
    setAvatarAction('idle');
    stopSpeaking();
  };

  const setOtpResetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswerSubmit = (optionIdx: number) => {
    if (selectedQuizAnswer !== null) return; // Only submit once
    
    setSelectedQuizAnswer(optionIdx);
    const isCorrect = optionIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
    
    // Localize feedback text for correct/incorrect answers so the TTS engine gets translation matching lang
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
        // Award badge
        setClaimedMedals((prev) => [...prev, selectedLesson.id]);
      }
    }
  };

  const toggleDownloadResource = (id: string) => {
    setOfflineResources(prev => prev.map(res => {
      if (res.id === id) {
        return { ...res, downloaded: !res.downloaded };
      }
      return res;
    }));
  };

  return (
    <div id="classroom-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      
      {/* Welcome Board */}
      <header className="bg-white rounded-[24px] p-4 sm:p-6 border border-[#F2CC8F]/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-left shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#E07A5F] font-mono font-bold bg-[#FAF8F4] border border-[#F2CC8F]/30 px-2.5 py-0.5 rounded-full uppercase">
            🟢 Active Classroom Room
          </div>
          <h1 className="font-display font-bold text-2xl text-[#3D405B] leading-tight tracking-tight">
            Namaste, {user.name}! 📚
          </h1>
          <p className="font-sans text-xs sm:text-sm text-gray-650">
            Default study language of your classroom is currently registered as:{' '}
            <span className="font-bold underline text-[#E07A5F] capitalize">
              {SUPPORTED_LANGUAGES.find(l => l.code === user.defaultLanguage)?.label}
            </span>
          </p>
        </div>

        {/* Dynamic score summary badges */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-white border border-yellow-200 shadow-2xs rounded-xl px-3.5 py-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500 animate-bounce" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">My Medals</div>
              <div className="text-sm font-black text-gray-950">
                {claimedMedals.length} / {currentLanguageLessons.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Lesson List & Offline Files */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Classroom Lessons Quick Deck */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-sm text-[#3D405B] uppercase tracking-widest text-left flex items-center gap-1.5">
              <Video className="h-4 w-4 text-[#81B29A]" />
              Interactive Lesson Hub
            </h3>

            <div className="space-y-2.5">
              {currentLanguageLessons.map((item) => (
                <button
                  key={item.id}
                  id={`lesson-selector-${item.id}`}
                  onClick={() => handleLessonSelect(item)}
                  className={`w-full p-3 rounded-xl border text-left transition-all hover:bg-[#FAF8F4] cursor-pointer flex items-center gap-3 ${
                    selectedLesson.id === item.id
                      ? 'border-[#81B29A] bg-[#81B29A]/10 ring-1 ring-[#81B29A]'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.videoThumbColor} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                    {item.avatarChar.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-gray-400 block uppercase">
                      {item.subject}
                    </span>
                    <span className="font-sans font-semibold text-xs sm:text-sm text-gray-900 block truncate">
                      {item.query}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* 2. Offline resource syncing logs (Demonstrates rural limits offline) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-sm text-[#3D405B] uppercase tracking-widest text-left flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4 text-[#E07A5F]" />
                Offline Files Sync
              </span>
              <span className="text-[10px] bg-[#FAF8F4] border border-[#F2CC8F]/40 text-[#8B6E32] font-mono px-2 py-0.5 rounded font-black uppercase shadow-xs border">
                2G Ready
              </span>
            </h3>

            <div className="space-y-2 text-left">
              {offlineResources.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-gray-50/60 rounded-xl border border-gray-150 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-mono font-bold text-[#E07A5F] block bg-[#E07A5F]/10 px-1.5 py-0.5 rounded-sm max-w-max uppercase tracking-wider">
                      {res.category} • {res.subject}
                    </span>
                    <h5 className="font-sans font-bold text-xs text-[#3D405B] truncate mt-1">
                      {res.title}
                    </h5>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
                      Size: {res.size}
                    </span>
                  </div>
                  <button
                    id={`download-toggle-${res.id}`}
                    onClick={() => toggleDownloadResource(res.id)}
                    className={`p-2 rounded-lg cursor-pointer ${
                      res.downloaded
                        ? 'bg-[#81B29A]/20 text-[#81B29A]'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                    title={res.downloaded ? "Delete local copy" : "Download local copy"}
                  >
                    {res.downloaded ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active AI Video Player & Gamified Quiz (Interactive game experience!) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Custom AI query input bar */}
          <form onSubmit={handleAskCustomQuery} className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-2xs flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#81B29A]" />
              <input
                type="text"
                id="custom-classroom-query"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ask me any science or math question... (e.g., How do birds fly?)"
                className="w-full pl-9 pr-14 py-3 bg-gray-50/50 rounded-xl border border-gray-200 text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
              />
              <div className="absolute right-3 top-2.5 flex items-center">
                <SpeechInputButton 
                  lang={lang} 
                  onTranscript={(text) => setCustomQuery(text)} 
                />
              </div>
            </div>
            <button
              type="submit"
              id="submit-classroom-query"
              className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-5 rounded-xl text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-[#F2CC8F]" />
              <span>Ask AI</span>
            </button>
          </form>

          {/* 2. Visual active AI character video box */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
            
            {/* Player Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-3 px-4 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs font-mono font-bold tracking-widest text-gray-300 uppercase">
                  AI Video Character Tutoring Response
                </span>
              </div>
              <span className="text-[10px] bg-white/15 text-white/90 border border-white/20 font-mono px-2 py-0.5 rounded uppercase">
                {selectedLesson.avatarName}
              </span>
            </div>

            {/* Video Canvas Sandbox */}
            <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-900 flex flex-col justify-between p-6 overflow-hidden">
              {/* Background ambient animation bubbles */}
              <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-xl uppercase" />
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#FAF8F4]/10 blur-xl uppercase" />

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
                      <span className="text-[10px] font-extrabold font-sans text-[#3D405B] mt-0.5 leading-none px-1 whitespace-nowrap">
                        {reaction.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Avatar Mascot Container */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full">
                {isGeneratingVideo ? (
                  /* Active Live Actions during AI Video Generation with visual Mascot built-in */
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full max-w-sm mx-auto">
                    <InteractiveAITeacher 
                      avatarChar={selectedLesson.avatarChar}
                      avatarName={selectedLesson.avatarName}
                      action={avatarAction}
                      isPlaying={false}
                    />

                    <div className="space-y-2 text-center w-full">
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest px-1">
                        <span>🤖 GENERATING VIDEO...</span>
                        <span className="text-[#F2CC8F] font-black">{generationProgress}%</span>
                      </div>
                      
                      {/* Interactive compiling progress bar */}
                      <div className="h-2.5 w-full bg-gray-950/80 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#F2CC8F] via-[#E07A5F] to-[#81B29A] rounded-full transition-all duration-150"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      
                      {/* Staging phrase */}
                      <p className="text-[11px] sm:text-xs font-sans font-extrabold text-[#F2CC8F] leading-tight px-2 min-h-8 flex items-center justify-center animate-pulse">
                        {generationStage}
                      </p>
                    </div>
                  </div>
                ) : isPlayingVideo || avatarAction !== 'idle' ? (
                  /* Running/talking active face mockup with live actions and hands/face gestures support */
                  <div className="relative text-center">
                    <InteractiveAITeacher 
                      avatarChar={selectedLesson.avatarChar}
                      avatarName={selectedLesson.avatarName}
                      action={avatarAction}
                      isPlaying={isPlayingVideo}
                    />
                  </div>
                ) : (
                  /* Idle face / play button overlay styled directly over the interactive resting mascot */
                  <div className="relative flex flex-col items-center">
                    <div className="relative group">
                      {/* Rest posture of Mascot behind a play button */}
                      <div className="opacity-75 blur-xs group-hover:opacity-100 group-hover:blur-none transition-all duration-300">
                        <InteractiveAITeacher 
                          avatarChar={selectedLesson.avatarChar}
                          avatarName={selectedLesson.avatarName}
                          action="idle"
                          isPlaying={false}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          id="trigger-play-video-mascot"
                          onClick={handlePlayVoiceResponse}
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#3D405B] to-[#E07A5F] border-4 border-[#F2CC8F]/50 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-115 cursor-pointer z-30"
                        >
                          <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white fill-current ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isGeneratingVideo && (
                  <div className="text-white text-center">
                    <h4 className="font-display font-extrabold text-sm sm:text-base tracking-tight">
                      {selectedLesson.query}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isPlayingVideo ? "Currently reading the answer aloud..." : "Click to view AI video answer response"}
                    </p>
                  </div>
                )}
              </div>

              {/* Live Caption/Subtitle Subtitle bar (Awesome helper mechanism!) */}
              <div className="w-full bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center relative z-10">
                <div className="absolute right-2 top-2">
                  <SpeakButton text={selectedLesson.explanation} lang={lang} size="sm" className="bg-black/40 text-[#E07A5F] border-white/10" />
                </div>
                <div className="pr-8 text-center">
                  <p className="text-xs sm:text-sm font-sans font-medium text-white italic">
                    "{selectedLesson.explanation}"
                  </p>
                </div>
              </div>

            </div>

            {/* Live Interactive Action Controls (Allows students to trigger gestures & animation bursts) */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
              <span className="text-[10px] font-mono font-bold text-[#F2CC8F] uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                Students Live Reactions:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  id="action-wave-btn"
                  onClick={() => triggerLiveAction('wave')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/10 shadow-3xs"
                  title="Wave Hello"
                >
                  <span className="text-sm">👋</span>
                  <span className="text-[10px] sm:text-xs">Wave</span>
                </button>
                <button
                  type="button"
                  id="action-idea-btn"
                  onClick={() => triggerLiveAction('idea')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/10 shadow-3xs"
                  title="Aha Idea!"
                >
                  <span className="text-sm">💡</span>
                  <span className="text-[10px] sm:text-xs">Idea</span>
                </button>
                <button
                  type="button"
                  id="action-thumbs-btn"
                  onClick={() => triggerLiveAction('thumbsup')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/10 shadow-3xs"
                  title="Applaud Praise"
                >
                  <span className="text-sm">👍</span>
                  <span className="text-[10px] sm:text-xs">Praise</span>
                </button>
                <button
                  type="button"
                  id="action-celebrate-btn"
                  onClick={() => triggerLiveAction('celebrate')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/10 shadow-3xs"
                  title="Celebrate Victory"
                >
                  <span className="text-sm">🎉</span>
                  <span className="text-[10px] sm:text-xs">Celebrate</span>
                </button>
                <button
                  type="button"
                  id="action-think-btn"
                  onClick={() => triggerLiveAction('think')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-white/10 shadow-3xs"
                  title="Think Deep"
                >
                  <span className="text-sm">🤔</span>
                  <span className="text-[10px] sm:text-xs">Think</span>
                </button>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                {isPlayingVideo ? (
                  <button
                    id="stop-lesson-speech"
                    onClick={handleStopVoiceResponse}
                    className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-sans font-bold cursor-pointer"
                  >
                    ⏹️ Stop Speaking
                  </button>
                ) : (
                  <button
                    id="start-lesson-speech"
                    onClick={handlePlayVoiceResponse}
                    className="px-4 py-2 bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 hover:bg-[#81B29A]/25 rounded-xl text-xs font-sans font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Volume2 className="h-4 w-4 text-[#81B29A]" />
                    <span>Listen Response</span>
                  </button>
                )}
              </div>

              {/* EXPLICIT REQUESTED COMPONENT: Take Quiz Button! */}
              <button
                id="classroom-take-quiz-btn"
                onClick={() => {
                  setShowQuiz(true);
                  setOtpResetQuiz();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-sans font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-103"
              >
                <HelpCircle className="h-4.5 w-4.5" />
                <span>📝 Take Lesson Quiz</span>
              </button>
            </div>

          </div>

          {/* 3. Sliding / expandable quiz box below response video */}
          {showQuiz && (
            <div id="active-lesson-quiz-drawer" className="bg-amber-50 rounded-3xl p-5 border border-amber-250 text-left space-y-4 animate-fade-in">
              
              {/* Quiz Header */}
              <div className="flex justify-between items-center border-b border-amber-205 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h4 className="font-display font-extrabold text-base text-amber-950">
                      Gamified Lesson Quiz
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">
                      Pass to unlock study medals
                    </span>
                  </div>
                </div>
                <button
                  id="close-quiz-panel"
                  onClick={() => setShowQuiz(false)}
                  className="p-1 px-2.5 rounded bg-white text-xs font-mono font-bold hover:bg-amber-100 text-amber-900 border border-amber-205 cursor-pointer"
                >
                  Close X
                </button>
              </div>

              {!quizFinished ? (
                /* Question screen */
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-amber-700">
                    Question {currentQuizIndex + 1} of {selectedLesson.quiz.length}
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-amber-150">
                    <h5 className="font-display font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {selectedLesson.quiz[currentQuizIndex].question}
                    </h5>
                  </div>

                  {/* Option stack */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    {selectedLesson.quiz[currentQuizIndex].options.map((opt, oIdx) => {
                      const isSelected = selectedQuizAnswer === oIdx;
                      const isCorrect = oIdx === selectedLesson.quiz[currentQuizIndex].answerIndex;
                      
                      let btnStyle = "bg-white border-gray-200 text-gray-800 hover:bg-amber-150/40";
                      if (selectedQuizAnswer !== null) {
                        if (isCorrect) {
                          btnStyle = "bg-[#81B29A]/20 text-[#3D405B] border-[#81B29A] font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-100 text-rose-800 border-rose-400 font-medium";
                        } else {
                          btnStyle = "bg-white/40 text-gray-400 border-gray-100 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          id={`quiz-option-${oIdx}`}
                          disabled={selectedQuizAnswer !== null}
                          onClick={() => handleAnswerSubmit(oIdx)}
                          className={`w-full p-3 text-left rounded-xl border text-xs sm:text-sm font-sans transition-all cursor-pointer ${btnStyle}`}
                        >
                          <span className="font-bold mr-2 font-mono">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation reveal */}
                  {selectedQuizAnswer !== null && (
                    <div className="p-3 bg-white border border-amber-100 rounded-xl space-y-2 animate-fade-in text-xs sm:text-sm">
                      <div className="font-black text-amber-900 flex items-center gap-1.5">
                        {selectedQuizAnswer === selectedLesson.quiz[currentQuizIndex].answerIndex ? (
                          <span className="text-[#81B29A]">🎉 Correct!</span>
                        ) : (
                          <span className="text-rose-600">🌱 Learning Spot:</span>
                        )}
                      </div>
                      <p className="text-gray-650 leading-snug">
                        {selectedLesson.quiz[currentQuizIndex].explanation}
                      </p>
                      
                      <button
                        type="button"
                        id="quiz-next-question-btn"
                        onClick={handleNextQuizQuestion}
                        className="mt-2 text-xs font-semibold px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                      >
                        Next Concept {currentQuizIndex + 1 < selectedLesson.quiz.length ? "➡️" : "🏁"}
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* Completion screen */
                <div className="text-center p-6 space-y-5">
                  <div className="text-5xl">🏆</div>
                  <div>
                    <h4 className="font-display font-bold text-[#3D405B] text-lg">
                      Lesson Completed!
                    </h4>
                    <p className="font-sans text-sm text-gray-650 mt-1">
                      You scored <span className="font-black text-[#81B29A]">{quizScore}</span> correct answers!
                    </p>
                  </div>

                  {quizScore === selectedLesson.quiz.length ? (
                    <div className="bg-[#81B29A]/15 text-[#3D405B] border border-[#81B29A]/20 p-3 rounded-2xl text-xs sm:text-sm font-sans font-bold flex items-center justify-center gap-2">
                      <Smile className="h-5 w-5 text-[#81B29A]" />
                      <span>Incredible! You earned the active lesson golden medal!</span>
                    </div>
                  ) : (
                    <div className="bg-amber-100 text-amber-800 p-3 rounded-2xl text-xs font-sans font-semibold">
                      Keep practicing to score 100% and earn medals!
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      id="quiz-retry-btn"
                      onClick={setOtpResetQuiz}
                      className="px-5 py-2 bg-white hover:bg-gray-50 text-[#3D405B] border border-gray-200 text-xs font-sans font-bold rounded-xl cursor-pointer"
                    >
                      Retry Quiz
                    </button>
                    <button
                      type="button"
                      id="quiz-leave-btn"
                      onClick={() => setShowQuiz(false)}
                      className="px-5 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-sans font-bold rounded-xl cursor-pointer"
                    >
                      Finish Lessons
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
