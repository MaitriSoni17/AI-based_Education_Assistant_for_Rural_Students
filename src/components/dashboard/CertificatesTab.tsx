import React, { useState, useEffect, useMemo } from 'react';
import { LanguageCode, User as StudentUser } from '../../types';
import { speakText } from '../../utils/speech';
import { 
  Award, Sparkles, Download, Calendar, Clock, MessageSquare, 
  Trash2, User, BookOpen, Check, ArrowLeft, ChevronLeft, 
  ChevronRight, Search, Trophy, Star, Copy, CheckCircle2
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'gallery' | 'detail'>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'title'>('newest');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [tempDownloadName, setTempDownloadName] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [activeMobileDetailTab, setActiveMobileDetailTab] = useState<'preview' | 'transcript' | 'settings'>('preview');

  // Load certificates from user object and sync when active user changes
  useEffect(() => {
    const raw = user.earnedCertificates;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as EarnedCertificate[];
        setCertificates(parsed);
        if (parsed.length > 0) {
          if (selectedCert) {
            const found = parsed.find(c => c.id === selectedCert.id);
            if (found) {
              setSelectedCert(found);
              setEditingName(found.recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
            } else {
              setSelectedCert(parsed[0]);
              setEditingName(parsed[0].recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
            }
          } else {
            setSelectedCert(parsed[0]);
            setEditingName(parsed[0].recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
          }
        } else {
          setSelectedCert(null);
          setEditingName('');
          setViewMode('gallery');
        }
      } catch (err) {
        console.error("Error loading earned certificates", err);
      }
    } else {
      setCertificates([]);
      setSelectedCert(null);
      setEditingName('');
      setViewMode('gallery');
    }
  }, [user]);

  // Filtered & Sorted certificates for Gallery view
  const filteredCertificates = useMemo(() => {
    let list = [...certificates];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.quizTitle.toLowerCase().includes(q) || 
        c.recipientName?.toLowerCase().includes(q) ||
        c.date?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest') {
      // Keep natural order (newest first)
    } else if (sortBy === 'score') {
      list.sort((a, b) => {
        const accA = a.score / (a.totalQuestions || 1);
        const accB = b.score / (b.totalQuestions || 1);
        return accB - accA;
      });
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.quizTitle.localeCompare(b.quizTitle));
    }
    return list;
  }, [certificates, searchQuery, sortBy]);

  // Overall Statistics
  const totalCerts = certificates.length;
  const avgAccuracy = useMemo(() => {
    if (certificates.length === 0) return 0;
    const totalAcc = certificates.reduce((acc, c) => acc + (c.score / (c.totalQuestions || 1)), 0);
    return Math.round((totalAcc / certificates.length) * 100);
  }, [certificates]);

  const perfectScoresCount = useMemo(() => {
    return certificates.filter(c => c.score === c.totalQuestions && c.totalQuestions > 0).length;
  }, [certificates]);

  // Open detail view for a certificate
  const handleOpenCertificate = (cert: EarnedCertificate) => {
    setSelectedCert(cert);
    setEditingName(cert.recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
    setViewMode('detail');
    setActiveMobileDetailTab('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate between certificates in detail view
  const handlePrevCert = () => {
    if (!selectedCert || certificates.length <= 1) return;
    const currIndex = certificates.findIndex(c => c.id === selectedCert.id);
    const prevIndex = currIndex > 0 ? currIndex - 1 : certificates.length - 1;
    const nextCert = certificates[prevIndex];
    setSelectedCert(nextCert);
    setEditingName(nextCert.recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
  };

  const handleNextCert = () => {
    if (!selectedCert || certificates.length <= 1) return;
    const currIndex = certificates.findIndex(c => c.id === selectedCert.id);
    const nextIndex = currIndex < certificates.length - 1 ? currIndex + 1 : 0;
    const nextCert = certificates[nextIndex];
    setSelectedCert(nextCert);
    setEditingName(nextCert.recipientName || user.certificateName || user.name || 'GyaanBot Scholar');
  };

  // Update selected certificate name and save to Firestore
  const handleUpdateName = (newName: string) => {
    setEditingName(newName);
    if (!selectedCert) return;

    const updatedCert = { ...selectedCert, recipientName: newName };
    setSelectedCert(updatedCert);

    const updatedList = certificates.map(c => c.id === selectedCert.id ? updatedCert : c);
    setCertificates(updatedList);
    onUpdateUser({
      earnedCertificates: JSON.stringify(updatedList),
      certificateName: newName
    });
  };

  // Delete certificate from portfolio
  const handleDeleteCertificate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        setViewMode('gallery');
      }
    }

    speakText(
      lang === 'hi' ? "प्रमाण पत्र सफलतापूर्वक हटा दिया गया है।" : "Certificate deleted successfully.",
      lang,
      "Swami AI",
      "🤖 Swami AI"
    );
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Landscape high-resolution PDF generation
  const handleDownloadPDF = async (cert: EarnedCertificate, nameOverride?: string) => {
    try {
      setIsGeneratingPdf(true);
      speakText(
        lang === 'hi' ? "आपका प्रमाण पत्र पीडीएफ के रूप में तैयार किया जा रहा है..." : "Generating your certificate PDF...",
        lang,
        "Swami AI",
        "🤖 Swami AI"
      );

      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create 2D canvas context");

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // 1. Solid background (soft ivory cream)
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Background watermark
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 500px sans-serif';
      ctx.fillText('🎓', canvas.width / 2, canvas.height / 2);
      ctx.restore();

      // 3. Double luxury gold border
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 24;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

      // 4. Corner motifs
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⚜️', 90, 110);
      ctx.fillText('⚜️', canvas.width - 90, 110);
      ctx.fillText('⚜️', 90, canvas.height - 110);
      ctx.fillText('⚜️', canvas.width - 90, canvas.height - 110);

      // 5. Header
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 44px sans-serif';
      const certTitle = lang === 'hi' ? "सफलता का प्रमाण पत्र" : "CERTIFICATE OF ACHIEVEMENT";
      ctx.fillText(certTitle, canvas.width / 2, 220);

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 250, 260);
      ctx.lineTo(canvas.width / 2 + 250, 260);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 6. Subtitle
      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 22px sans-serif';
      const subtitleLabel = lang === 'hi' ? "यह प्रमाण पत्र गर्व के साथ दिया जाता है" : "PROUDLY PRESENTED TO";
      ctx.fillText(subtitleLabel, canvas.width / 2, 340);

      // 7. Student Name
      const nameText = (nameOverride || editingName).trim() || cert.recipientName || (lang === 'hi' ? "अध्ययनकर्ता" : "Acclaimed Scholar");
      ctx.fillStyle = '#111827';
      ctx.font = 'italic bold 72px Georgia, serif';
      const maxNameWidth = canvas.width - 400;
      let nameFontSize = 72;
      while (ctx.measureText(nameText).width > maxNameWidth && nameFontSize > 36) {
        nameFontSize -= 4;
        ctx.font = `italic bold ${nameFontSize}px Georgia, serif`;
      }
      ctx.fillText(nameText, canvas.width / 2, 450);

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 350, 500);
      ctx.lineTo(canvas.width / 2 + 350, 500);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 8. Body Description
      ctx.fillStyle = '#4B5563';
      ctx.font = '30px sans-serif';
      const bodyLabel = lang === 'hi' ? "जिन्होंने सफलतापूर्वक शैक्षणिक विषय प्रश्नोत्तरी उत्तीर्ण की" : "for successfully passing the academic topic quiz on";
      ctx.fillText(bodyLabel, canvas.width / 2, 590);

      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 38px Georgia, serif';
      ctx.fillText(`🎯 ${cert.quizTitle}`, canvas.width / 2, 670);

      ctx.fillStyle = '#4B5563';
      ctx.font = '30px sans-serif';
      const accuracyPct = Math.round((cert.score / cert.totalQuestions) * 100);
      const scoreLabel = lang === 'hi' ? "एक उत्कृष्ट सटीकता स्कोर के साथ:" : "with a remarkable accuracy score of";
      ctx.fillText(`${scoreLabel} ${accuracyPct}%`, canvas.width / 2, 750);
      
      ctx.font = 'italic bold 26px sans-serif';
      ctx.fillStyle = '#10B981';
      const correctLabel = lang === 'hi' ? "उत्तर सही" : "correct answers";
      ctx.fillText(`(${cert.score} / ${cert.totalQuestions} ${correctLabel})`, canvas.width / 2, 810);

      // 9. Footer
      const footerY = 1050;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 20px sans-serif';
      const dateHeader = lang === 'hi' ? "उपलब्धि की तिथि" : "Date of Achievement";
      ctx.fillText(dateHeader, 220, footerY);

      ctx.fillStyle = '#374151';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`${cert.date} - ${cert.time}`, 220, footerY + 50);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('AUTHORIZED SIGNATURE', canvas.width - 220, footerY);

      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'italic bold 36px Georgia, serif';
      ctx.fillText('✍️ Swami AI Tutor', canvas.width - 220, footerY + 45);

      ctx.beginPath();
      ctx.moveTo(canvas.width - 440, footerY + 70);
      ctx.lineTo(canvas.width - 220, footerY + 70);
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 18px sans-serif';
      const deanLabel = lang === 'hi' ? "स्वामी एआई शिक्षा निदेशक" : "Swami AI Academic Dean";
      ctx.fillText(deanLabel, canvas.width - 220, footerY + 105);

      // Seal
      const stampX = canvas.width / 2;
      const stampY = footerY + 40;

      ctx.fillStyle = '#EF4444';
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

      ctx.beginPath();
      ctx.arc(stampX, stampY, 70, 0, 2 * Math.PI);
      const sealGrad = ctx.createRadialGradient(stampX, stampY, 10, stampX, stampY, 70);
      sealGrad.addColorStop(0, '#FDE047');
      sealGrad.addColorStop(0.5, '#F59E0B');
      sealGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = sealGrad;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(stampX, stampY, 58, 0, 2 * Math.PI);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('★', stampX, stampY - 12);

      ctx.font = 'black 16px sans-serif';
      ctx.fillText('OFFICIAL', stampX, stampY + 18);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SWAMI AI', stampX, stampY + 34);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('🔒 SECURE STUDY METRICS SYNC VERIFIED', 100, canvas.height - 110);

      ctx.textAlign = 'right';
      ctx.fillText(cert.id, canvas.width - 100, canvas.height - 110);

      const imgData = canvas.toDataURL('image/png', 1.0);
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
            <div className="h-20 w-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl shadow-inner animate-bounce">
              🎓
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 rounded-full text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="font-display font-extrabold text-base sm:text-lg text-gray-900">
              {lang === 'hi' ? "अभी तक कोई प्रमाण पत्र अर्जित नहीं किया गया है" : "No Academic Credentials Yet"}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              {lang === 'hi'
                ? "स्वामी एआई के साथ किसी भी विषय पर प्रश्नोत्तरी पूरी करें और अपना पहला आधिकारिक डिजिटल प्रमाण पत्र अर्जित करें!"
                : "Complete a certified quiz with Swami AI on any subject module to unlock and frame your very first achievement certificate!"}
            </p>
          </div>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('quiz')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md hover-float cursor-pointer flex items-center gap-2"
            >
              <span>{lang === 'hi' ? "प्रश्नोत्तरी शुरू करें" : "Take a Certified Quiz"}</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      ) : viewMode === 'gallery' ? (
        /* =========================================================================
           VIEW MODE 1: MASTER CERTIFICATES GALLERY (Showcase Grid)
           ========================================================================= */
        <div className="space-y-6">
          
          {/* STATS OVERVIEW RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                  {lang === 'hi' ? "कुल प्रमाण पत्र" : "Total Earned"}
                </span>
                <span className="font-extrabold text-base sm:text-lg text-gray-900">{totalCerts}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                  {lang === 'hi' ? "औसत सटीकता" : "Avg. Accuracy"}
                </span>
                <span className="font-extrabold text-base sm:text-lg text-emerald-600">{avgAccuracy}%</span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                  {lang === 'hi' ? "100% स्कोर" : "Perfect 100%"}
                </span>
                <span className="font-extrabold text-base sm:text-lg text-indigo-600">{perfectScoresCount}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block truncate">
                  {lang === 'hi' ? "पंजीकृत नाम" : "Scholar Name"}
                </span>
                <span className="font-bold text-xs sm:text-sm text-gray-800 truncate block">
                  {user.certificateName || user.name || 'Scholar'}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH, FILTER & SORT BAR */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? "प्रमाण पत्र या विषय खोजें..." : "Search certificates by subject or title..."}
                className="w-full pl-9.5 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-gray-400 uppercase hidden sm:inline">
                {lang === 'hi' ? "क्रमबद्ध करें:" : "Sort by:"}
              </span>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold font-sans">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'newest' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {lang === 'hi' ? "नवीनतम" : "Newest"}
                </button>
                <button
                  onClick={() => setSortBy('score')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'score' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {lang === 'hi' ? "स्कोर" : "Highest Score"}
                </button>
                <button
                  onClick={() => setSortBy('title')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'title' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {lang === 'hi' ? "नाम (A-Z)" : "Title (A-Z)"}
                </button>
              </div>
            </div>
          </div>

          {/* CERTIFICATE CARDS GRID */}
          {filteredCertificates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-2">
              <p className="text-sm font-bold text-gray-700">
                {lang === 'hi' ? "कोई प्रमाण पत्र नहीं मिला" : "No certificates match your search query."}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
              >
                {lang === 'hi' ? "फ़िल्टर साफ़ करें" : "Clear search filter"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCertificates.map((cert) => {
                const accuracy = Math.round((cert.score / (cert.totalQuestions || 1)) * 100);
                const isPerfect = accuracy === 100;

                return (
                  <div
                    key={cert.id}
                    onClick={() => handleOpenCertificate(cert)}
                    className="group bg-white rounded-2xl border border-gray-200/90 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer relative"
                  >
                    {/* Top mini ornamental header preview */}
                    <div className="bg-gradient-to-br from-[#2C211A] via-[#3a2c22] to-[#201813] p-4 text-white relative overflow-hidden">
                      {/* Gold border accent */}
                      <div className="absolute inset-1.5 border border-[#C5A880]/60 rounded-lg pointer-events-none" />
                      
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono tracking-widest text-amber-300/90 uppercase font-bold">
                          ★ {lang === 'hi' ? "आधिकारिक प्रमाण पत्र" : "OFFICIAL CREDENTIAL"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black flex items-center gap-1 ${
                          isPerfect 
                            ? 'bg-amber-400 text-amber-950 shadow-xs' 
                            : accuracy >= 80 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-indigo-500 text-white'
                        }`}>
                          {isPerfect ? '👑 100%' : `${accuracy}%`}
                        </span>
                      </div>

                      {/* Recipient Scholar on certificate card */}
                      <div className="relative z-10 pt-3 pb-1 text-center">
                        <div className="text-[10px] text-amber-200/70 uppercase tracking-widest font-sans font-bold">
                          {lang === 'hi' ? "प्रमाणित छात्र" : "Awarded To"}
                        </div>
                        <div className="font-serif italic font-extrabold text-base text-amber-100 tracking-wide truncate max-w-xs mx-auto">
                          {cert.recipientName || user.certificateName || user.name || 'Scholar'}
                        </div>
                      </div>
                    </div>

                    {/* Card Body Information */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="font-sans font-extrabold text-sm text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                          🎓 {cert.quizTitle}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{cert.date}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-gray-700">
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>{cert.score}/{cert.totalQuestions} {lang === 'hi' ? "सही" : "Score"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCertificate(cert);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>{lang === 'hi' ? "विवरण देखें" : "View Details"}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-amber-700" />
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(cert);
                            }}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                            title={lang === 'hi' ? "डाउनलोड PDF" : "Download PDF"}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={(e) => handleDeleteCertificate(cert.id, e)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                            title={lang === 'hi' ? "प्रमाण पत्र हटाएं" : "Delete Certificate"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : selectedCert && (
        /* =========================================================================
           VIEW MODE 2: DEDICATED CERTIFICATE DETAIL VIEW (Full Inspection & Print)
           ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* NAVIGATION BAR WITH BACK BUTTON & PREV/NEXT CONTROLS */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('gallery')}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all hover-float"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{lang === 'hi' ? "सभी प्रमाण पत्रों पर वापस जाएं" : "Back to All Certificates"}</span>
              </button>

              <span className="hidden sm:inline text-xs font-mono font-bold text-gray-400">
                • {certificates.findIndex(c => c.id === selectedCert.id) + 1} / {certificates.length}
              </span>
            </div>

            {/* PREV / NEXT CERTIFICATE PAGINATION CONTROLS */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handlePrevCert}
                disabled={certificates.length <= 1}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
                title="Previous Certificate"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">{lang === 'hi' ? "पिछला" : "Prev"}</span>
              </button>

              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                {certificates.findIndex(c => c.id === selectedCert.id) + 1} / {certificates.length}
              </span>

              <button
                onClick={handleNextCert}
                disabled={certificates.length <= 1}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-bold"
                title="Next Certificate"
              >
                <span className="hidden md:inline">{lang === 'hi' ? "अगला" : "Next"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MOBILE SUB-TAB TOGGLE (Visible on small screens) */}
          <div className="block sm:hidden grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold font-sans">
            <button
              onClick={() => setActiveMobileDetailTab('preview')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMobileDetailTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              📜 {lang === 'hi' ? "प्रमाण पत्र" : "Preview"}
            </button>
            <button
              onClick={() => setActiveMobileDetailTab('settings')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMobileDetailTab === 'settings' ? 'bg-white text-stone-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              ⚙️ {lang === 'hi' ? "विवरण / नाम" : "Settings"}
            </button>
            <button
              onClick={() => setActiveMobileDetailTab('transcript')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMobileDetailTab === 'transcript' ? 'bg-white text-stone-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              💬 {lang === 'hi' ? "चैट रिकॉर्ड" : "Chat Log"}
            </button>
          </div>

          {/* PRIMARY OPTIONS / NAME CUSTOMIZATION & ACTION BAR */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
            activeMobileDetailTab === 'settings' ? 'block' : 'hidden sm:grid'
          }`}>
            
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
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 gap-2">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
                    {lang === 'hi' ? "अर्जित समय" : "Timestamp"}
                  </span>
                  <span className="font-black text-gray-750 flex items-center gap-1.5 text-right text-xs">
                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>{selectedCert.date} @ {selectedCert.time}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
                    {lang === 'hi' ? "सत्यापन कोड" : "Credential ID"}
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[200px]">
                    <span className="font-mono text-gray-500 font-bold uppercase select-all text-[10px] truncate" title={selectedCert.id}>
                      {selectedCert.id}
                    </span>
                    <button
                      onClick={() => handleCopyId(selectedCert.id)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                      title="Copy Verification ID"
                    >
                      {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTempDownloadName(editingName || selectedCert.recipientName || user.certificateName || user.name || '');
                    setShowDownloadPrompt(true);
                  }}
                  disabled={isGeneratingPdf}
                  className={`flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-3xs hover-float ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGeneratingPdf ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{lang === 'hi' ? 'तैयार हो रहा है...' : 'Generating PDF...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>{lang === 'hi' ? 'आधिकारिक PDF डाउनलोड करें' : 'Download Official PDF'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleDeleteCertificate(selectedCert.id, e)}
                  className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition-colors"
                  title="Delete Certificate"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

          {/* 3D EXHIBITION-STYLE CERTIFICATE PREVIEW MOCKUP */}
          <div className={`relative mx-auto max-w-3xl bg-stone-100 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md border border-stone-200 hover-shadow-glow duration-300 transition-all ${
            activeMobileDetailTab === 'preview' ? 'block' : 'hidden sm:block'
          }`}>
            {/* Quick Action Download Bar on Mobile Preview */}
            <div className="flex sm:hidden items-center justify-between pb-2.5">
              <span className="text-[11px] font-bold text-stone-700 truncate max-w-[200px]">
                🎓 {selectedCert.quizTitle}
              </span>
              <button
                onClick={() => {
                  setTempDownloadName(editingName || selectedCert.recipientName || user.certificateName || user.name || '');
                  setShowDownloadPrompt(true);
                }}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
            </div>

            {/* 3D Drop shadow and simulated wooden dark frame */}
            <div className="bg-[#2C211A] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border border-stone-800">
              {/* Inner gold frame highlight */}
              <div className="bg-[#FDFBF7] border-2 sm:border-4 border-[#C5A880] p-4 sm:p-8 rounded-lg relative font-serif text-center select-none overflow-hidden shadow-inner flex flex-col justify-between min-h-[350px] sm:min-h-[480px]">
                
                {/* Corner motif lines */}
                <div className="border-l-2 border-t-2 border-[#C5A880] absolute top-2 sm:top-3 left-2 sm:left-3 w-3 sm:w-5 h-3 sm:h-5 pointer-events-none" />
                <div className="border-r-2 border-t-2 border-[#C5A880] absolute top-2 sm:top-3 right-2 sm:right-3 w-3 sm:w-5 h-3 sm:h-5 pointer-events-none" />
                <div className="border-l-2 border-b-2 border-[#C5A880] absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-3 sm:w-5 h-3 sm:h-5 pointer-events-none" />
                <div className="border-r-2 border-b-2 border-[#C5A880] absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-3 sm:w-5 h-3 sm:h-5 pointer-events-none" />

                {/* Background watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.015]">
                  <span className="text-[120px] sm:text-[200px]">🎓</span>
                </div>

                {/* Title Header */}
                <div className="space-y-1 sm:space-y-2 z-10">
                  <h2 className="text-[#B45309] font-black text-[8px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] font-sans uppercase">
                    {lang === 'hi' ? "सफलता का प्रमाण पत्र" : "CERTIFICATE OF ACHIEVEMENT"}
                  </h2>
                  <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
                </div>

                {/* Presentation Line */}
                <p className="text-[7px] sm:text-[9px] text-gray-400 italic tracking-widest font-sans font-bold uppercase mt-1 sm:mt-2">
                  {lang === 'hi' ? "यह प्रमाण पत्र गर्व के साथ दिया जाता है" : "PROUDLY PRESENTED TO"}
                </p>

                {/* Recipient Scholar Name */}
                <div className="my-1 sm:my-3 z-10">
                  <h1 className="text-lg sm:text-3xl font-extrabold text-stone-900 font-serif italic text-amber-900 min-h-[30px] sm:min-h-[38px] drop-shadow-3xs break-words px-2 max-w-md mx-auto leading-tight">
                    {editingName.trim() || (lang === 'hi' ? "आपका नाम यहाँ" : "Honorary Scholar")}
                  </h1>
                  <div className="w-28 sm:w-40 h-[1px] bg-stone-200 mx-auto mt-1" />
                </div>

                {/* Subject/Topic Description */}
                <div className="space-y-0.5 sm:space-y-1 text-[9px] sm:text-xs text-stone-600 font-sans font-medium max-w-md mx-auto leading-relaxed z-10">
                  <p>
                    {lang === 'hi' ? "जिन्होंने सफलतापूर्वक शैक्षणिक विषय प्रश्नोत्तरी उत्तीर्ण की:" : "for successfully passing the academic topic quiz on"}
                  </p>
                  <p className="font-extrabold text-stone-800 text-[10px] sm:text-xs tracking-tight font-serif bg-amber-50/50 py-0.5 sm:py-1 px-2 sm:px-3 rounded-lg border border-amber-100/40 inline-block my-0.5 sm:my-1">
                    🎯 {selectedCert.quizTitle}
                  </p>
                  <p className="text-stone-500">
                    {lang === 'hi' ? "एक उत्कृष्ट सटीकता स्कोर के साथ:" : "with an accuracy score of"}{" "}
                    <span className="font-extrabold text-emerald-600">
                      {Math.round((selectedCert.score / selectedCert.totalQuestions) * 100)}%
                    </span>{" "}
                    ({selectedCert.score}/{selectedCert.totalQuestions} {lang === 'hi' ? "सही" : "correct"})
                  </p>
                </div>

                {/* Signature & Seal Row */}
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 flex justify-between items-end text-[7px] sm:text-[10px] text-stone-400 font-mono z-10">
                  
                  {/* Left: Metadata details */}
                  <div className="text-left space-y-0.5">
                    <span className="block text-[6px] sm:text-[7px] font-sans font-bold text-stone-400 uppercase tracking-wider">{lang === 'hi' ? "अधिग्रहण तिथि" : "Date"}</span>
                    <span className="block font-bold text-stone-700 text-[8px] sm:text-[10px]">{selectedCert.date}</span>
                  </div>

                  {/* Center: Wax stamp visual seal with ribbons */}
                  <div className="relative flex flex-col items-center select-none w-12 sm:w-16 h-12 sm:h-16 shrink-0 -mb-1 sm:-mb-2">
                    {/* Ribbons */}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-2 sm:w-3 h-6 sm:h-10 bg-red-600/90 rotate-[-12deg] rounded-b-md shadow-3xs" />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-2 sm:w-3 h-6 sm:h-10 bg-red-600/90 rotate-[12deg] rounded-b-md shadow-3xs" />
                    
                    {/* Gold Wax circular seal */}
                    <div className="absolute top-0 w-8 sm:w-11 h-8 sm:h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center border border-amber-100 shadow-md">
                      <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full border border-dashed border-amber-900/40 flex items-center justify-center font-bold text-amber-950 text-[9px] sm:text-[11px]">
                        ★
                      </div>
                    </div>
                  </div>

                  {/* Right: Signature details */}
                  <div className="text-right space-y-0.5">
                    <span className="block italic text-[9px] sm:text-xs text-indigo-900 font-serif font-black pr-1 select-none">✍️ Swami AI</span>
                    <div className="w-14 sm:w-20 h-[1px] bg-stone-300 ml-auto" />
                    <span className="block text-[6px] sm:text-[7px] font-sans font-bold text-stone-400 uppercase tracking-wider">Academic Dean</span>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* CHAT SESSION LOG / CONVERSATIONAL REVIEW */}
          <div className={`space-y-3.5 text-left pt-2 ${
            activeMobileDetailTab === 'transcript' ? 'block' : 'hidden sm:block'
          }`}>
            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2.5">
              <div className="p-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-500">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-[#3D405B]">
                {lang === 'hi' ? "अध्ययन संवाद रिकॉर्ड (चैट इतिहास)" : "Conversational Study Transcripts"}
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

                    {/* Swami AI Asks the Question */}
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

                    {/* Swami AI Explains the Concept */}
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

      {/* CONFIRM / EDIT NAME MODAL ON DOWNLOAD */}
      {showDownloadPrompt && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6 text-left relative overflow-hidden">
            
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

            <div className="flex items-center gap-3.5 border-b border-gray-150 pb-4">
              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-amber-600 shadow-3xs">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-gray-900">
                  {lang === 'hi' ? "प्रमाण पत्र पर मुद्रित नाम" : "Recipient Scholar Name"}
                </h3>
                <p className="text-xs text-gray-500 font-sans">
                  {lang === 'hi' 
                    ? "कृपया वह आधिकारिक नाम दर्ज करें जिसे आप अपने प्रमाण पत्र पर देखना चाहते हैं।" 
                    : "Please confirm your official scholar name to print on your PDF credential."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 font-mono flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-500" />
                {lang === 'hi' ? "छात्र / अध्ययनकर्ता का नाम" : "Full Scholar Name"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tempDownloadName}
                  onChange={(e) => setTempDownloadName(e.target.value)}
                  placeholder={lang === 'hi' ? "जैसे: राहुल कुमार" : "e.g., Jane Doe"}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-gray-50/50 font-bold text-gray-800"
                  maxLength={40}
                  autoFocus
                />
                <span className="absolute right-3.5 top-3.5 text-[9px] text-gray-400 font-mono font-bold">
                  {tempDownloadName.length}/40
                </span>
              </div>
              <p className="text-[10px] text-amber-600 leading-normal font-medium bg-amber-50/30 p-2 rounded-lg border border-amber-100/30">
                💡 {lang === 'hi' 
                  ? "यह नाम आपके आधिकारिक सफलता प्रमाण पत्र पर स्थाई रूप से मुद्रित किया जाएगा।" 
                  : "This exact name will be permanently embossed on your digital credentials PDF."}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDownloadPrompt(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs sm:text-sm rounded-xl cursor-pointer transition-all border border-gray-200/50 text-center"
              >
                {lang === 'hi' ? "रद्द करें" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!tempDownloadName.trim() || isGeneratingPdf}
                onClick={async () => {
                  const finalName = tempDownloadName.trim();
                  handleUpdateName(finalName);
                  setShowDownloadPrompt(false);
                  await handleDownloadPDF(selectedCert, finalName);
                }}
                className={`flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 shadow-md ${(!tempDownloadName.trim() || isGeneratingPdf) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download className="h-4 w-4" />
                <span>{lang === 'hi' ? "डाउनलोड करें" : "Download PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
