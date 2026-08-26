import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { safeFetchJson } from '../../utils/safeFetch';
import MathRenderer, { normalizeMathText } from '../common/MathRenderer';
import { downloadSmartReaderPdf, generateSmartReaderPdfDataUrl } from '../../utils/pdfExport';
import { saveFileLocal } from '../../lib/indexedDbStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2, 
  Download, 
  AlertCircle, 
  Maximize2, 
  Minimize2,
  Search, 
  X,
  Copy,
  Check,
  Sparkles,
  Send,
  Bot,
  Wand2,
  HelpCircle,
  FileText,
  Volume2,
  VolumeX,
  Globe,
  CheckCircle2,
  Layers,
  MessageSquare,
  ArrowRight,
  Star,
  Mic,
  Languages,
  Hand,
  MousePointer,
  Move,
  BookOpen,
  Type,
  Sun,
  Moon,
  BookText,
  Bookmark,
  Printer,
  GraduationCap,
  LogOut,
  Columns,
  CornerUpLeft,
  FileDown,
  RotateCcw,
  Trash2,
  Trash,
  RefreshCw,
  Pencil,
  Plus
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import { LanguageCode, User } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

/**
 * Utility to convert Kruti Dev 010 / Devlys 010 ASCII text & clean up garbled NCERT PDF text
 * (commonly extracted from Indian textbook PDFs with misplaced Devanagari matras)
 * into standard, pristine Devanagari Unicode text.
 */
export function convertKrutiDevToUnicode(text: string): string {
  return cleanPdfExtractedText(text);
}

export function cleanPdfExtractedText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let str = rawText.trim();
  if (!str) return '';

  // 1. If text is predominantly KrutiDev 8-bit ASCII, convert character mappings first
  const devanagariCount = (str.match(/[\u0900-\u097F]/g) || []).length;
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

  // 2. Fix specific NCERT Devanagari font artifacts & misplaced glyphs
  // NCERT PDF font artifact: 'िफ' at start of word before consonant is 'प्र'
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

  // Fix misplaced 'ि' inside conjuncts (NCERT PDF text layer defect)
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

  // Fix misplaced \u093F ('ि' matra) occurring BEFORE a consonant (\u0915-\u0939):
  // e.g. 'िक' (\u093F + क) -> 'कि' (क + \u093F)
  str = str.replace(/\u093F([\u0915-\u0939]\u093C?)/g, '$1\u093F');

  // Deduplicate repeated matras (e.g. 'किि' -> 'कि')
  str = str.replace(/\u093F{2,}/g, '\u093F');

  // 3. Fix NCERT Math / Symbol font artifacts
  // '०ूऊ;' or '०ूऊ' -> '0'
  str = str.replace(/['"]?०ूऊ;?['"]?/g, "'0'");
  str = str.replace(/H\u093E|H\u0901|H/g, ''); // remove orphan H glyph artifacts
  str = str.replace(/ↀ/g, '');
  str = str.replace(/०ा/g, 'ा');
  str = str.replace(/;\s*/g, ', ');
  str = str.replace(/,\s*,/g, ',');

  // Clean zero-width non-printable joiners/spaces
  str = str.replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
  str = str.replace(/\s+/g, ' ');

  return str.trim();
}
import { getDeterministicAvatar } from '../../utils/avatar';

const TOP_NAV_LANGUAGES: { code: LanguageCode; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
];

export const PDF_VIEWER_I18N: Record<LanguageCode, {
  smartReader: string;
  pdfPages: string;
  copyFullText: string;
  copied: string;
  page: string;
  pageOf: (curr: number, total: number) => string;
  zoomIn: string;
  zoomOut: string;
  fitWidth: string;
  fitPage: string;
  searchPlaceholder: string;
  aiSolver: string;
  aiSolverTitle: string;
  downloadPdf: string;
  save: string;
  saved: string;
  savedToMaterial: string;
  unsavedFromMaterial: string;
  close: string;
  closePdf: string;
  rotate: string;
  loadingPdf: string;
  unableToLoad: string;
  showcaseFull: string;
  splitView: string;
  askAiPlaceholder: string;
  light: string;
  sepia: string;
  dark: string;
  compact: string;
  wide: string;
  handTool: string;
  selectText: string;
  firstPage: string;
  lastPage: string;
  previousPage: string;
  nextPage: string;
  translate: string;
}> = {
  en: {
    smartReader: 'Smart Reader',
    pdfPages: 'PDF Pages',
    copyFullText: 'Copy Full Text',
    copied: 'Copied!',
    page: 'Page',
    pageOf: (curr, total) => `Page ${curr} of ${total}`,
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitWidth: 'Fit Width',
    fitPage: 'Fit Page',
    searchPlaceholder: 'Search in PDF...',
    aiSolver: 'AI Solver',
    aiSolverTitle: 'AI Solver Chatbot',
    downloadPdf: 'Download PDF',
    save: 'Save',
    saved: 'Saved',
    savedToMaterial: 'Saved to My Material!',
    unsavedFromMaterial: 'Removed from My Material',
    close: 'Close',
    closePdf: 'Close PDF',
    rotate: 'Rotate',
    loadingPdf: 'Loading PDF document...',
    unableToLoad: 'Unable to load PDF document',
    showcaseFull: 'Showcase Full',
    splitView: 'Split View',
    askAiPlaceholder: 'Ask any question from this page...',
    light: 'Light',
    sepia: 'Sepia',
    dark: 'Dark',
    compact: 'Compact',
    wide: 'Wide',
    handTool: 'Hand Tool',
    selectText: 'Select Text',
    firstPage: 'First Page',
    lastPage: 'Last Page',
    previousPage: 'Previous Page',
    nextPage: 'Next Page',
    translate: 'Translate',
  },
  hi: {
    smartReader: 'स्मार्ट रीडर',
    pdfPages: 'पीडीएफ पृष्ठ',
    copyFullText: 'पूरा पाठ कॉपी करें',
    copied: 'कॉपी हो गया!',
    page: 'पृष्ठ',
    pageOf: (curr, total) => `पृष्ठ ${curr} / ${total}`,
    zoomIn: 'ज़ूम इन',
    zoomOut: 'ज़ूम आउट',
    fitWidth: 'चौड़ाई के अनुसार',
    fitPage: 'पूरा पृष्ठ',
    searchPlaceholder: 'पीडीएफ में खोजें...',
    aiSolver: 'एआई समाधानकर्ता',
    aiSolverTitle: 'एआई अध्ययन सहायक',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    savedToMaterial: 'मेरी सामग्री में सहेजा गया!',
    unsavedFromMaterial: 'मेरी सामग्री से हटाया गया',
    close: 'बंद करें',
    closePdf: 'पीडीएफ बंद करें',
    rotate: 'घुमाएं',
    loadingPdf: 'पीडीएफ दस्तावेज़ लोड हो रहा है...',
    unableToLoad: 'पीडीएफ लोड करने में असमर्थ',
    showcaseFull: 'पूर्ण दृश्य',
    splitView: 'स्प्लिट दृश्य',
    askAiPlaceholder: 'इस पृष्ठ से कोई प्रश्न पूछें...',
    light: 'लाइट',
    sepia: 'सेपिया',
    dark: 'डार्क',
    compact: 'छोटा',
    wide: 'चौड़ा',
    handTool: 'हैंड टूल',
    selectText: 'पाठ चुनें',
    firstPage: 'पहला पृष्ठ',
    lastPage: 'अंतिम पृष्ठ',
    previousPage: 'पिछला पृष्ठ',
    nextPage: 'अगला पृष्ठ',
    translate: 'अनुवाद करें',
  },
  gu: {
    smartReader: 'સ્માર્ટ રીડર',
    pdfPages: 'પીડીએફ પાના',
    copyFullText: 'લખાણ નકલ કરો',
    copied: 'નકલ થઈ ગઈ!',
    page: 'પાનું',
    pageOf: (curr, total) => `પાનું ${curr} / ${total}`,
    zoomIn: 'ઝૂમ ઇન',
    zoomOut: 'ઝૂમ આઉટ',
    fitWidth: 'પહોળાઈ મુજબ',
    fitPage: 'આખું પાનું',
    searchPlaceholder: 'પીડીએફમાં શોધો...',
    aiSolver: 'AI સોલ્વર',
    aiSolverTitle: 'AI અભ્યાસ મદદગાર',
    downloadPdf: 'પીડીએફ ડાઉનલોડ કરો',
    save: 'સાચવો',
    saved: 'સાચવેલ',
    savedToMaterial: 'મારી સામગ્રીમાં સાચવવામાં આવ્યું!',
    unsavedFromMaterial: 'મારી સામગ્રીમાંથી દૂર કર્યું',
    close: 'બંધ કરો',
    closePdf: 'પીડીએફ બંધ કરો',
    rotate: 'ફેરવો',
    loadingPdf: 'પીડીએફ લોડ થઈ રહ્યું છે...',
    unableToLoad: 'પીડીએફ લોડ કરવામાં નિષ્ફળ',
    showcaseFull: 'પૂર્ણ સ્ક્રીન',
    splitView: 'સ્પ્લિટ વ્યુ',
    askAiPlaceholder: 'આ પાના પરથી પ્રશ્ન પૂછો...',
    light: 'લાઈટ',
    sepia: 'સેપિયા',
    dark: 'ડાર્ક',
    compact: 'નાનું',
    wide: 'પહોળું',
    handTool: 'હેન્ડ ટૂલ',
    selectText: 'લખાણ પસંદ કરો',
    firstPage: 'પ્રથમ પાનું',
    lastPage: 'અંતિમ પાનું',
    previousPage: 'અગાઉનું પાનું',
    nextPage: 'પછીનું પાનું',
    translate: 'અનુવાદ કરો',
  },
  mr: {
    smartReader: 'स्मार्ट रीडर',
    pdfPages: 'पीडीएफ पृष्ठे',
    copyFullText: 'मजकूर कॉपी करा',
    copied: 'कॉपी झाले!',
    page: 'पृष्ठ',
    pageOf: (curr, total) => `पृष्ठ ${curr} / ${total}`,
    zoomIn: 'झूम इन',
    zoomOut: 'झूम आउट',
    fitWidth: 'रुंदीनुसार',
    fitPage: 'पूर्ण पृष्ठ',
    searchPlaceholder: 'पीडीएफमध्ये शोधा...',
    aiSolver: 'AI सोल्वहर',
    aiSolverTitle: 'AI अभ्यास सहाय्यक',
    downloadPdf: 'पीडीएफ डाउनलोड करा',
    save: 'साठवा',
    saved: 'जतन केले',
    savedToMaterial: 'माझ्या सामग्रीत जतन केले!',
    unsavedFromMaterial: 'माझ्या सामग्रीतून काढले',
    close: 'बंद करा',
    closePdf: 'पीडीएफ बंद करा',
    rotate: 'फिरवा',
    loadingPdf: 'पीडीएफ लोड होत आहे...',
    unableToLoad: 'पीडीएफ लोड करू शकत नाही',
    showcaseFull: 'पूर्ण दृश्य',
    splitView: 'स्प्लिट दृश्य',
    askAiPlaceholder: 'या पृष्ठावरून प्रश्न विचारा...',
    light: 'लाइट',
    sepia: 'सेपिया',
    dark: 'डार्क',
    compact: 'कॉम्पॅक्ट',
    wide: 'रुंद',
    handTool: 'हँड टूल',
    selectText: 'मजकूर निवडा',
    firstPage: 'पहिले पृष्ठ',
    lastPage: 'शेवटचे पृष्ठ',
    previousPage: 'मागील पृष्ठ',
    nextPage: 'पुढील पृष्ठ',
    translate: 'भाषांतर करा',
  },
  ta: {
    smartReader: 'ஸ்மார்ட் ரீடர்',
    pdfPages: 'PDF பக்கங்கள்',
    copyFullText: 'உரையை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    page: 'பக்கம்',
    pageOf: (curr, total) => `பக்கம் ${curr} / ${total}`,
    zoomIn: 'பெரிதாக்கு',
    zoomOut: 'சிறிதாக்கு',
    fitWidth: 'அகலத்திற்கு ஏற்',
    fitPage: 'பக்கத்திற்கு ஏற்',
    searchPlaceholder: 'PDF இல் தேடவும்...',
    aiSolver: 'AI தீர்வு',
    aiSolverTitle: 'AI கற்றல் உதவியாளர்',
    downloadPdf: 'PDF பதிவிறக்கவும்',
    save: 'சேமி',
    saved: 'சேமிக்கப்பட்டது',
    savedToMaterial: 'எனது சேமிப்பில் சேமிக்கப்பட்டது!',
    unsavedFromMaterial: 'எனது சேமிப்பிலிருந்து நீக்கப்பட்டது',
    close: 'மூடு',
    closePdf: 'PDF மூடவும்',
    rotate: 'சுழற்று',
    loadingPdf: 'PDF ஏற்றப்படுகிறது...',
    unableToLoad: 'PDF ஐ ஏற்ற முடியவில்லை',
    showcaseFull: 'முழுத்திரை',
    splitView: 'பிரிவுப் பார்வை',
    askAiPlaceholder: 'இந்தப் பக்கத்திலிருந்து கேள்வியைக் கேட்கவும்...',
    light: 'வெளிச்சம்',
    sepia: 'செபியா',
    dark: 'இருண்ட',
    compact: 'சிறிய',
    wide: 'அகலமான',
    handTool: 'கை கருவி',
    selectText: 'உரையைத் தேர்ந்தெடு',
    firstPage: 'முதல் பக்கம்',
    lastPage: 'கடைசி பக்கம்',
    previousPage: 'முந்தைய பக்கம்',
    nextPage: 'அடுத்த பக்கம்',
    translate: 'மொழிபெயர்',
  },
  te: {
    smartReader: 'స్మార్ట్ రీడర్',
    pdfPages: 'PDF పుటలు',
    copyFullText: 'వచనాన్ని కాపీ చేయి',
    copied: 'కాపీ అయింది!',
    page: 'పుట',
    pageOf: (curr, total) => `పుట ${curr} / ${total}`,
    zoomIn: 'జూమ్ ఇన్',
    zoomOut: 'జూమ్ అవుట్',
    fitWidth: 'వెడల్పుకు తగినట్లు',
    fitPage: 'పుటకు తగినట్లు',
    searchPlaceholder: 'PDF లో వెతకండి...',
    aiSolver: 'AI సాధని',
    aiSolverTitle: 'AI అభ్యసన సహాయకుడు',
    downloadPdf: 'PDF డౌన్‌లోడ్ చేయండి',
    save: 'సేవ్ చేయి',
    saved: 'సేవ్ చేయబడింది',
    savedToMaterial: 'నా మెటీరియల్‌లో సేవ్ చేయబడింది!',
    unsavedFromMaterial: 'నా మెటీరియల్ నుండి తీసివేయబడింది',
    close: 'మూసివేయి',
    closePdf: 'PDF మూసివేయండి',
    rotate: 'తిప్పండి',
    loadingPdf: 'PDF లోడ్ అవుతోంది...',
    unableToLoad: 'PDF ని లోడ్ చేయలేకపోయాము',
    showcaseFull: 'పూర్తి స్క్రీన్',
    splitView: 'స్ప్లిట్ వీక్షణ',
    askAiPlaceholder: 'ఈ పుట నుండి ప్రశ్న అడగండి...',
    light: 'లైట్',
    sepia: 'సెపియా',
    dark: 'డార్క్',
    compact: 'చిన్నది',
    wide: 'వెడల్పు',
    handTool: 'హ్యాండ్ టూల్',
    selectText: 'వచనాన్ని ఎంచుకోండి',
    firstPage: 'మొదటి పుట',
    lastPage: 'చివరి పుట',
    previousPage: 'మునుపటి పుట',
    nextPage: 'తరువాతి పుట',
    translate: 'అనువదించు',
  },
};

interface PdfCanvasViewerProps {
  fileId: string;
  fileDataUrl?: string;
  fileName: string;
  fullContent?: string;
  isAiGenerated?: boolean;
  lang?: LanguageCode;
  user?: User | null;
  adminUser?: User | null;
  onClose?: () => void;
  onNavigateBack?: () => void;
  onLanguageChange?: (lang: LanguageCode) => void;
  onGetFileLocal: (id: string) => Promise<string | null>;
  onDownload: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void | Promise<void>;
  onPagesTextExtracted?: (pages: { pageNum: number; text: string }[]) => void;
}

// Helper to render high-precision structured transparent text selection layer over canvas
const renderAiStructuredTextLayer = (
  containerDiv: HTMLElement,
  text: string,
  viewportWidth: number,
  viewportHeight: number
) => {
  containerDiv.innerHTML = '';

  // Standard container width for A4 layout rendering is 794px
  const sf = viewportWidth / 794;

  const outerBlock = document.createElement('div');
  outerBlock.className = 'w-full h-full';
  outerBlock.style.position = 'absolute';
  outerBlock.style.inset = '0';
  outerBlock.style.width = `${viewportWidth}px`;
  outerBlock.style.height = `${viewportHeight}px`;
  outerBlock.style.padding = `${48 * sf}px ${56 * sf}px ${64 * sf}px ${56 * sf}px`;
  outerBlock.style.boxSizing = 'border-box';
  outerBlock.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Hind", "Gujarati", "Mukta", sans-serif';
  outerBlock.style.overflow = 'hidden';
  outerBlock.style.pointerEvents = 'auto';
  outerBlock.style.userSelect = 'text';

  const normalizedText = normalizeMathText(text || '');

  // Helper for inline math rendering into KaTeX HTML
  const renderInlineMathHtml = (segment: string): string => {
    if (!segment) return '';
    return segment.replace(/\$([^\$\n]+?)\$/g, (_match, mathExpr) => {
      let rawMath = mathExpr.trim();
      let trailingPunct = '';
      const punctMatch = rawMath.match(/([\.\,\;\:\!\?])$/);
      if (punctMatch) {
        trailingPunct = punctMatch[1];
        rawMath = rawMath.slice(0, -1).trim();
      }
      try {
        const katexHtml = katex.renderToString(rawMath, {
          displayMode: false,
          throwOnError: false,
          output: 'html',
        });
        return `<span style="display: inline-block; vertical-align: middle; margin: 0 ${2 * sf}px;">${katexHtml}</span>${trailingPunct}`;
      } catch {
        return `<span style="font-family: Cambria Math, serif; font-style: italic;">${rawMath}</span>${trailingPunct}`;
      }
    });
  };

  const formattedHtml = normalizedText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return `<div style="height: ${14 * sf}px;"></div>`;

      // Standalone KaTeX display equation
      if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 2 && !trimmed.slice(1, -1).includes('$')) {
        let mathExpr = trimmed.slice(1, -1).trim();
        let trailingPunct = '';
        const punctMatch = mathExpr.match(/([\.\,\;\:\!\?])$/);
        if (punctMatch) {
          trailingPunct = punctMatch[1];
          mathExpr = mathExpr.slice(0, -1).trim();
        }
        try {
          const katexDisplayHtml = katex.renderToString(mathExpr, {
            displayMode: true,
            throwOnError: false,
            output: 'html',
          });
          return `<div style="margin: ${14 * sf}px 0; padding: ${12 * sf}px ${18 * sf}px; text-align: center; overflow-x: auto;">${katexDisplayHtml}${trailingPunct}</div>`;
        } catch {
          return `<div style="margin: ${10 * sf}px 0; font-family: Cambria Math, serif; font-style: italic; text-align: center;">${mathExpr}${trailingPunct}</div>`;
        }
      }

      // H1 Title
      if (trimmed.startsWith('# ')) {
        const titleText = renderInlineMathHtml(trimmed.replace(/^#\s*/, ''));
        return `<h1 style="font-size: ${24 * sf}px; font-weight: 900; margin: ${26 * sf}px 0 ${14 * sf}px 0; padding-bottom: ${8 * sf}px; border-bottom: ${3 * sf}px solid transparent; letter-spacing: -0.3px;">${titleText}</h1>`;
      }
      // H2 Heading
      if (trimmed.startsWith('## ')) {
        const titleText = renderInlineMathHtml(trimmed.replace(/^##\s*/, ''));
        return `<h2 style="font-size: ${17 * sf}px; font-weight: 800; margin: ${24 * sf}px 0 ${12 * sf}px 0; padding: ${10 * sf}px ${16 * sf}px; display: block; letter-spacing: -0.2px;">${titleText}</h2>`;
      }
      // H3 Heading
      if (trimmed.startsWith('### ')) {
        const titleText = renderInlineMathHtml(trimmed.replace(/^###\s*/, ''));
        return `<h3 style="font-size: ${15 * sf}px; font-weight: 800; margin: ${18 * sf}px 0 ${8 * sf}px 0; padding-bottom: ${4 * sf}px;">${titleText}</h3>`;
      }
      // Callout Block
      if (trimmed.startsWith('> ')) {
        const t = renderInlineMathHtml(trimmed.replace(/^>\s*/, ''));
        return `<div style="padding: ${14 * sf}px ${18 * sf}px; margin: ${14 * sf}px 0; font-size: ${14.5 * sf}px; font-weight: 600; line-height: 1.8;">${t}</div>`;
      }
      // Numbered List
      if (/^\d+\./.test(trimmed)) {
        const contentWithMath = renderInlineMathHtml(trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
        return `<div style="font-weight: 700; margin-top: ${10 * sf}px; margin-bottom: ${6 * sf}px; font-size: ${14.5 * sf}px; padding-left: ${4 * sf}px; line-height: 1.8;">${contentWithMath}</div>`;
      }
      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = renderInlineMathHtml(trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
        return `<div style="padding-left: ${24 * sf}px; position: relative; margin-bottom: ${8 * sf}px; font-size: ${14.5 * sf}px; font-weight: 500; line-height: 1.8;"><span style="position: absolute; left: ${6 * sf}px; font-weight: 900; font-size: ${16 * sf}px;">•</span> ${itemContent}</div>`;
      }

      const paragraphContent = renderInlineMathHtml(trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
      return `<p style="margin: 0 0 ${12 * sf}px 0; font-weight: 500; line-height: 1.8; font-size: ${14.5 * sf}px;">${paragraphContent}</p>`;
    })
    .join('');

  outerBlock.innerHTML = `
    <div style="border-bottom: ${3.5 * sf}px solid transparent; padding-bottom: ${20 * sf}px; margin-bottom: ${26 * sf}px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${12 * sf}px;">
        <span style="font-size: ${12 * sf}px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Gramin Shiksha • AI Study Guide</span>
        <span style="font-size: ${12 * sf}px; padding: ${5 * sf}px ${16 * sf}px; font-weight: 800;">Language: Study Document</span>
      </div>
      <h1 style="font-size: ${25 * sf}px; font-weight: 900; margin: 0 0 ${12 * sf}px 0; line-height: 1.3; letter-spacing: -0.4px;">Gramin Shiksha</h1>
      <div style="font-size: ${13.5 * sf}px; font-weight: 700; display: flex; gap: ${28 * sf}px;">
        <span>Subject: <strong>General</strong></span>
        <span>Standard: <strong>Class 10</strong></span>
      </div>
    </div>
    <div style="font-size: ${14.5 * sf}px; line-height: 1.8;">
      ${formattedHtml}
    </div>
  `;

  // Apply transparent color to all text nodes so selection blue highlight box sits over crisp canvas
  const allNodes = outerBlock.querySelectorAll('*');
  allNodes.forEach((node) => {
    const htmlEl = node as HTMLElement;
    htmlEl.style.color = 'transparent';
    htmlEl.style.webkitTextFillColor = 'transparent';
    htmlEl.style.borderColor = 'transparent';
    htmlEl.style.backgroundColor = 'transparent';
    htmlEl.style.boxShadow = 'none';
    htmlEl.style.userSelect = 'text';
    htmlEl.style.cursor = 'text';
  });

  // Tag every text element with original text attribute for query highlighting & copy
  const spans = outerBlock.querySelectorAll('span, p, h1, h2, h3, div');
  spans.forEach((s) => {
    if (s.children.length === 0 && s.textContent?.trim()) {
      s.setAttribute('data-original-text', s.textContent);
    }
  });

  containerDiv.appendChild(outerBlock);
};

interface PdfPageItemProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
  pageSize: { width: number; height: number };
  searchQuery: string;
  currentActiveMatchPage?: number;
  activeMatchSnippet?: string;
  fallbackText?: string;
  onPageVisible: (page: number) => void;
  setRef: (page: number, el: HTMLDivElement | null) => void;
  onTranslatePage?: (pageNum: number) => void;
  onSummarizePage?: (pageNum: number) => void;
  onSolveQuestions?: (pageNum: number) => void;
  onShortNotes?: (pageNum: number) => void;
  onAskAiPage?: (pageNum: number) => void;
  onCopyPageText?: (pageNum: number, text: string) => void;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  pageSize,
  searchQuery,
  currentActiveMatchPage,
  activeMatchSnippet,
  fallbackText,
  onPageVisible,
  setRef,
  onTranslatePage,
  onSummarizePage,
  onSolveQuestions,
  onShortNotes,
  onAskAiPage,
  onCopyPageText,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pageFullText, setPageFullText] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // High performance virtualization observers
  useEffect(() => {
    const renderObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '500px 0px 500px 0px',
        threshold: 0.01,
      }
    );

    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onPageVisible(pageNum);
        }
      },
      {
        threshold: 0.35,
      }
    );

    const el = containerRef.current;
    if (el) {
      renderObserver.observe(el);
      activeObserver.observe(el);
    }

    return () => {
      if (el) {
        renderObserver.unobserve(el);
        activeObserver.unobserve(el);
      }
      renderObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [pageNum, onPageVisible]);

  // Matrix multiplier helper for exact PDF coordinate transform fallback
  const transformMatrix = (m1: number[], m2: number[]): number[] => {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  };

  // Helper to apply search highlight inside text layer spans
  const applySearchHighlights = useCallback((container: HTMLElement, query: string) => {
    if (!container || !query.trim()) return;
    const q = query.trim().toLowerCase();
    const spans = container.querySelectorAll('span');

    spans.forEach((span) => {
      const originalText = span.getAttribute('data-original-text') || span.textContent || '';
      if (!span.hasAttribute('data-original-text')) {
        span.setAttribute('data-original-text', originalText);
      }

      if (originalText.toLowerCase().includes(q)) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        span.innerHTML = originalText.replace(regex, '<mark class="highlight">$1</mark>');
      } else {
        span.textContent = originalText;
      }
    });
  }, []);

  // Handle PDF Canvas rendering & Native Text Layer extraction
  useEffect(() => {
    if (!isVisible || !pdfDoc) {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2);
        const viewport = page.getViewport({ scale, rotation });

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // Render Native Text Layer for pixel-perfect alignment & authentic browser text selection
        if (isMounted) {
          const textContent = await page.getTextContent();
          const fullTxt = textContent.items.map((i: any) => i.str || '').join(' ').trim();
          setPageFullText(fullTxt || fallbackText || '');

          const textLayerDiv = textLayerRef.current;
          if (textLayerDiv) {
            textLayerDiv.innerHTML = '';
            textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
            textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

            if (textContent.items && textContent.items.length > 0) {
              const pdfjsLib = (window as any).pdfjsLib;
              let renderedNative = false;

              if (pdfjsLib && typeof pdfjsLib.renderTextLayer === 'function') {
                try {
                  const textLayerTask = pdfjsLib.renderTextLayer({
                    textContent,
                    container: textLayerDiv,
                    viewport,
                    textDivs: [],
                  });
                  await textLayerTask.promise;
                  renderedNative = true;
                } catch (err) {
                  console.warn(`PDF.js native textLayer failed for page ${pageNum}:`, err);
                }
              }

              // Fallback manual layout generator when native textLayer is not applicable
              if (!renderedNative) {
                textLayerDiv.innerHTML = '';
                const pdfjsUtil = (window as any).pdfjsLib?.Util;

                for (const item of textContent.items) {
                  if (!item.str || !item.transform) continue;

                  let tx: number[];
                  if (pdfjsUtil && typeof pdfjsUtil.transform === 'function') {
                    tx = pdfjsUtil.transform(viewport.transform, item.transform);
                  } else {
                    tx = transformMatrix(viewport.transform, item.transform);
                  }

                  const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                  const fontAscent = fontSize * 0.82;
                  const left = tx[4];
                  const top = tx[5] - fontAscent;

                  const span = document.createElement('span');
                  span.textContent = item.str;
                  span.setAttribute('data-original-text', item.str);
                  span.style.left = `${left}px`;
                  span.style.top = `${top}px`;
                  span.style.fontSize = `${fontSize}px`;
                  span.style.fontFamily = item.fontName || 'sans-serif';
                  span.style.lineHeight = '1';
                  span.style.position = 'absolute';
                  span.style.whiteSpace = 'pre';
                  span.style.color = 'transparent';
                  span.style.cursor = 'text';

                  if (item.width && item.width > 0) {
                    const expectedWidth = item.width * scale;
                    const approxWidth = fontSize * item.str.length * 0.52;
                    if (approxWidth > 0) {
                      span.style.transform = `scaleX(${expectedWidth / approxWidth})`;
                      span.style.transformOrigin = '0% 0%';
                    }
                  }

                  textLayerDiv.appendChild(span);
                }
              }
            } else if (fallbackText) {
              renderAiStructuredTextLayer(textLayerDiv, fallbackText, Math.floor(viewport.width), Math.floor(viewport.height));
            }

            // Tag each span with original text attribute for query highlighting
            const allSpans = textLayerDiv.querySelectorAll('span');
            allSpans.forEach(s => {
              if (!s.hasAttribute('data-original-text')) {
                s.setAttribute('data-original-text', s.textContent || '');
              }
            });

            if (searchQuery.trim()) {
              applySearchHighlights(textLayerDiv, searchQuery.trim());
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException' && isMounted) {
          console.error(`Page ${pageNum} rendering failed:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [isVisible, pdfDoc, scale, rotation, pageNum, fallbackText, searchQuery, applySearchHighlights]);

  // Reactive updates to search highlights without re-rendering the full canvas
  useEffect(() => {
    const textLayerDiv = textLayerRef.current;
    if (!textLayerDiv) return;

    const spans = textLayerDiv.querySelectorAll('span');
    spans.forEach(span => {
      const orig = span.getAttribute('data-original-text') || span.textContent || '';
      span.textContent = orig;
    });

    if (searchQuery.trim()) {
      applySearchHighlights(textLayerDiv, searchQuery.trim());
    }
  }, [searchQuery, applySearchHighlights]);

  const isRotatedLandscape = rotation === 90 || rotation === 270;
  const width = (isRotatedLandscape ? pageSize.height : pageSize.width) * scale;
  const height = (isRotatedLandscape ? pageSize.width : pageSize.height) * scale;

  return (
    <div className="flex flex-col items-center shrink-0 w-fit">
      {/* PDF Page Canvas */}
      <div
        ref={(el) => {
          containerRef.current = el;
          setRef(pageNum, el);
        }}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="relative bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-all select-text"
      >
        {isVisible ? (
          <>
            {/* Base Vector Canvas */}
            <canvas ref={canvasRef} className="w-full h-full block bg-white pointer-events-none" />

            {/* Native High-Precision Selectable Text Layer Overlay */}
            <div
              ref={textLayerRef}
              className="textLayer pdf-text-layer absolute inset-0 overflow-hidden select-text pointer-events-auto z-10"
              style={{ width: `${width}px`, height: `${height}px` }}
            />
          </>
        ) : (
          <div className="text-center space-y-2 text-slate-500">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mx-auto" />
            <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-400">
              Page {pageNum}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Smart Reader View Component for Distraction-Free Reading, KaTeX Math & Precise Text Selection
interface SmartReaderViewProps {
  title: string;
  subject?: string;
  std?: string;
  language?: string;
  content: string;
  fontSize: number;
  theme: 'light' | 'sepia' | 'dark';
  searchQuery: string;
  onCopyAll: () => void;
  onToast: (msg: string) => void;
  onAskAi?: (prompt: string) => void;
  onDownloadPdf?: () => void;
}

const SmartReaderView: React.FC<SmartReaderViewProps> = ({
  title,
  subject = 'General',
  std = 'Class 10',
  language = 'English',
  content,
  fontSize,
  theme,
  searchQuery,
  onCopyAll,
  onToast,
  onAskAi,
  onDownloadPdf
}) => {
  const [copiedSectionIdx, setCopiedSectionIdx] = useState<number | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // Calculate quick stats
  const wordCount = useMemo(() => {
    return content ? content.split(/\s+/).filter(Boolean).length : 0;
  }, [content]);

  const readMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [wordCount]);

  // Parse markdown content into logical structured sections
  const sections = useMemo(() => {
    if (!content) return [];
    const normalized = normalizeMathText(content);
    
    // Split by Markdown level 1, 2, and 3 headers
    const rawChunks = normalized.split(/\n(?=#{1,3}\s+)/g);
    
    const parsedSections: { title: string; body: string; level: number }[] = [];
    let sectionCounter = 1;

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i].trim();
      if (!chunk) continue;

      const headerMatch = chunk.match(/^(#{1,4})\s+(.+?)(\n|$)/);
      if (headerMatch) {
        const headerLevel = headerMatch[1].length;
        let rawHeaderTitle = headerMatch[2].trim();
        let bodyContent = chunk.substring(headerMatch[0].length).trim();

        // Strip surrounding markdown bold / italic formatting
        rawHeaderTitle = rawHeaderTitle.replace(/^[*_~`#]+|[*_~`#]+$/g, '').trim();

        // If this is purely a document title header matching the document card with no body, skip it
        if (headerLevel === 1 && (!bodyContent || bodyContent.length < 5) && (rawHeaderTitle.toLowerCase() === title?.toLowerCase() || i === 0)) {
          continue;
        }

        // Test if title is empty, or only an emoji/symbol (e.g. "📖", "🔬", "🎯")
        const isOnlyEmoji = !/[a-zA-Z0-9\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(rawHeaderTitle);

        let resolvedTitle = rawHeaderTitle;

        if (!rawHeaderTitle || isOnlyEmoji) {
          // Check if body begins with a title or bold heading line
          const bodyLines = bodyContent.split('\n').map(l => l.trim()).filter(Boolean);
          if (bodyLines.length > 0) {
            const firstLine = bodyLines[0];
            const cleanFirstLine = firstLine.replace(/^(#{1,4}|\*\*|\*|__)\s*|\s*(\*\*|\*|__)$/g, '').trim();
            if (cleanFirstLine.length > 2 && cleanFirstLine.length < 90 && !cleanFirstLine.includes('.')) {
              resolvedTitle = rawHeaderTitle ? `${rawHeaderTitle} ${cleanFirstLine}` : cleanFirstLine;
              // Remove firstLine from bodyContent so it doesn't repeat
              const firstLineIdx = bodyContent.indexOf(firstLine);
              if (firstLineIdx !== -1) {
                bodyContent = bodyContent.substring(firstLineIdx + firstLine.length).trim();
              }
            }
          }
        }

        if (!resolvedTitle || isOnlyEmoji) {
          const emojiPrefix = rawHeaderTitle ? `${rawHeaderTitle} ` : '';
          const fallbackNames = ['Overview', 'Core Concepts', 'Detailed Study', 'Key Formulations', 'Practice & Summary'];
          const fallback = fallbackNames[sectionCounter - 1] || `Section ${sectionCounter}`;
          resolvedTitle = `${emojiPrefix}${fallback}`;
        }

        if (bodyContent || resolvedTitle) {
          parsedSections.push({
            title: resolvedTitle,
            body: bodyContent || 'Refer to the detailed guide above.',
            level: headerLevel
          });
          sectionCounter++;
        }
      } else {
        if (chunk.length > 0) {
          parsedSections.push({
            title: sectionCounter === 1 ? (title || 'Introduction') : `Section ${sectionCounter}`,
            body: chunk,
            level: 2
          });
          sectionCounter++;
        }
      }
    }

    if (parsedSections.length === 0) {
      return [{ title: title || 'Study Content', body: normalized, level: 1 }];
    }

    return parsedSections;
  }, [content, title]);

  const handleCopySection = (textToCopy: string, idx: number) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSectionIdx(idx);
    onToast(`📋 Copied section to clipboard!`);
    setTimeout(() => setCopiedSectionIdx(null), 2000);
  };

  const handleSpeakSection = (textToSpeak: string, idx: number) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
    } else {
      stopSpeaking();
      setSpeakingIdx(idx);
      speakText(textToSpeak, language === 'Hindi' ? 'hi' : language === 'Gujarati' ? 'gu' : 'en');
    }
  };

  const themeClasses = {
    light: 'bg-slate-100/90 text-slate-900',
    sepia: 'bg-[#f6f0e2] text-[#3e3223]',
    dark: 'bg-slate-950 text-slate-100'
  };

  const cardClasses = {
    light: 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300',
    sepia: 'bg-[#fdfaf3] border-[#e7dac1] shadow-xs hover:border-[#dfcead]',
    dark: 'bg-slate-900 border-slate-800 shadow-xs hover:border-slate-700'
  };

  const headerCardClasses = {
    light: 'bg-white border-slate-200 shadow-sm',
    sepia: 'bg-[#fdfaf3] border-[#e7dac1] shadow-sm',
    dark: 'bg-slate-900 border-slate-800 shadow-sm'
  };

  const titleColorClass = theme === 'dark' ? 'text-white' : theme === 'sepia' ? 'text-[#3e3223]' : 'text-slate-900';
  const metaColorClass = theme === 'dark' ? 'text-slate-400' : theme === 'sepia' ? 'text-[#73634e]' : 'text-slate-500';
  const metaBoldClass = theme === 'dark' ? 'text-slate-200' : theme === 'sepia' ? 'text-[#3e3223]' : 'text-slate-800';
  const dividerBorderClass = theme === 'dark' ? 'border-slate-800' : theme === 'sepia' ? 'border-[#e7dac1]' : 'border-slate-200';
  const actionButtonClass = theme === 'dark' 
    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60' 
    : theme === 'sepia' 
    ? 'bg-[#ebd9b2] hover:bg-[#dfcead] text-[#3e3223] border border-[#dfcead]' 
    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200';

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-6 md:px-8 overflow-y-auto ${themeClasses[theme]} transition-colors duration-200 select-text`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Document Header Card */}
        <div className={`rounded-2xl p-5 sm:p-7 border ${headerCardClasses[theme]} transition-all`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Smart Reader</span>
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold text-xs rounded-lg">
                {language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCopyAll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                title="Copy Full Document Text to Clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Text</span>
              </button>
            </div>
          </div>

          <h1 className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug mb-3 ${titleColorClass}`}>
            {title}
          </h1>

          <div className={`flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold ${metaColorClass} border-t ${dividerBorderClass} pt-3`}>
            <div>Subject: <strong className={`${metaBoldClass} font-bold`}>{subject}</strong></div>
            <div>•</div>
            <div>Standard: <strong className={`${metaBoldClass} font-bold`}>{std}</strong></div>
            <div>•</div>
            <div>{wordCount} words (~{readMinutes} min read)</div>
          </div>
        </div>

        {/* Structured Content Sections */}
        <div className="space-y-5">
          {sections.map((sec, idx) => {
            const isSpeakingThis = speakingIdx === idx;
            const isCopiedThis = copiedSectionIdx === idx;
            const fullSecText = `${sec.title}\n\n${sec.body}`;

            return (
              <div
                key={`sec-${idx}`}
                className={`rounded-2xl p-5 sm:p-7 border ${cardClasses[theme]} transition-all group relative`}
              >
                {/* Section Header with Quick Actions */}
                <div className={`flex items-center justify-between pb-3.5 mb-4 border-b ${dividerBorderClass} gap-3`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h2 className={`text-base sm:text-lg font-black tracking-tight ${titleColorClass} truncate`}>
                      {sec.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSpeakSection(sec.body || sec.title, idx)}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isSpeakingThis
                          ? 'bg-rose-500 text-white animate-pulse'
                          : actionButtonClass
                      }`}
                      title={isSpeakingThis ? "Stop Reading" : "Read Section Aloud"}
                    >
                      {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleCopySection(fullSecText, idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isCopiedThis
                          ? 'bg-emerald-600 text-white'
                          : actionButtonClass
                      }`}
                      title="Copy Section"
                    >
                      {isCopiedThis ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopiedThis ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Section Content with Crisp KaTeX & Typography */}
                <div
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
                  className={`font-normal selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-100 space-y-3 ${
                    theme === 'dark' ? 'text-slate-100' : theme === 'sepia' ? 'text-[#3e3223]' : 'text-slate-800'
                  }`}
                >
                  <MathRenderer
                    content={sec.body || ''}
                    isDark={theme === 'dark'}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Document Completion Bar */}
        <div className="text-center py-8 text-xs font-medium text-slate-400">
          ✨ Gramin Shiksha Smart Reader • You have reached the end of this study guide
        </div>
      </div>
    </div>
  );
};

// High-performance in-memory cache for parsed PDF documents
const pdfDocCache = new Map<string, { pdf: any; width: number; height: number; numPages: number }>();

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileId,
  fileDataUrl,
  fileName,
  fullContent,
  isAiGenerated,
  lang = 'en',
  user,
  adminUser,
  onClose,
  onNavigateBack,
  onLanguageChange,
  onGetFileLocal,
  onDownload,
  isSaved,
  onToggleSave,
  onPagesTextExtracted,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);

  // Language and Multilingual Translations for PDF Viewer
  const currentLangCode: LanguageCode = (lang && PDF_VIEWER_I18N[lang]) ? lang : 'en';
  const tPdf = PDF_VIEWER_I18N[currentLangCode] || PDF_VIEWER_I18N.en;

  // Saved to Material State Management (Syncs with parent or local storage)
  const [internalSaved, setInternalSaved] = useState<boolean>(() => {
    if (typeof isSaved === 'boolean') return isSaved;
    try {
      const userKey = (user?.mobile || adminUser?.mobile || (user as any)?.id || 'student') + '_downloaded_admin_pdfs';
      const savedList = JSON.parse(localStorage.getItem(userKey) || '[]');
      return Array.isArray(savedList) && savedList.includes(fileId);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof isSaved === 'boolean') {
      setInternalSaved(isSaved);
    }
  }, [isSaved]);

  const isMaterialSaved = typeof isSaved === 'boolean' ? isSaved : internalSaved;

  // View Mode: For AI generated files, strictly lock to 'reader' mode (Smart Reader).
  // For Admin-uploaded PDFs, lock strictly to 'canvas' mode (Original PDF document as it is).
  const isAiGen = Boolean(isAiGenerated);
  const [viewMode, setViewMode] = useState<'canvas' | 'reader'>(() => {
    return isAiGen ? 'reader' : 'canvas';
  });
  const effectiveViewMode = isAiGen ? 'reader' : 'canvas';
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  // Chatbot Resizing and Freely Showcase (Fullscreen) Modes
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gyaan_ai_panel_width');
      if (saved) return Math.max(300, Math.min(900, parseInt(saved, 10)));
    }
    return 440;
  });
  const [aiPanelMode, setAiPanelMode] = useState<'split' | 'fullscreen'>('split');
  const [isResizingActive, setIsResizingActive] = useState<boolean>(false);
  const isResizingAiRef = useRef<boolean>(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(440);

  // Mouse drag handler to resize AI chatbot panel width
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingAiRef.current = true;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = aiPanelWidth;
    setIsResizingActive(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingAiRef.current) return;
      // Dragging to the left increases width (since panel is on right)
      const deltaX = resizeStartXRef.current - moveEvent.clientX;
      const maxWidth = Math.max(340, window.innerWidth * 0.85);
      const newWidth = Math.max(300, Math.min(maxWidth, resizeStartWidthRef.current + deltaX));
      setAiPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingAiRef.current = false;
      setIsResizingActive(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      try {
        localStorage.setItem('gyaan_ai_panel_width', String(aiPanelWidth));
      } catch (_) {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [aiPanelWidth]);

  // Touch drag handler to resize AI chatbot panel on tablets
  const handleResizeTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isResizingAiRef.current = true;
    resizeStartXRef.current = e.touches[0].clientX;
    resizeStartWidthRef.current = aiPanelWidth;
    setIsResizingActive(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isResizingAiRef.current || moveEvent.touches.length !== 1) return;
      const deltaX = resizeStartXRef.current - moveEvent.touches[0].clientX;
      const maxWidth = Math.max(340, window.innerWidth * 0.85);
      const newWidth = Math.max(300, Math.min(maxWidth, resizeStartWidthRef.current + deltaX));
      setAiPanelWidth(newWidth);
    };

    const handleTouchEnd = () => {
      isResizingAiRef.current = false;
      setIsResizingActive(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  }, [aiPanelWidth]);

  // Handler for top language selector change
  const handleTopLanguageSelect = (code: LanguageCode) => {
    if (code === 'hi') setTargetLanguage('Hindi');
    else if (code === 'gu') setTargetLanguage('Gujarati');
    else if (code === 'mr') setTargetLanguage('Marathi');
    else if (code === 'ta') setTargetLanguage('Tamil');
    else if (code === 'te') setTargetLanguage('Telugu');
    else setTargetLanguage('English');

    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  // Handle PDF download
  const handleDownloadSmartReader = async () => {
    if (isDownloadingPdf) return;
    try {
      setIsDownloadingPdf(true);

      // For admin-uploaded PDFs (not AI generated), trigger direct original PDF file download!
      if (!isAiGen) {
        if (onDownload) {
          await onDownload();
          setToastMessage('Downloading original PDF file...');
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        const targetUrl = fileDataUrl;
        if (targetUrl) {
          const a = document.createElement('a');
          a.href = targetUrl;
          a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setToastMessage('Downloading original PDF file...');
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }
      }

      // For AI generated documents only, export formatted Smart Reader PDF
      setToastMessage('Generating Smart Reader PDF...');
      const textToExport = fullContent || pagesText.map(p => `## Page ${p.pageNum}\n\n${p.text}`).join('\n\n') || fileName;
      await downloadSmartReaderPdf(
        fileName.replace(/\.pdf$/i, ''),
        lang?.toUpperCase() || 'Study Material',
        'Student Edition',
        targetLanguage || (lang === 'hi' ? 'Hindi' : lang === 'gu' ? 'Gujarati' : 'English'),
        textToExport,
        'Smart Reader Study Guide'
      );
      setToastMessage('Downloaded Smart Reader PDF!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("PDF download error:", err);
      if (onDownload) {
        onDownload();
      } else {
        setToastMessage('Failed to export PDF');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getPageFallbackText = useCallback((pageNum: number, totalPages: number): string => {
    if (!fullContent) return '';
    if (totalPages <= 1) return fullContent;
    
    const paragraphs = fullContent.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) return fullContent;
    
    const pps = Math.ceil(paragraphs.length / totalPages);
    const start = (pageNum - 1) * pps;
    return paragraphs.slice(start, start + pps).join('\n\n');
  }, [fullContent]);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 612, height: 792 });

  // Search indexing and results state
  const [pagesText, setPagesText] = useState<{ pageNum: number; text: string }[]>([]);
  const [indexingText, setIndexingText] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ pageNum: number; snippet: string }[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState<number>(-1);

  // Copy Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selection Popover Floating Menu
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);

  // AI Task Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
  const [showQuickAiTools, setShowQuickAiTools] = useState<boolean>(true);
  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    if (lang === 'hi') return 'Hindi';
    if (lang === 'gu') return 'Gujarati';
    if (lang === 'mr') return 'Marathi';
    if (lang === 'ta') return 'Tamil';
    if (lang === 'te') return 'Telugu';
    return 'English';
  });

  useEffect(() => {
    if (lang) {
      if (lang === 'hi') setTargetLanguage('Hindi');
      else if (lang === 'gu') setTargetLanguage('Gujarati');
      else if (lang === 'mr') setTargetLanguage('Marathi');
      else if (lang === 'ta') setTargetLanguage('Tamil');
      else if (lang === 'te') setTargetLanguage('Telugu');
      else setTargetLanguage('English');
    }
  }, [lang]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; sender: 'user' | 'assistant'; text: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [pdfExportMessage, setPdfExportMessage] = useState<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: string } | null>(null);
  const [pdfExportQuestion, setPdfExportQuestion] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const [aiMessages, setAiMessages] = useState<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    replyTo?: { id: string; sender: 'user' | 'assistant'; text: string };
  }[]>([
    {
      id: 'ai-welcome',
      sender: 'assistant',
      text: `Hello! I am your **AI Study Task Assistant** for **${fileName}**. You can ask me to summarize pages, extract key formulas, generate quizzes, or answer questions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Full Chat PDF Export state
  const [pdfExportFullChatMessages, setPdfExportFullChatMessages] = useState<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    replyTo?: { id: string; sender: 'user' | 'assistant'; text: string };
  }[] | null>(null);
  const [pdfExportFullChatTitle, setPdfExportFullChatTitle] = useState<string>('');

  // PDF Chat History & Sessions state
  const [chatSessions, setChatSessions] = useState<{
    id: string;
    title: string;
    timestamp: string;
    messages: {
      id: string;
      sender: 'user' | 'assistant';
      text: string;
      timestamp: string;
      replyTo?: { id: string; sender: 'user' | 'assistant'; text: string };
    }[];
    starred?: boolean;
    activePageNum?: number;
  }[]>(() => {
    try {
      const storageKey = `gyaanbot_pdf_solver_sessions_${fileName || 'doc'}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'starred'>('all');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  const saveChatSessionsToStorage = useCallback((sessions: typeof chatSessions) => {
    try {
      const storageKey = `gyaanbot_pdf_solver_sessions_${fileName || 'doc'}`;
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch (err) {
      console.error("Failed to save PDF chat sessions:", err);
    }
  }, [fileName]);

  useEffect(() => {
    const userMsgCount = aiMessages.filter(m => m.sender === 'user').length;
    if (userMsgCount === 0) return;

    setChatSessions(prev => {
      let updated: typeof prev;
      const firstUserMsg = aiMessages.find(m => m.sender === 'user');
      const defaultTitle = firstUserMsg
        ? cleanPdfExtractedText(firstUserMsg.text).slice(0, 35) + (firstUserMsg.text.length > 35 ? '...' : '')
        : `Page ${activePageNum} Study Session`;

      if (activeSessionId) {
        updated = prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: aiMessages,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              activePageNum
            };
          }
          return s;
        });
      } else {
        const newId = 'session-' + Date.now();
        setActiveSessionId(newId);
        const newSession = {
          id: newId,
          title: defaultTitle,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: aiMessages,
          activePageNum
        };
        updated = [newSession, ...prev];
      }

      saveChatSessionsToStorage(updated);
      return updated;
    });
  }, [aiMessages, activeSessionId, activePageNum, saveChatSessionsToStorage]);

  const handleStartNewChat = useCallback(() => {
    const welcomeMsg = {
      id: 'ai-welcome-' + Date.now(),
      sender: 'assistant' as const,
      text: `Hello! I am your **AI Study Task Assistant** for **${fileName}**. You can ask me to summarize pages, extract key formulas, generate quizzes, or answer questions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiMessages([welcomeMsg]);
    setActiveSessionId(null);
    setShowHistory(false);
    setReplyingTo(null);
    setToastMessage('Started a new study chat session');
    setTimeout(() => setToastMessage(null), 2500);
  }, [fileName]);

  const handleExportFullChatPDF = useCallback((customMessages?: typeof aiMessages, customTitle?: string) => {
    const messagesToExport = customMessages || aiMessages;
    
    const meaningfulMessages = messagesToExport.filter(m => 
      m.sender === 'user' || (m.sender === 'assistant' && !m.text.includes("AI Study Task Assistant"))
    );

    const exportList = meaningfulMessages.length > 0 ? meaningfulMessages : messagesToExport;

    if (exportList.length === 0) {
      setToastMessage("No messages available to export.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const sessionTitle = customTitle || (
      exportList.find(m => m.sender === 'user')?.text.substring(0, 35) || `${fileName} Page ${activePageNum} Session`
    );

    const codeMap: Record<string, LanguageCode> = {
      'English': 'en',
      'Hindi': 'hi',
      'Gujarati': 'gu',
      'Marathi': 'mr',
      'Tamil': 'ta',
      'Telugu': 'te',
    };
    const speechLang = codeMap[targetLanguage] || 'en';

    speakText(
      targetLanguage === 'Hindi'
        ? "आपका संपूर्ण अध्ययन सत्र PDF तैयार किया जा रहा है..."
        : "Preparing your full study session PDF...",
      speechLang
    );

    setPdfExportMessage(null);
    setPdfExportQuestion("");
    setPdfExportFullChatMessages(exportList);
    setPdfExportFullChatTitle(sessionTitle);
    setIsExportingPDF(true);

    setTimeout(() => {
      const element = document.getElementById("pdf-canvas-viewer-full-chat-render-template");
      if (!element) {
        setIsExportingPDF(false);
        setPdfExportFullChatMessages(null);
        setPdfExportFullChatTitle("");
        return;
      }

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const printWidth = pageWidth - (margin * 2);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const printHeight = printWidth * (canvasHeight / canvasWidth);

        let pageCount = 0;

        if (printHeight <= pageHeight - (margin * 2)) {
          pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);
        } else {
          let leftHeight = printHeight;
          const pageImgHeight = pageHeight - (margin * 2);

          while (leftHeight > 0) {
            if (pageCount > 0) {
              pdf.addPage();
            }

            pdf.addImage(
              imgData,
              'PNG',
              margin,
              margin - (pageCount * pageImgHeight),
              printWidth,
              printHeight
            );

            leftHeight -= pageImgHeight;
            pageCount++;
          }
        }

        const safeTitle = sessionTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 25);
        pdf.save(`GyaanBot_AI_Solver_FullChat_${safeTitle}_Page_${activePageNum}.pdf`);
        setToastMessage('Downloaded Full Chat PDF!');
        setTimeout(() => setToastMessage(null), 3000);
      }).catch(err => {
        console.error("Failed to generate Full Chat PDF:", err);
        setToastMessage('Failed to download Full Chat PDF');
        setTimeout(() => setToastMessage(null), 3000);
      }).finally(() => {
        setIsExportingPDF(false);
        setPdfExportFullChatMessages(null);
        setPdfExportFullChatTitle("");
      });
    }, 300);
  }, [aiMessages, fileName, activePageNum, targetLanguage]);

  const handleToggleStarSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, starred: !s.starred } : s);
      saveChatSessionsToStorage(updated);
      return updated;
    });
  }, [saveChatSessionsToStorage]);

  const handleDeleteSession = useCallback((sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(targetLanguage === 'Hindi' ? "क्या आप इस चैट सत्र को हटाना चाहते हैं?" : "Are you sure you want to delete this study session?")) {
      setChatSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        saveChatSessionsToStorage(updated);
        return updated;
      });
      if (activeSessionId === sessionId) {
        handleStartNewChat();
      }
      setToastMessage('Session deleted');
      setTimeout(() => setToastMessage(null), 2000);
    }
  }, [targetLanguage, activeSessionId, handleStartNewChat, saveChatSessionsToStorage]);

  const handleSaveRenameSession = useCallback((sessionId: string) => {
    if (!editingSessionTitle.trim()) return;
    setChatSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, title: editingSessionTitle.trim() } : s);
      saveChatSessionsToStorage(updated);
      return updated;
    });
    setEditingSessionId(null);
    setEditingSessionTitle('');
    setToastMessage('Renamed chat session');
    setTimeout(() => setToastMessage(null), 2000);
  }, [editingSessionTitle, saveChatSessionsToStorage]);

  const handleClearAllHistory = useCallback(() => {
    if (confirm(targetLanguage === 'Hindi' ? "क्या आप सचमुच पूरा इतिहास मिटाना चाहते हैं?" : "Are you sure you want to permanently clear all study search history?")) {
      setChatSessions([]);
      saveChatSessionsToStorage([]);
      handleStartNewChat();
      setToastMessage('Cleared all study history');
      setTimeout(() => setToastMessage(null), 2500);
    }
  }, [targetLanguage, handleStartNewChat, saveChatSessionsToStorage]);

  const handleRestoreSession = useCallback((session: typeof chatSessions[0]) => {
    setAiMessages(session.messages);
    setActiveSessionId(session.id);
    setShowHistory(false);
    setToastMessage('Restored study session!');
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const aiChatScrollRef = useRef<HTMLDivElement | null>(null);

  const copyMessageToClipboard = useCallback((msg: { id: string; text: string }) => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopiedMessageId(msg.id);
      setToastMessage('Copied response to clipboard!');
      setTimeout(() => {
        setCopiedMessageId(null);
        setToastMessage(null);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy message:", err);
    });
  }, []);

  const speakMessageAloud = useCallback((msg: { id: string; text: string }) => {
    if (isPlayingVoice === msg.id) {
      stopSpeaking();
      setIsPlayingVoice(null);
    } else {
      stopSpeaking();
      setIsPlayingVoice(msg.id);
      const codeMap: Record<string, LanguageCode> = {
        'English': 'en',
        'Hindi': 'hi',
        'Gujarati': 'gu',
        'Marathi': 'mr',
        'Tamil': 'ta',
        'Telugu': 'te',
      };
      const speechLang = codeMap[targetLanguage] || 'en';
      speakText(
        msg.text,
        speechLang,
        'AI Solver',
        '🤖 AI Solver Chatbot',
        () => setIsPlayingVoice(null)
      );
    }
  }, [isPlayingVoice, targetLanguage]);

  const exportMessageToPDF = useCallback((msg: { id: string; sender: 'user' | 'assistant'; text: string; timestamp: string }) => {
    let userQuestion = "";
    const idx = aiMessages.findIndex(m => m.id === msg.id);
    if (idx > 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (aiMessages[i].sender === 'user') {
          userQuestion = aiMessages[i].text;
          break;
        }
      }
    }

    const codeMap: Record<string, LanguageCode> = {
      'English': 'en',
      'Hindi': 'hi',
      'Gujarati': 'gu',
      'Marathi': 'mr',
      'Tamil': 'ta',
      'Telugu': 'te',
    };
    const speechLang = codeMap[targetLanguage] || 'en';

    speakText(
      targetLanguage === 'Hindi' 
        ? "आपका अध्ययन समाधान PDF तैयार किया जा रहा है..." 
        : "Preparing your study solution report PDF...",
      speechLang
    );

    setPdfExportMessage(msg);
    setPdfExportQuestion(userQuestion);
    setIsExportingPDF(true);

    setTimeout(() => {
      const element = document.getElementById("pdf-canvas-viewer-render-template");
      if (!element) {
        setIsExportingPDF(false);
        setPdfExportMessage(null);
        return;
      }

      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const printWidth = pageWidth - (margin * 2);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const printHeight = printWidth * (canvasHeight / canvasWidth);

        if (printHeight <= pageHeight - (margin * 2)) {
          pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);
        } else {
          let heightLeft = printHeight;
          let position = margin;

          pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
          heightLeft -= (pageHeight - margin * 2);

          while (heightLeft > 0) {
            position = heightLeft - printHeight + margin;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight);
            heightLeft -= pageHeight;
          }
        }

        pdf.save(`GyaanBot_AI_Solver_Page_${activePageNum}.pdf`);
        setToastMessage('Downloaded Solution PDF!');
        setTimeout(() => setToastMessage(null), 3000);
      }).catch(err => {
        console.error("Failed to generate PDF:", err);
        setToastMessage('Failed to download PDF');
        setTimeout(() => setToastMessage(null), 3000);
      }).finally(() => {
        setIsExportingPDF(false);
        setPdfExportMessage(null);
      });
    }, 250);
  }, [aiMessages, activePageNum, targetLanguage]);

  const handleClearChat = useCallback(() => {
    setAiMessages([
      {
        id: 'ai-welcome-' + Date.now(),
        sender: 'assistant',
        text: `Chat cleared. Hello! I am your **AI Study Task Assistant** for **${fileName}**. How can I help you with Page ${activePageNum}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setReplyingTo(null);
    setToastMessage('Chat history cleared');
    setTimeout(() => setToastMessage(null), 2500);
  }, [fileName, activePageNum]);

  const handleRegenerateLast = useCallback(() => {
    const lastUserMsg = [...aiMessages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      handleRunAiTask('chat', lastUserMsg.text);
    }
  }, [aiMessages]);

  const [pageInputVal, setPageInputVal] = useState<string>('1');
  const [isEditingPageInput, setIsEditingPageInput] = useState<boolean>(false);

  // Hand / Pan Tool mode state
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isMouseDownDragging, setIsMouseDownDragging] = useState<boolean>(false);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // Keep page input synced with active page when user is not actively editing
  useEffect(() => {
    if (!isEditingPageInput) {
      setPageInputVal(String(activePageNum));
    }
  }, [activePageNum, isEditingPageInput]);

  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const setPageRef = useCallback((page: number, el: HTMLDivElement | null) => {
    pageRefs.current[page] = el;
  }, []);

  const handlePageVisible = useCallback((page: number) => {
    setActivePageNum(page);
  }, []);

  // Jump to page helper
  const jumpToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, numPages || page));
    const element = pageRefs.current[targetPage];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [numPages]);

  const handlePageInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsEditingPageInput(false);
    const parsedPage = parseInt(pageInputVal, 10);
    if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= (numPages || 1)) {
      jumpToPage(parsedPage);
    } else {
      setPageInputVal(String(activePageNum));
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mouse pan drag handlers
  const handleMouseDownOnViewport = (e: React.MouseEvent) => {
    // Enable pan on left click when in Pan Mode OR middle mouse click anytime
    if ((isPanMode && e.button === 0) || e.button === 1) {
      if (!scrollContainerRef.current) return;
      isDraggingRef.current = true;
      setIsMouseDownDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop
      };
      e.preventDefault();
    }
  };

  const handleMouseMoveOnViewport = (e: React.MouseEvent) => {
    if (isDraggingRef.current && scrollContainerRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    }
  };

  const handleMouseUpOnViewport = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsMouseDownDragging(false);
    }
  };

  // Ctrl + Wheel / Trackpad pinch zoom listener on the container
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setScale(prev => Math.min(3.0, Math.max(0.4, Number((prev + delta).toFixed(2)))));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Multi-touch pinch zoom for mobile and tablets
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartDistRef.current = dist;
        touchStartScaleRef.current = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistRef.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDistRef.current;
        const newScale = Math.min(3.0, Math.max(0.4, Number((touchStartScaleRef.current * factor).toFixed(2))));
        setScale(newScale);
      }
    };

    const handleTouchEnd = () => {
      touchStartDistRef.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (activePageNum > 1) jumpToPage(activePageNum - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (activePageNum < (numPages || 1)) jumpToPage(activePageNum + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        jumpToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (numPages > 0) jumpToPage(numPages);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key.toLowerCase() === 'h') {
        setIsPanMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePageNum, numPages, jumpToPage]);

  // Selection change listener for Floating Copy & AI Popover Menu
  useEffect(() => {
    const updateSelectionState = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelectedText('');
        setSelectionPos(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length > 1) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect && (rect.width > 0 || rect.height > 0)) {
            const clean = cleanPdfExtractedText(text);
            setSelectedText(clean);

            const estimatedPopupWidth = 295;
            const estimatedPopupHeight = 44;
            const rawX = rect.left + rect.width / 2 - estimatedPopupWidth / 2;
            const clampedX = Math.max(12, Math.min(window.innerWidth - estimatedPopupWidth - 12, rawX));

            // If selection is near top of screen (or navbar), show popup below selection
            let posY = rect.top - estimatedPopupHeight - 10;
            if (posY < 64) {
              posY = rect.bottom + 10;
            }
            const clampedY = Math.max(10, Math.min(window.innerHeight - estimatedPopupHeight - 12, posY));

            setSelectionPos({
              x: clampedX,
              y: clampedY,
            });
          } else {
            setSelectedText('');
            setSelectionPos(null);
          }
        } catch {
          setSelectedText('');
          setSelectionPos(null);
        }
      } else {
        setSelectedText('');
        setSelectionPos(null);
      }
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectedText('');
        setSelectionPos(null);
      }
    };

    const handleMouseUpOrTouchEnd = () => {
      // Small timeout to allow browser selection range to settle
      setTimeout(updateSelectionState, 20);
    };

    // When clicking outside the selection menu, if selection is gone or collapsed, clear immediately
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // If user clicked inside the popup itself, allow button action
      if (target && target.closest('[data-selection-popup="true"]')) {
        return;
      }

      // Check current selection
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectedText('');
        setSelectionPos(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUpOrTouchEnd);
    document.addEventListener('touchend', handleMouseUpOrTouchEnd);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUpOrTouchEnd);
      document.removeEventListener('touchend', handleMouseUpOrTouchEnd);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  // Fit width calculation
  const handleFitWidth = useCallback(() => {
    if (scrollContainerRef.current && pageSize.width > 0) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      if (containerWidth > 0) {
        const paddingX = containerWidth < 640 ? 16 : 48;
        const fitScale = (containerWidth - paddingX) / pageSize.width;
        setScale(Math.max(0.5, Math.min(fitScale, 2.5)));
      }
    }
  }, [pageSize.width]);

  useEffect(() => {
    if (!loading && pdfDoc) {
      const timer = setTimeout(() => {
        handleFitWidth();
      }, 150);

      const handleResize = () => handleFitWidth();
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [loading, pdfDoc, handleFitWidth]);

  // Load PDF Engine with high-performance caching
  useEffect(() => {
    let isMounted = true;

    // For AI generated files, bypass PDF.js canvas engine since Smart Reader handles rendering directly
    if (isAiGen) {
      setLoading(false);
      return;
    }

    // Check memory cache first for 0ms instant loading
    const cacheKey = fileDataUrl ? `url_${fileDataUrl.slice(0, 100)}_${fileDataUrl.length}` : `id_${fileId}`;
    if (pdfDocCache.has(cacheKey)) {
      const cached = pdfDocCache.get(cacheKey)!;
      setPageSize({ width: cached.width, height: cached.height });
      setPdfDoc(cached.pdf);
      setNumPages(cached.numPages);
      setActivePageNum(1);
      setLoading(false);
      return;
    }

    const loadPdfJs = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF.js script from CDN'));
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }

        if (isMounted) {
          await loadPdfFile();
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`Library Load Error: ${err.message || err}`);
          setLoading(false);
        }
      }
    };

    const loadPdfFile = async () => {
      try {
        setLoading(true);
        setError(null);

        let dataUrlToUse = fileDataUrl;
        if (!dataUrlToUse) {
          dataUrlToUse = await onGetFileLocal(fileId) || undefined;
        }

        if (!dataUrlToUse) {
          throw new Error('PDF file stream not found. Please try re-uploading the file.');
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library could not be loaded.');
        }

        let loadingTask: any = null;

        if (dataUrlToUse.startsWith('http://') || dataUrlToUse.startsWith('https://') || dataUrlToUse.startsWith('blob:')) {
          loadingTask = pdfjsLib.getDocument({ url: dataUrlToUse });
        } else if (dataUrlToUse.startsWith('data:')) {
          const base64Parts = dataUrlToUse.split(',');
          if (base64Parts.length < 2) {
            throw new Error('Corrupted PDF file stream payload.');
          }

          const base64 = base64Parts[1].replace(/[\s\r\n]/g, '');
          const binaryString = atob(base64);
          const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          loadingTask = pdfjsLib.getDocument({ url: blobUrl });
        } else {
          loadingTask = pdfjsLib.getDocument({ url: dataUrlToUse });
        }

        const pdf = await loadingTask.promise;

        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });

        // Store into memory cache
        pdfDocCache.set(cacheKey, {
          pdf,
          width: viewport.width,
          height: viewport.height,
          numPages: pdf.numPages
        });

        if (isMounted) {
          setPageSize({ width: viewport.width, height: viewport.height });
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setActivePageNum(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("Primary PDF loading failed:", err);
        if (isMounted) {
          setError(err.message || 'Error processing the PDF document stream.');
          setLoading(false);
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
    };
  }, [fileId, fileDataUrl]);

  // Indexing text for searching and AI tasks
  useEffect(() => {
    if (!pdfDoc) return;
    let isMounted = true;
    setIndexingText(true);
    setPagesText([]);

    const indexPages = async () => {
      const extracted: { pageNum: number; text: string }[] = [];
      try {
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (!isMounted) break;
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          let text = textContent.items.map((item: any) => item.str).join(' ').trim();
          if (!text && fullContent) {
            text = getPageFallbackText(i, pdfDoc.numPages);
          }
          text = cleanPdfExtractedText(text);
          extracted.push({ pageNum: i, text });
        }
        if (isMounted) {
          setPagesText(extracted);
          setIndexingText(false);
          if (onPagesTextExtracted) {
            onPagesTextExtracted(extracted);
          }
        }
      } catch (err) {
        console.warn('Failed to extract PDF text layers:', err);
        if (isMounted) {
          if (fullContent) {
            const fallbackExtracted = Array.from({ length: pdfDoc.numPages }, (_, idx) => ({
              pageNum: idx + 1,
              text: getPageFallbackText(idx + 1, pdfDoc.numPages)
            }));
            setPagesText(fallbackExtracted);
          }
          setIndexingText(false);
        }
      }
    };

    indexPages();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc]);

  // Search logic handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchResultIndex(-1);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results: { pageNum: number; snippet: string }[] = [];

    pagesText.forEach(({ pageNum, text }) => {
      const index = text.toLowerCase().indexOf(lowerQuery);
      if (index !== -1) {
        const start = Math.max(0, index - 45);
        const end = Math.min(text.length, index + lowerQuery.length + 55);
        let snippet = text.substring(start, end).replace(/\s+/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        
        results.push({ pageNum, snippet });
      }
    });

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchResultIndex(0);
      jumpToPage(results[0].pageNum);
    } else {
      setCurrentSearchResultIndex(-1);
    }
  }, [pagesText, jumpToPage]);

  // Copy page / document helper
  const handleCopyPageText = (pageNum: number, text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied text of Page ${pageNum} to clipboard!`);
  };

  const handleCopyFullDocumentText = () => {
    const fullText = pagesText.map(p => `--- PAGE ${p.pageNum} ---\n${p.text}`).join('\n\n');
    if (!fullText) {
      triggerToast('Document text layer is still indexing, please try again in a moment.');
      return;
    }
    navigator.clipboard.writeText(fullText);
    triggerToast(`Copied complete text of all ${numPages} pages!`);
  };

  const handleCopySelectedText = () => {
    if (selectedText) {
      const cleanText = convertKrutiDevToUnicode(selectedText);
      navigator.clipboard.writeText(cleanText);
      triggerToast(`Copied selected text to clipboard!`);
      setSelectedText('');
      setSelectionPos(null);
    }
  };

  // AI Task execution handler
  const handleRunAiTask = async (
    taskType: 'translate_page' | 'translate_doc' | 'summarize_page' | 'summarize_doc' | 'solve_questions' | 'short_notes' | 'key_concepts' | 'quiz' | 'simplify' | 'explain_selection' | 'translate_selection' | 'chat',
    customPrompt?: string,
    targetPageNum?: number
  ) => {
    const pageNumToUse = targetPageNum || activePageNum;
    setAiLoading(true);
    setShowAiAssistant(true);

    const currentPageText = pagesText.find(p => p.pageNum === pageNumToUse)?.text || '';
    const fullDocText = pagesText.map(p => `[Page ${p.pageNum}]: ${p.text}`).join('\n').slice(0, 8000);

    let promptText = '';
    let userDisplayMsg = '';

    // Convert KrutiDev/ASCII font characters if selectedText contains legacy Indian PDF encoding
    const cleanSelection = selectedText ? convertKrutiDevToUnicode(selectedText) : '';

    switch (taskType) {
      case 'translate_page':
        userDisplayMsg = `Translate Page ${pageNumToUse} (${targetLanguage})`;
        promptText = `CRITICAL INSTRUCTION: You are a professional multilingual educational translator. Translate the entire text content of Page ${pageNumToUse} of the study material "${fileName}" into ${targetLanguage} ONLY. Do NOT output any introductory phrases in English. Do NOT mix English into the translated text except for standard scientific units or chemical formulas. Every single sentence and heading must be fully translated into ${targetLanguage}.\n\nPage Content to Translate:\n${currentPageText || fullDocText}`;
        break;
      case 'translate_doc':
        userDisplayMsg = `Translate PDF Document (${targetLanguage})`;
        promptText = `CRITICAL INSTRUCTION: You are a professional multilingual educational translator. Translate the key topics and content of the PDF document "${fileName}" into ${targetLanguage} ONLY. Do NOT output any conversational filler or English introduction. Every sentence, heading, and conclusion must be fully translated into ${targetLanguage}.\n\nDocument Content to Translate:\n${fullDocText}`;
        break;
      case 'summarize_page':
        userDisplayMsg = `Summarize Page ${pageNumToUse}`;
        promptText = `Please provide a clear, structured bulleted summary of Page ${pageNumToUse} of the study material "${fileName}" in ${targetLanguage === 'English' ? 'English' : `${targetLanguage} (Translate all summary points fully into ${targetLanguage})`}.\n\nPage Text Content:\n${currentPageText}`;
        break;
      case 'summarize_doc':
        userDisplayMsg = `Summarize entire PDF document`;
        promptText = `Please provide an executive summary, key takeaways, and chapter breakdown for the PDF study material "${fileName}" in ${targetLanguage === 'English' ? 'English' : `${targetLanguage} (Translate all points fully into ${targetLanguage})`}.\n\nDocument Content:\n${fullDocText}`;
        break;
      case 'solve_questions':
        userDisplayMsg = `Solve Questions on Page ${pageNumToUse}`;
        promptText = `Identify and solve all practice questions, exercises, or numerical problems found in Page ${pageNumToUse} of "${fileName}". Provide step-by-step solutions, formulas used, and final answers fully translated into ${targetLanguage}.\n\nPage Content:\n${currentPageText || fullDocText}`;
        break;
      case 'short_notes':
        userDisplayMsg = `Create Revision Short Notes for Page ${pageNumToUse}`;
        promptText = `Create concise, high-yield revision short notes, formula cheat sheet, and memory key points for Page ${pageNumToUse} of "${fileName}" fully written in ${targetLanguage}.\n\nPage Content:\n${currentPageText || fullDocText}`;
        break;
      case 'key_concepts':
        userDisplayMsg = `Extract key concepts & formulas (Page ${pageNumToUse})`;
        promptText = `Extract all key definitions, formulas, rules, and core concepts from Page ${pageNumToUse} of "${fileName}" fully presented in ${targetLanguage}.\n\nContext:\n${currentPageText || fullDocText}`;
        break;
      case 'quiz':
        userDisplayMsg = `Generate 5 Practice Questions (Page ${pageNumToUse})`;
        promptText = `Create 5 multiple choice questions (with options A, B, C, D and detailed correct answer explanations) based on Page ${pageNumToUse} of "${fileName}". All questions, options, and explanations must be written in ${targetLanguage}.\n\nContent:\n${currentPageText || fullDocText}`;
        break;
      case 'simplify':
        userDisplayMsg = `Simplify language for students (Page ${pageNumToUse})`;
        promptText = `Rewrite and explain the concepts in Page ${pageNumToUse} of "${fileName}" in simple, friendly, easy-to-understand language suitable for school students, fully written in ${targetLanguage}.\n\nContent:\n${currentPageText}`;
        break;
      case 'explain_selection': {
        const shortSnippet = cleanSelection.length > 55 ? `${cleanSelection.slice(0, 55)}...` : cleanSelection;
        const labels: Record<string, string> = {
          'Hindi': `चयनित पाठ स्पष्ट करें: "${shortSnippet}"`,
          'Gujarati': `પસંદ કરેલ લખાણ સ્પષ્ટ કરો: "${shortSnippet}"`,
          'Marathi': `निवडलेला मजकूर स्पष्ट करा: "${shortSnippet}"`,
          'Tamil': `தேர்ந்தெடுக்கப்பட்ட உரையை விளக்கவும்: "${shortSnippet}"`,
          'Telugu': `ఎంచుకున్న వచనాన్ని వివరించండి: "${shortSnippet}"`,
        };
        userDisplayMsg = labels[targetLanguage] || `Explain selected text: "${shortSnippet}"`;
        promptText = `Explain the following selected text excerpt from "${fileName}" (Page ${pageNumToUse}) in detail with simple analogies, written in ${targetLanguage}:\n\n"${cleanSelection}"\n\nFull Active Page Context:\n${currentPageText}`;
        break;
      }
      case 'translate_selection': {
        const shortSnippet = cleanSelection.length > 50 ? `${cleanSelection.slice(0, 50)}...` : cleanSelection;
        const labels: Record<string, string> = {
          'Hindi': `चयनित पाठ का अनुवाद करें: "${shortSnippet}"`,
          'Gujarati': `પસંદ કરેલ લખાણનું અનુવાદ કરો: "${shortSnippet}"`,
          'Marathi': `निवडलेल्या मजकुराचे भाषांतर करा: "${shortSnippet}"`,
          'Tamil': `தேர்ந்தெடுக்கப்பட்ட உரையை மொழிபெயர்க்கவும்: "${shortSnippet}"`,
          'Telugu': `ఎంచుకున్న వచనాన్ని అనువదించండి: "${shortSnippet}"`,
        };
        userDisplayMsg = labels[targetLanguage] || `Translate selected text into ${targetLanguage}: "${shortSnippet}"`;
        promptText = `CRITICAL INSTRUCTION: You are a professional translator. Translate the following selected text excerpt from "${fileName}" into ${targetLanguage} strictly and completely. Do NOT include any English introductory text, quotation marks, or English explanations. Return ONLY the direct translation in ${targetLanguage}.\n\nText to Translate:\n"${cleanSelection}"\n\nFull Active Page Context:\n${currentPageText}`;
        break;
      }
      case 'chat':
        userDisplayMsg = customPrompt || `Question about Page ${pageNumToUse}`;
        promptText = `Study Material Document: "${fileName}"\nActive Page: ${pageNumToUse}\n\nContext Page Text:\n${currentPageText}\n\nStudent Question: ${customPrompt}`;
        break;
    }

    if (replyingTo) {
      promptText = `[User is Replying to Previous Message (${replyingTo.sender === 'assistant' ? 'AI Solver' : 'Student'}): "${replyingTo.text}"]\n\n${promptText}`;
    }

    const currentReply = replyingTo;
    const newUserMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user' as const,
      text: userDisplayMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: currentReply ? { id: currentReply.id, sender: currentReply.sender, text: currentReply.text } : undefined
    };

    setAiMessages(prev => [...prev, newUserMsg]);
    setReplyingTo(null);

    try {
      const data = await safeFetchJson('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          prompt: promptText,
          systemInstruction: `You are GyaanBot's expert AI Solver Chatbot. Help the student understand the study material document "${fileName}". Provide clear, well-structured educational explanations with markdown formatting.`,
        })
      });

      if (data.text || data.success) {
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'assistant' as const,
          text: data.text || data.message || "Here is information based on the document.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.message || 'Failed to generate response');
      }
    } catch (err: any) {
      setAiMessages(prev => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'assistant',
          text: `I had trouble connecting to the AI Assistant engine: ${err.message || 'Network error'}. Please try again!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        if (aiChatScrollRef.current) {
          aiChatScrollRef.current.scrollTop = aiChatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [showZoomMenu, setShowZoomMenu] = useState<boolean>(false);

  // Smooth Zoom Controls with expanded range (0.35x to 3.0x) for rural students on varied screens
  const zoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.35));
  };

  const setZoomLevel = (newScale: number) => {
    setScale(Math.max(0.35, Math.min(3.0, Number(newScale.toFixed(2)))));
    setShowZoomMenu(false);
  };

  const fitWidth = useCallback(() => {
    if (scrollContainerRef.current && pageSize.width > 0) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      if (containerWidth > 0) {
        const paddingX = containerWidth < 640 ? 16 : 40;
        const targetScale = (containerWidth - paddingX) / pageSize.width;
        setScale(Math.max(0.35, Math.min(2.5, Number(targetScale.toFixed(2)))));
      }
    }
    setShowZoomMenu(false);
  }, [pageSize.width]);

  const fitPage = useCallback(() => {
    if (scrollContainerRef.current && pageSize.height > 0) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      if (containerHeight > 0) {
        const paddingY = containerHeight < 640 ? 40 : 80;
        const targetScale = (containerHeight - paddingY) / pageSize.height;
        setScale(Math.max(0.35, Math.min(2.0, Number(targetScale.toFixed(2)))));
      }
    }
    setShowZoomMenu(false);
  }, [pageSize.height]);

  const resetZoom = () => {
    setScale(1.0);
    setShowZoomMenu(false);
  };

  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  const pagesArray = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  const renderSnippetWithHighlights = (snippet: string, query: string) => {
    if (!query) return snippet;
    const parts = snippet.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-slate-950 rounded px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Toggle Save / Download to "My Material"
  const handleToggleSave = async () => {
    const nextSavedState = !isMaterialSaved;

    if (onToggleSave) {
      try {
        await onToggleSave();
      } catch (err) {
        console.warn("onToggleSave callback error:", err);
      }
      if (typeof isSaved !== 'boolean') {
        setInternalSaved(nextSavedState);
      }
    } else {
      // Local fallback persistence in browser localStorage and local DB cache
      try {
        const userMobile = user?.mobile || adminUser?.mobile || (user as any)?.id || 'student';
        const storageKey = `${userMobile}_downloaded_admin_pdfs`;
        const savedList: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        let updatedList: string[];
        if (savedList.includes(fileId)) {
          updatedList = savedList.filter((id) => id !== fileId);
          setInternalSaved(false);
        } else {
          updatedList = Array.from(new Set([...savedList, fileId]));
          setInternalSaved(true);
          if (fileDataUrl) {
            saveFileLocal(fileId, fileDataUrl).catch(() => {});
          }
        }
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Failed to toggle save locally:", err);
      }
    }

    setToastMessage(nextSavedState ? tPdf.savedToMaterial : tPdf.unsavedFromMaterial);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative w-full select-none">
      
      {/* Toast Feedback Popup */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Selection AI Menu Popover */}
      {selectedText && selectionPos && (
        <div
          data-selection-popup="true"
          style={{
            left: `${selectionPos.x}px`,
            top: `${selectionPos.y}px`,
            maxWidth: 'calc(100vw - 24px)',
          }}
          className="fixed z-50 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 text-white animate-fade-in select-none whitespace-nowrap overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => {
              handleCopySelectedText();
              window.getSelection()?.removeAllRanges();
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md whitespace-nowrap shrink-0"
            title="Copy Selected Text"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{targetLanguage === 'Hindi' ? 'कॉपी' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleRunAiTask('explain_selection');
              setSelectedText('');
              setSelectionPos(null);
            }}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md whitespace-nowrap shrink-0"
            title="Explain Selected Text with AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="whitespace-nowrap">{targetLanguage === 'Hindi' ? 'स्पष्ट करें' : 'Explain'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleRunAiTask('translate_selection');
              setSelectedText('');
              setSelectionPos(null);
            }}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md whitespace-nowrap shrink-0"
            title={`Translate Selected Text to ${targetLanguage}`}
          >
            <Languages className="w-3.5 h-3.5 text-purple-200 shrink-0" />
            <span className="whitespace-nowrap">{targetLanguage === 'Hindi' ? 'अनुवाद' : (tPdf.translate || 'Translate')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const codeMap: Record<string, LanguageCode> = {
                'English': 'en',
                'Hindi': 'hi',
                'Gujarati': 'gu',
                'Marathi': 'mr',
                'Tamil': 'ta',
                'Telugu': 'te',
              };
              const speechLang = codeMap[targetLanguage] || 'hi';
              speakText(cleanPdfExtractedText(selectedText), speechLang);
            }}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-cyan-300 hover:text-white cursor-pointer transition-colors shrink-0"
            title={`Read Selection Aloud (${targetLanguage})`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedText('');
              setSelectionPos(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Reader Control Panel - Highly Responsive & Elegant for Mobile & Desktop */}
      <div className="flex flex-col bg-slate-950 border-b border-slate-800 shrink-0 z-20">
        
        {/* ================= DESKTOP TOOLBAR (md and above) ================= */}
        <div className="hidden md:flex items-center justify-between px-2.5 lg:px-4 py-1.5 lg:py-2 text-xs text-slate-300 gap-1.5 lg:gap-2 shrink-0 overflow-x-auto no-scrollbar">
          
          {/* Left: Badge + Document Title + Reading/Page Navigation */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 min-w-0">
            {/* Mode Badge & Document Title */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-xl px-2 py-1 shadow-xs shrink-0 max-w-[130px] lg:max-w-[200px] xl:max-w-[320px]">
              {isAiGen ? (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[10px] lg:text-[11px] rounded-lg shadow-xs shrink-0">
                  <BookOpen className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                  <span className="hidden xl:inline">{tPdf.smartReader}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] lg:text-[11px] rounded-lg shrink-0 border border-emerald-500/30">
                  <FileText className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-400 shrink-0" />
                  <span>PDF</span>
                </div>
              )}
              
              {/* Prominent PDF Document Title */}
              <span 
                className="font-semibold text-slate-100 text-xs truncate select-text"
                title={fileName || (isAiGen ? 'Smart Study Notes' : 'PDF Document')}
              >
                {fileName || (isAiGen ? 'Smart Study Notes' : 'PDF Document')}
              </span>
            </div>

            {/* Smart Reader Theme Switcher (Desktop) */}
            {(isAiGen || viewMode === 'reader') && (
              <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5 shrink-0">
                <button
                  onClick={() => setReaderTheme('light')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    readerTheme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Light Theme"
                >
                  <Sun className="w-3 h-3" />
                  <span className="hidden xl:inline">{tPdf.light}</span>
                </button>
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    readerTheme === 'sepia' ? 'bg-[#ebd9b2] text-[#433422] shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sepia Theme"
                >
                  <BookText className="w-3 h-3" />
                  <span className="hidden xl:inline">{tPdf.sepia}</span>
                </button>
                <button
                  onClick={() => setReaderTheme('dark')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    readerTheme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dark Theme"
                >
                  <Moon className="w-3 h-3" />
                  <span className="hidden xl:inline">{tPdf.dark}</span>
                </button>
              </div>
            )}

            {/* Page Navigation Controls (Canvas Mode Only) */}
            {!isAiGen && viewMode === 'canvas' && (
              <div className="flex items-center gap-0.5 lg:gap-1 shrink-0">
                {/* First Page Shortcut */}
                <button
                  onClick={() => jumpToPage(1)}
                  disabled={activePageNum <= 1}
                  className="p-1 lg:p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white hidden xl:block"
                  title={tPdf.firstPage}
                >
                  <ChevronsLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => activePageNum > 1 && jumpToPage(activePageNum - 1)}
                  disabled={activePageNum <= 1}
                  className="p-1 lg:p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
                  title={tPdf.previousPage}
                >
                  <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </button>

                {/* Page Number Indicator / Direct Input */}
                <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 lg:px-2 py-0.5 rounded-xl border border-slate-800 shrink-0 whitespace-nowrap">
                  <span className="text-[10px] lg:text-[11px] font-bold text-slate-400 select-none hidden lg:inline">{tPdf.page}</span>
                  
                  <form onSubmit={handlePageInputSubmit} className="flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={numPages || 1}
                      value={pageInputVal}
                      onFocus={() => setIsEditingPageInput(true)}
                      onChange={(e) => setPageInputVal(e.target.value)}
                      onBlur={() => handlePageInputSubmit()}
                      className="w-9 lg:w-10 h-5 lg:h-6 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-lg text-center font-bold text-emerald-400 text-xs py-0 px-0.5 focus:outline-none transition-colors shadow-inner"
                      title="Type page number and press Enter"
                    />
                  </form>

                  <span className="text-slate-400 text-xs font-mono select-none flex items-center gap-0.5 whitespace-nowrap">
                    <span>/</span>
                    <strong className="text-slate-200 font-bold">{numPages || 1}</strong>
                  </span>
                </div>

                {/* Next Page */}
                <button
                  onClick={() => activePageNum < numPages && jumpToPage(activePageNum + 1)}
                  disabled={activePageNum >= numPages}
                  className="p-1 lg:p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
                  title={tPdf.nextPage}
                >
                  <ChevronRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </button>

                {/* Last Page Shortcut */}
                <button
                  onClick={() => numPages > 0 && jumpToPage(numPages)}
                  disabled={activePageNum >= numPages}
                  className="p-1 lg:p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white hidden xl:block"
                  title={`${tPdf.lastPage} (Page ${numPages})`}
                >
                  <ChevronsRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </button>

                {/* Hand Tool / Text Select Tool Toggle */}
                <button
                  onClick={() => setIsPanMode(!isPanMode)}
                  className={`p-1 lg:p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    isPanMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                  }`}
                  title={isPanMode ? `${tPdf.handTool}` : `${tPdf.selectText}`}
                >
                  {isPanMode ? <Hand className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
                  <span className="hidden 2xl:inline">{isPanMode ? tPdf.handTool : tPdf.selectText}</span>
                </button>
              </div>
            )}
          </div>

          {/* Center: Search Field (Standard PDFs only) */}
          {!isAiGen && (
            <div className="hidden xl:flex items-center gap-1.5 flex-1 max-w-[200px] 2xl:max-w-xs min-w-[120px] relative mx-1">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={tPdf.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-6 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {indexingText && (
                <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin shrink-0" />
              )}
            </div>
          )}

          {/* Right Side: Zoom Controls + Action Buttons */}
          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
            {/* Zoom Controls Pill (Standard PDFs in Canvas Mode) */}
            {!isAiGen && viewMode === 'canvas' && (
              <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  title={tPdf.zoomOut}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                
                <button
                  onClick={() => setShowZoomMenu(!showZoomMenu)}
                  className="px-1.5 lg:px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white font-bold cursor-pointer rounded transition-colors"
                  title="Click for Zoom Presets"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  onClick={zoomIn}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  title={tPdf.zoomIn}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>

                {/* Fit Width Quick Button */}
                <button
                  onClick={fitWidth}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-300 cursor-pointer"
                  title={tPdf.fitWidth}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>

                {/* Zoom Presets Dropdown */}
                {showZoomMenu && (
                  <div className="absolute top-full right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 min-w-[120px] animate-fade-in text-xs">
                    <button
                      onClick={fitWidth}
                      className="px-2.5 py-1 text-left text-emerald-400 hover:bg-slate-900 rounded-lg font-bold flex items-center justify-between"
                    >
                      <span>{tPdf.fitWidth}</span>
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={fitPage}
                      className="px-2.5 py-1 text-left text-slate-300 hover:bg-slate-900 rounded-lg"
                    >
                      {tPdf.fitPage}
                    </button>
                    <div className="h-px bg-slate-800 my-0.5" />
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((lvl) => (
                      <button
                        key={`zoom-lvl-${lvl}`}
                        onClick={() => setZoomLevel(lvl)}
                        className={`px-2.5 py-1 text-left rounded-lg font-mono flex items-center justify-between ${
                          Math.round(scale * 100) === Math.round(lvl * 100)
                            ? 'bg-purple-950/60 text-purple-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span>{Math.round(lvl * 100)}%</span>
                        {Math.round(scale * 100) === Math.round(lvl * 100) && <Check className="w-3 h-3 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Task Assistant Toggle Button */}
            <button
              onClick={() => setShowAiAssistant(!showAiAssistant)}
              className={`px-2.5 lg:px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shrink-0 ${
                showAiAssistant
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md hover:shadow-purple-900/30'
              }`}
              title={tPdf.aiSolverTitle}
            >
              <Bot className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="hidden lg:inline">{tPdf.aiSolver}</span>
              <span className="lg:hidden">AI</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadSmartReader}
              disabled={isDownloadingPdf}
              className="px-2.5 lg:px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all text-xs shrink-0 active:scale-95 hover:shadow-rose-900/30"
              title={tPdf.downloadPdf}
            >
              {isDownloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden lg:inline">{tPdf.downloadPdf}</span>
              <span className="lg:hidden">PDF</span>
            </button>

            {/* Save to Saved Material Button */}
            <button
              onClick={handleToggleSave}
              className={`px-2.5 lg:px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border transition-all text-xs shrink-0 active:scale-95 ${
                isMaterialSaved
                  ? 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-300 border-amber-500/60 shadow-xs'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isMaterialSaved ? tPdf.saved : tPdf.save}
            >
              <Star
                className={`h-3.5 w-3.5 transition-transform ${
                  isMaterialSaved
                    ? 'text-amber-400 fill-amber-400 scale-110'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="hidden xl:inline">{isMaterialSaved ? tPdf.saved : tPdf.save}</span>
            </button>

            {/* Close PDF Viewer Button */}
            {(onClose || onNavigateBack) && (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  else if (onNavigateBack) onNavigateBack();
                }}
                className="me-5 px-2.5 lg:px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 hover:text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-rose-500/50 transition-colors text-xs shrink-0"
                title={tPdf.closePdf}
              >
                <X className="h-3.5 w-3.5 text-rose-400" />
                <span>{tPdf.close}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= MOBILE TOOLBAR (below md) ================= */}
        <div className="flex md:hidden flex-col">
          {/* Top Row: Title + Essential Action Buttons */}
          <div className="flex items-center justify-between px-2.5 py-1.5 gap-1.5 border-b border-slate-800/80">
            {/* Title with Mode Icon */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
              {isAiGen ? (
                <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span 
                className="font-bold text-slate-100 text-xs truncate"
                title={fileName || (isAiGen ? 'Smart Study Notes' : 'PDF Document')}
              >
                {fileName || (isAiGen ? 'Smart Study Notes' : 'PDF Document')}
              </span>
            </div>

            {/* Mobile Actions Group */}
            <div className="flex items-center gap-1 shrink-0">
              {/* AI Assistant */}
              <button
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className={`p-1.5 sm:px-2.5 sm:py-1 font-bold rounded-lg flex items-center gap-1 text-xs cursor-pointer transition-all shrink-0 ${
                  showAiAssistant
                    ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                }`}
                title={tPdf.aiSolverTitle}
              >
                <Bot className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="text-[11px]">AI</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadSmartReader}
                disabled={isDownloadingPdf}
                className="p-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg cursor-pointer shadow-xs transition-colors shrink-0"
                title={tPdf.downloadPdf}
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Save */}
              <button
                onClick={handleToggleSave}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isMaterialSaved
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={isMaterialSaved ? tPdf.saved : tPdf.save}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    isMaterialSaved ? 'text-amber-400 fill-amber-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Close */}
              {(onClose || onNavigateBack) && (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    else if (onNavigateBack) onNavigateBack();
                  }}
                  className="me-5 p-1.5 bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 hover:text-white rounded-lg border border-rose-500/40 cursor-pointer transition-colors shrink-0"
                  title={tPdf.closePdf}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Controls for Smart Reader / Canvas Mode */}
          <div className="me-5 flex items-center justify-between px-2.5 py-1 text-xs text-slate-300 gap-1.5 bg-slate-900/60">
            {/* Smart Reader Theme Switches on Mobile */}
            {(isAiGen || viewMode === 'reader') && (
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] text-slate-400 font-semibold">{tPdf.smartReader}:</span>
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                      readerTheme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    {tPdf.light}
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                      readerTheme === 'sepia' ? 'bg-[#ebd9b2] text-[#433422] shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    {tPdf.sepia}
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                      readerTheme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    {tPdf.dark}
                  </button>
                </div>
              </div>
            )}

            {/* Standard PDF Navigation & Zoom on Mobile */}
            {!isAiGen && viewMode === 'canvas' && (
              <div className="flex items-center justify-between w-full">
                {/* Compact Page Navigator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => activePageNum > 1 && jumpToPage(activePageNum - 1)}
                    disabled={activePageNum <= 1}
                    className="p-1 hover:bg-slate-800 rounded-lg disabled:opacity-20 text-slate-400 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {activePageNum}/{numPages || 1}
                  </span>
                  <button
                    onClick={() => activePageNum < numPages && jumpToPage(activePageNum + 1)}
                    disabled={activePageNum >= numPages}
                    className="p-1 hover:bg-slate-800 rounded-lg disabled:opacity-20 text-slate-400 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Zoom & Search Controls on Mobile */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={zoomOut}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <span className="px-1 text-[10px] font-mono font-bold text-slate-300">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 cursor-pointer"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      isMobileSearchOpen || searchQuery
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                    title="Search word"
                  >
                    <Search className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Expandable Mobile Search Bar */}
        {!isAiGenerated && isMobileSearchOpen && (
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 lg:hidden animate-fade-in">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search word in document..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentSearchResultIndex + 1}/{searchResults.length}
                </span>
                <button
                  onClick={() => {
                    const nextIdx = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
                    setCurrentSearchResultIndex(nextIdx);
                    jumpToPage(searchResults[nextIdx].pageNum);
                  }}
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    const nextIdx = (currentSearchResultIndex + 1) % searchResults.length;
                    setCurrentSearchResultIndex(nextIdx);
                    jumpToPage(searchResults[nextIdx].pageNum);
                  }}
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: PDF Viewport + Mobile/Desktop AI Assistant */}
      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
        
        {/* Search Results Left Sidebar (Desktop) */}
        {searchQuery.trim() !== '' && (
          <div className="w-72 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col shrink-0 h-full overflow-hidden z-10">
            <div className="p-3 border-b border-slate-850 flex items-center justify-between shrink-0">
              <span className="font-bold text-slate-200 text-xs">Search Matches ({searchResults.length})</span>
              <button onClick={() => handleSearch('')} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No matching words found</div>
              ) : (
                searchResults.map((result, idx) => {
                  const isActive = idx === currentSearchResultIndex;
                  return (
                    <button
                      key={`res-${idx}`}
                      onClick={() => {
                        setCurrentSearchResultIndex(idx);
                        jumpToPage(result.pageNum);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/50 border-emerald-700/50 text-slate-100 font-medium'
                          : 'bg-slate-900/40 border-slate-900 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-emerald-400 font-bold mb-1">Page {result.pageNum}</div>
                      <p className="line-clamp-2 leading-relaxed">{renderSnippetWithHighlights(result.snippet, searchQuery)}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Central PDF Canvas or Smart Reader Viewport */}
        {isAiGen || viewMode === 'reader' ? (
          <div className="flex-1 overflow-hidden min-h-0 relative w-full flex flex-col bg-slate-950">
            <SmartReaderView
              title={fileName.replace(/\.pdf$/i, '')}
              subject={lang?.toUpperCase() || 'Study Material'}
              std="Student Edition"
              language={targetLanguage}
              content={fullContent || pagesText.map(p => `## Page ${p.pageNum}\n\n${p.text}`).join('\n\n')}
              fontSize={readerFontSize}
              theme={readerTheme}
              searchQuery={searchQuery}
              onCopyAll={() => {
                const allText = fullContent || pagesText.map(p => p.text).join('\n\n');
                navigator.clipboard.writeText(allText);
                triggerToast('📋 Copied full document text!');
              }}
              onToast={triggerToast}
              onAskAi={(prompt) => handleRunAiTask('chat', prompt)}
              onDownloadPdf={handleDownloadSmartReader}
            />
          </div>
        ) : (
          /* Central PDF Canvas Viewport with Virtualized Rendering & Smooth Pan Controls */
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDownOnViewport}
            onMouseMove={handleMouseMoveOnViewport}
            onMouseUp={handleMouseUpOnViewport}
            onMouseLeave={handleMouseUpOnViewport}
            className={`flex-1 overflow-auto bg-slate-950 flex flex-col items-center gap-6 sm:gap-8 py-4 sm:py-8 px-2 sm:px-4 scrollbar-thin select-text min-h-0 relative w-full ${
              isPanMode
                ? isMouseDownDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-default'
            }`}
            style={{ height: '100%', touchAction: isPanMode ? 'none' : 'auto' }}
          >
            {/* Floating Left Page Arrow (Quick device accessible navigation) */}
            {activePageNum > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToPage(activePageNum - 1);
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-slate-900/90 hover:bg-purple-600 text-slate-300 hover:text-white rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hidden sm:flex items-center justify-center group opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
                title="Previous Page (Arrow Left)"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}

            {/* Floating Right Page Arrow (Quick device accessible navigation) */}
            {activePageNum < numPages && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToPage(activePageNum + 1);
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-slate-900/90 hover:bg-purple-600 text-slate-300 hover:text-white rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hidden sm:flex items-center justify-center group opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
                title="Next Page (Arrow Right)"
              >
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {loading ? (
              <div className="my-auto flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                <span className="font-mono text-xs text-slate-400 font-bold">Rendering Document...</span>
              </div>
            ) : error ? (
              <div className="my-auto max-w-md bg-rose-950/40 border border-rose-900/30 p-6 rounded-2xl text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                <p className="text-xs text-slate-300">{error}</p>
                <button onClick={onDownload} className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold">
                  Download PDF
                </button>
              </div>
            ) : (
              pagesArray.map((pageNum) => {
                const activeMatch = searchResults[currentSearchResultIndex];
                return (
                  <PdfPageItem
                    key={`${fileId}-p-${pageNum}`}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    scale={scale}
                    rotation={rotation}
                    pageSize={pageSize}
                    searchQuery={searchQuery}
                    currentActiveMatchPage={activeMatch?.pageNum}
                    activeMatchSnippet={activeMatch?.snippet}
                    fallbackText={getPageFallbackText(pageNum, numPages)}
                    onPageVisible={handlePageVisible}
                    setRef={setPageRef}
                    onCopyPageText={handleCopyPageText}
                    onTranslatePage={(pg) => handleRunAiTask('translate_page', undefined, pg)}
                    onSummarizePage={(pg) => handleRunAiTask('summarize_page', undefined, pg)}
                    onSolveQuestions={(pg) => handleRunAiTask('solve_questions', undefined, pg)}
                    onShortNotes={(pg) => handleRunAiTask('short_notes', undefined, pg)}
                    onAskAiPage={(pg) => handleRunAiTask('chat', `Can you explain the key concepts on Page ${pg}?`, pg)}
                  />
                );
              })
            )}

            {/* Floating Quick Navigation & Zoom HUD (Designed for All Devices - Mobile, Tablet, Desktop) */}
            <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 text-white animate-fade-in">
              {/* Prev Page Button */}
              <button
                onClick={() => activePageNum > 1 && jumpToPage(activePageNum - 1)}
                disabled={activePageNum <= 1}
                className="p-1.5 hover:bg-slate-800 disabled:opacity-20 rounded-xl text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page indicator */}
              <span className="text-[11px] font-mono font-bold text-slate-300 px-1 select-none">
                {activePageNum} / {numPages || 1}
              </span>

              {/* Next Page Button */}
              <button
                onClick={() => activePageNum < numPages && jumpToPage(activePageNum + 1)}
                disabled={activePageNum >= numPages}
                className="p-1.5 hover:bg-slate-800 disabled:opacity-20 rounded-xl text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-0.5" />

              {/* Hand Pan Tool Toggle */}
              <button
                onClick={() => setIsPanMode(!isPanMode)}
                className={`p-1.5 rounded-xl cursor-pointer active:scale-95 transition-all ${
                  isPanMode
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isPanMode ? "Hand Pan Mode (Active)" : "Switch to Hand Pan Tool"}
              >
                <Hand className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-0.5" />

              {/* Zoom Out */}
              <button
                onClick={zoomOut}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Fit Width */}
              <button
                onClick={fitWidth}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 cursor-pointer flex items-center gap-1 transition-all"
                title="Click to Fit to Width"
              >
                <span>{Math.round(scale * 100)}%</span>
                <Maximize2 className="w-3 h-3 text-slate-400" />
              </button>

              {/* Zoom In */}
              <button
                onClick={zoomIn}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-0.5" />

              {/* Rotate */}
              <button
                onClick={rotate}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* AI Task Assistant Panel (Desktop Sidebar with Drag-Resize or Fullscreen Mobile Showcase) */}
        {showAiAssistant && (
          <div
            id="pdf-ai-solver-panel"
            style={
              aiPanelMode === 'split'
                ? {
                    width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${aiPanelWidth}px` : '100%',
                    maxWidth: '100%',
                  }
                : { width: '100%', maxWidth: '100%' }
            }
            className={`${
              aiPanelMode === 'fullscreen'
                ? 'absolute inset-0 z-40 bg-slate-950 flex flex-col w-full h-full max-w-full overflow-hidden animate-fade-in'
                : 'absolute inset-0 md:static md:relative bg-slate-950 border-l md:border-slate-800 flex flex-col w-full md:w-auto shrink-0 h-full overflow-hidden z-40 md:z-30 shadow-2xl animate-fade-in max-w-full'
            }`}
          >
            {/* Visual Drag Handle for Resizing when in Split View */}
            {aiPanelMode === 'split' && (
              <div
                onMouseDown={handleResizeMouseDown}
                onTouchStart={handleResizeTouchStart}
                className={`hidden md:flex absolute top-0 bottom-0 -left-1.5 w-3 hover:w-4 items-center justify-center z-50 cursor-col-resize group transition-all select-none ${
                  isResizingActive ? 'bg-purple-600 w-4' : 'bg-transparent hover:bg-purple-600/30'
                }`}
                title="Drag to resize AI Solver Chatbot"
              >
                <div className={`w-1 h-12 rounded-full transition-colors ${
                  isResizingActive ? 'bg-white shadow-md' : 'bg-slate-600 group-hover:bg-purple-400'
                }`} />
              </div>
            )}

            {/* AI Assistant Header with Showcase/Restore Controls, Width Presets, and Close */}
            <div className="p-2 sm:p-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 gap-1.5 sm:gap-2 select-none w-full min-w-0">
              {/* Left Title & Mobile Back */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
                <button
                  type="button"
                  onClick={() => setShowAiAssistant(false)}
                  className="px-2 py-1 bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 rounded-xl text-purple-200 hover:text-white cursor-pointer md:hidden flex items-center gap-0.5 shrink-0 transition-colors shadow-xs"
                  title="Back to PDF"
                >
                  <ChevronLeft className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-bold font-sans">PDF</span>
                </button>
                <div className="p-1 sm:p-1.5 bg-purple-600/30 rounded-xl border border-purple-500/30 text-purple-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0 shrink">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1 truncate">
                    <span>AI Solver</span>
                    <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">
                    {targetLanguage} • {aiPanelMode === 'fullscreen' ? 'Full' : `Page ${activePageNum}`}
                  </span>
                </div>
              </div>

              {/* Header Controls: Clean Responsive Actions & Utilities */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Download Full Chat PDF Button */}
                {aiMessages.some(m => m.sender === 'user') && !showHistory && (
                  <button
                    type="button"
                    onClick={() => handleExportFullChatPDF()}
                    className="px-2 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                    title={targetLanguage === 'Hindi' ? "सम्पूर्ण चैट PDF डाउनलोड करें" : "Download Full Chat PDF"}
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:inline">
                      {targetLanguage === 'Hindi' ? 'सम्पूर्ण चैट PDF' : 'Full PDF'}
                    </span>
                  </button>
                )}

                {/* History / Active Chat Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-1.5 sm:px-2 sm:py-1 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 ${
                    showHistory
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/20'
                  }`}
                  title={showHistory ? 'Back to Active Chat' : 'Search & Session History'}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {showHistory ? (targetLanguage === 'Hindi' ? 'संवाद' : 'Chat') : (targetLanguage === 'Hindi' ? 'इतिहास' : 'History')}
                  </span>
                </button>

                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="p-1.5 sm:px-2 sm:py-1 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                  title="Start New Chat Session"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">New Chat</span>
                </button>

                {/* Utilities Toolbar Group */}
                <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 shrink-0 gap-0.5 me-5">
                  {/* Width Presets (Desktop Split Mode) */}
                  {aiPanelMode === 'split' && (
                    <div className="hidden 2xl:flex items-center border-r border-slate-800 pr-1 mr-0.5 text-[10px] font-mono gap-0.5">
                      <button
                        type="button"
                        onClick={() => setAiPanelWidth(340)}
                        className={`px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                          aiPanelWidth <= 360 ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Compact (340px)"
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPanelWidth(500)}
                        className={`px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                          aiPanelWidth > 360 && aiPanelWidth <= 560 ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Medium (500px)"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPanelWidth(720)}
                        className={`px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                          aiPanelWidth > 560 ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Wide (720px)"
                      >
                        Wide
                      </button>
                    </div>
                  )}

                  {/* Showcase Fullscreen Toggle (Hidden on mobile) */}
                  <button
                    type="button"
                    onClick={() => setAiPanelMode(prev => prev === 'fullscreen' ? 'split' : 'fullscreen')}
                    className={`p-1 rounded-lg text-xs font-bold hidden md:flex items-center gap-1 cursor-pointer transition-all ${
                      aiPanelMode === 'fullscreen'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={aiPanelMode === 'fullscreen' ? 'Restore Split View' : 'Showcase Fullscreen'}
                  >
                    {aiPanelMode === 'fullscreen' ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Regenerate Last Answer Button */}
                  {aiMessages.some(m => m.sender === 'user') && (
                    <button
                      type="button"
                      onClick={handleRegenerateLast}
                      disabled={aiLoading}
                      className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                      title="Regenerate Last Answer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Clear Chat History Button */}
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setShowAiAssistant(false)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Close AI Assistant"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick AI Task Actions Section with Show/Hide Toggle */}
            <div className="bg-slate-900/95 border-b border-slate-800 shrink-0 w-full min-w-0">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 bg-slate-950/40 w-full">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 select-none">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quick AI Tasks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAiTools((prev) => !prev)}
                  className="me-5 px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-all border border-slate-800 select-none shrink-0"
                  title={showQuickAiTools ? 'Hide Quick Actions' : 'Show Quick Actions'}
                >
                  <span>{showQuickAiTools ? 'Hide' : 'Show'}</span>
                  {showQuickAiTools ? (
                    <ChevronUp className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>

              {showQuickAiTools && (
                <div className="p-2 sm:p-2.5 animate-fade-in">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1. Solve Page Questions */}
                    <button
                      onClick={() => handleRunAiTask('solve_questions')}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
                      title="Solve all questions on active page"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Solve Questions</span>
                    </button>

                    {/* 2. Key Formulas */}
                    <button
                      onClick={() => handleRunAiTask('key_concepts')}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
                      title="Extract key formulas & concepts"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Key Formulas</span>
                    </button>

                    {/* 3. Practice Quiz */}
                    <button
                      onClick={() => handleRunAiTask('quiz')}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
                      title="Generate 5 practice questions"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>5 Practice Quiz</span>
                    </button>

                    {/* 4. Summarize Page */}
                    <button
                      onClick={() => handleRunAiTask('summarize_page')}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
                      title="Summarize page in bullet points"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Page Summary</span>
                    </button>

                    {/* 5. Revision Notes */}
                    <button
                      onClick={() => handleRunAiTask('short_notes')}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
                      title="Create revision short notes"
                    >
                      <Star className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Revision Notes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Messages Chat History OR History & Search Sessions Panel */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin bg-slate-950/60">
                {/* History Header Banner */}
                <div className="bg-slate-900 border border-purple-900/40 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 sm:gap-3 shadow-md w-full min-w-0">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-purple-200 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="truncate">{targetLanguage === 'Hindi' ? 'मेरा सम्पूर्ण अध्ययन इतिहास' : 'My Entire PDF Study History'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 break-words">
                      {targetLanguage === 'Hindi'
                        ? 'आपके द्वारा इस PDF के लिए पहले पूछे गए सभी प्रश्न और सत्र यहाँ सहेजे गए हैं।'
                        : 'All your previously recorded study sessions and questions for this PDF are saved below.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                    {chatSessions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllHistory}
                        className="text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>{targetLanguage === 'Hindi' ? 'इतिहास साफ़ करें' : 'Clear All'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                    >
                      {targetLanguage === 'Hindi' ? 'चैट पर वापस जाएं' : 'Back to Chat'}
                    </button>
                  </div>
                </div>

                {/* Search and Filters Controls */}
                {chatSessions.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={targetLanguage === 'Hindi' ? 'सत्र शीर्षक या प्रश्न खोजें...' : 'Search study sessions or questions...'}
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-950 text-slate-100 placeholder-slate-500"
                        />
                        {historySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHistorySearchQuery('')}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter Type Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setHistoryFilterType('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            historyFilterType === 'all'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          All Sessions
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryFilterType('starred')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            historyFilterType === 'starred'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${historyFilterType === 'starred' ? 'fill-current text-slate-950' : 'text-amber-400'}`} />
                          <span>Starred</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sessions Cards Container */}
                {(() => {
                  const filtered = chatSessions.filter(session => {
                    const queryLower = historySearchQuery.toLowerCase();
                    const titleMatch = session.title.toLowerCase().includes(queryLower);
                    const msgMatch = (session.messages || []).some(m => m && m.text && m.text.toLowerCase().includes(queryLower));
                    const matchesSearch = titleMatch || msgMatch;
                    const matchesFilter = historyFilterType === 'starred' ? !!session.starred : true;
                    return matchesSearch && matchesFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2">
                        <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-400">
                          {chatSessions.length === 0
                            ? (targetLanguage === 'Hindi' ? 'अभी तक कोई अध्ययन सत्र सहेजा नहीं गया है।' : 'No saved study sessions yet. Ask questions in chat to record history!')
                            : (targetLanguage === 'Hindi' ? 'कोई मेल खाता हुआ सत्र नहीं मिला।' : 'No study sessions matched your search filter.')}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map(session => (
                        <div
                          key={session.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 transition-all hover:border-purple-800/60 shadow-sm"
                        >
                          {editingSessionId === session.id ? (
                            <div className="bg-slate-950 border border-purple-500/70 rounded-xl p-3 space-y-2.5 shadow-md animate-fade-in">
                              <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                                <span className="flex items-center gap-1.5">
                                  <Pencil className="w-3.5 h-3.5 text-purple-400" />
                                  <span>{targetLanguage === 'Hindi' ? 'सत्र का नाम बदलें' : 'Rename Study Session'}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                                  Press Enter to save, Esc to cancel
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingSessionTitle}
                                  onChange={(e) => setEditingSessionTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRenameSession(session.id);
                                    if (e.key === 'Escape') setEditingSessionId(null);
                                  }}
                                  placeholder={targetLanguage === 'Hindi' ? 'सत्र शीर्षक दर्ज करें...' : 'Enter session title...'}
                                  className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-500/50 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRenameSession(session.id)}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{targetLanguage === 'Hindi' ? 'सहेजें' : 'Save'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSessionId(null)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>{targetLanguage === 'Hindi' ? 'रद्द करें' : 'Cancel'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              {/* Title & Star */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleStarSession(session.id, e)}
                                  className="p-1 text-amber-400 hover:text-amber-300 cursor-pointer shrink-0"
                                  title={session.starred ? "Unstar session" : "Star session"}
                                >
                                  <Star className={`w-4 h-4 ${session.starred ? 'fill-current text-amber-400' : 'text-slate-600'}`} />
                                </button>

                                <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                                  {session.title}
                                </h4>
                              </div>

                              {/* Session Actions Toolbar */}
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Rename */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSessionId(session.id);
                                    setEditingSessionTitle(session.title);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 cursor-pointer transition-colors"
                                  title="Rename session"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
                                  title="Delete session"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>

                                {/* Download Session Full Chat PDF */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportFullChatPDF(session.messages, session.title);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 cursor-pointer transition-colors"
                                  title="Download full session PDF"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Messages View */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedSessions(prev => ({
                                      ...prev,
                                      [session.id]: !prev[session.id]
                                    }));
                                  }}
                                  className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-800 text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                  title={expandedSessions[session.id] ? "Hide messages" : "View messages"}
                                >
                                  {expandedSessions[session.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  <span>{expandedSessions[session.id] ? 'Hide' : 'View'}</span>
                                </button>

                                {/* Restore Chat Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRestoreSession(session)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                  title="Restore session to active chat"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>Open</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Sub-info details */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{session.messages?.length || 0} Messages</span>
                            <span>&bull;</span>
                            <span>Page {session.activePageNum || 1}</span>
                            <span>&bull;</span>
                            <span>{session.timestamp}</span>
                          </div>

                          {/* Expanded Session Messages View */}
                          {expandedSessions[session.id] && (
                            <div className="pt-2 border-t border-slate-800/80 space-y-2 mt-2">
                              {session.messages.map((m, idx) => (
                                <div
                                  key={m.id || idx}
                                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                                    m.sender === 'user'
                                      ? 'bg-purple-950/60 border border-purple-800/40 text-purple-100 ml-4'
                                      : 'bg-slate-950 border border-slate-800 text-slate-100 mr-4'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pb-1 border-b border-white/5">
                                    <span className={m.sender === 'user' ? 'text-purple-300' : 'text-emerald-400'}>
                                      {m.sender === 'user' ? '👤 Student' : '🤖 AI Solver'}
                                    </span>
                                    <span className="font-mono">{m.timestamp}</span>
                                  </div>
                                  {m.sender === 'assistant' ? (
                                    <MathRenderer content={m.text} isUser={false} isDark={true} className="text-slate-100 text-xs" />
                                  ) : (
                                    <p className="text-white">{m.text}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* REGULAR ACTIVE CHAT MESSAGES */
              <div ref={aiChatScrollRef} className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-3 scrollbar-thin max-w-full min-w-0">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  id={`ai-msg-${msg.id}`}
                  className={`flex flex-col text-xs sm:text-sm leading-relaxed w-full min-w-0 ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl max-w-[88%] sm:max-w-[85%] min-w-0 space-y-1.5 shadow-sm break-words [overflow-wrap:anywhere] ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-2xs ml-auto'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-2xs mr-auto'
                    }`}
                  >
                    {/* Quoted Replying Snippet */}
                    {msg.replyTo && (
                      <div
                        onClick={() => {
                          const targetEl = document.getElementById(`ai-msg-${msg.replyTo?.id}`);
                          if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetEl.classList.add('ring-2', 'ring-purple-400');
                            setTimeout(() => targetEl.classList.remove('ring-2', 'ring-purple-400'), 1500);
                          }
                        }}
                        className="mb-2 p-2 bg-purple-950/70 border-l-3 border-purple-400 rounded-r-xl text-xs text-purple-200 cursor-pointer hover:bg-purple-900/60 transition-colors break-words overflow-hidden"
                      >
                        <div className="flex items-center gap-1 font-bold text-[10px] text-purple-300">
                          <CornerUpLeft className="w-3 h-3 shrink-0" />
                          <span className="truncate">Replying to {msg.replyTo.sender === 'assistant' ? 'AI Solver 🤖' : 'You'}</span>
                        </div>
                        <p className="line-clamp-2 text-[11px] text-slate-300 italic mt-0.5 break-words">
                          "{cleanPdfExtractedText(msg.replyTo.text.slice(0, 90))}"
                        </p>
                      </div>
                    )}

                    {msg.sender === 'assistant' ? (
                      <div className="w-full max-w-none min-w-0 break-words">
                        <MathRenderer content={msg.text} isUser={false} isDark={true} className="text-slate-100" />
                      </div>
                    ) : (
                      <p className="text-white font-medium break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Footer Row: Timestamp & Message Action Toolbar */}
                    <div className={`flex items-center justify-between text-[10px] font-mono pt-1.5 border-t ${
                      msg.sender === 'user' 
                        ? 'border-purple-500/30 text-purple-200/90' 
                        : 'border-slate-800 text-slate-400'
                    }`}>
                      <span>{msg.timestamp}</span>

                      {/* Message Action Buttons: Reply, Read Aloud, Download PDF, Copy */}
                      <div className="flex items-center gap-1">
                        {/* 1. Reply Button */}
                        <button
                          type="button"
                          onClick={() => setReplyingTo({ id: msg.id, sender: msg.sender, text: msg.text })}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            msg.sender === 'user'
                              ? 'hover:bg-purple-700 text-purple-100'
                              : 'hover:bg-slate-800 text-slate-400 hover:text-purple-300'
                          }`}
                          title="Reply to this message"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Read Aloud / Speak Button */}
                        <button
                          type="button"
                          onClick={() => speakMessageAloud(msg)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isPlayingVoice === msg.id 
                              ? 'bg-purple-500 text-white animate-pulse' 
                              : msg.sender === 'user'
                              ? 'hover:bg-purple-700 text-purple-100'
                              : 'hover:bg-slate-800 text-slate-400 hover:text-purple-300'
                          }`}
                          title={isPlayingVoice === msg.id ? "Stop Speech" : `Read Aloud (${targetLanguage})`}
                        >
                          {isPlayingVoice === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* 3. Download PDF Button (for Assistant Responses) */}
                        {msg.sender === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => exportMessageToPDF(msg)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-300 cursor-pointer transition-colors"
                            title="Download Solution PDF Report"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 4. Copy Response Button */}
                        <button
                          type="button"
                          onClick={() => copyMessageToClipboard(msg)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            copiedMessageId === msg.id
                              ? 'text-emerald-400 font-bold'
                              : msg.sender === 'user'
                              ? 'hover:bg-purple-700 text-purple-100'
                              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title={copiedMessageId === msg.id ? "Copied!" : "Copy Response"}
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-2xl text-xs text-purple-300 border border-purple-900/30 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                  <span>AI Solver Chatbot working in {targetLanguage}...</span>
                </div>
              )}
            </div>
          )}

            {/* Replying Context Banner */}
            {replyingTo && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-purple-950/90 border-t border-b border-purple-800/60 text-xs text-purple-200 animate-fade-in shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <CornerUpLeft className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-bold text-purple-300 shrink-0">
                    Replying to {replyingTo.sender === 'assistant' ? 'AI Solver' : 'You'}:
                  </span>
                  <span className="truncate text-slate-300 italic">
                    "{cleanPdfExtractedText(replyingTo.text.slice(0, 75))}"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-purple-400 hover:text-white rounded hover:bg-purple-900/60 cursor-pointer shrink-0 transition-colors"
                  title="Cancel reply"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Prompt Input Bar with Speech-to-Text */}
            <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 shrink-0 w-full min-w-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPromptInput.trim()) {
                    handleRunAiTask('chat', aiPromptInput.trim());
                    setAiPromptInput('');
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0"
              >
                <input
                  type="text"
                  placeholder={`Ask AI Solver in ${targetLanguage}...`}
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                {/* Speech Input Voice Mic Button */}
                <SpeechInputButton
                  lang={
                    targetLanguage === 'Hindi' ? 'hi' :
                    targetLanguage === 'Gujarati' ? 'gu' :
                    targetLanguage === 'Marathi' ? 'mr' :
                    targetLanguage === 'Tamil' ? 'ta' :
                    targetLanguage === 'Telugu' ? 'te' : 'en'
                  }
                  onTranscript={(text) => {
                    setAiPromptInput(prev => (prev ? prev + ' ' + text : text));
                  }}
                  className="shrink-0"
                />

                <button
                  type="submit"
                  disabled={!aiPromptInput.trim() || aiLoading}
                  className="me-5 p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white rounded-xl cursor-pointer shadow-md transition-all shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Offscreen PDF Render Template for Single Response Export */}
        {isExportingPDF && pdfExportMessage && (
          <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
            <div
              id="pdf-canvas-viewer-render-template"
              className="w-[800px] p-8 bg-slate-950 text-slate-100 font-sans leading-relaxed border border-purple-900/50"
              style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            >
              {/* Report Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-purple-500/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                    G
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white">
                      GyaanBot AI Solver Report
                    </h1>
                    <p className="text-xs text-purple-300 font-medium">
                      {fileName} &bull; Page {activePageNum}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-semibold text-purple-300">{targetLanguage} Edition</p>
                  <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Preceding User Question if exists */}
              {pdfExportQuestion && (
                <div className="mb-6 p-4 rounded-xl bg-purple-950/60 border border-purple-800/60">
                  <span className="text-xs font-bold uppercase text-purple-400 tracking-wider block mb-1">
                    Student Question / Prompt:
                  </span>
                  <p className="text-sm font-semibold text-purple-100">
                    {pdfExportQuestion}
                  </p>
                </div>
              )}

              {/* AI Solution Body */}
              <div className="mb-6 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider block mb-2">
                  Verified AI Solution & Analysis:
                </span>
                <MathRenderer
                  content={pdfExportMessage.text}
                  isUser={false}
                  isDark={true}
                  className="text-slate-100 text-sm leading-relaxed"
                />
              </div>

              {/* Footer Watermark */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>GyaanBot Smart Reader AI &bull; Interactive PDF Solver</span>
                <span>Page {activePageNum} Solution</span>
              </div>
            </div>
          </div>
        )}

        {/* Offscreen PDF Render Template for Full Chat Export */}
        {isExportingPDF && pdfExportFullChatMessages && (
          <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
            <div
              id="pdf-canvas-viewer-full-chat-render-template"
              className="w-[800px] p-8 bg-slate-950 text-slate-100 font-sans leading-relaxed border border-purple-900/50 space-y-6"
              style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            >
              {/* Full Chat Document Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-purple-500/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                    G
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white">
                      {pdfExportFullChatTitle || 'Full PDF Study Session Chat'}
                    </h1>
                    <p className="text-xs text-purple-300 font-medium">
                      {fileName} &bull; Page {activePageNum}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-semibold text-purple-300">{targetLanguage} Edition</p>
                  <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Messages Stack */}
              <div className="space-y-4">
                {pdfExportFullChatMessages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`p-4 rounded-2xl space-y-2 border ${
                      msg.sender === 'user'
                        ? 'bg-purple-950/70 border-purple-800/80 text-purple-100 ml-8'
                        : 'bg-slate-900 border-slate-800 text-slate-100 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-white/10">
                      <span className={msg.sender === 'user' ? 'text-purple-300' : 'text-emerald-400'}>
                        {msg.sender === 'user' ? '👤 Student Question' : '🤖 AI Study Task Assistant'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{msg.timestamp}</span>
                    </div>

                    {msg.sender === 'assistant' ? (
                      <MathRenderer content={msg.text} isUser={false} isDark={true} className="text-slate-100 text-sm leading-relaxed" />
                    ) : (
                      <p className="text-white text-sm font-medium">{msg.text}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>GyaanBot Smart Reader AI &bull; Full Study Session Transcript</span>
                <span>Page {activePageNum} Session &bull; {pdfExportFullChatMessages.length} Messages</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
