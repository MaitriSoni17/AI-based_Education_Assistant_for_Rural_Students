import React, { useState, useEffect, useMemo } from 'react';
import { LanguageCode, User, CurriculumFolder, CurriculumFile } from '../../types';
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
  Wand2, Star, Trash2, Plus, BookMarked, Pencil
} from 'lucide-react';

interface AdminPdfsTabProps {
  user: User;
  lang: LanguageCode;
}

// Default Seed Folders for Rural Students (Empty so students only see admin-uploaded content)
const DEFAULT_CURRICULUM_FOLDERS: CurriculumFolder[] = [];
const DEFAULT_CURRICULUM_FILES: CurriculumFile[] = [];

// Helper to construct a crisp multi-language PDF data URL using html2canvas & jsPDF
const generateMultiLanguagePdfDataUrl = async (
  title: string,
  subject: string,
  std: string,
  language: string,
  fullBodyText: string
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
  container.style.padding = '40px 48px';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Hind", "Gujarati", "Mukta", sans-serif';
  container.style.boxSizing = 'border-box';

  // Format markdown headings, bullet points, numbers and paragraphs for maximum student readability
  const formattedHtml = fullBodyText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>')
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 10px;"></div>';

      // H1 Main Title
      if (trimmed.startsWith('# ')) {
        const titleText = trimmed.replace(/^#\s*/, '');
        return `<h1 style="font-size: 22px; font-weight: 800; color: #e11d48; margin: 22px 0 10px 0; border-bottom: 2px solid #e11d48; padding-bottom: 6px; letter-spacing: -0.3px;">${titleText}</h1>`;
      }
      // H2 Heading
      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace(/^##\s*/, '');
        return `<h2 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 18px 0 8px 0; background-color: #fff1f2; padding: 7px 12px; border-left: 4px solid #e11d48; border-radius: 4px; display: block;">${titleText}</h2>`;
      }
      // H3 Heading
      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s*/, '');
        return `<h3 style="font-size: 14px; font-weight: 800; color: #be123c; margin: 14px 0 6px 0; border-bottom: 1px dashed #fecdd3; padding-bottom: 3px;">${titleText}</h3>`;
      }
      // Callout Block
      if (trimmed.startsWith('> ')) {
        const text = trimmed.replace(/^>\s*/, '');
        return `<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; padding: 10px 14px; border-radius: 6px; margin: 10px 0; font-size: 13px; color: #0369a1; line-height: 1.6;">${text}</div>`;
      }
      // Numbered List
      if (/^\d+\./.test(trimmed)) {
        return `<div style="font-weight: 600; color: #0f172a; margin-top: 8px; margin-bottom: 4px; font-size: 13px; padding-left: 4px;">${trimmed}</div>`;
      }
      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        return `<div style="padding-left: 20px; position: relative; margin-bottom: 5px; color: #334155; font-size: 13px; line-height: 1.6;"><span style="position: absolute; left: 6px; color: #e11d48; font-weight: bold;">•</span> ${itemContent}</div>`;
      }

      return `<p style="margin: 0 0 8px 0; color: #334155; line-height: 1.65; font-size: 13px;">${trimmed}</p>`;
    })
    .join('');

  container.innerHTML = `
    <div style="border-bottom: 3px solid #e11d48; padding-bottom: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 800; color: #e11d48; text-transform: uppercase; letter-spacing: 1px;">Gramin Shiksha • AI Study Material</span>
        <span style="font-size: 11px; background-color: #ffe4e6; padding: 4px 12px; border-radius: 12px; font-weight: 700; color: #9f1239;">Language: ${language}</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; line-height: 1.3;">${title}</h1>
      <div style="font-size: 12.5px; color: #475569; font-weight: 600; display: flex; gap: 20px;">
        <span>Subject: <strong style="color: #0f172a;">${subject}</strong></span>
        <span>Standard: <strong style="color: #0f172a;">${std}</strong></span>
      </div>
    </div>
    <div style="font-size: 13px; line-height: 1.65; color: #1e293b;">
      ${formattedHtml}
    </div>
    <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10.5px; color: #64748b;">
      Gramin Shiksha AI Educational Platform • Comprehensive Study Material (${language})
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
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

    // Add page numbers and headers/footers to all generated PDF pages
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      pdf.setPage(pageNum);

      // White overlay rectangle at the bottom footer area to ensure page number is crisp and legible
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 280, 210, 17, 'F');

      // Thin decorative divider line above page footer
      pdf.setDrawColor(226, 232, 240); // Slate-200
      pdf.setLineWidth(0.4);
      pdf.line(15, 281, 195, 281);

      // Page Number Footer ("Page 1 of 3", "Page 2 of 3", etc.)
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105); // Slate-600
      pdf.text(`Page ${pageNum} of ${totalPages}`, 105, 288, { align: 'center' });

      // Branding & Metadata
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184); // Slate-400
      pdf.text(`Gramin Shiksha AI Study Guide • ${subject} (${std})`, 105, 292, { align: 'center' });

      // Top running header for page 2 onwards
      if (pageNum > 1) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 12, 'F');
        pdf.setDrawColor(241, 245, 249);
        pdf.line(15, 10, 195, 10);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${title.substring(0, 60)}`, 15, 7);
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
  badgeOfficialDocs: string;
  badgeFolders: string;
  badgeSavedOffline: string;
  selectLanguage: string;
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
  filterNotes: string;
  filterEbooks: string;
  filterPyq: string;
  filterQuestions: string;
  filterOther: string;
  btnReadPdf: string;
  btnSaveMaterial: string;
  btnSavedMaterial: string;
  btnDownload: string;
  noMaterialsFound: string;
  toastSaved: string;
  toastUnsaved: string;
}> = {
  en: {
    pageTitle: "PDF Notes & Study Materials",
    pageSubtitle: "Access, read, and download official chapter notes, solved model question papers, board exam formula sheets, and worksheets.",
    badgeOfficialDocs: "Official Documents",
    badgeFolders: "Study Folders",
    badgeSavedOffline: "Saved Offline",
    selectLanguage: "Select Language:",
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
    filterNotes: "📝 Notes & Summaries",
    filterEbooks: "📚 E-Books & Textbooks",
    filterPyq: "📜 Previous Year Papers (PYQ)",
    filterQuestions: "✍️ Practice Questions",
    filterOther: "📁 Other Resources",
    btnReadPdf: "Read PDF",
    btnSaveMaterial: "⭐ Save",
    btnSavedMaterial: "✓ Saved",
    btnDownload: "Download PDF",
    noMaterialsFound: "No study materials found matching your search or filters.",
    toastSaved: "✨ Saved to My Saved Material!",
    toastUnsaved: "Removed from My Saved Material."
  },
  hi: {
    pageTitle: "पीडीएफ नोट्स और अध्ययन सामग्री",
    pageSubtitle: "आधिकारिक अध्याय नोट्स, हल किए गए मॉडल प्रश्न पत्र, बोर्ड परीक्षा सूत्र और कार्यपत्रक पढ़ें और डाउनलोड करें।",
    badgeOfficialDocs: "आधिकारिक दस्तावेज",
    badgeFolders: "अध्ययन फोल्डर",
    badgeSavedOffline: "ऑफलाइन सहेजा गया",
    selectLanguage: "भाषा चुनें:",
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
    filterNotes: "📝 नोट्स और सारांश",
    filterEbooks: "📚 ई-पुस्तकें और पाठ्यपुस्तकें",
    filterPyq: "📜 पिछले वर्षों के प्रश्न पत्र (PYQ)",
    filterQuestions: "✍️ अभ्यास प्रश्न",
    filterOther: "📁 अन्य संसाधन",
    btnReadPdf: "पीडीएफ पढ़ें",
    btnSaveMaterial: "⭐ सहेजें",
    btnSavedMaterial: "✓ सहेजा गया",
    btnDownload: "डाउनलोड करें",
    noMaterialsFound: "आपकी खोज या फिल्टर से मेल खाने वाली कोई सामग्री नहीं मिली।",
    toastSaved: "✨ मेरी सहेजी गई सामग्री में सहेजा गया!",
    toastUnsaved: "मेरी सामग्री से हटा दिया गया।"
  },
  gu: {
    pageTitle: "પીડીએફ નોટ્સ અને અભ્યાસ સામગ્રી",
    pageSubtitle: "અધિકૃત પ્રકરણ નોટ્સ, સોલ્વ કરેલા મોડેલ પેપર્સ, બોર્ડ પરીક્ષાના સૂત્રો અને વર્કશીટ્સ વાંચો અને ડાઉનલોડ કરો.",
    badgeOfficialDocs: "સત્તાવાર દસ્તાવેજો",
    badgeFolders: "અભ્યાસ ફોલ્ડર્સ",
    badgeSavedOffline: "ઓફલાઇન સેવ કરેલ",
    selectLanguage: "ભાષા પસંદ કરો:",
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
    filterNotes: "📝 નોટ્સ અને સારાંશ",
    filterEbooks: "📚 ઈ-બુક્સ અને પાઠ્યપુસ્તકો",
    filterPyq: "📜 ભૂતકાળના પેપર્સ (PYQ)",
    filterQuestions: "✍️ પ્રેક્ટિસ પ્રશ્નો",
    filterOther: "📁 અન્ય સાધનો",
    btnReadPdf: "PDF વાંચો",
    btnSaveMaterial: "⭐ સેવ કરો",
    btnSavedMaterial: "✓ સેવ કરેલ",
    btnDownload: "ડાઉનલોડ કરો",
    noMaterialsFound: "તમારી શોધ અથવા ફિલ્ટર્સ સાથે મેળ ખાતી કોઈ સામગ્રી મળી નથી.",
    toastSaved: "✨ માય સેવ્ડ મટિરિયલમાં સેવ થઈ ગયું!",
    toastUnsaved: "માય સેવ્ડ મટિરિયલમાંથી દૂર કરવામાં આવ્યું."
  },
  mr: {
    pageTitle: "पीडीएफ नोट्स आणि अभ्यास साहित्य",
    pageSubtitle: "अधिकृत धडा नोट्स, सोडवलेले मॉडेल पेपर्स, बोर्ड परीक्षा सूत्रे आणि कार्यपत्रिका वाचा आणि डाउनलोड करा.",
    badgeOfficialDocs: "अधिकृत कागदपत्रे",
    badgeFolders: "अभ्यास फोल्डर्स",
    badgeSavedOffline: "ऑफलाइन जतन केले",
    selectLanguage: "भाषा निवडा:",
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
    filterNotes: "📝 नोट्स आणि सारांश",
    filterEbooks: "📚 ई-पुस्तके आणि पाठ्यपुस्तके",
    filterPyq: "📜 मागील वर्षांचे प्रश्नपत्रक (PYQ)",
    filterQuestions: "✍️ सराव प्रश्न",
    filterOther: "📁 इतर साधने",
    btnReadPdf: "पीडीएफ वाचा",
    btnSaveMaterial: "⭐ जतन करा",
    btnSavedMaterial: "✓ जतन केले",
    btnDownload: "डाउनलोड करा",
    noMaterialsFound: "तुमच्या शोधाशी जुळणारे कोणतेही अभ्यास साहित्य आढळले नाही.",
    toastSaved: "✨ माझ्या जतन केलेल्या साहित्यात जतन केले!",
    toastUnsaved: "माझ्या साहित्यातून काढून टाकले."
  },
  ta: {
    pageTitle: "PDF குறிப்புகள் & பாடப் பொருட்கள்",
    pageSubtitle: "அதிகாரப்பூர்வ பாடக் குறிப்புகள், தீர்க்கப்பட்ட மாதிரி வினாத்தாள்கள் மற்றும் தேர்வு சூத்திரத் தாள்களைப் படித்துப் பதிவிறக்கவும்.",
    badgeOfficialDocs: "அதிகாரப்பூர்வ ஆவணங்கள்",
    badgeFolders: "பாடக் கோப்புறைகள்",
    badgeSavedOffline: "ஆஃப்லைனில் சேமிக்கப்பட்டது",
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்:",
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
    filterNotes: "📝 குறிப்புகள் & சுருக்கம்",
    filterEbooks: "📚 மின்னூல்கள் & பாடப்புத்தகங்கள்",
    filterPyq: "📜 முந்தைய ஆண்டு வினாத்தாள்கள் (PYQ)",
    filterQuestions: "✍️ பயிற்சி வினாக்கள்",
    filterOther: "📁 பிற வளங்கள்",
    btnReadPdf: "PDF வாசிக்க",
    btnSaveMaterial: "⭐ சேமிக்க",
    btnSavedMaterial: "✓ சேமிக்கப்பட்டது",
    btnDownload: "பதிவிறக்க",
    noMaterialsFound: "உங்கள் தேடலுக்குப் பொருத்தமான பாடப் பொருட்கள் எதுவும் கிடைக்கவில்லை.",
    toastSaved: "✨ எனது சேமிக்கப்பட்ட பொருட்களில் சேமிக்கப்பட்டது!",
    toastUnsaved: "சேமிக்கப்பட்ட பொருட்களிலிருந்து அகற்றப்பட்டது."
  },
  te: {
    pageTitle: "PDF నోట్స్ & అధ్యయన సామగ్రి",
    pageSubtitle: "అధికారిక అధ్యాయాల నోట్స్, సాధించిన మోడల్ పేపర్లు మరియు బోర్డు పరీక్ష సూత్రాల షీట్లను చదవండి మరియు డౌన్లోడ్ చేయండి.",
    badgeOfficialDocs: "అధికారిక పత్రాలు",
    badgeFolders: "అధ్యయన ఫోల్డర్లు",
    badgeSavedOffline: "ఆఫ్లైన్లో సేవ్ చేయబడింది",
    selectLanguage: "భాషను ఎంచుకోండి:",
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
    filterNotes: "📝 నోట్స్ & సారాంశాలు",
    filterEbooks: "📚 ఇ-బుక్స్ & పాఠ్యపుస్తకాలు",
    filterPyq: "📜 మునుపటి సంవత్సరాల పేపర్లు (PYQ)",
    filterQuestions: "✍️ ప్రాక్టీస్ ప్రశ్నలు",
    filterOther: "📁 ఇతర వనరులు",
    btnReadPdf: "PDF చదవండి",
    btnSaveMaterial: "⭐ సేవ్ చేయండి",
    btnSavedMaterial: "✓ సేవ్ చేయబడింది",
    btnDownload: "డౌన్లోడ్",
    noMaterialsFound: "మీ శోధనకు తగిన అధ్యయన సామగ్రి ఏదీ కనుగొనబడలేదు.",
    toastSaved: "✨ నా సేవ్ చేసిన మెటీరియల్స్ లో సేవ్ చేయబడింది!",
    toastUnsaved: "నా మెటీరియల్స్ నుండి తొలగించబడింది."
  }
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // AI Topic Study Material Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState('Science');
  const [genStandard, setGenStandard] = useState('Class 10');
  const [genLanguage, setGenLanguage] = useState('English');
  const [genCustomLanguage, setGenCustomLanguage] = useState('');
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

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
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
        const isGenerated = (f as any).isGenerated === true || f.id.startsWith('gen-pdf-') || (f.category as string) === 'ai_generated';
        if (!isGenerated) return false;
      } else if (selectedMaterialType === 'ebook') {
        const isEbookOrAdmin = f.materialType === 'ebook' || (f as any).isAdminUpload === true || !(f as any).isGenerated || (f.category as string) === 'Textbooks' || (f.category as string) === 'Curriculum' || f.materialType === 'notes';
        if (!isEbookOrAdmin) return false;
      } else if (selectedMaterialType !== 'all') {
        const itemMatType = f.materialType || 'notes';
        if (itemMatType !== selectedMaterialType) return false;
      }

      return true;
    });
  }, [files, currentFolderId, searchQuery, selectedSubject, selectedStandard, selectedCategory, selectedMaterialType, downloadedPdfIds]);

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

  // Generate Custom AI Study Material by Main Topic
  const handleGenerateTopicStudyMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!genTopic.trim()) {
      alert("Please enter a main topic or chapter title.");
      return;
    }

    setGenLoading(true);
    setGenSuccessMsg(null);

    const targetLang = genLanguage === 'Other' ? (genCustomLanguage.trim() || 'Custom Language') : genLanguage;

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a master educator creating a highly readable, clear, and engaging educational study guide strictly in ${targetLang} for ${genStandard} students on the topic: "${genTopic.trim()}". Subject: "${genSubject}".

CRITICAL PEDAGOGICAL & READABILITY REQUIREMENTS:
1. FOCUS & CLARITY: Focus 100% on "${genTopic.trim()}". Break down complex concepts into simple, step-by-step explanations with intuitive real-world analogies.
2. HIGH VISUAL READABILITY: Use clear markdown headings, bold key terms, bulleted lists, and callout blocks (e.g. "> 💡 Pro Tip:" or "> ⚠️ Common Mistake:").
3. LANGUAGE: Generate all explanations, definitions, and questions strictly in ${targetLang} (using native script).
4. AUDIENCE: Grade-appropriate for ${genStandard} (${genSubject}).

FORMAT INTO CLEAR STRUCTURED SECTIONS USING MARKDOWN HEADINGS:

# ${genTopic.toUpperCase()}

## 🎯 Chapter Overview & Learning Objectives
- Brief, engaging introduction to "${genTopic.trim()}".
- 3 key learning goals students will master.

## 💡 Key Terms & Core Definitions
- Define essential terms with bold keywords and simple explanations.
- State key formulas, rules, or laws in clear bullet points.

## 📖 Detailed Step-by-Step Explanation
- Explain fundamental principles step-by-step with relatable analogies.
- Use callout blocks starting with "> 💡 Key Takeaway:" for important memory aids.

## 📝 Solved Examples & Step-by-Step Calculations
- Provide 2-3 class-appropriate solved problems/questions with step-by-step solution logic.

## ⚠️ Common Pitfalls & Mistakes to Avoid
- List 2-3 frequent misconceptions or common exam errors students make on this topic.

## ⚡ Quick Revision Summary & Practice Questions
- 5 concise bullet points summarizing the entire chapter for exam preparation.
- 5 self-assessment practice questions with detailed answers provided at the end.`,
          systemInstruction: `You are an expert curriculum author and master teacher specialized in creating student-friendly, highly accessible educational study materials. Always use clear markdown structure, bold key terms, simple analogies, and grade-appropriate explanations strictly in ${targetLang} for subject "${genSubject}" and level "${genStandard}".`,
        })
      });

      const data = await response.json();
      if (!data.success || !data.text) {
        throw new Error(data.message || 'Failed to generate study material.');
      }

      const generatedText = data.text;
      const cleanTitle = `${genTopic.trim()} (${targetLang}) - ${genSubject} (${genStandard})`;
      const newFileId = `gen-pdf-${Date.now()}`;

      const pdfDataUrl = await generateMultiLanguagePdfDataUrl(
        cleanTitle,
        genSubject,
        genStandard,
        targetLang,
        generatedText
      );

      const newFile: CurriculumFile = {
        id: newFileId,
        name: cleanTitle,
        subject: genSubject,
        standard: genStandard,
        materialType: 'notes',
        category: 'pdf',
        description: `AI Generated Study Guide in ${targetLang} for "${genTopic.trim()}". Subject: ${genSubject}, Class: ${genStandard}.`,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: pdfDataUrl,
        size: '1.2 MB',
        isVisible: true,
        isGenerated: true,
        fullContent: generatedText
      } as any;

      // Update state
      setFiles(prev => [newFile, ...prev]);

      // Save to localStorage so generated files persist across sessions and reloads
      try {
        const savedList = JSON.parse(localStorage.getItem('gramin_curriculum_files_v2') || '[]');
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify([newFile, ...savedList]));
      } catch (err) {
        console.warn("Failed to save generated file to localStorage:", err);
      }

      // Cache locally in IndexedDB for instant preview reading
      try {
        await saveFileLocal(newFileId, pdfDataUrl);
      } catch (err) {
        console.warn("Local storage save error:", err);
      }

      // Persist to Firebase Firestore database
      try {
        await saveFirebaseCurriculumFile(newFile as any);
      } catch (err) {
        console.warn("Firestore save error:", err);
      }

      const topicName = genTopic;
      setGenTopic('');
      setGenCustomLanguage('');
      setGenSuccessMsg(`✨ AI Study Material for "${topicName}" (${targetLang}) generated successfully! View it under "AI Generated Material" tab below.`);
      setSelectedMaterialType('ai_generated');
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

    const isAiGenerated = (file as any).isGenerated === true || file.id.startsWith('gen-pdf-') || (file.category as string) === 'ai_generated';
    const isAdmin = user?.role === 'admin';

    // Permission check: Non-admins cannot delete admin-uploaded PDFs
    if (!isAiGenerated && !isAdmin) {
      setDeletePermissionError("Only admins have permission to delete admin-uploaded curriculum PDFs.");
      setTimeout(() => setDeletePermissionError(null), 4000);
      return;
    }

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

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Official Curriculum & AI Study Hub</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            {t.pageTitle}
          </h2>

          <p className="text-sm text-rose-100 font-sans leading-relaxed">
            {t.pageSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
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
            <span>✨ AI Generated Material</span>
            <span className="text-[10px] bg-indigo-200 text-indigo-900 font-mono px-1.5 py-0.5 rounded-full font-bold">
              {files.filter(f => (f as any).isGenerated).length}
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Material Type</label>
            <select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Material Types</option>
              <option value="notes">📝 Notes & Summaries</option>
              <option value="ebook">📚 E-Books & Textbooks</option>
              <option value="pyq">📜 Previous Year Papers (PYQ)</option>
              <option value="practice_questions">✍️ Practice Questions & Worksheets</option>
              <option value="other">📂 Other Resources</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subject Filter</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Subjects ({files.length})</option>
              {subjectsList.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Standard / Class</label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Standards (Class 1-12)</option>
              <option value="Class 10">Class 10 (Std 10)</option>
              <option value="Class 9">Class 9 (Std 9)</option>
              <option value="Class 8">Class 8 (Std 8)</option>
              <option value="Class 5">Class 5 (Primary)</option>
              <option value="All Standards">All Standards General</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">File Format</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">All File Formats</option>
              <option value="pdf">📄 PDF Documents</option>
              <option value="document">📝 Text Documents</option>
              <option value="quiz">🎯 Worksheets & Quizzes</option>
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
            <span>Root Folders</span>
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
            <span>Study Categories & Folders ({visibleFolders.length})</span>
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
                    <span>Explore Folder</span>
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
              {currentFolderId ? `PDFs in ${currentFolder?.name}` : 'All Curriculum PDFs'} ({filteredFiles.length})
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading official admin PDF library...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No PDF Documents Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No matching PDF files found for the current search query or filter. Try clearing your filters or selecting a different subject.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedStandard('all');
                setSelectedCategory('all');
                setCurrentFolderId(null);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map(file => {
              const isDownloaded = downloadedPdfIds.includes(file.id);
              const matTypeInfo = getMaterialTypeInfo(file.materialType);
              const isAiGenerated = (file as any).isGenerated === true || file.id.startsWith('gen-pdf-') || (file.category as string) === 'ai_generated';
              const isAdmin = user?.role === 'admin';
              const canDelete = isAiGenerated || isAdmin;

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
                        title="Edit PDF Details (Admin Only)"
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Option: AI generated for all users OR Admin-uploaded for Admins only */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteFile(file, e)}
                        title={isAiGenerated ? "Delete AI-Generated Material" : "Delete Admin PDF (Admin Only)"}
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
              const isAiGenerated = (file as any).isGenerated === true || file.id.startsWith('gen-pdf-') || (file.category as string) === 'ai_generated';
              const isAdmin = user?.role === 'admin';
              const canDelete = isAiGenerated || isAdmin;

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
                        {isDownloaded && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Saved Offline
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
                        title="Edit PDF Details (Admin Only)"
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Option: AI generated for all users OR Admin-uploaded for Admins only */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteFile(file, e)}
                        title={isAiGenerated ? "Delete AI-Generated Material" : "Delete Admin PDF (Admin Only)"}
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
                      speakText(speechTextContent, 'en');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                    isPdfSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isPdfSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPdfSpeaking ? 'Stop Voice' : 'AI Read Aloud'}</span>
                </button>

                <button
                  onClick={() => handleDownloadFileToDevice(activePdfFile)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save</span>
                </button>

                {(((activePdfFile as any).isGenerated === true || activePdfFile.id.startsWith('gen-pdf-') || (activePdfFile.category as string) === 'ai_generated') || user?.role === 'admin') && (
                  <button
                    onClick={(e) => handleDeleteFile(activePdfFile, e)}
                    title="Delete Study Material"
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsPdfSpeaking(false);
                    setActivePdfFile(null);
                  }}
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
                  isAiGenerated={(activePdfFile as any).isGenerated === true || activePdfFile.id.startsWith('gen-pdf-') || (activePdfFile.category as string) === 'ai_generated'}
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
                  <h3 className="font-bold text-sm">Edit Admin Curriculum PDF</h3>
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
                <label className="text-xs font-bold text-slate-300">Document Title</label>
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
                  <label className="text-xs font-bold text-slate-300">Subject</label>
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
                  <label className="text-xs font-bold text-slate-300">Standard / Class</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Changes
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
                <h3 className="font-bold text-lg text-slate-900">Delete Study Material?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
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
                Cancel
              </button>
              <button
                onClick={executeDeleteFile}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSION ERROR TOAST */}
      {deletePermissionError && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-rose-400 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{deletePermissionError}</span>
        </div>
      )}
    </div>
  );
}
