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

/**
 * Checks whether speech output is currently active across both Web Speech API
 * and audio stream proxy playback.
 */
export function isSpeakingNow(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
    return true;
  }
  if (activeAudioQueue.length > 0 && activeAudioQueue.some(a => !a.paused && !a.ended)) {
    return true;
  }
  return false;
}

export function getSavedSpeechRate(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const saved = localStorage.getItem('speech_rate_multiplier');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        return parsed;
      }
    }
  } catch (e) {
    // safe fallback
  }
  return 1;
}

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
export function splitTextIntoTTSChunks(text: string): string[] {
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
 * Cleans markdown, formatting, code blocks, math equations, and emojis
 * to create soft, warm, natural, and clear speech output tailored for children.
 */
export function cleanTextForTTS(text: string): string {
  if (!text) return "";

  let clean = text;

  // 1. Remove Markdown code blocks completely, as reading code is confusing to students
  clean = clean.replace(/```[\s\S]*?```/g, " ");

  // 2. Remove inline code backticks
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // 3. Remove Markdown image links and standard links [text](url) -> text
  clean = clean.replace(/!\[([^\]]*)\]\([^\)]*\)/g, " ");
  clean = clean.replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1");

  // 4. Remove Markdown headers (e.g. ### Title -> Title)
  clean = clean.replace(/^#+\s+/gm, " ");

  // 5. Expand mathematical and scientific LaTeX formulas into warm, easy-to-understand spoken words
  // Fractions: \frac{a}{b} -> "a divided by b"
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 divided by $2");
  // Roots: \sqrt[n]{x} or \sqrt{x}
  clean = clean.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "the $1 root of $2");
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, "square root of $1");
  // Powers: x^{2} or x^2 -> "x squared", x^{3} or x^3 -> "x cubed", x^{n} -> "x to the power n"
  clean = clean.replace(/([a-zA-Z0-9]+)\^\{?2\}?/g, "$1 squared");
  clean = clean.replace(/([a-zA-Z0-9]+)\^\{?3\}?/g, "$1 cubed");
  clean = clean.replace(/([a-zA-Z0-9]+)\^\{?([a-zA-Z0-9]+)\}?/g, "$1 to the power $2");
  // LaTeX symbols to friendly spoken words
  clean = clean.replace(/\\times/g, " times ");
  clean = clean.replace(/\\cdot/g, " times ");
  clean = clean.replace(/\\div/g, " divided by ");
  clean = clean.replace(/\\pm/g, " plus or minus ");
  clean = clean.replace(/\\approx/g, " approximately equals ");
  clean = clean.replace(/\\neq/g, " does not equal ");
  clean = clean.replace(/\\le(q)?/g, " is less than or equal to ");
  clean = clean.replace(/\\ge(q)?/g, " is greater than or equal to ");
  clean = clean.replace(/\\pi/g, " pi ");
  clean = clean.replace(/\\theta/g, " theta ");
  clean = clean.replace(/\\degree/g, " degrees ");
  clean = clean.replace(/\\Delta/g, " change in ");
  clean = clean.replace(/\\text\{([^}]+)\}/g, "$1");
  clean = clean.replace(/\\mathbf\{([^}]+)\}/g, "$1");
  clean = clean.replace(/\\mathit\{([^}]+)\}/g, "$1");
  clean = clean.replace(/\\mathrm\{([^}]+)\}/g, "$1");
  // Strip remaining LaTeX backslash commands
  clean = clean.replace(/\\[a-zA-Z]+/g, " ");

  // Chemical formulas to speech
  clean = clean.replace(/\bH2O\b/gi, "H 2 O");
  clean = clean.replace(/\bCO2\b/gi, "C O 2");
  clean = clean.replace(/\bO2\b/gi, "O 2");

  // Remove math dollar delimiters
  clean = clean.replace(/\${1,2}/g, " ");

  // 6. Remove bold / italic symbols
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");
  clean = clean.replace(/__([^_]+)__/g, "$1");
  clean = clean.replace(/_([^_]+)_/g, "$1");

  // 7. Clean up bullet points or list markers to smooth pauses with commas/periods
  clean = clean.replace(/^\s*[-*+]\s+/gm, ", ");
  clean = clean.replace(/^\s*\d+\.\s+/gm, ", ");

  // 8. Remove blockquotes symbols and divider lines
  clean = clean.replace(/^\s*>\s+/gm, " ");
  clean = clean.replace(/[-=_]{3,}/g, " ");
  clean = clean.replace(/\|/g, " ");

  // 9. Natural spoken expansions of common abbreviations
  clean = clean.replace(/\be\.g\.,?\s*/gi, "for example, ");
  clean = clean.replace(/\bi\.e\.,?\s*/gi, "that is, ");
  clean = clean.replace(/\betc\./gi, "and so on.");
  clean = clean.replace(/\bvs\./gi, "versus ");
  clean = clean.replace(/\bapprox\./gi, "approximately ");

  // 10. Remove common emojis as regional TTS engines might struggle or read them as code points
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{2139}\u{25A1}\u{25A0}\u{25CF}\u{25CB}\u{2E80}-\u{2FDF}\u{3000}-\u{303F}\u{31C0}-\u{31EF}\u{3200}-\u{32FF}\u{3300}-\u{33FF}\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}\u{F900}-\u{FAFF}\u{FE30}-\u{FE4F}]/gu, "");

  // 11. Handle dynamic expression markers in brackets [ ]
  // (e.g. [whispers], [whispers softly], [giggles], [sighs happily], [excitedly], [softly], [gently], [gasp])
  // Convert them into a gentle natural pause with ellipses (...) so speech synthesizers don't say the word "bracket",
  // creating suspense or calm naturally.
  clean = clean.replace(/\[\s*(?:whispers|whispers softly|softly|gently|giggles|giggle|sighs happily|sighs|excitedly|gasp|laughs|laugh|cheerful|playfully|happily)\s*\]/gi, "... ");
  // Clean any remaining bracketed vocal emotion instructions
  clean = clean.replace(/\[[a-zA-Z\s,]+\]/g, "... ");

  // 12. Normalize excessive question or exclamation marks
  clean = clean.replace(/\?{2,}/g, "?");
  clean = clean.replace(/!{2,}/g, "!");
  clean = clean.replace(/\.{3,}/g, "...");

  // 13. Remove any multiple consecutive newlines or spaces
  clean = clean.replace(/\n+/g, " ");
  clean = clean.replace(/\s+/g, " ");

  return clean.trim();
}

/**
 * Detects whether the text context is Bedtime / Calming or Active Play,
 * and determines the recommended Gemini voice:
 * - Despina: Bedtime & Calming (soft, gentle, slower cadence)
 * - Puck / Zephyr: Active Play & Adventure (playful, energetic, high-energy)
 */
export function detectStoryVoiceMode(text: string, avatarName?: string, avatarChar?: string): { 
  mode: 'bedtime' | 'play'; 
  voiceName: 'Aoede' | 'Despina' | 'Puck' | 'Zephyr';
} {
  let preferredVoice = '';
  if (typeof window !== 'undefined') {
    try {
      preferredVoice = localStorage.getItem('gemini_preferred_voice') || '';
    } catch (e) {}
  }

  const lower = (text || '').toLowerCase();
  const avatarLower = `${avatarName || ''} ${avatarChar || ''}`.toLowerCase();

  const hasBedtimeClues = 
    lower.includes('[whispers') || 
    lower.includes('[softly') || 
    lower.includes('[gently') || 
    lower.includes('[sighs') ||
    lower.includes('bedtime') ||
    lower.includes('sleep') ||
    lower.includes('lullaby') ||
    lower.includes('stars') ||
    lower.includes('calm') ||
    lower.includes('sweet dreams') ||
    lower.includes('goodnight') ||
    avatarLower.includes('dadi') ||
    avatarLower.includes('दादी');

  const mode: 'bedtime' | 'play' = hasBedtimeClues ? 'bedtime' : 'play';

  let voiceName: 'Aoede' | 'Despina' | 'Puck' | 'Zephyr' = mode === 'bedtime' ? 'Despina' : 'Aoede';

  if (preferredVoice === 'Aoede' || preferredVoice === 'Despina' || preferredVoice === 'Puck' || preferredVoice === 'Zephyr') {
    voiceName = preferredVoice as any;
  } else if (!hasBedtimeClues) {
    if (avatarLower.includes('swami') || avatarLower.includes('robot')) {
      voiceName = 'Aoede'; // Sweet, cheerful, warm child companion
    } else if (avatarLower.includes('chanda') || avatarLower.includes('fox')) {
      voiceName = 'Puck'; // Playful, joyful trick-solving fox
    } else {
      voiceName = 'Aoede'; // Default to sweetest child-friendly voice
    }
  }

  return { mode, voiceName };
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

// IN-MEMORY CLIENT COOLDOWN FOR GEMINI TTS (1 minute cooldown when quota is exhausted)
let geminiClientCooldownUntil = 0;

/**
 * Splits text into larger sentence-aligned chunks (up to 400 chars) for Gemini TTS.
 * This avoids exhausting the free-tier 3 RPM quota by avoiding unnecessary micro-chunks.
 */
export function splitTextIntoGeminiChunks(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= 400) return [clean];

  // Split on natural sentence delimiters
  const sentences = clean.split(/(?<=[.!?\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!s) continue;
    if ((current + ' ' + s).length <= 400) {
      current = current ? (current + ' ' + s) : s;
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = s;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [clean.slice(0, 400)];
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
  const { mode: storyMode, voiceName: storyVoice } = detectStoryVoiceMode(text, avatarName, avatarChar);

  // Always halt any current speaking sessions
  stopSpeaking();

  currentSpeechSession++;
  const session = currentSpeechSession;

  // If we are online, check whether to use Gemini TTS or Regional TTS Proxy
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  if (isOnline) {
    try {
      const isEnglish = detectedLang === 'en';
      const isGeminiCoolingDown = Date.now() < geminiClientCooldownUntil;
      const shouldUseGeminiTts = isEnglish && !isGeminiCoolingDown;

      // For Gemini TTS, use smart sentence chunking (up to 400 chars per request) to prevent quota issues;
      // For regional translate TTS, use splitTextIntoTTSChunks (130 char limit per query).
      const chunks = shouldUseGeminiTts
        ? splitTextIntoGeminiChunks(cleanedText)
        : splitTextIntoTTSChunks(cleanedText);

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
          // Determine best audio URL:
          // If English and cooldown is clear, use Gemini High-Definition TTS Stream (/api/gemini/tts-stream)
          // Otherwise, use regional /api/tts proxy for authentic native Indian regional pronunciation
          let url = `/api/tts?tl=${detectedLang}&q=${encodeURIComponent(chunk)}`;
          if (shouldUseGeminiTts) {
            url = `/api/gemini/tts-stream?q=${encodeURIComponent(chunk)}&voice=${storyVoice}&mode=${storyMode}`;
          }

          try {
            const userRate = getSavedSpeechRate();
            const audio = new Audio(url);
            // Calibrate playback speed: bedtime stories slower (~0.84x), active play (~0.92x)
            const baseCadence = storyMode === 'bedtime' ? 0.84 : 0.92;
            audio.playbackRate = Math.max(0.70, Math.min(1.4, baseCadence * userRate));
            activeAudioQueue.push(audio);

            audio.onended = () => {
              if (currentSpeechSession === session) {
                currentAudioIndex++;
                playNext();
              }
            };

            audio.onerror = () => {
              // If Gemini stream fails or returns non-200, engage cooldown and try regional proxy or native fallback
              if (url.includes('/api/gemini/')) {
                geminiClientCooldownUntil = Date.now() + 65000;
                const regionalUrl = `/api/tts?tl=${detectedLang}&q=${encodeURIComponent(chunk)}`;
                const fallbackAudio = new Audio(regionalUrl);
                fallbackAudio.playbackRate = Math.max(0.75, Math.min(1.4, 0.90 * userRate));
                fallbackAudio.onended = () => {
                  if (currentSpeechSession === session) {
                    currentAudioIndex++;
                    playNext();
                  }
                };
                fallbackAudio.onerror = () => {
                  if (currentSpeechSession === session) {
                    runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
                  }
                };
                fallbackAudio.play().catch(() => {
                  if (currentSpeechSession === session) {
                    runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
                  }
                });
                return;
              }

              if (currentSpeechSession === session) {
                runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
              }
            };

            await audio.play();
          } catch {
            if (currentSpeechSession === session) {
              runNativeSpeechFallback(cleanedText, detectedLang, avatarName, avatarChar, session, onEnd);
            }
          }
        };

        playNext();
        return; // Handled cleanly via audio stream
      }
    } catch {
      // Fallback gracefully
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
    
    // Voice selection and cadence adaptation for sweet, encouraging kid experience:
    // Bedtime/calming: Despina profile -> slower cadence (rate ~0.80), soft loving gentle pitch (~1.08)
    // Active play/adventure: Aoede / Puck / Zephyr profile -> sweet, friendly cadence (rate ~0.88), bright playful sweet pitch (~1.16)
    const { mode: storyMode, voiceName: storyVoice } = detectStoryVoiceMode(text, avatarName, avatarChar);

    let pitch = 1.16; // Sweet, cheerful, warm, kid-friendly pitch
    let rate = 0.88; // Clear, gentle, encouraging cadence that kids easily comprehend

    if (storyMode === 'bedtime' || storyVoice === 'Despina') {
      rate = 0.80; // Slower, soothing, gentle cadence for bedtime
      pitch = 1.08; // Soft, warm, loving pitch
    } else {
      rate = 0.88; // Sweet, clear, encouraging cadence for daily learning
      pitch = 1.16; // Bright, joyful, encouraging pitch
    }

    if (avatarName || avatarChar) {
      const charStr = (avatarChar || '').toLowerCase();
      const nameLower = (avatarName || '').toLowerCase();

      if (charStr.includes('👵') || nameLower.includes('dadi') || nameLower.includes('दादी') || nameLower.includes('દાદી')) {
        // Dadi Amma: gentle, sweet, affectionate grandmother storyteller
        rate = 0.80;
        pitch = 1.08;
      } else if (charStr.includes('🦊') || nameLower.includes('chanda') || nameLower.includes('चंदा')) {
        // Chanda Fox: lively, playful, energetic, encouraging math buddy (Puck style)
        rate = 0.90;
        pitch = 1.20;
      } else if (charStr.includes('🦉') || nameLower.includes('aryabhata') || nameLower.includes('आर्यभट')) {
        // Aryabhata AI: wise, kind, gentle, patient and sweet teacher
        rate = 0.86;
        pitch = 1.12;
      } else if (charStr.includes('🤖') || nameLower.includes('swami') || nameLower.includes('स्वामी') || nameLower.includes('સ્વામી')) {
        // Swami AI: wonderfully sweet, enthusiastic, warm, encouraging mascot companion
        rate = 0.88;
        pitch = 1.16;
      }
    }

    const userRate = getSavedSpeechRate();
    utterance.lang = targetLang;
    utterance.rate = Math.max(0.5, Math.min(2.0, rate * userRate)); 
    utterance.pitch = pitch;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetLangLower = targetLang.toLowerCase().replace('_', '-');
    const langLower = lang.toLowerCase();

    // Voice scoring algorithm: selects the highest-fidelity, sweetest, warmest, most natural voice
    // Actively avoids robotic, cold, flat, or harsh voices
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const vName = v.name.toLowerCase();

      // Language match scoring
      if (vLang === targetLangLower) score += 150;
      else if (vLang.startsWith(langLower)) score += 110;
      else if (langLower === 'en' && vLang.startsWith('en')) score += 80;
      else if (vLang.includes('-in')) score += 70;

      // Regional language keyword match in voice name
      if (langLower === 'hi' && (vName.includes('hindi') || vName.includes('हिन्दी') || vName.includes('swara') || vName.includes('madhur'))) score += 80;
      if (langLower === 'gu' && (vName.includes('gujarati') || vName.includes('guj') || vName.includes('dhwani') || vName.includes('niranjan'))) score += 80;
      if (langLower === 'mr' && (vName.includes('marathi') || vName.includes('mar') || vName.includes('aarohi') || vName.includes('manohar'))) score += 80;
      if (langLower === 'ta' && (vName.includes('tamil') || vName.includes('tam') || vName.includes('pallavi') || vName.includes('valluvar'))) score += 80;
      if (langLower === 'te' && (vName.includes('telugu') || vName.includes('tel') || vName.includes('shruti') || vName.includes('mohan'))) score += 80;

      // Modern neural, natural, online high-definition expressive voices
      if (vName.includes('natural')) score += 70;
      if (vName.includes('neural')) score += 65;
      if (vName.includes('online')) score += 50;
      if (vName.includes('google')) score += 45;

      // Warm, expressive, sweet, gentle female & kid-friendly voices preferred across platforms
      const sweetFriendlyVoices = [
        'samantha', 'victoria', 'karen', 'serena', 'neerja', 'sangeeta', 'veena',
        'swara', 'priya', 'aria', 'jenny', 'sonia', 'heera', 'kiran', 'ananya',
        'kalpana', 'vaishali', 'geeta', 'pallavi', 'kavya', 'latha', 'vani',
        'hansa', 'dhwani', 'shruthi', 'shruti', 'zira', 'tessa', 'fiona', 'moira',
        'madhur', 'prabhat', 'aarohi', 'valluvar', 'mohan'
      ];
      if (sweetFriendlyVoices.some(name => vName.includes(name))) {
        score += 50;
      }

      // Friendly male voices
      const friendlyMaleVoices = ['daniel', 'oliver', 'rishi', 'shlok', 'prakash', 'niranjan', 'manohar'];
      if (friendlyMaleVoices.some(name => vName.includes(name))) {
        score += 30;
      }

      // Heavily penalize cold, monotone, harsh, or robotic legacy desktop voices
      if (vName.includes('david') || vName.includes('espeak') || vName.includes('desktop') || vName.includes('robotic') || vName.includes('mark') || vName.includes('george')) {
        score -= 90;
      }

      return score;
    };

    let matchedVoice: SpeechSynthesisVoice | undefined;
    if (voices.length > 0) {
      const sortedVoices = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
      matchedVoice = sortedVoices[0];
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

/**
 * Checks whether the user's browser/device currently has a native TTS voice installed
 * for the requested language code, or whether it relies on the /api/tts cloud service.
 */
export function checkVoiceAvailability(lang: LanguageCode): {
  hasNativeVoice: boolean;
  matchingVoicesCount: number;
  engine: 'cloud-regional' | 'device-native';
  voiceNames: string[];
} {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return {
      hasNativeVoice: false,
      matchingVoicesCount: 0,
      engine: 'cloud-regional',
      voiceNames: []
    };
  }

  const voices = window.speechSynthesis.getVoices();
  const targetLangLower = (LANG_MAP[lang] || 'en-IN').toLowerCase().replace('_', '-');
  const langLower = lang.toLowerCase();

  const matching = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    const vName = v.name.toLowerCase();
    const matchesLang = vLang === targetLangLower || vLang.startsWith(langLower);
    let matchesName = false;
    if (langLower === 'gu' && (vName.includes('gujarati') || vName.includes('guj'))) matchesName = true;
    if (langLower === 'mr' && (vName.includes('marathi') || vName.includes('mar'))) matchesName = true;
    if (langLower === 'ta' && (vName.includes('tamil') || vName.includes('tam'))) matchesName = true;
    if (langLower === 'te' && (vName.includes('telugu') || vName.includes('tel'))) matchesName = true;
    if (langLower === 'hi' && (vName.includes('hindi') || vName.includes('hin'))) matchesName = true;
    return matchesLang || matchesName;
  });

  return {
    hasNativeVoice: matching.length > 0,
    matchingVoicesCount: matching.length,
    engine: matching.length > 0 ? 'device-native' : 'cloud-regional',
    voiceNames: matching.map(v => v.name)
  };
}

