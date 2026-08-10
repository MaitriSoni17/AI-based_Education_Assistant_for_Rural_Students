import React, { useState, useEffect, useMemo } from 'react';
import { LanguageCode, User, CurriculumFolder, CurriculumFile } from '../../types';
import { getAllFirebaseCurriculumFolders, getAllFirebaseCurriculumFiles, getFirebaseCurriculumFileDataUrl } from '../../lib/firebase';
import { getFileLocal, saveFileLocal } from '../../lib/indexedDbStore';
import { speakText, stopSpeaking } from '../../utils/speech';
import { PdfCanvasViewer } from '../admin/PdfCanvasViewer';
import InteractiveDiagram from './InteractiveDiagram';
import SlideVisualBoard from './SlideVisualBoard';
import { 
  FileText, BookOpen, Folder, FolderOpen, Search, Download, Sparkles, 
  Volume2, VolumeX, Eye, CheckCircle2, ArrowLeft, ChevronRight, Filter, 
  Layers, Clock, Grid, List, X, Award, ExternalLink, RefreshCw, AlertCircle, Globe, Zap
} from 'lucide-react';

interface AdminPdfsTabProps {
  user: User;
  lang: LanguageCode;
}

// Default Seed Folders for Rural Students (Empty so students only see admin-uploaded content)
const DEFAULT_CURRICULUM_FOLDERS: CurriculumFolder[] = [];

// Helper to construct a standard clean 100% compliant PDF-1.4 binary text data URL for local viewing
const generateStandardPdfDataUrl = (title: string, subject: string, std: string, desc: string): string => {
  const cleanTitle = (title || 'Study Guide').replace(/[^\w\s.-]/gi, ' ').trim();
  const cleanSubject = (subject || 'General').replace(/[^\w\s.-]/gi, ' ').trim();
  const cleanStd = (std || 'Class 10').replace(/[^\w\s.-]/gi, ' ').trim();
  const cleanDesc = (desc || 'Gramin Shiksha Study Material').replace(/[^\x20-\x7E]/g, ' ').trim();

  // Escape parentheses for PDF text strings
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const lines = [
    `BT`,
    `/F1 20 Tf`,
    `50 730 Td`,
    `(${esc(cleanTitle.slice(0, 50))}) Tj`,
    `/F1 12 Tf`,
    `0 -35 Td`,
    `(Subject: ${esc(cleanSubject)}  |  Class: ${esc(cleanStd)}) Tj`,
    `0 -20 Td`,
    `(Board: GSEB / CBSE State Curriculum) Tj`,
    `0 -30 Td`,
    `(Official Study Material prepared by Admin & Rural Education Council) Tj`,
    `0 -40 Td`,
    `/F1 14 Tf`,
    `(Key Study Notes & Overview:) Tj`,
    `/F1 11 Tf`,
    `0 -25 Td`,
    `(${esc(cleanDesc.slice(0, 75))}) Tj`,
    `0 -20 Td`,
    `(${esc(cleanDesc.slice(75, 150))}) Tj`,
    `0 -20 Td`,
    `(${esc(cleanDesc.slice(150, 225))}) Tj`,
    `0 -40 Td`,
    `(Gramin Shiksha AI Educational Platform - Offline Study Guide) Tj`,
    `ET`
  ].join('\n');

  const streamBytes = new TextEncoder().encode(lines);
  const streamLen = streamBytes.length;

  const header = `%PDF-1.4\n`;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4Head = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const obj4Foot = `\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Calculate exact byte offsets for xref table
  let offset = header.length;
  const off1 = offset;
  offset += obj1.length;
  const off2 = offset;
  offset += obj2.length;
  const off3 = offset;
  offset += obj3.length;
  const off4 = offset;
  offset += obj4Head.length + streamLen + obj4Foot.length;
  const off5 = offset;
  offset += obj5.length;

  const xrefOffset = offset;
  const pad = (n: number) => n.toString().padStart(10, '0');

  const xref = [
    `xref`,
    `0 6`,
    `0000000000 65535 f `,
    `${pad(off1)} 00000 n `,
    `${pad(off2)} 00000 n `,
    `${pad(off3)} 00000 n `,
    `${pad(off4)} 00000 n `,
    `${pad(off5)} 00000 n `,
    `trailer`,
    `<< /Size 6 /Root 1 0 R >>`,
    `startxref`,
    `${xrefOffset}`,
    `%%EOF`
  ].join('\n');

  const fullPdfText = header + obj1 + obj2 + obj3 + obj4Head + lines + obj4Foot + obj5 + xref;

  try {
    const bytes = new TextEncoder().encode(fullPdfText);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:application/pdf;base64,${btoa(binary)}`;
  } catch (e) {
    console.error("Failed to generate PDF Base64 string:", e);
    return `data:application/pdf;base64,`;
  }
};

// Default Seed Curriculum PDF Files (Empty so students only see files uploaded by Admin)
const DEFAULT_CURRICULUM_FILES: CurriculumFile[] = [];

export default function AdminPdfsTab({ user, lang }: AdminPdfsTabProps) {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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


  // Load Curriculum Files from Firestore & LocalStorage
  const loadCurriculumData = async () => {
    setLoading(true);
    try {
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
      DEFAULT_CURRICULUM_FILES.forEach(f => fileMap.set(f.id, f));
      localFiles.forEach(f => {
        const existing = fileMap.get(f.id);
        fileMap.set(f.id, {
          ...f,
          fileDataUrl: f.fileDataUrl || (existing ? existing.fileDataUrl : undefined)
        });
      });
      (remoteFiles as any[]).forEach(rf => {
        const existing = fileMap.get(rf.id);
        fileMap.set(rf.id, {
          ...(rf as CurriculumFile),
          fileDataUrl: (rf as CurriculumFile).fileDataUrl || (existing ? existing.fileDataUrl : undefined)
        });
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

      return true;
    });
  }, [files, currentFolderId, searchQuery, selectedSubject, selectedStandard, selectedCategory]);

  // Unique Subjects List
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.subject) set.add(f.subject);
    });
    return Array.from(set);
  }, [files]);

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
      dataUrl = generateStandardPdfDataUrl(file.name, file.subject, file.standard || 'Class 10', file.description || '');
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
            <span>Official School Curriculum & Admin PDFs</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            PDF Notes & Study Materials
          </h2>

          <p className="text-sm text-rose-100 font-sans leading-relaxed">
            Access, read, and download official chapter notes, solved model question papers, board exam formula sheets, and worksheets published directly by your admin & school teachers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-300" />
              <span className="font-bold">{files.length} Official Documents</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span className="font-bold">{folders.length} Study Folders</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-300" />
              <span className="font-bold">{downloadedPdfIds.length} Saved Offline</span>
            </div>
          </div>
        </div>
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
              placeholder="Search PDF notes, titles, or subjects..."
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
              <span>Sync</span>
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

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
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
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Material Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Material Types</option>
              <option value="pdf">📄 PDF Notes & Worksheets</option>
              <option value="document">📝 Text Documents</option>
              <option value="quiz">🎯 Question Banks</option>
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

              return (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-rose-300 transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md uppercase font-mono">
                          PDF
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
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActivePdfFile(file);
                        setPdfWorkspaceTab('reader');
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read PDF</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFileToDevice(file)}
                      title={isDownloaded ? "Saved Offline" : "Download PDF File"}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isDownloaded 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setActivePdfFile(file);
                        setPdfWorkspaceTab('summary');
                      }}
                      title="AI Quick Summary"
                      className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
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

              return (
                <div key={file.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-mono">
                          PDF
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

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        setActivePdfFile(file);
                        setPdfWorkspaceTab('reader');
                      }}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read PDF</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFileToDevice(file)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isDownloaded 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
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

            {/* Modal Tabs Bar */}
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap bg-slate-100 p-1.5 gap-2 border-b border-slate-200 shrink-0">
              <button
                onClick={() => setPdfWorkspaceTab('reader')}
                className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  pdfWorkspaceTab === 'reader' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Reader</span>
              </button>

              <button
                onClick={() => setPdfWorkspaceTab('translate')}
                className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  pdfWorkspaceTab === 'translate' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Translate</span>
              </button>

              <button
                onClick={() => setPdfWorkspaceTab('solve')}
                className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  pdfWorkspaceTab === 'solve' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Solve Questions</span>
              </button>
              
              <button
                onClick={() => setPdfWorkspaceTab('summary')}
                className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  pdfWorkspaceTab === 'summary' ? 'bg-white text-purple-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Summarize</span>
              </button>

              <button
                onClick={() => setPdfWorkspaceTab('notes')}
                className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  pdfWorkspaceTab === 'notes' ? 'bg-white text-amber-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Short Notes</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 flex flex-col">
              {pdfWorkspaceTab === 'reader' && (
                <div className="flex-1 min-h-[500px]">
                  <PdfCanvasViewer
                    fileId={activePdfFile.id}
                    fileDataUrl={activePdfFile.fileDataUrl}
                    fileName={activePdfFile.name}
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
                      return generateStandardPdfDataUrl(activePdfFile.name, activePdfFile.subject, activePdfFile.standard || 'Class 10', activePdfFile.description || '');
                    }}
                    onDownload={() => handleDownloadFileToDevice(activePdfFile)}
                    onPagesTextExtracted={setActivePdfText}
                  />
                </div>
              )}

              {pdfWorkspaceTab !== 'reader' && (
                <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
                  
                  {/* Action Config Box */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className={`p-3 rounded-2xl ${
                        pdfWorkspaceTab === 'translate' ? 'bg-sky-50 text-sky-600' :
                        pdfWorkspaceTab === 'solve' ? 'bg-emerald-50 text-emerald-600' :
                        pdfWorkspaceTab === 'summary' ? 'bg-purple-50 text-purple-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {pdfWorkspaceTab === 'translate' && <Globe className="w-6 h-6" />}
                        {pdfWorkspaceTab === 'solve' && <CheckCircle2 className="w-6 h-6" />}
                        {pdfWorkspaceTab === 'summary' && <Sparkles className="w-6 h-6" />}
                        {pdfWorkspaceTab === 'notes' && <FileText className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900">
                          {pdfWorkspaceTab === 'translate' && 'Translate Content'}
                          {pdfWorkspaceTab === 'solve' && 'Solve Practice Questions'}
                          {pdfWorkspaceTab === 'summary' && 'Generate Topic Summary'}
                          {pdfWorkspaceTab === 'notes' && 'Create Revision Short Notes'}
                        </h4>
                        <p className="text-sm text-slate-500">
                          Powered by GyaanBot AI Mentor
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1">Target Language:</label>
                        <select 
                          value={workspaceTargetLang}
                          onChange={(e) => setWorkspaceTargetLang(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="en">English (Default)</option>
                          <option value="hi">Hindi (हिंदी)</option>
                          <option value="gu">Gujarati (ગુજરાતી)</option>
                          <option value="mr">Marathi (मराठी)</option>
                          <option value="bn">Bengali (বাংলা)</option>
                          <option value="ta">Tamil (தமிழ்)</option>
                          <option value="te">Telugu (తెలుగు)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1">Custom Context (Optional):</label>
                        <input 
                          type="text"
                          value={workspaceInput}
                          onChange={(e) => setWorkspaceInput(e.target.value)}
                          placeholder="E.g. specific page, paragraph, or question number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleWorkspaceAction(pdfWorkspaceTab)}
                      disabled={workspaceLoading || activePdfText.length === 0}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {workspaceLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing Document...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>Generate Response</span>
                        </>
                      )}
                    </button>
                    {activePdfText.length === 0 && !workspaceLoading && (
                      <p className="text-xs font-medium text-amber-600">Please wait for the PDF reader to finish extracting text first.</p>
                    )}
                  </div>

                  {/* Result Area */}
                  {workspaceResult && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                          <button
                            onClick={() => setWorkspaceViewMode('text')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${workspaceViewMode === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Text Document
                          </button>
                          <button
                            onClick={() => setWorkspaceViewMode('diagram')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${workspaceViewMode === 'diagram' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Flow Diagram
                          </button>
                          <button
                            onClick={() => setWorkspaceViewMode('video')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${workspaceViewMode === 'video' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Video Lesson
                          </button>
                        </div>
                        <button
                          onClick={handleDownloadWorkspacePdf}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Download className="w-4 h-4 text-amber-400" />
                          <span>Export PDF</span>
                        </button>
                      </div>

                      {/* Mode: TEXT */}
                      {workspaceViewMode === 'text' && (
                        <div className="prose prose-sm max-w-none prose-slate prose-headings:text-indigo-950 prose-a:text-indigo-600 text-slate-800">
                          <div dangerouslySetInnerHTML={{ 
                            __html: workspaceResult.text
                              ? workspaceResult.text.replace(/\\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              : 'No text response generated.' 
                          }} />
                        </div>
                      )}

                      {/* Mode: DIAGRAM */}
                      {workspaceViewMode === 'diagram' && workspaceResult.diagram && (
                        <div className="h-[400px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
                           <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-bold text-sm text-slate-800">
                             {workspaceResult.diagram.title}
                           </div>
                           <InteractiveDiagram data={{ type: 'flowchart', title: workspaceResult.diagram.title, nodes: workspaceResult.diagram.nodes.map((n:any)=>({id:n.id, label:n.label, description:n.description})) }} lang={workspaceTargetLang as LanguageCode} />
                        </div>
                      )}

                      {/* Mode: VIDEO */}
                      {workspaceViewMode === 'video' && workspaceResult.video && workspaceResult.video.slides && workspaceResult.video.slides.length > 0 && (
                        <div className="h-[500px] rounded-2xl overflow-hidden relative shadow-inner">
                           <SlideVisualBoard
                             slide={{
                               id: `slide-${videoSlideIndex}`,
                               title: workspaceResult.video.slides[videoSlideIndex].title || 'Concept Slide',
                               content: '',
                               bullets: workspaceResult.video.slides[videoSlideIndex].bullets || [],
                               visualLayout: 'diagram'
                             }}
                             currentSlideIndex={videoSlideIndex}
                             isPlaying={false}
                             lang={workspaceTargetLang as LanguageCode}
                           />
                           
                           <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 shadow-xl">
                             <p className="text-white text-sm flex-1 font-medium italic pr-4">
                               "{workspaceResult.video.slides[videoSlideIndex].narrative}"
                             </p>
                             <div className="flex gap-2 shrink-0">
                               <button 
                                 onClick={() => setVideoSlideIndex(Math.max(0, videoSlideIndex - 1))}
                                 disabled={videoSlideIndex === 0}
                                 className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold rounded-xl text-sm transition-all"
                               >
                                 Prev
                               </button>
                               <button 
                                 onClick={() => {
                                   const textToSpeak = workspaceResult.video.slides[videoSlideIndex].narrative;
                                   if (textToSpeak) speakText(textToSpeak, workspaceTargetLang as LanguageCode);
                                 }}
                                 className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
                               >
                                 <Volume2 className="w-5 h-5" />
                               </button>
                               <button 
                                 onClick={() => setVideoSlideIndex(Math.min(workspaceResult.video.slides.length - 1, videoSlideIndex + 1))}
                                 disabled={videoSlideIndex === workspaceResult.video.slides.length - 1}
                                 className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-30 font-bold rounded-xl text-sm transition-all"
                               >
                                 Next
                               </button>
                             </div>
                           </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
