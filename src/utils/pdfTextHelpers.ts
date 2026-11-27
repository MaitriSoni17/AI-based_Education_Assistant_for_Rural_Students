/**
 * Utilities for extracting, cleaning, and validating Unicode text from PDFs,
 * with first-class support for Gujarati (ગુજરાતી), Devanagari (Hindi/Marathi),
 * other Indic scripts, and legacy/scanned PDF detection.
 */

export interface PdfTextQualityAssessment {
  isReadable: boolean;
  needsOcr: boolean;
  reason: 'ok' | 'empty' | 'pua_or_replacement' | 'garbled_legacy_font';
  indicCharCount: number;
}

const GUJARATI_CHAR_RE = /[\u0A80-\u0AFF]/g;
const DEVANAGARI_CHAR_RE = /[\u0900-\u097F]/g;
const OTHER_INDIC_CHAR_RE = /[\u0980-\u09FF\u0A00-\u0A7F\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g;

// Combining marks / vowel signs (matras, anusvara, visarga, virama/halant, nukta) that must attach without a preceding space
const LEADING_INDIC_COMBINING_RE = /^[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963\u0A81-\u0A83\u0ABC\u0ABE-\u0ACD\u0AE2\u0AE3\u0981-\u0983\u09BC\u09BE-\u09CD\u0A01-\u0A03\u0A3C\u0A3E-\u0A4D\u0B82\u0BBE-\u0BCD\u0C00-\u0C04\u0C3E-\u0C4D\u0C81-\u0C83\u0CBE-\u0CCD\u0D00-\u0D03\u0D3E-\u0D4D]/;
const TRAILING_HALANT_RE = /[\u094D\u0ACD\u09CD\u0A4D\u0BCD\u0C4D\u0CCD\u0D4D]$/;

let measureCanvasCtx: CanvasRenderingContext2D | null = null;

export function measurePdfTextWidth(text: string, font: string): number {
  if (typeof document === 'undefined' || !text) return 0;
  try {
    if (!measureCanvasCtx) {
      const canvas = document.createElement('canvas');
      measureCanvasCtx = canvas.getContext('2d');
    }
    if (!measureCanvasCtx) return 0;
    measureCanvasCtx.font = font;
    return measureCanvasCtx.measureText(text).width;
  } catch {
    return 0;
  }
}

/**
 * Reconstructs readable text from PDF.js `page.getTextContent().items` using glyph geometry.
 * Avoids the bug of `.join(' ')`, which splits Gujarati/Indic words into disconnected syllables/matras.
 */
export function extractReadableTextFromPdfItems(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return '';

  let result = '';
  let hasPrev = false;
  let prevEndX = 0;
  let prevY = 0;
  let prevFontHeight = 12;
  let prevHasEOL = false;
  let prevStr = '';

  for (const item of items) {
    if (!item) continue;
    const str: string = typeof item.str === 'string' ? item.str : '';
    const tx = Array.isArray(item.transform) ? item.transform : null;
    const x: number = tx ? Number(tx[4]) || 0 : 0;
    const y: number = tx ? Number(tx[5]) || 0 : 0;
    const fontHeight: number = tx
      ? Math.max(6, Math.hypot(Number(tx[2]) || 0, Number(tx[3]) || 0) || Math.hypot(Number(tx[0]) || 0, Number(tx[1]) || 0) || 12)
      : 12;
    const width: number = typeof item.width === 'number' && !Number.isNaN(item.width) ? item.width : 0;

    if (!str) {
      if (item.hasEOL && hasPrev && !result.endsWith('\n')) {
        result += '\n';
        prevHasEOL = true;
      }
      continue;
    }

    if (hasPrev) {
      const yDiff = Math.abs(y - prevY);
      const lineThreshold = Math.max(fontHeight, prevFontHeight) * 0.45;
      const isNewLine = prevHasEOL || (tx !== null && yDiff > lineThreshold);

      if (isNewLine) {
        if (!result.endsWith('\n')) {
          result += '\n';
        }
      } else {
        const gap = x - prevEndX;
        const spaceThreshold = Math.max(fontHeight, prevFontHeight) * 0.16;
        const startsWithCombining = LEADING_INDIC_COMBINING_RE.test(str);
        const prevEndsHalant = TRAILING_HALANT_RE.test(prevStr);
        const alreadySpaced = /\s$/.test(prevStr) || /^\s/.test(str);

        if (!alreadySpaced && !startsWithCombining && !prevEndsHalant && gap > spaceThreshold) {
          result += ' ';
        }
      }
    }

    result += str;
    hasPrev = true;
    prevEndX = x + width;
    prevY = y;
    prevFontHeight = fontHeight;
    prevHasEOL = Boolean(item.hasEOL);
    prevStr = str;
  }

  return result.trim();
}

/**
 * Cleans and normalizes PDF-extracted Unicode text.
 * Supports Gujarati Unicode normalization (matra reordering, spaced combining marks)
 * and Hindi/NCERT KrutiDev/Devanagari cleanup without mangling Gujarati or English text.
 */
export function cleanPdfExtractedText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let str = rawText.replace(/\r\n/g, '\n').trim();
  if (!str) return '';

  const gujaratiCount = (str.match(GUJARATI_CHAR_RE) || []).length;
  const devanagariCount = (str.match(DEVANAGARI_CHAR_RE) || []).length;
  const otherIndicCount = (str.match(OTHER_INDIC_CHAR_RE) || []).length;

  // 1. Gujarati Unicode PDF cleanup
  if (gujaratiCount > 0) {
    // Fix visual-order Gujarati short-i matra (\u0ABF 'િ') appearing BEFORE consonant/conjunct (run before space reattachment so word boundaries stay intact)
    str = str.replace(
      /(^|[^\u0A95-\u0AB9\u0ABC\u0ACD])\u0ABF([\u0A95-\u0AB9](?:\u0ABC)?(?:\u0ACD[\u0A95-\u0AB9](?:\u0ABC)?)*)(?![\u0ACD\u0ABE-\u0ACC])/g,
      '$1$2\u0ABF'
    );
    str = str.replace(/\u0ABF{2,}/g, '\u0ABF');

    // Reattach accidentally spaced Gujarati combining marks / matras / nukta / halant
    str = str.replace(
      /([\u0A85-\u0AB9\u0ABC-\u0ACD\u0AE0-\u0AE3])\s+([\u0A81-\u0A83\u0ABC\u0ABE-\u0ACD\u0AE2\u0AE3])/g,
      '$1$2'
    );
    str = str.replace(/(\u0ACD)\s+([\u0A95-\u0AB9])/g, '$1$2');
  }

  // 2. Hindi / KrutiDev 010 / NCERT Devanagari cleanup (ONLY when text is Devanagari or KrutiDev)
  if (gujaratiCount === 0 && otherIndicCount === 0) {
    if (devanagariCount < str.length * 0.25) {
      const isKrutiDev = /([iN]yh|d\{kk|esa\]|gsa|osQ|osq|fdl|idkj|la\[;k|ls\[kk|js\[kk|nsf\[k|vki|vkSj|fujwfir|vkd`fr|pqosQ|pudh)/.test(str);
      if (isKrutiDev) {
        const ligatures: [string, string][] = [
          ['d{kkvsa', 'कक्षाओं'],
          ['d{kkvks', 'कक्षाओं'],
          ['d{kk', 'कक्षा'],
          ['la[;k', 'संख्या'],
          ['ls[kk', 'संख्या'],
          ['js[kk', 'रेखा'],
          ['nsf[k,', 'देखिए'],
          ['nsf[k', 'देखि'],
          ['fujwfir', 'निरूपित'],
          ['fujwfi', 'निरूपि'],
          ['idkj', 'प्रकार'],
          ['fdl', 'किस'],
          ['vki', 'आप'],
          ['vkj', 'और'],
          ['vkSj', 'और'],
          ['ogka', 'वहाँ'],
          ['osq', 'के'],
          ['osQ', 'के'],
          ['esa]', 'में,'],
          ['esa', 'में'],
          ['gsa', 'हैं'],
          ['gS', 'है'],
          ['vkd`fr', 'आकृति'],
          ['ij', 'पर'],
          ['iNyh', 'पिछली'],
          ['iNys', 'पिछले'],
          ['iNyk', 'पिछला'],
          ['pqosQ', 'चुके'],
          ['pudh', 'चुकी'],
          ['pqdk', 'चुका'],
          [';g', 'यह'],
          ['Hkh', 'भी'],
          ['rFkk', 'तथा'],
          [',oa', 'एवं'],
        ];
        for (const [kruti, uni] of ligatures) {
          str = str.split(kruti).join(uni);
        }
        const charMap: [string, string][] = [
          ['k', 'ा'], ['h', 'ी'], ['q', 'ु'], ['w', 'ू'], ['s', 'े'], ['S', 'ै'], ['a', 'ं'], ['A', 'ॉ'],
          ['f', 'ि'], ['i', 'ि'],
          ['v', 'अ'], ['o', 'इ'], ['u', 'उ'], ['U', 'ऊ'], ['c', 'ब'], ['C', 'ण'], ['d', 'क'], ['D', 'क्'],
          ['e', 'म'], ['E', 'म्'], ['g', 'ह'], ['G', 'ह्'], ['j', 'र'], ['J', 'र्'], ['l', 'स'], ['L', 'स्'],
          ['m', 'स'], ['n', 'द'], ['N', 'छ'], ['p', 'च'], ['P', 'च्'], ['r', 'त'], ['R', 'त्'],
          ['t', 'त'], ['T', 'त्'], ['y', 'ल'], ['Y', 'ल्'], ['b', 'इ'], ['B', 'ई'],
          ['x', 'ग'], ['X', 'ग्'], ['z', '्र'], ['Z', 'र्'], ['[', 'ख'], ['{', 'क्ष'], [']', ','],
          ['}', 'द्व'], ['|', '।']
        ];
        for (const [k, u] of charMap) {
          str = str.split(k).join(u);
        }
      }
    }

    const updatedDevanagariCount = (str.match(DEVANAGARI_CHAR_RE) || []).length;
    if (updatedDevanagariCount > 0) {
      str = str.replace(/\bिफरारंभ/g, 'प्रारंभ');
      str = str.replace(/\bिफारंभ/g, 'प्रारंभ');
      str = str.replace(/\bिफथम/g, 'प्रथम');
      str = str.replace(/\bिफयोग/g, 'प्रयोग');
      str = str.replace(/\bिफकार/g, 'प्रकार');
      str = str.replace(/\bिफशन/g, 'प्रश्न');
      str = str.replace(/\bिफश्न/g, 'प्रश्न');
      str = str.replace(/\bिफतियोग्यता/g, 'प्रतियोग्यता');
      str = str.replace(/\bिफत्येक/g, 'प्रत्येक');
      str = str.replace(/\bिफाप्त/g, 'प्राप्त');
      str = str.replace(/\bिफक्रिया/g, 'प्रक्रिया');
      str = str.replace(/\bिफति/g, 'प्रति');
      str = str.replace(/\bिफि/g, 'प्र');

      str = str.replace(/कल्िपना/g, 'कल्पना');
      str = str.replace(/कल्िप/g, 'कल्प');
      str = str.replace(/ल्िप/g, 'ल्प');
      str = str.replace(/न्ित/g, 'न्त');
      str = str.replace(/त्िय/g, 'त्य');
      str = str.replace(/स्ित/g, 'स्थित');
      str = str.replace(/द्िव/g, 'द्वि');
      str = str.replace(/द्िब/g, 'द्वि');
      str = str.replace(/द्िय/g, 'द्वि');
      str = str.replace(/त्िर/g, 'त्र');

      str = str.replace(/\u093F([\u0915-\u0939]\u093C?)/g, '$1\u093F');
      str = str.replace(/\u093F{2,}/g, '\u093F');

      // Only clean NCERT Devanagari glyph/math artifacts when Devanagari is actually present
      str = str.replace(/['"]?०ूऊ;?['"]?/g, "'0'");
      str = str.replace(/H\u093E|H\u0901/g, '');
      str = str.replace(/ↀ/g, '');
      str = str.replace(/०ा/g, 'ा');
    }
  }

  // Strip BOM / zero-width space, but KEEP ZWNJ (\u200C) and ZWJ (\u200D) for Indic conjuncts
  if (gujaratiCount > 0 || devanagariCount > 0 || otherIndicCount > 0) {
    str = str.replace(/[\uFEFF\u200B]/g, '');
  } else {
    str = str.replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
  }

  // Collapse excessive horizontal whitespace while keeping intentional line breaks clean
  str = str
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  try {
    str = str.normalize('NFC');
  } catch {
    // Ignore environments without String.prototype.normalize
  }

  return str;
}

export function convertKrutiDevToUnicode(text: string): string {
  return cleanPdfExtractedText(text);
}

/**
 * Assesses whether PDF.js extracted usable Unicode text from a page,
 * or whether the page is scanned/image-based or uses a legacy non-Unicode Indic font
 * (such as LMG-Arun, Harikrishna, Gopika, Terafont, Shruti legacy, or PUA glyphs).
 */
export function assessPdfPageTextQuality(
  extractedText: string,
  fileName?: string,
  targetLanguage?: string
): PdfTextQualityAssessment {
  const trimmed = (extractedText || '').trim();
  const compact = trimmed.replace(/\s+/g, '');

  if (compact.length < 12) {
    return { isReadable: false, needsOcr: true, reason: 'empty', indicCharCount: 0 };
  }

  // Count replacement characters, Private Use Area glyphs, and control chars
  const brokenGlyphCount = (compact.match(/[\uFFFD\uE000-\uF8FF\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  if (brokenGlyphCount / compact.length > 0.04) {
    return { isReadable: false, needsOcr: true, reason: 'pua_or_replacement', indicCharCount: 0 };
  }

  const gujCount = (compact.match(GUJARATI_CHAR_RE) || []).length;
  const devCount = (compact.match(DEVANAGARI_CHAR_RE) || []).length;
  const otherIndicCount = (compact.match(OTHER_INDIC_CHAR_RE) || []).length;
  const indicCharCount = gujCount + devCount + otherIndicCount;

  if (indicCharCount >= 12 || indicCharCount / compact.length >= 0.12) {
    return { isReadable: true, needsOcr: false, reason: 'ok', indicCharCount };
  }

  // Detect legacy 8-bit non-Unicode Gujarati/Indic font extraction (e.g. "ÃkÚ{", "Jwõkhík", "Ëkðk÷")
  const extendedLatinCount = (compact.match(/[\u00C0-\u024F]/g) || []).length;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const suspiciousTokens = tokens.filter((tok) =>
    /[a-zA-Z][\u00C0-\u024F{}\[\]|\\~^<>_;@]+|[\u00C0-\u024F{}\[\]|\\~^<>_;@]+[a-zA-Z]|[a-z]{1,2}[A-Z][a-z]{1,2}[A-Z]?/.test(tok)
  );
  const commonEnglishWords = tokens.filter((tok) =>
    /^(the|and|for|with|from|that|this|what|which|when|where|how|why|who|are|was|were|have|has|had|can|will|not|but|all|one|two|three|page|chapter|unit|class|std|lesson|question|answer|solve|find|let|given|prove|note|table|figure|example|science|math|english|gujarat|india|school|student)$/i.test(
      tok.replace(/[^a-zA-Z]/g, '')
    )
  );

  const extendedLatinRatio = extendedLatinCount / compact.length;
  const suspiciousTokenRatio = tokens.length > 0 ? suspiciousTokens.length / tokens.length : 0;
  const hintsGujarati =
    /guj|gcert|gseb|ગુજરાતી/i.test(fileName || '') ||
    targetLanguage === 'Gujarati';

  if (
    extendedLatinRatio > 0.08 ||
    (tokens.length >= 8 && suspiciousTokenRatio > 0.22 && commonEnglishWords.length <= 1) ||
    (hintsGujarati && tokens.length >= 10 && indicCharCount === 0 && commonEnglishWords.length === 0 && suspiciousTokenRatio > 0.12)
  ) {
    return { isReadable: false, needsOcr: true, reason: 'garbled_legacy_font', indicCharCount };
  }

  return { isReadable: true, needsOcr: false, reason: 'ok', indicCharCount };
}
