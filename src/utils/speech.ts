import { LanguageCode } from '../types';

const LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

export function speakText(text: string, lang: LanguageCode) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Cancel any current speaking session
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = LANG_MAP[lang] || 'en-IN';
    
    // Configure voice properties optimized for rural children learning
    utterance.lang = targetLang;
    utterance.rate = 0.85; // Slightly slower pace for optimal comprehension
    utterance.pitch = 1.05; // Enthusiastic, warm digital voice tone

    // Attempt to locate a high-quality regional voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => 
      v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(lang.toLowerCase())
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Text-to-Speech Error:', error);
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
