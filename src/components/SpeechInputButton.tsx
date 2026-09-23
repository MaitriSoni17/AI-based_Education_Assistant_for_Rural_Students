import React, { Component } from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { LanguageCode } from '../types';

interface SpeechInputButtonProps {
  lang: LanguageCode;
  onTranscript: (text: string) => void;
  className?: string;
}

interface SpeechInputButtonState {
  isListening: boolean;
  error: string | null;
  hasCrash: boolean;
}

export default class SpeechInputButton extends Component<SpeechInputButtonProps, SpeechInputButtonState> {
  private recognition: any = null;
  private errorTimer: any = null;

  constructor(props: SpeechInputButtonProps) {
    super(props);
    this.state = {
      isListening: false,
      error: null,
      hasCrash: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasCrash: true };
  }

  componentDidMount() {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRecognitionAPI) {
      // Speech recognition not supported in environment
    }
  }

  componentDidCatch(error: any) {
    console.warn("SpeechInputButton caught internal error:", error);
    this.setState({ isListening: false, error: "Speech unavailable" });
  }

  componentWillUnmount() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Safe swallow
      }
    }
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
  }

  private startListening = () => {
    this.setState({ error: null });
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      this.setState({ error: "Speech recognition is not supported in this browser." });
      return;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognitionAPI();
      this.recognition = recognition;

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
      recognition.lang = langMap[this.props.lang] || 'en-IN';

      recognition.onstart = () => {
        this.setState({ isListening: true });
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
          this.props.onTranscript(combinedTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event?.error);
        let errorMsg = `Error: ${event?.error || 'Unknown'}`;
        if (event?.error === 'not-allowed') {
          errorMsg = "Microphone permission denied.";
        } else if (event?.error === 'no-speech') {
          errorMsg = "No sound detected.";
        }
        this.setState({ error: errorMsg, isListening: false });
        if (this.errorTimer) clearTimeout(this.errorTimer);
        this.errorTimer = setTimeout(() => {
          this.setState({ error: null });
        }, 2500);
      };

      recognition.onend = () => {
        this.setState({ isListening: false });
      };

      recognition.start();
    } catch (e: any) {
      console.error(e);
      this.setState({ error: "Failed to start listening.", isListening: false });
    }
  };

  private stopListening = () => {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.setState({ isListening: false });
  };

  private toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  };

  // Localized Speak Prompts
  private getMicTooltip = () => {
    const { lang } = this.props;
    const { isListening } = this.state;
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

  private getStatusText = () => {
    const { lang } = this.props;
    const { isListening } = this.state;
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

  render() {
    if (this.state.hasCrash) {
      return null;
    }
    const { className = "" } = this.props;
    const { isListening, error } = this.state;

    return (
      <div className={`relative flex items-center ${className}`}>
        {isListening && (
          <span className="mr-1.5 text-[10px] sm:text-[11px] font-semibold font-sans text-rose-500 animate-pulse hidden xs:inline uppercase tracking-wide">
            {this.getStatusText()}
          </span>
        )}
        
        <button
          type="button"
          id="voice-mic-trigger"
          onClick={this.toggleListening}
          title={this.getMicTooltip()}
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
}
