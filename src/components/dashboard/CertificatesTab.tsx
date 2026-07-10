import React, { useState, useEffect } from 'react';
import { LanguageCode, User as StudentUser } from '../../types';
import { speakText } from '../../utils/speech';
import { 
  Award, Sparkles, Download, Calendar, Clock, MessageSquare, 
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, Trash2, 
  User, BookOpen, ChevronRight, HelpCircle, FileText, Check, ArrowRight
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ChatLogItem {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  selectedAnswerIndex: number;
  explanation: string;
}

interface EarnedCertificate {
  id: string;
  quizTitle: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  date: string;
  time: string;
  recipientName: string;
  chatLogs: ChatLogItem[];
}

interface CertificatesTabProps {
  user: StudentUser;
  lang: LanguageCode;
  onNavigateToTab?: (tabId: 'quiz') => void;
  onUpdateUser: (fields: Partial<StudentUser>) => void;
}

const TITLE_TRANSLATIONS: Record<string, string> = {
  en: "Academic Credentials Portfolio",
  hi: "शैक्षणिक प्रमाण पत्र पोर्टफोलियो",
  gu: "શૈક્ષણિક પ્રમાણપત્ર પોર્ટફોલિયો",
  mr: "शैक्षणिक प्रमाणपत्र पोर्टफोलिओ",
  ta: "கல்விச் சான்றிதழ்கள்",
  te: "విద్యా ధృవీకరణ పత్రాలు"
};

const SUBTITLE_TRANSLATIONS: Record<string, string> = {
  en: "Access, customize, and print your officially earned success credentials and session transcripts.",
  hi: "अपने आधिकारिक रूप से अर्जित सफलता प्रमाणपत्रों और सत्र ट्रांसक्रिप्ट को एक्सेस, कस्टमाइज़ और प्रिंट करें।",
  gu: "તમે મેળવેલા સત્તાવાર પ્રમાણપત્રો અને ટ્રાન્સક્રિપ્ટ્સ જુઓ, કસ્ટમાઇઝ કરો અને ડાઉનલોડ કરો.",
  mr: "तुम्ही मिळवलेली अधिकृत प्रमाणपत्रे आणि सत्र ट्रान्सक्रिप्ट पहा, कस्टमाइझ करा आणि प्रिंट करा.",
  ta: "நீங்கள் பெற்ற சான்றிதழ்கள் மற்றும் அமர்வு பிரதிகள் ஆகியவற்றை அணுகவும், தனிப்பயனாக்கவும் மற்றும் அச்சிடவும்.",
  te: "మీరు పొందిన అధికారిక ధృవీకరణ పత్రాలను మరియు సెషన్ వివరాలను వీక్షించండి, అనుకూలీకరించండి మరియు డౌన్‌లోడ్ చేయండి."
};

export default function CertificatesTab({ user, lang, onNavigateToTab, onUpdateUser }: CertificatesTabProps) {
  const [certificates, setCertificates] = useState<EarnedCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<EarnedCertificate | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [activeChatIndex, setActiveChatIndex] = useState<number | null>(null);

  // Load certificates from user object and sync when active user changes
  useEffect(() => {
    const raw = user.earnedCertificates;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as EarnedCertificate[];
        setCertificates(parsed);
        if (parsed.length > 0) {
          setSelectedCert(parsed[0]);
          setEditingName(parsed[0].recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
        } else {
          setSelectedCert(null);
          setEditingName('');
        }
      } catch (err) {
        console.error("Error loading earned certificates", err);
      }
    } else {
      setCertificates([]);
      setSelectedCert(null);
      setEditingName('');
    }
  }, [user]);

  // Update selected certificate name and save to Firestore
  const handleUpdateName = (newName: string) => {
    setEditingName(newName);
    if (!selectedCert) return;

    // Update locally in selected
    const updatedCert = { ...selectedCert, recipientName: newName };
    setSelectedCert(updatedCert);

    // Update in list
    const updatedList = certificates.map(c => c.id === selectedCert.id ? updatedCert : c);
    setCertificates(updatedList);
    onUpdateUser({
      earnedCertificates: JSON.stringify(updatedList),
      certificateName: newName
    });
  };

  // Delete certificate from portfolio
  const handleDeleteCertificate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(lang === 'hi' ? "क्या आप वाकई इस प्रमाण पत्र को हटाना चाहते हैं?" : "Are you sure you want to delete this certificate?");
    if (!confirmDelete) return;

    const filtered = certificates.filter(c => c.id !== id);
    setCertificates(filtered);
    onUpdateUser({
      earnedCertificates: JSON.stringify(filtered)
    });

    if (selectedCert?.id === id) {
      if (filtered.length > 0) {
        setSelectedCert(filtered[0]);
        setEditingName(filtered[0].recipientName || user.name || 'GyaanBot Scholar');
      } else {
        setSelectedCert(null);
        setEditingName('');
      }
    }

    speakText(
      lang === 'hi' ? "प्रमाण पत्र सफलतापूर्वक हटा दिया गया है।" : "Certificate deleted successfully.",
      lang,
      "Swami AI",
      "🤖 Swami AI"
    );
  };

  // Clean, robust direct canvas-based landscape high-resolution PDF generation
  const handleDownloadPDF = async (cert: EarnedCertificate) => {
    try {
      setIsGeneratingPdf(true);
      speakText(
        lang === 'hi' ? "आपका प्रमाण पत्र पीडीएफ के रूप में तैयार किया जा रहा है..." : "Generating your certificate PDF...",
        lang,
        "Swami AI",
        "🤖 Swami AI"
      );

      // Create high-resolution landscape A4 canvas (300 DPI approx, 2000x1414 is super crisp)
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create 2D canvas context");

      // Enable text anti-aliasing
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // 1. Solid background (elegant soft ivory cream)
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Beautiful background watermark (subtle outline pattern)
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 500px sans-serif';
      ctx.fillText('🎓', canvas.width / 2, canvas.height / 2);
      ctx.restore();

      // 3. Double luxury gold border
      // Outer border
      ctx.strokeStyle = '#D97706'; // amber-600
      ctx.lineWidth = 24;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Inner border
      ctx.strokeStyle = '#F59E0B'; // amber-500
      ctx.lineWidth = 4;
      ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

      // 4. Elegant corner motifs
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⚜️', 90, 110);
      ctx.fillText('⚜️', canvas.width - 90, 110);
      ctx.fillText('⚜️', 90, canvas.height - 110);
      ctx.fillText('⚜️', canvas.width - 90, canvas.height - 110);

      // 5. Header: Certificate of Achievement
      ctx.fillStyle = '#B45309'; // dark amber
      ctx.font = 'bold 44px sans-serif';
      const certTitle = lang === 'hi' ? "सफलता का प्रमाण पत्र" : "CERTIFICATE OF ACHIEVEMENT";
      ctx.fillText(certTitle, canvas.width / 2, 220);

      // Gold elegant accent line under title
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 250, 260);
      ctx.lineTo(canvas.width / 2 + 250, 260);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 6. Subtitle: Proudly presented to
      ctx.fillStyle = '#6B7280'; // gray-500
      ctx.font = 'bold 22px sans-serif';
      const subtitleLabel = lang === 'hi' ? "यह प्रमाण पत्र गर्व के साथ दिया जाता है" : "PROUDLY PRESENTED TO";
      ctx.fillText(subtitleLabel, canvas.width / 2, 340);

      // 7. Student's Full Name (Bold, elegant, dynamic font scaling if long)
      const nameText = editingName.trim() || cert.recipientName || (lang === 'hi' ? "अध्ययनकर्ता" : "Acclaimed Scholar");
      ctx.fillStyle = '#111827'; // gray-900
      ctx.font = 'italic bold 72px Georgia, serif';
      // Measure name text and scale down if too long
      const maxNameWidth = canvas.width - 400;
      let nameFontSize = 72;
      while (ctx.measureText(nameText).width > maxNameWidth && nameFontSize > 36) {
        nameFontSize -= 4;
        ctx.font = `italic bold ${nameFontSize}px Georgia, serif`;
      }
      ctx.fillText(nameText, canvas.width / 2, 450);

      // Accent underline under name
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 350, 500);
      ctx.lineTo(canvas.width / 2 + 350, 500);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 8. Body Description (Multiple lines)
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '30px sans-serif';
      const bodyLabel = lang === 'hi' ? "जिन्होंने सफलतापूर्वक शैक्षणिक विषय प्रश्नोत्तरी उत्तीर्ण की" : "for successfully passing the academic topic quiz on";
      ctx.fillText(bodyLabel, canvas.width / 2, 590);

      // Topic Name (Highlighted in stylish card border or prominent text)
      ctx.fillStyle = '#1E3A8A'; // deep blue-900
      ctx.font = 'bold 38px Georgia, serif';
      ctx.fillText(`🎯 ${cert.quizTitle}`, canvas.width / 2, 670);

      // Score percentage and details
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '30px sans-serif';
      const accuracyPct = Math.round((cert.score / cert.totalQuestions) * 100);
      const scoreLabel = lang === 'hi' ? "एक उत्कृष्ट सटीकता स्कोर के साथ:" : "with a remarkable accuracy score of";
      ctx.fillText(`${scoreLabel} ${accuracyPct}%`, canvas.width / 2, 750);
      
      ctx.font = 'italic bold 26px sans-serif';
      ctx.fillStyle = '#10B981'; // emerald-550
      const correctLabel = lang === 'hi' ? "उत्तर सही" : "correct answers";
      ctx.fillText(`(${cert.score} / ${cert.totalQuestions} ${correctLabel})`, canvas.width / 2, 810);

      // 9. Footer Components (Y = 1050)
      const footerY = 1050;

      // Left: Date
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 20px sans-serif';
      const dateHeader = lang === 'hi' ? "उपलब्धि की तिथि" : "Date of Achievement";
      ctx.fillText(dateHeader, 220, footerY);

      ctx.fillStyle = '#374151'; // gray-700
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`${cert.date} - ${cert.time}`, 220, footerY + 50);

      // Right: Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('AUTHORIZED SIGNATURE', canvas.width - 220, footerY);

      // Draw handwriting/signature text
      ctx.fillStyle = '#1E3A8A'; // rich dark blue
      ctx.font = 'italic bold 36px Georgia, serif';
      ctx.fillText('✍️ Swami AI Tutor', canvas.width - 220, footerY + 45);

      // Signature line
      ctx.beginPath();
      ctx.moveTo(canvas.width - 440, footerY + 70);
      ctx.lineTo(canvas.width - 220, footerY + 70);
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 18px sans-serif';
      const deanLabel = lang === 'hi' ? "स्वामी एआई शिक्षा निदेशक" : "Swami AI Academic Dean";
      ctx.fillText(deanLabel, canvas.width - 220, footerY + 105);

      // Center: Stamp / Gold Seal Badge
      const stampX = canvas.width / 2;
      const stampY = footerY + 40;

      // Ribbon tails behind seal
      ctx.fillStyle = '#EF4444'; // red-550
      ctx.beginPath();
      ctx.moveTo(stampX - 25, stampY + 30);
      ctx.lineTo(stampX - 45, stampY + 115);
      ctx.lineTo(stampX - 10, stampY + 95);
      ctx.lineTo(stampX - 10, stampY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(stampX + 10, stampY + 30);
      ctx.lineTo(stampX + 10, stampY + 95);
      ctx.lineTo(stampX + 45, stampY + 115);
      ctx.lineTo(stampX + 25, stampY + 30);
      ctx.closePath();
      ctx.fill();

      // Gold seal body circle
      ctx.beginPath();
      ctx.arc(stampX, stampY, 70, 0, 2 * Math.PI);
      const sealGrad = ctx.createRadialGradient(stampX, stampY, 10, stampX, stampY, 70);
      sealGrad.addColorStop(0, '#FDE047'); // yellow-300
      sealGrad.addColorStop(0.5, '#F59E0B'); // amber-500
      sealGrad.addColorStop(1, '#B45309'); // amber-700
      ctx.fillStyle = sealGrad;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Inner dashed seal border
      ctx.beginPath();
      ctx.arc(stampX, stampY, 58, 0, 2 * Math.PI);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Seal text content
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350F'; // amber-900
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('★', stampX, stampY - 12);

      ctx.font = 'black 16px sans-serif';
      ctx.fillText('OFFICIAL', stampX, stampY + 18);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SWAMI AI', stampX, stampY + 34);

      // 10. Secure bottom verification details footer (Y = 1320)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 18px monospace';
      ctx.fillText('🔒 SECURE STUDY METRICS SYNC VERIFIED', 100, canvas.height - 110);

      ctx.textAlign = 'right';
      ctx.fillText(cert.id, canvas.width - 100, canvas.height - 110);

      // Convert Canvas to High-Quality PNG Data URL
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Create landscape A4 jsPDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `Certificate_${nameText.replace(/[^a-zA-Z0-9]/g, '_')}_${cert.quizTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);

      speakText(
        lang === 'hi' ? "प्रमाण पत्र सफलतापूर्वक डाउनलोड हो गया है!" : "Certificate downloaded successfully!",
        lang,
        "Swami AI",
        "🤖 Swami AI"
      );
    } catch (error) {
      console.error('Failed to generate Canvas PDF:', error);
      speakText(
        lang === 'hi' ? "प्रमाण पत्र डाउनलोड करने में विफल रहा। कृपया पुनः प्रयास करें।" : "Failed to download certificate. Please try again.",
        lang,
        "Swami AI",
        "🤖 Swami AI"
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div id="certificates-tab-root" className="bg-[#FAF9F6] rounded-3xl border border-gray-150 shadow-xs p-4 sm:p-6 text-left space-y-6">
      
      {/* HEADER BANNER WITH GRADIENT PATTERN */}
      <div className="relative overflow-hidden bg-gradient-to-tr from-[#3D405B] to-[#51557A] rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-400/10 border border-amber-400/20 rounded-lg text-amber-300">
              <Award className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="font-display font-black text-base sm:text-lg tracking-tight">
              {TITLE_TRANSLATIONS[lang] || TITLE_TRANSLATIONS['en']}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-indigo-100 max-w-2xl leading-relaxed">
            {SUBTITLE_TRANSLATIONS[lang] || SUBTITLE_TRANSLATIONS['en']}
          </p>
        </div>
        {certificates.length > 0 && (
          <span className="relative z-10 bg-amber-400/10 border border-amber-300/30 text-amber-200 font-mono font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-inner backdrop-blur-xs">
            ✨ {certificates.length} {lang === 'hi' ? "प्रमाण पत्र" : "Earned Credentials"}
          </span>
        )}
      </div>

      {certificates.length === 0 ? (
        /* EMPTY STATE WRAPPER */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-5 bg-white rounded-3xl border border-dashed border-gray-200 max-w-xl mx-auto my-4 shadow-3xs">
          <div className="relative flex justify-center">
            <div className="p-4 bg-amber-50 rounded-full border border-amber-100">
              <Award className="h-12 w-12 text-amber-500/80" />
            </div>
            <Sparkles className="h-5 w-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-display font-extrabold text-[#3D405B] text-base">
              {lang === 'hi' ? "कोई प्रमाण पत्र अभी तक अर्जित नहीं हुआ 🎓" : "No Academic Credentials Yet 🎓"}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              {lang === 'hi' 
                ? "स्वामी एआई के आधिकारिक प्रमाण पत्र को अर्जित करने के लिए 'विषय आधारित खेलें प्रश्नोत्तरी' अनुभाग में कम से कम 50% शुद्धता अंक प्राप्त करें।"
                : "Earn official achievement credentials by scoring at least 50% on any subject-based quiz in our play zone."}
            </p>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('quiz')}
              className="px-5 py-2.5 bg-[#E07A5F] hover:bg-[#C9644B] text-white font-extrabold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover-float"
            >
              <span>{lang === 'hi' ? "प्रश्नोत्तरी खेलना शुरू करें ➡️" : "Unlock Credentials Now ➡️"}</span>
            </button>
          )}
        </div>
      ) : (
        /* PRIMARY PORTFOLIO GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: EARNED CERTIFICATES SIDEBAR SELECTOR */}
          <div className="lg:col-span-4 space-y-3 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-1">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span>🏆</span>
                <span>{lang === 'hi' ? "सफलता सूची" : "Credentials Log"}</span>
              </h3>
            </div>
            
            <div className="space-y-2">
              {certificates.map((cert) => {
                const isSelected = selectedCert?.id === cert.id;
                const accuracy = Math.round((cert.score / cert.totalQuestions) * 100);
                
                return (
                  <div
                    key={cert.id}
                    onClick={() => {
                      setSelectedCert(cert);
                      setEditingName(cert.recipientName || 'GyaanBot Scholar');
                      setActiveChatIndex(null);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative group ${
                      isSelected 
                        ? 'bg-white border-amber-400 shadow-sm ring-1 ring-amber-100 scale-[1.01]' 
                        : 'bg-white border-gray-150 hover:border-gray-300 hover:shadow-3xs'
                    }`}
                  >
                    {/* Selected Left Highlight Accent */}
                    {isSelected && (
                      <div className="absolute top-3 bottom-3 left-0 w-1 bg-amber-500 rounded-r-full" />
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-sans font-extrabold text-xs sm:text-sm leading-snug ${isSelected ? 'text-gray-900' : 'text-gray-700'} line-clamp-2`}>
                          🎓 {cert.quizTitle}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteCertificate(cert.id, e)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                          title={lang === 'hi' ? "प्रमाण पत्र हटाएं" : "Delete certificate"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          accuracy >= 80 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          <Check className="h-2.5 w-2.5" />
                          <span>{accuracy}% ({cert.score}/{cert.totalQuestions})</span>
                        </span>
                        
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono font-medium">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{cert.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: COMPREHENSIVE CERTIFICATE DETAILS & PREMIUM MOCKUP */}
          {selectedCert && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* PRIMARY OPTIONS / DETAILS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* NAME REGISTRATION AND CUSTOMIZATION */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-3xs flex flex-col justify-between space-y-2 text-left">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-500" />
                      {lang === 'hi' ? "प्रमाण पत्र पर नाम" : "Registered Scholar Name"}
                    </label>
                    <p className="text-[10px] text-gray-400 font-sans leading-normal">
                      {lang === 'hi' ? "यह नाम तुरंत नीचे दिए गए डिजिटल प्रमाण पत्र पर प्रिंट हो जाएगा।" : "Any edit will instantly customize and refresh your credential certificate."}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => handleUpdateName(e.target.value)}
                      placeholder={lang === 'hi' ? "जैसे: राहुल कुमार" : "e.g., Jane Doe"}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-gray-50/50 font-semibold"
                      maxLength={40}
                    />
                    <span className="absolute right-3 top-2.5 text-[9px] text-gray-400 font-mono font-bold">
                      {editingName.length}/40
                    </span>
                  </div>
                </div>

                {/* METADATA & PDF DOWNLOAD ACTION */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-3xs flex flex-col justify-between space-y-4 text-left">
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex flex-row items-center justify-between border-b border-gray-100 pb-2 gap-4">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
                        {lang === 'hi' ? "अर्जित समय" : "Secured Timestamp"}
                      </span>
                      <span className="font-black text-gray-750 flex items-center gap-1.5 text-right">
                        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>{selectedCert.date} @ {selectedCert.time}</span>
                      </span>
                    </div>
                    <div className="flex flex-row items-center justify-between gap-4">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
                        {lang === 'hi' ? "सत्यापन कोड" : "Credential ID"}
                      </span>
                      <span className="font-mono text-gray-500 font-bold uppercase select-all text-[10px] text-right truncate max-w-[200px]" title={selectedCert.id}>
                        {selectedCert.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadPDF(selectedCert)}
                    disabled={!editingName.trim() || isGeneratingPdf}
                    className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-3xs hover-float ${(!editingName.trim() || isGeneratingPdf) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{lang === 'hi' ? 'दस्तावेज़ तैयार हो रहा है...' : 'Generating Official PDF...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>{lang === 'hi' ? 'आधिकारिक प्रमाण पत्र डाउनलोड करें' : 'Download PDF'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* 3D EXHIBITION-STYLE CERTIFICATE PREVIEW MOCKUP */}
              <div className="relative mx-auto max-w-2xl bg-stone-100 p-4 sm:p-5 rounded-3xl shadow-md border border-stone-200 hover-shadow-glow duration-300 transition-all">
                {/* 3D Drop shadow and simulated wooden dark frame */}
                <div className="bg-[#2C211A] p-2.5 sm:p-3.5 rounded-2xl shadow-xl border border-stone-800">
                  {/* Subtle inner gold frame highlight */}
                  <div className="bg-[#FDFBF7] border-4 border-[#C5A880] p-6 sm:p-8 rounded-lg relative font-serif text-center select-none overflow-hidden shadow-inner flex flex-col justify-between min-h-[380px] sm:min-h-[460px]">
                    
                    {/* Elegant corner motif lines */}
                    <div className="border-l-2 border-t-2 border-[#C5A880] absolute top-3 left-3 w-5 h-5 pointer-events-none" />
                    <div className="border-r-2 border-t-2 border-[#C5A880] absolute top-3 right-3 w-5 h-5 pointer-events-none" />
                    <div className="border-l-2 border-b-2 border-[#C5A880] absolute bottom-3 left-3 w-5 h-5 pointer-events-none" />
                    <div className="border-r-2 border-b-2 border-[#C5A880] absolute bottom-3 right-3 w-5 h-5 pointer-events-none" />

                    {/* Faint luxury background watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.015]">
                      <span className="text-[180px]">🎓</span>
                    </div>

                    {/* Title Header */}
                    <div className="space-y-2 z-10">
                      <h2 className="text-[#B45309] font-black text-[9px] sm:text-xs tracking-[0.2em] font-sans uppercase">
                        {lang === 'hi' ? "सफलता का प्रमाण पत्र" : "CERTIFICATE OF ACHIEVEMENT"}
                      </h2>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                    </div>

                    {/* Presentation Line */}
                    <p className="text-[8px] sm:text-[9px] text-gray-400 italic tracking-widest font-sans font-bold uppercase mt-2">
                      {lang === 'hi' ? "यह प्रमाण पत्र गर्व के साथ दिया जाता है" : "PROUDLY PRESENTED TO"}
                    </p>

                    {/* Recipient Scholar Name */}
                    <div className="my-1 sm:my-3 z-10">
                      <h1 className="text-xl sm:text-3xl font-extrabold text-stone-900 font-serif italic text-amber-900 min-h-[36px] drop-shadow-3xs break-words px-2 max-w-md mx-auto leading-tight">
                        {editingName.trim() || (lang === 'hi' ? "आपका नाम यहाँ" : "Honorary Scholar")}
                      </h1>
                      <div className="w-40 h-[1px] bg-stone-200 mx-auto mt-1" />
                    </div>

                    {/* Subject/Topic Description */}
                    <div className="space-y-1 text-[10px] sm:text-xs text-stone-600 font-sans font-medium max-w-md mx-auto leading-relaxed z-10">
                      <p>
                        {lang === 'hi' ? "जिन्होंने सफलतापूर्वक शैक्षणिक विषय प्रश्नोत्तरी उत्तीर्ण की:" : "for successfully passing the academic topic quiz on"}
                      </p>
                      <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs tracking-tight font-serif bg-amber-50/50 py-1 px-3 rounded-lg border border-amber-100/40 inline-block my-1">
                        🎯 {selectedCert.quizTitle}
                      </p>
                      <p className="text-stone-500">
                        {lang === 'hi' ? "एक उत्कृष्ट सटीकता स्कोर के साथ:" : "with an outstanding academic accuracy score of"}{" "}
                        <span className="font-extrabold text-emerald-600">
                          {Math.round((selectedCert.score / selectedCert.totalQuestions) * 100)}%
                        </span>{" "}
                        ({selectedCert.score}/{selectedCert.totalQuestions} {lang === 'hi' ? "सही" : "correct"})
                      </p>
                    </div>

                    {/* Signature & Seal Row */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-end text-[8px] sm:text-[10px] text-stone-400 font-mono z-10">
                      
                      {/* Left: Metadata details */}
                      <div className="text-left space-y-0.5">
                        <span className="block text-[7px] font-sans font-bold text-stone-400 uppercase tracking-wider">{lang === 'hi' ? "अधिग्रहण तिथि" : "Acquisition Date"}</span>
                        <span className="block font-bold text-stone-700">{selectedCert.date}</span>
                      </div>

                      {/* Center: Wax stamp visual seal with ribbons */}
                      <div className="relative flex flex-col items-center select-none w-16 h-16 shrink-0 -mb-2">
                        {/* Ribbons */}
                        <div className="absolute top-4 left-4 w-3 h-10 bg-red-600/90 rotate-[-12deg] rounded-b-md shadow-3xs" />
                        <div className="absolute top-4 right-4 w-3 h-10 bg-red-600/90 rotate-[12deg] rounded-b-md shadow-3xs" />
                        
                        {/* Gold Wax circular seal */}
                        <div className="absolute top-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center border border-amber-100 shadow-md">
                          <div className="w-8 h-8 rounded-full border border-dashed border-amber-900/40 flex items-center justify-center font-bold text-amber-950 text-[11px]">
                            ★
                          </div>
                        </div>
                      </div>

                      {/* Right: Signature details */}
                      <div className="text-right space-y-0.5">
                        <span className="block italic text-[11px] sm:text-xs text-indigo-900 font-serif font-black pr-1 select-none">✍️ Swami AI</span>
                        <div className="w-20 h-[1px] bg-stone-300 ml-auto" />
                        <span className="block text-[7px] font-sans font-bold text-stone-400 uppercase tracking-wider">Academic Dean</span>
                      </div>

                    </div>

                  </div>
                </div>
              </div>

              {/* CHAT SESSION LOG / CONVERSATIONAL REVIEW */}
              <div className="space-y-3.5 text-left pt-2">
                <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2.5">
                  <div className="p-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-500">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D405B]">
                    💬 {lang === 'hi' ? "अध्ययन संवाद रिकॉर्ड (चैट इतिहास)" : "Conversational Study Transcripts"}
                  </h3>
                </div>

                <p className="text-xs text-gray-500 pl-1 leading-normal">
                  {lang === 'hi' 
                    ? "यह उस प्रश्नोत्तरी सत्र का चैट इतिहास रिकॉर्ड है। स्वामी एआई के प्रश्नों, अपने उत्तरों और शैक्षिक व्याख्याओं की समीक्षा के लिए नीचे स्क्रॉल करें।"
                    : "This is the full dialogue archive from your certified learning quiz. Scroll down to review Swami AI's questions, your submitted choices, and targeted learning insights."}
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-3 bg-white rounded-2xl border border-gray-150 shadow-inner">
                  {selectedCert.chatLogs.map((log, logIdx) => {
                    const isCorrect = log.selectedAnswerIndex === log.correctAnswerIndex;
                    
                    return (
                      <div key={logIdx} className="space-y-3.5 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] font-extrabold text-indigo-500 uppercase tracking-wider bg-indigo-50/50 p-1 px-2.5 rounded-lg w-max">
                          Question {logIdx + 1}
                        </div>

                        {/* Swami AI Asks the Question (Chat Bubble) */}
                        <div className="flex items-start gap-2.5 max-w-[92%]">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-xs shrink-0 shadow-3xs">
                            🤖
                          </div>
                          <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-2xl rounded-tl-xs shadow-3xs">
                            <span className="block text-[9px] font-mono font-bold text-amber-800 mb-0.5">🤖 SWAMI AI TUTOR</span>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-relaxed font-sans">
                              {log.question}
                            </p>
                          </div>
                        </div>

                        {/* Options presented */}
                        <div className="pl-9.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                          {log.options.map((opt, oIdx) => {
                            const isSelected = oIdx === log.selectedAnswerIndex;
                            const isCorrectAns = oIdx === log.correctAnswerIndex;
                            
                            let borderClass = 'border-gray-200 bg-gray-50/30 text-gray-600';
                            if (isSelected) {
                              borderClass = isCorrect ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-rose-500 bg-rose-50/50 text-rose-800';
                            } else if (isCorrectAns) {
                              borderClass = 'border-emerald-500/60 bg-emerald-50/20 text-emerald-700';
                            }
                            
                            return (
                              <div key={oIdx} className={`p-2 px-3 rounded-xl border text-xs font-medium font-sans ${borderClass}`}>
                                <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                                {isSelected && (
                                  <span className="block text-[8px] font-mono font-black mt-0.5 uppercase tracking-widest">
                                    {isCorrect ? '✅ Your Choice (Correct)' : '❌ Your Choice (Incorrect)'}
                                  </span>
                                )}
                                {!isSelected && isCorrectAns && (
                                  <span className="block text-[8px] font-mono font-black mt-0.5 uppercase tracking-widest text-emerald-600">
                                    ✓ Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* User Replies / Choice Bubble */}
                        <div className="flex items-start gap-2.5 max-w-[92%] ml-auto justify-end">
                          <div className={`p-3 rounded-2xl rounded-tr-xs shadow-3xs text-right ${
                            isCorrect 
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-950' 
                              : 'bg-rose-50 border border-rose-100 text-rose-950'
                          }`}>
                            <span className="block text-[9px] font-mono font-black text-gray-400 mb-0.5">👤 MY SUBMISSION</span>
                            <p className="text-xs sm:text-sm font-bold font-sans">
                              {log.selectedAnswerIndex === -1 
                                ? (lang === 'hi' ? "समय समाप्त (कोई उत्तर नहीं)" : "Timeout / Unanswered")
                                : log.options[log.selectedAnswerIndex]}
                            </p>
                          </div>
                          <div className="h-7 w-7 rounded-full bg-[#3D405B] text-white flex items-center justify-center text-xs shrink-0 shadow-3xs">
                            👤
                          </div>
                        </div>

                        {/* Swami AI Explains the Concept (Chat Bubble) */}
                        <div className="flex items-start gap-2.5 max-w-[92%] pl-1">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-xs shrink-0 shadow-3xs">
                            🤖
                          </div>
                          <div className="bg-indigo-50/30 border border-indigo-100/50 p-3.5 rounded-2xl rounded-tl-xs shadow-3xs">
                            <span className="block text-[9px] font-mono font-black text-indigo-600 mb-1 uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> Learning Concept Breakdown & Explanation
                            </span>
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans font-medium">
                              {log.explanation}
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
