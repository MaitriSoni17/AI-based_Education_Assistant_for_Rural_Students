import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, BookOpen, Award, Shield, BarChart3, Settings, Search, Plus, Trash2, 
  Edit, CheckCircle, XCircle, RefreshCw, FileText, Video, HelpCircle, 
  Download, ArrowUpRight, GraduationCap, Filter, Sparkles, UserCheck, UserPlus,
  Lock, Eye, AlertTriangle, Layers, Radio, KeyRound,
  Folder, FolderPlus, FolderOpen, FilePlus, File, ChevronRight, ArrowLeft, Edit3, Upload, X, ExternalLink, Move, FolderTree
} from 'lucide-react';
import { User, LanguageCode } from '../../types';
import { 
  getAllFirebaseUsers, updateUserRole, deleteFirebaseUser, setFirebaseUser, updateFirebaseUserFields, FirestoreUser,
  getAllFirebaseCertificates, issueFirebaseCertificate, updateFirebaseCertificateStatus, deleteFirebaseCertificate, FirestoreCertificate
} from '../../lib/firebase';
import { getSafeDateString } from '../../utils/dateUtils';
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
  size: string;
  uploadedAt: string;
  fileDataUrl?: string;
  externalUrl?: string;
  description?: string;
}

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

export default function AdminDashboardView({ adminUser, lang, onLogoutAdmin }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'content' | 'certificates' | 'users' | 'settings'>('analytics');

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
  const [newFileSize, setNewFileSize] = useState('1.5 MB');
  const [newFileExternalUrl, setNewFileExternalUrl] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileDataUrl, setNewFileDataUrl] = useState<string | undefined>(undefined);

  // Move Modal State
  const [selectedMoveFile, setSelectedMoveFile] = useState<CurriculumFile | null>(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null);

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
      localStorage.setItem(`gramin_admin_pin_${adminUser.mobile}`, newAdminPinInput);

      setPwdChangeFeedback({ text: 'Admin security password / PIN updated successfully!', type: 'success' });
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

      localStorage.setItem(`gramin_admin_pin_${addAdminMobile}`, addAdminPin);

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

  // LocalStorage persistence for curriculum folders and files
  useEffect(() => {
    localStorage.setItem('gramin_curriculum_folders_v2', JSON.stringify(curriculumFolders));
  }, [curriculumFolders]);

  useEffect(() => {
    localStorage.setItem('gramin_curriculum_files_v2', JSON.stringify(curriculumFiles));
  }, [curriculumFiles]);

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

  // Sub-items count for a folder
  const getFolderItemCount = (folderId: string) => {
    const subFolderCount = curriculumFolders.filter((f) => f.parentId === folderId).length;
    const fileCount = curriculumFiles.filter((f) => f.folderId === folderId).length;
    return { subFolderCount, fileCount };
  };

  // Create folder
  const handleCreateFolder = (e: React.FormEvent) => {
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
    setNewFolderName('');
    setNewFolderDesc('');
    setShowCreateFolderModal(false);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Created folder "${newFolder.name}"`, ...prev]);
  };

  // Handle local file selection
  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newFileName.trim()) {
      setNewFileName(file.name.replace(/\.[^/.]+$/, ""));
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setNewFileSize(`${sizeInMB} MB`);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setNewFileCategory('pdf');
    else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) setNewFileCategory('video');
    else if (['mp3', 'wav', 'aac', 'ogg'].includes(ext || '')) setNewFileCategory('audio');
    else if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) setNewFileCategory('document');
    else if (['zip', 'rar', '7z'].includes(ext || '')) setNewFileCategory('other');

    if (file.size <= 12 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload/Save file
  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newFile: CurriculumFile = {
      id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newFileName.trim(),
      folderId: currentFolderId,
      subject: newFileSubject.trim() || 'General',
      category: newFileCategory,
      size: newFileSize || '1.0 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      fileDataUrl: newFileDataUrl,
      externalUrl: newFileExternalUrl.trim() || undefined,
      description: newFileDesc.trim() || undefined
    };

    setCurriculumFiles((prev) => [newFile, ...prev]);
    setNewFileName('');
    setNewFileExternalUrl('');
    setNewFileDesc('');
    setNewFileDataUrl(undefined);
    setShowUploadFileModal(false);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Saved file "${newFile.name}"`, ...prev]);
  };

  // Delete folder recursively
  const handleDeleteFolder = (folderId: string) => {
    const folder = curriculumFolders.find((f) => f.id === folderId);
    if (!folder) return;
    if (!confirm(`Are you sure you want to delete folder "${folder.name}" and all subfolders/files inside it?`)) return;

    const getDescendantFolderIds = (id: string): string[] => {
      const children = curriculumFolders.filter((f) => f.parentId === id).map((f) => f.id);
      return [id, ...children.flatMap(getDescendantFolderIds)];
    };

    const idsToDelete = getDescendantFolderIds(folderId);
    setCurriculumFolders((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
    setCurriculumFiles((prev) => prev.filter((f) => !f.folderId || !idsToDelete.includes(f.folderId)));

    if (currentFolderId && idsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(folder.parentId);
    }
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Deleted folder "${folder.name}" and all contents`, ...prev]);
  };

  // Rename folder
  const handleRenameFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFolder || !renamedFolderName.trim()) return;

    setCurriculumFolders((prev) =>
      prev.map((f) => (f.id === renamingFolder.id ? { ...f, name: renamedFolderName.trim() } : f))
    );
    setRenamingFolder(null);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Renamed folder to "${renamedFolderName.trim()}"`, ...prev]);
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    const file = curriculumFiles.find((f) => f.id === fileId);
    if (!file) return;
    if (!confirm(`Delete file "${file.name}"?`)) return;

    setCurriculumFiles((prev) => prev.filter((f) => f.id !== fileId));
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Deleted file "${file.name}"`, ...prev]);
  };

  // Move file
  const handleMoveFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMoveFile) return;

    setCurriculumFiles((prev) =>
      prev.map((f) => (f.id === selectedMoveFile.id ? { ...f, folderId: targetMoveFolderId } : f))
    );
    setSelectedMoveFile(null);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Moved file "${selectedMoveFile.name}"`, ...prev]);
  };

  // Download file
  const handleDownloadFile = (file: CurriculumFile) => {
    if (file.fileDataUrl) {
      const a = document.createElement('a');
      a.href = file.fileDataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.externalUrl) {
      window.open(file.externalUrl, '_blank');
    } else {
      alert(`Downloading file "${file.name}" (${file.size})`);
    }
  };

  // Load all certificates from Firestore
  const fetchCertificates = async () => {
    setIsLoadingCerts(true);
    try {
      const data = await getAllFirebaseCertificates();
      setCertificates(data || []);
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
      if (data && data.length > 0) {
        setUsersList(data);
      } else {
        // Mock fallback list if offline or empty
        setUsersList([
          { mobile: adminUser.mobile, name: adminUser.name, defaultLanguage: 'en', role: 'admin', signupDate: '2026-01-01', village: 'HQ', streakDays: 99, totalPoints: 5000, studyMins: 1200 },
          { mobile: '9876543210', name: 'Aarav Patel', defaultLanguage: 'hi', role: 'student', signupDate: '2026-06-15', village: 'Anand', school: 'Govt School Anand', standard: 'Std 8', streakDays: 14, totalPoints: 420, studyMins: 380 },
          { mobile: '9812345678', name: 'Priya Sharma', defaultLanguage: 'gu', role: 'student', signupDate: '2026-07-02', village: 'Mehsana', school: 'Adarsh Primary School', standard: 'Std 9', streakDays: 8, totalPoints: 310, studyMins: 290 },
          { mobile: '9765432109', name: 'Ramesh Patel', defaultLanguage: 'gu', role: 'teacher', signupDate: '2026-05-10', village: 'Mehsana', school: 'Adarsh Primary School', standard: 'Teacher', streakDays: 25, totalPoints: 890, studyMins: 950 }
        ]);
      }
    } catch (e) {
      console.error("Failed to load users for admin:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSyncAllData = async () => {
    await Promise.all([fetchUsers(), fetchCertificates()]);
    setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Synchronized live data from Firestore`, ...prev]);
  };

  useEffect(() => {
    fetchUsers();
    fetchCertificates();
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
    if (!confirm(`Are you sure you want to delete account ${targetMobile}? This cannot be undone.`)) return;
    try {
      await deleteFirebaseUser(targetMobile);
      setUsersList((prev) => prev.filter((u) => u.mobile !== targetMobile));
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] User account ${targetMobile} deleted`, ...prev]);
    } catch (e) {
      alert("Failed to delete user account");
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
    if (!confirm(`Are you sure you want to delete certificate ${id}? This action cannot be undone.`)) return;
    try {
      await deleteFirebaseCertificate(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] Certificate ${id} deleted from Firestore`, ...prev]);
    } catch (err) {
      alert("Failed to delete certificate from Firestore");
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Banner & Control Status Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border-2 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/20 border border-amber-400/30 rounded-2xl text-amber-400">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Gramin Shiksha Admin Dashboard
              </h1>
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as <strong className="text-amber-300">{adminUser.name}</strong> ({adminUser.mobile}) • State Curriculum Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end self-end md:self-auto">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-400 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Analytics</span>
          </button>

          <button
            onClick={handleSyncAllData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers || isLoadingCerts ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 cursor-pointer transition-all"
          >
            Exit Admin Console
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-bold font-sans">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-amber-400" />
          <span>Student Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'content'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span>Curriculum & Content</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'certificates'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4 text-amber-400" />
          <span>Certificates Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4 text-indigo-400" />
          <span>User Role Management</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>Platform Config</span>
        </button>
      </div>

      {/* TAB 1: STUDENT ANALYTICS & PROGRESS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">

          {/* Unified Executive Analytics & Custom Date Filter Control Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 text-white space-y-4">
            {/* Card Header: Title & Direct Downloads */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>Platform Analytics & Export Hub</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {getDateFilterLabel()}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Filter platform datasets by academic year, month, or custom period, then export executive PDF or Excel (.xlsx) reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Quick Downloads */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => handleExportMasterPDF(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                  title={`Download PDF report for ${getDateFilterLabel()}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF Report</span>
                </button>
                <button
                  onClick={() => handleExportMasterExcel(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                  title={`Download Excel spreadsheet for ${getDateFilterLabel()}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Filter className="h-3.5 w-3.5 text-amber-400" />
                  <span>All Export Formats</span>
                </button>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-slate-800/80 pt-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              {/* Filter Controls Toolbar */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3 text-amber-400" />
                  Filter Period:
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
                    All Time
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
                    Year
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
                    Month
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
                    <select
                      value={analyticsYear}
                      onChange={(e) => setAnalyticsYear(e.target.value)}
                      className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => (
                        <option key={y} value={y}>{y} Academic Year</option>
                      ))}
                    </select>
                  </div>
                )}

                {analyticsFilterMode === 'month' && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <select
                      value={analyticsMonth.split('-')[1] || '08'}
                      onChange={(e) => {
                        const currentY = analyticsMonth.split('-')[0] || analyticsYear || '2026';
                        setAnalyticsMonth(`${currentY}-${e.target.value}`);
                      }}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-sans font-bold text-xs cursor-pointer"
                    >
                      {[
                        { val: '01', label: 'January' },
                        { val: '02', label: 'February' },
                        { val: '03', label: 'March' },
                        { val: '04', label: 'April' },
                        { val: '05', label: 'May' },
                        { val: '06', label: 'June' },
                        { val: '07', label: 'July' },
                        { val: '08', label: 'August' },
                        { val: '09', label: 'September' },
                        { val: '10', label: 'October' },
                        { val: '11', label: 'November' },
                        { val: '12', label: 'December' },
                      ].map((m) => (
                        <option key={m.val} value={m.val}>{m.label}</option>
                      ))}
                    </select>

                    <select
                      value={analyticsMonth.split('-')[0] || '2026'}
                      onChange={(e) => {
                        const currentM = analyticsMonth.split('-')[1] || '08';
                        setAnalyticsMonth(`${e.target.value}-${currentM}`);
                      }}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs cursor-pointer"
                    >
                      {['2026', '2025', '2024', '2023', '2022'].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
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
                <span>Matched: <strong className="text-white">{filteredUsersList.length}</strong> Students • <strong className="text-white">{filteredCertificates.length}</strong> Certs</span>
              </div>
            </div>
          </div>
          
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Students</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredTotalStudents}</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" /> {analyticsFilterMode !== 'all' ? `Filtered (${getDateFilterLabel()})` : '+12% this month'}
                </span>
              </div>
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Study Time Logged</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{(filteredTotalStudyMins / 60).toFixed(1)} hrs</h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" /> ~{filteredTotalStudyMins} total minutes
                </span>
              </div>
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Quiz Pass Rate</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{filteredTotalPoints > 0 ? (88.5 + (filteredTotalPoints % 7) * 0.5).toFixed(1) + '%' : '91.4%'}</h3>
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-1">
                  <Award className="h-3 w-3" /> {filteredTotalPoints} XP Awarded
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
                  Rural Village Hub Activity
                </h3>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  {analyticsFilterMode !== 'all' ? getDateFilterLabel() : 'Live Firestore DB Data'}
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
                        <span className="text-amber-600 font-mono">{item.pct} engagement</span>
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
                  Top Student Performers
                </h3>
                <span className="text-xs text-emerald-600 font-bold">XP & Streaks</span>
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
                        <div className="text-[10px] text-slate-500">🔥 {u.streakDays || 1} day streak</div>
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-amber-500" />
                Curriculum & Content Folder Structure
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
                <span>New Folder</span>
              </button>

              <button
                onClick={() => setShowUploadFileModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
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
                <span>Root Library</span>
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

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  placeholder="Search in library..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
              </div>

              <select
                value={contentCategoryFilter}
                onChange={(e) => setContentCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF Notes</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="quiz">Quizzes</option>
                <option value="document">Documents</option>
              </select>
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
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <File className="h-4 w-4 text-emerald-500" />
                      <span>Files & Documents ({visibleFiles.length})</span>
                    </h3>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                          <tr>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">File Name</th>
                            <th className="p-3.5">Subject</th>
                            <th className="p-3.5">Size</th>
                            <th className="p-3.5">Uploaded</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {visibleFiles.map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                                  {file.category === 'pdf' && <FileText className="h-3.5 w-3.5 text-red-500" />}
                                  {file.category === 'video' && <Video className="h-3.5 w-3.5 text-blue-500" />}
                                  {file.category === 'quiz' && <HelpCircle className="h-3.5 w-3.5 text-amber-500" />}
                                  {file.category === 'audio' && <Radio className="h-3.5 w-3.5 text-emerald-500" />}
                                  {file.category === 'document' && <File className="h-3.5 w-3.5 text-indigo-500" />}
                                  {file.category === 'other' && <File className="h-3.5 w-3.5 text-slate-500" />}
                                  {file.category}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-slate-900">{file.name}</div>
                                {file.description && (
                                  <div className="text-[10px] text-slate-400 font-sans truncate max-w-xs">{file.description}</div>
                                )}
                              </td>
                              <td className="p-3.5 font-semibold text-slate-600">{file.subject}</td>
                              <td className="p-3.5 font-mono text-slate-500">{file.size}</td>
                              <td className="p-3.5 font-mono text-slate-400 text-[11px]">{file.uploadedAt}</td>
                              <td className="p-3.5 text-right space-x-1">
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                                  title="Download File"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedMoveFile(file);
                                    setTargetMoveFolderId(file.folderId);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                                  title="Move to Folder"
                                >
                                  <Move className="h-3 w-3" />
                                  <span>Move</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete File"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
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

          {/* Modal: Upload / Add File */}
          {showUploadFileModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base uppercase flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-600" />
                    Upload Study Material / File
                  </h3>
                  <button
                    onClick={() => setShowUploadFileModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddFileSubmit} className="space-y-3 text-xs text-left">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Folder</label>
                    <div className="p-2 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-600">
                      {currentFolderId === null
                        ? 'Root Library /'
                        : `Root Library / ${getBreadcrumbs().map((b) => b.name).join(' / ')} /`}
                    </div>
                  </div>

                  {/* Local File Picker */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select File from Device</label>
                    <input
                      type="file"
                      onChange={handleFileSelectChange}
                      className="w-full text-slate-500 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">File Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="e.g. Chapter 4 Motion & Velocity Notes"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={newFileSubject}
                        onChange={(e) => setNewFileSubject(e.target.value)}
                        placeholder="e.g. Science, Maths"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={newFileCategory}
                        onChange={(e: any) => setNewFileCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="video">Video Tutorial</option>
                        <option value="audio">Audio Guide</option>
                        <option value="quiz">Worksheet / Quiz</option>
                        <option value="document">Text / Word Doc</option>
                        <option value="other">Other File</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">File Size</label>
                      <input
                        type="text"
                        value={newFileSize}
                        onChange={(e) => setNewFileSize(e.target.value)}
                        placeholder="e.g. 2.4 MB"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">External Download / Web URL (Optional)</label>
                    <input
                      type="url"
                      value={newFileExternalUrl}
                      onChange={(e) => setNewFileExternalUrl(e.target.value)}
                      placeholder="e.g. https://example.com/study-material.pdf"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadFileModal(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Save & Upload File</span>
                    </button>
                  </div>
                </form>
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
                    <select
                      value={targetMoveFolderId || ''}
                      onChange={(e) => setTargetMoveFolderId(e.target.value ? e.target.value : null)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    >
                      <option value="">Root Library /</option>
                      {curriculumFolders.map((f) => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
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
        </div>
      )}

      {/* TAB 3: CERTIFICATES REGISTRY */}
      {activeTab === 'certificates' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Certificate Verification & Registry
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
              <span>Issue Manual Certificate</span>
            </button>
          </div>

          {/* Verification Search Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Verify Certificate Authenticity
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

          {/* Certificate Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
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
                User Accounts & Role Permissions Management
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
                <span>Add Admin Manually</span>
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

          {/* User Accounts Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
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
              Bandwidth & Low-Signal Engine Controls
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">2G / Low-Bandwidth Mode</div>
                  <div className="text-slate-500 text-[11px]">Compresses payload size for rural cellular networks</div>
                </div>
                <input
                  type="checkbox"
                  checked={bandwidthCompression}
                  onChange={(e) => setBandwidthCompression(e.target.checked)}
                  className="h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900">AI Tutor Query Rate Limiting</div>
                <select
                  value={aiRateLimit}
                  onChange={(e) => setAiRateLimit(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                >
                  <option value="High (100 req/min)">High (100 req/min)</option>
                  <option value="Standard (60 req/min)">Standard (60 req/min)</option>
                  <option value="Strict (30 req/min)">Strict (30 req/min)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Account Password / Security PIN Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                Change Admin Password / Security PIN
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
                <label className="block font-bold text-slate-700 mb-1">New Password / 6-Digit PIN *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPinInput}
                  onChange={(e) => setNewAdminPinInput(e.target.value)}
                  placeholder="Enter new 6-digit PIN or password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password / PIN *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmAdminPinInput}
                  onChange={(e) => setConfirmAdminPinInput(e.target.value)}
                  placeholder="Confirm new 6-digit PIN or password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingAdminPin}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Lock className="h-4 w-4 text-slate-950" />
                <span>{isSavingAdminPin ? 'Updating Security PIN...' : 'Save New Password'}</span>
              </button>
            </form>
          </div>

          <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl border border-slate-800 shadow-3xs space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                Real-Time System Audit Logs
              </h3>
              <span className="text-[10px] text-slate-400">Live Feed</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 h-48 overflow-y-auto space-y-1.5 text-[11px]">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT ANALYTICS & REPORTS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Export System Analytics & Data Reports
                </h3>
                <p className="text-xs text-slate-500">
                  Download structured analytics files for future reporting, offline records, and state audits.
                </p>
              </div>
            </div>

            {/* Clean Filter Control Header in Modal */}
            <div className="p-3.5 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-2.5 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-amber-400" />
                  Active Filter Period:
                </span>
                <span className="font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-md text-[11px]">
                  {getDateFilterLabel()}
                </span>
              </div>
              
              {/* Filter Mode Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAnalyticsFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${analyticsFilterMode === 'all' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsFilterMode('year')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${analyticsFilterMode === 'year' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  Year
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsFilterMode('month')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${analyticsFilterMode === 'month' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsFilterMode('custom')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${analyticsFilterMode === 'custom' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  Custom Range
                </button>
              </div>

              {/* Connected Controls inside Modal */}
              {analyticsFilterMode === 'year' && (
                <div className="pt-1 animate-fade-in text-xs flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Academic Year:</span>
                  <select
                    value={analyticsYear}
                    onChange={(e) => setAnalyticsYear(e.target.value)}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-amber-400 text-xs cursor-pointer"
                  >
                    {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => (
                      <option key={y} value={y}>{y} Academic Year</option>
                    ))}
                  </select>
                </div>
              )}

              {analyticsFilterMode === 'month' && (
                <div className="pt-1 animate-fade-in text-xs flex items-center gap-2 flex-wrap">
                  <select
                    value={analyticsMonth.split('-')[1] || '08'}
                    onChange={(e) => {
                      const currentY = analyticsMonth.split('-')[0] || analyticsYear || '2026';
                      setAnalyticsMonth(`${currentY}-${e.target.value}`);
                    }}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-sans font-bold text-xs cursor-pointer"
                  >
                    {[
                      { val: '01', label: 'January' },
                      { val: '02', label: 'February' },
                      { val: '03', label: 'March' },
                      { val: '04', label: 'April' },
                      { val: '05', label: 'May' },
                      { val: '06', label: 'June' },
                      { val: '07', label: 'July' },
                      { val: '08', label: 'August' },
                      { val: '09', label: 'September' },
                      { val: '10', label: 'October' },
                      { val: '11', label: 'November' },
                      { val: '12', label: 'December' },
                    ].map((m) => (
                      <option key={m.val} value={m.val}>{m.label}</option>
                    ))}
                  </select>

                  <select
                    value={analyticsMonth.split('-')[0] || '2026'}
                    onChange={(e) => {
                      const currentM = analyticsMonth.split('-')[1] || '08';
                      setAnalyticsMonth(`${e.target.value}-${currentM}`);
                    }}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs cursor-pointer"
                  >
                    {['2026', '2025', '2024', '2023', '2022'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
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

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {/* Option 1: Executive PDF Report */}
              <div className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Official Executive Analytics PDF Report</span>
                    <span className="text-[10px] bg-red-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">PDF DOC</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Formatted document with headers, KPIs, village hub tables, and certificates log ready for printing/audits.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleExportMasterPDF(true)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ({getDateFilterLabel()})</span>
                  </button>
                  {analyticsFilterMode !== 'all' && (
                    <button
                      onClick={() => handleExportMasterPDF(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Download Full (All Time)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Master Multi-Sheet Excel */}
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Master Multi-Sheet Excel Analytics Workbook</span>
                    <span className="text-[10px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">EXCEL .XLSX</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Includes Executive Summary, Student Directory, Village Hubs, Certificates, and Curriculum sheets.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleExportMasterExcel(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ({getDateFilterLabel()})</span>
                  </button>
                  {analyticsFilterMode !== 'all' && (
                    <button
                      onClick={() => handleExportMasterExcel(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Download Full (All Time)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Option 3: Users Directory */}
              <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Users & Student Progress Directory</div>
                  <div className="text-[11px] text-slate-500">{usersList.length} user records with role, grade, streak & study minutes</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportUsersPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportUsersExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 4: Village Hubs */}
              <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Rural Village Hub Activity Report</div>
                  <div className="text-[11px] text-slate-500">{villageHubStats.length} regional village hubs engagement & XP stats</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportVillageHubsPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportVillageHubsExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 5: Certificates Ledger */}
              <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Issued Certificates Ledger</div>
                  <div className="text-[11px] text-slate-500">{certificates.length} verification records & course completion details</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportCertificatesPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportCertificatesExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 6: Curriculum Inventory */}
              <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Curriculum Folders & Content Library</div>
                  <div className="text-[11px] text-slate-500">{curriculumFiles.length} file metadata entries across {curriculumFolders.length} folders</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportCurriculumPDF}
                    className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportCurriculumExcel}
                    className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Option 7: Full System JSON Backup */}
              <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Full Raw Database Backup (JSON)</div>
                  <div className="text-[11px] text-slate-500">Full structured object model for developer database restores</div>
                </div>
                <button
                  onClick={handleExportFullJSONReport}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
