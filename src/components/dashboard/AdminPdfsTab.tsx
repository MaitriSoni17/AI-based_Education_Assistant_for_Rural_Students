import React, { useState, useEffect, useMemo } from 'react';
import { LanguageCode, User, CurriculumFolder, CurriculumFile } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/translations';
import { 
  getAllFirebaseCurriculumFolders, 
  getAllFirebaseCurriculumFiles, 
  getFirebaseCurriculumFileDataUrl,
  saveFirebaseCurriculumFile,
  deleteFirebaseCurriculumFile
} from '../../lib/firebase';
import { getFileLocal, saveFileLocal, deleteFileLocal } from '../../lib/indexedDbStore';
import { speakText, stopSpeaking } from '../../utils/speech';
import { PdfCanvasViewer } from '../admin/PdfCanvasViewer';
import InteractiveDiagram from './InteractiveDiagram';
import SlideVisualBoard from './SlideVisualBoard';
import { 
  FileText, BookOpen, Folder, FolderOpen, Search, Download, Sparkles, 
  Volume2, VolumeX, Eye, CheckCircle2, ArrowLeft, ChevronRight, Filter, 
  Layers, Clock, Grid, List, X, Award, ExternalLink, RefreshCw, AlertCircle, Globe, Zap,
  Wand2, Star, Trash2, Plus, BookMarked, Pencil, Lock, Check
} from 'lucide-react';

interface AdminPdfsTabProps {
  user: User;
  lang: LanguageCode;
}

// Default Seed Folders & Files in multiple languages (English, Hindi, Gujarati, Marathi, Tamil, Telugu)
const DEFAULT_CURRICULUM_FOLDERS: CurriculumFolder[] = [];
const DEFAULT_CURRICULUM_FILES: CurriculumFile[] = [
  {
    id: 'pdf-std10-sci-notes',
    name: 'Photosynthesis & Cellular Respiration - Revision Notes',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'English',
    folderId: null,
    size: '1.2 MB',
    uploadedAt: '2026-08-01',
    description: 'Complete Class 10 Science revision notes on Light Reactions, Dark Reactions, and ATP synthesis in English.',
    isVisible: true,
    fullContent: `# Chapter 6: Life Processes - Photosynthesis & Respiration

## 1. Overview of Photosynthesis
Photosynthesis is the autotrophic process by which green plants synthesize glucose from carbon dioxide ($CO_2$) and water ($H_2O$) in the presence of sunlight and chlorophyll.

### Chemical Equation:
6CO2 + 6H2O --(Sunlight / Chlorophyll)--> C6H12O6 + 6O2

> **Key Definition:** Chloroplasts in leaves contain green pigment chlorophyll which absorbs photons of solar energy to drive photolysis of water.

---

## 2. Main Steps of Light & Dark Reactions
1. **Absorption of Light Energy:** Chlorophyll molecules absorb solar radiation.
2. **Photolysis of Water:** Light splits $H_2O$ molecules into $H^+$, electrons, and oxygen gas ($O_2$).
3. **Reduction of $CO_2$:** $CO_2$ is reduced to carbohydrate (Glucose) via the Calvin Cycle.

---

## 3. Practice Questions & Board Exam Questions
- **Q1:** What is the primary function of stomata during photosynthesis?
  - *Answer:* Stomata facilitate gas exchange ($CO_2$ uptake and $O_2$ release) and transpiration.
- **Q2:** Differentiate between aerobic and anaerobic respiration.
  - *Answer:* Aerobic respiration requires oxygen and produces 38 ATP per glucose; anaerobic occurs without oxygen producing 2 ATP and lactic acid/ethanol.`
  },
  {
    id: 'pdf-std10-sci-hi',
    name: 'प्रकाश संश्लेषण और कोशिकीय श्वसन - रिवीज़न नोट्स',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'Hindi',
    folderId: null,
    size: '1.4 MB',
    uploadedAt: '2026-08-02',
    description: 'कक्षा 10 विज्ञान अध्याय: प्रकाश संश्लेषण, प्रकाश अभिक्रियाएं, हरीतलवक और एटीपी निर्माण के विस्तृत नोट्स हिंदी में।',
    isVisible: true,
    fullContent: `# अध्याय 6: जैव प्रक्रम - प्रकाश संश्लेषण एवं श्वसन

## 1. प्रकाश संश्लेषण की परिभाषा
प्रकाश संश्लेषण वह स्वपोषण प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश तथा क्लोरोफिल की उपस्थिति में जल ($H_2O$) और कार्बन डाइऑक्साइड ($CO_2$) से ग्लूकोज का निर्माण करते हैं।

### रासायनिक समीकरण:
6CO2 + 6H2O --(सूर्य का प्रकाश / क्लोरोफिल)--> C6H12O6 + 6O2

> **मुख्य परिभाषा:** पत्तियों के हरितलवक (क्लोरोप्लास्ट) में उपस्थित क्लोरोफिल सौर ऊर्जा का अवशोषण कर जल का प्रकाशिक अपघटन (Photolysis) करता है।

---

## 2. मुख्य चरण (प्रकाशिक एवं अप्रकाशिक अभिक्रियाएं)
1. **प्रकाश ऊर्जा का अवशोषण:** क्लोरोफिल सौर ऊर्जा को अवशोषित करता है।
2. **जल का अपघटन:** जल अणु हाइड्रोजन आयन, इलेक्ट्रॉन और ऑक्सीजन गैस ($O_2$) में विभाजित होते हैं।
3. **कार्बन डाइऑक्साइड का अपचयन:** केल्विन चक्र के माध्यम से $CO_2$ का कार्बोहाइड्रेट (ग्लूकोज) में अपचयन होता है।

---

## 3. बोर्ड परीक्षा अभ्यास प्रश्न
- **प्रश्न 1:** प्रकाश संश्लेषण में रंध्रों (Stomata) की मुख्य भूमिका क्या है?
  - *उत्तर:* रंध्र गैसों के विनिमय ($CO_2$ का ग्रहण और $O_2$ का निष्कासन) तथा वाष्पोत्सर्जन को नियंत्रित करते हैं।
- **प्रश्न 2:** वायवीय और अवायवीय श्वसन में अंतर स्पष्ट कीजिए।
  - *उत्तर:* वायवीय श्वसन ऑक्सीजन की उपस्थिति में 38 ATP उत्पन्न करता है; अवायवीय श्वसन ऑक्सीजन के बिना 2 ATP तथा लैक्टिक अम्ल बनाता है।`
  },
  {
    id: 'pdf-std10-sci-gu',
    name: 'પ્રકાશસંશ્લેષણ અને કોષીય શ્વસન - રિવિઝન નોટ્સ',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'Gujarati',
    folderId: null,
    size: '1.3 MB',
    uploadedAt: '2026-08-03',
    description: 'ધોરણ 10 વિજ્ઞાન: પ્રકાશ સંશ્લેષણ, પ્રકાશ પ્રક્રિયાઓ, હરિતકણ અને એટીપી નિર્માણ માટે સંપૂર્ણ રિવિઝન નોટ્સ ગુજરાતીમાં.',
    isVisible: true,
    fullContent: `# પ્રકરણ 6: જૈવિક ક્રિયાઓ - પ્રકાશસંશ્લેષણ અને શ્વસન

## 1. પ્રકાશસંશ્લેષણની વ્યાખ્યા
પ્રકાશસંશ્લેષણ એ સ્વયંપોષી પ્રક્રિયા છે જેના દ્વારા લીલી વનસ્પતિ સૂર્યપ્રકાશ અને ક્લોરોફિલની હાજરીમાં કાર્બન ડાયોક્સાઇડ ($CO_2$) અને પાણી ($H_2O$) માંથી ગ્લુકોઝનું નિર્માણ કરે છે.

### રાસાયણિક સમીકરણ:
6CO2 + 6H2O --(સૂર્યપ્રકાશ / ક્લોરોફિલ)--> C6H12O6 + 6O2

> **મુખ્ય વ્યાખ્યા:** પર્ણોમાં આવેલા હરિતકણ (Chloroplasts) સૂર્યઉર્જાનું શોષણ કરી પાણીનું પ્રકાશ વિઘટન કરે છે.

---

## 2. પ્રકાશસંશ્લેષણના મુખ્ય તબક્કા
1. **પ્રકાશ ઉર્જાનું શોષણ:** ક્લોરોફિલ સૂર્યપ્રકાશનું શોષણ કરે છે.
2. **પાણીનું પ્રકાશ વિઘટન:** પાણીના અણુઓનું હાઇડ્રોજન અને ઓક્સિજન ($O_2$) માં વિભાજન થાય છે.
3. **$CO_2$ નું રિડક્શન:** કાર્બન ડાયોક્સાઇડનું ગ્લુકોઝમાં રૂપાંતર થાય છે.

---

## 3. બોર્ડ પરીક્ષા પ્રશ્નોત્તરી
- **પ્રશ્ન 1:** પર્ણરંધ્રો (Stomata) નું મુખ્ય કાર્ય શું છે?
  - *જવાબ:* વાયુ વિનિમય ($CO_2$ ગ્રહણ અને $O_2$ મુક્ત કરવું) અને બાષ્પોત્સર્જન.
- **પ્રશ્ન 2:** જારક અને અજારક શ્વસન વચ્ચેનો તફાવત જણાવો.
  - *જવાબ:* જારક શ્વસન ઓક્સિજનની હાજરીમાં 38 ATP ઉર્જા મુક્ત કરે છે; અજારક શ્વસન ઓક્સિજન વગર 2 ATP અને લેક્ટિક એસિડ બનાવે છે.`
  },
  {
    id: 'pdf-std10-math-mr',
    name: 'द्विघात समीकरणे आणि बीजगणित - नियम व सूत्रे',
    subject: 'Mathematics',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'Marathi',
    folderId: null,
    size: '1.1 MB',
    uploadedAt: '2026-08-04',
    description: 'इयत्ता १० वी गणित: वर्गसमीकरणे, सूत्र पद्धत, विवेचक आणि सराव उदाहरणे मराठीत.',
    isVisible: true,
    fullContent: `# प्रकरण २: वर्गसमीकरणे (Quadratic Equations)

## १. वर्गसमीकरणाचे मानक रूप
कोणतेही वर्गसमीकरण मानक रूपात $ax^2 + bx + c = 0$ असे लिहिले जाते, जिथे $a \neq 0$.

### महत्त्वाचे सूत्र:
x = [-b ± √(b² - 4ac)] / (2a)

> **विवेचक (Discriminant):** $\Delta = b^2 - 4ac$
> - जर $\Delta > 0$, मुळे वास्तव व असमान असतात.
> - जर $\Delta = 0$, मुळे वास्तव व समान असतात.
> - जर $\Delta < 0$, मुळे वास्तव नसतात.

---

## २. सराव उदाहरणे
- **उदाहरण १:** $x^2 - 7x + 12 = 0$ अवयव पद्धतीने सोडवा.
  - *उकल:* $(x - 3)(x - 4) = 0 \implies x = 3$ किंवा $x = 4$.`
  },
  {
    id: 'pdf-std10-sci-ta',
    name: 'ஒளிச்சேர்க்கை மற்றும் செல் சுவாசம் - பாடக் குறிப்புகள்',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'Tamil',
    folderId: null,
    size: '1.2 MB',
    uploadedAt: '2026-08-05',
    description: 'பத்தாம் வகுப்பு அறிவியல்: ஒளிச்சேர்க்கை, ஏடிபி உருவாக்கம் மற்றும் தாவர சுவாசம் பற்றிய முழுமையான பாடக் குறிப்புகள் தமிழில்.',
    isVisible: true,
    fullContent: `# பாடம் 6: உயிர்ச் செயல்பாடுகள் - ஒளிச்சேர்க்கை

## 1. ஒளிச்சேர்க்கை விளக்கம்
பசுந்தாவரங்கள் சூரிய ஒளி மற்றும் பச்சையத்தின் முன்னிலையில் கார்பன் டை ஆக்சைடு மற்றும் நீரிலிருந்து குளுக்கோஸைத் தயாரிக்கும் தற்சார்பு ஊட்டமுறை ஒளிச்சேர்க்கை எனப்படும்.

### வேதியியல் சமன்பாடு:
6CO2 + 6H2O --(சூரிய ஒளி / பச்சையம்)--> C6H12O6 + 6O2

---

## 2. முக்கிய நிலைகள்
1. பச்சையம் சூரிய ஆற்றலை உறிஞ்சுதல்.
2. நீர் மூலக்கூறுகள் ஹைட்ரஜன் மற்றும் ஆக்சிஜனாகப் பிளக்கப்படுதல்.
3. கார்பன் டை ஆக்சைடு குளுக்கோஸாக ஒடுக்கப்படுதல்.`
  },
  {
    id: 'pdf-std10-math-te',
    name: 'వర్గ సమీకరణాలు మరియు రేఖా గణితం - సూత్రాలు',
    subject: 'Mathematics',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'notes',
    language: 'Telugu',
    folderId: null,
    size: '1.3 MB',
    uploadedAt: '2026-08-06',
    description: 'పదో తరగతి గణితం: వర్గ సమీకరణాలు, సూత్రాలు మరియు సాధించిన ఉదాహరణలు తెలుగులో.',
    isVisible: true,
    fullContent: `# అధ్యాయం 2: వర్గ సమీకరణాలు (Quadratic Equations)

## 1. ప్రమాణ రూపం
వర్గ సమీకరణం యొక్క ప్రమాణ రూపం $ax^2 + bx + c = 0$ ($a \neq 0$).

### వర్గ సమీకరణ సూత్రం:
x = [-b ± √(b² - 4ac)] / (2a)

> **విచక్షణి (Discriminant):** $\Delta = b^2 - 4ac$`
  },
  {
    id: 'pdf-std10-pyq-hi',
    name: 'कक्षा 10 बोर्ड परीक्षा - मॉडल विज्ञान प्रश्न पत्र एवं हल',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'pyq',
    language: 'Hindi',
    folderId: null,
    size: '1.8 MB',
    uploadedAt: '2026-08-07',
    description: 'मॉडल प्रश्न पत्र: बहुविकल्पीय प्रश्न, लघु उत्तरीय एवं दीर्घ उत्तरीय प्रश्नों के सटीक हल हिंदी में।',
    isVisible: true,
    fullContent: `# कक्षा 10 विज्ञान - मॉडल बोर्ड प्रश्न पत्र (PYQ)

## खण्ड 'क' (बहुविकल्पीय प्रश्न)
1. **मनुष्य में वृक्क (Kidney) एक तंत्र का भाग है जो संबंधित है:**
   - (A) पोषण से  (B) श्वसन से  (C) उत्सर्जन से  (D) परिवहन से
   - *उत्तर:* (C) उत्सर्जन से

2. **अम्लीय विलयन का pH मान होता है:**
   - (A) 7 से कम  (B) 7 से अधिक  (C) 7  (D) शून्य
   - *उत्तर:* (A) 7 से कम`
  },
  {
    id: 'pdf-std10-ebook-gu',
    name: 'ધોરણ 10 વિજ્ઞાન - પાઠ્યપુસ્તક પ્રકરણ 1: રાસાયણિક પ્રક્રિયાઓ',
    subject: 'Science',
    standard: 'Class 10',
    category: 'pdf',
    materialType: 'ebook',
    language: 'Gujarati',
    folderId: null,
    size: '2.1 MB',
    uploadedAt: '2026-08-08',
    description: 'સત્તાવાર પાઠ્યપુસ્તક ઈ-બુક: રાસાયણિક સમીકરણો, સંતુલન, સંયોગીકરણ અને વિઘટન પ્રક્રિયાઓ ગુજરાતીમાં.',
    isVisible: true,
    fullContent: `# ધોરણ 10 વિજ્ઞાન - પ્રકરણ 1: રાસાયણિક પ્રક્રિયાઓ અને સમીકરણો

## 1. રાસાયણિક પ્રક્રિયાના લક્ષણો
જ્યારે રાસાયણિક ફેરફાર થાય છે ત્યારે રાસાયણિક પ્રક્રિયા થઈ તેમ કહેવાય:
1. અવસ્થામાં પરિવર્તન
2. રંગમાં પરિવર્તન
3. વાયુનો ઉદ્ભવ
4. તાપમાનમાં ફેરફાર`
  }
];

// Language Code Detection Helper
const getLanguageCodeFromName = (langName?: string): LanguageCode => {
  if (!langName) return 'en';
  const l = langName.toLowerCase();
  if (l.includes('hindi') || l.includes('hi') || /[\u0900-\u097F]/.test(l)) return 'hi';
  if (l.includes('gujarati') || l.includes('gu') || /[\u0A80-\u0AFF]/.test(l)) return 'gu';
  if (l.includes('marathi') || l.includes('mr')) return 'mr';
  if (l.includes('tamil') || l.includes('ta') || /[\u0B80-\u0BFF]/.test(l)) return 'ta';
  if (l.includes('telugu') || l.includes('te') || /[\u0C00-\u0C7F]/.test(l)) return 'te';
  return 'en';
};

// Language Flag & Native Name Helper
const getLangFlag = (langStr?: string) => {
  if (!langStr) return '🇬🇧 English';
  const l = langStr.toLowerCase();
  if (l.includes('hindi') || l.includes('hi') || /[\u0900-\u097F]/.test(l)) return '🇮🇳 हिंदी';
  if (l.includes('gujarati') || l.includes('gu') || /[\u0A80-\u0AFF]/.test(l)) return '🇮🇳 ગુજરાતી';
  if (l.includes('marathi') || l.includes('mr')) return '🇮🇳 मराठी';
  if (l.includes('tamil') || l.includes('ta') || /[\u0B80-\u0BFF]/.test(l)) return '🇮🇳 தமிழ்';
  if (l.includes('telugu') || l.includes('te') || /[\u0C00-\u0C7F]/.test(l)) return '🇮🇳 తెలుగు';
  if (l.includes('bengali') || l.includes('bn')) return '🇮🇳 বাংলা';
  if (l.includes('kannada') || l.includes('kn')) return '🇮🇳 ಕನ್ನಡ';
  if (l.includes('malayalam') || l.includes('ml')) return '🇮🇳 മലയാളം';
  if (l.includes('punjabi') || l.includes('pa')) return '🇮🇳 પੰਜਾਬી';
  if (l.includes('hinglish')) return '🇮🇳 Hinglish';
  if (l.includes('english') || l.includes('en')) return '🇬🇧 English';
  return `🌐 ${langStr}`;
};

// Helper to construct a crisp multi-language PDF data URL using html2canvas & jsPDF
const generateMultiLanguagePdfDataUrl = async (
  title: string,
  subject: string,
  std: string,
  language: string,
  fullBodyText: string,
  materialTypeHeaderLabel?: string
): Promise<string> => {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // A4 pixel width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '48px 56px 64px 56px';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Hind", "Gujarati", "Mukta", sans-serif';
  container.style.boxSizing = 'border-box';

  // Format markdown headings, bullet points, callouts and code blocks for maximum student readability
  const formattedHtml = fullBodyText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 800;">$1</strong>')
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 14px;"></div>';

      // H1 Main Title
      if (trimmed.startsWith('# ')) {
        const titleText = trimmed.replace(/^#\s*/, '');
        return `<h1 style="font-size: 24px; font-weight: 900; color: #be123c; margin: 26px 0 14px 0; border-bottom: 3px solid #be123c; padding-bottom: 8px; letter-spacing: -0.3px;">${titleText}</h1>`;
      }
      // H2 Heading
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s*/, '');
        return `<h2 style="font-size: 17px; font-weight: 800; color: #0369a1; margin: 24px 0 12px 0; background-color: #f0f9ff; padding: 10px 16px; border-left: 6px solid #0284c7; border-radius: 6px; display: block; letter-spacing: -0.2px;">${titleText}</h2>`;
      }
      // H3 Heading
      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        return `<h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 18px 0 8px 0; border-bottom: 2px border-slate-200 #cbd5e1; padding-bottom: 4px;">${titleText}</h3>`;
      }
      // Callout Block
      if (trimmed.startsWith('> ')) {
        const text = trimmed.replace(/^>\s*/, '');
        return `<div style="background-color: #fffbe0; border: 1.5px solid #fde68a; border-left: 5px solid #d97706; padding: 14px 18px; border-radius: 8px; margin: 14px 0; font-size: 14.5px; color: #0f172a; font-weight: 600; line-height: 1.8; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">${text}</div>`;
      }
      // Numbered List
      if (/^\d+\./.test(trimmed)) {
        return `<div style="font-weight: 700; color: #0f172a; margin-top: 10px; margin-bottom: 6px; font-size: 14.5px; padding-left: 4px; line-height: 1.8;">${trimmed}</div>`;
      }
      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        return `<div style="padding-left: 24px; position: relative; margin-bottom: 8px; color: #0f172a; font-size: 14.5px; font-weight: 500; line-height: 1.8;"><span style="position: absolute; left: 6px; color: #e11d48; font-weight: 900; font-size: 16px;">•</span> ${itemContent}</div>`;
      }

      return `<p style="margin: 0 0 12px 0; color: #0f172a; font-weight: 500; line-height: 1.8; font-size: 14.5px;">${trimmed}</p>`;
    })
    .join('');

  const headerBadge = materialTypeHeaderLabel || 'AI Study Guide';

  container.innerHTML = `
    <div style="border-bottom: 3.5px solid #e11d48; padding-bottom: 20px; margin-bottom: 26px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 900; color: #e11d48; text-transform: uppercase; letter-spacing: 1px;">Gramin Shiksha • ${headerBadge}</span>
        <span style="font-size: 12px; background-color: #ffe4e6; padding: 5px 16px; border-radius: 14px; font-weight: 800; color: #9f1239;">Language: ${language}</span>
      </div>
      <h1 style="font-size: 25px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3; letter-spacing: -0.4px;">${title}</h1>
      <div style="font-size: 13.5px; color: #334155; font-weight: 700; display: flex; gap: 28px;">
        <span>Subject: <strong style="color: #0f172a;">${subject}</strong></span>
        <span>Standard: <strong style="color: #0f172a;">${std}</strong></span>
      </div>
    </div>
    <div style="font-size: 14.5px; line-height: 1.8; color: #0f172a;">
      ${formattedHtml}
    </div>
    <div style="margin-top: 44px; border-top: 1px solid #cbd5e1; padding-top: 16px; text-align: center; font-size: 11.5px; color: #475569; font-weight: 600;">
      Gramin Shiksha AI Educational Platform • Official Study Document (${language})
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width mm
    const pageHeight = 297; // A4 height mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add page numbers, running headers and footers to ALL generated PDF pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      pdf.setPage(pageNum);

      // White overlay rectangle at the bottom footer area to ensure page number is crisp and legible
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 278, 210, 19, 'F');

      // Thin decorative divider line above page footer
      pdf.setDrawColor(226, 232, 240); // Slate-200
      pdf.setLineWidth(0.4);
      pdf.line(15, 280, 195, 280);

      // Page Number Footer ("Page 1 of 3", "Page 2 of 3", etc.)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59); // Slate-800
      pdf.text(`Page ${pageNum} of ${totalPages}`, 105, 287, { align: 'center' });

      // Branding & Metadata
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139); // Slate-500
      pdf.text(`Gramin Shiksha AI Study Guide • ${subject} (${std})`, 105, 292, { align: 'center' });

      // Top running header for page 2 onwards
      if (pageNum > 1) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 12, 'F');
        pdf.setDrawColor(241, 245, 249);
        pdf.line(15, 10, 195, 10);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`${title.substring(0, 55)}`, 15, 7);
        pdf.text(`Class ${std}`, 195, 7, { align: 'right' });
      }
    }

    return pdf.output('datauristring');
  } catch (err) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error("html2canvas/jsPDF conversion error:", err);
    throw err;
  }
};

// Legacy/Fallback helper that delegates to generateMultiLanguagePdfDataUrl
const generateStandardPdfDataUrl = async (title: string, subject: string, std: string, desc: string, fullBodyText?: string): Promise<string> => {
  return await generateMultiLanguagePdfDataUrl(title, subject, std, 'English', fullBodyText || desc || 'Study Material Notes');
};

// Multilingual translations dictionary for Study Materials
const STUDY_MATERIALS_TRANSLATIONS: Record<LanguageCode, {
  pageTitle: string;
  pageSubtitle: string;
  officialHubBadge: string;
  badgeOfficialDocs: string;
  badgeFolders: string;
  badgeSavedOffline: string;
  selectLanguage: string;
  topicBased: string;
  aiGeneratorTitle: string;
  aiGeneratorDesc: string;
  btnOpenGenerator: string;
  btnCloseGenerator: string;
  inputTopicLabel: string;
  inputTopicPlaceholder: string;
  subjectLabel: string;
  standardLabel: string;
  languageLabel: string;
  btnGenerate: string;
  generatingMsg: string;
  searchPlaceholder: string;
  syncBtn: string;
  filterAllMaterials: string;
  filterMySaved: string;
  filterAiGenerated: string;
  filterNotes: string;
  filterEbooks: string;
  filterPyq: string;
  filterQuestions: string;
  filterOther: string;
  materialTypeLabel: string;
  allMaterialTypes: string;
  subjectFilterLabel: string;
  allSubjects: string;
  standardFilterLabel: string;
  allStandards: string;
  fileFormatLabel: string;
  allFormats: string;
  pdfDocuments: string;
  textDocuments: string;
  worksheetsQuizzes: string;
  languageFilterLabel: string;
  allLanguages: string;
  studyCategoriesTitle: string;
  exploreFolder: string;
  rootFolders: string;
  allCurriculumPdfs: string;
  loadingLibrary: string;
  noPdfFoundTitle: string;
  noPdfFoundDesc: string;
  clearAllFilters: string;
  btnReadPdf: string;
  btnSaveMaterial: string;
  btnSavedMaterial: string;
  btnDownload: string;
  btnTranslate: string;
  btnEdit: string;
  btnDelete: string;
  readAloud: string;
  stopAudio: string;
  aiVisualBoard: string;
  printExport: string;
  closeReader: string;
  translateModalTitle: string;
  translateModalDesc: string;
  btnConfirmTranslate: string;
  translatingMsg: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  cancelBtn: string;
  confirmDeleteBtn: string;
  editPdfTitle: string;
  saveChanges: string;
  toastSaved: string;
  toastUnsaved: string;
}> = {
  en: {
    pageTitle: "PDF Notes & Study Materials",
    pageSubtitle: "Access, read, and download official chapter notes, solved model question papers, board exam formula sheets, and worksheets in multiple languages.",
    officialHubBadge: "Official Curriculum & AI Study Hub",
    badgeOfficialDocs: "Official Documents",
    badgeFolders: "Study Folders",
    badgeSavedOffline: "Saved Offline",
    selectLanguage: "Interface Language:",
    topicBased: "Topic-Based",
    aiGeneratorTitle: "AI Study Material Generator",
    aiGeneratorDesc: "Enter any chapter or main topic to generate instant structured notes, key formulas, and practice questions saved directly under My Saved Material.",
    btnOpenGenerator: "Generate Material by Topic ✨",
    btnCloseGenerator: "Close Generator",
    inputTopicLabel: "Main Topic / Chapter Title",
    inputTopicPlaceholder: "e.g. Photosynthesis, Quadratic Equations, Freedom Movement",
    subjectLabel: "Subject",
    standardLabel: "Standard / Class",
    languageLabel: "Language",
    btnGenerate: "Generate Complete Material ✨",
    generatingMsg: "Generating Study Material...",
    searchPlaceholder: "Search PDF notes, titles, or subjects...",
    syncBtn: "Sync",
    filterAllMaterials: "🌟 All Materials",
    filterMySaved: "⭐ My Saved Material",
    filterAiGenerated: "✨ AI Generated Material",
    filterNotes: "📝 Notes & Summaries",
    filterEbooks: "📚 E-Books & Textbooks",
    filterPyq: "📜 Previous Year Papers (PYQ)",
    filterQuestions: "✍️ Practice Questions",
    filterOther: "📁 Other Resources",
    materialTypeLabel: "Material Type",
    allMaterialTypes: "All Material Types",
    subjectFilterLabel: "Subject Filter",
    allSubjects: "All Subjects",
    standardFilterLabel: "Standard / Class",
    allStandards: "All Standards (Class 1-12)",
    fileFormatLabel: "File Format",
    allFormats: "All File Formats",
    pdfDocuments: "📄 PDF Documents",
    textDocuments: "📝 Text Documents",
    worksheetsQuizzes: "🎯 Worksheets & Quizzes",
    languageFilterLabel: "Language Filter",
    allLanguages: "All Languages",
    studyCategoriesTitle: "Study Categories & Folders",
    exploreFolder: "Explore Folder",
    rootFolders: "Root Folders",
    allCurriculumPdfs: "All Curriculum PDFs",
    loadingLibrary: "Loading official admin PDF library...",
    noPdfFoundTitle: "No PDF Documents Found",
    noPdfFoundDesc: "No matching PDF files found for the current search query or filter. Try clearing your filters or selecting a different subject.",
    clearAllFilters: "Clear All Filters",
    btnReadPdf: "Read PDF",
    btnSaveMaterial: "⭐ Save",
    btnSavedMaterial: "✓ Saved",
    btnDownload: "Download PDF",
    btnTranslate: "🌐 Translate",
    btnEdit: "Edit",
    btnDelete: "Delete",
    readAloud: "Read Aloud",
    stopAudio: "Stop Audio",
    aiVisualBoard: "AI Visual Board",
    printExport: "Print / Export",
    closeReader: "Close",
    translateModalTitle: "AI Study Material Translator",
    translateModalDesc: "Translate this PDF notes & study guide into any language instantly using AI.",
    btnConfirmTranslate: "Translate & Save PDF ✨",
    translatingMsg: "Translating Study Guide...",
    deleteConfirmTitle: "Delete Study Material",
    deleteConfirmDesc: "Are you sure you want to delete this PDF study material? This action will remove it from offline access and cloud storage.",
    cancelBtn: "Cancel",
    confirmDeleteBtn: "Yes, Delete",
    editPdfTitle: "Edit Study Material Details",
    saveChanges: "Save Changes",
    toastSaved: "✨ Saved to My Saved Material!",
    toastUnsaved: "Removed from My Saved Material."
  },
  hi: {
    pageTitle: "पीडीएफ नोट्स और अध्ययन सामग्री",
    pageSubtitle: "अध्याय नोट्स, मॉडल प्रश्न पत्र, बोर्ड परीक्षा सूत्र और कार्यपत्रक कई भाषाओं में पढ़ें और डाउनलोड करें।",
    officialHubBadge: "आधिकारिक पाठ्यक्रम एवं एआई अध्ययन केंद्र",
    badgeOfficialDocs: "आधिकारिक दस्तावेज",
    badgeFolders: "अध्ययन फोल्डर",
    badgeSavedOffline: "ऑफलाइन सहेजा गया",
    selectLanguage: "इंटरफ़ेस भाषा:",
    topicBased: "विषय-आधारित",
    aiGeneratorTitle: "एआई अध्ययन सामग्री जनरेटर",
    aiGeneratorDesc: "मेरी सहेजी गई सामग्री के तहत तुरंत व्यवस्थित नोट्स, मुख्य सूत्र और अभ्यास प्रश्न बनाने के लिए कोई भी मुख्य विषय दर्ज करें।",
    btnOpenGenerator: "विषय द्वारा सामग्री बनाएं ✨",
    btnCloseGenerator: "जनरेटर बंद करें",
    inputTopicLabel: "मुख्य विषय / अध्याय का नाम",
    inputTopicPlaceholder: "उदा. प्रकाश संश्लेषण, द्विघात समीकरण, स्वतंत्रता संग्राम",
    subjectLabel: "विषय",
    standardLabel: "कक्षा / श्रेणी",
    languageLabel: "भाषा",
    btnGenerate: "संपूर्ण सामग्री बनाएं ✨",
    generatingMsg: "सामग्री बनाई जा रही है...",
    searchPlaceholder: "पीडीएफ नोट्स, शीर्षक या विषय खोजें...",
    syncBtn: "सिंक करें",
    filterAllMaterials: "🌟 सभी सामग्री",
    filterMySaved: "⭐ मेरी सहेजी गई सामग्री",
    filterAiGenerated: "✨ एआई जनित सामग्री",
    filterNotes: "📝 नोट्स और सारांश",
    filterEbooks: "📚 ई-पुस्तकें और पाठ्यपुस्तकें",
    filterPyq: "📜 पिछले वर्षों के प्रश्न पत्र (PYQ)",
    filterQuestions: "✍️ अभ्यास प्रश्न",
    filterOther: "📁 अन्य संसाधन",
    materialTypeLabel: "सामग्री प्रकार",
    allMaterialTypes: "सभी सामग्री प्रकार",
    subjectFilterLabel: "विषय फ़िल्टर",
    allSubjects: "सभी विषय",
    standardFilterLabel: "कक्षा / श्रेणी",
    allStandards: "सभी कक्षाएं (कक्षा 1-12)",
    fileFormatLabel: "फ़ाइल प्रारूप",
    allFormats: "सभी फ़ाइल प्रारूप",
    pdfDocuments: "📄 पीडीएफ दस्तावेज़",
    textDocuments: "📝 पाठ दस्तावेज़",
    worksheetsQuizzes: "🎯 अभ्यास पत्र और प्रश्नोत्तरी",
    languageFilterLabel: "भाषा फ़िल्टर",
    allLanguages: "सभी भाषाएं",
    studyCategoriesTitle: "अध्ययन श्रेणियां और फ़ोल्डर",
    exploreFolder: "फ़ोल्डर खोलें",
    rootFolders: "मुख्य फ़ोल्डर",
    allCurriculumPdfs: "सभी पाठ्यक्रम पीडीएफ",
    loadingLibrary: "आधिकारिक पीडीएफ लाइब्रेरी लोड हो रही है...",
    noPdfFoundTitle: "कोई पीडीएफ दस्तावेज़ नहीं मिला",
    noPdfFoundDesc: "आपकी खोज या फ़िल्टर से मेल खाने वाली कोई पीडीएफ नहीं मिली। कृपया फ़िल्टर बदलें।",
    clearAllFilters: "सभी फ़िल्टर साफ़ करें",
    btnReadPdf: "पीडीएफ पढ़ें",
    btnSaveMaterial: "⭐ सहेजें",
    btnSavedMaterial: "✓ सहेजा गया",
    btnDownload: "डाउनलोड करें",
    btnTranslate: "🌐 अनुवाद",
    btnEdit: "संपादित करें",
    btnDelete: "हटाएं",
    readAloud: "बोलकर सुनाएं",
    stopAudio: "ऑडियो रोकें",
    aiVisualBoard: "एआई विजुअल बोर्ड",
    printExport: "प्रिंट / निर्यात",
    closeReader: "बंद करें",
    translateModalTitle: "एआई अध्ययन सामग्री अनुवादक",
    translateModalDesc: "एआई का उपयोग करके इस पीडीएफ सामग्री का किसी भी भाषा में तुरंत अनुवाद करें।",
    btnConfirmTranslate: "अनुवाद करें और सहेजें ✨",
    translatingMsg: "अनुवाद किया जा रहा है...",
    deleteConfirmTitle: "अध्ययन सामग्री हटाएं",
    deleteConfirmDesc: "क्या आप वाकई इस पीडीएफ अध्ययन सामग्री को हटाना चाहते हैं?",
    cancelBtn: "रद्द करें",
    confirmDeleteBtn: "हाँ, हटाएं",
    editPdfTitle: "अध्ययन सामग्री विवरण संपादित करें",
    saveChanges: "परिवर्तन सहेजें",
    toastSaved: "✨ मेरी सहेजी गई सामग्री में सहेजा गया!",
    toastUnsaved: "मेरी सामग्री से हटा दिया गया।"
  },
  gu: {
    pageTitle: "પીડીએફ નોટ્સ અને અભ્યાસ સામગ્રી",
    pageSubtitle: "અધિકૃત પ્રકરણ નોટ્સ, સોલ્વ કરેલા મોડેલ પેપર્સ, બોર્ડ પરીક્ષાના સૂત્રો અને વર્કશીટ્સ વિવિધ ભાષાઓમાં વાંચો અને ડાઉનલોડ કરો.",
    officialHubBadge: "સત્તાવાર અભ્યાસક્રમ અને એઆઈ સ્ટડી હબ",
    badgeOfficialDocs: "સત્તાવાર દસ્તાવેજો",
    badgeFolders: "અભ્યાસ ફોલ્ડર્સ",
    badgeSavedOffline: "ઓફલાઇન સેવ કરેલ",
    selectLanguage: "ઈન્ટરફેસ ભાષા:",
    topicBased: "ટોપિક આધારિત",
    aiGeneratorTitle: "એઆઈ અભ્યાસ સામગ્રી જનરેટર",
    aiGeneratorDesc: "માય સેવ્ડ મટિરિયલમાં સીધા સેવ થતા સ્ટ્રક્ચર્ડ નોટ્સ, મુખ્ય સૂત્રો અને પ્રશ્નો જનરેટ કરવા માટે કોઈપણ મુખ્ય વિષય દાખલ કરો.",
    btnOpenGenerator: "ટોપિક મુજબ સામગ્રી બનાવો ✨",
    btnCloseGenerator: "જનરેટર બંધ કરો",
    inputTopicLabel: "મુખ્ય વિષય / પ્રકરણનું નામ",
    inputTopicPlaceholder: "દા.ત. પ્રકાશ સંશ્લેષણ, દ્વિઘાત સમીકરણો, સ્વાતંત્ર્ય સંગ્રામ",
    subjectLabel: "વિષય",
    standardLabel: "ધોરણ / વર્ગ",
    languageLabel: "ભાષા",
    btnGenerate: "સંપૂર્ણ સામગ્રી બનાવો ✨",
    generatingMsg: "સામગ્રી જનરેટ થઈ રહી છે...",
    searchPlaceholder: "પીડીએફ નોટ્સ, શીર્ષક અથવા વિષય શોધો...",
    syncBtn: "સિંક કરો",
    filterAllMaterials: "🌟 બધી સામગ્રી",
    filterMySaved: "⭐ માય સેવ્ડ મટિરિયલ",
    filterAiGenerated: "✨ એઆઈ જનરેટ કરેલ સામગ્રી",
    filterNotes: "📝 નોટ્સ અને સારાંશ",
    filterEbooks: "📚 ઈ-બુક્સ અને પાઠ્યપુસ્તકો",
    filterPyq: "📜 ભૂતકાળના પેપર્સ (PYQ)",
    filterQuestions: "✍️ પ્રેક્ટિસ પ્રશ્નો",
    filterOther: "📁 અન્ય સાધનો",
    materialTypeLabel: "સામગ્રી પ્રકાર",
    allMaterialTypes: "બધા સામગ્રી પ્રકારો",
    subjectFilterLabel: "વિષય ફિલ્ટર",
    allSubjects: "બધા વિષયો",
    standardFilterLabel: "ધોરણ / વર્ગ",
    allStandards: "બધા ધોરણ (ધોરણ 1-12)",
    fileFormatLabel: "ફાઇલ પ્રકાર",
    allFormats: "બધા ફાઇલ પ્રકારો",
    pdfDocuments: "📄 પીડીએફ દસ્તાવેજો",
    textDocuments: "📝 ટેક્સ્ટ દસ્તાવેજો",
    worksheetsQuizzes: "🎯 વર્કશીટ્સ અને ક્વિઝ",
    languageFilterLabel: "ભાષા ફિલ્ટર",
    allLanguages: "બધી ભાષાઓ",
    studyCategoriesTitle: "અભ્યાસ શ્રેણીઓ અને ફોલ્ડર્સ",
    exploreFolder: "ફોલ્ડર જુઓ",
    rootFolders: "મુખ્ય ફોલ્ડર્સ",
    allCurriculumPdfs: "બધા અભ્યાસક્રમ પીડીએફ",
    loadingLibrary: "અધિકૃત પીડીએફ લાયબ્રેરી લોડ થઈ રહી છે...",
    noPdfFoundTitle: "કોઈ પીડીએફ દસ્તાવેજ મળ્યો નથી",
    noPdfFoundDesc: "તમારી શોધ અથવા ફિલ્ટર્સ સાથે મેળ ખાતી કોઈ સામગ્રી મળી નથી. કૃપા કરીને ફિલ્ટર્સ બદલો.",
    clearAllFilters: "બધા ફિલ્ટર્સ સાફ કરો",
    btnReadPdf: "PDF વાંચો",
    btnSaveMaterial: "⭐ સેવ કરો",
    btnSavedMaterial: "✓ સેવ કરેલ",
    btnDownload: "ડાઉનલોડ કરો",
    btnTranslate: "🌐 અનુવાદ",
    btnEdit: "ફેરફાર કરો",
    btnDelete: "કાઢી નાખો",
    readAloud: "વાંચી સંભળાવો",
    stopAudio: "ઓડિયો રોકો",
    aiVisualBoard: "એઆઈ વિઝ્યુઅલ બોર્ડ",
    printExport: "પ્રિન્ટ / એક્સપોર્ટ",
    closeReader: "બંધ કરો",
    translateModalTitle: "એઆઈ અભ્યાસ સામગ્રી અનુવાદક",
    translateModalDesc: "એઆઈ વડે આ પીડીએફ સામગ્રીનું કોઈપણ ભાષામાં તુરંત અનુવાદ કરો.",
    btnConfirmTranslate: "અનુવાદ કરો અને સેવ કરો ✨",
    translatingMsg: "અનુવાદ થઈ રહ્યું છે...",
    deleteConfirmTitle: "અભ્યાસ સામગ્રી કાઢી નાખો",
    deleteConfirmDesc: "શું તમે ખરેખર આ પીડીએફ અભ્યાસ સામગ્રી કાઢી નાખવા માંગો છો?",
    cancelBtn: "રદ કરો",
    confirmDeleteBtn: "હા, કાઢી નાખો",
    editPdfTitle: "અભ્યાસ સામગ્રીની વિગતો સંપાદિત કરો",
    saveChanges: "ફેરફારો સેવ કરો",
    toastSaved: "✨ માય સેવ્ડ મટિરિયલમાં સેવ થઈ ગયું!",
    toastUnsaved: "માય સેવ્ડ મટિરિયલમાંથી દૂર કરવામાં આવ્યું."
  },
  mr: {
    pageTitle: "पीडीएफ नोट्स आणि अभ्यास साहित्य",
    pageSubtitle: "अधिकृत धडा नोट्स, सोडवलेले मॉडेल पेपर्स, बोर्ड परीक्षा सूत्रे आणि कार्यपत्रिका अनेक भाषांमध्ये वाचा आणि डाउनलोड करा.",
    officialHubBadge: "अधिकृत अभ्यासक्रम आणि एआय स्टडी हબ",
    badgeOfficialDocs: "अधिकृत कागदपत्रे",
    badgeFolders: "अभ्यास फोल्डर्स",
    badgeSavedOffline: "ऑफलाइन जतन केले",
    selectLanguage: "इंटरफेस भाषा:",
    topicBased: "विषयावर आधारित",
    aiGeneratorTitle: "एआय अभ्यास साहित्य जनरेटर",
    aiGeneratorDesc: "माझे जतन केलेले साहित्य अंतर्गत त्वरित संरचित नोट्स, मुख्य सूत्रे आणि सराव प्रश्न तयार करण्यासाठी कोणताही मुख्य विषय प्रविष्ट करा.",
    btnOpenGenerator: "विषयानुसार साहित्य तयार करा ✨",
    btnCloseGenerator: "जनरेटर बंद करा",
    inputTopicLabel: "मुख्य विषय / धड्याचे नाव",
    inputTopicPlaceholder: "उदा. प्रकाशसंश्लेषण, वर्गसमीकरणे, स्वातंत्र्य लढा",
    subjectLabel: "विषय",
    standardLabel: "इयत्ता / वर्ग",
    languageLabel: "भाषा",
    btnGenerate: "संपूर्ण साहित्य तयार करा ✨",
    generatingMsg: "साहित्य तयार होत आहे...",
    searchPlaceholder: "पीडीएफ नोट्स, शीर्षके किंवा विषय शोधा...",
    syncBtn: "सिंक करा",
    filterAllMaterials: "🌟 सर्व साहित्य",
    filterMySaved: "⭐ माझे जतन केलेले साहित्य",
    filterAiGenerated: "✨ एआय जनरेट केलेले साहित्य",
    filterNotes: "📝 नोट्स आणि सारांश",
    filterEbooks: "📚 ई-पुस्तके आणि पाठ्यपुस्तके",
    filterPyq: "📜 मागील वर्षांचे प्रश्नपत्रक (PYQ)",
    filterQuestions: "✍️ सराव प्रश्न",
    filterOther: "📁 इतर साधने",
    materialTypeLabel: "साहित्य प्रकार",
    allMaterialTypes: "सर्व साहित्य प्रकार",
    subjectFilterLabel: "विषय फिल्टर",
    allSubjects: "सर्व विषय",
    standardFilterLabel: "इयत्ता / वर्ग",
    allStandards: "सर्व इयत्ता (इयत्ता 1-12)",
    fileFormatLabel: "फाइल प्रकार",
    allFormats: "सर्व फाइल प्रकार",
    pdfDocuments: "📄 पीडीएफ दस्तऐवज",
    textDocuments: "📝 मजकूर दस्तऐवज",
    worksheetsQuizzes: "🎯 कार्यपत्रिका आणि प्रश्नमंजुषा",
    languageFilterLabel: "भाषा फिल्टर",
    allLanguages: "सर्व भाषा",
    studyCategoriesTitle: "अभ्यास श्रेणी आणि फोल्डर्स",
    exploreFolder: "फोल्डर उघडा",
    rootFolders: "मुख्य फोल्डर्स",
    allCurriculumPdfs: "सर्व अभ्यासक्रम पीडीएफ",
    loadingLibrary: "अधिकृत पीडीएफ लायब्ररी लोड होत आहे...",
    noPdfFoundTitle: "कोणतेही पीडीएफ दस्तऐवज आढळले नाही",
    noPdfFoundDesc: "तुमच्या शोधाशी जुळणारे कोणतेही अभ्यास साहित्य आढळले नाही. कृपया फिल्टर बदला.",
    clearAllFilters: "सर्व फिल्टर्स साफ करा",
    btnReadPdf: "पीडीएफ वाचा",
    btnSaveMaterial: "⭐ जतन करा",
    btnSavedMaterial: "✓ जतन केले",
    btnDownload: "डाउनलोड करा",
    btnTranslate: "🌐 भाषांतर",
    btnEdit: "संपादित करा",
    btnDelete: "हटवा",
    readAloud: "मोठ्याने वाचा",
    stopAudio: "ऑडिओ थांबवा",
    aiVisualBoard: "एआय व्हिज्युअल बोर्ड",
    printExport: "प्रिंट / एक्सपोर्ट",
    closeReader: "बंद करा",
    translateModalTitle: "एआय अभ्यास साहित्य अनुवादक",
    translateModalDesc: "एआय वापरून या पीडीएफ साहित्याचे कोणत्याही भाषेत त्वरित भाषांतर करा.",
    btnConfirmTranslate: "भाषांतर करा आणि जतन करा ✨",
    translatingMsg: "भाषांतर होत आहे...",
    deleteConfirmTitle: "अभ्यास साहित्य हटवा",
    deleteConfirmDesc: "तुम्हाला खात्री आहे की तुम्ही हे पीडीएफ साहित्य हटवू इच्छिता?",
    cancelBtn: "रद्द करा",
    confirmDeleteBtn: "होय, हटवा",
    editPdfTitle: "अभ्यास साहित्याचे तपशील संपादित करा",
    saveChanges: "बदल जतन करा",
    toastSaved: "✨ माझ्या जतन केलेल्या साहित्यात जतन केले!",
    toastUnsaved: "माझ्या साहित्यातून काढून टाकले."
  },
  ta: {
    pageTitle: "PDF குறிப்புகள் & பாடப் பொருட்கள்",
    pageSubtitle: "அதிகாரப்பூர்வ பாடக் குறிப்புகள், மாதிரி வினாத்தாள்கள் மற்றும் தேர்வு சூத்திரத் தாள்களைப் பல மொழிகளில் படித்துப் பதிவிறக்கவும்.",
    officialHubBadge: "அதிகாரப்பூர்வ பாடத்திட்டம் & AI படிப்பு மையம்",
    badgeOfficialDocs: "அதிகாரப்பூர்வ ஆவணங்கள்",
    badgeFolders: "பாடக் கோப்புறைகள்",
    badgeSavedOffline: "ஆஃப்லைனில் சேமிக்கப்பட்டது",
    selectLanguage: "இடைமுக மொழி:",
    topicBased: "தலைப்பு அடிப்படையிலானது",
    aiGeneratorTitle: "AI பாடப் பொருள் உருவாக்குபவர்",
    aiGeneratorDesc: "எனது சேமிக்கப்பட்ட பொருட்களின் கீழ் உடனடி குறிப்புகள், சூத்திரங்கள் மற்றும் பயிற்சி வினாக்களை உருவாக்க முதன்மை தலைப்பை உள்ளிடவும்.",
    btnOpenGenerator: "தலைப்பு மூலம் பொருள் உருவாக்க ✨",
    btnCloseGenerator: "மூடுக",
    inputTopicLabel: "முதன்மை தலைப்பு / பாடப் பெயர்",
    inputTopicPlaceholder: "எ.கா. ஒளிச்சேர்க்கை, இருபடிச் சமன்பாடுகள், விடுதலை இயக்கம்",
    subjectLabel: "பாடம்",
    standardLabel: "வகுப்பு",
    languageLabel: "மொழி",
    btnGenerate: "முழுமையான பொருளை உருவாக்க ✨",
    generatingMsg: "பாடப் பொருள் உருவாகிறது...",
    searchPlaceholder: "PDF குறிப்புகள் அல்லது பாடங்களைத் தேடுங்கள்...",
    syncBtn: "ஒத்திசை",
    filterAllMaterials: "🌟 அனைத்து பொருட்கள்",
    filterMySaved: "⭐ எனது சேமிக்கப்பட்ட பொருட்கள்",
    filterAiGenerated: "✨ AI உருவாக்கிய பாடப்பொருள்",
    filterNotes: "📝 குறிப்புகள் & சுருக்கம்",
    filterEbooks: "📚 மின்னூல்கள் & பாடப்புத்தகங்கள்",
    filterPyq: "📜 முந்தைய ஆண்டு வினாத்தாள்கள் (PYQ)",
    filterQuestions: "✍️ பயிற்சி வினாக்கள்",
    filterOther: "📁 பிற வளங்கள்",
    materialTypeLabel: "பொருள் வகை",
    allMaterialTypes: "அனைத்து பொருள் வகைகள்",
    subjectFilterLabel: "பாடம் வடிகட்டி",
    allSubjects: "அனைத்து பாடங்கள்",
    standardFilterLabel: "வகுப்பு",
    allStandards: "அனைத்து வகுப்புகள் (1-12)",
    fileFormatLabel: "கோப்பு வடிவம்",
    allFormats: "அனைத்து கோப்பு வடிவங்கள்",
    pdfDocuments: "📄 PDF ஆவணங்கள்",
    textDocuments: "📝 உரை ஆவணங்கள்",
    worksheetsQuizzes: "🎯 பணித்தாள்கள் & வினாடி வினாக்கள்",
    languageFilterLabel: "மொழி வடிகட்டி",
    allLanguages: "அனைத்து மொழிகளும்",
    studyCategoriesTitle: "பாடப் பிரிவுகள் & கோப்புறைகள்",
    exploreFolder: "கோப்புறையைப் பார்க்க",
    rootFolders: "முதன்மை கோப்புறைகள்",
    allCurriculumPdfs: "அனைத்து பாடத்திட்ட PDFகள்",
    loadingLibrary: "PDF நூலகம் ஏற்றப்படுகிறது...",
    noPdfFoundTitle: "PDF ஆவணங்கள் எதுவும் கிடைக்கவில்லை",
    noPdfFoundDesc: "உங்கள் தேடலுக்குப் பொருத்தமான பாடப் பொருட்கள் எதுவும் கிடைக்கவில்லை. வடிப்பான்களை மாற்றவும்.",
    clearAllFilters: "அனைத்து வடிப்பான்களையும் அழி",
    btnReadPdf: "PDF வாசிக்க",
    btnSaveMaterial: "⭐ சேமிக்க",
    btnSavedMaterial: "✓ சேமிக்கப்பட்டது",
    btnDownload: "பதிவிறக்க",
    btnTranslate: "🌐 மொழிபெயர்ப்பு",
    btnEdit: "திருத்து",
    btnDelete: "நீக்குக",
    readAloud: "வாசித்துக் காட்டு",
    stopAudio: "ஆடியோவை நிறுத்து",
    aiVisualBoard: "AI விஷுவல் போர்டு",
    printExport: "அச்சிடுக / ஏற்றுமதி",
    closeReader: "மூடு",
    translateModalTitle: "AI பாடப் பொருள் மொழிபெயர்ப்பாளர்",
    translateModalDesc: "AI ஐப் பயன்படுத்தி இந்தப் பாடப் பொருளை எந்த மொழியிலும் உடனடியாக மொழிபெயர்க்கவும்.",
    btnConfirmTranslate: "மொழிபெயர்த்து சேமிக்க ✨",
    translatingMsg: "மொழிபெயர்க்கிறது...",
    deleteConfirmTitle: "பாடப் பொருளை நீக்குக",
    deleteConfirmDesc: "இந்த PDF பாடப்பொருளை நீக்க விரும்புகிறீர்களா?",
    cancelBtn: "ரத்து செய்",
    confirmDeleteBtn: "ஆம், நீக்குக",
    editPdfTitle: "பாடப் பொருள் விவரங்களைத் திருத்து",
    saveChanges: "மாற்றங்களைச் சேமி",
    toastSaved: "✨ எனது சேமிக்கப்பட்ட பொருட்களில் சேமிக்கப்பட்டது!",
    toastUnsaved: "சேமிக்கப்பட்ட பொருட்களிலிருந்து அகற்றப்பட்டது."
  },
  te: {
    pageTitle: "PDF నోట్స్ & అధ్యయన సామగ్రి",
    pageSubtitle: "అధికారిక అధ్యాయాల నోట్స్, మోడల్ పేపర్లు మరియు బోర్డు పరీక్ష సూత్రాల షీట్లను పలు భాషల్లో చదవండి మరియు డౌన్లోడ్ చేయండి.",
    officialHubBadge: "అధికారిక పాఠ్యాంశాలు & AI స్టడీ హబ్",
    badgeOfficialDocs: "అధికారిక పత్రాలు",
    badgeFolders: "అధ్యయన ఫోల్డర్లు",
    badgeSavedOffline: "ఆఫ్లైన్లో సేవ్ చేయబడింది",
    selectLanguage: "ఇంటర్ఫేస్ భాష:",
    topicBased: "అంశం ఆధారితం",
    aiGeneratorTitle: "AI అధ్యయన సామగ్రి జనరేటర్",
    aiGeneratorDesc: "నా సేవ్ చేసిన మెటీరియల్స్ కింద సత్వర నోట్స్, సూత్రాలు మరియు ప్రాక్టీస్ ప్రశ్నలను రూపొందించడానికి ముఖ్య అంశాన్ని నమోదు చేయండి.",
    btnOpenGenerator: "అంశం ఆధారంగా మెటీరియల్ సృష్టించండి ✨",
    btnCloseGenerator: "మూసివేయండి",
    inputTopicLabel: "ముఖ్య అంశం / అధ్యాయం పేరు",
    inputTopicPlaceholder: "ఉదా. కిరణజన్య సంయోగక్రియ, వర్గ సమీకరణాలు",
    subjectLabel: "సబ్జెక్టు",
    standardLabel: "తరగతి",
    languageLabel: "భాష",
    btnGenerate: "పూర్తి మెటీరియల్ సృష్టించండి ✨",
    generatingMsg: "మెటీరియల్ సృష్టించబడుతోంది...",
    searchPlaceholder: "PDF నోట్స్ లేదా సబ్జెక్టులను శోధించండి...",
    syncBtn: "సింక్",
    filterAllMaterials: "🌟 అన్ని మెటీరియల్స్",
    filterMySaved: "⭐ నా సేవ్ చేసిన మెటీరియల్స్",
    filterAiGenerated: "✨ AI సృష్టించిన మెటీరియల్",
    filterNotes: "📝 నోట్స్ & సారాంశాలు",
    filterEbooks: "📚 ఇ-బుక్స్ & పాఠ్యపుస్తకాలు",
    filterPyq: "📜 మునుపటి సంవత్సరాల పేపర్లు (PYQ)",
    filterQuestions: "✍️ ప్రాక్టీస్ ప్రశ్నలు",
    filterOther: "📁 ఇతర వనరులు",
    materialTypeLabel: "మెటీరియల్ రకం",
    allMaterialTypes: "అన్ని మెటీరియల్ రకాలు",
    subjectFilterLabel: "సబ్జెక్టు ఫిల్టర్",
    allSubjects: "అన్ని సబ్జెక్టులు",
    standardFilterLabel: "తరగతి",
    allStandards: "అన్ని తరగతులు (1-12)",
    fileFormatLabel: "ఫైల్ ఫార్మాట్",
    allFormats: "అన్ని ఫైల్ ఫార్మాట్లు",
    pdfDocuments: "📄 PDF పత్రాలు",
    textDocuments: "📝 టెక్స్ట్ పత్రాలు",
    worksheetsQuizzes: "🎯 వర్క్షీట్లు & క్విజ్లు",
    languageFilterLabel: "భాష ఫిల్టర్",
    allLanguages: "అన్ని భాషలు",
    studyCategoriesTitle: "అధ్యయన వర్గాలు & ఫోల్డర్లు",
    exploreFolder: "ఫోల్డర్ చూడండి",
    rootFolders: "ప్రధాన ఫోల్డర్లు",
    allCurriculumPdfs: "అన్ని పాఠ్యాంశ PDFలు",
    loadingLibrary: "PDF లైబ్రరీ లోడ్ అవుతోంది...",
    noPdfFoundTitle: "PDF పత్రాలు ఏవీ కనుగొనబడలేదు",
    noPdfFoundDesc: "మీ శోధనకు తగిన అధ్యయన సామగ్రి ఏదీ కనుగొనబడలేదు. దయచేసి ఫిల్టర్లను మార్చండి.",
    clearAllFilters: "అన్ని ఫిల్టర్లను క్లియర్ చేయండి",
    btnReadPdf: "PDF చదవండి",
    btnSaveMaterial: "⭐ సేవ్ చేయండి",
    btnSavedMaterial: "✓ సేవ్ చేయబడింది",
    btnDownload: "డౌన్లోడ్",
    btnTranslate: "🌐 అనువాదం",
    btnEdit: "సవరించు",
    btnDelete: "తొలగించు",
    readAloud: "బిగ్గరగా చదవండి",
    stopAudio: "ఆడియో ఆపండి",
    aiVisualBoard: "AI విజువల్ బోర్డ్",
    printExport: "ప్రింట్ / ఎగుమతి",
    closeReader: "మూసివేయి",
    translateModalTitle: "AI అధ్యయన సామగ్రి అనువాదకుడు",
    translateModalDesc: "AI ని ఉపయోగించి ఈ పిడిఎఫ్ మెటీరియల్ ను ఏ భాషలోనైనా తక్షణమే అనువదించండి.",
    btnConfirmTranslate: "అనువదించి సేవ్ చేయండి ✨",
    translatingMsg: "అనువదించబడుతోంది...",
    deleteConfirmTitle: "అధ్యయన సామగ్రిని తొలగించండి",
    deleteConfirmDesc: "మీరు ఖచ్చితంగా ఈ PDF అధ్యయన సామగ్రిని తొలగించాలనుకుంటున్నారా?",
    cancelBtn: "రద్దు చేయండి",
    confirmDeleteBtn: "అవును, తొలగించు",
    editPdfTitle: "అధ్యయన సామగ్రి వివరాలను సవరించండి",
    saveChanges: "మార్పులను సేవ్ చేయండి",
    toastSaved: "✨ నా సేవ్ చేసిన మెటీరియల్స్ లో సేవ్ చేయబడింది!",
    toastUnsaved: "నా మెటీరియల్స్ నుండి తొలగించబడింది."
  }
};

export const checkIsAiGenerated = (file: CurriculumFile | null | undefined): boolean => {
  if (!file) return false;
  return (
    (file as any).isGenerated === true ||
    (file as any).isAiGenerated === true ||
    file.id.startsWith('gen-pdf-') ||
    file.id.startsWith('ai-') ||
    (file.category as string) === 'ai_generated' ||
    (file.category as string) === 'AI Generated' ||
    (file as any).materialType === 'ai_generated' ||
    (file as any).source === 'ai'
  );
};

export const checkIsEbookOrTextbook = (file: CurriculumFile | null | undefined): boolean => {
  if (!file) return false;
  return (
    file.materialType === 'ebook' ||
    (file.category as string) === 'Textbooks' ||
    (file.category as string) === 'Curriculum' ||
    (file as any).isAdminOnly === true
  );
};

export default function AdminPdfsTab({ user, lang }: AdminPdfsTabProps) {
  // Multilingual Active Language State
  const [activeLang, setActiveLang] = useState<LanguageCode>(lang || 'en');
  const t = STUDY_MATERIALS_TRANSLATIONS[activeLang] || STUDY_MATERIALS_TRANSLATIONS.en;

  // Folder & File Management state
  const [folders, setFolders] = useState<CurriculumFolder[]>([]);
  const [files, setFiles] = useState<CurriculumFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation & Filters
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // AI Translation Modal State
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translatingFile, setTranslatingFile] = useState<CurriculumFile | null>(null);
  const [translateTargetLang, setTranslateTargetLang] = useState<string>('Hindi');
  const [translateLoading, setTranslateLoading] = useState(false);

  // AI Topic Study Material Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState('Science');
  const [genStandard, setGenStandard] = useState('Class 10');
  const [genLanguage, setGenLanguage] = useState('English');
  const [genCustomLanguage, setGenCustomLanguage] = useState('');
  const [genMaterialFormat, setGenMaterialFormat] = useState<'ebook' | 'notes' | 'pyq' | 'practice_questions'>('ebook');
  const [genLoading, setGenLoading] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);

  // Offline Downloaded PDF Cache Tracker
  const [downloadedPdfIds, setDownloadedPdfIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${user.mobile}_downloaded_admin_pdfs`);
      return saved ? JSON.parse(saved) : ['pdf-std10-sci-notes', 'pdf-std10-math-formulas'];
    } catch {
      return ['pdf-std10-sci-notes', 'pdf-std10-math-formulas'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${user.mobile}_downloaded_admin_pdfs`, JSON.stringify(downloadedPdfIds));
    } catch (e) {
      console.warn("Failed to persist downloaded admin PDFs:", e);
    }
  }, [downloadedPdfIds, user.mobile]);

  // Synchronize active language whenever lang prop changes
  useEffect(() => {
    if (lang) {
      setActiveLang(lang);
      setWorkspaceTargetLang(lang);
    }
  }, [lang]);

  // Reader Modal State
  const [activePdfFile, setActivePdfFile] = useState<CurriculumFile | null>(null);
  const [activePdfText, setActivePdfText] = useState<{ pageNum: number; text: string }[]>([]);
  const [pdfWorkspaceTab, setPdfWorkspaceTab] = useState<'reader' | 'translate' | 'solve' | 'summary' | 'notes'>('reader');
  const [isPdfSpeaking, setIsPdfSpeaking] = useState(false);
  const [workspaceTargetLang, setWorkspaceTargetLang] = useState<string>(lang);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceResult, setWorkspaceResult] = useState<any>(null);
  const [videoSlideIndex, setVideoSlideIndex] = useState(0);
  const [workspaceViewMode, setWorkspaceViewMode] = useState<'text' | 'diagram' | 'video'>('text');

  // Edit PDF Modal State for Admin
  const [editingFile, setEditingFile] = useState<CurriculumFile | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editStandard, setEditStandard] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete PDF Modal State for iFrame compatibility
  const [fileToDelete, setFileToDelete] = useState<CurriculumFile | null>(null);
  const [deletePermissionError, setDeletePermissionError] = useState<string | null>(null);


  // Load Curriculum Files from Firestore & LocalStorage
  const loadCurriculumData = async () => {
    setLoading(true);
    try {
      // 0. Read deleted file IDs to prevent deleted items from reappearing
      let deletedIds: string[] = [];
      try {
        const savedDeleted1 = localStorage.getItem('gramin_curriculum_deleted_files_v2');
        if (savedDeleted1) deletedIds.push(...JSON.parse(savedDeleted1));
        const savedDeleted2 = localStorage.getItem('gramin_deleted_file_ids_v1');
        if (savedDeleted2) deletedIds.push(...JSON.parse(savedDeleted2));
      } catch (e) {
        console.warn("Error reading deleted files list:", e);
      }

      // 1. Load from localStorage first for instant speed
      let localFolders: CurriculumFolder[] = [];
      let localFiles: CurriculumFile[] = [];

      try {
        const savedFolders = localStorage.getItem('gramin_curriculum_folders_v2');
        if (savedFolders) localFolders = JSON.parse(savedFolders);
      } catch (e) {
        console.warn("Error reading local folders:", e);
      }

      try {
        const savedFiles = localStorage.getItem('gramin_curriculum_files_v2');
        if (savedFiles) localFiles = JSON.parse(savedFiles);
      } catch (e) {
        console.warn("Error reading local files:", e);
      }

      // 2. Fetch remote Firestore items
      const [remoteFolders, remoteFiles] = await Promise.all([
        getAllFirebaseCurriculumFolders().catch(() => []),
        getAllFirebaseCurriculumFiles().catch(() => [])
      ]);

      // Merge folders
      const folderMap = new Map<string, CurriculumFolder>();
      DEFAULT_CURRICULUM_FOLDERS.forEach(f => folderMap.set(f.id, f));
      localFolders.forEach(f => folderMap.set(f.id, f));
      (remoteFolders as any[]).forEach(rf => folderMap.set(rf.id, rf as CurriculumFolder));

      // Merge files
      const fileMap = new Map<string, CurriculumFile>();
      DEFAULT_CURRICULUM_FILES.forEach(f => {
        if (!deletedIds.includes(f.id)) fileMap.set(f.id, f);
      });
      localFiles.forEach(f => {
        if (!deletedIds.includes(f.id)) {
          const existing = fileMap.get(f.id);
          fileMap.set(f.id, {
            ...f,
            fileDataUrl: f.fileDataUrl || (existing ? existing.fileDataUrl : undefined)
          });
        }
      });
      (remoteFiles as any[]).forEach(rf => {
        if (!deletedIds.includes(rf.id)) {
          const existing = fileMap.get(rf.id);
          fileMap.set(rf.id, {
            ...(rf as CurriculumFile),
            fileDataUrl: (rf as CurriculumFile).fileDataUrl || (existing ? existing.fileDataUrl : undefined)
          });
        }
      });

      setFolders(Array.from(folderMap.values()));
      
      // Filter visible files
      const allMergedFiles = Array.from(fileMap.values()).filter(f => f.isVisible !== false);

      // Async load local file dataUrl from IndexedDB for custom uploaded files missing fileDataUrl
      await Promise.all(
        allMergedFiles.map(async (f) => {
          if (!f.fileDataUrl) {
            try {
              const dbUrl = await getFileLocal(f.id);
              if (dbUrl) {
                f.fileDataUrl = dbUrl;
              }
            } catch (e) {
              console.warn("Could not load IndexedDB file dataUrl for:", f.id, e);
            }
          }
        })
      );

      setFiles(allMergedFiles);
    } catch (err) {
      console.warn("Failed to load curriculum files, using default seed:", err);
      setFolders(DEFAULT_CURRICULUM_FOLDERS);
      setFiles(DEFAULT_CURRICULUM_FILES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculumData();

    const handleFocusOrStorage = () => {
      loadCurriculumData();
    };

    window.addEventListener('focus', handleFocusOrStorage);
    window.addEventListener('storage', handleFocusOrStorage);
    return () => {
      window.removeEventListener('focus', handleFocusOrStorage);
      window.removeEventListener('storage', handleFocusOrStorage);
    };
  }, []);

  // Filter logic
  const currentFolder = useMemo(() => {
    return folders.find(f => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  const visibleFolders = useMemo(() => {
    return folders.filter(f => {
      if (currentFolderId) {
        return f.parentId === currentFolderId;
      } else {
        return !f.parentId;
      }
    });
  }, [folders, currentFolderId]);

  const isAdminUser = user?.role === 'admin';

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const isEbookOrTextbook = checkIsEbookOrTextbook(f);

      // Folder filter
      if (currentFolderId) {
        if (f.folderId !== currentFolderId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const subjMatch = f.subject.toLowerCase().includes(q);
        const descMatch = (f.description || '').toLowerCase().includes(q);
        if (!nameMatch && !subjMatch && !descMatch) return false;
      }

      // Subject filter
      if (selectedSubject !== 'all' && f.subject !== selectedSubject) {
        return false;
      }

      // Standard filter
      if (selectedStandard !== 'all' && f.standard && f.standard !== 'All Standards') {
        if (f.standard.toLowerCase() !== selectedStandard.toLowerCase()) {
          // Soft match (e.g. Class 10 vs Std 10)
          const stdNum = selectedStandard.replace(/\D/g, '');
          const fileStdNum = f.standard.replace(/\D/g, '');
          if (stdNum && fileStdNum && stdNum !== fileStdNum) return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }

      // Material Type filter
      if (selectedMaterialType === 'my_saved') {
        const isSavedOffline = downloadedPdfIds.includes(f.id);
        if (!isSavedOffline) return false;
      } else if (selectedMaterialType === 'ai_generated') {
        const isGenerated = checkIsAiGenerated(f);
        if (!isGenerated) return false;
      } else if (selectedMaterialType === 'ebook') {
        if (!isEbookOrTextbook) return false;
      } else if (selectedMaterialType !== 'all') {
        const itemMatType = f.materialType || 'notes';
        if (itemMatType !== selectedMaterialType) return false;
      }

      // Language filter
      if (selectedLanguage !== 'all') {
        const reqLang = selectedLanguage.toLowerCase();
        const itemLang = (f.language || '').toLowerCase();
        const textToSearch = `${f.name} ${f.description || ''} ${f.subject || ''}`.toLowerCase();

        if (itemLang) {
          if (!itemLang.includes(reqLang) && !reqLang.includes(itemLang)) return false;
        } else {
          if (!textToSearch.includes(reqLang)) {
            if (reqLang === 'hindi' && !/[\u0900-\u097F]/.test(textToSearch)) return false;
            if (reqLang === 'gujarati' && !/[\u0A80-\u0AFF]/.test(textToSearch)) return false;
            if (reqLang === 'marathi' && !/[\u0900-\u097F]/.test(textToSearch)) return false;
            if (reqLang === 'tamil' && !/[\u0B80-\u0BFF]/.test(textToSearch)) return false;
            if (reqLang === 'telugu' && !/[\u0C00-\u0C7F]/.test(textToSearch)) return false;
            if (reqLang === 'english' && /[\u0900-\u0C7F]/.test(textToSearch) && !textToSearch.includes('english')) return false;
          }
        }
      }

      return true;
    });
  }, [files, currentFolderId, searchQuery, selectedSubject, selectedStandard, selectedCategory, selectedMaterialType, selectedLanguage, downloadedPdfIds, isAdminUser]);

  // AI Translation Handler
  const handleTranslateStudyMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!translatingFile) return;

    setTranslateLoading(true);
    try {
      const targetLangStr = translateTargetLang;
      const baseContent = (translatingFile as any).fullContent || translatingFile.description || translatingFile.name;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an expert Indian educational curriculum translator. Translate the following study material strictly into ${targetLangStr} (using proper native script and educational terminology). Preserve all markdown structure, headings (#, ##), bullet points (-), mathematical formulas, and callouts (>). 

Title: ${translatingFile.name}
Subject: ${translatingFile.subject}
Class: ${translatingFile.standard || 'Class 10'}

Content to Translate:
${baseContent}`
        })
      });

      const data = await response.json();
      const translatedText = data.text || baseContent;

      const translatedTitle = `${translatingFile.name} (${targetLangStr})`;
      const pdfDataUrl = await generateMultiLanguagePdfDataUrl(
        translatedTitle,
        translatingFile.subject,
        translatingFile.standard || 'Class 10',
        targetLangStr,
        translatedText,
        `AI Translated Material (${targetLangStr})`
      );

      const newFileId = `gen-pdf-trans-${Date.now()}`;
      const newFile: CurriculumFile = {
        id: newFileId,
        name: translatedTitle,
        subject: translatingFile.subject,
        standard: translatingFile.standard || 'Class 10',
        materialType: translatingFile.materialType || 'notes',
        category: 'pdf',
        description: `AI Translated version of "${translatingFile.name}" in ${targetLangStr}.`,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: pdfDataUrl,
        size: '1.4 MB',
        isVisible: true,
        isGenerated: true,
        language: targetLangStr,
        fullContent: translatedText
      } as any;

      // Update state & save
      setFiles(prev => [newFile, ...prev]);

      try {
        const savedList = JSON.parse(localStorage.getItem('gramin_curriculum_files_v2') || '[]');
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify([newFile, ...savedList]));
        await saveFirebaseCurriculumFile(newFile).catch(() => {});
        await saveFileLocal(newFileId, pdfDataUrl).catch(() => {});
      } catch (err) {
        console.warn("Save error during translation:", err);
      }

      setShowTranslateModal(false);
      setGenSuccessMsg(`✨ Successfully translated "${translatingFile.name}" into ${targetLangStr}!`);
      
      // Auto-open translated PDF
      handleInstantOpenPdf(newFile);
    } catch (err) {
      console.error("Translation failed:", err);
      alert("Translation failed. Please try again.");
    } finally {
      setTranslateLoading(false);
    }
  };

  // Unique Subjects List
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.subject) set.add(f.subject);
    });
    return Array.from(set);
  }, [files]);

  const getMaterialTypeInfo = (matType?: string) => {
    switch (matType) {
      case 'ebook':
        return { label: 'E-Books & Textbooks', shortLabel: 'E-Book', icon: '📚', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'pyq':
        return { label: 'Previous Year Papers (PYQ)', shortLabel: 'PYQ Paper', icon: '📜', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'practice_questions':
        return { label: 'Practice Questions & Worksheets', shortLabel: 'Practice Qs', icon: '✍️', badge: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'other':
        return { label: 'General Resources', shortLabel: 'General', icon: '📂', badge: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'notes':
      default:
        return { label: 'Notes & Summaries', shortLabel: 'Notes', icon: '📝', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
  };

  // Open PDF instantly without loading delays
  const handleInstantOpenPdf = async (file: CurriculumFile) => {
    let dataUrl = file.fileDataUrl;
    if (!dataUrl) {
      dataUrl = (await getFileLocal(file.id)) || undefined;
    }
    if (!dataUrl) {
      dataUrl = localStorage.getItem('gramin_pdf_cache_' + file.id) || undefined;
    }
    if (!dataUrl) {
      dataUrl = await generateStandardPdfDataUrl(
        file.name,
        file.subject,
        file.standard || 'Class 10',
        file.description || 'Study Guide Notes',
        (file as any).fullContent
      );
    }

    setActivePdfFile({
      ...file,
      fileDataUrl: dataUrl
    });
    setPdfWorkspaceTab('reader');
  };

  // Toggle or Save PDF File into My Saved Material
  const handleToggleSaveFileToMyMaterial = async (file: CurriculumFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const fileId = file.id;
    const isSaved = downloadedPdfIds.includes(fileId);

    if (isSaved) {
      setDownloadedPdfIds(prev => prev.filter(id => id !== fileId));
      setGenSuccessMsg(t.toastUnsaved);
    } else {
      setDownloadedPdfIds(prev => Array.from(new Set([...prev, fileId])));
      let dataUrl = file.fileDataUrl;
      if (!dataUrl) {
        dataUrl = (await getFileLocal(fileId)) || undefined;
      }
      if (!dataUrl) {
        dataUrl = await generateStandardPdfDataUrl(file.name, file.subject, file.standard || 'Class 10', file.description || '');
        await saveFileLocal(fileId, dataUrl);
      }
      setGenSuccessMsg(t.toastSaved);
    }
    setTimeout(() => setGenSuccessMsg(null), 3000);
  };

  // Generate Custom AI Study Material by Main Topic and Format
  const handleGenerateTopicStudyMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!genTopic.trim()) {
      alert("Please enter a main topic or chapter title.");
      return;
    }

    setGenLoading(true);
    setGenSuccessMsg(null);

    const targetLang = genLanguage === 'Other' ? (genCustomLanguage.trim() || 'Custom Language') : genLanguage;

    let formatTitleSuffix = '';
    let headerBadgeLabel = '';
    let materialTypeKey: 'ebook' | 'notes' | 'pyq' | 'practice_questions' = genMaterialFormat;
    let formatPrompt = '';

    if (genMaterialFormat === 'ebook') {
      formatTitleSuffix = 'E-Book & Textbook Chapter';
      headerBadgeLabel = 'Official E-Book Chapter';
      formatPrompt = `You are a master textbook author writing an official, high-quality E-Book Chapter in ${targetLang} for ${genStandard} (${genSubject}) students on topic: "${genTopic.trim()}".

REQUIREMENTS & CHAPTER STRUCTURE:
1. Write a comprehensive textbook chapter formatted cleanly with markdown headings.
2. Focus 100% on "${genTopic.trim()}".
3. Language: Strictly in ${targetLang} (using native script).

CHAPTER STRUCTURE:
# ${genTopic.toUpperCase()} - E-BOOK CHAPTER

## 📖 1. Chapter Introduction & Core Context
- Engaging background and 4 clear learning objectives.

## 💡 2. Theoretical Foundations & Fundamental Principles
- In-depth theoretical concepts, laws, and core definitions with bold terms.

## 📊 3. Detailed Breakdown & Concept Explanations
- Step-by-step conceptual walkthroughs. Use callout blocks starting with "> 💡 Key Principle:".

## 🔬 4. Solved Examples & Step-by-Step Derivations
- 3 comprehensive solved examples with detailed step-by-step logic.

## 📌 5. Chapter Summary & Core Concepts Map
- Structured summary of all major ideas.

## 📚 6. Glossary of Essential Terms & Key Formulas
- Important terms and formulas defined clearly.`;
    } else if (genMaterialFormat === 'notes') {
      formatTitleSuffix = 'Revision Notes & Summary';
      headerBadgeLabel = 'Quick Revision Notes';
      formatPrompt = `You are an expert tutor writing high-yield Revision Notes & Summary in ${targetLang} for ${genStandard} (${genSubject}) on topic: "${genTopic.trim()}".

REQUIREMENTS & STRUCTURE:
1. Write crisp, high-yield revision notes.
2. Language: Strictly in ${targetLang} (using native script).

STRUCTURE:
# ${genTopic.toUpperCase()} - REVISION NOTES

## ⚡ 1. High-Yield Exam Summary
- Quick bullet points highlighting core exam points.

## 💡 2. Key Terms & Fundamental Definitions
- Concise definitions with bold key terms.

## 📐 3. Essential Formulas, Laws & Rules
- Formula sheet breakdown with all variables explained.

## 🧠 4. Memory Tricks & Mnemonics
- Clever memory hooks and acronyms.

## ⚠️ 5. Common Exam Pitfalls & Misconceptions
- Mistakes students make in exams and how to avoid them.

## 🎯 6. 5-Minute Exam Refresher
- 5 high-yield bullet points for instant review.`;
    } else if (genMaterialFormat === 'pyq') {
      formatTitleSuffix = 'Model Exam Paper & Marking Scheme';
      headerBadgeLabel = 'Model Exam Paper & PYQ';
      formatPrompt = `You are a senior board exam paper designer creating an official Model Examination Paper and complete Answer Key in ${targetLang} for ${genStandard} (${genSubject}) on topic: "${genTopic.trim()}".

REQUIREMENTS & STRUCTURE:
1. Create a complete, realistic examination paper with an exhaustive answer key.
2. Language: Strictly in ${targetLang} (using native script).

STRUCTURE:
# MODEL EXAMINATION PAPER: ${genTopic.toUpperCase()}
**Subject:** ${genSubject} | **Class:** ${genStandard} | **Time:** 2 Hours | **Max Marks:** 80 Marks

## 📌 General Instructions
- All questions are compulsory.

## 🔘 SECTION A: Multiple Choice Questions (10 Marks)
- 10 MCQs with options (A, B, C, D) testing core concepts.

## ✍️ SECTION B: Short Answer Questions (20 Marks)
- 5 Short Answer Questions (2-4 marks each).

## 🔬 SECTION C: Long Answer & Analytical Questions (30 Marks)
- 3 Long Answer Questions (8-10 marks each) requiring detailed derivations/explanations.

## 🎯 SECTION D: Case Study / Application Problem (20 Marks)
- A scenario-based problem with sub-questions.

## 🔑 COMPLETE ANSWER KEY & MARKING SCHEME
- Provide exhaustive, step-by-step solutions for EVERY question above.`;
    } else if (genMaterialFormat === 'practice_questions') {
      formatTitleSuffix = 'Practice Question Bank & Solutions';
      headerBadgeLabel = 'Practice Question Bank';
      formatPrompt = `You are a master curriculum creator developing a Practice Question Bank & Worksheet in ${targetLang} for ${genStandard} (${genSubject}) on topic: "${genTopic.trim()}".

REQUIREMENTS & STRUCTURE:
1. Create 15+ graded practice questions with full step-by-step solutions.
2. Language: Strictly in ${targetLang} (using native script).

STRUCTURE:
# PRACTICE QUESTION BANK & WORKSHEET: ${genTopic.toUpperCase()}

## 🎯 Worksheet Objectives
- Overview of problem-solving skills trained.

## 🟢 LEVEL 1: Warm-up & Foundational Questions (5 Questions)
- Direct definition and formula application problems.

## 🟡 LEVEL 2: Intermediate & Conceptual Questions (5 Questions)
- Analytical and multi-step reasoning problems.

## 🔴 LEVEL 3: Higher Order Thinking Skills (HOTS) & Challenge Problems (5 Questions)
- High-level challenge problems.

## 💡 STEP-BY-STEP SOLUTIONS & HINTS
- Exhaustive step-by-step solutions and explanations for all questions.`;
    }

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formatPrompt,
          systemInstruction: `You are an expert curriculum author specialized in creating top-tier educational materials. Format all output clearly using markdown strictly in ${targetLang} for subject "${genSubject}" and level "${genStandard}".`,
        })
      });

      const data = await response.json();
      if (!data.success || !data.text) {
        throw new Error(data.message || 'Failed to generate study material.');
      }

      const generatedText = data.text;
      const cleanTitle = `${genTopic.trim()} - ${formatTitleSuffix} (${targetLang})`;
      const newFileId = `gen-pdf-${Date.now()}`;

      const pdfDataUrl = await generateMultiLanguagePdfDataUrl(
        cleanTitle,
        genSubject,
        genStandard,
        targetLang,
        generatedText,
        headerBadgeLabel
      );

      const newFile: CurriculumFile = {
        id: newFileId,
        name: cleanTitle,
        subject: genSubject,
        standard: genStandard,
        materialType: materialTypeKey,
        category: 'pdf',
        description: `AI Generated ${formatTitleSuffix} in ${targetLang} for "${genTopic.trim()}". Subject: ${genSubject}, Class: ${genStandard}.`,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: pdfDataUrl,
        size: '1.5 MB',
        isVisible: true,
        isGenerated: true,
        language: targetLang,
        fullContent: generatedText
      } as any;

      // Update state
      setFiles(prev => [newFile, ...prev]);

      // Save to localStorage
      try {
        const savedList = JSON.parse(localStorage.getItem('gramin_curriculum_files_v2') || '[]');
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify([newFile, ...savedList]));
      } catch (err) {
        console.warn("Failed to save generated file to localStorage:", err);
      }

      // Cache locally in IndexedDB
      try {
        await saveFileLocal(newFileId, pdfDataUrl);
      } catch (err) {
        console.warn("Local storage save error:", err);
      }

      // Persist to Firebase Firestore
      try {
        await saveFirebaseCurriculumFile(newFile as any);
      } catch (err) {
        console.warn("Firestore save error:", err);
      }

      const topicName = genTopic;
      setGenTopic('');
      setGenCustomLanguage('');
      setGenSuccessMsg(`✨ AI ${formatTitleSuffix} for "${topicName}" (${targetLang}) generated successfully!`);
      setSelectedMaterialType(materialTypeKey);
    } catch (err: any) {
      console.error("Study Material Generation Error:", err);
      alert(`Could not generate study material: ${err.message || 'Network error'}`);
    } finally {
      setGenLoading(false);
    }
  };

  // Toggle download/cache state
  const handleToggleDownload = (fileId: string) => {
    setDownloadedPdfIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // Trigger browser file download
  const handleDownloadFileToDevice = async (file: CurriculumFile) => {
    let dataUrl = file.fileDataUrl;
    if (!dataUrl) {
      dataUrl = (await getFileLocal(file.id)) || undefined;
    }
    if (!dataUrl) {
      dataUrl = localStorage.getItem('gramin_pdf_cache_' + file.id) || undefined;
    }
    if (!dataUrl) {
      const remoteUrl = await getFirebaseCurriculumFileDataUrl(file.id);
      if (remoteUrl) {
        dataUrl = remoteUrl;
        await saveFileLocal(file.id, remoteUrl);
      }
    }
    if (!dataUrl && file.externalUrl) {
      window.open(file.externalUrl, '_blank');
      return;
    }
    if (!dataUrl) {
      dataUrl = await generateStandardPdfDataUrl(file.name, file.subject, file.standard || 'Class 10', file.description || '');
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = file.name.endsWith('.pdf') ? file.name : `${file.name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (!downloadedPdfIds.includes(file.id)) {
      setDownloadedPdfIds(prev => [...prev, file.id]);
    }
  };

  const handleOpenEditPdf = (file: CurriculumFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (user?.role !== 'admin') {
      alert("Only admins can edit admin-uploaded curriculum PDFs.");
      return;
    }
    setEditingFile(file);
    setEditName(file.name);
    setEditSubject(file.subject || 'Science');
    setEditStandard(file.standard || 'Class 10');
    setEditDescription(file.description || '');
  };

  const handleSaveEditPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    if (user?.role !== 'admin') {
      alert("Only admins can edit admin-uploaded curriculum PDFs.");
      return;
    }

    const updatedFile: CurriculumFile = {
      ...editingFile,
      name: editName.trim() || editingFile.name,
      subject: editSubject,
      standard: editStandard,
      description: editDescription.trim(),
    };

    setFiles(prev => prev.map(f => f.id === editingFile.id ? updatedFile : f));

    // Save update to localStorage
    try {
      const savedList: CurriculumFile[] = JSON.parse(localStorage.getItem('gramin_curriculum_files_v2') || '[]');
      const updatedList = savedList.map(f => f.id === editingFile.id ? { ...f, ...updatedFile } : f);
      localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(updatedList));
    } catch (err) {
      console.warn("Failed to persist edited file in localStorage:", err);
    }

    // Save update to Firestore
    try {
      await saveFirebaseCurriculumFile(updatedFile as any);
    } catch (err) {
      console.warn("Firestore save edited file error:", err);
    }

    setEditingFile(null);
    setGenSuccessMsg(`✨ Updated PDF details for "${editName}"`);
    setTimeout(() => setGenSuccessMsg(null), 3000);
  };

  // Delete PDF Handler
  const handleDeleteFile = (file: CurriculumFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFileToDelete(file);
  };

  const executeDeleteFile = async () => {
    if (!fileToDelete) return;
    const file = fileToDelete;
    setFileToDelete(null);

    try {
      // 1. Store deleted file ID in BOTH localStorage keys so loadCurriculumData won't restore it
      try {
        const deleted1: string[] = JSON.parse(localStorage.getItem('gramin_curriculum_deleted_files_v2') || '[]');
        if (!deleted1.includes(file.id)) {
          deleted1.push(file.id);
          localStorage.setItem('gramin_curriculum_deleted_files_v2', JSON.stringify(deleted1));
        }
        const deleted2: string[] = JSON.parse(localStorage.getItem('gramin_deleted_file_ids_v1') || '[]');
        if (!deleted2.includes(file.id)) {
          deleted2.push(file.id);
          localStorage.setItem('gramin_deleted_file_ids_v1', JSON.stringify(deleted2));
        }
      } catch (err) {
        console.warn("Failed to update deleted files list in localStorage:", err);
      }

      // 2. Remove from state immediately
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setDownloadedPdfIds(prev => prev.filter(id => id !== file.id));

      if (activePdfFile?.id === file.id) {
        setActivePdfFile(null);
      }

      // 3. Remove from localStorage saved files and cache if present
      try {
        const savedList = JSON.parse(localStorage.getItem('gramin_curriculum_files_v2') || '[]');
        const updatedList = savedList.filter((f: any) => f.id !== file.id);
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Failed to remove deleted file from localStorage list:", err);
      }
      localStorage.removeItem('gramin_pdf_cache_' + file.id);

      // 4. Delete from IndexedDB
      await deleteFileLocal(file.id).catch(e => console.warn("IndexedDB delete error:", e));

      // 5. Delete from Firebase Firestore
      await deleteFirebaseCurriculumFile(file.id).catch(e => console.warn("Firestore delete error:", e));

      setGenSuccessMsg(`🗑️ Successfully deleted "${file.name}"`);
      setTimeout(() => setGenSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to delete PDF:", err);
      setGenSuccessMsg(`❌ Could not delete file: ${err.message || 'Unknown error'}`);
      setTimeout(() => setGenSuccessMsg(null), 4000);
    }
  };

  // Workspace Action Handler
  const handleWorkspaceAction = async (actionTab: 'translate' | 'solve' | 'summary' | 'notes') => {
    if (!activePdfFile) return;
    setWorkspaceLoading(true);
    setWorkspaceResult(null);
    setWorkspaceViewMode('text');
    setVideoSlideIndex(0);
    
    try {
      const extractedStr = activePdfText.map(p => `Page ${p.pageNum}:\n${p.text}`).join('\n\n');
      let backendAction = 'summarize';
      if (actionTab === 'translate') backendAction = 'translate';
      if (actionTab === 'solve') backendAction = 'solve-questions';
      if (actionTab === 'notes') backendAction = 'short-notes';

      const response = await fetch('/api/gemini/pdf-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: backendAction,
          targetLanguage: workspaceTargetLang,
          fileName: activePdfFile.name,
          extractedText: extractedStr,
          customInput: workspaceInput,
          board: user.board || 'CBSE'
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        setWorkspaceResult(data.data);
      } else {
        alert("Failed to process request: " + data.message);
      }
    } catch (err) {
      console.error("Workspace action failed:", err);
      alert("Error reaching the AI Workspace service.");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleDownloadWorkspacePdf = () => {
    if (!workspaceResult) return;
    
    // Simple HTML print export
    const newWin = window.open('', '_blank');
    if (!newWin) {
      alert("Please allow popups to download PDF.");
      return;
    }
    
    const htmlContent = `
      <html>
        <head>
          <title>AI Workspace - ${activePdfFile?.name || 'Document'}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            h1, h2 { color: #111; }
            .diagram-box, .video-box { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-top: 20px; background: #fafafa; }
            .node { padding: 10px; border: 1px solid #ccc; display: inline-block; margin: 5px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>AI Study Material: ${activePdfFile?.name || 'Document'}</h1>
          <hr />
          <h2>Text Response</h2>
          <div style="white-space: pre-wrap;">${workspaceResult.text || ''}</div>
          
          ${workspaceResult.diagram ? `
            <div class="diagram-box">
              <h2>Diagram: ${workspaceResult.diagram.title}</h2>
              <div>
                ${workspaceResult.diagram.nodes?.map((n: any) => `<div class="node" style="background-color: ${n.color || '#eee'};"><strong>${n.label}</strong><br/>${n.description}</div>`).join('')}
              </div>
            </div>
          ` : ''}

          ${workspaceResult.video ? `
            <div class="video-box">
              <h2>Video Slides: ${workspaceResult.video.title}</h2>
              ${workspaceResult.video.slides?.map((s: any) => `
                <div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                  <h3>Slide ${s.slideNum}: ${s.title}</h3>
                  <ul>${s.bullets?.map((b: string) => `<li>${b}</li>`).join('')}</ul>
                  <p><em>Narrator: ${s.narrative}</em></p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    newWin.document.write(htmlContent);
    newWin.document.close();
  };


  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. TOP BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-15 pointer-events-none">
          <FileText className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{t.officialHubBadge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            {t.pageTitle}
          </h2>

          <p className="text-sm text-rose-100 font-sans leading-relaxed">
            {t.pageSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-300" />
              <span className="font-bold">{files.length} {t.badgeOfficialDocs}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span className="font-bold">{folders.length} {t.badgeFolders}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-300" />
              <span className="font-bold">{downloadedPdfIds.length} {t.badgeSavedOffline}</span>
            </div>
          </div>

          {/* Multilingual Selector in Top Banner */}
          <div className="pt-2 border-t border-white/20 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-amber-200 flex items-center gap-1.5 shrink-0">
              <Globe className="w-4 h-4 text-amber-300" />
              <span>{t.selectLanguage}</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isCurrent = activeLang === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => {
                      setActiveLang(langItem.code);
                      setWorkspaceTargetLang(langItem.code);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-white text-rose-700 shadow-md ring-2 ring-amber-300 font-black scale-105'
                        : 'bg-black/25 hover:bg-black/40 text-white border border-white/25 hover:border-white/40'
                    }`}
                  >
                    <span>{langItem.nativeLabel}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 AI STUDY MATERIAL GENERATOR BY TOPIC CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-indigo-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl shadow-md text-white shrink-0">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{t.aiGeneratorTitle}</span>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/40">
                  Topic-Based
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                {t.aiGeneratorDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{showGenerator ? t.btnCloseGenerator : t.btnOpenGenerator}</span>
          </button>
        </div>

        {(showGenerator || genLoading) && (
          <form onSubmit={handleGenerateTopicStudyMaterial} className="space-y-4 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Main Topic Input */}
              <div className="md:col-span-6 space-y-1">
                <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider flex items-center gap-1">
                  <span>{t.inputTopicLabel}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder={t.inputTopicPlaceholder}
                  disabled={genLoading}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-indigo-700/60 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-400 transition-all"
                  required
                />
              </div>

              {/* Subject Select */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider">{t.subjectLabel}</label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  disabled={genLoading}
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-indigo-700/60 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="English">English</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              {/* Standard Select */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider">{t.standardLabel}</label>
                <select
                  value={genStandard}
                  onChange={(e) => setGenStandard(e.target.value)}
                  disabled={genLoading}
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-indigo-700/60 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              {/* Language Select */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider">{t.languageLabel}</label>
                <select
                  value={genLanguage}
                  onChange={(e) => setGenLanguage(e.target.value)}
                  disabled={genLoading}
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-indigo-700/60 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all cursor-pointer"
                >
                  <option value="English">🇬🇧 English</option>
                  <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                  <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
                  <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
                  <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                  <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
                  <option value="Bengali">🇮🇳 Bengali (বাংলা)</option>
                  <option value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                  <option value="Malayalam">🇮🇳 Malayalam (മലയാളം)</option>
                  <option value="Punjabi">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Odia">🇮🇳 Odia (ଓଡ଼ିଆ)</option>
                  <option value="Assamese">🇮🇳 Assamese (অসমীয়া)</option>
                  <option value="Urdu">🇮🇳 Urdu (اردو)</option>
                  <option value="Sanskrit">🇮🇳 Sanskrit (संस्कृतम्)</option>
                  <option value="Hinglish">🇮🇳 Hinglish</option>
                  <option value="Spanish">🇪🇸 Spanish (Español)</option>
                  <option value="French">🇫🇷 French (Français)</option>
                  <option value="German">🇩🇪 German (Deutsch)</option>
                  <option value="Arabic">🇸🇦 Arabic (العربية)</option>
                  <option value="Other">🌐 Other Language...</option>
                </select>
                {genLanguage === 'Other' && (
                  <input
                    type="text"
                    placeholder="Type custom language (e.g. Italian, Russian)..."
                    value={genCustomLanguage}
                    onChange={(e) => setGenCustomLanguage(e.target.value)}
                    required
                    className="mt-1.5 w-full bg-slate-800/90 border border-indigo-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                )}
              </div>
            </div>

            {/* Material Format / Structure Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider flex items-center justify-between">
                <span>Select Material Format & Structure *</span>
                <span className="text-[10px] text-amber-300 font-normal hidden sm:inline">PDF content & layout will correspond specifically to your selection</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. E-Books & Textbooks */}
                <button
                  type="button"
                  onClick={() => setGenMaterialFormat('ebook')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    genMaterialFormat === 'ebook'
                      ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-slate-800/70 border-indigo-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">📚</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      genMaterialFormat === 'ebook' ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-300'
                    }`}>E-Book / Textbook</span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">E-Books & Textbooks</div>
                    <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                      Comprehensive chapter with theoretical principles, derivations, diagrams & glossary.
                    </p>
                  </div>
                </button>

                {/* 2. Quick Revision Notes */}
                <button
                  type="button"
                  onClick={() => setGenMaterialFormat('notes')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    genMaterialFormat === 'notes'
                      ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md ring-2 ring-indigo-400/40'
                      : 'bg-slate-800/70 border-indigo-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">📝</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      genMaterialFormat === 'notes' ? 'bg-indigo-400 text-indigo-950' : 'bg-slate-700 text-slate-300'
                    }`}>Revision Notes</span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">Notes & Summaries</div>
                    <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                      High-yield bullet points, formula cheat sheets & exam memory mnemonics.
                    </p>
                  </div>
                </button>

                {/* 3. Exam Paper PYQ */}
                <button
                  type="button"
                  onClick={() => setGenMaterialFormat('pyq')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    genMaterialFormat === 'pyq'
                      ? 'bg-amber-950/80 border-amber-400 text-white shadow-md ring-2 ring-amber-400/40'
                      : 'bg-slate-800/70 border-indigo-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">📜</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      genMaterialFormat === 'pyq' ? 'bg-amber-400 text-amber-950' : 'bg-slate-700 text-slate-300'
                    }`}>Model Exam Paper</span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">Exam Papers (PYQ)</div>
                    <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                      Structured exam paper (MCQs, short & long Qs) with complete answer key & marking scheme.
                    </p>
                  </div>
                </button>

                {/* 4. Practice Questions & Worksheet */}
                <button
                  type="button"
                  onClick={() => setGenMaterialFormat('practice_questions')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    genMaterialFormat === 'practice_questions'
                      ? 'bg-purple-950/80 border-purple-400 text-white shadow-md ring-2 ring-purple-400/40'
                      : 'bg-slate-800/70 border-indigo-800/60 text-slate-300 hover:bg-slate-800 hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">✍️</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      genMaterialFormat === 'practice_questions' ? 'bg-purple-400 text-purple-950' : 'bg-slate-700 text-slate-300'
                    }`}>Practice Questions</span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">Practice Questions</div>
                    <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                      Graded question set (Level 1, Level 2, HOTS) with step-by-step solutions & hints.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-400 italic">
                * Automatically creates overview, key definitions, formulas, solved examples & practice questions in PDF format.
              </p>

              <button
                type="submit"
                disabled={genLoading || !genTopic.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer ml-auto"
              >
                {genLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.generatingMsg}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>{t.btnGenerate}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {genSuccessMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{genSuccessMsg}</span>
            </div>
            <button
              onClick={() => setGenSuccessMsg(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={loadCurriculumData}
              title="Refresh live Firestore PDFs"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.syncBtn}</span>
            </button>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Material Type Quick Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMaterialType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'all'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{t.filterAllMaterials}</span>
            <span className="text-[10px] opacity-80 font-mono">({files.length})</span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('my_saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'my_saved'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            <span>{t.filterMySaved}</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-mono px-1.5 py-0.5 rounded-full font-bold">
              {files.filter(f => downloadedPdfIds.includes(f.id)).length}
            </span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('ai_generated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'ai_generated'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-300'
            }`}
          >
            <span>{t.filterAiGenerated}</span>
            <span className="text-[10px] bg-indigo-200 text-indigo-900 font-mono px-1.5 py-0.5 rounded-full font-bold">
              {files.filter(f => checkIsAiGenerated(f)).length}
            </span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'notes'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <span>{t.filterNotes}</span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('ebook')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'ebook'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>{t.filterEbooks}</span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('pyq')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'pyq'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>{t.filterPyq}</span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('practice_questions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'practice_questions'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <span>{t.filterQuestions}</span>
          </button>
          <button
            onClick={() => setSelectedMaterialType('other')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedMaterialType === 'other'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>{t.filterOther}</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.materialTypeLabel}</label>
            <select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{t.allMaterialTypes}</option>
              <option value="notes">{t.filterNotes}</option>
              <option value="ebook">{t.filterEbooks}</option>
              <option value="pyq">{t.filterPyq}</option>
              <option value="practice_questions">{t.filterQuestions}</option>
              <option value="other">{t.filterOther}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.subjectFilterLabel}</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{t.allSubjects} ({files.length})</option>
              {subjectsList.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.standardFilterLabel}</label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{t.allStandards}</option>
              <option value="Class 10">Class 10 (Std 10)</option>
              <option value="Class 9">Class 9 (Std 9)</option>
              <option value="Class 8">Class 8 (Std 8)</option>
              <option value="Class 5">Class 5 (Primary)</option>
              <option value="All Standards">All Standards General</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.fileFormatLabel}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{t.allFormats}</option>
              <option value="pdf">{t.pdfDocuments}</option>
              <option value="document">{t.textDocuments}</option>
              <option value="quiz">{t.worksheetsQuizzes}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.languageFilterLabel}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">{t.allLanguages}</option>
              <option value="English">🇬🇧 English</option>
              <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
              <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
              <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
              <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
              <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. BREADCRUMB FOLDER NAVIGATION */}
      {currentFolderId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.rootFolders}</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>{currentFolder?.name || 'Folder View'}</span>
          </span>
        </div>
      )}

      {/* 4. FOLDER CARDS GRID */}
      {visibleFolders.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.studyCategoriesTitle} ({visibleFolders.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {visibleFolders.map(folder => {
              const fileCount = files.filter(f => f.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all duration-300 hover:shadow-md cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-amber-50 rounded-xl group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono">
                      {fileCount} {fileCount === 1 ? 'PDF' : 'PDFs'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {folder.name}
                    </h4>
                    {folder.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-sans">
                        {folder.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-amber-700">
                    <span>{t.exploreFolder}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PDF DOCUMENTS DISPLAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {currentFolderId ? `${t.btnReadPdf}: ${currentFolder?.name}` : t.allCurriculumPdfs} ({filteredFiles.length})
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">{t.loadingLibrary}</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">{t.noPdfFoundTitle}</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.noPdfFoundDesc}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedStandard('all');
                setSelectedCategory('all');
                setSelectedLanguage('all');
                setCurrentFolderId(null);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              {t.clearAllFilters}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map(file => {
              const isDownloaded = downloadedPdfIds.includes(file.id);
              const matTypeInfo = getMaterialTypeInfo(file.materialType);
              const isAiGenerated = checkIsAiGenerated(file);
              const isAdmin = user?.role === 'admin';
              const canDelete = true;

              return (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-rose-300 transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${matTypeInfo.badge}`}>
                          <span>{matTypeInfo.icon}</span>
                          <span>{matTypeInfo.shortLabel}</span>
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {file.subject}
                        </span>
                        <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          {getLangFlag(file.language || file.name)}
                        </span>
                      </div>

                      {isDownloaded && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Saved Offline
                        </span>
                      )}
                    </div>

                    {/* File Title */}
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors line-clamp-2">
                      {file.name}
                    </h4>

                    {/* Description */}
                    {file.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {file.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                      <span>🎓 {file.standard || 'All Standards'}</span>
                      <span>•</span>
                      <span>📦 {file.size || '1.5 MB'}</span>
                      <span>•</span>
                      <span>📅 {file.uploadedAt}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => handleInstantOpenPdf(file)}
                      className="flex-1 py-2 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.btnReadPdf}</span>
                    </button>

                    <button
                      onClick={(e) => handleToggleSaveFileToMyMaterial(file, e)}
                      title={isDownloaded ? t.btnSavedMaterial : t.btnSaveMaterial}
                      className={`px-2 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isDownloaded
                          ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isDownloaded ? 'fill-amber-500 text-amber-600' : 'text-amber-600'}`} />
                      <span>{isDownloaded ? t.btnSavedMaterial : t.btnSaveMaterial}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFileToDevice(file)}
                      title={t.btnDownload}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Admin Edit Option for Admin-uploaded PDFs */}
                    {!isAiGenerated && isAdmin && (
                      <button
                        onClick={(e) => handleOpenEditPdf(file, e)}
                        title={t.btnEdit}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Option: Available for all study material PDFs */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteFile(file, e)}
                        title={t.btnDelete}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-visible shadow-2xs">
            {filteredFiles.map(file => {
              const isDownloaded = downloadedPdfIds.includes(file.id);
              const matTypeInfo = getMaterialTypeInfo(file.materialType);
              const isAiGenerated = checkIsAiGenerated(file);
              const isAdmin = user?.role === 'admin';
              const canDelete = true;

              return (
                <div key={file.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${matTypeInfo.badge}`}>
                          <span>{matTypeInfo.icon}</span>
                          <span>{matTypeInfo.shortLabel}</span>
                        </span>
                        <span className="text-xs font-bold text-slate-800">{file.subject}</span>
                        <span className="text-xs text-slate-400 font-mono">• {file.standard || 'All Standards'}</span>
                        <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          {getLangFlag(file.language || file.name)}
                        </span>
                        {isDownloaded && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {t.badgeSavedOffline}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{file.name}</h4>
                      {file.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{file.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => handleInstantOpenPdf(file)}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.btnReadPdf}</span>
                    </button>

                    <button
                      onClick={(e) => handleToggleSaveFileToMyMaterial(file, e)}
                      title={isDownloaded ? t.btnSavedMaterial : t.btnSaveMaterial}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isDownloaded
                          ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isDownloaded ? 'fill-amber-500 text-amber-600' : 'text-amber-600'}`} />
                      <span>{isDownloaded ? t.btnSavedMaterial : t.btnSaveMaterial}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFileToDevice(file)}
                      title={t.btnDownload}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Admin Edit Option for Admin-uploaded PDFs */}
                    {!isAiGenerated && isAdmin && (
                      <button
                        onClick={(e) => handleOpenEditPdf(file, e)}
                        title={t.btnEdit}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Option: Available for all study material PDFs */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteFile(file, e)}
                        title={t.btnDelete}
                        className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. IMMERSIVE PDF READER & AI STUDY MODAL */}
      {activePdfFile && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen overflow-hidden animate-fade-in">
          <div className="bg-white w-full h-full flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-white truncate">{activePdfFile.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{activePdfFile.subject}</span>
                    <span>•</span>
                    <span>{activePdfFile.standard || 'All Standards'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (isPdfSpeaking) {
                      stopSpeaking();
                      setIsPdfSpeaking(false);
                    } else {
                      setIsPdfSpeaking(true);
                      const speechTextContent = `Document title: ${activePdfFile.name}. Subject: ${activePdfFile.subject}. Standard: ${activePdfFile.standard || 'All Standards'}. Summary: ${activePdfFile.description || 'Official study notes for students.'}`;
                      speakText(speechTextContent, activeLang || 'en');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                    isPdfSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isPdfSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPdfSpeaking ? t.stopAudio : t.readAloud}</span>
                </button>

                <button
                  onClick={() => handleDownloadFileToDevice(activePdfFile)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.btnDownload}</span>
                </button>

                <button
                  onClick={(e) => handleDeleteFile(activePdfFile, e)}
                  title={t.btnDelete}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.btnDelete}</span>
                </button>

                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsPdfSpeaking(false);
                    setActivePdfFile(null);
                  }}
                  title={t.closeReader}
                  className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer shrink-0 ml-auto sm:ml-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Body - Direct PDF Reader */}
            <div className="flex-1 bg-slate-900 overflow-hidden flex flex-col p-2 sm:p-4">
              <div className="flex-1 h-full min-h-[500px]">
                <PdfCanvasViewer
                  fileId={activePdfFile.id}
                  fileDataUrl={activePdfFile.fileDataUrl}
                  fileName={activePdfFile.name}
                  fullContent={(activePdfFile as any).fullContent || (activePdfFile as any).generatedText || activePdfFile.description}
                  isAiGenerated={checkIsAiGenerated(activePdfFile)}
                  onGetFileLocal={async (id) => {
                    if (activePdfFile.fileDataUrl) return activePdfFile.fileDataUrl;
                    const localUrl = await getFileLocal(id);
                    if (localUrl) return localUrl;
                    const lsUrl = localStorage.getItem('gramin_pdf_cache_' + id);
                    if (lsUrl) return lsUrl;
                    
                    const remoteUrl = await getFirebaseCurriculumFileDataUrl(id);
                    if (remoteUrl) {
                      await saveFileLocal(id, remoteUrl);
                      setActivePdfFile(prev => prev && prev.id === id ? { ...prev, fileDataUrl: remoteUrl } : prev);
                      return remoteUrl;
                    }

                    if (activePdfFile.externalUrl) return activePdfFile.externalUrl;
                    return await generateStandardPdfDataUrl(activePdfFile.name, activePdfFile.subject, activePdfFile.standard || 'Class 10', activePdfFile.description || '');
                  }}
                  onDownload={() => handleDownloadFileToDevice(activePdfFile)}
                  onPagesTextExtracted={setActivePdfText}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADMIN EDIT PDF MODAL */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/30 rounded-xl text-indigo-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t.editPdfTitle}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {editingFile.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFile(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPdf} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t.inputTopicLabel}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t.subjectLabel}</label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Science">Social Science</option>
                    <option value="English">English</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">{t.standardLabel}</label>
                  <select
                    value={editStandard}
                    onChange={(e) => setEditStandard(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL (iFrame safe) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">{t.deleteConfirmTitle}</h3>
                <p className="text-xs text-slate-500">{t.deleteConfirmDesc}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-800 line-clamp-2">{fileToDelete.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{fileToDelete.subject} • {fileToDelete.standard || 'All Standards'}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={executeDeleteFile}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.confirmDeleteBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSION ERROR TOAST */}
      {deletePermissionError && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-rose-400 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{deletePermissionError}</span>
        </div>
      )}
    </div>
  );
}
