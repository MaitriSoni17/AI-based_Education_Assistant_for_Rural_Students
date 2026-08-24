import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { safeFetchJson } from '../../utils/safeFetch';
import MathRenderer, { normalizeMathText } from '../common/MathRenderer';
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
  Move
} from 'lucide-react';
import { speakText, stopSpeaking } from '../../utils/speech';
import SpeechInputButton from '../SpeechInputButton';
import { LanguageCode } from '../../types';
import { CustomSelect } from '../common/CustomSelect';

interface PdfCanvasViewerProps {
  fileId: string;
  fileDataUrl?: string;
  fileName: string;
  fullContent?: string;
  isAiGenerated?: boolean;
  lang?: LanguageCode;
  onGetFileLocal: (id: string) => Promise<string | null>;
  onDownload: () => void;
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

// High-performance in-memory cache for parsed PDF documents
const pdfDocCache = new Map<string, { pdf: any; width: number; height: number; numPages: number }>();

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileId,
  fileDataUrl,
  fileName,
  fullContent,
  isAiGenerated,
  lang,
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
      if (text.length > 2) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect && (rect.width > 0 || rect.height > 0)) {
            setSelectedText(text);
            setSelectionPos({
              x: Math.max(10, Math.min(window.innerWidth - 240, rect.left + rect.width / 2 - 110)),
              y: Math.max(10, rect.top - 52)
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
          data-selection-popup="true"
          style={{ left: `${selectionPos.x}px`, top: `${selectionPos.y}px` }}
          className="fixed z-50 bg-slate-950 border border-slate-700/80 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1.5 text-white animate-fade-in select-none"
        >
          {!isAiGenerated && (
            <button
              onClick={() => {
                handleCopySelectedText();
                window.getSelection()?.removeAllRanges();
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-colors shadow-md"
              title="Copy Selected Text"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
          )}
          <button
            onClick={() => {
              handleRunAiTask('explain_selection');
              setSelectedText('');
              setSelectionPos(null);
            }}
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
            onClick={() => {
              setSelectedText('');
              setSelectionPos(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Reader Control Panel - Highly Responsive for Mobile & Desktop */}
      <div className="flex flex-col bg-slate-950 border-b border-slate-800 shrink-0 z-20">
        
        {/* Main Toolbar Row */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 text-xs text-slate-300 gap-2 shrink-0">
          
          {/* Left: Interactive Page Number Navigation & Jump */}
          <div className="flex items-center gap-1">
            {/* First Page Shortcut (Desktop) */}
            <button
              onClick={() => jumpToPage(1)}
              disabled={activePageNum <= 1}
              className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white hidden sm:block"
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

            {/* Page Number Indicator / Direct Input */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 shrink-0 whitespace-nowrap">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline select-none">Page</span>
              
              <form onSubmit={handlePageInputSubmit} className="flex items-center">
                <input
                  type="number"
                  min={1}
                  max={numPages || 1}
                  value={pageInputVal}
                  onFocus={() => setIsEditingPageInput(true)}
                  onChange={(e) => setPageInputVal(e.target.value)}
                  onBlur={() => handlePageInputSubmit()}
                  className="w-10 sm:w-12 h-6 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-lg text-center font-bold text-emerald-400 text-xs py-0 px-1 focus:outline-none transition-colors shadow-inner"
                  title="Type page number and press Enter"
                />
              </form>

              <span className="text-slate-400 text-xs font-mono select-none flex items-center gap-1 whitespace-nowrap">
                <span>/</span>
                <strong className="text-slate-200 font-bold">{numPages || 1}</strong>
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

            {/* Last Page Shortcut (Desktop) */}
            <button
              onClick={() => numPages > 0 && jumpToPage(numPages)}
              disabled={activePageNum >= numPages}
              className="p-1.5 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors cursor-pointer text-slate-400 hover:text-white hidden sm:block"
              title={`Last Page (Page ${numPages})`}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>

            {/* Hand Tool / Text Select Tool Toggle */}
            <button
              onClick={() => setIsPanMode(!isPanMode)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isPanMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
              title={isPanMode ? "Hand / Pan Tool Active (Click to switch to Text Select)" : "Text Selection Mode (Click for Hand / Pan Tool)"}
            >
              {isPanMode ? <Hand className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{isPanMode ? "Hand Tool" : "Select Text"}</span>
            </button>
          </div>

          {/* Center: Desktop Word Search Field */}
          {!isAiGenerated && (
            <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xs min-w-[160px] relative mx-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search in PDF..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
                <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin shrink-0" />
              )}
            </div>
          )}

          {/* Right Side: Zoom Controls & Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            
            {/* Mobile Search Toggle Button */}
            {!isAiGenerated && (
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors lg:hidden ${
                  isMobileSearchOpen || searchQuery
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
                title="Search text in document"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Zoom Controls Pill with Preset Menu */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={zoomOut}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={() => setShowZoomMenu(!showZoomMenu)}
                className="px-1.5 sm:px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white font-bold cursor-pointer rounded transition-colors"
                title="Click for Zoom Presets"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                onClick={zoomIn}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              {/* Zoom Presets Dropdown */}
              {showZoomMenu && (
                <div className="absolute top-full right-0 mt-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 min-w-[120px] animate-fade-in text-xs">
                  <button
                    onClick={fitWidth}
                    className="px-2.5 py-1 text-left text-emerald-400 hover:bg-slate-900 rounded-lg font-bold flex items-center justify-between"
                  >
                    <span>Fit Width</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={fitPage}
                    className="px-2.5 py-1 text-left text-slate-300 hover:bg-slate-900 rounded-lg"
                  >
                    Fit Page
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

            {/* Fit Width Quick Button (Desktop) */}
            <button
              onClick={fitWidth}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer hidden md:flex items-center gap-1"
              title="Fit to Page Width"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {/* AI Task Assistant Toggle Button */}
            <button
              onClick={() => setShowAiAssistant(!showAiAssistant)}
              className={`px-2.5 sm:px-3 py-1.5 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                showAiAssistant
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md'
              }`}
              title="AI Study & Solver Assistant"
            >
              <Bot className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">AI Solver</span>
              <span className="sm:hidden font-bold">AI</span>
            </button>

            {/* Save to Saved Material Button (Desktop) */}
            <button
              onClick={() => {
                if (onDownload) onDownload();
                setToastMessage('⭐ Saved to My Saved Material!');
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl hidden sm:flex items-center gap-1 cursor-pointer border border-amber-500/40 transition-colors text-xs shrink-0"
              title="Save to My Material"
            >
              <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span className="hidden md:inline">Save</span>
            </button>
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

        {/* Central PDF Canvas Viewport with Virtualized Rendering & Smooth Pan Controls */}
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
              className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-slate-900/90 hover:bg-purple-600 text-slate-300 hover:text-white rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hidden sm:flex items-center justify-center group opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
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
              className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-slate-900/90 hover:bg-purple-600 text-slate-300 hover:text-white rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hidden sm:flex items-center justify-center group opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
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

        {/* AI Task Assistant Panel (Desktop Sidebar or Mobile Overlay Drawer) */}
        {showAiAssistant && (
          <div className="fixed inset-0 md:static md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 h-full overflow-hidden z-40 md:z-30 shadow-2xl animate-fade-in">
            
            {/* AI Assistant Header with Mobile Back Button */}
            <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiAssistant(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer md:hidden"
                  title="Back to PDF"
                >
                  <ChevronLeft className="w-5 h-5 text-purple-300" />
                </button>
                <div className="p-1.5 sm:p-2 bg-purple-600/30 rounded-xl border border-purple-500/30 text-purple-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                    <span>AI Solver Chatbot</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{targetLanguage} • Page {activePageNum} of {numPages}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-28">
                  <CustomSelect
                    value={targetLanguage}
                    onChange={(val) => setTargetLanguage(val)}
                    options={[
                      { value: 'English', label: 'English', badge: 'EN' },
                      { value: 'Hindi', label: 'Hindi (हिंदी)', badge: 'HI' },
                      { value: 'Gujarati', label: 'Gujarati (ગુજ)', badge: 'GU' },
                      { value: 'Marathi', label: 'Marathi (मराठी)', badge: 'MR' },
                      { value: 'Tamil', label: 'Tamil (தமிழ்)', badge: 'TA' },
                      { value: 'Telugu', label: 'Telugu (తెలుగు)', badge: 'TE' },
                    ]}
                    theme="compact-dark"
                    placeholder="Language"
                  />
                </div>

                <button
                  onClick={() => setShowAiAssistant(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
                  title="Close AI Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick AI Task Actions Section with Show/Hide Toggle */}
            <div className="bg-slate-900/95 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 select-none">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quick AI Tasks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAiTools((prev) => !prev)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-all border border-slate-800 select-none"
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
                <div className="p-2.5 sm:p-3 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {/* 1. Solve Page Questions */}
                    <button
                      onClick={() => handleRunAiTask('solve_questions')}
                      disabled={aiLoading}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
                      title="Solve all questions on active page"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Solve Questions</span>
                    </button>

                    {/* 2. Key Formulas */}
                    <button
                      onClick={() => handleRunAiTask('key_concepts')}
                      disabled={aiLoading}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
                      title="Extract key formulas & concepts"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Key Formulas</span>
                    </button>

                    {/* 3. Practice Quiz */}
                    <button
                      onClick={() => handleRunAiTask('quiz')}
                      disabled={aiLoading}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
                      title="Generate 5 practice questions"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">5 Practice Quiz</span>
                    </button>

                    {/* 4. Summarize Page */}
                    <button
                      onClick={() => handleRunAiTask('summarize_page')}
                      disabled={aiLoading}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
                      title="Summarize page in bullet points"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">Page Summary</span>
                    </button>

                    {/* 5. Revision Notes */}
                    <button
                      onClick={() => handleRunAiTask('short_notes')}
                      disabled={aiLoading}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm col-span-2 sm:col-span-1"
                      title="Create revision short notes"
                    >
                      <Star className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Revision Notes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Messages Chat History */}
            <div ref={aiChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl max-w-[92%] space-y-1.5 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-2xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-2xs'
                    }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <div className="w-full max-w-none">
                        <MathRenderer content={msg.text} isUser={false} isDark={true} className="text-slate-100" />
                      </div>
                    ) : (
                      <p className="text-white font-medium">{msg.text}</p>
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
                            className="hover:text-white cursor-pointer p-1 rounded hover:bg-slate-800"
                            title={`Speak Response (${targetLanguage})`}
                          >
                            <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                          </button>
                        </div>
                      )}
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

            {/* AI Prompt Input Bar with Speech-to-Text */}
            <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPromptInput.trim()) {
                    handleRunAiTask('chat', aiPromptInput.trim());
                    setAiPromptInput('');
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <input
                  type="text"
                  placeholder={`Ask AI Solver in ${targetLanguage}...`}
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
                  className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white rounded-xl cursor-pointer shadow-md transition-all shrink-0"
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
