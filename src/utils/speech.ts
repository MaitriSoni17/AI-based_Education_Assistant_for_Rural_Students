import { LanguageCode } from '../types';

const LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

// Global handles to control overlapping audio/synthesize state cleanly
let activeAudioQueue: HTMLAudioElement[] = [];
let currentAudioIndex = 0;
let activeFallbackTimeout: NodeJS.Timeout | null = null;

export function stopSpeaking() {
  // Clear any simulated fallback timeouts
  if (activeFallbackTimeout) {
    clearTimeout(activeFallbackTimeout);
    activeFallbackTimeout = null;
  }

  // Cancel any active Web Speech API utterance
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Pause and clear any active Google Translate TTS Audio queues
  if (activeAudioQueue.length > 0) {
    activeAudioQueue.forEach(audio => {
      try {
        audio.pause();
        audio.src = ''; // Force garbage collection and close streams
      } catch (e) {
        // Safe catch for pause/stream shutdown
      }
    });
    activeAudioQueue = [];
  }
  currentAudioIndex = 0;
}

/**
 * Splits text into small chunks (< 150 characters) to ensure compatibility
 * with Google TTS translation query URL size constraints.
 */
function splitTextIntoTTSChunks(text: string): string[] {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return [];
  
  // Split on sentence delimiters (preserving punctuation as safe sentence splitters)
  const sentences = cleanText.split(/(?<=[.!?।|।\n])\s+/);
  
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (!sentence) continue;
    
    if (sentence.length > 150) {
      // If a single sentence is too long, split further by commas or separators
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      const subParts = sentence.split(/(?<=[,،;])\s+/);
      for (const part of subParts) {
        if ((currentChunk + " " + part).length > 150) {
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = part;
        } else {
          currentChunk = currentChunk ? (currentChunk + " " + part) : part;
        }
      }
    } else {
      if ((currentChunk + " " + sentence).length > 150) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? (currentChunk + " " + sentence) : sentence;
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export function speakText(
  text: string, 
  lang: LanguageCode, 
  avatarName?: string, 
  avatarChar?: string, 
  onEnd?: () => void
) {
  if (typeof window === 'undefined') return;

  // Always halt any current speaking sessions
  stopSpeaking();

  // If we are online and using a regional language, prioritize high-quality Google TTS Audio API
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  if (isOnline && lang !== 'en') {
    try {
      const chunks = splitTextIntoTTSChunks(text);
      if (chunks.length > 0) {
        currentAudioIndex = 0;
        
        // Map chunks to Google TTS links
        activeAudioQueue = chunks.map(chunk => {
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
          const audio = new Audio();
          audio.src = url;
          audio.preload = "auto";
          return audio;
        });

        const playNext = () => {
          if (currentAudioIndex >= activeAudioQueue.length) {
            activeAudioQueue = [];
            currentAudioIndex = 0;
            if (onEnd) onEnd();
            return;
          }

          const audio = activeAudioQueue[currentAudioIndex];
          
          audio.onended = () => {
            currentAudioIndex++;
            playNext();
          };

          audio.onerror = (e) => {
            console.warn(`Google TTS chunk failed/unsupported for ${lang}. Falling back to standard speech synthesis.`, e);
            runNativeSpeechFallback(text, lang, avatarName, avatarChar, onEnd);
          };

          audio.play().catch(err => {
            console.warn("Direct HTML5 audio play block/failed. Falling back to native system speech.", err);
            runNativeSpeechFallback(text, lang, avatarName, avatarChar, onEnd);
          });
        };

        playNext();
        return; // Success, handled cleanly via chunked translation audio queue
      }
    } catch (e) {
      console.warn("Google TTS player initialization failed, falling back to Web Speech Synthesis.", e);
    }
  }

  // Otherwise, use native Web Speech Synthesis (offline fallback or Default English setup)
  runNativeSpeechFallback(text, lang, avatarName, avatarChar, onEnd);
}

function runNativeSpeechFallback(
  text: string, 
  lang: LanguageCode, 
  avatarName?: string, 
  avatarChar?: string, 
  onEnd?: () => void
) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Make sure to clean any previous fallback timeouts before registering new ones
  if (activeFallbackTimeout) {
    clearTimeout(activeFallbackTimeout);
    activeFallbackTimeout = null;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = LANG_MAP[lang] || 'en-IN';
    
    // Resolve gender, pitch, and rate based on speaking character features
    let gender: 'male' | 'female' | 'neutral' = 'neutral';
    let pitch = 1.05;
    let rate = 0.85;

    if (avatarName || avatarChar) {
      const charStr = (avatarChar || '').toLowerCase();
      const nameLower = (avatarName || '').toLowerCase();

      if (charStr.includes('👵') || nameLower.includes('dadi') || nameLower.includes('दादी') || nameLower.includes('દાદી')) {
        gender = 'female';
        rate = 0.82;   // Gentle dadi storyteller
        pitch = 1.05;
      } else if (charStr.includes('🦊') || nameLower.includes('chanda') || nameLower.includes('चंदा')) {
        gender = 'female';
        rate = 0.92;   // Enthusiastic smart fox
        pitch = 1.24;
      } else if (charStr.includes('🤖') || nameLower.includes('swami') || nameLower.includes('स्वामी') || nameLower.includes('સ્વામી')) {
        gender = 'male';
        rate = 0.88;   // Logical roboteacher
        pitch = 0.90;
      } else {
        gender = 'female';
        rate = 0.85;
        pitch = 1.08;
      }
    }

    utterance.lang = targetLang;
    utterance.rate = rate; 
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const targetLangLower = targetLang.toLowerCase().replace('_', '-');
    const langLower = lang.toLowerCase();

    // Subset voices matching the requested target language specifier
    let eligibleVoices = voices.filter(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang === targetLangLower || vLang.startsWith(langLower);
    });

    if (eligibleVoices.length === 0) {
      eligibleVoices = voices;
    }

    let matchedVoice: SpeechSynthesisVoice | undefined;

    if (gender !== 'neutral') {
      matchedVoice = eligibleVoices.find(v => {
        const voiceNameLower = v.name.toLowerCase();
        if (gender === 'female') {
          return (
            voiceNameLower.includes('female') ||
            voiceNameLower.includes('zira') ||
            voiceNameLower.includes('heera') ||
            voiceNameLower.includes('kiran') ||
            voiceNameLower.includes('sangeeta') ||
            voiceNameLower.includes('samantha') ||
            voiceNameLower.includes('veena') ||
            voiceNameLower.includes('priya') ||
            voiceNameLower.includes('neerja') ||
            voiceNameLower.includes('kalpana') ||
            voiceNameLower.includes('ananya') ||
            voiceNameLower.includes('shruthi') ||
            voiceNameLower.includes('noora') ||
            voiceNameLower.includes('lekha') ||
            voiceNameLower.includes('vaishali') ||
            voiceNameLower.includes('geeta') ||
            (voiceNameLower.includes('google') && !voiceNameLower.includes('male'))
          );
        } else {
          return (
            voiceNameLower.includes('male') ||
            voiceNameLower.includes('david') ||
            voiceNameLower.includes('ravi') ||
            voiceNameLower.includes('harsh') ||
            voiceNameLower.includes('george') ||
            voiceNameLower.includes('mark') ||
            voiceNameLower.includes('daniel') ||
            voiceNameLower.includes('prakash') ||
            voiceNameLower.includes('shlok')
          );
        }
      });
    }

    if (!matchedVoice) {
      matchedVoice = eligibleVoices.find(v => v.lang.toLowerCase().replace('_', '-') === targetLangLower) || eligibleVoices[0];
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    const startTime = Date.now();
    let hasFinished = false;

    if (onEnd) {
      const handleEnd = (reason: string) => {
        if (hasFinished) return;
        
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 250) {
          // Speak fallback simulation for browser client failures
          const charCount = text.length;
          const durationMs = Math.max(3500, Math.min(18000, charCount * 85));
          
          console.warn(`Native speechSynthesis failed/ended prematurely in ${elapsedTime}ms (${reason}). Running visual speech simulator for ${durationMs}ms...`);
          
          activeFallbackTimeout = setTimeout(() => {
            hasFinished = true;
            onEnd();
          }, durationMs);
        } else {
          hasFinished = true;
          onEnd();
        }
      };

      utterance.onend = () => {
        handleEnd('onend');
      };
      utterance.onerror = () => {
        handleEnd('onerror');
      };
    }

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Text-to-Speech Native Error:', error);
    if (onEnd) onEnd();
  }
}
