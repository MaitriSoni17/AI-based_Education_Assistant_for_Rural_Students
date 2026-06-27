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
let currentSpeechSession = 0;

export function stopSpeaking() {
  // Invalidate any active asynchronous speech sessions immediately
  currentSpeechSession++;

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
  
  for (const sentence of sentences) {
    if (!sentence) continue;
    
    if (sentence.length <= 130) {
      chunks.push(sentence.trim());
    } else {
      // If a single sentence is too long, split further by commas, semicolons, or spaces
      const subParts = sentence.split(/(?<=[,၊;])\s+/);
      let currentChunk = "";
      
      for (const part of subParts) {
        if (!part) continue;
        
        if (part.length <= 130) {
          if ((currentChunk + " " + part).length > 130) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = part;
          } else {
            currentChunk = currentChunk ? (currentChunk + " " + part) : part;
          }
        } else {
          // If a subpart is still too long, split by space words
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
          }
          
          const words = part.split(/\s+/);
          for (const word of words) {
            if (!word) continue;
            
            if ((currentChunk + " " + word).length > 130) {
              if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
              }
              
              if (word.length > 130) {
                // Squeeze extremely long single words/links
                let remaining = word;
                while (remaining.length > 120) {
                  chunks.push(remaining.slice(0, 120));
                  remaining = remaining.slice(120);
                }
                currentChunk = remaining;
              } else {
                currentChunk = word;
              }
            } else {
              currentChunk = currentChunk ? (currentChunk + " " + word) : word;
            }
          }
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }
  
  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Cleans markdown, formatting, code blocks, and emojis from response text
 * to make it highly readable and clean for TTS.
 */
export function cleanTextForTTS(text: string): string {
  if (!text) return "";

  let clean = text;

  // 1. Remove Markdown code blocks completely, as reading code is confusing to students
  clean = clean.replace(/```[\s\S]*?```/g, "");

  // 2. Remove inline code backticks
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // 3. Remove Markdown image links and standard links [text](url) -> text
  clean = clean.replace(/!\[([^\]]*)\]\([^\)]*\)/g, "");
  clean = clean.replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1");

  // 4. Remove Markdown headers (e.g. ### Title -> Title)
  clean = clean.replace(/^#+\s+/gm, "");

  // 5. Remove bold / italic symbols
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");
  clean = clean.replace(/__([^_]+)__/g, "$1");
  clean = clean.replace(/_([^_]+)_/g, "$1");

  // 6. Clean up bullet points or list markers
  clean = clean.replace(/^\s*[-*+]\s+/gm, "");
  clean = clean.replace(/^\s*\d+\.\s+/gm, "");

  // 7. Remove blockquotes symbols
  clean = clean.replace(/^\s*>\s+/gm, "");

  // 8. Remove common emojis as regional TTS engines might struggle or read them as garbage
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{2139}\u{25A1}\u{25A0}\u{25CF}\u{25CB}\u{2E80}-\u{2FDF}\u{3000}-\u{303F}\u{31C0}-\u{31EF}\u{3200}-\u{32FF}\u{3300}-\u{33FF}\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}\u{FE30}-\u{FE4F}]/gu, "");

  // 9. Remove any multiple consecutive newlines or spaces
  clean = clean.replace(/\n+/g, " ");
  clean = clean.replace(/\s+/g, " ");

  return clean.trim();
}

/**
 * Detects the dominant language script in the text to provide accurate voice synthesis.
 */
export function detectLanguageOfText(text: string, fallbackLang: LanguageCode): LanguageCode {
  if (!text) return fallbackLang;

  // 1. Check for Gujarati script
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return 'gu';
  }

  // 2. Check for Tamil script
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta';
  }

  // 3. Check for Telugu script
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'te';
  }

  // 4. Check for Devanagari script (Hindi, Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    // If text contains Marathi-specific character LLA (ळ)
    if (/[\u0933]/.test(text)) {
      return 'mr';
    }
    // If current fallback language is Marathi, keep it Marathi
    if (fallbackLang === 'mr') {
      return 'mr';
    }
    // Otherwise default Devanagari to Hindi
    return 'hi';
  }

  // 5. English word frequency detection:
  // If the text has no Indic script at all, but contains typical English vocabulary, classify as 'en'.
  // Otherwise, if it has no Indic script but contains mostly transliterated Indian language, or if we are not sure, we should fallback to fallbackLang!
  const hasIndic = /[\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F]/.test(text);
  if (!hasIndic && /[a-zA-Z]/.test(text)) {
    if (fallbackLang === 'en') {
      return 'en';
    }

    const lower = text.toLowerCase();
    // If fallbackLang is a regional language, only override to English if we are absolutely certain
    // by checking for multiple (at least 3) distinct English grammar functional words.
    const englishGrammarWords = ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'and', 'this', 'that', 'with', 'for', 'you', 'your', 'they', 'from', 'about'];
    let grammarWordCount = 0;
    for (const word of englishGrammarWords) {
      if (new RegExp(`\\b${word}\\b`).test(lower)) {
        grammarWordCount++;
      }
    }
    
    if (grammarWordCount >= 3) {
      return 'en';
    }
  }

  return fallbackLang;
}

export function speakText(
  text: string, 
  lang: LanguageCode, 
  avatarName?: string, 
  avatarChar?: string, 
  onEnd?: () => void
) {
  if (typeof window === 'undefined') return;

  // Clean the text to remove markdown code blocks, bold symbols, links, and emojis
  const cleanedText = cleanTextForTTS(text);
  if (!cleanedText) {
    if (onEnd) onEnd();
    return;
  }

  // Auto-detect voice language based on the original rich text characters
  const detectedLang = detectLanguageOfText(text, lang);

  // Always halt any current speaking sessions
  stopSpeaking();

  currentSpeechSession++;
  const session = currentSpeechSession;

  // If we are online and using a regional language, prioritize our secure high-quality first-party proxy TTS Audio API
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  if (isOnline && detectedLang !== 'en') {
    try {
      const chunks = splitTextIntoTTSChunks(cleanedText);
      if (chunks.length > 0) {
        currentAudioIndex = 0;
        activeAudioQueue = [];

        const playNext = async () => {
          if (currentSpeechSession !== session) return;

          if (currentAudioIndex >= chunks.length) {
            activeAudioQueue = [];
            currentAudioIndex = 0;
            if (onEnd) onEnd();
            return;
          }

          const chunk = chunks[currentAudioIndex];
          // Use our first-party secure /api/tts proxy route to totally bypass CORS and Referrer headers issues
          const url = `/api/tts?tl=${detectedLang}&q=${encodeURIComponent(chunk)}`;

          try {
            const audio = new Audio(url);
            activeAudioQueue.push(audio);

            audio.onended = () => {
              if (currentSpeechSession === session) {
                currentAudioIndex++;
                playNext();
              }
            };

            audio.onerror = (e) => {
              console.warn(`[Speech TTS Client] Proxy audio element failed for chunk: "${chunk}". Falling back to native speech synthesis.`);
              if (currentSpeechSession === session) {
                runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
              }
            };

            await audio.play();
          } catch (err) {
            console.warn(`[Speech TTS Client] Play failed for chunk: "${chunk}". Falling back to native system speech.`, err);
            if (currentSpeechSession === session) {
              runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
            }
          }
        };

        playNext();
        return; // Handled cleanly via first-party secure tts proxy
      }
    } catch (e) {
      console.warn("Google TTS proxy player initialization failed, falling back to Web Speech Synthesis.", e);
    }
  }

  // Otherwise, use native Web Speech Synthesis (offline fallback or Default English setup)
  runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
}

function runNativeSpeechFallback(
  text: string, 
  lang: LanguageCode, 
  avatarName: string | undefined, 
  avatarChar: string | undefined, 
  session: number,
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
      const vName = v.name.toLowerCase();
      
      const matchesLang = vLang === targetLangLower || vLang.startsWith(langLower);
      
      // Match by language name in the voice description (e.g. if voice name contains 'gujarati' etc)
      let matchesName = false;
      if (langLower === 'gu' && (vName.includes('gujarati') || vName.includes('guj'))) matchesName = true;
      if (langLower === 'mr' && (vName.includes('marathi') || vName.includes('mar'))) matchesName = true;
      if (langLower === 'ta' && (vName.includes('tamil') || vName.includes('tam'))) matchesName = true;
      if (langLower === 'te' && (vName.includes('telugu') || vName.includes('tel'))) matchesName = true;
      if (langLower === 'hi' && (vName.includes('hindi') || vName.includes('hin'))) matchesName = true;
      
      return matchesLang || matchesName;
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
            voiceNameLower.includes('pallavi') ||
            voiceNameLower.includes('kavya') ||
            voiceNameLower.includes('latha') ||
            voiceNameLower.includes('swara') ||
            voiceNameLower.includes('kavita') ||
            voiceNameLower.includes('nandini') ||
            voiceNameLower.includes('geetha') ||
            voiceNameLower.includes('vani') ||
            voiceNameLower.includes('hansa') ||
            voiceNameLower.includes('dhwani') ||
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
        if (currentSpeechSession !== session) return;
        if (hasFinished) return;
        
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 250) {
          // Speak fallback simulation for browser client failures
          const charCount = text.length;
          const durationMs = Math.max(3500, Math.min(18000, charCount * 85));
          
          console.warn(`Native speechSynthesis failed/ended prematurely in ${elapsedTime}ms (${reason}). Running visual speech simulator for ${durationMs}ms...`);
          
          activeFallbackTimeout = setTimeout(() => {
            if (currentSpeechSession !== session) return;
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
    if (currentSpeechSession === session && onEnd) onEnd();
  }
}
