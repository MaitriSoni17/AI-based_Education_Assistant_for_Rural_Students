import { useState, useEffect, useRef, MouseEvent } from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { LanguageCode } from '../types';

interface SpeechInputButtonProps {
  lang: LanguageCode;
  onTranscript: (text: string) => void;
  className?: string;
}

export default function SpeechInputButton({ lang, onTranscript, className = "" }: SpeechInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check compatibility on mount
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setError(null);
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;

      // Match regional language mapping
      const langMap: Record<LanguageCode, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        gu: 'gu-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
      };
      recognition.lang = langMap[lang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combinedTranscript = finalTranscript || interimTranscript;
        if (combinedTranscript) {
          onTranscript(combinedTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone permission denied.");
        } else if (event.error === 'no-speech') {
          setError("No sound detected.");
          // Clear error message automatically after 2 seconds
          setTimeout(() => setError(null), 2000);
        } else {
          setError(`Error: ${event.error}`);
          setTimeout(() => setError(null), 2000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      setError("Failed to start listening.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Localized Speak Prompts
  const getMicTooltip = () => {
    if (isListening) {
      switch (lang) {
        case 'hi': return "सुन रहा हूँ... बोलना जारी रखें";
        case 'gu': return "સાંભળી રહ્યો છું... બોલવાનું ચાલુ રાખો";
        case 'mr': return "ऐकत आहे... बोलणे सुरू ठेवा";
        case 'ta': return "கேட்கிறது... தொடர்ந்து பேசுங்கள்";
        case 'te': return "వింటున్నాను... మాట్లాడటం కొనసాగించండి";
        default: return "Listening... keep speaking";
      }
    }
    switch (lang) {
      case 'hi': return "बोलकर सवाल पूछें";
      case 'gu': return "બોલીને પ્રશ્ન પૂછો";
      case 'mr': return "बोलून प्रश्न विचारा";
      case 'ta': return "பேசி கேள்வி கேளுங்கள்";
      case 'te': return "మాట్లాడి ప్రశ్న అడగండి";
      default: return "Ask by speaking";
    }
  };

  const getStatusText = () => {
    if (isListening) {
      switch (lang) {
        case 'hi': return "बोलिए...";
        case 'gu': return "બોલો...";
        case 'mr': return "बोला...";
        case 'ta': return "பேசுங்கள்...";
        case 'te': return "మాట్లాడండి...";
        default: return "Listening...";
      }
    }
    return "";
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {isListening && (
        <span className="mr-1.5 text-[10px] sm:text-[11px] font-semibold font-sans text-rose-500 animate-pulse hidden xs:inline uppercase tracking-wide">
          {getStatusText()}
        </span>
      )}
      
      <button
        type="button"
        id="voice-mic-trigger"
        onClick={toggleListening}
        title={getMicTooltip()}
        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 relative ${
          isListening 
            ? 'bg-rose-50 border border-rose-200 text-rose-500 animate-pulse shadow-xs hover:bg-rose-100' 
            : 'hover:bg-gray-100 text-[#81B29A] hover:text-[#E07A5F] active:scale-95'
        }`}
      >
        <Mic className="h-4.5 w-4.5 shrink-0 transition-transform hover:scale-105" />
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {/* Hover tooltip / error display */}
      {error && (
        <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 text-white text-[10px] py-1 px-2.5 rounded shadow-lg pointer-events-none z-50 flex items-center gap-1 shrink-0 font-sans tracking-wide min-w-[150px]">
          <AlertCircle className="h-3 w-3 text-rose-400 inline" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
