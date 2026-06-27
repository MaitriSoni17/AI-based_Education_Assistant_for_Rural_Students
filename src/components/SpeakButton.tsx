import { useState, useEffect, MouseEvent } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { LanguageCode } from '../types';

interface SpeakButtonProps {
  text: string;
  lang: LanguageCode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SpeakButton({ text, lang, className = "", size = "sm" }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let checkSpeech: NodeJS.Timeout | null = null;
    if (isSpeaking) {
      checkSpeech = setInterval(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          if (!window.speechSynthesis.speaking) {
            setIsSpeaking(false);
          }
        } else {
          setIsSpeaking(false);
        }
      }, 500);
    }
    return () => {
      stopSpeaking();
      if (checkSpeech) {
        clearInterval(checkSpeech);
      }
    };
  }, [isSpeaking]);

  const handleSpeak = (e: MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, lang);
    }
  };

  const buttonSizeClass = size === 'sm' ? 'p-1 w-7 h-7' : size === 'md' ? 'p-2 w-10 h-10' : 'p-3 w-12 h-12';
  const iconSizeClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <button
      id={`speak-btn-${Math.floor(Math.random() * 100000)}`}
      onClick={handleSpeak}
      className={`inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all border border-emerald-200 cursor-pointer shadow-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none ${buttonSizeClass} ${className}`}
      title={isSpeaking ? "Stop Speaking" : "Listen aloud"}
    >
      {isSpeaking ? (
        <VolumeX className={`${iconSizeClass} text-rose-500 animate-pulse`} />
      ) : (
        <Volume2 className={`${iconSizeClass} hover:scale-110 active:scale-95 transition-transform`} />
      )}
    </button>
  );
}
