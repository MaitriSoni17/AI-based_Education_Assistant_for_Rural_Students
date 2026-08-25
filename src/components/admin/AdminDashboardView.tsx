import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, BookOpen, Award, Shield, BarChart3, Settings, Search, Plus, Trash2, 
  Edit, CheckCircle, XCircle, RefreshCw, FileText, Video, HelpCircle, 
  Download, ArrowUpRight, GraduationCap, Filter, Sparkles, UserCheck, UserPlus,
  Lock, Eye, EyeOff, AlertTriangle, Layers, Radio, KeyRound, Volume2, VolumeX,
  Folder, FolderPlus, FolderOpen, FilePlus, File, ChevronRight, ArrowLeft, Edit3, Upload, X, ExternalLink, Move, FolderTree,
  ChevronDown, Check, ChevronUp, MoreVertical
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { User, LanguageCode } from '../../types';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  getAllFirebaseUsers, updateUserRole, deleteFirebaseUser, setFirebaseUser, updateFirebaseUserFields, FirestoreUser,
  getAllFirebaseCertificates, issueFirebaseCertificate, updateFirebaseCertificateStatus, deleteFirebaseCertificate, FirestoreCertificate,
  getAllFirebaseCurriculumFolders, getAllFirebaseCurriculumFiles, saveFirebaseCurriculumFolder, saveFirebaseCurriculumFile,
  deleteFirebaseCurriculumFolder, deleteFirebaseCurriculumFile, getFirebaseCurriculumFileDataUrl, FirestoreCurriculumFolder, FirestoreCurriculumFile
} from '../../lib/firebase';
import { getSafeDateString } from '../../utils/dateUtils';
import { saveFileLocal, getFileLocal, deleteFileLocal } from '../../lib/indexedDbStore';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { downloadSmartReaderPdf } from '../../utils/pdfExport';
import {
  exportMasterAnalyticsExcel,
  exportCategoryExcel,
  exportMasterAnalyticsPDF,
  exportCategoryPDF,
  ExportDataPayload
} from '../../lib/exportUtils';

interface AdminDashboardViewProps {
  adminUser: User;
  lang: LanguageCode;
  onLogoutAdmin: () => void;
}

export interface CurriculumFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  description?: string;
  color?: string;
}

export interface CurriculumFile {
  id: string;
  name: string;
  folderId: string | null;
  subject: string;
  category: 'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other';
  materialType?: 'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other';
  size: string;
  uploadedAt: string;
  fileDataUrl?: string;
  externalUrl?: string;
  description?: string;
  standard?: string;
  board?: string;
  isVisible?: boolean;
}

export interface BatchFileItem {
  id: string;
  rawName: string;
  fileName: string;
  subject: string;
  category: 'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other';
  materialType?: 'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other';
  standard: string;
  board: string;
  size: string;
  description: string;
  externalUrl: string;
  dataUrl?: string;
  aiStatus: 'pending' | 'analyzing' | 'done' | 'error';
  aiError?: string;
  expanded?: boolean;
}

const STANDARD_OPTIONS = [
  'All Standards',
  'Std 1',
  'Std 2',
  'Std 3',
  'Std 4',
  'Std 5',
  'Std 6',
  'Std 7',
  'Std 8',
  'Std 9',
  'Std 10',
  'Std 11 (Science)',
  'Std 11 (Commerce)',
  'Std 11 (Arts / Humanities)',
  'Std 12 (Science)',
  'Std 12 (Commerce)',
  'Std 12 (Arts / Humanities)'
];

const INDIAN_BOARD_OPTIONS = [
  'State Board',
  'CBSE',
  'NCERT',
  'ICSE / CISCE',
  'NIOS (Open School)',
  'IB (International Baccalaureate)',
  'IGCSE / Cambridge',
  'UP Board (UPMSP)',
  'Bihar Board (BSEB)',
  'Maharashtra Board (MSBSHSE)',
  'Rajasthan Board (RBSE)',
  'MP Board (MPBSE)',
  'West Bengal Board (WBBSE/WBCHSE)',
  'Tamil Nadu Board',
  'Karnataka Board (KSEEB)',
  'Gujarat Board (GSEB)',
  'Andhra Pradesh Board (BIEAP)',
  'Telangana Board (BIETS)',
  'Kerala Board (DHSE)',
  'Punjab Board (PSEB)',
  'Haryana Board (BSEH)',
  'Odisha Board (CHSE)',
  'Assam Board (AHSEC)',
  'Other State / Open Board'
];

interface SelectOptionItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const AdminCustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOptionItem)[];
  placeholder?: string;
  searchable?: boolean;
  dark?: boolean;
  className?: string;
  buttonClassName?: string;
}> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchable = false,
  dark = false,
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOptionItem[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const filteredOptions = searchable
    ? normalizedOptions.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          (dark
            ? 'w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-bold text-amber-400 hover:border-amber-500/50 transition-all cursor-pointer shadow-3xs'
            : 'w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-3xs')
        }
      >
        <span className="truncate flex items-center gap-1.5 mr-2">
          {selectedOption?.icon}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            dark ? 'text-amber-400/70' : 'text-slate-400'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-2xl p-1.5 shadow-xl border ${
              dark
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200/90 text-slate-800'
            }`}
          >
            {searchable && (
              <div className="p-1 border-b border-slate-100 dark:border-slate-800 mb-1 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? dark
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'bg-amber-500/10 text-amber-900 font-bold'
                        : dark
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5 mr-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          dark ? 'text-amber-400' : 'text-amber-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface IssuedCertificate {
  id: string;
  studentName: string;
  studentMobile: string;
  title: string;
  date: string;
  score: number;
  status: 'valid' | 'revoked';
}

const DEMO_CERTIFICATES: IssuedCertificate[] = [
  { id: 'CERT-2026-8819', studentName: 'Aarav Patel', studentMobile: '9876543210', title: 'Mastery in Mathematics & Algebra', date: '2026-08-01', score: 95, status: 'valid' },
  { id: 'CERT-2026-4421', studentName: 'Priya Sharma', studentMobile: '9812345678', title: 'General Science Excellence Award', date: '2026-08-03', score: 90, status: 'valid' },
  { id: 'CERT-2026-1092', studentName: 'Rahul Verma', studentMobile: '9765432109', title: 'Mascot Learning Path Completion', date: '2026-07-28', score: 88, status: 'valid' },
  { id: 'CERT-2026-7734', studentName: 'Kavya Singh', studentMobile: '9654321098', title: 'Rural Science Quiz Champion', date: '2026-08-05', score: 100, status: 'valid' },
];

const ADMIN_DASHBOARD_TRANSLATIONS = {
  en: {
    dashboardTitle: "Gramin Shiksha Admin Dashboard",
    superAdminBadge: "SUPER ADMIN",
    loggedInAs: "Logged in as",
    stateOps: "State Curriculum Operations",
    downloadAnalytics: "Download Analytics",
    syncLiveData: "Sync Live Data",
    exitAdmin: "Exit Admin Console",
    currentModule: "Current:",
    adminModulesCount: "Admin Modules",
    navAnalytics: "Student Analytics",
    navContent: "Curriculum & Content",
    navCertificates: "Certificates Registry",
    navUsers: "User Role Management",
    navSettings: "Platform Config",
    analyticsTitle: "Master Analytics & Student Progress",
    analyticsSubtitle: "Filter platform datasets by academic period, then export executive PDF or Excel (.xlsx) reports.",
    filterRange: "Filter Period:",
    allTime: "All Time",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    year: "Year",
    month: "Month",
    pdfReport: "PDF Report",
    excelExport: "Excel (.xlsx)",
    allFormats: "All Export Formats",
    totalStudents: "Total Registered Students",
    activeTeachers: "Active Teachers",
    registeredSchools: "Schools & Villages",
    lessonsCompleted: "Study Hours Completed",
    certsIssued: "Certificates Issued",
    totalXP: "Total Gamified Points",
    standardBreakdown: "Standard-wise Engagement",
    boardBreakdown: "Board Distribution",
    topVillages: "Top Performing Villages / Schools",
    exportReport: "Export Comprehensive Report",
    repositoryTitle: "State Learning Content Repository",
    createFolder: "Create New Folder",
    uploadFile: "Upload Learning Material",
    batchAi: "Batch AI Generator",
    rootFolder: "Root Directory",
    searchContent: "Search learning materials, notes, PDFs...",
    filterCategory: "All Categories",
    filterStandard: "Filter Grade / Standard",
    filterBoard: "Filter Educational Board",
    emptyFolders: "No folders created yet.",
    emptyFiles: "No curriculum files found in this directory.",
    previewPdf: "Interactive Reader & AI Solver",
    editFile: "Edit Details",
    deleteFile: "Delete",
    downloadFile: "Download",
    visibleLabel: "Public to Students",
    hiddenLabel: "Hidden (Draft)",
    certTitle: "Official Certificate Issuance & Validation",
    issueCertBtn: "Issue New Certificate",
    studentName: "Recipient Full Name",
    mobileNumber: "Mobile Number",
    schoolVillage: "School / Village",
    standardLabel: "Grade / Standard",
    titleLabel: "Achievement Title / Subject",
    issueDate: "Issue Date",
    statusActive: "Active & Verified",
    statusRevoked: "Revoked",
    revokeBtn: "Revoke",
    activateBtn: "Re-activate",
    deleteCertBtn: "Delete Record",
    searchCerts: "Search certificates by name, ID, or mobile...",
    userTitle: "User Role & Access Control Center",
    addUserBtn: "Register New User / Staff",
    searchUsers: "Search users by name, mobile, village, school...",
    roleAll: "All Roles",
    roleStudent: "Students",
    roleTeacher: "Teachers",
    roleAdmin: "Administrators",
    userNameCol: "User Profile",
    userMobileCol: "Mobile / Role",
    userLocCol: "Village / School",
    userGradeCol: "Grade",
    userStreakCol: "Streak & Points",
    userStudyCol: "Study Mins",
    actionsCol: "Actions",
    promoteTeacher: "Set Teacher Role",
    promoteStudent: "Set Student Role",
    promoteAdmin: "Set Admin Role",
    deleteUser: "Delete User",
    settingsTitle: "Administrator Settings & Security Configuration",
    changePinTitle: "Security PIN & Access Code",
    currentPin: "Current Security PIN",
    newPin: "New 6-Digit Admin PIN",
    confirmPin: "Confirm New PIN",
    savePinBtn: "Update Security PIN",
    platformDefaults: "System Platform Defaults",
    defaultLang: "Default Platform Language",
    storageCache: "Local Cache & Offline Storage",
    clearCache: "Clear Local Storage Cache",
    emergencyReset: "System Diagnostic Reset",

    // Added Missing Translations
    matchedCount: "Matched:",
    studentsCount: "Students",
    certsCount: "Certs",
    thisMonthTrend: "+12% this month",
    totalMinutesText: "total minutes",
    xpAwardedText: "XP Awarded",
    ruralHubTitle: "Rural Village Hub Activity",
    liveFirestoreBadge: "Live Firestore DB Data",
    engagementText: "engagement",
    topPerformersTitle: "Top Student Performers",
    xpAndStreaks: "XP & Streaks",
    dayStreakText: "day streak",
    minsText: "mins",

    searchLibraryPlaceholder: "Search in library...",
    allTypes: "All Types",
    pdfNotes: "PDF Notes",
    videosCategory: "Videos",
    audioCategory: "Audio",
    quizzesCategory: "Quizzes",
    documentsCategory: "Documents",
    filesAndDocs: "Files & Documents",
    colFileName: "File Name & Info",
    colSubject: "Subject",
    colSize: "Size",
    colUploaded: "Uploaded",
    colStatus: "Status",
    colActions: "Actions",
    statusVisible: "Visible",
    statusHidden: "Hidden",
    btnView: "View",
    btnOptions: "Options",

    verifyCertTitle: "Official Certificate Issuance & Validation",
    verifyPlaceholder: "Enter Certificate Code (e.g. CERT-2026-8819) or Student Mobile...",
    verifyBtn: "Verify",
    colCertId: "Cert ID",
    colStudent: "Student",
    colAchievement: "Achievement Title",
    colDate: "Date",
    reactivateBtn: "Reactivate",

    userSubtitle: "Manage accounts, assign Administrator privileges, edit student profiles, and maintain data hygiene.",
    userSearchPlaceholder: "Search by name, mobile, village, or school...",
    colUser: "Student / User",
    colMobile: "Mobile",
    colLocation: "Village / School",
    colRole: "Role",
    colActivity: "Activity",
    colRoleActions: "Role Actions",
    makeAdmin: "Make Admin",
    makeStudent: "Make Student",
    regPrefix: "Reg:",

    lowBandwidthTitle: "2G / Low-Bandwidth Mode",
    lowBandwidthSub: "Compresses payload size for rural cellular networks",
    lowBandwidthDesc: "Compresses payload size for rural cellular networks",
    aiRateLimitTitle: "AI Tutor Query Rate Limiting",
    securityPinSub: "Update security passcode for logged-in Administrator",
    currentPinLabel: "Current Password / 6-Digit PIN *",
    newPinLabel: "New Password / 6-Digit PIN *",
    confirmPinLabel: "Confirm New Password / PIN *",
    currentPinPlaceholder: "Enter current 6-digit PIN or password",
    newPinPlaceholder: "Enter new 6-digit PIN or password",
    confirmPinPlaceholder: "Confirm new 6-digit PIN or password",
    savePasswordBtn: "Save New Password",
    updatingPinBtn: "Updating Security PIN..."
  },
  hi: {
    dashboardTitle: "ग्रामीण शिक्षा एडमिन डैशबोर्ड",
    superAdminBadge: "सुपर एडमिन",
    loggedInAs: "लॉग इन हैं:",
    stateOps: "राज्य पाठ्यक्रम संचालन",
    downloadAnalytics: "विश्लेषण डाउनलोड करें",
    syncLiveData: "लाइव डेटा सिंक करें",
    exitAdmin: "एडमिन कंसोल से बाहर निकलें",
    currentModule: "वर्तमान:",
    adminModulesCount: "एडमिन मॉड्यूल",
    navAnalytics: "छात्र विश्लेषण",
    navContent: "पाठ्यक्रम एवं सामग्री",
    navCertificates: "प्रमाणपत्र रजिस्टर",
    navUsers: "उपयोगकर्ता भूमिका प्रबंधन",
    navSettings: "प्लेटफ़ॉर्म सेटिंग्स",
    analyticsTitle: "मास्टर विश्लेषण एवं छात्र प्रगति",
    analyticsSubtitle: "शैक्षणिक अवधि के आधार पर प्लेटफ़ॉर्म डेटासेट फ़िल्टर करें और PDF या Excel (.xlsx) रिपोर्ट निर्यात करें।",
    filterRange: "फ़िल्टर अवधि:",
    allTime: "सभी समय",
    today: "आज",
    thisWeek: "इस सप्ताह",
    thisMonth: "इस महीने",
    year: "वर्ष",
    month: "माह",
    pdfReport: "PDF रिपोर्ट",
    excelExport: "Excel (.xlsx)",
    allFormats: "सभी निर्यात प्रारूप",
    totalStudents: "कुल पंजीकृत छात्र",
    activeTeachers: "सक्रिय शिक्षक",
    registeredSchools: "स्कूल एवं गाँव",
    lessonsCompleted: "अध्ययन के घंटे",
    certsIssued: "जारी किए गए प्रमाणपत्र",
    totalXP: "कुल गेमिफाइड अंक",
    standardBreakdown: "कक्षा-वार जुड़ाव",
    boardBreakdown: "बोर्ड वितरण",
    topVillages: "शीर्ष प्रदर्शन करने वाले गाँव / स्कूल",
    exportReport: "विस्तृत रिपोर्ट निर्यात करें",
    repositoryTitle: "राज्य शिक्षण सामग्री रिपोजिटरी",
    createFolder: "नया फ़ोल्डर बनाएँ",
    uploadFile: "शिक्षण सामग्री अपलोड करें",
    batchAi: "बैच AI जनरेटर",
    rootFolder: "मूल निर्देशिका",
    searchContent: "सामग्री, नोट्स, PDF खोजें...",
    filterCategory: "सभी श्रेणियाँ",
    filterStandard: "कक्षा फ़िल्टर करें",
    filterBoard: "शिक्षा बोर्ड फ़िल्टर करें",
    emptyFolders: "अभी तक कोई फ़ोल्डर नहीं बनाया गया है।",
    emptyFiles: "इस निर्देशिका में कोई सामग्री नहीं मिली।",
    previewPdf: "इंटरएक्टिव रीडर एवं AI समाधानकर्ता",
    editFile: "विवरण संपादित करें",
    deleteFile: "हटाएं",
    downloadFile: "डाउनलोड करें",
    visibleLabel: "छात्रों के लिए दृश्यमान",
    hiddenLabel: "छिपा हुआ (ड्राफ्ट)",
    certTitle: "आधिकारिक प्रमाणपत्र जारी करना एवं सत्यापन",
    issueCertBtn: "नया प्रमाणपत्र जारी करें",
    studentName: "प्राप्तकर्ता का पूरा नाम",
    mobileNumber: "मोबाइल नंबर",
    schoolVillage: "स्कूल / गाँव",
    standardLabel: "कक्षा / ग्रेड",
    titleLabel: "उपलब्धि शीर्षक / विषय",
    issueDate: "जारी करने की तिथि",
    statusActive: "सक्रिय एवं सत्यापित",
    statusRevoked: "रद्द किया गया",
    revokeBtn: "रद्द करें",
    activateBtn: "पुनः सक्रिय करें",
    deleteCertBtn: "रिकॉर्ड हटाएं",
    searchCerts: "नाम, आईडी या मोबाइल द्वारा प्रमाणपत्र खोजें...",
    userTitle: "उपयोगकर्ता भूमिका एवं पहुंच नियंत्रण केंद्र",
    addUserBtn: "नया उपयोगकर्ता / कर्मचारी पंजीकृत करें",
    searchUsers: "नाम, मोबाइल, गाँव या स्कूल द्वारा उपयोगकर्ता खोजें...",
    roleAll: "सभी भूमिकाएँ",
    roleStudent: "छात्र",
    roleTeacher: "शिक्षक",
    roleAdmin: "प्रशासक",
    userNameCol: "उपयोगकर्ता प्रोफाइल",
    userMobileCol: "मोबाइल / भूमिका",
    userLocCol: "गाँव / स्कूल",
    userGradeCol: "कक्षा",
    userStreakCol: "स्ट्रीक एवं अंक",
    userStudyCol: "अध्ययन मिनट",
    actionsCol: "कार्रवाई",
    promoteTeacher: "शिक्षक भूमिका बनाएं",
    promoteStudent: "छात्र भूमिका बनाएं",
    promoteAdmin: "एडमिन भूमिका बनाएं",
    deleteUser: "उपयोगकर्ता हटाएं",
    settingsTitle: "प्रशासक सेटिंग्स एवं सुरक्षा कॉन्फ़िगरेशन",
    changePinTitle: "सुरक्षा पिन एवं एक्सेस कोड",
    currentPin: "वर्तमान सुरक्षा पिन",
    newPin: "नया 6-अंकों का एडमिन पिन",
    confirmPin: "नए पिन की पुष्टि करें",
    savePinBtn: "सुरक्षा पिन अपडेट करें",
    platformDefaults: "सिस्टम प्लेटफ़ॉर्म डिफ़ॉल्ट",
    defaultLang: "डिफ़ॉल्ट भाषा",
    storageCache: "लोकल कैश एवं ऑफ़लाइन स्टोरेज",
    clearCache: "लोकल कैश साफ़ करें",
    emergencyReset: "सिस्टम डायग्नोस्टिक रीसेट",

    // Added Missing Translations
    matchedCount: "मैच हुए:",
    studentsCount: "छात्र",
    certsCount: "प्रमाणपत्र",
    thisMonthTrend: "+12% इस महीने",
    totalMinutesText: "कुल मिनट",
    xpAwardedText: "XP प्रदान किए गए",
    ruralHubTitle: "ग्रामीण ग्राम हब गतिविधि",
    liveFirestoreBadge: "लाइव फ़ायरस्टोर डेटा",
    engagementText: "संबद्धता",
    topPerformersTitle: "शीर्ष प्रदर्शनकारी छात्र",
    xpAndStreaks: "XP एवं निरंतरता",
    dayStreakText: "दिनों की निरंतरता",
    minsText: "मिनट",

    searchLibraryPlaceholder: "लाइब्रेरी में खोजें...",
    allTypes: "सभी प्रकार",
    pdfNotes: "PDF नोट्स",
    videosCategory: "वीडियो",
    audioCategory: "ऑडियो",
    quizzesCategory: "क्विज़",
    documentsCategory: "दस्तावेज़",
    filesAndDocs: "फ़ाइलें एवं दस्तावेज़",
    colFileName: "फ़ाइल नाम एवं जानकारी",
    colSubject: "विषय",
    colSize: "आकार",
    colUploaded: "अपलोड तिथि",
    colStatus: "स्थिति",
    colActions: "कार्रवाई",
    statusVisible: "दृश्यमान",
    statusHidden: "छिपा हुआ",
    btnView: "देखें",
    btnOptions: "विकल्प",

    verifyCertTitle: "आधिकारिक प्रमाणपत्र जारी करना एवं सत्यापन",
    verifyPlaceholder: "प्रमाणपत्र कोड (उदा. CERT-2026-8819) या छात्र मोबाइल दर्ज करें...",
    verifyBtn: "सत्यापित करें",
    colCertId: "प्रमाणपत्र ID",
    colStudent: "छात्र",
    colAchievement: "उपलब्धि शीर्षक",
    colDate: "तिथि",
    reactivateBtn: "पुनः सक्रिय करें",

    userSubtitle: "खातों का प्रबंधन करें, प्रशासक विशेषाधिकार दें और छात्र प्रोफाइल संपादित करें।",
    userSearchPlaceholder: "नाम, मोबाइल, गाँव या स्कूल से खोजें...",
    colUser: "छात्र / उपयोगकर्ता",
    colMobile: "मोबाइल",
    colLocation: "गाँव / स्कूल",
    colRole: "भूमिका",
    colActivity: "गतिविधि",
    colRoleActions: "भूमिका कार्रवाई",
    makeAdmin: "एडमिन बनाएं",
    makeStudent: "छात्र बनाएं",
    regPrefix: "पंजीकरण:",

    lowBandwidthTitle: "2जी / कम बैंडविड्थ मोड",
    lowBandwidthSub: "ग्रामीण नेटवर्क के लिए पेलोड आकार को संकुचित करता है",
    aiRateLimitTitle: "AI ट्यूटर प्रश्न दर सीमा",
    securityPinSub: "लॉग इन प्रशासक के लिए सुरक्षा पासकोड अपडेट करें",
    currentPinLabel: "वर्तमान पासवर्ड / 6-अंकीय पिन *",
    newPinLabel: "नया पासवर्ड / 6-अंकीय पिन *",
    confirmPinLabel: "नए पासवर्ड / पिन की पुष्टि करें *",
    currentPinPlaceholder: "वर्तमान 6-अंकीय पिन या पासवर्ड दर्ज करें",
    newPinPlaceholder: "नया 6-अंकीय पिन या पासवर्ड दर्ज करें",
    confirmPinPlaceholder: "नए 6-अंकीय पिन या पासवर्ड की पुष्टि करें",
    savePasswordBtn: "नया पासवर्ड सहेजें"
  },
  gu: {
    dashboardTitle: "ગ્રામીણ શિક્ષણ એડમિન ડેશબોર્ડ",
    superAdminBadge: "સુપર એડમિન",
    loggedInAs: "લૉગ ઇન છો:",
    stateOps: "રાજ્ય અભ્યાસક્રમ સંચાલન",
    downloadAnalytics: "વિશ્લેષણ ડાઉનલોડ કરો",
    syncLiveData: "લાઈવ ડેટા સિંક કરો",
    exitAdmin: "એડમિન કન્સોલમાંથી બહાર નીકળો",
    currentModule: "વર્તમાન:",
    adminModulesCount: "એડમિન મોડ્યુલ્સ",
    navAnalytics: "વિદ્યાર્થી વિશ્લેષણ",
    navContent: "અભ્યાસક્રમ અને સામગ્રી",
    navCertificates: "પ્રમાણપત્ર રજિસ્ટર",
    navUsers: "વપરાશકર્તા ભૂમિકા સંચાલન",
    navSettings: "પ્લેટફોર્મ સેટિંગ્સ",
    analyticsTitle: "માસ્ટર વિશ્લેષણ અને વિદ્યાર્થી પ્રગતિ",
    analyticsSubtitle: "અભ્યાસકાળના આધારે ડેટાસેટ ફિલ્ટર કરો અને PDF અથવા Excel (.xlsx) અહેવાલ નિકાસ કરો.",
    filterRange: "ફિલ્ટર સમયગાળો:",
    allTime: "તમામ સમય",
    today: "આજે",
    thisWeek: "આ અઠવાડિયે",
    thisMonth: "આ મહિને",
    year: "વર્ષ",
    month: "મહિનો",
    pdfReport: "PDF અહેવાલ",
    excelExport: "Excel (.xlsx)",
    allFormats: "તમામ ફોર્મેટ નિકાસ",
    totalStudents: "કુલ નોંધાયેલા વિદ્યાર્થીઓ",
    activeTeachers: "સક્રિય શિક્ષકો",
    registeredSchools: "શાળાઓ અને ગામો",
    lessonsCompleted: "અભ્યાસના કલાકો",
    certsIssued: "ઇશ્યૂ કરેલા પ્રમાણપત્રો",
    totalXP: "કુલ ગેમિફાઇડ પોઇન્ટ્સ",
    standardBreakdown: "ધોરણ-વાર જોડાણ",
    boardBreakdown: "બોર્ડ વિતરણ",
    topVillages: "શ્રેષ્ઠ પ્રદર્શન કરતા ગામો / શાળાઓ",
    exportReport: "વિગતવાર અહેવાલ નિકાસ કરો",
    repositoryTitle: "રાજ્ય શિક્ષણ સામગ્રી રિપોઝિટરી",
    createFolder: "નવું ફોલ્ડર બનાવો",
    uploadFile: "શિક્ષણ સામગ્રી અપલોડ કરો",
    batchAi: "બેચ AI જનરેટર",
    rootFolder: "મૂળ ડિરેક્ટરી",
    searchContent: "સામગ્રી, નોટ્સ, PDF શોધો...",
    filterCategory: "તમામ કેટેગરીઝ",
    filterStandard: "ધોરણ ફિલ્ટર કરો",
    filterBoard: "શિક્ષણ બોર્ડ ફિલ્ટર કરો",
    emptyFolders: "હજુ સુધી કોઈ ફોલ્ડર બનાવવામાં આવ્યું નથી.",
    emptyFiles: "આ ડિરેક્ટરીમાં કોઈ સામગ્રી મળી નથી.",
    previewPdf: "ઈન્ટરેક્ટિવ રીડર અને AI સોલ્વર",
    editFile: "વિગતો સંપાદિત કરો",
    deleteFile: "કાઢી નાખો",
    downloadFile: "ડાઉનલોડ કરો",
    visibleLabel: "વિદ્યાર્થીઓ માટે દૃશ્યમાન",
    hiddenLabel: "છુપાયેલ (ડ્રાફ્ટ)",
    certTitle: "સત્તાવાર પ્રમાણપત્ર ઇશ્યુ અને ચકાસણી",
    issueCertBtn: "નવું પ્રમાણપત્ર ઇશ્યૂ કરો",
    studentName: "મેળવનારનું પૂરું નામ",
    mobileNumber: "મોબાઈલ નંબર",
    schoolVillage: "શાળા / ગામ",
    standardLabel: "ધોરણ / ગ્રેડ",
    titleLabel: "સિદ્ધિ શીર્ષક / વિષય",
    issueDate: "ઇશ્યૂ કર્યાની તારીખ",
    statusActive: "સક્રિય અને ચકાસાયેલ",
    statusRevoked: "રદ કરેલ",
    revokeBtn: "રદ કરો",
    activateBtn: "પુનઃ સક્રિય કરો",
    deleteCertBtn: "રેકોર્ડ કાઢી નાખો",
    searchCerts: "નામ, આઈડી અથવા મોબાઈલ દ્વારા પ્રમાણપત્ર શોધો...",
    userTitle: "વપરાશકર્તા ભૂમિકા અને એક્સેસ નિયંત્રણ કેન્દ્ર",
    addUserBtn: "નવા વપરાશકર્તા / સ્ટાફની નોંધણી કરો",
    searchUsers: "નામ, મોબાઈલ, ગામ અથવા શાળા દ્વારા વપરાશકર્તા શોધો...",
    roleAll: "તમામ ભૂમિકાઓ",
    roleStudent: "વિદ્યાર્થી",
    roleTeacher: "શિક્ષક",
    roleAdmin: "એડમિનિસ્ટ્રેટર",
    userNameCol: "વપરાશકર્તા પ્રોફાઇલ",
    userMobileCol: "મોબાઈલ / ભૂમિકા",
    userLocCol: "ગામ / શાળા",
    userGradeCol: "ધોરણ",
    userStreakCol: "સ્ટ્રીક અને પોઇન્ટ્સ",
    userStudyCol: "અભ્યાસ મિનિટ",
    actionsCol: "ક્રિયાઓ",
    promoteTeacher: "શિક્ષક ભૂમિકા બનાવો",
    promoteStudent: "વિદ્યાર્થી ભૂમિકા બનાવો",
    promoteAdmin: "એડમિન ભૂમિકા બનાવો",
    deleteUser: "વપરાશકર્તા કાઢી નાખો",
    settingsTitle: "એડમિનિસ્ટ્રેટર સેટિંગ્સ અને સુરક્ષા કોન્ફિગરેશન",
    changePinTitle: "સુરક્ષા પિન અને એક્સેસ કોડ",
    currentPin: "વર્તમાન સુરક્ષા પિન",
    newPin: "નવો 6-અંકનો એડમિન પિન",
    confirmPin: "નવા પિનની પુષ્ટિ કરો",
    savePinBtn: "સુરક્ષા પિન અપડેટ કરો",
    platformDefaults: "સિસ્ટમ પ્લેટફોર્મ ડિફોલ્ટ્સ",
    defaultLang: "ડિફોલ્ટ ભાષા",
    storageCache: "લોકલ કેશ અને ઑફલાઇન સ્ટોરેજ",
    clearCache: "લોકલ કેશ સાફ કરો",
    emergencyReset: "સિસ્ટમ ડાયગ્નોસ્ટિક રિસેટ",

    // Added Missing Translations
    matchedCount: "મેળ ખાતા:",
    studentsCount: "વિદ્યાર્થીઓ",
    certsCount: "પ્રમાણપત્રો",
    thisMonthTrend: "+12% આ મહિને",
    totalMinutesText: "કુલ મિનિટ",
    xpAwardedText: "XP એનાયત કરાયા",
    ruralHubTitle: "ગ્રામીણ હબ પ્રવૃત્તિ",
    liveFirestoreBadge: "લાઇવ ડેટાબેઝ ડેટા",
    engagementText: "જોડાણ",
    topPerformersTitle: "ટોચના વિદ્યાર્થીઓ",
    xpAndStreaks: "XP અને શ્રેણી",
    dayStreakText: "દિવસોની શ્રેણી",
    minsText: "મિનિટ",

    searchLibraryPlaceholder: "લાઇબ્રેરીમાં શોધો...",
    allTypes: "તમામ પ્રકારો",
    pdfNotes: "PDF નોટ્સ",
    videosCategory: "વિડિઓઝ",
    audioCategory: "ઓડિયો",
    quizzesCategory: "ક્વિઝ",
    documentsCategory: "દસ્તાવેજો",
    filesAndDocs: "ફાઇલો અને દસ્તાવેજો",
    colFileName: "ફાઇલ નામ અને માહિતી",
    colSubject: "વિષય",
    colSize: "કદ",
    colUploaded: "અપલોડ તારીખ",
    colStatus: "સ્થિતિ",
    colActions: "ક્રિયાઓ",
    statusVisible: "દ્રશ્યમાન",
    statusHidden: "છુપાયેલું",
    btnView: "જુઓ",
    btnOptions: "વિકલ્પો",

    verifyCertTitle: "સત્તાવાર પ્રમાણપત્ર ચકાસણી",
    verifyPlaceholder: "પ્રમાણપત્ર કોડ અથવા મોબાઇલ નંબર દાખલ કરો...",
    verifyBtn: "ચકાસો",
    colCertId: "પ્રમાણપત્ર ID",
    colStudent: "વિદ્યાર્થી",
    colAchievement: "સિદ્ધિ શીર્ષક",
    colDate: "તારીખ",
    reactivateBtn: "પુનઃસક્રિય કરો",

    userSubtitle: "ખાતાઓનું સંચાલન કરો અને એડમિન પરવાનગીઓ આપો.",
    userSearchPlaceholder: "નામ, મોબાઇલ અથવા ગામ દ્વારા શોધો...",
    colUser: "વિદ્યાર્થી / વપરાશકર્તા",
    colMobile: "મોબાઇલ",
    colLocation: "ગામ / શાળા",
    colRole: "ભૂમિકા",
    colActivity: "પ્રવૃત્તિ",
    colRoleActions: "ભૂમિકા ક્રિયાઓ",
    makeAdmin: "એડમિન બનાવો",
    makeStudent: "વિદ્યાર્થી બનાવો",
    regPrefix: "નોંધણી:",

    lowBandwidthTitle: "2G / લો-બેન્ડવિડ્થ મોડ",
    lowBandwidthSub: "ગ્રામીણ નેટવર્ક માટે ડેટા સાઇઝ ઘટાડે છે",
    aiRateLimitTitle: "AI શિક્ષક પ્રશ્ન મર્યાદા",
    securityPinSub: "લોગ-ઇન થયેલ એડમિન માટે પાસકોડ અપડેટ કરો",
    currentPinLabel: "વર્તમાન પાસવર્ડ / 6-અંકનો PIN *",
    newPinLabel: "નવો પાસવર્ડ / 6-અંકનો PIN *",
    confirmPinLabel: "નવા પાસવર્ડની પુષ્ટિ કરો *",
    currentPinPlaceholder: "વર્તમાન 6-અંકનો PIN દાખલ કરો",
    newPinPlaceholder: "નવો 6-અંકનો PIN દાખલ કરો",
    confirmPinPlaceholder: "નવા PIN ની પુષ્ટિ કરો",
    savePasswordBtn: "નવો પાસવર્ડ સાચવો"
  },
  mr: {
    dashboardTitle: "ग्रामीण शिक्षण ॲडमिन डॅशबोर्ड",
    superAdminBadge: "सुपर ॲडमिन",
    loggedInAs: "लॉग इन आहात:",
    stateOps: "राज्य अभ्यासक्रम कार्यप्रणाली",
    downloadAnalytics: "विश्लेषण डाउनलोड करा",
    syncLiveData: "थेट डेटा सिंक करा",
    exitAdmin: "ॲडमिन कन्सोलमधून बाहेर पडा",
    currentModule: "सध्याचे:",
    adminModulesCount: "ॲडमिन मॉड्यूल्स",
    navAnalytics: "विद्यार्थी विश्लेषण",
    navContent: "अभ्यासक्रम आणि साहित्य",
    navCertificates: "प्रमाणपत्र नोंदणी",
    navUsers: "वापरकर्ता भूमिका व्यवस्थापन",
    navSettings: "प्लॅटफॉर्म सेटिंग्ज",
    analyticsTitle: "मास्टर विश्लेषण आणि विद्यार्थी प्रगती",
    analyticsSubtitle: "शैक्षणिक कालावधीनुसार डेटासेट फिल्टर करा आणि PDF किंवा Excel (.xlsx) अहवाल निर्यात करा.",
    filterRange: "फिल्टर कालावधी:",
    allTime: "सर्व वेळ",
    today: "आज",
    thisWeek: "या आठवड्यात",
    thisMonth: "या महिन्यात",
    year: "वर्ष",
    month: "महिना",
    pdfReport: "PDF अहवाल",
    excelExport: "Excel (.xlsx)",
    allFormats: "सर्व फॉरमॅट निर्यात",
    totalStudents: "एकूण नोंदणीकृत विद्यार्थी",
    activeTeachers: "सक्रिय शिक्षक",
    registeredSchools: "शाळा आणि गावे",
    lessonsCompleted: "अभ्यासाचे तास",
    certsIssued: "जारी केलेली प्रमाणपत्रे",
    totalXP: "एकूण गॅमिफाइड गुण",
    standardBreakdown: "इयत्ता-निहाय सहभाग",
    boardBreakdown: "बोर्ड वितरण",
    topVillages: "उत्कृष्ट कामगिरी करणारी गावे / शाळा",
    exportReport: "सर्वसमावेशक अहवाल निर्यात करा",
    repositoryTitle: "राज्य शिक्षण साहित्य भांडार",
    createFolder: "नवीन फोल्डर तयार करा",
    uploadFile: "शिक्षण साहित्य अपलोड करा",
    batchAi: "बॅच AI जनरेटर",
    rootFolder: "मूळ डिरेक्टरी",
    searchContent: "साहित्य, नोट्स, PDF शोधा...",
    filterCategory: "सर्व श्रेणी",
    filterStandard: "इयत्ता फिल्टर करा",
    filterBoard: "शिक्षण मंडळ फिल्टर करा",
    emptyFolders: "अद्याप कोणतेही फोल्डर तयार केलेले नाही.",
    emptyFiles: "या डिरेक्टरीमध्ये कोणतेही साहित्य आढळले नाही.",
    previewPdf: "इंटरॲक्टिव्ह रीडर आणि AI सॉल्व्हर",
    editFile: "तपशील संपादित करा",
    deleteFile: "हटवा",
    downloadFile: "डाउनलोड करा",
    visibleLabel: "विद्यार्थ्यांसाठी दृश्यमान",
    hiddenLabel: "लपवलेले (ड्राफ्ट)",
    certTitle: "अधिकृत प्रमाणपत्र वितरण आणि पडताळणी",
    issueCertBtn: "नवीन प्रमाणपत्र द्या",
    studentName: "मिळवणाऱ्याचे पूर्ण नाव",
    mobileNumber: "मोबाईल नंबर",
    schoolVillage: "शाळा / गाव",
    standardLabel: "इयत्ता / श्रेणी",
    titleLabel: "यशोगाथा शीर्षक / विषय",
    issueDate: "वितरण तारीख",
    statusActive: "सक्रिय आणि सत्यापित",
    statusRevoked: "रद्द केले",
    revokeBtn: "रद्द करा",
    activateBtn: "पुन्हा सक्रिय करा",
    deleteCertBtn: "नोंद हटवा",
    searchCerts: "नाव, आयडी किंवा मोबाईलद्वारे प्रमाणपत्र शोधा...",
    userTitle: "वापरकर्ता भूमिका आणि प्रवेश नियंत्रण केंद्र",
    addUserBtn: "नवीन वापरकर्ता / कर्मचारी नोंदवा",
    searchUsers: "नाव, मोबाईल, गाव किंवा शाळेद्वारे वापरकर्ता शोधा...",
    roleAll: "सर्व भूमिका",
    roleStudent: "विद्यार्थी",
    roleTeacher: "शिक्षक",
    roleAdmin: "प्रशासक",
    userNameCol: "वापरकर्ता प्रोफाइल",
    userMobileCol: "मोबाईल / भूमिका",
    userLocCol: "गाव / शाळा",
    userGradeCol: "इयत्ता",
    userStreakCol: "स्ट्रीक आणि गुण",
    userStudyCol: "अभ्यास मिनिटे",
    actionsCol: "कृती",
    promoteTeacher: "शिक्षक भूमिका द्या",
    promoteStudent: "विद्यार्थी भूमिका द्या",
    promoteAdmin: "ॲडमिन भूमिका द्या",
    deleteUser: "वापरकर्ता हटवा",
    settingsTitle: "प्रशासक सेटिंग्ज आणि सुरक्षा कॉन्फिगरेशन",
    changePinTitle: "सुरक्षा पिन आणि ॲक्सेस कोड",
    currentPin: "सध्याचा सुरक्षा पिन",
    newPin: "नवीन 6-अंकी ॲडमिन पिन",
    confirmPin: "नवीन पिनची पुष्टी करा",
    savePinBtn: "सुरक्षा पिन अपडेट करा",
    platformDefaults: "सिस्टम प्लॅटफॉर्म डीफॉल्ट",
    defaultLang: "डीफॉल्ट भाषा",
    storageCache: "लोकल कॅश आणि ऑफलाईन स्टोरेज",
    clearCache: "लोकल कॅश साफ करा",
    emergencyReset: "सिस्टम डायग्नोस्टिक रिसेट",

    // Added Missing Translations
    matchedCount: "जुळलेले:",
    studentsCount: "विद्यार्थी",
    certsCount: "प्रमाणपत्रे",
    thisMonthTrend: "+12% या महिन्यात",
    totalMinutesText: "एकूण मिनिटे",
    xpAwardedText: "XP प्रदान केले",
    ruralHubTitle: "ग्रामीण हब उपक्रम",
    liveFirestoreBadge: "लाइव्ह डेटा",
    engagementText: "सहभाग",
    topPerformersTitle: "उत्कृष्ट कामगिरी करणारे विद्यार्थी",
    xpAndStreaks: "XP आणि सातत्य",
    dayStreakText: "दिवसांचे सातत्य",
    minsText: "मिनिटे",

    searchLibraryPlaceholder: "लायब्ररीमध्ये शोधा...",
    allTypes: "सर्व प्रकार",
    pdfNotes: "PDF नोट्स",
    videosCategory: "व्हिडिओ",
    audioCategory: "ऑडिओ",
    quizzesCategory: "क्विझ",
    documentsCategory: "कागदपत्रे",
    filesAndDocs: "फायली आणि कागदपत्रे",
    colFileName: "फाइल नाव आणि माहिती",
    colSubject: "विषय",
    colSize: "आकार",
    colUploaded: "अपलोड तारीख",
    colStatus: "स्थिती",
    colActions: "कृती",
    statusVisible: "दृश्यमान",
    statusHidden: "लपवलेले",
    btnView: "पहा",
    btnOptions: "पर्याय",

    verifyCertTitle: "अधिकृत प्रमाणपत्र पडताळणी",
    verifyPlaceholder: "प्रमाणपत्र कोड किंवा मोबाईल नंबर टाका...",
    verifyBtn: "पडताळा",
    colCertId: "प्रमाणपत्र ID",
    colStudent: "विद्यार्थी",
    colAchievement: "शीर्षक",
    colDate: "तारीख",
    reactivateBtn: "पुन्हा सक्रिय करा",

    userSubtitle: "खाती व्यवस्थापित करा आणि प्रशासकीय अधिकार द्या.",
    userSearchPlaceholder: "नाव, मोबाईल किंवा गावावरून शोधा...",
    colUser: "विद्यार्थी / वापरकर्ता",
    colMobile: "मोबाईल",
    colLocation: "गाव / शाळा",
    colRole: "भूमिका",
    colActivity: "उपक्रम",
    colRoleActions: "भूमिका कृती",
    makeAdmin: "एडमिन करा",
    makeStudent: "विद्यार्थी करा",
    regPrefix: "नोंदणी:",

    lowBandwidthTitle: "2G / कमी बँडविड्थ मोड",
    lowBandwidthSub: "ग्रामीण नेटवर्कसाठी डेटा आकार कमी करतो",
    aiRateLimitTitle: "AI ट्यूटर प्रश्न मर्यादा",
    securityPinSub: "प्रशासकासाठी सुरक्षा पासवर्ड अपडेट करा",
    currentPinLabel: "सध्याचा पासवर्ड / 6-अंकी PIN *",
    newPinLabel: "नवीन पासवर्ड / 6-अंकी PIN *",
    confirmPinLabel: "नवीन पासवर्डची खात्री करा *",
    currentPinPlaceholder: "सध्याचा 6-अंकी PIN टाका",
    newPinPlaceholder: "नवीन 6-अंकी PIN टाका",
    confirmPinPlaceholder: "नवीन PIN ची खात्री करा",
    savePasswordBtn: "नवीन पासवर्ड जतन करा"
  },
  ta: {
    dashboardTitle: "கிராமப்புற கல்வி நிர்வாகி கட்டுப்பாட்டு பலகை",
    superAdminBadge: "சூப்பர் நிர்வாகி",
    loggedInAs: "உள்நுழைந்துள்ளவர்:",
    stateOps: "மாநில பாடத்திட்ட செயல்பாடுகள்",
    downloadAnalytics: "பகுப்பாய்வைப் பதிவிறக்குக",
    syncLiveData: "நேரலைத் தரவை ஒத்திசைக்க",
    exitAdmin: "நிர்வாகி கன்சோலிலிருந்து வெளியேறு",
    currentModule: "தற்போதைய:",
    adminModulesCount: "நிர்வாகக் கூறுகள்",
    navAnalytics: "மாணவர் பகுப்பாய்வு",
    navContent: "பாடத்திட்டம் & பாடப்பொருள்",
    navCertificates: "சான்றிதழ் பதிவேடு",
    navUsers: "பயனர் பங்கு மேலாண்மை",
    navSettings: "தள வடிவமைப்பு",
    analyticsTitle: "முதன்மை பகுப்பாய்வு & மாணவர் முன்னேற்றம்",
    analyticsSubtitle: "கல்விக் காலத்தின் அடிப்படையில் தரவை வடிகட்டி PDF அல்லது Excel (.xlsx) அறிக்கையை ஏற்றுமதி செய்க.",
    filterRange: "வடிகட்டி காலம்:",
    allTime: "அனைத்து நேரமும்",
    today: "இன்று",
    thisWeek: "இந்த வாரம்",
    thisMonth: "இந்த மாதம்",
    year: "ஆண்டு",
    month: "மாதம்",
    pdfReport: "PDF அறிக்கை",
    excelExport: "Excel (.xlsx)",
    allFormats: "அனைத்து வடிவங்கள்",
    totalStudents: "மொத்த பதிவுசெய்த மாணவர்கள்",
    activeTeachers: "செயலில் உள்ள ஆசிரியர்கள்",
    registeredSchools: "பள்ளிகள் & கிராமங்கள்",
    lessonsCompleted: "முடிக்கப்பட்ட கற்றல் மணிநேரம்",
    certsIssued: "வழங்கப்பட்ட சான்றிதழ்கள்",
    totalXP: "மொத்த விளையாட்டுப் புள்ளிகள்",
    standardBreakdown: "வகுப்பு வாரியான ஈடுபாடு",
    boardBreakdown: "கல்வி வாரிய விநியோகம்",
    topVillages: "சிறந்த செயல்திறன் கொண்ட கிராமங்கள் / பள்ளிகள்",
    exportReport: "முழு அறிக்கையை ஏற்றுமதி செய்",
    repositoryTitle: "மாநில கற்றல் பாடப்பொருள் களஞ்சியம்",
    createFolder: "புதிய கோப்புறையை உருவாக்கு",
    uploadFile: "கற்றல் பொருளைப் பதிவேற்று",
    batchAi: "தொகுதி AI உருவாக்கி",
    rootFolder: "முதன்மை கோப்பகம்",
    searchContent: "பாடப்பொருட்கள், குறிப்புகள், PDF தேடுக...",
    filterCategory: "அனைத்து வகைகள்",
    filterStandard: "வகுப்பு வடிகட்டி",
    filterBoard: "கல்வி வாரிய வடிகட்டி",
    emptyFolders: "இதுவரை கோப்புறைகள் எதுவும் உருவாக்கப்படவில்லை.",
    emptyFiles: "இந்த கோப்பகத்தில் பாடப்பொருட்கள் எதுவும் இல்லை.",
    previewPdf: "செயல்பாட்டு வாசகர் & AI தீர்வு வழங்கி",
    editFile: "விவரங்களைத் திருத்து",
    deleteFile: "நீக்கு",
    downloadFile: "பதிவிறக்கு",
    visibleLabel: "மாணவர்களுக்குத் தெரியும்",
    hiddenLabel: "மறைக்கப்பட்டது (வரைவு)",
    certTitle: "அதிகாரப்பூர்வ சான்றிதழ் வழங்கல் & சரிபார்ப்பு",
    issueCertBtn: "புதிய சான்றிதழ் வழங்கு",
    studentName: "பெறுநரின் முழுப் பெயர்",
    mobileNumber: "கைபேசி எண்",
    schoolVillage: "பள்ளி / கிராமம்",
    standardLabel: "வகுப்பு / நிலை",
    titleLabel: "சாதனைத் தலைப்பு / பாடம்",
    issueDate: "வழங்கப்பட்ட தேதி",
    statusActive: "செயலில் & சரிபார்க்கப்பட்டது",
    statusRevoked: "ரத்து செய்யப்பட்டது",
    revokeBtn: "ரத்து செய்",
    activateBtn: "மீண்டும் செயல்படுத்து",
    deleteCertBtn: "பதிவை நீக்கு",
    searchCerts: "பெயர், ஐடி அல்லது கைபேசி மூலம் சான்றிதழ்களைத் தேடுக...",
    userTitle: "பயனர் பங்கு & அணுகல் கட்டுப்பாட்டு மையம்",
    addUserBtn: "புதிய பயனர் / பணியாளரைப் பதிவு செய்",
    searchUsers: "பெயர், கைபேசி, கிராமம் அல்லது பள்ளி மூலம் பயனர்களைத் தேடுக...",
    roleAll: "அனைத்துப் பங்குகள்",
    roleStudent: "மாணவர்",
    roleTeacher: "ஆசிரியர்",
    roleAdmin: "நிர்வாகி",
    userNameCol: "பயனர் சுயவிவரம்",
    userMobileCol: "கைபேசி / பங்கு",
    userLocCol: "கிராமம் / பள்ளி",
    userGradeCol: "வகுப்பு",
    userStreakCol: "தொடர்ச்சி & புள்ளிகள்",
    userStudyCol: "கற்றல் நிமிடங்கள்",
    actionsCol: "செயல்கள்",
    promoteTeacher: "ஆசிரியர் பங்கைக் கொடு",
    promoteStudent: "மாணவர் பங்கைக் கொடு",
    promoteAdmin: "நிர்வாகி பங்கைக் கொடு",
    deleteUser: "பயனரை நீக்கு",
    settingsTitle: "நிர்வாகி அமைப்புகள் & பாதுகாப்பு கட்டமைப்பு",
    changePinTitle: "பாதுகாப்பு PIN & அணுகல் குறியீடு",
    currentPin: "தற்போதைய பாதுகாப்பு PIN",
    newPin: "புதிய 6-இலக்க நிர்வாகி PIN",
    confirmPin: "புதிய PIN ஐ உறுதிப்படுத்து",
    savePinBtn: "பாதுகாப்பு PIN ஐ புதுப்பி",
    platformDefaults: "தளத்தின் இயல்புநிலை அமைப்புகள்",
    defaultLang: "இயல்புநிலை மொழி",
    storageCache: "உள்ளூர் சேமிப்பு & ஆஃப்லைன் சேமிப்பகம்",
    clearCache: "உள்ளூர் நினைவகத்தை அழி",
    emergencyReset: "கணினி ஆய்வு மீட்டமைப்பு",

    // Added Missing Translations
    matchedCount: "பொருந்தியவை:",
    studentsCount: "மாணவர்கள்",
    certsCount: "சான்றிதழ்கள்",
    thisMonthTrend: "இந்த மாதத்தில் +12%",
    totalMinutesText: "மொத்த நிமிடங்கள்",
    xpAwardedText: "வழங்கப்பட்ட XP",
    ruralHubTitle: "கிராமப்புற மைய செயல்பாடுகள்",
    liveFirestoreBadge: "நேரலை தரவு",
    engagementText: "ஈடுபாடு",
    topPerformersTitle: "சிறந்த மாணவர்கள்",
    xpAndStreaks: "XP & தொடர்ச்சி",
    dayStreakText: "நாட்கள் தொடர்ச்சி",
    minsText: "நிமிடங்கள்",

    searchLibraryPlaceholder: "நூலகத்தில் தேடுக...",
    allTypes: "அனைத்து வகைகள்",
    pdfNotes: "PDF குறிப்புகள்",
    videosCategory: "காணொளிகள்",
    audioCategory: "ஒலி பதிவுகள்",
    quizzesCategory: "வினாடி வினா",
    documentsCategory: "ஆவணங்கள்",
    filesAndDocs: "கோப்புகள் & ஆவணங்கள்",
    colFileName: "கோப்பு பெயர் & தகவல்",
    colSubject: "பாடம்",
    colSize: "அளவு",
    colUploaded: "பதிவேற்றப்பட்ட நாள்",
    colStatus: "நிலை",
    colActions: "செயல்கள்",
    statusVisible: "தெரிவது",
    statusHidden: "மறைக்கப்பட்டது",
    btnView: "பார்வை",
    btnOptions: "விருப்பங்கள்",

    verifyCertTitle: "அதிகாரப்பூர்வ சான்றிதழ் சரிபார்ப்பு",
    verifyPlaceholder: "சான்றிதழ் குறியீடு அல்லது மொபைல் எண்ணை உள்ளிடுக...",
    verifyBtn: "சரிபார்",
    colCertId: "சான்றிதழ் ID",
    colStudent: "மாணவர்",
    colAchievement: "தலைப்பு",
    colDate: "தேதி",
    reactivateBtn: "மீண்டும் செயல்படுத்து",

    userSubtitle: "கணக்குகளை நிர்வகித்து நிர்வாகி உரிமைகளை வழங்குக.",
    userSearchPlaceholder: "பெயர், மொபைல் அல்லது கிராமம் மூலம் தேடுக...",
    colUser: "மாணவர் / பயனர்",
    colMobile: "மொபைல்",
    colLocation: "கிராமம் / பள்ளி",
    colRole: "பங்கு",
    colActivity: "செயல்பாடு",
    colRoleActions: "பங்கு செயல்கள்",
    makeAdmin: "நிர்வாகியாக்கு",
    makeStudent: "மாணவராக்கு",
    regPrefix: "பதிவு:",

    lowBandwidthTitle: "2G / குறைந்த அலைவரிசை பயன்முறை",
    lowBandwidthSub: "கிராமப்புற நெட்வொர்க்குகளுக்கு தரவு அளவை சுருக்குகிறது",
    aiRateLimitTitle: "AI ஆசிரியர் கேள்வி வரம்பு",
    securityPinSub: "நிர்வாகிக்கான பாதுகாப்பு குறியீட்டை புதுப்பிக்கவும்",
    currentPinLabel: "தற்போதைய கடவுச்சொல் / 6-இலக்க PIN *",
    newPinLabel: "புதிய கடவுச்சொல் / 6-இலக்க PIN *",
    confirmPinLabel: "புதிய கடவுச்சொல்லை உறுதிப்படுத்துக *",
    currentPinPlaceholder: "தற்போதைய 6-இலக்க PIN ஐ உள்ளிடுக",
    newPinPlaceholder: "புதிய 6-இலக்க PIN ஐ உள்ளிடுக",
    confirmPinPlaceholder: "புதிய PIN ஐ உறுதிப்படுத்துக",
    savePasswordBtn: "கடவுச்சொல்லை சேமி"
  },
  te: {
    dashboardTitle: "గ్రామీణ విద్యా పోర్టల్ అడ్మిన్ డాష్‌బోర్డ్",
    superAdminBadge: "సూపర్ అడ్మిన్",
    loggedInAs: "లాగిన్ అయ్యారు:",
    stateOps: "రాష్ట్ర పాఠ్య ప్రణాళిక నిర్వహణ",
    downloadAnalytics: "విశ్లేషణలను డౌన్‌లోడ్ చేయండి",
    syncLiveData: "లైవ్ డేటాను సింక్ చేయండి",
    exitAdmin: "అడ్మిన్ కన్సోల్ నుండి నిష్క్రమించండి",
    currentModule: "ప్రస్తుత:",
    adminModulesCount: "అడ్మిన్ మోడ్యూల్స్",
    navAnalytics: "విద్యార్థి విశ్లేషణలు",
    navContent: "పాఠ్య ప్రణాళిక మరియు కంటెంట్",
    navCertificates: "సర్టిఫికేట్ల రిజిస్ట్రీ",
    navUsers: "వినియోగదారు పాత్రల నిర్వహణ",
    navSettings: "ప్లాట్‌ఫారమ్ కాన్ఫిగరేషన్",
    analyticsTitle: "మాస్టర్ విశ్లేషణలు & విద్యార్థుల పురోగతి",
    analyticsSubtitle: "విద్యా కాలం ఆధారంగా డేటాను ఫిల్టర్ చేయండి మరియు PDF లేదా Excel (.xlsx) నివేదికలను ఎగుమతి చేయండి.",
    filterRange: "ఫిల్టర్ వ్యవధి:",
    allTime: "అన్ని సమయాలు",
    today: "ఈ రోజు",
    thisWeek: "ఈ వారం",
    thisMonth: "ఈ నెల",
    year: "సంవత్సరం",
    month: "నెల",
    pdfReport: "PDF నివేదిక",
    excelExport: "Excel (.xlsx)",
    allFormats: "అన్ని ఫార్మాట్‌లు",
    totalStudents: "మొత్తం నమోదైన విద్యార్థులు",
    activeTeachers: "యాక్టివ్ ఉపాధ్యాయులు",
    registeredSchools: "పాఠశాలలు & గ్రామాలు",
    lessonsCompleted: "పూర్తయిన అధ్యయన గంటలు",
    certsIssued: "జారీ చేసిన సర్టిఫికెట్లు",
    totalXP: "మొత్తం గేమిఫైడ్ పాయింట్లు",
    standardBreakdown: "తరగతి వారీగా భాగస్వామ్యం",
    boardBreakdown: "విద్యా బోర్డుల పంపిణీ",
    topVillages: "అత్యుత్తమ ప్రతిభ కనబరిచిన గ్రామాలు / పాఠశాలలు",
    exportReport: "సమగ్ర నివేదికను ఎగుమతి చేయండి",
    repositoryTitle: "రాష్ట్ర అభ్యాస కంటెంట్ రిపోజిటరీ",
    createFolder: "కొత్త ఫోల్డర్‌ను సృష్టించండి",
    uploadFile: "అభ్యాస సామగ్రిని అప్‌లోడ్ చేయండి",
    batchAi: "బ్యాచ్ AI జనరేటర్",
    rootFolder: "రూట్ డైరెక్టరీ",
    searchContent: "కంటెంట్, నోట్స్, PDF లను శోధించండి...",
    filterCategory: "అన్ని విభాగాలు",
    filterStandard: "తరగతి ఫిల్టర్ చేయండి",
    filterBoard: "విద్యా బోర్డు ఫిల్టర్ చేయండి",
    emptyFolders: "ఇంకా ఫోల్డర్లు సృష్టించబడలేదు.",
    emptyFiles: "ఈ డైరెక్టరీలో పాఠ్య సామగ్రి కనుగొనబడలేదు.",
    previewPdf: "ఇంటరాక్టివ్ రీడర్ & AI సోల్వర్",
    editFile: "వివరాలను సవరించండి",
    deleteFile: "తొలగించు",
    downloadFile: "డౌన్‌లోడ్ చేయండి",
    visibleLabel: "విద్యార్థులకు కనిపిస్తుంది",
    hiddenLabel: "దాచబడింది (డ్రాఫ్ట్)",
    certTitle: "అధికారిక సర్టిఫికేట్ జారీ & ప్రమాణీకరణ",
    issueCertBtn: "కొత్త సర్టిఫికేట్ జారీ చేయండి",
    studentName: "గ్రహీత పూర్తి పేరు",
    mobileNumber: "మొబైల్ సంఖ్య",
    schoolVillage: "పాఠశాల / గ్రామం",
    standardLabel: "తరగతి / గ్రేడ్",
    titleLabel: "సాధన శీర్షిక / సబ్జెక్ట్",
    issueDate: "జారీ చేసిన తేదీ",
    statusActive: "యాక్టివ్ & వెరిఫై చేయబడింది",
    statusRevoked: "రద్దు చేయబడింది",
    revokeBtn: "రద్దు చేయండి",
    activateBtn: "మళ్లీ యాక్టివేట్ చేయండి",
    deleteCertBtn: "రికార్డును తొలగించండి",
    searchCerts: "పేరు, ఐడీ లేదా మొబైల్ ద్వారా సర్టిఫికేట్లను శోధించండి...",
    userTitle: "వినియోగదారు పాత్రలు & యాక్సెస్ నియంత్రణ కేంద్రం",
    addUserBtn: "కొత్త వినియోగదారు / సిబ్బందిని నమోదు చేయండి",
    searchUsers: "పేరు, మొబైల్, గ్రామం లేదా పాఠశాల ద్వారా శోధించండి...",
    roleAll: "అన్ని పాత్రలు",
    roleStudent: "విద్యార్థి",
    roleTeacher: "ఉపాధ్యాయుడు",
    roleAdmin: "నిర్వాహకుడు",
    userNameCol: "వినియోగదారు ప్రొఫైల్",
    userMobileCol: "మొబైల్ / పాత్ర",
    userLocCol: "గ్రామం / పాఠశాల",
    userGradeCol: "తరగతి",
    userStreakCol: "స్ట్రీక్ & పాయింట్లు",
    userStudyCol: "అధ్యయన నిమిషాలు",
    actionsCol: "చర్యలు",
    promoteTeacher: "ఉపాధ్యాయుడి పాత్ర ఇవ్వండి",
    promoteStudent: "విద్యార్థి పాత్ర ఇవ్వండి",
    promoteAdmin: "అడ్మిన్ పాత్ర ఇవ్వండి",
    deleteUser: "వినియోగదారుని తొలగించు",
    settingsTitle: "నిర్వాహకుడి సెట్టింగ్‌లు & భద్రతా కాన్ఫిగరేషన్",
    changePinTitle: "సెక్యూరిటీ పిన్ & యాక్సెస్ కోడ్",
    currentPin: "ప్రస్తుత సెక్యూరిటీ పిన్",
    newPin: "కొత్త 6-అంకెల అడ్మిన్ పిన్",
    confirmPin: "కొత్త పిన్‌ను నిర్ధారించండి",
    savePinBtn: "సెక్యూరిటీ పిన్ అప్‌డేట్ చేయండి",
    platformDefaults: "సిస్టమ్ ప్లాట్‌ఫారమ్ డిఫాల్ట్‌లు",
    defaultLang: "డిఫాల్ట్ భాష",
    storageCache: "లోకల్ క్యాషే & ఆఫ్‌లైన్ స్టోరేజ్",
    clearCache: "లోకల్ క్యాషే క్లియర్ చేయండి",
    emergencyReset: "సిస్టమ్ డయాగ్నోస్టిక్ రీసెట్",

    // Added Missing Translations
    matchedCount: "సరిపోలినవి:",
    studentsCount: "విద్యార్థులు",
    certsCount: "సర్టిఫికెట్లు",
    thisMonthTrend: "ఈ నెలలో +12%",
    totalMinutesText: "మొత్తం నిమిషాలు",
    xpAwardedText: "లభించిన XP",
    ruralHubTitle: "గ్రామీణ హబ్ కార్యకలాపాలు",
    liveFirestoreBadge: "లైవ్ డేటా",
    engagementText: "భాగస్వామ్యం",
    topPerformersTitle: "ఉత్తమ విద్యార్థులు",
    xpAndStreaks: "XP & నిలకడ",
    dayStreakText: "రోజుల నిలకడ",
    minsText: "నిమిషాలు",

    searchLibraryPlaceholder: "లైబ్రరీలో శోధించండి...",
    allTypes: "అన్ని రకాలు",
    pdfNotes: "PDF నోట్స్",
    videosCategory: "వీడియోలు",
    audioCategory: "ఆడియో",
    quizzesCategory: "క్విజ్‌లు",
    documentsCategory: "పత్రాలు",
    filesAndDocs: "ఫైళ్లు & పత్రాలు",
    colFileName: "ఫైల్ పేరు & సమాచారం",
    colSubject: "సబ్జెక్ట్",
    colSize: "పరిమాణం",
    colUploaded: "అప్‌లోడ్ తేదీ",
    colStatus: "స్థితి",
    colActions: "చర్యలు",
    statusVisible: "కనిపించేది",
    statusHidden: "దాచబడింది",
    btnView: "చూడండి",
    btnOptions: "ఎంపికలు",

    verifyCertTitle: "అధికారిక సర్టిఫికేట్ ధృవీకరణ",
    verifyPlaceholder: "సర్టిఫికేట్ కోడ్ లేదా మొబైల్ నంబర్ ఎంటర్ చేయండి...",
    verifyBtn: "ధృవీకరించు",
    colCertId: "సర్టిఫికేట్ ID",
    colStudent: "విద్యార్థి",
    colAchievement: "శీర్షిక",
    colDate: "తేదీ",
    reactivateBtn: "తిరిగి ప్రారంభించు",

    userSubtitle: "ఖాతాలను నిర్వహించండి మరియు అడ్మిన్ అధికారాలను కేటాయించండి.",
    userSearchPlaceholder: "పేరు, మొబైల్ లేదా గ్రామం ద్వారా శోధించండి...",
    colUser: "విద్యార్థి / వినియోగదారు",
    colMobile: "మొబైల్",
    colLocation: "గ్రామం / పాఠశాల",
    colRole: "పాత్ర",
    colActivity: "కార్యాచరణ",
    colRoleActions: "పాత్ర చర్యలు",
    makeAdmin: "అడ్మిన్ చేయండి",
    makeStudent: "విద్యార్థి చేయండి",
    regPrefix: "నమోదు:",

    lowBandwidthTitle: "2G / తక్కువ బ్యాండ్‌విడ్త్ మోడ్",
    lowBandwidthSub: "గ్రామీణ నెట్‌వర్క్‌ల కోసం డేటా సైజును తగ్గిస్తుంది",
    aiRateLimitTitle: "AI ట్యూటర్ ప్రశ్నల పరిమితి",
    securityPinSub: "అడ్మినిస్ట్రేటర్ కోసం సెక్యూరిటీ పిన్ అప్‌డేట్ చేయండి",
    currentPinLabel: "ప్రస్తుత పాస్‌వర్డ్ / 6-అంకెల PIN *",
    newPinLabel: "కొత్త పాస్‌వర్డ్ / 6-అంకెల PIN *",
    confirmPinLabel: "కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి *",
    currentPinPlaceholder: "ప్రస్తుత 6-అంకెల PIN ఎంటర్ చేయండి",
    newPinPlaceholder: "కొత్త 6-అంకెల PIN ఎంటర్ చేయండి",
    confirmPinPlaceholder: "కొత్త PIN నిర్ధారించండి",
    savePasswordBtn: "పాస్‌వర్డ్ సేవ్ చేయండి"
  }
};

export default function AdminDashboardView({ adminUser, lang, onLogoutAdmin }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'content' | 'certificates' | 'users' | 'settings'>('analytics');
  const [adminLang, setAdminLang] = useState<LanguageCode>(lang || 'en');

  useEffect(() => {
    if (lang) {
      setAdminLang(lang);
    }
  }, [lang]);

  const t = (ADMIN_DASHBOARD_TRANSLATIONS[adminLang] || ADMIN_DASHBOARD_TRANSLATIONS.en) as typeof ADMIN_DASHBOARD_TRANSLATIONS.en;

  // Real data state
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');

  // Curriculum Folder Structure & File Management state (Starts EMPTY initially as requested)
  const [curriculumFolders, setCurriculumFolders] = useState<CurriculumFolder[]>(() => {
    try {
      const saved = localStorage.getItem('gramin_curriculum_folders_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [curriculumFiles, setCurriculumFiles] = useState<CurriculumFile[]>(() => {
    try {
      const saved = localStorage.getItem('gramin_curriculum_files_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [contentSearch, setContentSearch] = useState('');
  const [contentCategoryFilter, setContentCategoryFilter] = useState<string>('all');

  // Modals for Folder & File Creation
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('amber');

  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSubject, setNewFileSubject] = useState('Science');
  const [newFileCategory, setNewFileCategory] = useState<'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other'>('pdf');
  const [newFileMaterialType, setNewFileMaterialType] = useState<'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other'>('notes');
  const [newFileStandard, setNewFileStandard] = useState('All Standards');
  const [newFileBoard, setNewFileBoard] = useState('State Board');
  const [newFileFolderId, setNewFileFolderId] = useState<string | null>(null);
  const [newFileSize, setNewFileSize] = useState('1.5 MB');
  const [newFileExternalUrl, setNewFileExternalUrl] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileDataUrl, setNewFileDataUrl] = useState<string | undefined>(undefined);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [aiAutoAnalyzed, setAiAutoAnalyzed] = useState(false);
  const [batchFilesList, setBatchFilesList] = useState<BatchFileItem[]>([]);
  const [isProcessingBatchAI, setIsProcessingBatchAI] = useState(false);

  // Move Modal State
  const [selectedMoveFile, setSelectedMoveFile] = useState<CurriculumFile | null>(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null);

  // Edit File Details State
  const [editingFile, setEditingFile] = useState<CurriculumFile | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileSubject, setEditingFileSubject] = useState('');
  const [editingFileCategory, setEditingFileCategory] = useState<'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other'>('pdf');
  const [editingFileMaterialType, setEditingFileMaterialType] = useState<'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other'>('notes');
  const [editingFileStandard, setEditingFileStandard] = useState('All Standards');
  const [editingFileBoard, setEditingFileBoard] = useState('State Board');
  const [editingFileFolderId, setEditingFileFolderId] = useState<string | null>(null);
  const [editingFileDescription, setEditingFileDescription] = useState('');
  const [editingFileExternalUrl, setEditingFileExternalUrl] = useState('');
  const [editingFileIsVisible, setEditingFileIsVisible] = useState(true);

  // File action dropdown state
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showBulkCategorizeModal, setShowBulkCategorizeModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other'>('pdf');
  const [bulkMaterialType, setBulkMaterialType] = useState<'notes' | 'ebook' | 'pyq' | 'practice_questions' | 'other'>('notes');
  const [bulkSubject, setBulkSubject] = useState('Science');

  // PDF Viewer & Read Aloud State
  const [activePdfFile, setActivePdfFile] = useState<CurriculumFile | null>(null);
  const [isPdfSpeaking, setIsPdfSpeaking] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string>('');
  const [pdfModalTab, setPdfModalTab] = useState<'pdf' | 'text'>('pdf');

  useEffect(() => {
    if (!activePdfFile) {
      setActivePdfUrl('');
      return;
    }

    let isSubscribed = true;
    let urlToRevoke = '';

    const loadPdfData = async () => {
      let fileDataUrl = activePdfFile.fileDataUrl;
      if (!fileDataUrl) {
        fileDataUrl = await getFileLocal(activePdfFile.id) || undefined;
      }

      if (!isSubscribed) return;

      if (fileDataUrl && fileDataUrl.startsWith('data:')) {
        try {
          const parts = fileDataUrl.split(',');
          const mimeString = parts[0].split(':')[1].split(';')[0];
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const url = URL.createObjectURL(blob);
          urlToRevoke = url;
          setActivePdfUrl(url);
        } catch (err) {
          setActivePdfUrl(fileDataUrl);
        }
      } else if (activePdfFile.externalUrl) {
        setActivePdfUrl(activePdfFile.externalUrl);
      } else {
        // Generate a fallback standard PDF-1.4 draft so there's always something to display!
        const cleanFileName = activePdfFile.name.replace(/[^\w\s.-]/gi, '');
        const pdfDocContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 300 >>
stream
BT
/F1 16 Tf
50 720 Td
(${cleanFileName}) Tj
/F1 12 Tf
0 -30 Td
(Subject: ${activePdfFile.subject}) Tj
0 -20 Td
(Grade / Standard: ${activePdfFile.standard || 'All Standards'}) Tj
0 -20 Td
(Board: ${activePdfFile.board || 'State / CBSE Board'}) Tj
0 -20 Td
(Category: ${activePdfFile.category}) Tj
0 -30 Td
(Description: ${activePdfFile.description || 'Gramin Shiksha Offline Curriculum File'}) Tj
0 -30 Td
(Uploaded: ${activePdfFile.uploadedAt}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000250 00000 n 
0000000600 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
670
%%EOF`;
        const blob = new Blob([pdfDocContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        urlToRevoke = url;
        setActivePdfUrl(url);
      }
    };

    loadPdfData();

    return () => {
      isSubscribed = false;
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [activePdfFile]);



  // Rename Folder State
  const [renamingFolder, setRenamingFolder] = useState<CurriculumFolder | null>(null);
  const [renamedFolderName, setRenamedFolderName] = useState('');

  // Certificates state
  const [certificates, setCertificates] = useState<FirestoreCertificate[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [certSearch, setCertSearch] = useState('');
  const [verificationResult, setVerificationResult] = useState<FirestoreCertificate | null | 'not_found'>(null);
  const [newCertStudent, setNewCertStudent] = useState('');
  const [newCertMobile, setNewCertMobile] = useState('');
  const [newCertTitle, setNewCertTitle] = useState('Mastery Certificate');
  const [showIssueCertModal, setShowIssueCertModal] = useState(false);

  // System settings state
  const [bandwidthCompression, setBandwidthCompression] = useState(true);
  const [aiRateLimit, setAiRateLimit] = useState('High (100 req/min)');
  const [showExportModal, setShowExportModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Admin session started by ${adminUser.name} (${adminUser.mobile})`,
    `[System] Firestore database connected successfully`,
    `[Network] 2G Bandwidth Optimization active`
  ]);

  // Analytics Date & Time Filter State
  const [analyticsFilterMode, setAnalyticsFilterMode] = useState<'all' | 'year' | 'month' | 'custom'>('all');
  const [analyticsYear, setAnalyticsYear] = useState<string>('2026');
  const [analyticsMonth, setAnalyticsMonth] = useState<string>('2026-08');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('');

  // Helper function to check if a record falls within selected date period
  const isRecordInDatePeriod = (dateVal?: string | number) => {
    if (analyticsFilterMode === 'all') return true;
    if (!dateVal) return true;

    let itemDate: Date;
    if (typeof dateVal === 'number') {
      itemDate = new Date(dateVal);
    } else {
      itemDate = new Date(dateVal);
    }

    if (isNaN(itemDate.getTime())) return true;

    if (analyticsFilterMode === 'year') {
      return itemDate.getFullYear().toString() === analyticsYear;
    }

    if (analyticsFilterMode === 'month') {
      if (!analyticsMonth) return true;
      const [y, m] = analyticsMonth.split('-');
      const itemY = itemDate.getFullYear().toString();
      const itemM = (itemDate.getMonth() + 1).toString().padStart(2, '0');
      return itemY === y && itemM === m;
    }

    if (analyticsFilterMode === 'custom') {
      if (analyticsStartDate) {
        const start = new Date(analyticsStartDate + 'T00:00:00');
        if (!isNaN(start.getTime()) && itemDate < start) return false;
      }
      if (analyticsEndDate) {
        const end = new Date(analyticsEndDate + 'T23:59:59');
        if (!isNaN(end.getTime()) && itemDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered Datasets based on selected date/time filter
  const filteredUsersList = useMemo(() => {
    return usersList.filter((u) => isRecordInDatePeriod((u as any).createdAt || u.signupDate));
  }, [usersList, analyticsFilterMode, analyticsYear, analyticsMonth, analyticsStartDate, analyticsEndDate]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => isRecordInDatePeriod(c.date));
  }, [certificates, analyticsFilterMode, analyticsYear, analyticsMonth, analyticsStartDate, analyticsEndDate]);

  const filteredCurriculumFiles = useMemo(() => {
    return curriculumFiles.filter((f) => isRecordInDatePeriod(f.uploadedAt));
  }, [curriculumFiles, analyticsFilterMode, analyticsYear, analyticsMonth, analyticsStartDate, analyticsEndDate]);

  const filteredTotalStudents = useMemo(() => {
    const students = filteredUsersList.filter((u) => (u.role || 'student') === 'student');
    return students.length || filteredUsersList.length;
  }, [filteredUsersList]);

  const filteredTotalStudyMins = useMemo(() => {
    return filteredUsersList.reduce((acc, u) => acc + (u.studyMins || 0), 0);
  }, [filteredUsersList]);

  const filteredTotalPoints = useMemo(() => {
    return filteredUsersList.reduce((acc, u) => acc + (u.totalPoints || 0), 0);
  }, [filteredUsersList]);

  // Dynamic Rural Village Hub Activity filtered by selected date/time period
  const filteredVillageHubStats = useMemo(() => {
    if (!filteredUsersList || filteredUsersList.length === 0) return [];

    const map: Record<string, { name: string; count: number; activeCount: number; totalXP: number }> = {};

    filteredUsersList.forEach((u) => {
      let hubName = 'General Village Hub';
      if (u.village && u.village.trim().length > 0) {
        const v = u.village.trim();
        hubName = v.toLowerCase().includes('hub') || v.toLowerCase().includes('school') || v.toLowerCase().includes('classroom')
          ? v
          : `${v} Hub`;
      } else if (u.school && u.school.trim().length > 0) {
        hubName = u.school.trim();
      }

      if (!map[hubName]) {
        map[hubName] = { name: hubName, count: 0, activeCount: 0, totalXP: 0 };
      }

      map[hubName].count += 1;
      const isActive = (u.streakDays && u.streakDays > 0) || (u.totalPoints && u.totalPoints > 0) || (u.studyMins && u.studyMins > 0);
      if (isActive) {
        map[hubName].activeCount += 1;
      }
      map[hubName].totalXP += u.totalPoints || 0;
    });

    const result = Object.values(map).map((item) => {
      const pctVal = item.count > 0 ? Math.min(100, Math.max(15, Math.round((item.activeCount / item.count) * 100))) : 0;
      return {
        name: item.name,
        count: item.count,
        pct: `${pctVal}%`,
        totalXP: item.totalXP
      };
    });

    result.sort((a, b) => b.count - a.count || b.totalXP - a.totalXP);
    return result;
  }, [filteredUsersList]);

  const getDateFilterLabel = () => {
    if (analyticsFilterMode === 'all') return 'Full Analytics (All Time)';
    if (analyticsFilterMode === 'year') return `Year ${analyticsYear}`;
    if (analyticsFilterMode === 'month') {
      if (!analyticsMonth) return 'Full Analytics (All Time)';
      const [y, m] = analyticsMonth.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const mName = monthNames[parseInt(m, 10) - 1] || m;
      return `${mName} ${y}`;
    }
    if (analyticsFilterMode === 'custom') {
      if (analyticsStartDate && analyticsEndDate) return `Range: ${analyticsStartDate} to ${analyticsEndDate}`;
      if (analyticsStartDate) return `From ${analyticsStartDate}`;
      if (analyticsEndDate) return `Up to ${analyticsEndDate}`;
      return 'Custom Date Range';
    }
    return 'Full Analytics (All Time)';
  };

  // Admin Change Password / PIN State (Platform Config)
  const [oldAdminPinInput, setOldAdminPinInput] = useState('');
  const [newAdminPinInput, setNewAdminPinInput] = useState('');
  const [confirmAdminPinInput, setConfirmAdminPinInput] = useState('');
  const [pwdChangeFeedback, setPwdChangeFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSavingAdminPin, setIsSavingAdminPin] = useState(false);

  // Add Admin Manually State (User Role Management)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminName, setAddAdminName] = useState('');
  const [addAdminMobile, setAddAdminMobile] = useState('');
  const [addAdminPin, setAddAdminPin] = useState('999999');
  const [addAdminDept, setAddAdminDept] = useState('HQ Education Board');
  const [addAdminError, setAddAdminError] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Handler for Admin Password / PIN Change in Platform Config
  const handleUpdateAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeFeedback(null);

    // Validate Old Password / Security PIN
    const savedPin = adminUser.adminPin || localStorage.getItem(`gramin_admin_pin_${adminUser.mobile}`) || '999999';
    const isMasterFallback = !adminUser.adminPin && !localStorage.getItem(`gramin_admin_pin_${adminUser.mobile}`) && (oldAdminPinInput === '999999' || oldAdminPinInput === '123456' || oldAdminPinInput === '888888');

    if (oldAdminPinInput !== savedPin && !isMasterFallback) {
      setPwdChangeFeedback({ text: 'Current Password / Security PIN is incorrect.', type: 'error' });
      return;
    }

    if (!newAdminPinInput || newAdminPinInput.length < 6) {
      setPwdChangeFeedback({ text: 'New Security PIN / Password must be at least 6 digits.', type: 'error' });
      return;
    }

    if (newAdminPinInput !== confirmAdminPinInput) {
      setPwdChangeFeedback({ text: 'New PIN and Confirm PIN do not match.', type: 'error' });
      return;
    }

    setIsSavingAdminPin(true);
    try {
      await updateFirebaseUserFields(adminUser.mobile, { adminPin: newAdminPinInput, updatedAt: Date.now() });
      try {
        localStorage.setItem(`gramin_admin_pin_${adminUser.mobile}`, newAdminPinInput);
      } catch (e) {
        console.warn("Failed to set local admin pin:", e);
      }

      setPwdChangeFeedback({ text: 'Admin security password / PIN updated successfully!', type: 'success' });
      setOldAdminPinInput('');
      setNewAdminPinInput('');
      setConfirmAdminPinInput('');

      setAuditLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Password/PIN updated for Administrator ${adminUser.name} (${adminUser.mobile})`,
        ...prev
      ]);
    } catch (err) {
      console.error('Error updating admin PIN:', err);
      setPwdChangeFeedback({ text: 'Failed to update PIN in Firestore database.', type: 'error' });
    } finally {
      setIsSavingAdminPin(false);
    }
  };

  // Handler for Manual Admin Creation in User Role Management
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError('');

    if (!addAdminName.trim()) {
      setAddAdminError('Please enter Administrator Full Name.');
      return;
    }

    if (!addAdminMobile || addAdminMobile.length !== 10) {
      setAddAdminError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!addAdminPin || addAdminPin.length < 6) {
      setAddAdminError('Security PIN must be at least 6 digits.');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const safeDept = addAdminDept.trim() || 'HQ Education Board';
      await setFirebaseUser(addAdminMobile, {
        name: addAdminName.trim(),
        mobile: addAdminMobile,
        role: 'admin',
        adminPin: addAdminPin,
        village: safeDept,
        school: 'State Education Board',
        standard: 'Administrator',
        defaultLanguage: lang,
        signupDate: getSafeDateString(),
        streakDays: 100,
        totalPoints: 5000,
        studyMins: 1200
      });

      try {
        localStorage.setItem(`gramin_admin_pin_${addAdminMobile}`, addAdminPin);
      } catch (e) {
        console.warn("Failed to save admin pin locally:", e);
      }

      // Refresh users list from Firestore
      const updatedUsers = await getAllFirebaseUsers();
      setUsersList(updatedUsers);

      setAuditLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Manually provisioned Administrator: ${addAdminName} (${addAdminMobile})`,
        ...prev
      ]);

      // Reset form and close modal
      setAddAdminName('');
      setAddAdminMobile('');
      setAddAdminPin('999999');
      setAddAdminDept('HQ Education Board');
      setShowAddAdminModal(false);
    } catch (err) {
      console.error('Failed to create admin manually:', err);
      setAddAdminError('Failed to create Administrator profile in Firestore.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Download helper for blobs
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to convert array of objects to CSV string safely
  const convertToCSV = (headers: string[], rows: (string | number)[][]) => {
    const escapeCSV = (str: any) => {
      const stringValue = str === null || str === undefined ? '' : String(str);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headerLine = headers.map(escapeCSV).join(',');
    const rowLines = rows.map((r) => r.map(escapeCSV).join(','));
    return [headerLine, ...rowLines].join('\n');
  };

  // Payload builder for exports (supports both filtered and full un-filtered datasets)
  const getExportPayload = (useFilteredData = true): ExportDataPayload => {
    const targetUsers = useFilteredData ? filteredUsersList : usersList;
    const targetCerts = useFilteredData ? filteredCertificates : certificates;
    const targetFiles = useFilteredData ? filteredCurriculumFiles : curriculumFiles;
    const targetStudyMins = useFilteredData ? filteredTotalStudyMins : totalStudyMinsAll;
    const targetPoints = useFilteredData ? filteredTotalPoints : totalPointsAll;
    const targetHubStats = useFilteredData ? filteredVillageHubStats : villageHubStats;

    return {
      adminUser: { name: adminUser.name, mobile: adminUser.mobile, role: adminUser.role },
      usersList: targetUsers,
      villageHubStats: targetHubStats,
      certificates: targetCerts,
      curriculumFolders,
      curriculumFiles: targetFiles,
      totalStudyMinsAll: targetStudyMins,
      totalPointsAll: targetPoints,
      dateFilterLabel: useFilteredData ? getDateFilterLabel() : 'Full Analytics (All Time)',
    };
  };

  // Master Multi-Sheet Excel Workbook Export (.xlsx)
  const handleExportMasterExcel = (useFiltered = true) => {
    exportMasterAnalyticsExcel(getExportPayload(useFiltered));
    const label = useFiltered ? getDateFilterLabel() : 'Full Analytics (All Time)';
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Master Multi-Sheet Excel Workbook (${label})`, ...prev]);
  };

  // Master Executive Analytics PDF Export (.pdf)
  const handleExportMasterPDF = (useFiltered = true) => {
    exportMasterAnalyticsPDF(getExportPayload(useFiltered));
    const label = useFiltered ? getDateFilterLabel() : 'Full Analytics (All Time)';
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Executive Analytics PDF Report (${label})`, ...prev]);
  };

  // Category PDF & Excel Export Handlers
  const handleExportUsersPDF = () => {
    const headers = ['UID / ID', 'Name', 'Mobile', 'Role', 'Village / School', 'Grade', 'XP Points', 'Study Mins'];
    const rows = filteredUsersList.map((u) => [
      (u as any).uid || u.mobile || 'N/A',
      u.name || 'Anonymous',
      u.mobile || '',
      u.role || 'student',
      u.village || u.school || 'Unspecified',
      (u as any).grade || u.standard || 'N/A',
      u.totalPoints || 0,
      u.studyMins || 0,
    ]);
    exportCategoryPDF(`User Directory (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Users_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported User Directory PDF (${getDateFilterLabel()})`, ...prev]);
  };

  const handleExportUsersExcel = () => {
    const headers = ['UID / ID', 'Name', 'Mobile Number', 'Role', 'Village / School', 'Grade', 'Streak (Days)', 'XP Points', 'Study Minutes', 'Joined Date'];
    const rows = filteredUsersList.map((u) => [
      (u as any).uid || u.mobile || 'N/A',
      u.name || 'Anonymous',
      u.mobile || '',
      u.role || 'student',
      u.village || u.school || 'Unspecified',
      (u as any).grade || u.standard || 'N/A',
      u.streakDays || 0,
      u.totalPoints || 0,
      u.studyMins || 0,
      (u as any).createdAt ? new Date((u as any).createdAt).toLocaleDateString() : (u.signupDate || '')
    ]);
    exportCategoryExcel(`User Directory (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Users_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported User Directory Excel (${getDateFilterLabel()})`, ...prev]);
  };

  const handleExportVillageHubsPDF = () => {
    const headers = ['Village Hub / School Name', 'Enrolled Students', 'Engagement Rate', 'Total XP'];
    const rows = villageHubStats.map((h) => [h.name, h.count, h.pct, h.totalXP]);
    exportCategoryPDF(`Village Hub Performance (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_VillageHubs_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Village Hub PDF`, ...prev]);
  };

  const handleExportVillageHubsExcel = () => {
    const headers = ['Village Hub / School Name', 'Enrolled Students', 'Engagement Rate', 'Total XP'];
    const rows = villageHubStats.map((h) => [h.name, h.count, h.pct, h.totalXP]);
    exportCategoryExcel(`Village Hubs (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_VillageHubs_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Village Hub Excel`, ...prev]);
  };

  const handleExportCertificatesPDF = () => {
    const headers = ['Cert ID', 'Student Name', 'Mobile', 'Course Title', 'Score', 'Issue Date', 'Status'];
    const rows = filteredCertificates.map((c) => [c.id, c.studentName, c.studentMobile, c.title, c.score || 100, c.date, c.status]);
    exportCategoryPDF(`Issued Certificates (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Certificates_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Certificates PDF (${getDateFilterLabel()})`, ...prev]);
  };

  const handleExportCertificatesExcel = () => {
    const headers = ['Cert ID', 'Student Name', 'Mobile Number', 'Course Title', 'Score (%)', 'Issue Date', 'Status'];
    const rows = filteredCertificates.map((c) => [c.id, c.studentName, c.studentMobile, c.title, c.score || 100, c.date, c.status]);
    exportCategoryExcel(`Certificates (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Certificates_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Certificates Excel (${getDateFilterLabel()})`, ...prev]);
  };

  const handleExportCurriculumPDF = () => {
    const headers = ['File ID', 'Title', 'Subject', 'Category', 'File Size', 'Upload Date'];
    const rows = filteredCurriculumFiles.map((f) => [f.id, f.name, f.subject, f.category, f.size, f.uploadedAt]);
    exportCategoryPDF(`Curriculum Inventory (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Curriculum_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Curriculum PDF (${getDateFilterLabel()})`, ...prev]);
  };

  const handleExportCurriculumExcel = () => {
    const headers = ['File ID', 'Title / Name', 'Subject', 'Category', 'File Size', 'Upload Date', 'Resource Link'];
    const rows = filteredCurriculumFiles.map((f) => [f.id, f.name, f.subject, f.category, f.size, f.uploadedAt, f.externalUrl || 'N/A']);
    exportCategoryExcel(`Curriculum Inventory (${getDateFilterLabel()})`, headers, rows, 'GyaanBot_Curriculum_Report');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Curriculum Excel (${getDateFilterLabel()})`, ...prev]);
  };

  // Full System Analytics JSON Backup
  const handleExportFullJSONReport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const report = {
      reportTitle: "GyaanBot Comprehensive Admin Analytics Report",
      generatedAt: new Date().toISOString(),
      generatedBy: {
        name: adminUser.name,
        mobile: adminUser.mobile,
        role: adminUser.role
      },
      summaryKPIs: {
        totalStudents: usersList.filter(u => u.role === 'student').length,
        totalTeachers: usersList.filter(u => u.role === 'teacher').length,
        totalAdmins: usersList.filter(u => u.role === 'admin').length,
        activeCurriculumFiles: curriculumFiles.length,
        curriculumFoldersCount: curriculumFolders.length,
        totalIssuedCertificates: certificates.length,
        totalStudyHoursLogged: Number((totalStudyMinsAll / 60).toFixed(1)),
        totalPointsEarned: totalPointsAll
      },
      villageHubPerformance: villageHubStats,
      userDirectory: usersList,
      certificatesLedger: certificates,
      curriculumFolders: curriculumFolders,
      curriculumFiles: curriculumFiles.map(f => ({
        ...f,
        fileDataUrl: f.fileDataUrl ? '[Data URL Omitted for size optimization]' : undefined
      })),
      recentAuditLogs: auditLogs
    };

    const jsonString = JSON.stringify(report, null, 2);
    triggerDownload(jsonString, `GyaanBot_Full_Analytics_Report_${timestamp}.json`, 'application/json');
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Exported Full System Analytics JSON Report`, ...prev]);
  };

  // Breadcrumb Trail calculation
  const getBreadcrumbs = (): CurriculumFolder[] => {
    const crumbs: CurriculumFolder[] = [];
    let curr = currentFolderId;
    while (curr) {
      const f = curriculumFolders.find((folder) => folder.id === curr);
      if (f) {
        crumbs.unshift(f);
        curr = f.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  // Full Folder Path calculation for dropdowns & labels
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'Root Library /';
    const pathParts: string[] = [];
    let curr: string | null = folderId;
    const visited = new Set<string>();
    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const f = curriculumFolders.find((folder) => folder.id === curr);
      if (f) {
        pathParts.unshift(f.name);
        curr = f.parentId;
      } else {
        break;
      }
    }
    return 'Root / ' + pathParts.join(' / ');
  };

  // Sub-items count for a folder
  const getFolderItemCount = (folderId: string) => {
    const subFolderCount = curriculumFolders.filter((f) => f.parentId === folderId).length;
    const fileCount = curriculumFiles.filter((f) => f.folderId === folderId).length;
    return { subFolderCount, fileCount };
  };

  // Persist curriculumFolders safely to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gramin_curriculum_folders_v2', JSON.stringify(curriculumFolders));
    } catch (err) {
      console.warn("Failed to persist curriculum folders to localStorage:", err);
    }
  }, [curriculumFolders]);

  // Persist curriculumFiles metadata safely to localStorage (strip fileDataUrl to respect 5MB browser quota)
  useEffect(() => {
    try {
      const lightweightFiles = curriculumFiles.map((f) => {
        if (f.fileDataUrl) {
          const { fileDataUrl, ...rest } = f;
          return rest;
        }
        return f;
      });
      localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(lightweightFiles));
    } catch (err) {
      console.warn("Failed to persist curriculum files to localStorage:", err);
    }
  }, [curriculumFiles]);

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: CurriculumFolder = {
      id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString().split('T')[0],
      description: newFolderDesc.trim() || undefined,
      color: newFolderColor
    };

    setCurriculumFolders((prev) => [...prev, newFolder]);
    saveFirebaseCurriculumFolder(newFolder).catch((err) => console.warn("Firestore folder save warning:", err));
    setNewFolderName('');
    setNewFolderDesc('');
    setShowCreateFolderModal(false);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Created folder "${newFolder.name}"`, ...prev]);
  };

  // Helper to trigger AI analysis on batch items
  const processBatchAIForItems = async (itemsToAnalyze: BatchFileItem[]) => {
    if (itemsToAnalyze.length === 0) return;
    setIsProcessingBatchAI(true);

    for (const item of itemsToAnalyze) {
      // Mark item as analyzing
      setBatchFilesList((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, aiStatus: 'analyzing' } : it))
      );

      try {
        const res = await fetch('/api/gemini/analyze-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: item.rawName,
            fileDataUrl: item.dataUrl
          })
        });

        const data = await res.json();
        if (res.ok && data.success && data.data) {
          const { title, subject, category, materialType, standard, board, description } = data.data;

          setBatchFilesList((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    fileName: title?.trim() || it.fileName,
                    subject: subject?.trim() || it.subject,
                    category: ['pdf', 'video', 'audio', 'quiz', 'document', 'other'].includes(category)
                      ? (category as any)
                      : it.category,
                    materialType: ['notes', 'ebook', 'pyq', 'practice_questions', 'other'].includes(materialType)
                      ? (materialType as any)
                      : it.materialType || 'notes',
                    standard: STANDARD_OPTIONS.includes(standard) ? standard : it.standard,
                    board: INDIAN_BOARD_OPTIONS.includes(board) ? board : it.board,
                    description: description?.trim() || it.description,
                    aiStatus: 'done'
                  }
                : it
            )
          );

          setAuditLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] AI Analyzed batch item "${item.rawName}" -> Subject: ${subject || 'General'}, Std: ${standard || 'All'}, Board: ${board || 'State'}`,
            ...prev
          ]);
        } else {
          setBatchFilesList((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, aiStatus: 'error', aiError: data.message || 'AI Analysis Failed' }
                : it
            )
          );
        }
      } catch (err: any) {
        console.error("Batch AI analysis exception for file:", item.rawName, err);
        setBatchFilesList((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, aiStatus: 'error', aiError: 'Network or AI service error' }
              : it
          )
        );
      }
    }

    setIsProcessingBatchAI(false);
  };

  // Handle batch selection of multiple files
  const handleBatchFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newItems: BatchFileItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let cat: 'pdf' | 'video' | 'audio' | 'quiz' | 'document' | 'other' = 'pdf';
      if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) cat = 'video';
      else if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) cat = 'audio';
      else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) cat = 'document';
      else if (['zip', 'rar', '7z'].includes(ext)) cat = 'other';

      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

      // Read base64 data url if file size <= 15MB
      let dataUrl: string | undefined = undefined;
      if (file.size <= 15 * 1024 * 1024) {
        try {
          dataUrl = await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(file);
          });
        } catch {
          dataUrl = undefined;
        }
      }

      newItems.push({
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        rawName: file.name,
        fileName: cleanName,
        subject: 'General',
        category: cat,
        materialType: newFileMaterialType || 'notes',
        standard: newFileStandard || 'All Standards',
        board: newFileBoard || 'State Board',
        size: `${sizeMB} MB`,
        description: '',
        externalUrl: '',
        dataUrl,
        aiStatus: 'pending',
        expanded: files.length === 1
      });
    }

    setBatchFilesList((prev) => [...prev, ...newItems]);
    // Immediately process AI analysis for newly selected items
    processBatchAIForItems(newItems);
  };

  const updateBatchItem = (id: string, updates: Partial<BatchFileItem>) => {
    setBatchFilesList((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeBatchItem = (id: string) => {
    setBatchFilesList((prev) => prev.filter((item) => item.id !== id));
  };

  const reAnalyzeSingleItem = (item: BatchFileItem) => {
    processBatchAIForItems([item]);
  };

  const reAnalyzeAllBatchItems = () => {
    processBatchAIForItems(batchFilesList);
  };

  // Submit Batch Files
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFilesList.length === 0) {
      setFileUploadError("Please select at least one file to upload.");
      return;
    }

    setIsUploadingFile(true);
    setFileUploadError(null);

    try {
      const createdFiles: CurriculumFile[] = [];

      for (const item of batchFilesList) {
        const fileObj: CurriculumFile = {
          id: `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: item.fileName.trim() || item.rawName,
          folderId: newFileFolderId !== null ? newFileFolderId : currentFolderId,
          subject: item.subject.trim() || 'General',
          category: item.category,
          materialType: item.materialType || 'notes',
          standard: item.standard,
          board: item.board,
          size: item.size,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileDataUrl: item.dataUrl,
          externalUrl: item.externalUrl.trim() || undefined,
          description: item.description.trim() || undefined,
          isAdminUploaded: true,
          uploadedByRole: 'admin',
          isVisible: true,
          createdBy: adminUser?.mobile || 'admin'
        } as any;

        createdFiles.push(fileObj);

        // Save file payload to IndexedDB for offline persistence & localStorage cache
        if (item.dataUrl) {
          await saveFileLocal(fileObj.id, item.dataUrl);
          try {
            if (item.dataUrl.length < 2000000) {
              localStorage.setItem(`gramin_pdf_cache_${fileObj.id}`, item.dataUrl);
            }
          } catch (e) {
            console.warn("Failed to store PDF in localStorage cache:", e);
          }
        }

        // Save to Firestore asynchronously
        saveFirebaseCurriculumFile(fileObj).catch((err) => {
          console.warn("Firestore batch file save warning:", err);
        });
      }

      setCurriculumFiles((prev) => [...createdFiles, ...prev]);
      setAuditLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Batch uploaded ${createdFiles.length} file(s) with AI auto-metadata.`,
        ...prev
      ]);

      // Reset modal state
      setBatchFilesList([]);
      setNewFileName('');
      setNewFileExternalUrl('');
      setNewFileDesc('');
      setNewFileDataUrl(undefined);
      setShowUploadFileModal(false);
    } catch (err: any) {
      console.error("Error submitting batch upload:", err);
      setFileUploadError("Failed to upload batch files.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Function to call /api/gemini/analyze-file and auto-fill metadata
  const handleAnalyzeFileWithAI = async (overrideFileObj?: { name: string; dataUrl?: string }) => {
    const fileNameToAnalyze = overrideFileObj?.name || newFileName;
    const fileDataToAnalyze = overrideFileObj?.dataUrl || newFileDataUrl;

    if (!fileNameToAnalyze.trim()) {
      setFileUploadError("Please select a file or enter a filename first to analyze.");
      return;
    }

    setIsAnalyzingFile(true);
    setFileUploadError(null);
    setAiAutoAnalyzed(false);

    try {
      const res = await fetch('/api/gemini/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileNameToAnalyze,
          fileDataUrl: fileDataToAnalyze
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const { title, subject, category, standard, board, description } = data.data;

        if (title && title.trim()) setNewFileName(title.trim());
        if (subject && subject.trim()) setNewFileSubject(subject.trim());
        if (category && ['pdf', 'video', 'audio', 'quiz', 'document', 'other'].includes(category)) {
          setNewFileCategory(category as any);
        }
        if (standard && STANDARD_OPTIONS.includes(standard)) {
          setNewFileStandard(standard);
        }
        if (board && INDIAN_BOARD_OPTIONS.includes(board)) {
          setNewFileBoard(board);
        }
        if (description && description.trim()) {
          setNewFileDesc(description.trim());
        }

        setAiAutoAnalyzed(true);
        setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] AI auto-analyzed file "${fileNameToAnalyze}" -> Subject: ${subject || 'General'}, Standard: ${standard || 'All'}, Board: ${board || 'State'}`, ...prev]);
      } else {
        setFileUploadError(data.message || "Could not analyze file metadata with AI.");
      }
    } catch (err: any) {
      console.error("Error analyzing file with AI:", err);
      setFileUploadError("Failed to connect to AI File Analyzer service.");
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  // Handle local file selection
  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    setAiAutoAnalyzed(false);
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset old data URL first
    setNewFileDataUrl(undefined);

    const initialCleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!newFileName.trim()) {
      setNewFileName(initialCleanName);
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setNewFileSize(`${sizeInMB} MB`);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') setNewFileCategory('pdf');
    else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) setNewFileCategory('video');
    else if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) setNewFileCategory('audio');
    else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) setNewFileCategory('document');
    else if (['zip', 'rar', '7z'].includes(ext)) setNewFileCategory('other');

    if (file.size <= 15 * 1024 * 1024) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const dataUrl = reader.result;
            setNewFileDataUrl(dataUrl);
            // Trigger automatic AI analysis
            handleAnalyzeFileWithAI({ name: file.name, dataUrl });
          } else {
            handleAnalyzeFileWithAI({ name: file.name });
          }
        };
        reader.onerror = (err) => {
          console.warn("FileReader error:", err);
          handleAnalyzeFileWithAI({ name: file.name });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("FileReader exception:", err);
        handleAnalyzeFileWithAI({ name: file.name });
      }
    } else {
      setFileUploadError(`Note: File size (${sizeInMB} MB) is large. File metadata recorded successfully.`);
      handleAnalyzeFileWithAI({ name: file.name });
    }
  };

  // Upload/Save file
  const handleAddFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setIsUploadingFile(true);
    setFileUploadError(null);

    try {
      const newFile: CurriculumFile = {
        id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: newFileName.trim(),
        folderId: newFileFolderId !== null ? newFileFolderId : currentFolderId,
        subject: newFileSubject.trim() || 'General',
        category: newFileCategory,
        standard: newFileStandard,
        board: newFileBoard,
        size: newFileSize || '1.0 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: newFileDataUrl,
        externalUrl: newFileExternalUrl.trim() || undefined,
        description: newFileDesc.trim() || undefined,
        isAdminUploaded: true,
        uploadedByRole: 'admin',
        isVisible: true,
        createdBy: adminUser?.mobile || 'admin'
      } as any;

      // Save file payload to IndexedDB for offline persistence & localStorage cache
      if (newFileDataUrl) {
        await saveFileLocal(newFile.id, newFileDataUrl);
        try {
          if (newFileDataUrl.length < 2000000) {
            localStorage.setItem(`gramin_pdf_cache_${newFile.id}`, newFileDataUrl);
          }
        } catch (e) {
          console.warn("Failed to store PDF in localStorage cache:", e);
        }
      }

      setCurriculumFiles((prev) => [newFile, ...prev]);

      // Save to Firestore asynchronously
      saveFirebaseCurriculumFile(newFile).catch((err) => {
        console.warn("Firestore file save warning:", err);
      });

      setNewFileName('');
      setNewFileExternalUrl('');
      setNewFileDesc('');
      setNewFileDataUrl(undefined);
      setShowUploadFileModal(false);
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Saved file "${newFile.name}"`, ...prev]);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setFileUploadError(err?.message || "Failed to save file. Please check input parameters.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Delete folder recursively
  const handleDeleteFolder = async (folderId: string) => {
    const folder = curriculumFolders.find((f) => f.id === folderId);
    if (!folder) return;

    const getDescendantFolderIds = (id: string): string[] => {
      const children = curriculumFolders.filter((f) => f.parentId === id).map((f) => f.id);
      return [id, ...children.flatMap(getDescendantFolderIds)];
    };

    const idsToDelete = getDescendantFolderIds(folderId);
    const filesToDelete = curriculumFiles.filter((f) => f.folderId && idsToDelete.includes(f.folderId));

    try {
      const deletedFileIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_file_ids_v1') || '[]'); } catch { return []; }
      })();
      const deletedFolderIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_folder_ids_v1') || '[]'); } catch { return []; }
      })();

      filesToDelete.forEach((f) => {
        if (!deletedFileIds.includes(f.id)) deletedFileIds.push(f.id);
      });
      idsToDelete.forEach((id) => {
        if (!deletedFolderIds.includes(id)) deletedFolderIds.push(id);
      });

      localStorage.setItem('gramin_deleted_file_ids_v1', JSON.stringify(deletedFileIds));
      localStorage.setItem('gramin_deleted_folder_ids_v1', JSON.stringify(deletedFolderIds));

      setCurriculumFolders((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      setCurriculumFiles((prev) => prev.filter((f) => !f.folderId || !idsToDelete.includes(f.folderId)));

      const remainingFiles = curriculumFiles.filter((f) => !f.folderId || !idsToDelete.includes(f.folderId));
      localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(remainingFiles));

      const remainingFolders = curriculumFolders.filter((f) => !idsToDelete.includes(f.id));
      localStorage.setItem('gramin_curriculum_folders_v2', JSON.stringify(remainingFolders));

      for (const id of idsToDelete) {
        await deleteFirebaseCurriculumFolder(id).catch((err) => console.warn("Firestore delete folder error:", err));
      }
      for (const file of filesToDelete) {
        await deleteFirebaseCurriculumFile(file.id).catch((err) => console.warn("Firestore delete file error:", err));
        await deleteFileLocal(file.id).catch((err) => console.warn("IndexedDB delete file error:", err));
      }
    } catch (e) {
      console.warn("Error cleaning up deleted folder contents:", e);
    }

    if (currentFolderId && idsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(folder.parentId);
    }
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Deleted folder "${folder.name}" and all contents`, ...prev]);
  };

  // Rename folder
  const handleRenameFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolder || !renamedFolderName.trim()) return;

    const updated = { ...renamingFolder, name: renamedFolderName.trim() };
    setCurriculumFolders((prev) =>
      prev.map((f) => (f.id === renamingFolder.id ? updated : f))
    );
    saveFirebaseCurriculumFolder(updated).catch((err) => console.warn("Firestore rename error:", err));
    setRenamingFolder(null);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Renamed folder to "${renamedFolderName.trim()}"`, ...prev]);
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    const file = curriculumFiles.find((f) => f.id === fileId);
    if (!file) return;

    try {
      const deletedFileIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_file_ids_v1') || '[]'); } catch { return []; }
      })();
      if (!deletedFileIds.includes(fileId)) {
        deletedFileIds.push(fileId);
        localStorage.setItem('gramin_deleted_file_ids_v1', JSON.stringify(deletedFileIds));
      }

      const deletedFileIds2: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_curriculum_deleted_files_v2') || '[]'); } catch { return []; }
      })();
      if (!deletedFileIds2.includes(fileId)) {
        deletedFileIds2.push(fileId);
        localStorage.setItem('gramin_curriculum_deleted_files_v2', JSON.stringify(deletedFileIds2));
      }

      const updatedFiles = curriculumFiles.filter((f) => f.id !== fileId);
      setCurriculumFiles(updatedFiles);
      try {
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(updatedFiles));
      } catch (e) {
        console.warn("Failed to update localStorage after delete:", e);
      }
      await deleteFirebaseCurriculumFile(fileId);
      await deleteFileLocal(fileId).catch((err) => console.warn("IndexedDB delete file error:", err));
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Deleted file "${file.name}"`, ...prev]);
    } catch (err: any) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file. Please check connection.");
    }
  };

  const handleBulkDeleteFiles = async () => {
    if (selectedFileIds.length === 0) return;

    try {
      const idsToDelete = [...selectedFileIds];

      const deletedFileIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_file_ids_v1') || '[]'); } catch { return []; }
      })();
      const deletedFileIds2: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_curriculum_deleted_files_v2') || '[]'); } catch { return []; }
      })();

      idsToDelete.forEach((id) => {
        if (!deletedFileIds.includes(id)) {
          deletedFileIds.push(id);
        }
        if (!deletedFileIds2.includes(id)) {
          deletedFileIds2.push(id);
        }
      });
      localStorage.setItem('gramin_deleted_file_ids_v1', JSON.stringify(deletedFileIds));
      localStorage.setItem('gramin_curriculum_deleted_files_v2', JSON.stringify(deletedFileIds2));

      const updatedFiles = curriculumFiles.filter((f) => !idsToDelete.includes(f.id));
      setCurriculumFiles(updatedFiles);
      try {
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(updatedFiles));
      } catch (e) {
        console.warn("Failed to update localStorage after bulk delete:", e);
      }

      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Bulk deleted ${idsToDelete.length} files`, ...prev]);
      setSelectedFileIds([]);
      setShowBulkDeleteModal(false);

      for (const id of idsToDelete) {
        deleteFirebaseCurriculumFile(id).catch((err) => console.warn("Firestore bulk delete file error:", err));
        deleteFileLocal(id).catch((err) => console.warn("IndexedDB delete file error:", err));
      }
    } catch (err: any) {
      console.error("Error bulk deleting files:", err);
      setShowBulkDeleteModal(false);
    }
  };

  const handleBulkCategorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFileIds.length === 0) return;

    try {
      const updatedFiles = curriculumFiles.map((f) => {
        if (selectedFileIds.includes(f.id)) {
          const updated = { ...f, category: bulkCategory, subject: bulkSubject };
          saveFirebaseCurriculumFile(updated).catch((err) => console.warn("Firestore bulk categorize error:", err));
          return updated;
        }
        return f;
      });

      setCurriculumFiles(updatedFiles);
      try {
        localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(updatedFiles));
      } catch (e) {
        console.warn("Failed to update localStorage after bulk categorize:", e);
      }

      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Bulk re-categorized ${selectedFileIds.length} files to ${bulkCategory} / ${bulkSubject}`, ...prev]);
      setSelectedFileIds([]);
      setShowBulkCategorizeModal(false);
    } catch (err: any) {
      console.error("Error bulk categorizing files:", err);
      alert("Failed to update selected files.");
    }
  };

  // Move file
  const handleMoveFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMoveFile) return;

    const updated = { ...selectedMoveFile, folderId: targetMoveFolderId };
    setCurriculumFiles((prev) =>
      prev.map((f) => (f.id === selectedMoveFile.id ? updated : f))
    );
    saveFirebaseCurriculumFile(updated).catch((err) => console.warn("Firestore move file error:", err));
    setSelectedMoveFile(null);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Moved file "${selectedMoveFile.name}"`, ...prev]);
  };

  // Toggle student visibility
  const handleToggleVisibility = (file: CurriculumFile) => {
    const updated: CurriculumFile = {
      ...file,
      isVisible: file.isVisible === false ? true : false
    };
    setCurriculumFiles((prev) => prev.map((f) => (f.id === file.id ? updated : f)));
    saveFirebaseCurriculumFile(updated).catch((err) => console.warn("Firestore visibility update error:", err));
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Toggled visibility for file "${updated.name}" to ${updated.isVisible !== false ? 'Visible' : 'Hidden'}`, ...prev]);
  };

  // Edit file details
  const handleStartEditFile = (file: CurriculumFile) => {
    setEditingFile(file);
    setEditingFileName(file.name);
    setEditingFileSubject(file.subject);
    setEditingFileCategory(file.category);
    setEditingFileStandard(file.standard || 'All Standards');
    setEditingFileBoard(file.board || 'State Board');
    setEditingFileFolderId(file.folderId);
    setEditingFileDescription(file.description || '');
    setEditingFileExternalUrl(file.externalUrl || '');
    setEditingFileIsVisible(file.isVisible !== false);
  };

  const handleEditFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    const updatedFile: CurriculumFile = {
      ...editingFile,
      name: editingFileName.trim(),
      subject: editingFileSubject.trim() || 'General',
      category: editingFileCategory,
      standard: editingFileStandard,
      board: editingFileBoard,
      folderId: editingFileFolderId,
      description: editingFileDescription.trim(),
      externalUrl: editingFileExternalUrl.trim() || undefined,
      isVisible: editingFileIsVisible,
    };

    setCurriculumFiles((prev) =>
      prev.map((f) => (f.id === editingFile.id ? updatedFile : f))
    );

    saveFirebaseCurriculumFile(updatedFile).catch((err) => console.warn("Firestore edit file error:", err));
    setEditingFile(null);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Updated details for file "${updatedFile.name}"`, ...prev]);
  };

  // Download file
  const handleDownloadFile = async (file: CurriculumFile) => {
    // Check if this is an AI-generated PDF or has full markdown text content
    const isAi = (file as any).isAiGenerated || !!(file as any).fullContent || (file as any).generatedText || file.id?.startsWith('gen-pdf-');
    if (isAi) {
      const textToExport = (file as any).fullContent || (file as any).generatedText || file.description || file.name;
      await downloadSmartReaderPdf(
        file.name.replace(/\.pdf$/i, ''),
        file.subject || 'Study Material',
        'Student Edition',
        adminLang?.toUpperCase() || 'English',
        textToExport,
        'Smart Reader Study Guide'
      );
      return;
    }

    let fileDataUrl = file.fileDataUrl;

    // Check IndexedDB if the memory state does not have it (due to page reload or size quota)
    if (!fileDataUrl) {
      fileDataUrl = await getFileLocal(file.id) || undefined;
    }

    if (!fileDataUrl) {
      const remoteUrl = await getFirebaseCurriculumFileDataUrl(file.id);
      if (remoteUrl) {
        fileDataUrl = remoteUrl;
        await saveFileLocal(file.id, remoteUrl);
      }
    }

    if (fileDataUrl && fileDataUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fileDataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (file.externalUrl) {
      window.open(file.externalUrl, '_blank');
      return;
    }

    // Generate a formatted PDF/document Blob for device download
    const cleanFileName = file.name.replace(/[^\w\s.-]/gi, '');
    const isPdf = file.category === 'pdf' || cleanFileName.toLowerCase().endsWith('.pdf');
    const pdfDocContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 300 >>
stream
BT
/F1 16 Tf
50 720 Td
(${cleanFileName}) Tj
/F1 12 Tf
0 -30 Td
(Subject: ${file.subject}) Tj
0 -20 Td
(Grade / Standard: ${file.standard || 'All Standards'}) Tj
0 -20 Td
(Board: ${file.board || 'State / CBSE Board'}) Tj
0 -20 Td
(Category: ${file.category}) Tj
0 -30 Td
(Description: ${file.description || 'Gramin Shiksha Offline Curriculum File'}) Tj
0 -30 Td
(Uploaded: ${file.uploadedAt}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000250 00000 n 
0000000600 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
670
%%EOF`;

    const mimeType = isPdf ? 'application/pdf' : 'text/plain';
    const blob = new Blob([pdfDocContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isPdf ? (cleanFileName.endsWith('.pdf') ? cleanFileName : `${cleanFileName}.pdf`) : `${cleanFileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Load all certificates from Firestore
  const fetchCertificates = async () => {
    setIsLoadingCerts(true);
    try {
      const data = await getAllFirebaseCertificates();
      const deletedCertIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_cert_ids_v1') || '[]'); } catch { return []; }
      })();
      const validCerts = (data || []).filter((c) => !deletedCertIds.includes(c.id));
      setCertificates(validCerts);
    } catch (e) {
      console.error("Failed to load certificates from Firestore:", e);
    } finally {
      setIsLoadingCerts(false);
    }
  };

  // Load all users from Firestore
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getAllFirebaseUsers();
      const deletedMobiles: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_user_mobiles_v1') || '[]'); } catch { return []; }
      })();
      const remoteUsers = (data || []).filter((u) => !deletedMobiles.includes(u.mobile));

      if (remoteUsers && remoteUsers.length > 0) {
        setUsersList(remoteUsers);
      } else {
        // Mock fallback list if offline or empty
        const fallbackUsers: User[] = ([
          { mobile: adminUser.mobile, name: adminUser.name, defaultLanguage: 'en', role: 'admin', signupDate: '2026-01-01', village: 'HQ', streakDays: 99, totalPoints: 5000, studyMins: 1200 },
          { mobile: '9876543210', name: 'Aarav Patel', defaultLanguage: 'hi' as LanguageCode, role: 'student', signupDate: '2026-06-15', village: 'Anand', school: 'Govt School Anand', standard: 'Std 8', streakDays: 14, totalPoints: 420, studyMins: 380 },
          { mobile: '9812345678', name: 'Priya Sharma', defaultLanguage: 'gu' as LanguageCode, role: 'student', signupDate: '2026-07-02', village: 'Mehsana', school: 'Adarsh Primary School', standard: 'Std 9', streakDays: 8, totalPoints: 310, studyMins: 290 },
          { mobile: '9765432109', name: 'Ramesh Patel', defaultLanguage: 'gu' as LanguageCode, role: 'teacher', signupDate: '2026-05-10', village: 'Mehsana', school: 'Adarsh Primary School', standard: 'Teacher', streakDays: 25, totalPoints: 890, studyMins: 950 }
        ] as User[]).filter((u) => !deletedMobiles.includes(u.mobile));
        setUsersList(fallbackUsers as any);
      }
    } catch (e) {
      console.error("Failed to load users for admin:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load curriculum folders and files from Firestore
  const fetchCurriculum = async () => {
    try {
      const [remoteFolders, remoteFiles] = await Promise.all([
        getAllFirebaseCurriculumFolders(),
        getAllFirebaseCurriculumFiles()
      ]);

      const deletedFileIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_file_ids_v1') || '[]'); } catch { return []; }
      })();



      const deletedFolderIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_folder_ids_v1') || '[]'); } catch { return []; }
      })();

      if (remoteFolders && remoteFolders.length > 0) {
        const filteredFolders = (remoteFolders as any[]).filter((f) => !deletedFolderIds.includes(f.id));
        setCurriculumFolders((prev) => {
          const map = new Map<string, CurriculumFolder>(prev.map((f) => [f.id, f]));
          filteredFolders.forEach((rf) => map.set(rf.id, rf as CurriculumFolder));
          return Array.from(map.values()).filter((f) => !deletedFolderIds.includes(f.id));
        });
      }
      if (remoteFiles && remoteFiles.length > 0) {
        (remoteFiles as any[]).forEach((rf) => {
          if (rf.isDeleted === true && !deletedFileIds.includes(rf.id)) {
            deletedFileIds.push(rf.id);
          }
        });
        const filteredFiles = (remoteFiles as any[]).filter((f) => !deletedFileIds.includes(f.id) && f.isDeleted !== true);
        setCurriculumFiles((prev) => {
          const map = new Map<string, CurriculumFile>(prev.map((f) => [f.id, f]));
          filteredFiles.forEach((rf: any) => {
            if (deletedFileIds.includes(rf.id) || rf.isDeleted === true) {
              map.delete(rf.id);
              return;
            }
            const existing = map.get(rf.id);
            // Preserve local fileDataUrl if remote is missing base64 payload
            if (existing && existing.fileDataUrl && !rf.fileDataUrl) {
              map.set(rf.id, { ...(rf as CurriculumFile), fileDataUrl: existing.fileDataUrl });
            } else {
              map.set(rf.id, rf as CurriculumFile);
            }
          });
          return Array.from(map.values()).filter((f) => !deletedFileIds.includes(f.id) && (f as any).isDeleted !== true);
        });
      }
    } catch (e) {
      console.warn("Failed to load curriculum from Firestore:", e);
    }
  };

  const handleSyncAllData = async () => {
    await Promise.all([fetchUsers(), fetchCertificates(), fetchCurriculum()]);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Synchronized live data from Firestore`, ...prev]);
  };

  useEffect(() => {
    fetchUsers();
    fetchCertificates();
    fetchCurriculum();
  }, []);

  // Handle role change
  const handleRoleChange = async (targetMobile: string, newRole: 'student' | 'teacher' | 'admin') => {
    try {
      await updateUserRole(targetMobile, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.mobile === targetMobile ? { ...u, role: newRole } : u))
      );
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] User ${targetMobile} role changed to ${newRole}`, ...prev]);
    } catch (e) {
      alert("Failed to update user role");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (targetMobile: string) => {
    try {
      const deletedMobiles: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_user_mobiles_v1') || '[]'); } catch { return []; }
      })();
      if (!deletedMobiles.includes(targetMobile)) {
        deletedMobiles.push(targetMobile);
        localStorage.setItem('gramin_deleted_user_mobiles_v1', JSON.stringify(deletedMobiles));
      }

      setUsersList((prev) => prev.filter((u) => u.mobile !== targetMobile));
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] User account ${targetMobile} deleted`, ...prev]);

      await deleteFirebaseUser(targetMobile).catch((err) => console.warn("Firestore delete user error:", err));
    } catch (e) {
      console.error("Error deleting user:", e);
    }
  };

  // Issue new certificate in Firestore
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertStudent.trim() || !newCertMobile.trim()) return;

    const newCert: FirestoreCertificate = {
      id: `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: newCertStudent.trim(),
      studentMobile: newCertMobile.trim(),
      title: newCertTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      score: 100,
      status: 'valid',
      issuedBy: 'Admin Console'
    };

    try {
      await issueFirebaseCertificate(newCert);
      setCertificates((prev) => [newCert, ...prev]);
      setNewCertStudent('');
      setNewCertMobile('');
      setShowIssueCertModal(false);
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Certificate ${newCert.id} issued in Firestore to ${newCert.studentName}`, ...prev]);
    } catch (err) {
      alert("Failed to issue certificate in Firestore database");
    }
  };

  // Revoke/Reactivate certificate in Firestore
  const handleToggleCertStatus = async (id: string) => {
    const targetCert = certificates.find((c) => c.id === id);
    if (!targetCert) return;

    const nextStatus = targetCert.status === 'valid' ? 'revoked' : 'valid';
    try {
      await updateFirebaseCertificateStatus(id, nextStatus, targetCert.studentMobile);
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
      );
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Certificate ${id} status updated to ${nextStatus}`, ...prev]);
    } catch (err) {
      alert("Failed to update certificate status in Firestore");
    }
  };

  // Delete certificate from Firestore
  const handleDeleteCertificate = async (id: string) => {
    try {
      const deletedCertIds: string[] = (() => {
        try { return JSON.parse(localStorage.getItem('gramin_deleted_cert_ids_v1') || '[]'); } catch { return []; }
      })();
      if (!deletedCertIds.includes(id)) {
        deletedCertIds.push(id);
        localStorage.setItem('gramin_deleted_cert_ids_v1', JSON.stringify(deletedCertIds));
      }

      setCertificates((prev) => prev.filter((c) => c.id !== id));
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Certificate ${id} deleted`, ...prev]);

      await deleteFirebaseCertificate(id).catch((err) => console.warn("Firestore delete cert error:", err));
    } catch (err) {
      console.error("Error deleting certificate:", err);
    }
  };

  // Search/Verify single certificate
  const handleVerifyCertificate = () => {
    if (!certSearch.trim()) {
      setVerificationResult(null);
      return;
    }
    const query = certSearch.trim().toLowerCase();
    const found = certificates.find(
      (c) => c.id.toLowerCase() === query || c.studentMobile.includes(query) || c.studentName.toLowerCase().includes(query)
    );
    setVerificationResult(found || 'not_found');
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.mobile.includes(userSearch) ||
      (u.village && u.village.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.school && u.school.toLowerCase().includes(userSearch.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || (u.role || 'student') === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate high-level analytics
  const totalStudents = usersList.filter((u) => (u.role || 'student') === 'student').length || usersList.length;
  const totalTeachers = usersList.filter((u) => u.role === 'teacher').length;
  const totalStudyMinsAll = usersList.reduce((acc, u) => acc + (u.studyMins || 0), 0);
  const totalPointsAll = usersList.reduce((acc, u) => acc + (u.totalPoints || 0), 0);

  // Dynamic Rural Village Hub Activity aggregated directly from Firestore users database
  const villageHubStats = useMemo(() => {
    if (!usersList || usersList.length === 0) return [];

    const map: Record<string, { name: string; count: number; activeCount: number; totalXP: number }> = {};

    usersList.forEach((u) => {
      let hubName = 'General Village Hub';
      if (u.village && u.village.trim().length > 0) {
        const v = u.village.trim();
        hubName = v.toLowerCase().includes('hub') || v.toLowerCase().includes('school') || v.toLowerCase().includes('classroom')
          ? v
          : `${v} Hub`;
      } else if (u.school && u.school.trim().length > 0) {
        hubName = u.school.trim();
      }

      if (!map[hubName]) {
        map[hubName] = { name: hubName, count: 0, activeCount: 0, totalXP: 0 };
      }

      map[hubName].count += 1;
      const isActive = (u.streakDays && u.streakDays > 0) || (u.totalPoints && u.totalPoints > 0) || (u.studyMins && u.studyMins > 0);
      if (isActive) {
        map[hubName].activeCount += 1;
      }
      map[hubName].totalXP += u.totalPoints || 0;
    });

    const result = Object.values(map).map((item) => {
      const pctVal = item.count > 0 ? Math.min(100, Math.max(15, Math.round((item.activeCount / item.count) * 100))) : 0;
      return {
        name: item.name,
        count: item.count,
        pct: `${pctVal}%`,
        totalXP: item.totalXP
      };
    });

    result.sort((a, b) => b.count - a.count || b.totalXP - a.totalXP);
    return result;
  }, [usersList]);

  const adminNavItems = [
    { id: 'analytics' as const, label: t.navAnalytics, icon: BarChart3, color: 'text-amber-600 bg-amber-50', activeIconColor: 'text-amber-400' },
    { id: 'content' as const, label: t.navContent, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50', activeIconColor: 'text-emerald-400' },
    { id: 'certificates' as const, label: t.navCertificates, icon: Award, color: 'text-amber-600 bg-amber-50', activeIconColor: 'text-amber-400' },
    { id: 'users' as const, label: t.navUsers, icon: Users, color: 'text-indigo-600 bg-indigo-50', activeIconColor: 'text-indigo-400' },
    { id: 'settings' as const, label: t.navSettings, icon: Settings, color: 'text-slate-600 bg-slate-100', activeIconColor: 'text-slate-300' },
  ];

  const currentAdminNavItem = adminNavItems.find(item => item.id === activeTab) || adminNavItems[0];
  const CurrentAdminNavIcon = currentAdminNavItem.icon;

  return (
    <div className="space-y-6 pb-24 lg:pb-12 animate-fade-in">
      
      {/* Top Banner & Control Status Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="p-2.5 sm:p-3 bg-amber-500/20 border border-amber-400/30 rounded-2xl text-amber-400 shrink-0">
            <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight leading-snug">
                {t.dashboardTitle}
              </h1>
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap inline-flex items-center">
                {t.superAdminBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t.loggedInAs} <strong className="text-amber-300">{adminUser.name}</strong> <span className="text-slate-500 font-mono">({adminUser.mobile})</span> • {t.stateOps}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          {/* Admin Language Selector */}
          {/*<div className="relative inline-block text-left">
            <select
              value={adminLang}
              onChange={(e) => setAdminLang(e.target.value as LanguageCode)}
              className="w-full pl-3 pr-8 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs rounded-xl border border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/40 appearance-none transition-all shadow-xs"
              title="Select Admin Language"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 pointer-events-none" />
          </div>*/}

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>{t.downloadAnalytics}</span>
          </button>

          <button
            onClick={handleSyncAllData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isLoadingUsers || isLoadingCerts ? 'animate-spin' : ''}`} />
            <span>{t.syncLiveData}</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 cursor-pointer transition-all flex items-center justify-center whitespace-nowrap"
          >
            {t.exitAdmin}
          </button>
        </div>
      </div>

      {/* TOP TAB CONTROLS & MOBILE HORIZONTAL QUICK SCROLL DOCK */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5">
        {/* Header Row: Current active tab display */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{t.currentModule}</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate flex items-center gap-1.5">
              <CurrentAdminNavIcon className="h-4 w-4 text-amber-500" />
              {currentAdminNavItem.label}
            </span>
          </div>

          <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60 shrink-0">
            {adminNavItems.length} {t.adminModulesCount}
          </div>
        </div>

        {/* Clean Horizontal Quick Pills on Mobile & Tablet / Symmetrical 5-Col Grid on Desktop */}
        <div className="flex overflow-x-auto gap-2 pb-1 pt-0.5 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-5 md:gap-2">
          {adminNavItems.map(item => {
            const IconComp = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`p-2.5 px-3.5 rounded-xl font-sans text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all duration-150 cursor-pointer border text-left shrink-0 md:justify-center ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/90 hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : item.color}`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STUDENT ANALYTICS & PROGRESS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">

          {/* Unified Executive Analytics & Custom Date Filter Control Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 text-white space-y-4">
            {/* Card Header: Title & Direct Downloads */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
                      {t.analyticsTitle}
                    </h2>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 whitespace-nowrap inline-flex items-center">
                      {getDateFilterLabel()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {t.analyticsSubtitle}
                  </p>
                </div>
              </div>

              {/* Direct Quick Downloads */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
                <button
                  onClick={() => handleExportMasterPDF(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title={`Download PDF report for ${getDateFilterLabel()}`}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.pdfReport}</span>
                </button>
                <button
                  onClick={() => handleExportMasterExcel(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title={`Download Excel spreadsheet for ${getDateFilterLabel()}`}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.excelExport}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>{t.allFormats}</span>
                </button>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-slate-800/80 pt-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              {/* Filter Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3 text-amber-400" />
                  {t.filterRange}
                </span>

                {/* Sleek Segmented Mode Switcher */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      analyticsFilterMode === 'all'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t.allTime}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('year')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      analyticsFilterMode === 'year'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t.year}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('month')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      analyticsFilterMode === 'month'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {t.month}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('custom')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      analyticsFilterMode === 'custom'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {/* Dynamic Connected Dropdowns & Inputs */}
                {analyticsFilterMode === 'year' && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <AdminCustomSelect
                      value={analyticsYear}
                      onChange={setAnalyticsYear}
                      options={['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => ({
                        value: y,
                        label: `${y} Academic Year`,
                      }))}
                      dark
                      className="w-44"
                    />
                  </div>
                )}

                {analyticsFilterMode === 'month' && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <AdminCustomSelect
                      value={analyticsMonth.split('-')[1] || '08'}
                      onChange={(val) => {
                        const currentY = analyticsMonth.split('-')[0] || analyticsYear || '2026';
                        setAnalyticsMonth(`${currentY}-${val}`);
                      }}
                      options={[
                        { value: '01', label: 'January' },
                        { value: '02', label: 'February' },
                        { value: '03', label: 'March' },
                        { value: '04', label: 'April' },
                        { value: '05', label: 'May' },
                        { value: '06', label: 'June' },
                        { value: '07', label: 'July' },
                        { value: '08', label: 'August' },
                        { value: '09', label: 'September' },
                        { value: '10', label: 'October' },
                        { value: '11', label: 'November' },
                        { value: '12', label: 'December' },
                      ]}
                      dark
                      className="w-36"
                    />

                    <AdminCustomSelect
                      value={analyticsMonth.split('-')[0] || '2026'}
                      onChange={(val) => {
                        const currentM = analyticsMonth.split('-')[1] || '08';
                        setAnalyticsMonth(`${val}-${currentM}`);
                      }}
                      options={['2026', '2025', '2024', '2023', '2022']}
                      dark
                      className="w-28"
                    />
                  </div>
                )}

                {analyticsFilterMode === 'custom' && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px]">From:</span>
                      <input
                        type="date"
                        value={analyticsStartDate}
                        onChange={(e) => setAnalyticsStartDate(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono text-xs cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px]">To:</span>
                      <input
                        type="date"
                        value={analyticsEndDate}
                        onChange={(e) => setAnalyticsEndDate(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono text-xs cursor-pointer"
                      />
                    </div>
                    {(analyticsStartDate || analyticsEndDate) && (
                      <button
                        type="button"
                        onClick={() => { setAnalyticsStartDate(''); setAnalyticsEndDate(''); }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Matched Dataset Count Indicator */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 shrink-0">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.matchedCount} <strong className="text-white">{filteredUsersList.length}</strong> {t.studentsCount} • <strong className="text-white">{filteredCertificates.length}</strong> {t.certsCount}</span>
              </div>
            </div>
          </div>
          
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalStudents}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredTotalStudents}</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" /> {analyticsFilterMode !== 'all' ? `Filtered (${getDateFilterLabel()})` : t.thisMonthTrend}
                </span>
              </div>
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.lessonsCompleted}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{(filteredTotalStudyMins / 60).toFixed(1)} hrs</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" /> ~{filteredTotalStudyMins} {t.totalMinutesText}
                </span>
              </div>
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalXP}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredTotalPoints > 0 ? (88.5 + (filteredTotalPoints % 7) * 0.5).toFixed(1) + '%' : '91.4%'}</h3>
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-1">
                  <Award className="h-3 w-3" /> {filteredTotalPoints} {t.xpAwardedText}
                </span>
              </div>
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Regional Village Performance & Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Village Distribution Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Radio className="h-4 w-4 text-amber-500" />
                  {t.ruralHubTitle}
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  {analyticsFilterMode !== 'all' ? getDateFilterLabel() : t.liveFirestoreBadge}
                </span>
              </div>

              {isLoadingUsers ? (
                <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
                  <span>Loading village hub metrics from Firestore...</span>
                </div>
              ) : filteredVillageHubStats.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  No village hub user data recorded for period: <strong className="text-slate-800">{getDateFilterLabel()}</strong>.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVillageHubStats.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{item.name} ({item.count} student{item.count > 1 ? 's' : ''})</span>
                        <span className="text-amber-600 font-mono">{item.pct} {t.engagementText}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: item.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performing Leaderboard Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  {t.topPerformersTitle}
                </h3>
                <span className="text-xs text-emerald-600 font-bold">{t.xpAndStreaks}</span>
              </div>

              {filteredUsersList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  No student performance records found for period: <strong className="text-slate-800">{getDateFilterLabel()}</strong>.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredUsersList.slice(0, 5).map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-[10px]">
                          #{i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500">{u.village || 'Village Hub'} • {u.standard || 'Std 8'}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-amber-600">{u.totalPoints || 100} XP</div>
                        <div className="text-[10px] text-slate-500">🔥 {u.streakDays || 1} {t.dayStreakText}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CONTENT & CURRICULUM MANAGEMENT (FOLDER STRUCTURE) */}
      {activeTab === 'content' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-3xs space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-amber-500" />
                {t.repositoryTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create custom folders for classes and subjects, organize files into subfolders, and store offline study materials.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <FolderPlus className="h-4 w-4 text-amber-400" />
                <span>{t.createFolder}</span>
              </button>

              <button
                onClick={() => setShowUploadFileModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Upload className="h-4 w-4" />
                <span>{t.uploadFile}</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation & Filters */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap font-medium text-slate-700">
              {currentFolderId !== null && (
                <button
                  onClick={() => {
                    const currentFolder = curriculumFolders.find((f) => f.id === currentFolderId);
                    setCurrentFolderId(currentFolder ? currentFolder.parentId : null);
                  }}
                  className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer flex items-center gap-1 mr-1"
                  title="Go Up One Level"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Back</span>
                </button>
              )}

              <button
                onClick={() => setCurrentFolderId(null)}
                className={`flex items-center gap-1 cursor-pointer font-bold ${
                  currentFolderId === null ? 'text-amber-600 font-mono' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Folder className="h-4 w-4 text-amber-500" />
                <span>{t.rootFolder}</span>
              </button>

              {getBreadcrumbs().map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`cursor-pointer font-bold ${
                      crumb.id === currentFolderId ? 'text-amber-600 font-mono' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto items-center">
              <div className="relative md:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  placeholder={t.searchLibraryPlaceholder}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans shadow-3xs"
                />
              </div>

              <AdminCustomSelect
                value={contentCategoryFilter}
                onChange={setContentCategoryFilter}
                options={[
                  { value: 'all', label: t.allTypes },
                  { value: 'pdf', label: t.pdfNotes },
                  { value: 'video', label: t.videosCategory },
                  { value: 'audio', label: t.audioCategory },
                  { value: 'quiz', label: t.quizzesCategory },
                  { value: 'document', label: t.documentsCategory },
                ]}
                className="w-36 md:w-44"
              />
            </div>
          </div>

          {/* Current Level Folders & Files Rendering */}
          {(() => {
            const visibleFolders = curriculumFolders.filter((f) => {
              const inCurrent = f.parentId === currentFolderId;
              const matchesSearch = !contentSearch || f.name.toLowerCase().includes(contentSearch.toLowerCase());
              return inCurrent && matchesSearch;
            });

            const visibleFiles = curriculumFiles.filter((f) => {
              const inCurrent = f.folderId === currentFolderId;
              const matchesSearch = !contentSearch || f.name.toLowerCase().includes(contentSearch.toLowerCase()) || f.subject.toLowerCase().includes(contentSearch.toLowerCase());
              const matchesCategory = contentCategoryFilter === 'all' || f.category === contentCategoryFilter;
              return inCurrent && matchesSearch && matchesCategory;
            }).sort((a, b) => {
              const timeA = Date.parse(a.uploadedAt || '1970-01-01') || 0;
              const timeB = Date.parse(b.uploadedAt || '1970-01-01') || 0;
              if (timeA !== timeB) return timeB - timeA;
              return a.name.localeCompare(b.name);
            });

            const totalFoldersCount = curriculumFolders.length;
            const totalFilesCount = curriculumFiles.length;

            if (totalFoldersCount === 0 && totalFilesCount === 0) {
              return (
                <div className="py-12 px-6 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                    <FolderTree className="h-8 w-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-slate-900 text-base">Curriculum Library is Empty</h3>
                    <p className="text-xs text-slate-500">
                      No folders or files have been added yet. Create your first folder structure (e.g. Class 10 &gt; Mathematics) or upload study files directly to get started.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FolderPlus className="h-4 w-4 text-amber-400" />
                      <span>Create First Folder</span>
                    </button>
                    <button
                      onClick={() => setShowUploadFileModal(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>
              );
            }

            if (visibleFolders.length === 0 && visibleFiles.length === 0) {
              return (
                <div className="py-10 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <FolderOpen className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">
                    This folder is empty or no items match your search filter.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Add Subfolder
                    </button>
                    <button
                      onClick={() => setShowUploadFileModal(true)}
                      className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Add File Here
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Folders Section */}
                {visibleFolders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span>Folders ({visibleFolders.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {visibleFolders.map((folder) => {
                        const { subFolderCount, fileCount } = getFolderItemCount(folder.id);
                        return (
                          <div
                            key={folder.id}
                            className="group relative bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/80 hover:border-amber-300 p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-3xs"
                            onClick={() => setCurrentFolderId(folder.id)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
                                <Folder className="h-6 w-6 fill-amber-500 text-amber-600" />
                              </div>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setRenamingFolder(folder);
                                    setRenamedFolderName(folder.name);
                                  }}
                                  className="p-1 hover:bg-amber-200/60 text-slate-600 rounded-md transition-colors"
                                  title="Rename Folder"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFolder(folder.id)}
                                  className="p-1 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                  title="Delete Folder"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="font-bold text-slate-900 text-xs truncate group-hover:text-amber-800">
                                {folder.name}
                              </div>
                              {folder.description && (
                                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                  {folder.description}
                                </div>
                              )}
                              <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center justify-between">
                                <span>{subFolderCount} folders • {fileCount} files</span>
                                <span>{folder.createdAt}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Files Section */}
                {visibleFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <File className="h-4 w-4 text-emerald-500" />
                        <span>{t.filesAndDocs} ({visibleFiles.length})</span>
                      </h3>
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectedFileIds.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-fade-in shadow-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                          <span>{selectedFileIds.length} file(s) selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowBulkCategorizeModal(true)}
                            className="px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Re-categorize Selected</span>
                          </button>
                          <button
                            onClick={() => setShowBulkDeleteModal(true)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected</span>
                          </button>
                          <button
                            onClick={() => setSelectedFileIds([])}
                            className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Responsive Mobile Cards View */}
                    <div className="block md:hidden space-y-3">
                      {visibleFiles.map((file) => {
                        const isPdf = file.category === 'pdf';
                        const isVideo = file.category === 'video';
                        const isQuiz = file.category === 'quiz';
                        const isAudio = file.category === 'audio';

                        return (
                          <div
                            key={`mobile-file-${file.id}`}
                            className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3"
                          >
                            {/* Header row: Checkbox, Type Badge, Subject & Visibility */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedFileIds.includes(file.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFileIds(prev => [...prev, file.id]);
                                    } else {
                                      setSelectedFileIds(prev => prev.filter(id => id !== file.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                                />
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono tracking-wider shrink-0 ${
                                    isPdf ? 'bg-red-50 text-red-700 border border-red-100' :
                                    isVideo ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    isQuiz ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    isAudio ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    {isPdf && <FileText className="h-3 w-3 text-red-500 shrink-0" />}
                                    {isVideo && <Video className="h-3 w-3 text-blue-500 shrink-0" />}
                                    {isQuiz && <HelpCircle className="h-3 w-3 text-amber-500 shrink-0" />}
                                    {isAudio && <Radio className="h-3 w-3 text-emerald-500 shrink-0" />}
                                    <span>{file.category}</span>
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-700 truncate">
                                    {file.subject}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {file.isVisible !== false ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Visible</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold whitespace-nowrap">
                                    <Lock className="h-3 w-3 text-amber-500" />
                                    <span>Hidden</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Main Title & Description */}
                            <div className="space-y-1">
                              {isPdf ? (
                                <button
                                  onClick={() => setActivePdfFile(file)}
                                  className="font-bold text-slate-900 text-left text-sm hover:text-emerald-600 transition-colors line-clamp-2 block leading-snug cursor-pointer"
                                >
                                  {file.name}
                                </button>
                              ) : (
                                <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{file.name}</div>
                              )}
                              {file.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{file.description}</p>
                              )}
                            </div>

                            {/* Meta info & Action buttons */}
                            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 min-w-0">
                                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70 text-slate-700 font-semibold text-[10px] shrink-0">
                                  {file.size}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400 truncate">{file.uploadedAt}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                {isPdf && (
                                  <button
                                    onClick={() => setActivePdfFile(file)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1 border border-emerald-200/60"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>View</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200/80"
                                  title="Download File"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveFileMenuId(file.id);
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs shrink-0"
                                  title="More Operations"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                  <span>Options</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto border border-slate-200/85 rounded-2xl bg-white shadow-xs">
                      <table className="w-full min-w-[750px] text-left border-collapse">
                        <thead className="bg-slate-50/75 border-b border-slate-200/60">
                          <tr>
                            <th className="p-4 w-10">
                              <input
                                type="checkbox"
                                checked={visibleFiles.length > 0 && selectedFileIds.length === visibleFiles.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFileIds(visibleFiles.map(f => f.id));
                                  } else {
                                    setSelectedFileIds([]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                            </th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">{t.colFileName}</th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans hidden sm:table-cell">{t.colSubject}</th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans hidden md:table-cell">{t.colSize}</th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans hidden lg:table-cell">{t.colUploaded}</th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">{t.colStatus}</th>
                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans text-right">{t.colActions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans text-xs">
                          {visibleFiles.map((file) => {
                            const isPdf = file.category === 'pdf';
                            const isVideo = file.category === 'video';
                            const isQuiz = file.category === 'quiz';
                            const isAudio = file.category === 'audio';
                            
                            return (
                              <tr key={file.id} className="hover:bg-slate-50/40 transition-colors group">
                                <td className="p-4 w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedFileIds.includes(file.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedFileIds(prev => [...prev, file.id]);
                                      } else {
                                        setSelectedFileIds(prev => prev.filter(id => id !== file.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                                {/* File Name with Category Icon integrated */}
                                <td className="p-4 max-w-sm">
                                  <div className="flex items-start gap-3">
                                    {/* Elevated Category Icon Box */}
                                    {isPdf && (
                                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100/60 flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                                        <FileText className="h-5 w-5" />
                                      </div>
                                    )}
                                    {isVideo && (
                                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                                        <Video className="h-5 w-5" />
                                      </div>
                                    )}
                                    {isQuiz && (
                                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                                        <HelpCircle className="h-5 w-5" />
                                      </div>
                                    )}
                                    {isAudio && (
                                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                                        <Radio className="h-5 w-5" />
                                      </div>
                                    )}
                                    {!isPdf && !isVideo && !isQuiz && !isAudio && (
                                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-3xs group-hover:scale-105 transition-transform">
                                        <File className="h-5 w-5" />
                                      </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                      {isPdf ? (
                                        <button
                                          onClick={() => setActivePdfFile(file)}
                                          className="font-bold text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-1 text-left text-xs bg-transparent border-none p-0 focus:outline-none"
                                          title="Click to Open Immersive PDF Reader"
                                        >
                                          <span className="line-clamp-1 group-hover:underline">{file.name}</span>
                                          <ExternalLink className="h-3 w-3 text-slate-400 shrink-0 inline group-hover:text-emerald-500" />
                                        </button>
                                      ) : (
                                        <div className="font-bold text-slate-900 line-clamp-1">{file.name}</div>
                                      )}

                                      {/* Sub-text: category & subject for small screens */}
                                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                                        <span>{file.category}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-slate-500">{file.subject}</span>
                                        <span className="sm:hidden">•</span>
                                        <span className="sm:hidden">{file.size}</span>
                                      </div>

                                      {file.description && (
                                        <p className="text-[11px] text-slate-400 font-sans line-clamp-1 mt-1 max-w-xs">{file.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Subject Column (visible on screens larger than mobile) */}
                                <td className="p-4 hidden sm:table-cell">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                    {file.subject}
                                  </span>
                                </td>

                                {/* Size Column (visible on screens larger than tablet-ish) */}
                                <td className="p-4 font-mono text-slate-500 hidden md:table-cell">{file.size}</td>

                                {/* Uploaded Date Column */}
                                <td className="p-4 font-mono text-slate-400 text-[11px] hidden lg:table-cell">{file.uploadedAt}</td>

                                {/* Visibility Status badge */}
                                <td className="p-4">
                                  {file.isVisible !== false ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/50 text-[10px] font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>Visible</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100/50 text-[10px] font-bold">
                                      <Lock className="h-3 w-3 text-amber-500" />
                                      <span>Hidden</span>
                                    </span>
                                  )}
                                </td>

                                {/* Cleaner, grouped actions */}
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isPdf && (
                                      <button
                                        onClick={() => setActivePdfFile(file)}
                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg cursor-pointer transition-all inline-flex items-center gap-1 shadow-3xs"
                                        title="Open PDF in Interactive Reader"
                                      >
                                        <FileText className="h-3 w-3 text-emerald-600" />
                                        <span>View</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDownloadFile(file)}
                                      className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                                      title="Download File"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveFileMenuId(file.id);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                                      title="More Operations"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Modal: Create Folder */}
          {showCreateFolderModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                    <FolderPlus className="h-5 w-5 text-amber-500" />
                    Create New Folder
                  </h3>
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateFolder} className="space-y-3.5 text-xs text-left">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Folder Location</label>
                    <div className="p-2 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-600">
                      {currentFolderId === null
                        ? 'Root Library /'
                        : `Root Library / ${getBreadcrumbs().map((b) => b.name).join(' / ')} /`}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Folder Name *</label>
                    <input
                      type="text"
                      required
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g. Class 10 Mathematics, Physics Notes"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={newFolderDesc}
                      onChange={(e) => setNewFolderDesc(e.target.value)}
                      placeholder="e.g. Contains NCERT Chapter 1 to 5 study modules"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateFolderModal(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FolderPlus className="h-4 w-4 text-amber-400" />
                      <span>Create Folder</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Upload / Add Files (Batch & Multi-File AI Analysis) */}
          {showUploadFileModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base uppercase">
                        Multi-File AI Upload Studio
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Select multiple documents/files — AI will auto-analyze & categorize each one</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadFileModal(false);
                      setBatchFilesList([]);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-4 pr-1 text-xs text-left flex-1">
                  {/* AI Banner & Global Controls */}
                  <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-amber-950 text-xs">Batch AI Analyzer Engine</div>
                        <div className="text-[11px] text-amber-800 font-medium font-sans">Reads file text/content to auto-fill Standard, Board, Subject & Category</div>
                      </div>
                    </div>
                    {batchFilesList.length > 0 && (
                      <button
                        type="button"
                        disabled={isProcessingBatchAI}
                        onClick={reAnalyzeAllBatchItems}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isProcessingBatchAI ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                            <span>Analyzing Batch...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Re-Analyze All with AI</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {fileUploadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{fileUploadError}</span>
                    </div>
                  )}

                  {/* Target Folder Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Folder Location</label>
                    <AdminCustomSelect
                      value={newFileFolderId !== null ? newFileFolderId : (currentFolderId || '')}
                      onChange={(val) => setNewFileFolderId(val ? val : null)}
                      options={[
                        { value: '', label: 'Root Library /' },
                        ...curriculumFolders
                          .map((f) => ({ folder: f, path: getFolderPath(f.id) }))
                          .sort((a, b) => a.path.localeCompare(b.path))
                          .map(({ folder, path }) => ({
                            value: folder.id,
                            label: `📁 ${path}`,
                          })),
                      ]}
                      searchable
                    />
                  </div>

                  {/* Multi-File Upload Dropzone / Picker */}
                  <div className="p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl transition-all text-center space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <FilePlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Select or Drag Multiple Files from Device</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Supports PDF, Word Documents, Audio, Video, Worksheets & Quizzes</div>
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Select Files (Hold Ctrl / Shift for Multiple)</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleBatchFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Batch Files Queue */}
                  {batchFilesList.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span>Queued Material ({batchFilesList.length})</span>
                          {isProcessingBatchAI && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                              <Sparkles className="h-3 w-3 animate-spin" /> AI Analyzing...
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBatchFilesList([])}
                          className="text-slate-400 hover:text-rose-600 text-[11px] font-bold underline"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {batchFilesList.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl space-y-2 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-mono text-[10px] text-slate-400 font-bold">#{index + 1}</span>
                                <div className="p-1.5 bg-white border border-slate-200 rounded-lg shrink-0 text-slate-700">
                                  <FileText className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-slate-900 text-xs truncate">{item.fileName || item.rawName}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">Original: {item.rawName} ({item.size})</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* AI Status Badge */}
                                {item.aiStatus === 'analyzing' && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full flex items-center gap-1 animate-pulse">
                                    <Sparkles className="h-3 w-3 animate-spin text-amber-600" /> AI Reading...
                                  </span>
                                )}
                                {item.aiStatus === 'done' && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-emerald-600" /> AI Auto-Filled
                                  </span>
                                )}
                                {item.aiStatus === 'error' && (
                                  <button
                                    type="button"
                                    onClick={() => reAnalyzeSingleItem(item)}
                                    className="px-2 py-0.5 bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-[10px] rounded-full flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3 w-3 text-rose-600" /> Retry AI
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => updateBatchItem(item.id, { expanded: !item.expanded })}
                                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                                  title="Toggle file details"
                                >
                                  {item.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeBatchItem(item.id)}
                                  className="p-1 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Remove from batch"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Item Form Controls (Expandable) */}
                            {item.expanded && (
                              <div className="pt-2 border-t border-slate-200/60 space-y-2.5 animate-fade-in text-xs">
                                <div>
                                  <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Title / Name *</label>
                                  <input
                                    type="text"
                                    value={item.fileName}
                                    onChange={(e) => updateBatchItem(item.id, { fileName: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Subject</label>
                                    <input
                                      type="text"
                                      value={item.subject}
                                      onChange={(e) => updateBatchItem(item.id, { subject: e.target.value })}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                                    />
                                  </div>

                                  <div>
                                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Category</label>
                                    <AdminCustomSelect
                                      value={item.category}
                                      onChange={(val: any) => updateBatchItem(item.id, { category: val })}
                                      options={[
                                        { value: 'pdf', label: 'PDF Document' },
                                        { value: 'video', label: 'Video Tutorial' },
                                        { value: 'audio', label: 'Audio Guide' },
                                        { value: 'quiz', label: 'Worksheet / Quiz' },
                                        { value: 'document', label: 'Text / Word Doc' },
                                        { value: 'other', label: 'Other File' },
                                      ]}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Grade / Standard</label>
                                    <AdminCustomSelect
                                      value={item.standard}
                                      onChange={(val) => updateBatchItem(item.id, { standard: val })}
                                      options={STANDARD_OPTIONS}
                                      searchable
                                    />
                                  </div>

                                  <div>
                                    <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Education Board</label>
                                    <AdminCustomSelect
                                      value={item.board}
                                      onChange={(val) => updateBatchItem(item.id, { board: val })}
                                      options={INDIAN_BOARD_OPTIONS}
                                      searchable
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">Description / Summary</label>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateBatchItem(item.id, { description: e.target.value })}
                                    placeholder="Optional description..."
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-sans"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                      No files added to batch queue yet. Select files above to start batch AI auto-analysis!
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    disabled={isUploadingFile}
                    onClick={() => {
                      setShowUploadFileModal(false);
                      setBatchFilesList([]);
                    }}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingFile || batchFilesList.length === 0}
                    onClick={handleBatchSubmit}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-xs shadow-md shadow-emerald-600/20"
                  >
                    {isUploadingFile ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading Batch...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Save & Upload All ({batchFilesList.length} Files)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Rename Folder */}
          {renamingFolder && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base uppercase">Rename Folder</h3>
                <form onSubmit={handleRenameFolderSubmit} className="space-y-3 text-xs">
                  <input
                    type="text"
                    required
                    value={renamedFolderName}
                    onChange={(e) => setRenamedFolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRenamingFolder(null)}
                      className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Rename
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Move File */}
          {selectedMoveFile && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                  <Move className="h-4 w-4 text-slate-600" />
                  Move File
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Moving: <span className="text-slate-900">{selectedMoveFile.name}</span>
                </p>

                <form onSubmit={handleMoveFileSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Destination Folder</label>
                    <AdminCustomSelect
                      value={targetMoveFolderId || ''}
                      onChange={(val) => setTargetMoveFolderId(val ? val : null)}
                      options={[
                        { value: '', label: 'Root Library /' },
                        ...curriculumFolders
                          .map((f) => ({ folder: f, path: getFolderPath(f.id) }))
                          .sort((a, b) => a.path.localeCompare(b.path))
                          .map(({ folder, path }) => ({
                            value: folder.id,
                            label: `📁 ${path}`,
                          })),
                      ]}
                      searchable
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMoveFile(null)}
                      className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Move Here
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Edit File Details */}
          {editingFile && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-amber-500" />
                    Edit File Details
                  </h3>
                  <button
                    onClick={() => setEditingFile(null)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleEditFileSubmit} className="space-y-3.5 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">File Name *</label>
                    <input
                      type="text"
                      required
                      value={editingFileName}
                      onChange={(e) => setEditingFileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                      <input
                        type="text"
                        required
                        value={editingFileSubject}
                        onChange={(e) => setEditingFileSubject(e.target.value)}
                        placeholder="e.g. Science, Mathematics"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category *</label>
                      <AdminCustomSelect
                        value={editingFileCategory}
                        onChange={(val: any) => setEditingFileCategory(val)}
                        options={[
                          { value: 'pdf', label: 'PDF Document' },
                          { value: 'video', label: 'Video Tutorial' },
                          { value: 'audio', label: 'Audio Guide' },
                          { value: 'quiz', label: 'Worksheet / Quiz' },
                          { value: 'document', label: 'Text / Word Doc' },
                          { value: 'other', label: 'Other File' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Grade / Standard</label>
                      <AdminCustomSelect
                        value={editingFileStandard}
                        onChange={setEditingFileStandard}
                        options={STANDARD_OPTIONS}
                        searchable
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Education Board</label>
                      <AdminCustomSelect
                        value={editingFileBoard}
                        onChange={setEditingFileBoard}
                        options={INDIAN_BOARD_OPTIONS}
                        searchable
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Folder Location</label>
                    <AdminCustomSelect
                      value={editingFileFolderId || ''}
                      onChange={(val) => setEditingFileFolderId(val ? val : null)}
                      options={[
                        { value: '', label: 'Root Library /' },
                        ...curriculumFolders
                          .map((f) => ({ folder: f, path: getFolderPath(f.id) }))
                          .sort((a, b) => a.path.localeCompare(b.path))
                          .map(({ folder, path }) => ({
                            value: folder.id,
                            label: `📁 ${path}`,
                          })),
                      ]}
                      searchable
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingFileDescription}
                      onChange={(e) => setEditingFileDescription(e.target.value)}
                      placeholder="Brief overview or instructions for students..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">External Download / Web URL (Optional)</label>
                    <input
                      type="url"
                      value={editingFileExternalUrl}
                      onChange={(e) => setEditingFileExternalUrl(e.target.value)}
                      placeholder="e.g. https://example.com/file.pdf"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 block">Student Visibility</span>
                      <span className="text-[11px] text-slate-500">Choose whether this file is visible to students in their library</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingFileIsVisible}
                        onChange={(e) => setEditingFileIsVisible(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingFile(null)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-xs transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: File Operations Action Sheet / Options Menu */}
          {(() => {
            if (!activeFileMenuId) return null;
            const file = curriculumFiles.find((f) => f.id === activeFileMenuId);
            if (!file) return null;
            const isPdf = file.category === 'pdf';

            return (
              <div 
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
                onClick={() => setActiveFileMenuId(null)}
              >
                <div 
                  className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                          {file.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{file.size}</span>
                        {file.isVisible !== false ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Visible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2">{file.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Subject: {file.subject}</p>
                    </div>
                    <button
                      onClick={() => setActiveFileMenuId(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {/* Toggle Visibility */}
                    <button
                      onClick={() => {
                        handleToggleVisibility(file);
                        setActiveFileMenuId(null);
                      }}
                      className="w-full px-3.5 py-3 hover:bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {file.isVisible !== false ? (
                          <EyeOff className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <span>{file.isVisible !== false ? 'Hide from Students' : 'Make Visible to Students'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Toggle</span>
                    </button>

                    {/* Open in PDF Reader */}
                    {isPdf && (
                      <button
                        onClick={() => {
                          setActiveFileMenuId(null);
                          setActivePdfFile(file);
                        }}
                        className="w-full px-3.5 py-3 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl font-bold text-xs text-emerald-800 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Open PDF in Interactive Reader</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      </button>
                    )}

                    {/* Edit Details */}
                    <button
                      onClick={() => {
                        setActiveFileMenuId(null);
                        handleStartEditFile(file);
                      }}
                      className="w-full px-3.5 py-3 hover:bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Edit3 className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Edit File Details & Categorization</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* Move to Folder */}
                    <button
                      onClick={() => {
                        setActiveFileMenuId(null);
                        setSelectedMoveFile(file);
                        setTargetMoveFolderId(file.folderId);
                      }}
                      className="w-full px-3.5 py-3 hover:bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Move className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span>Move to Another Folder</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* Download File */}
                    <button
                      onClick={() => {
                        setActiveFileMenuId(null);
                        handleDownloadFile(file);
                      }}
                      className="w-full px-3.5 py-3 hover:bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Download File Locally</span>
                      </div>
                      <Download className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>

                    {/* Delete File */}
                    <button
                      onClick={() => {
                        setActiveFileMenuId(null);
                        handleDeleteFile(file.id);
                      }}
                      className="w-full px-3.5 py-3 hover:bg-rose-50 border border-rose-100 rounded-xl font-bold text-xs text-red-600 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
                        <span>Delete File Permanently</span>
                      </div>
                      <Trash2 className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFileMenuId(null)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      Close Options
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Modal: Bulk Re-categorize */}
          {showBulkCategorizeModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-emerald-600" />
                    Bulk Re-categorize ({selectedFileIds.length} files)
                  </h3>
                  <button
                    onClick={() => setShowBulkCategorizeModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleBulkCategorizeSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Category *</label>
                    <div className="relative">
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value as any)}
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl font-sans text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none cursor-pointer transition-all"
                      >
                        <option value="pdf">PDF Study Material</option>
                        <option value="video">Video Lecture</option>
                        <option value="audio">Audio / Podcast</option>
                        <option value="quiz">Interactive Quiz</option>
                        <option value="document">General Document</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Subject *</label>
                    <input
                      type="text"
                      required
                      value={bulkSubject}
                      onChange={(e) => setBulkSubject(e.target.value)}
                      placeholder="e.g. Science, Mathematics, English"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkCategorizeModal(false)}
                      className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Update All
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Bulk Delete Confirmation */}
          {showBulkDeleteModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-red-600 text-base uppercase flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Selected Files ({selectedFileIds.length})
                  </h3>
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-900">{selectedFileIds.length}</strong> selected file(s)? This will remove them from database and local storage permanently.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDeleteFiles}
                    className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CERTIFICATES REGISTRY */}
      {activeTab === 'certificates' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                {t.certTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify student achievement certificates, issue custom excellence awards, or revoke invalid credentials.
              </p>
            </div>

            <button
              onClick={() => setShowIssueCertModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{t.issueCertBtn}</span>
            </button>
          </div>

          {/* Verification Search Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              {t.certTitle}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  placeholder="Enter Certificate Code (e.g. CERT-2026-8819) or Student Mobile..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <button
                onClick={handleVerifyCertificate}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Verify
              </button>
            </div>

            {/* Verification Result Callout */}
            {verificationResult && verificationResult !== 'not_found' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 animate-fade-in">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  AUTHENTIC & VALIDATED CERTIFICATE
                </div>
                <div className="text-slate-700">Student: <strong>{verificationResult.studentName}</strong> ({verificationResult.studentMobile})</div>
                <div className="text-slate-700">Course / Award: <strong>{verificationResult.title}</strong></div>
                <div className="text-slate-500 font-mono text-[11px]">Issued Date: {verificationResult.date} | Score: {verificationResult.score}%</div>
              </div>
            )}

            {verificationResult === 'not_found' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold flex items-center gap-1.5 animate-fade-in">
                <XCircle className="h-4 w-4 text-red-600" />
                No certificate found matching code "{certSearch}".
              </div>
            )}
          </div>

          {/* Mobile Certificate Cards View */}
          <div className="block md:hidden space-y-3">
            {isLoadingCerts ? (
              <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 border border-slate-200 rounded-2xl">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                Loading certificates from Firestore database...
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
                No certificates registered in Firestore database yet.
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={`mob-cert-${cert.id}`} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs">{cert.id}</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{cert.studentName}</h4>
                      <div className="text-[11px] text-slate-500 font-mono">{cert.studentMobile}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      cert.status === 'valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div className="font-medium text-slate-800">{cert.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Issued: {cert.date}</div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleCertStatus(cert.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        cert.status === 'valid'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {cert.status === 'valid' ? 'Revoke Cert' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => handleDeleteCertificate(cert.id)}
                      className="px-3 py-1.5 bg-rose-50 text-red-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Certificate Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Cert ID</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Achievement Title</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoadingCerts ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                      Loading certificates from Firestore database...
                    </td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No certificates registered in Firestore database yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{cert.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{cert.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{cert.studentMobile}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{cert.title}</td>
                      <td className="p-3.5 font-mono text-slate-500">{cert.date}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          cert.status === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleCertStatus(cert.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            cert.status === 'valid'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {cert.status === 'valid' ? 'Revoke' : 'Reactivate'}
                        </button>

                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete certificate from Firestore"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Issue Certificate Modal */}
          {showIssueCertModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base uppercase">Issue Certificate</h3>
                
                <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs text-left">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={newCertStudent}
                      onChange={(e) => setNewCertStudent(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student Mobile Number</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={newCertMobile}
                      onChange={(e) => setNewCertMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Certificate Title / Subject</label>
                    <input
                      type="text"
                      required
                      value={newCertTitle}
                      onChange={(e) => setNewCertTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowIssueCertModal(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                    >
                      Issue Certificate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USER ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                {t.userTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage accounts, assign Administrator privileges, edit student profiles, and maintain data hygiene.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setAddAdminError('');
                  setShowAddAdminModal(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4 text-slate-950" />
                <span>{t.addUserBtn}</span>
              </button>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['all', 'student', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                      roleFilter === r ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, mobile, village, or school..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* Mobile User Cards View */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
                No users found matching filter or search.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const currentRole = u.role || 'student';
                return (
                  <div key={`mob-user-${u.mobile}`} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                        <div className="text-[11px] text-slate-700 font-mono font-semibold">{u.mobile}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Reg: {u.signupDate}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 shrink-0 ${
                        currentRole === 'admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : currentRole === 'teacher'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {currentRole === 'admin' && <Shield className="h-3 w-3 text-amber-600" />}
                        <span>{currentRole}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">VILLAGE / HUB</span>
                        <span className="font-medium text-slate-800 text-[11px]">{u.village || 'Primary Village Hub'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">ACTIVITY</span>
                        <span className="text-amber-600 font-bold text-[11px]">{u.totalPoints || 0} XP</span>
                        <span className="text-slate-400 text-[10px] ml-1">({u.studyMins || 0}m)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      {currentRole !== 'admin' && (
                        <button
                          onClick={() => handleRoleChange(u.mobile, 'admin')}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      {currentRole !== 'student' && (
                        <button
                          onClick={() => handleRoleChange(u.mobile, 'student')}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          Make Student
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u.mobile)}
                        className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop User Accounts Table */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Student / User</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Village / School</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Activity</th>
                  <th className="p-3.5 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredUsers.map((u) => {
                  const currentRole = u.role || 'student';
                  return (
                    <tr key={u.mobile} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Reg: {u.signupDate}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-semibold">{u.mobile}</td>
                      <td className="p-3.5">
                        <div className="text-slate-800 font-medium">{u.village || 'Primary Village Hub'}</div>
                        <div className="text-[10px] text-slate-500">{u.school || u.standard || 'Primary Grade'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center w-max gap-1 ${
                          currentRole === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : currentRole === 'teacher'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {currentRole === 'admin' && <Shield className="h-3 w-3 text-amber-600" />}
                          <span>{currentRole}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        <span className="text-amber-600 font-bold">{u.totalPoints || 0} XP</span>
                        <div className="text-slate-500 text-[10px]">{u.studyMins || 0} mins</div>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {currentRole !== 'admin' && (
                          <button
                            onClick={() => handleRoleChange(u.mobile, 'admin')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-[10px] font-bold cursor-pointer"
                          >
                            Make Admin
                          </button>
                        )}
                        {currentRole !== 'student' && (
                          <button
                            onClick={() => handleRoleChange(u.mobile, 'student')}
                            className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[10px] font-bold cursor-pointer"
                          >
                            Make Student
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.mobile)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer ml-1"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal: Add Admin Manually */}
          {showAddAdminModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                    Provision New Administrator
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {addAdminError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{addAdminError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5 text-xs text-left font-sans">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Administrator Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addAdminName}
                      onChange={(e) => setAddAdminName(e.target.value)}
                      placeholder="e.g. Dr. Sunita Rao"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={addAdminMobile}
                      onChange={(e) => setAddAdminMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Security Passcode / Admin PIN *</label>
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={addAdminPin}
                      onChange={(e) => setAddAdminPin(e.target.value)}
                      placeholder="e.g. 999999 or custom 6-digit PIN"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Used for logging in via the Admin Portal.</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department / Division / Hub Name</label>
                    <input
                      type="text"
                      value={addAdminDept}
                      onChange={(e) => setAddAdminDept(e.target.value)}
                      placeholder="e.g. HQ Education Board, District Control Center"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddAdminModal(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAdmin}
                      className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <UserPlus className="h-4 w-4 text-slate-950" />
                      <span>{isSubmittingAdmin ? 'Creating...' : 'Create Admin'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PLATFORM CONFIG & SYSTEM AUDIT */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-600" />
              {t.settingsTitle}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">{t.lowBandwidthTitle}</div>
                  <div className="text-slate-500 text-[11px]">{t.lowBandwidthDesc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={bandwidthCompression}
                  onChange={(e) => setBandwidthCompression(e.target.value ? e.target.checked : false)}
                  className="h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900">{t.aiRateLimitTitle}</div>
                <AdminCustomSelect
                  value={aiRateLimit}
                  onChange={setAiRateLimit}
                  options={[
                    'High (100 req/min)',
                    'Standard (60 req/min)',
                    'Strict (30 req/min)',
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Admin Account Password / Security PIN Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                {t.changePinTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                Update security passcode for logged-in Administrator <strong className="text-slate-800">{adminUser.name}</strong> ({adminUser.mobile}).
              </p>
            </div>

            {pwdChangeFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                pwdChangeFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {pwdChangeFeedback.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{pwdChangeFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminPasswordSubmit} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.currentPinLabel}</label>
                <input
                  type="password"
                  required
                  value={oldAdminPinInput}
                  onChange={(e) => setOldAdminPinInput(e.target.value)}
                  placeholder="Enter current 6-digit PIN or password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.newPinLabel}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPinInput}
                  onChange={(e) => setNewAdminPinInput(e.target.value)}
                  placeholder="Enter new 6-digit PIN or password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.confirmPinLabel}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmAdminPinInput}
                  onChange={(e) => setConfirmAdminPinInput(e.target.value)}
                  placeholder="Confirm new 6-digit PIN or password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingAdminPin}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Lock className="h-4 w-4 text-slate-950" />
                <span>{isSavingAdminPin ? t.updatingPinBtn : t.savePinBtn}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT ANALYTICS & REPORTS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                    Export Analytics & Reports
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                    Download structured datasets for reporting, offline records, and state audits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto overflow-x-hidden flex-1">
              {/* Clean Filter Control Header in Modal */}
              <div className="p-3.5 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-2.5 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Active Filter Period:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap inline-flex items-center">
                    {getDateFilterLabel()}
                  </span>
                </div>
                
                {/* Symmetrical Grid for Filter Mode Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('all')}
                    className={`py-1.5 px-2 rounded-xl text-center cursor-pointer transition-all ${analyticsFilterMode === 'all' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('year')}
                    className={`py-1.5 px-2 rounded-xl text-center cursor-pointer transition-all ${analyticsFilterMode === 'year' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  >
                    Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('month')}
                    className={`py-1.5 px-2 rounded-xl text-center cursor-pointer transition-all ${analyticsFilterMode === 'month' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsFilterMode('custom')}
                    className={`py-1.5 px-2 rounded-xl text-center cursor-pointer transition-all ${analyticsFilterMode === 'custom' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  >
                    Custom Range
                  </button>
                </div>

                {/* Connected Controls inside Modal */}
                {analyticsFilterMode === 'year' && (
                  <div className="pt-1 animate-fade-in text-xs flex items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Academic Year:</span>
                    <AdminCustomSelect
                      value={analyticsYear}
                      onChange={setAnalyticsYear}
                      options={['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => ({
                        value: y,
                        label: `${y} Academic Year`,
                      }))}
                      dark
                      className="w-full sm:w-48"
                    />
                  </div>
                )}

                {analyticsFilterMode === 'month' && (
                  <div className="pt-1 animate-fade-in text-xs flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">Select Month:</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <AdminCustomSelect
                        value={analyticsMonth.split('-')[1] || '08'}
                        onChange={(val) => {
                          const currentY = analyticsMonth.split('-')[0] || analyticsYear || '2026';
                          setAnalyticsMonth(`${currentY}-${val}`);
                        }}
                        options={[
                          { value: '01', label: 'January' },
                          { value: '02', label: 'February' },
                          { value: '03', label: 'March' },
                          { value: '04', label: 'April' },
                          { value: '05', label: 'May' },
                          { value: '06', label: 'June' },
                          { value: '07', label: 'July' },
                          { value: '08', label: 'August' },
                          { value: '09', label: 'September' },
                          { value: '10', label: 'October' },
                          { value: '11', label: 'November' },
                          { value: '12', label: 'December' },
                        ]}
                        dark
                        className="flex-1 sm:w-36"
                      />

                      <AdminCustomSelect
                        value={analyticsMonth.split('-')[0] || '2026'}
                        onChange={(val) => {
                          const currentM = analyticsMonth.split('-')[1] || '08';
                          setAnalyticsMonth(`${val}-${currentM}`);
                        }}
                        options={['2026', '2025', '2024', '2023', '2022']}
                        dark
                        className="w-24 sm:w-28"
                      />
                    </div>
                  </div>
                )}

                {analyticsFilterMode === 'custom' && (
                  <div className="pt-1 animate-fade-in text-xs flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px]">From:</span>
                      <input
                        type="date"
                        value={analyticsStartDate}
                        onChange={(e) => setAnalyticsStartDate(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono text-xs cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px]">To:</span>
                      <input
                        type="date"
                        value={analyticsEndDate}
                        onChange={(e) => setAnalyticsEndDate(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono text-xs cursor-pointer"
                      />
                    </div>
                    {(analyticsStartDate || analyticsEndDate) && (
                      <button
                        type="button"
                        onClick={() => { setAnalyticsStartDate(''); setAnalyticsEndDate(''); }}
                        className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Option 1: Executive PDF Report */}
              <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-red-200 bg-red-50/40 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-sm block leading-snug">
                      Official Executive Analytics PDF Report
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Formatted document with headers, KPIs, village hub tables, and certificates log ready for printing/audits.
                    </p>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap mt-0.5">
                    PDF DOC
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    onClick={() => handleExportMasterPDF(true)}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Download PDF Report ({getDateFilterLabel()})</span>
                  </button>
                  {analyticsFilterMode !== 'all' && (
                    <button
                      onClick={() => handleExportMasterPDF(false)}
                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0"
                    >
                      <span>All Time PDF</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Master Multi-Sheet Excel */}
              <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-sm block leading-snug">
                      Master Multi-Sheet Excel Analytics Workbook
                    </span>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Includes Executive Summary, Student Directory, Village Hubs, Certificates, and Curriculum sheets.
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap mt-0.5">
                    EXCEL .XLSX
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    onClick={() => handleExportMasterExcel(true)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Download Excel Workbook ({getDateFilterLabel()})</span>
                  </button>
                  {analyticsFilterMode !== 'all' && (
                    <button
                      onClick={() => handleExportMasterExcel(false)}
                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shrink-0"
                    >
                      <span>All Time Excel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option 3: Users Directory */}
              <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">Users & Student Progress Directory</div>
                  <div className="text-[11px] text-slate-500">{usersList.length} user records with role, grade, streak & study minutes</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleExportUsersPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportUsersExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Village Hubs */}
              <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">Rural Village Hub Activity Report</div>
                  <div className="text-[11px] text-slate-500">{villageHubStats.length} regional village hubs engagement & XP stats</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleExportVillageHubsPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportVillageHubsExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 5: Certificates Ledger */}
              <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">Issued Certificates Ledger</div>
                  <div className="text-[11px] text-slate-500">{certificates.length} verification records & course completion details</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleExportCertificatesPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportCertificatesExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 6: Curriculum Inventory */}
              <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">Curriculum Folders & Content Library</div>
                  <div className="text-[11px] text-slate-500">{curriculumFiles.length} file metadata entries across {curriculumFolders.length} folders</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleExportCurriculumPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportCurriculumExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 7: Full System JSON Backup */}
              <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-xs">Full Raw Database Backup (JSON)</div>
                  <div className="text-[11px] text-slate-500">Full structured object model for developer database restores</div>
                </div>
                <button
                  onClick={handleExportFullJSONReport}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Instant generation in PDF, Excel, and JSON formats
              </span>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Reader & Read Aloud Modal (Immersive Full Screen Dashboard) */}
      {activePdfFile && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 bg-slate-950 flex flex-col h-[calc(100vh-4rem)] w-screen overflow-hidden animate-fade-in">
          <div className="bg-slate-900 w-full h-full flex flex-col overflow-hidden">
            <div className="flex-1 bg-slate-900 overflow-hidden flex flex-col p-0">
              <div className="flex-1 h-full min-h-[500px]">
                <PdfCanvasViewer
                  lang={adminLang}
                  user={adminUser}
                  adminUser={adminUser}
                  onClose={() => {
                    stopSpeaking();
                    setIsPdfSpeaking(false);
                    setActivePdfFile(null);
                  }}
                  onNavigateBack={() => {
                    stopSpeaking();
                    setIsPdfSpeaking(false);
                    setActivePdfFile(null);
                  }}
                  onLanguageChange={(newLang) => setAdminLang(newLang)}
                  fileId={activePdfFile.id}
                  fileDataUrl={activePdfFile.fileDataUrl}
                  fileName={activePdfFile.name}
                  fullContent={(activePdfFile as any).fullContent || (activePdfFile as any).generatedText}
                  isAiGenerated={(activePdfFile as any).isAiGenerated || activePdfFile.id?.startsWith('gen-pdf-') || !!(activePdfFile as any).fullContent}
                  onGetFileLocal={async (id) => {
                    const localUrl = await getFileLocal(id);
                    if (localUrl) return localUrl;
                    const remoteUrl = await getFirebaseCurriculumFileDataUrl(id);
                    if (remoteUrl) {
                      await saveFileLocal(id, remoteUrl);
                      return remoteUrl;
                    }
                    return null;
                  }}
                  onDownload={() => handleDownloadFile(activePdfFile)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM QUICK DOCK (MOBILE THUMB NAV FOR ADMIN) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-1.5 px-2 shadow-2xl flex justify-around items-center">
        {adminNavItems.map((dockItem) => {
          const DockIcon = dockItem.icon;
          const isDockSelected = activeTab === dockItem.id;
          return (
            <button
              key={`admin-dock-${dockItem.id}`}
              type="button"
              onClick={() => setActiveTab(dockItem.id)}
              className={`flex flex-col items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                isDockSelected
                  ? 'text-amber-400 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <DockIcon className={`h-4.5 w-4.5 ${isDockSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">
                {dockItem.id === 'analytics' ? 'Analytics' : dockItem.id === 'content' ? 'Curriculum' : dockItem.id === 'certificates' ? 'Certs' : dockItem.id === 'users' ? 'Users' : 'Config'}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
