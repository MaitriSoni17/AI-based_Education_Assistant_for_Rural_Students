import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2, 
  Download, 
  AlertCircle, 
  Maximize2, 
  Search, 
  X 
} from 'lucide-react';

interface PdfCanvasViewerProps {
  fileId: string;
  fileDataUrl?: string;
  fileName: string;
  onGetFileLocal: (id: string) => Promise<string | null>;
  onDownload: () => void;
}

interface PdfPageItemProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
  pageSize: { width: number; height: number };
  onPageVisible: (page: number) => void;
  setRef: (page: number, el: HTMLDivElement | null) => void;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  pageSize,
  onPageVisible,
  setRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // High performance virtualization via two observers:
  // 1. Large margin observer for lazy-rendering page contents (prevents white flashes)
  // 2. Focused observer for tracking which page is actively filling the viewport
  useEffect(() => {
    const renderObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '500px 0px 500px 0px', // render ahead before page scrolls into view
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
        threshold: 0.35, // active page is when 35% of the page is visible in view
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

  // Handle PDF rendering
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

        const viewport = page.getViewport({ scale, rotation });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
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

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        setRef(pageNum, el);
      }}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="relative bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden flex items-center justify-center select-none shrink-0"
    >
      {isVisible ? (
        <canvas ref={canvasRef} className="w-full h-full block bg-white" />
      ) : (
        <div className="text-center space-y-2 text-slate-500">
          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mx-auto" />
          <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-400">
            Page {pageNum}
          </span>
        </div>
      )}
    </div>
  );
};

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileId,
  fileDataUrl,
  fileName,
  onGetFileLocal,
  onDownload,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
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

  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const setPageRef = useCallback((page: number, el: HTMLDivElement | null) => {
    pageRefs.current[page] = el;
  }, []);

  const handlePageVisible = useCallback((page: number) => {
    setActivePageNum(page);
  }, []);

  // Synchronous page jump helper
  const jumpToPage = useCallback((page: number) => {
    const element = pageRefs.current[page];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Compute standard responsive fit-to-width factor with balanced padding
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

  // Automatically trigger Fit Width once loaded or when window size/orientation changes
  useEffect(() => {
    if (!loading && pdfDoc) {
      const timer = setTimeout(() => {
        handleFitWidth();
      }, 150);

      const handleResize = () => {
        handleFitWidth();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [loading, pdfDoc, handleFitWidth]);

  // Fetch and boot PDF.js engine
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

        if (!dataUrlToUse.startsWith('data:application/pdf') && !dataUrlToUse.startsWith('data:')) {
          throw new Error('Invalid file format. Only PDF documents can be loaded in the interactive reader.');
        }

        const base64Parts = dataUrlToUse.split(',');
        if (base64Parts.length < 2) {
          throw new Error('Corrupted PDF file stream payload.');
        }

        const base64 = base64Parts[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library could not be loaded.');
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        // Get standard dimensions from the first page
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

  // Background Text Indexing process
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
          const text = textContent.items.map((item: any) => item.str).join(' ');
          extracted.push({ pageNum: i, text });
        }
        if (isMounted) {
          setPagesText(extracted);
          setIndexingText(false);
        }
      } catch (err) {
        console.warn('Failed to extract PDF text layers:', err);
        if (isMounted) {
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
        // Create an elegant snippet around the match
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

  // Adjust zoom scales dynamically
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 2.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.65));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const pagesArray = useMemo(() => {
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [numPages]);

  // Highlighting keyword match helper
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
    <div className="flex flex-col h-full flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative w-full">
      {/* Dynamic Reader Control Panel */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-300 gap-4 shrink-0 z-10">
        
        {/* Left Side: Page navigation controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => activePageNum > 1 && jumpToPage(activePageNum - 1)}
            disabled={activePageNum <= 1}
            className="p-2 hover:bg-slate-800 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Previous Page"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-mono text-xs select-none bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800">
            Page <strong className="text-emerald-400 font-extrabold">{activePageNum}</strong> of <strong className="text-slate-400">{numPages || '?'}</strong>
          </span>
          <button
            onClick={() => activePageNum < numPages && jumpToPage(activePageNum + 1)}
            disabled={activePageNum >= numPages}
            className="p-2 hover:bg-slate-800 rounded-xl disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Next Page"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Middle: Elegant Text Search field */}
        <div className="flex items-center gap-3 flex-1 max-w-sm min-w-[200px] relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search text in document..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {indexingText && (
            <div className="absolute right-3 top-2.5 flex items-center" title="Indexing pages for search...">
              <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
            </div>
          )}

          {/* Quick jump between match indicators */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono select-none">
                {currentSearchResultIndex + 1}/{searchResults.length}
              </span>
              <button
                onClick={() => {
                  const nextIdx = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
                  setCurrentSearchResultIndex(nextIdx);
                  jumpToPage(searchResults[nextIdx].pageNum);
                }}
                className="p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-400 hover:text-white animate-fade-in"
                title="Previous Match"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const nextIdx = (currentSearchResultIndex + 1) % searchResults.length;
                  setCurrentSearchResultIndex(nextIdx);
                  jumpToPage(searchResults[nextIdx].pageNum);
                }}
                className="p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-400 hover:text-white animate-fade-in"
                title="Next Match"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: View options & downloads */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs select-none text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitWidth}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white flex items-center gap-1.5"
            title="Fit to Width"
          >
            <Maximize2 className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider hidden lg:inline">Fit Width</span>
          </button>
          <button
            onClick={rotate}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Rotate 90°"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={onDownload}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm shadow-emerald-900/30 active:scale-97"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Collapsible Sidebar + Canvas Render Container */}
      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
        
        {/* Collapsible Left Search Sidebar */}
        {searchQuery.trim() !== '' && (
          <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none h-full overflow-hidden transition-all duration-300">
            <div className="p-4 border-b border-slate-850 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold text-slate-200 text-xs">Search Matches</span>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                  {searchResults.length} occurrences found
                </span>
              </div>
              <button
                onClick={() => handleSearch('')}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Close Search Sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center space-y-3 px-4">
                  <div className="text-3xl text-slate-700">🔍</div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold font-sans">No occurrences found</p>
                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                      We couldn't locate any matching words or phrases in this document. Please try a different query.
                    </p>
                  </div>
                </div>
              ) : (
                searchResults.map((result, idx) => {
                  const isActive = idx === currentSearchResultIndex;
                  return (
                    <button
                      key={`search-res-${idx}`}
                      onClick={() => {
                        setCurrentSearchResultIndex(idx);
                        jumpToPage(result.pageNum);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border border-transparent flex flex-col gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/45 border-emerald-800/40 shadow-md shadow-emerald-950/20'
                          : 'bg-slate-900/30 hover:bg-slate-900 border-slate-900/40 hover:border-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-mono text-[10px] uppercase font-black tracking-wider ${
                          isActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          Page {result.pageNum}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-sans font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-1.5 py-0.5 rounded-md border border-emerald-800/20">
                            Active Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                        {renderSnippetWithHighlights(result.snippet, searchQuery)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right side: Continuous Canvas viewport with full layout height */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-slate-950 flex flex-col items-center gap-8 py-8 px-6 scrollbar-thin select-text min-h-0 relative scroll-smooth w-full"
          style={{ height: '100%' }}
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-20">
              <Loader2 className="h-9 w-9 text-emerald-500 animate-spin" />
              <div className="text-center">
                <span className="font-mono text-xs text-slate-400 block font-bold">Booting Virtual Canvas Stage...</span>
                <span className="text-[10px] text-slate-500 block mt-1 font-sans">Scanning page counts and parsing local PDF buffers</span>
              </div>
            </div>
          ) : error ? (
            <div className="my-auto max-w-md bg-rose-950/40 border border-rose-900/30 p-6 rounded-2xl text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-rose-300">Continuous Reader Error</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{error}</p>
              </div>
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Download File Instead</span>
              </button>
            </div>
          ) : (
            pagesArray.map((pageNum) => (
              <PdfPageItem
                key={`${fileId}-page-${pageNum}`}
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                scale={scale}
                rotation={rotation}
                pageSize={pageSize}
                onPageVisible={handlePageVisible}
                setRef={setPageRef}
              />
            ))
          )}
        </div>
      </div>

      {/* Performance Footer */}
      <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between shrink-0 z-10">
        <span>GyaanBot Virtualized Continuous Reader</span>
        <span>Low-Memory Rendering (Active: {activePageNum}/{numPages})</span>
      </div>
    </div>
  );
};
