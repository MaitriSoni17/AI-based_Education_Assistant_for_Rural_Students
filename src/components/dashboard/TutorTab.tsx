import React, { useState, useEffect, FormEvent } from 'react';
import { LanguageCode, User, QuizQuestion, OfflineResource } from '../../types';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../../data/translations';
import { offlineSyncManager } from '../../utils/offlineSync';
import SpeakButton from '../SpeakButton';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Play, BookOpen, Download, CheckCircle2, ChevronRight, Award, 
  HelpCircle, Volume2, Search, Sparkles, Smile, Video, ArrowLeft, RefreshCw 
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
          explanation: "वनस्पती हवेतील कार्बन डायऑक्साइड घेऊन शुद्ध ऑक्सिजन बाहेर सोडतात!"
        }
      ]
    }
  ],
  ta: [
    {
      id: 'rain',
      query: "மேகங்கள் எவ்வாறு mழையைத் தருகின்றன?",
      subject: "அறிவியல் 🔬",
      avatarChar: "👵 பாட்டி AI",
      avatarName: "பாட்டி AI (கிராமத்து பெரியவர்)",
      explanation: "சூரியனின் வெப்பத்தால் ஏரிகள் மற்றும் ஆறுகளிலுள்ள நீர் சூடாகி நீராவியாக மேலே செல்கிறது. இந்த நீராவி வான்வெளியில் குளிர்ந்து மேகங்களாக மாறுகிறது! மேகங்கள் மிகவும் கனமாகவும் குளிர்ச்சியாகவும் மாறும்போது, அவை மழையாக பூமிக்கு வருகின்றன! ಇದುவே ನೀರ ಚಕ್ರ.",
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
      query: "కిరణజన్య సంయోగ క్రియ అంటే ఏమిటి?",
      subject: "సైన్స్ 🔬",
      avatarChar: "🤖 స్వామి AI",
      avatarName: "స్వామి AI (తెలివైన స్నేహితుడు)",
      explanation: "కిరణజన్య సంయోగ క్రియ అంటే మొక్కలు ఆహారాన్ని తయారు చేసుకునే విధానం! ఆకుపచ్చని ఆకులు సూర్యరశ్మి, నేల నుండి నీరు, మరియు గాలి నుండి కార్బన్ డై ఆక్సైడ్ గ్రహించి, పత్రహరితం సహాయంతో ఆహారాన్ని తయారు చేసి, మన శ్వాస కోసం స్వచ్ఛమైన ఆక్సిజన్ విడుదల చేస్తాయి!",
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

interface TutorTabProps {
  user: User;
  lang: LanguageCode;
  claimedMedals: string[];
  setClaimedMedals: React.Dispatch<React.SetStateAction<string[]>>;
  offlineResources: OfflineResource[];
  setOfflineResources: React.Dispatch<React.SetStateAction<OfflineResource[]>>;
}

export default function TutorTab({ 
  user, lang, claimedMedals, setClaimedMedals, offlineResources, setOfflineResources 
}: TutorTabProps) {
  const currentLanguageLessons = SAMPLE_LESSONS[lang]?.length > 0 
    ? SAMPLE_LESSONS[lang] 
    : SAMPLE_LESSONS['en'];

  const [selectedLesson, setSelectedLesson] = useState<LessonQuery>(currentLanguageLessons[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

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

  useEffect(() => {
    const matched = currentLanguageLessons.find(l => l.id === selectedLesson.id);
    if (matched) {
      setSelectedLesson(matched);
    } else {
      setSelectedLesson(currentLanguageLessons[0]);
    }
    setIsPlayingVideo(false);
    stopSpeaking();
  }, [lang]);

  // Clean speaking state on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

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
    simulateVideoGeneration(lesson, false);
  };

  const handleAskCustomQuery = (e: FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

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
            id: 'custom-q1',
            question: quizQuestion,
            options: quizOptions,
            answerIndex: 1,
            explanation: quizExplanation
          }
        ]
      };
    }

    simulateVideoGeneration(matchesLesson, true);
    setCustomQuery('');
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

  const toggleDownloadResource = (id: string) => {
    setOfflineResources(prev => prev.map(res => {
      if (res.id === id) {
        return { ...res, downloaded: !res.downloaded };
      }
      return res;
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* LEFT COLUMN: Lesson List & Offline Files */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* 1. Classroom Lessons Quick Deck */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
          <h3 className="font-display font-bold text-xs text-[#3D405B] uppercase tracking-widest text-left flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Video className="h-4 w-4 text-[#81B29A]" />
            Scholastic Lesson Deck
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
        </div>

        {/* 2. Offline resource syncing logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-2xs space-y-4">
          <h3 className="font-display font-bold text-xs text-[#3D405B] uppercase tracking-widest text-left flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-[#E07A5F]" />
              Offline Files Sync
            </span>
            <span className="text-[9px] bg-[#FAF8F4] border border-[#F2CC8F]/40 text-[#8B6E32] font-mono px-2 py-0.5 rounded font-black uppercase">
              2G Cache
            </span>
          </h3>

          <div className="space-y-2 text-left">
            {offlineResources.map((res) => (
              <div
                key={res.id}
                className="p-2.5 bg-gray-50/60 rounded-xl border border-gray-150 flex items-center justify-between gap-1.5"
              >
                <div className="min-w-0 text-left">
                  <span className="text-[8px] font-mono font-bold text-[#E07A5F] block bg-[#E07A5F]/10 px-1.5 py-0.5 rounded-sm max-w-max uppercase tracking-wider">
                    {res.category} • {res.subject}
                  </span>
                  <h5 className="font-sans font-bold text-[11px] text-[#3D405B] truncate mt-1">
                    {res.title}
                  </h5>
                  <span className="text-[9px] font-mono text-gray-400 mt-0.5 block font-medium">
                    Size: {res.size}
                  </span>
                </div>
                <button
                  id={`download-toggle-${res.id}`}
                  onClick={() => toggleDownloadResource(res.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    res.downloaded
                      ? 'bg-[#81B29A]/20 text-[#81B29A]'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                  title={res.downloaded ? "Delete local copy" : "Download local copy"}
                >
                  {res.downloaded ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Active AI Video Player & Gamified Quiz */}
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
              placeholder="Ask me any science or math question... (e.g., Why is wind cold?)"
              className="w-full pl-9 pr-14 py-3 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
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
            className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-[#F2CC8F]" />
            <span>Generate Lesson</span>
          </button>
        </form>

        {/* 2. Visual active AI character video box */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md">
          
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-3 px-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-gray-350 uppercase">
                Interactive Lecture Module
              </span>
            </div>
            <span className="text-[10px] bg-white/15 text-white/90 border border-white/20 font-mono px-2 py-0.5 rounded uppercase">
              {selectedLesson.avatarName}
            </span>
          </div>

          <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-900 flex flex-col justify-between p-5 overflow-hidden">
            <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

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

            {/* Avatar Mascot Container */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full">
              {isGeneratingVideo ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full max-w-sm mx-auto">
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
              ) : isPlayingVideo || avatarAction !== 'idle' ? (
                <div className="relative text-center">
                  <InteractiveAITeacher 
                    avatarChar={selectedLesson.avatarChar}
                    avatarName={selectedLesson.avatarName}
                    action={avatarAction}
                    isPlaying={isPlayingVideo}
                  />
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="relative group">
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
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#3D405B] to-[#E07A5F] border-4 border-[#F2CC8F]/50 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110 cursor-pointer z-35"
                      >
                        <Play className="h-6 w-6 text-white fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isGeneratingVideo && (
                <div className="text-white text-center px-4">
                  <h4 className="font-display font-extrabold text-sm sm:text-base tracking-tight leading-snug">
                    {selectedLesson.query}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-sans font-medium">
                    {isPlayingVideo ? "Currently reading the answer aloud..." : "Click center to play talking mascot audio lecture"}
                  </p>
                </div>
              )}
            </div>

            {/* Live Subtitle bar */}
            <div className="w-full bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center relative z-10 mt-3">
              <div className="absolute right-2 top-2">
                <SpeakButton text={selectedLesson.explanation} lang={lang} size="sm" className="bg-black/45 text-[#E07A5F] border-white/10 shrink-0" />
              </div>
              <div className="pr-8 text-center text-xs sm:text-sm">
                <p className="font-sans font-medium text-white italic leading-relaxed">
                  "{selectedLesson.explanation}"
                </p>
              </div>
            </div>

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

    </div>
  );
}
