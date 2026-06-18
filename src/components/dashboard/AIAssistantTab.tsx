import { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import InteractiveAITeacher from '../InteractiveAITeacher';
import { Sparkles, Send, Volume2, VolumeX, Smile, ArrowRight, CornerDownRight } from 'lucide-react';

interface AIAssistantTabProps {
  lang: LanguageCode;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const CHARACTERS = [
  { 
    id: 'swami', 
    name: 'Swami AI 🤖', 
    role: 'Mascot Companion', 
    char: '🤖 Swami AI',
    color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
    welcome: {
      en: "Hello, smart friend! I am Swami. Let's solve amazing science, logic, or math puzzles together. Ask me anything!",
      hi: "नमस्ते साथी! मैं स्वामी हूँ। आइए मिलकर विज्ञान, तार्किक पहेलियाँ या गणित हल करें। मुझसे कुछ भी पूछें!",
      gu: "નમસ્તે દોસ્ત! હું સ્વામી છું. ચાલો સાથે મળીને વિજ્ઞાન અને ગણિતના કોયડા ઉકેલીએ. ગમે તે પૂછો!",
      mr: "नमस्कार मित्रा! मी स्वामी आहे. चला एकत्र येऊन विज्ञान, तर्कशास्त्र आणि अंकगणित सोडवूया! काहीही विचारा!",
      ta: "வணக்கம் நண்பா! நான் சுவாமி. அறிவியல், கணிதம் மற்றும் தர்க்க புதிர்களை ஒன்றாக தீர்ப்போம். எதையும் கேள்!",
      te: "నమస్తే స్నేహితుడా! నేను స్వామిని. సైన్స్, మ్యాథ్స్ మరియు పజిల్స్ ని కలిసి చేధిద్దాం. ఏదైనా అడుగు!"
    }
  },
  { 
    id: 'dadi', 
    name: 'Dadi AI 👵', 
    role: 'Village Storyteller', 
    char: '👵 Dadi AI',
    color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
    welcome: {
      en: "Greetings, my child. Come sit with me. I have many traditional folk stories of stars, rain, crops, and animals to tell you.",
      hi: "खुश रहो मेरे बच्चे। यहाँ मेरे पास बैठो। मेरे पास तुम्हें सुनाने के लिए तारों, बारिश, फसलों और पशु-पक्षियों की पारंपरिक कहानियाँ हैं।",
      gu: "ખુશ રહે બેટા. મારી પાસે બેસ. વાદળો, તારા, પશુ-પક્ષીઓ અને ખેતરની ખૂબ સરસ વાર્તાઓ તને સંભળાવું.",
      mr: "बाळा, माझ्या शेजारी बस. माझ्याकडे तुला सांगायला ढग, तारे, कोडे आणि प्राण्यांच्या छान पारंपारिक गोष्टी आहेत.",
      ta: "வா மகனே. என்னருகில் அமர். உனக்கு விண்மீன்கள், மழை, பயிர்கள் மற்றும் விலங்குகள் பற்றிய கிராமியக் கதைகள் பல சொல்வேன்.",
      te: "సంతోషం బాబు. ఇటు వచ్చి కూర్చో. నీకు నక్షత్రాలు, వానలు, పంటలు మరియు జంతువుల ప్రాచీన జానపద కథలెన్నో చెబుతా."
    }
  },
  { 
    id: 'chanda', 
    name: 'Chanda AI 🦊', 
    role: 'Witty Mathematics Fox', 
    char: '🦊 Chanda AI',
    color: 'border-orange-250 bg-orange-50/50 hover:bg-orange-50 text-orange-950',
    welcome: {
      en: "Aha! I am Chanda, the clever forest fox. I can multiply, divide, and puzzle you with speedy, trick questions. Let's play!",
      hi: "अहा! मैं हूँ चंदा, जंगल की चालाक लोमड़ी। मैं तुम्हें गणित के अनोखे पहाड़ों और पहेलियों से हैरान कर सकती हूँ। आओ खेलें!",
      gu: "અરે વાહ! હું ચંદા, જંગલની હોશિયાર શિયાળ. હું તને ગણિતના જાદુઈ પ્રશ્નો પૂછીને મજા કરાવીશ. ચાલ શરૂ કરીએ!",
      mr: "वा! मी आहे चंदा, जंगलातील चतुर कोल्हा. मी तुला गणित आणि बुद्धिमत्ताच्या मजेशीर ट्रिक्स शिकवीन. चला खेळूया!",
      ta: "ஆஹா! நான் தான் சண்டா, காட்டின் தந்திர நரி. கணிதப் புதிர்களால் உன்னை சோதிக்க வந்துள்ளேன். விளையாடலாமா!",
      te: "ఆహా! నేను చందాని, అడవి తెలివైన నక్కని. మ్యాథ్స్ ట్రిక్స్ తో నిన్ను ఆశ్చర్యపరుస్తా. పద ఆట ఆడదాం!"
    }
  }
];

export default function AIAssistantTab({ lang }: AIAssistantTabProps) {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [inputText, setInputText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [msgHistory, setMsgHistory] = useState<Record<string, ChatMessage[]>>({});
  const [mascotAction, setMascotAction] = useState<'idle' | 'explaining' | 'wave' | 'idea' | 'thumbsup' | 'celebrate' | 'think'>('idle');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message for each character on load
  useEffect(() => {
    const defaultWelcomeText = selectedChar.welcome[lang] || selectedChar.welcome['en'];
    
    // Check if we already have history for this character, if not set welcome
    if (!msgHistory[selectedChar.id]) {
      setMsgHistory(prev => ({
        ...prev,
        [selectedChar.id]: [
          {
            id: 'welcome',
            sender: 'assistant',
            text: defaultWelcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
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
    
    speakText(
      msg.text, 
      lang, 
      selectedChar.name, 
      selectedChar.char, 
      () => {
        setIsPlayingVoice(null);
        setMascotAction('idle');
      }
    );
  };

  const generateAIResponseText = (query: string): { response: string, action: typeof mascotAction } => {
    const qLower = query.toLowerCase();
    
    // Quick tailored offline responses matching rural syllabus concepts
    if (qLower.includes('rain') || qLower.includes('cloud') || qLower.includes('बारिश') || qLower.includes('धूप')) {
      if (selectedChar.id === 'dadi') {
        return {
          action: 'wave',
          response: lang === 'hi' 
            ? "बारिश भगवान इंद्र या बादलों के रथ से गिरती है, ऐसा हम पुराने समय में कहते थे! विज्ञान कहता है कि सूरज की गर्मी से पानी भाप बनकर उड़ जाता है, ठंडी हवा से बादल बनकर पानी सीधे खेतों में गिरने आता है।" 
            : "Ah! The clouds gather like sheep, my child. The sun heats lake waters, turning it to vapor, which climbs into the cool sky. When the heavy clouds can't hold it anymore, it rains down on our millet fields!"
        };
      } else if (selectedChar.id === 'swami') {
        return {
          action: 'idea',
          response: lang === 'hi'
            ? "जल चक्र (Water Cycle) अत्यंत तार्किक है! सौर गर्मी के कारण जल का वाष्पीकरण होता है, फिर संघनन की प्रक्रिया से बादल बनते हैं, और अंततः गुरुत्वाकर्षण के कारण वर्षा होती है।"
            : "The scientific concept is Evaporation and Condensation! Solar heat causes water molecules to vaporize, rising to form clouds. When air cools down, gravity pulls droplets down as rain."
        };
      } else {
        return {
          action: 'think',
          response: lang === 'hi'
            ? "सोचो, अगर बादलों को निचोड़ा जा सके तो क्या वे नींबू पानी देंगे? नहीं! वे सिर्फ मीठा, शुद्ध वर्षा जल देते हैं जो नदियों में बहता है।"
            : "Imagine squeezing a cloud! To produce 1 cm of rain on our village, millions of heavy water drops must condense under high humidity. Sky science is awesome!"
        };
      }
    }

    if (qLower.includes('math') || qLower.includes('multiply') || qLower.includes('गणित') || qLower.includes('पहाड़े')) {
      if (selectedChar.id === 'chanda') {
        return {
          action: 'celebrate',
          response: "Math is my jam! Ask me to multiply 8 x 7 = 56, or do you want to play a trick question? Why is 6 afraid of 7? Because 7, 8, 9!"
        };
      }
      return {
        action: 'idea',
        response: "Arithmetic is useful for village trade! Try adding and multiplying items to quickly settle accounts."
      };
    }

    if (qLower.includes('story') || qLower.includes('कहानी') || qLower.includes('કહાની')) {
      if (selectedChar.id === 'dadi') {
        return {
          action: 'wave',
          response: lang === 'hi'
            ? "प्यारे बच्चे, एक बार गाँव में एक चालाक बैल था जिसने शेर को अपनी बुद्धि से डरा दिया! बुद्धि हमेशा ताकत से बड़ी होती है।"
            : "Once upon a time in Rampur, a tiny mouse saved a mighty elephant from a rope trap! Little friends can do great things."
        };
      }
      return {
        action: 'think',
        response: "Dadi is the story master, but I can tell you the history story of Space Rockets and Satellites orbiting above India!"
      };
    }

    // Default Fallbacks
    switch (lang) {
      case 'hi':
        return {
          action: 'thumbsup',
          response: `बहुत बढ़िया प्रश्न! मैं ${selectedChar.name} हूँ। ग्रामीण विकास और विज्ञान ही हमारा भविष्य है। इस विषय पर पाठ पूरा करने के लिए हमारे 'Tutor' टैब में जाएँ!`
        };
      case 'gu':
        return {
          action: 'thumbsup',
          response: `સરસ પ્રશ્ન છે! હું ${selectedChar.name} છું. વિજ્ઞાન આપણને મજબૂત બનાવે છે. ભણવા માટે 'Tutor' વિભાગમાં ચોક્કસ જજો!`
        };
      default:
        return {
          action: 'thumbsup',
          response: `Fantastic curiosity! I am ${selectedChar.name}. Every question makes your logic battery 100% full. Let's keep exploring subjects, or check the 'Tutor' panel for deep lessons!`
        };
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMsgHistory(prev => ({
      ...prev,
      [selectedChar.id]: [...(prev[selectedChar.id] || []), userMsg]
    }));

    setInputText('');
    setMascotAction('think');

    // Simulate AI character thinking and replying
    setTimeout(() => {
      const { response, action } = generateAIResponseText(userMsg.text);
      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMsgHistory(prev => {
        const history = prev[selectedChar.id] || [];
        const updated = [...history, aiMsg];
        
        // Auto trigger speaking the response for rural child accessibility!
        setTimeout(() => {
          speakMessageAloud(aiMsg);
        }, 300);

        return {
          ...prev,
          [selectedChar.id]: updated
        };
      });

      setMascotAction(action);
      setTimeout(() => setMascotAction('idle'), 2500);

    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* LEFT: CHARACTER SQUAD PICKER & MASCOT PREVIEW */}
      <div className="lg:col-span-4 space-y-5">
        
        {/* CHARACTER GRID */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
          <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Sparkles className="h-4 w-4 text-[#E07A5F]" />
            Select Your AI Companion
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
                  <p className="text-[10px] text-gray-500 font-sans font-medium">{char.role}</p>
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
            <span className="text-[8px] font-mono text-gray-400 font-bold uppercase tracking-widest">Active Mascot State</span>
          </div>

          <InteractiveAITeacher
            avatarChar={selectedChar.char}
            avatarName={selectedChar.name}
            action={mascotAction}
            isPlaying={isPlayingVoice !== null}
          />
          <span className="text-xs font-mono font-bold text-[#F2CC8F] bg-white/10 px-2.5 py-1 rounded truncate max-w-full">
            {selectedChar.name} ({mascotAction === 'idle' ? 'Listening...' : mascotAction.toUpperCase()})
          </span>
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
                <span>Ready to explain in regional Indian tongues</span>
              </p>
            </div>
          </div>
          
          {isPlayingVoice && (
            <button
              onClick={() => { stopSpeaking(); setIsPlayingVoice(null); setMascotAction('idle'); }}
              className="text-xs bg-red-500/20 text-rose-300 border border-red-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Stop Aloud</span>
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
                    
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* Speak bubble aloud helper button inside character box */}
                    {!isMe && (
                      <button
                        onClick={() => speakMessageAloud(msg)}
                        className={`absolute -bottom-2.5 -right-2 p-1 rounded-full border text-xs shadow cursor-pointer transition-colors ${
                          isPlayingVoice === msg.id 
                            ? 'bg-rose-500 border-rose-400 text-white animate-bounce' 
                            : 'bg-white border-gray-200 text-[#E07A5F] hover:bg-gray-50'
                        }`}
                        title="Read this reply out loud"
                      >
                        {isPlayingVoice === msg.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  
                  <span className={`text-[9px] font-mono text-gray-400 block ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
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
                  {selectedChar.name.split(' ')[0]} is thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-gray-50 border-t border-gray-150 shrink-0 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${selectedChar.name.split(' ')[0]} anything... (e.g., Why is water wet?)`}
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
            disabled={!inputText.trim() || mascotAction === 'think'}
            className="bg-[#3D405B] hover:bg-[#2D2F44] text-white px-4 rounded-xl text-xs font-sans font-bold flex items-center justify-center shrink-0 shadow-3xs cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
