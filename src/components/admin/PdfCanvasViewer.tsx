import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import MathRenderer from '../common/MathRenderer';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2, 
  Download, 
  AlertCircle, 
  Maximize2, 
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
  Languages
} from 'lucide-react';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import { LanguageCode } from '../../types';

interface PdfCanvasViewerProps {
  fileId: string;
  fileDataUrl?: string;
  fileName: string;
  fullContent?: string;
  isAiGenerated?: boolean;
  onGetFileLocal: (id: string) => Promise<string | null>;
  onDownload: () => void;
  onPagesTextExtracted?: (pages: { pageNum: number; text: string }[]) => void;
}

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

interface TextOverlayItem {
  str: string;
  left: number;
  top: number;
  fontSize: number;
  width: number;
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
  const [textOverlayItems, setTextOverlayItems] = useState<TextOverlayItem[]>([]);
  const [pageFullText, setPageFullText] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Matrix multiplier helper for exact PDF coordinate transform
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

  // Handle PDF Canvas rendering & text layer extraction
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

        // Fetch Text Layer Content for overlay, copy selection & highlight rendering
        if (isMounted) {
          const textContent = await page.getTextContent();
          const items: TextOverlayItem[] = [];
          let fullTxt = '';

          const pdfjsUtil = (window as any).pdfjsLib?.Util;

          for (const item of textContent.items) {
            if (!item.str || !item.transform) continue;
            fullTxt += item.str + ' ';

            let tx: number[];
            if (pdfjsUtil && typeof pdfjsUtil.transform === 'function') {
              tx = pdfjsUtil.transform(viewport.transform, item.transform);
            } else {
              tx = transformMatrix(viewport.transform, item.transform);
            }

            const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
            const left = tx[4];
            const top = tx[5] - fontSize * 0.82; // baseline offset
            const width = item.width ? item.width * scale : fontSize * item.str.length * 0.55;

            items.push({
              str: item.str,
              left,
              top,
              fontSize,
              width,
            });
          }

          // Fallback for image-based or AI-generated PDFs where PDF.js extracts 0 text items
          if (items.length === 0 && fallbackText) {
            fullTxt = fallbackText;
            const lines = fallbackText.split('\n').map(l => l.trim()).filter(Boolean);
            const startY = 60 * scale;
            const lineHeight = 20 * scale;
            const startX = 35 * scale;
            const fontSz = Math.max(10, Math.min(15, 12 * scale));

            lines.forEach((line, lineIdx) => {
              const words = line.split(/\s+/);
              let currentX = startX;
              const currentY = startY + lineIdx * lineHeight;

              words.forEach(word => {
                if (!word) return;
                const wordWidth = fontSz * word.length * 0.55;
                items.push({
                  str: word + ' ',
                  left: currentX,
                  top: currentY,
                  fontSize: fontSz,
                  width: wordWidth,
                });
                currentX += wordWidth + fontSz * 0.35;
                if (viewport && currentX > viewport.width - 40 * scale) {
                  currentX = startX;
                }
              });
            });
          }

          if (isMounted) {
            setTextOverlayItems(items);
            setPageFullText(fullTxt.trim());
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
  }, [isVisible, pdfDoc, scale, rotation, pageNum]);

  const isRotatedLandscape = rotation === 90 || rotation === 270;
  const width = (isRotatedLandscape ? pageSize.height : pageSize.width) * scale;
  const height = (isRotatedLandscape ? pageSize.width : pageSize.height) * scale;

  // Helper to render text item with on-canvas keyword search highlight
  const renderHighlightedTextItem = (item: TextOverlayItem, index: number) => {
    const { str, left, top, fontSize, width } = item;
    const query = searchQuery.trim();

    if (!query) {
      return (
        <span
          key={`txt-item-${index}`}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            fontSize: `${fontSize}px`,
            lineHeight: '1.1',
            whiteSpace: 'pre',
            color: 'transparent',
            cursor: 'text',
          }}
          className="select-text"
        >
          {str}
        </span>
      );
    }

    const lowerStr = str.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (!lowerStr.includes(lowerQuery)) {
      return (
        <span
          key={`txt-item-${index}`}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            fontSize: `${fontSize}px`,
            lineHeight: '1.1',
            whiteSpace: 'pre',
            color: 'transparent',
            cursor: 'text',
          }}
          className="select-text"
        >
          {str}
        </span>
      );
    }

    // Split string into non-matching parts and highlighted mark elements
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let matchIdx = lowerStr.indexOf(lowerQuery, lastIdx);

    while (matchIdx !== -1) {
      if (matchIdx > lastIdx) {
        parts.push(str.substring(lastIdx, matchIdx));
      }

      const matchText = str.substring(matchIdx, matchIdx + query.length);

      parts.push(
        <mark
          key={`m-${matchIdx}`}
          className="bg-yellow-300 text-slate-950 font-black px-1 rounded-2xs ring-2 ring-amber-500 shadow-md z-30 inline-block"
          style={{
            fontSize: `${Math.max(11, fontSize)}px`,
            lineHeight: '1.1',
          }}
        >
          {matchText}
        </mark>
      );

      lastIdx = matchIdx + query.length;
      matchIdx = lowerStr.indexOf(lowerQuery, lastIdx);
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

    return (
      <span
        key={`txt-item-${index}`}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          fontSize: `${fontSize}px`,
          lineHeight: '1.1',
          whiteSpace: 'pre',
          color: 'transparent',
          cursor: 'text',
        }}
        className="select-text"
      >
        {parts}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center shrink-0 w-fit">
      {/* PDF Page Canvas */}
      <div
        ref={(el) => {
          containerRef.current = el;
          setRef(pageNum, el);
        }}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="relative bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-all"
      >
        {isVisible ? (
          <>
            <canvas ref={canvasRef} className="w-full h-full block bg-white" />

            {/* Accessible Selectable Text Layer Overlay with Search Word Highlighting */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-auto select-text z-10"
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              {textOverlayItems.map((item, idx) => renderHighlightedTextItem(item, idx))}
            </div>
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

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileId,
  fileDataUrl,
  fileName,
  fullContent,
  isAiGenerated,
  onGetFileLocal,
  onDownload,
  onPagesTextExtracted,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);

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
  const [targetLanguage, setTargetLanguage] = useState<string>('Hindi');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<{ id: string; sender: 'user' | 'assistant'; text: string; timestamp: string }[]>([
    {
      id: 'ai-welcome',
      sender: 'assistant',
      text: `Hello! I am your **AI Study Task Assistant** for **${fileName}**. You can ask me to summarize pages, extract key formulas, generate quizzes, or answer questions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const aiChatScrollRef = useRef<HTMLDivElement | null>(null);

  const [pageInputVal, setPageInputVal] = useState<string>('1');
  const [isEditingPageInput, setIsEditingPageInput] = useState<boolean>(false);

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

  // Selection change listener for Floating Copy & AI Popover Menu
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';

      if (text.length > 2) {
        setSelectedText(text);
        try {
          const range = sel?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect) {
            setSelectionPos({
              x: Math.max(10, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 100)),
              y: Math.max(10, rect.top - 50)
            });
          }
        } catch {
          setSelectionPos(null);
        }
      } else {
        setSelectedText('');
        setSelectionPos(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
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

  // Load PDF Engine
  useEffect(() => {
    let isMounted = true;

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
      navigator.clipboard.writeText(selectedText);
      triggerToast(`Copied selected text to clipboard!`);
      setSelectedText('');
      setSelectionPos(null);
    }
  };

  // AI Task execution handler
  const handleRunAiTask = async (
    taskType: 'translate_page' | 'translate_doc' | 'summarize_page' | 'summarize_doc' | 'solve_questions' | 'short_notes' | 'key_concepts' | 'quiz' | 'simplify' | 'explain_selection' | 'chat',
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

    switch (taskType) {
      case 'translate_page':
        userDisplayMsg = `Translate Page ${pageNumToUse} (${targetLanguage})`;
        promptText = `Translate the entire text content of Page ${pageNumToUse} of the study material "${fileName}" into ${targetLanguage}. Maintain accurate educational terminology, clear headings, and structured bullet formatting.\n\nPage Content:\n${currentPageText || fullDocText}`;
        break;
      case 'translate_doc':
        userDisplayMsg = `Translate PDF Document (${targetLanguage})`;
        promptText = `Translate the key topics and content of the PDF document "${fileName}" into ${targetLanguage}. Maintain accurate educational terminology, clear headings, and structured bullet formatting.\n\nDocument Content:\n${fullDocText}`;
        break;
      case 'summarize_page':
        userDisplayMsg = `Summarize Page ${pageNumToUse}`;
        promptText = `Please provide a clear, structured bulleted summary of Page ${pageNumToUse} of the study material "${fileName}".\n\nPage Text Content:\n${currentPageText}`;
        break;
      case 'summarize_doc':
        userDisplayMsg = `Summarize entire PDF document`;
        promptText = `Please provide an executive summary, key takeaways, and chapter breakdown for the PDF study material "${fileName}".\n\nDocument Content:\n${fullDocText}`;
        break;
      case 'solve_questions':
        userDisplayMsg = `Solve Questions on Page ${pageNumToUse}`;
        promptText = `Identify and solve all practice questions, exercises, or numerical problems found in Page ${pageNumToUse} of "${fileName}". Provide step-by-step solutions, formulas used, and final answers clearly formatted in markdown.\n\nPage Content:\n${currentPageText || fullDocText}`;
        break;
      case 'short_notes':
        userDisplayMsg = `Create Revision Short Notes for Page ${pageNumToUse}`;
        promptText = `Create concise, high-yield revision short notes, formula cheat sheet, and memory key points for Page ${pageNumToUse} of "${fileName}".\n\nPage Content:\n${currentPageText || fullDocText}`;
        break;
      case 'key_concepts':
        userDisplayMsg = `Extract key concepts & formulas (Page ${pageNumToUse})`;
        promptText = `Extract all key definitions, formulas, rules, and core concepts from Page ${pageNumToUse} (and document overview) of "${fileName}". Present them clearly with bullet points and bold headers.\n\nContext:\n${currentPageText || fullDocText}`;
        break;
      case 'quiz':
        userDisplayMsg = `Generate 5 Practice Questions (Page ${pageNumToUse})`;
        promptText = `Create 5 multiple choice questions (with options A, B, C, D and detailed correct answer explanations) based on Page ${pageNumToUse} of "${fileName}".\n\nContent:\n${currentPageText || fullDocText}`;
        break;
      case 'simplify':
        userDisplayMsg = `Simplify language for students (Page ${pageNumToUse})`;
        promptText = `Rewrite and explain the concepts in Page ${pageNumToUse} of "${fileName}" in simple, friendly, easy-to-understand language suitable for school students.\n\nContent:\n${currentPageText}`;
        break;
      case 'explain_selection':
        userDisplayMsg = `Explain selected text: "${selectedText.slice(0, 60)}..."`;
        promptText = `Explain the following selected text excerpt from "${fileName}" (Page ${pageNumToUse}) in detail with simple analogies:\n\n"${selectedText}"`;
        break;
      case 'chat':
        userDisplayMsg = customPrompt || `Question about Page ${pageNumToUse}`;
        promptText = `Study Material Document: "${fileName}"\nActive Page: ${pageNumToUse}\n\nContext Page Text:\n${currentPageText}\n\nStudent Question: ${customPrompt}`;
        break;
    }

    const newUserMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user' as const,
      text: userDisplayMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, newUserMsg]);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          systemInstruction: `You are GyaanBot's expert AI Solver Chatbot. Help the student understand the study material document "${fileName}". Provide clear, well-structured educational explanations with markdown formatting.`,
        })
      });

      const data = await response.json();
      if (data.success) {
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'assistant' as const,
          text: data.text,
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

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.65));
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

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative w-full select-none">
      
      {/* Toast Feedback Popup */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Selection AI Menu Popover */}
      {selectedText && selectionPos && (
        <div
          style={{ left: `${selectionPos.x}px`, top: `${selectionPos.y}px` }}
          className="fixed z-50 bg-slate-950 border border-slate-700/80 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1.5 text-white animate-fade-in select-none"
        >
          {!isAiGenerated && (
            <button
              onClick={handleCopySelectedText}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md"
              title="Copy Selected Text"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
          )}
          <button
            onClick={() => handleRunAiTask('explain_selection')}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            title="Explain Selected Text with AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Explain</span>
          </button>
          <button
            onClick={() => speakText(selectedText, 'en')}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white cursor-pointer"
            title="Read Selection Aloud"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setSelectedText(''); setSelectionPos(null); }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Reader Control Panel */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-300 gap-3 shrink-0 z-20">
        
        {/* Left: Interactive Page Number Navigation & Jump */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* First Page Shortcut */}
          <button
            onClick={() => jumpToPage(1)}
            disabled={activePageNum <= 1}
            className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="First Page (Page 1)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => activePageNum > 1 && jumpToPage(activePageNum - 1)}
            disabled={activePageNum <= 1}
            className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Interactive Editable Page Number Input Box & Dropdown Select */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Page</span>
            
            {/* Direct Number Input Form */}
            <form onSubmit={handlePageInputSubmit} className="flex items-center">
              <input
                type="number"
                min={1}
                max={numPages || 1}
                value={pageInputVal}
                onFocus={() => setIsEditingPageInput(true)}
                onChange={(e) => setPageInputVal(e.target.value)}
                onBlur={() => handlePageInputSubmit()}
                className="w-12 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-lg text-center font-extrabold text-emerald-400 text-xs py-0.5 px-1 focus:outline-none transition-colors shadow-inner"
                title="Click or type page number and press Enter to change page"
              />
            </form>

            {/* Quick Page Dropdown Picker */}
            {numPages > 1 && (
              <select
                value={activePageNum}
                onChange={(e) => {
                  const pg = parseInt(e.target.value, 10);
                  if (pg) jumpToPage(pg);
                }}
                className="bg-slate-950 text-slate-300 text-[11px] font-medium border border-slate-800 rounded-lg py-0.5 px-1 focus:outline-none focus:border-emerald-500 cursor-pointer hidden md:block max-w-[95px]"
                title="Jump to specific page"
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => (
                  <option key={`p-opt-${pg}`} value={pg}>
                    Page {pg}
                  </option>
                ))}
              </select>
            )}

            <span className="text-slate-400 text-xs font-mono">
              of <strong className="text-slate-200">{numPages || '?'}</strong>
            </span>
          </div>

          {/* Next Page */}
          <button
            onClick={() => activePageNum < numPages && jumpToPage(activePageNum + 1)}
            disabled={activePageNum >= numPages}
            className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last Page Shortcut */}
          <button
            onClick={() => numPages > 0 && jumpToPage(numPages)}
            disabled={activePageNum >= numPages}
            className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white"
            title={`Last Page (Page ${numPages})`}
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>

        {/* Middle: Word Search field */}
        {!isAiGenerated && (
          <div className="flex items-center gap-2 flex-1 max-w-xs min-w-[160px] relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search word in PDF..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {indexingText && (
              <span title="Indexing text...">
                <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin shrink-0" />
              </span>
            )}

            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono select-none">
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
          </div>
        )}

        {/* Right Side: Zoom, Integrated AI Tools & Download */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            onClick={zoomOut}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* AI Task Assistant Toggle Button */}
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className={`px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
              showAiAssistant
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* Copy Full Document Text Button */}
          {!isAiGenerated && (
            <button
              onClick={handleCopyFullDocumentText}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors text-xs"
              title="Copy Full Document Text"
            >
              <Copy className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Copy Text</span>
            </button>
          )}

          <button
            onClick={() => {
              if (onDownload) onDownload();
              setToastMessage('⭐ Saved into My Saved Material!');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-amber-500/40 transition-colors text-xs"
            title="Save to My Saved Material"
          >
            <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={onDownload}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Canvas Viewport + AI Assistant Panel */}
      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
        
        {/* Search Results Sidebar */}
        {searchQuery.trim() !== '' && (
          <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-hidden">
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

        {/* Central PDF Canvas Viewport */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-slate-950 flex flex-col items-center gap-8 py-8 px-4 scrollbar-thin select-text min-h-0 relative w-full"
          style={{ height: '100%' }}
        >
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


        </div>

        {/* AI Task Assistant Side Panel */}
        {showAiAssistant && (
          <div className="w-80 sm:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 h-full overflow-hidden z-30 shadow-2xl animate-fade-in">
            {/* AI Assistant Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/30 rounded-xl border border-purple-500/30 text-purple-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <span>AI Solver Chatbot</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Multi-Language • Page {activePageNum} of {numPages}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAiAssistant(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick AI Task Actions Grid */}
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {/* 1. Solve Page Questions */}
                <button
                  onClick={() => handleRunAiTask('solve_questions')}
                  disabled={aiLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Solve all questions on active page"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Solve Questions</span>
                </button>

                {/* 2. Key Formulas */}
                <button
                  onClick={() => handleRunAiTask('key_concepts')}
                  disabled={aiLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Extract key formulas & concepts"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Key Formulas</span>
                </button>

                {/* 3. Practice Quiz */}
                <button
                  onClick={() => handleRunAiTask('quiz')}
                  disabled={aiLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Generate 5 practice questions"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">5 Practice Quiz</span>
                </button>

                {/* 4. Summarize Page */}
                <button
                  onClick={() => handleRunAiTask('summarize_page')}
                  disabled={aiLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Summarize page in bullet points"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Page Summary</span>
                </button>

                {/* 5. Revision Notes */}
                <button
                  onClick={() => handleRunAiTask('short_notes')}
                  disabled={aiLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors col-span-2 sm:col-span-1"
                  title="Create revision short notes"
                >
                  <Star className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Revision Notes</span>
                </button>
              </div>
            </div>

            {/* AI Messages Chat History */}
            <div ref={aiChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col text-xs leading-relaxed ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[92%] space-y-1.5 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-2xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-2xs'
                    }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <div className="prose prose-invert prose-xs max-w-none">
                        <MathRenderer content={msg.text} isUser={false} className="text-slate-200" />
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const codeMap: Record<string, LanguageCode> = {
                                'English': 'en',
                                'Hindi': 'hi',
                                'Gujarati': 'gu',
                                'Marathi': 'mr',
                                'Tamil': 'ta',
                                'Telugu': 'te',
                                'Hinglish': 'hi',
                                'Bengali': 'hi',
                                'Kannada': 'en',
                                'Malayalam': 'en',
                                'Punjabi': 'hi',
                                'Urdu': 'hi'
                              };
                              const speechLang = codeMap[targetLanguage] || 'en';
                              speakText(msg.text, speechLang);
                            }}
                            className="hover:text-white cursor-pointer"
                            title={`Speak Response (${targetLanguage})`}
                          >
                            <Volume2 className="w-3 h-3 text-purple-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-2xl text-xs text-purple-300 border border-purple-900/30 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>AI Solver Chatbot working in {targetLanguage}...</span>
                </div>
              )}
            </div>

            {/* AI Prompt Input Bar with Speech-to-Text */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPromptInput.trim()) {
                    handleRunAiTask('chat', aiPromptInput.trim());
                    setAiPromptInput('');
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Ask AI Solver in ${targetLanguage} about Page ${activePageNum}...`}
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
                  className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white rounded-xl cursor-pointer shadow-md transition-all"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
