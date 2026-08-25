import { jsPDF } from 'jspdf';
import { normalizeFractions, normalizeUnicodeMath } from '../components/common/MathRenderer';

// In-memory cache for fast instant downloads
const pdfDataUrlMemoryCache = new Map<string, string>();
const pdfGenerationPromises = new Map<string, Promise<string>>();

/**
 * Normalizes math expression syntax in markdown text for consistent rendering
 */
export const normalizeMathText = (rawText: string): string => {
  if (!rawText) return '';
  let normalized = rawText
    // Convert \[ ... \] into $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // Convert \( ... \) into $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    // Convert standard $$ ... $$ into single $ ... $ or preserve for display
    .replace(/\$\$([\s\S]*?)\$\$/g, '$$$1$$');

  normalized = normalizeUnicodeMath(normalized);
  normalized = normalizeFractions(normalized);
  return normalized;
};

export interface ParsedSection {
  title: string;
  body: string;
  level: number;
}

/**
 * Parses markdown text into structured sections matching SmartReaderView
 */
export const parseSections = (content: string, title?: string): ParsedSection[] => {
  if (!content) return [];
  const normalized = normalizeMathText(content);
  
  // Split by Markdown level 1, 2, and 3 headers
  const rawChunks = normalized.split(/\n(?=#{1,3}\s+)/g);
  
  const parsedSections: ParsedSection[] = [];
  let sectionCounter = 1;

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i].trim();
    if (!chunk) continue;

    const headerMatch = chunk.match(/^(#{1,4})\s+(.+?)(\n|$)/);
    if (headerMatch) {
      const headerLevel = headerMatch[1].length;
      let rawHeaderTitle = headerMatch[2].trim();
      let bodyContent = chunk.substring(headerMatch[0].length).trim();

      // Strip surrounding markdown bold / italic formatting
      rawHeaderTitle = rawHeaderTitle.replace(/^[*_~`#]+|[*_~`#]+$/g, '').trim();

      // If this is purely a document title header matching the document card with no body, skip it
      if (headerLevel === 1 && (!bodyContent || bodyContent.length < 5) && (rawHeaderTitle.toLowerCase() === title?.toLowerCase() || i === 0)) {
        continue;
      }

      // Test if title is empty, or only an emoji/symbol
      const isOnlyEmoji = !/[a-zA-Z0-9\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(rawHeaderTitle);

      let resolvedTitle = rawHeaderTitle;

      if (!rawHeaderTitle || isOnlyEmoji) {
        const bodyLines = bodyContent.split('\n').map(l => l.trim()).filter(Boolean);
        if (bodyLines.length > 0) {
          const firstLine = bodyLines[0];
          const cleanFirstLine = firstLine.replace(/^(#{1,4}|\*\*|\*|__)\s*|\s*(\*\*|\*|__)$/g, '').trim();
          if (cleanFirstLine.length > 2 && cleanFirstLine.length < 90 && !cleanFirstLine.includes('.')) {
            resolvedTitle = rawHeaderTitle ? `${rawHeaderTitle} ${cleanFirstLine}` : cleanFirstLine;
            const firstLineIdx = bodyContent.indexOf(firstLine);
            if (firstLineIdx !== -1) {
              bodyContent = bodyContent.substring(firstLineIdx + firstLine.length).trim();
            }
          }
        }
      }

      if (!resolvedTitle || isOnlyEmoji) {
        const emojiPrefix = rawHeaderTitle ? `${rawHeaderTitle} ` : '';
        const fallbackNames = ['Overview', 'Core Concepts', 'Detailed Study', 'Key Formulations', 'Practice & Summary'];
        const fallback = fallbackNames[sectionCounter - 1] || `Section ${sectionCounter}`;
        resolvedTitle = `${emojiPrefix}${fallback}`;
      }

      if (bodyContent || resolvedTitle) {
        parsedSections.push({
          title: resolvedTitle,
          body: bodyContent || 'Refer to the detailed guide above.',
          level: headerLevel
        });
        sectionCounter++;
      }
    } else {
      if (chunk.length > 0) {
        parsedSections.push({
          title: sectionCounter === 1 ? (title || 'Introduction') : `Section ${sectionCounter}`,
          body: chunk,
          level: 2
        });
        sectionCounter++;
      }
    }
  }

  if (parsedSections.length === 0) {
    return [{ title: title || 'Study Content', body: normalized, level: 1 }];
  }

  return parsedSections;
};

/**
 * Sanitizes plain text for standard jsPDF Helvetica encoding to ensure 100% clean selectable text
 */
export const sanitizeTextForPdf = (str: string): string => {
  if (!str) return '';

  return str
    // Remove Unicode surrogate pairs and emojis
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\uE000-\uF8FF\uFE00-\uFE0F\uFD00-\uFDCF]/g, '')
    // Normalize quotes, dashes, bullets, and math symbols
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '*')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/⇒/g, '=>')
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/≈/g, '~=')
    .replace(/∞/g, 'inf')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁺/g, '+')
    .replace(/⁻/g, '-')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    // Remove control characters
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    // Collapse excess spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Strips markdown symbols, KaTeX formatting, and returns clean readable string
 */
export const extractCleanPlainText = (markdownText: string): string => {
  if (!markdownText) return '';
  return markdownText
    .replace(/\\xrightarrow\[(.*?)\]\{(.*?)\}/g, ' --($1 $2)--> ')
    .replace(/\\xrightarrow\{(.*?)\}/g, ' --($1)--> ')
    .replace(/\\rightarrow/g, ' -> ')
    .replace(/\\leftarrow/g, ' <- ')
    .replace(/\\pm/g, '+/-')
    .replace(/\\times/g, ' x ')
    .replace(/\\div/g, ' / ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$([^\$\n]+?)\$/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}\\_^]/g, '')
    .trim();
};

// Structural Item Types for PDF Vector Layout
type SectionItemType =
  | 'h3'
  | 'subheading'
  | 'numbered_list'
  | 'bullet_list'
  | 'callout'
  | 'equation'
  | 'table'
  | 'divider'
  | 'paragraph';

interface SectionItem {
  type: SectionItemType;
  text: string;
  prefix?: string;
  tableData?: string[][];
}

/**
 * Parses markdown section body into typed visual elements for exact vector rendering
 */
const parseBodyItems = (bodyText: string): SectionItem[] => {
  if (!bodyText) return [];
  const lines = bodyText.split('\n');
  const items: SectionItem[] = [];

  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const parsedGrid = tableRows.map(r =>
      r.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1).map(c => extractCleanPlainText(c))
    );
    if (parsedGrid.length > 0) {
      items.push({
        type: 'table',
        text: '',
        tableData: parsedGrid,
      });
    }
    inTable = false;
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) {
        continue;
      }
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      continue;
    }

    // Horizontal divider
    if (/^(\-{3,}|\*{3,}|\_{3,})$/.test(trimmed)) {
      items.push({ type: 'divider', text: '' });
      continue;
    }

    // KaTeX display math: $$ ... $$ or standalone $ ... $
    if (
      (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) ||
      (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 2 && !trimmed.slice(1, -1).includes('$'))
    ) {
      const isDouble = trimmed.startsWith('$$');
      let mathExpr = isDouble ? trimmed.slice(2, -2).trim() : trimmed.slice(1, -1).trim();
      const cleanMath = extractCleanPlainText(mathExpr);
      items.push({
        type: 'equation',
        text: cleanMath,
      });
      continue;
    }

    // H3 / Subheader
    if (trimmed.startsWith('### ')) {
      items.push({
        type: 'h3',
        text: extractCleanPlainText(trimmed.replace(/^###\s*/, '')),
      });
      continue;
    }

    // Callout Block (> ...)
    if (trimmed.startsWith('> ')) {
      items.push({
        type: 'callout',
        text: extractCleanPlainText(trimmed.replace(/^>\s*/, '')),
      });
      continue;
    }

    // Sub-heading labels (e.g. "Learning Objectives:", "The Chemical Equation:")
    if (
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.startsWith('-') && !trimmed.startsWith('*')) ||
      (/^(\*\*|__)[^*_]+(\*\*|__):?$/.test(trimmed) && trimmed.length < 80)
    ) {
      items.push({
        type: 'subheading',
        text: extractCleanPlainText(trimmed),
      });
      continue;
    }

    // Numbered list item (e.g. "1. Define photosynthesis...")
    const numMatch = trimmed.match(/^([0-9]+[\.\)])\s+(.*)$/);
    if (numMatch) {
      items.push({
        type: 'numbered_list',
        prefix: numMatch[1],
        text: extractCleanPlainText(numMatch[2]),
      });
      continue;
    }

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      items.push({
        type: 'bullet_list',
        prefix: '•',
        text: extractCleanPlainText(trimmed.replace(/^[-*•]\s*/, '')),
      });
      continue;
    }

    // Regular paragraph
    items.push({
      type: 'paragraph',
      text: extractCleanPlainText(trimmed),
    });
  }

  if (inTable) {
    flushTable();
  }

  return items;
};

/**
 * Generates an A4 PDF data URL with 100% Native Vector Text, crisp layout cards, and true pagination
 */
export const generateSmartReaderPdfDataUrl = async (
  title: string,
  subject: string,
  std: string,
  language: string,
  fullBodyText: string,
  materialTypeHeaderLabel?: string
): Promise<string> => {
  const cacheKey = `${title}_${subject}_${std}_${language}_${(fullBodyText || '').length}_${materialTypeHeaderLabel || ''}`;
  
  if (pdfDataUrlMemoryCache.has(cacheKey)) {
    return pdfDataUrlMemoryCache.get(cacheKey)!;
  }

  if (pdfGenerationPromises.has(cacheKey)) {
    return await pdfGenerationPromises.get(cacheKey)!;
  }

  const generationPromise = (async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 Dimensions in millimeters
    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN_LEFT = 14;
    const MARGIN_RIGHT = 14;
    const MARGIN_TOP = 16;
    const MARGIN_BOTTOM = 16;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182mm
    const MAX_PAGE_Y = PAGE_HEIGHT - MARGIN_BOTTOM - 8; // 273mm

    const sections = parseSections(fullBodyText || '', title);
    const wordCount = fullBodyText ? fullBodyText.split(/\s+/).filter(Boolean).length : 0;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 180));
    const langDisplay = language || 'English';

    let currentY = MARGIN_TOP;

    // Helper: Draw background canvas for entire page
    const drawPageBackground = () => {
      doc.setFillColor(248, 250, 252); // #f8fafc
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    };

    // Helper: Draw top header bar on pages 2+
    const drawPageTopHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // #64748b
      
      const cleanHeaderTitle = sanitizeTextForPdf(title);
      const shortTitle = cleanHeaderTitle.length > 55 ? cleanHeaderTitle.substring(0, 52) + '...' : cleanHeaderTitle;
      doc.text(shortTitle, MARGIN_LEFT, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // #94a3b8
      const metaRight = sanitizeTextForPdf(`${subject || 'Study Guide'} * Class ${std || 'Student Edition'}`);
      doc.text(metaRight, PAGE_WIDTH - MARGIN_RIGHT, 11, { align: 'right' });

      // Header divider line
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.setLineWidth(0.35);
      doc.line(MARGIN_LEFT, 13.5, PAGE_WIDTH - MARGIN_RIGHT, 13.5);
    };

    // Initialize Page 1
    drawPageBackground();

    // ==========================================
    // 1. Render Document Header Card (Page 1)
    // ==========================================
    const renderHeaderCard = () => {
      const cardX = MARGIN_LEFT;
      const cardY = currentY;
      const cardWidth = CONTENT_WIDTH;
      const cardPadding = 6;

      // Estimate title height with wrapping
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      const cleanTitle = sanitizeTextForPdf(title);
      const titleLines = doc.splitTextToSize(cleanTitle, cardWidth - cardPadding * 2);
      const titleHeight = titleLines.length * 6;

      const headerCardHeight = 8 + 6 + titleHeight + 4 + 7 + cardPadding;

      // Draw Card Container
      doc.setFillColor(255, 255, 255); // #ffffff
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.setLineWidth(0.4);
      doc.roundedRect(cardX, cardY, cardWidth, headerCardHeight, 4, 4, 'FD');

      let innerY = cardY + 6;

      // Badges Row
      // 1. Rose Badge "SMART READER"
      doc.setFillColor(255, 241, 242); // #fff1f2
      doc.setDrawColor(254, 205, 211); // #fecdd3
      doc.roundedRect(cardX + cardPadding, innerY, 28, 5.5, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(225, 29, 72); // #e11d48
      doc.text('SMART READER', cardX + cardPadding + 14, innerY + 3.8, { align: 'center' });

      // 2. Indigo Badge "Language"
      const langText = sanitizeTextForPdf(langDisplay);
      const langWidth = Math.max(16, doc.getTextWidth(langText) + 6);
      const langX = cardX + cardPadding + 30;
      doc.setFillColor(224, 231, 255); // #e0e7ff
      doc.setDrawColor(199, 210, 254); // #c7d2fe
      doc.roundedRect(langX, innerY, langWidth, 5.5, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(67, 56, 202); // #4338ca
      doc.text(langText, langX + langWidth / 2, innerY + 3.8, { align: 'center' });

      // Right Branding "GRAMIN SHIKSHA"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.text('GRAMIN SHIKSHA', cardX + cardWidth - cardPadding, innerY + 3.8, { align: 'right' });

      innerY += 9;

      // Title Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.text(titleLines, cardX + cardPadding, innerY + 4);

      innerY += titleHeight + 2;

      // Card Meta Divider
      doc.setDrawColor(241, 245, 249); // #f1f5f9
      doc.setLineWidth(0.3);
      doc.line(cardX + cardPadding, innerY, cardX + cardWidth - cardPadding, innerY);

      innerY += 4.5;

      // Meta Row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // #64748b
      
      const metaLeft = `Subject: ${sanitizeTextForPdf(subject || 'General')}   *   Standard: ${sanitizeTextForPdf(std || 'Student Edition')}   *   ${wordCount} words (~${readMinutes} min read)`;
      doc.text(metaLeft, cardX + cardPadding, innerY);

      currentY = cardY + headerCardHeight + 5;
    };

    renderHeaderCard();

    // ==========================================
    // 2. Render Structured Section Cards
    // ==========================================
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const items = parseBodyItems(sec.body);
      const cleanTitle = sanitizeTextForPdf(sec.title);
      const cardPadding = 5.5;
      const cardInnerWidth = CONTENT_WIDTH - cardPadding * 2;

      // Calculate total height of this section card before drawing (for break-inside: avoid)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const secTitleLines = doc.splitTextToSize(cleanTitle, cardInnerWidth - 12);
      const secTitleHeight = Math.max(7, secTitleLines.length * 4.8);

      let estimatedBodyHeight = 0;

      for (const item of items) {
        if (item.type === 'h3' || item.type === 'subheading') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          const lines = doc.splitTextToSize(sanitizeTextForPdf(item.text), cardInnerWidth);
          estimatedBodyHeight += lines.length * 4.2 + 4;
        } else if (item.type === 'numbered_list' || item.type === 'bullet_list') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          const lines = doc.splitTextToSize(sanitizeTextForPdf(item.text), cardInnerWidth - 8);
          estimatedBodyHeight += lines.length * 3.8 + 2;
        } else if (item.type === 'callout') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          const lines = doc.splitTextToSize(sanitizeTextForPdf(item.text), cardInnerWidth - 8);
          estimatedBodyHeight += lines.length * 3.8 + 6;
        } else if (item.type === 'equation') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(sanitizeTextForPdf(item.text), cardInnerWidth - 8);
          estimatedBodyHeight += lines.length * 4 + 7;
        } else if (item.type === 'table' && item.tableData) {
          estimatedBodyHeight += item.tableData.length * 6 + 4;
        } else if (item.type === 'divider') {
          estimatedBodyHeight += 4;
        } else {
          // Paragraph
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          const lines = doc.splitTextToSize(sanitizeTextForPdf(item.text), cardInnerWidth);
          estimatedBodyHeight += lines.length * 3.8 + 2.5;
        }
      }

      const totalCardHeight = 5 + secTitleHeight + 3 + estimatedBodyHeight + cardPadding;

      // Smart Pagination: If card doesn't fit on this page, break cleanly to next page
      if (currentY + totalCardHeight > MAX_PAGE_Y) {
        doc.addPage();
        drawPageBackground();
        drawPageTopHeader();
        currentY = MARGIN_TOP + 2;
      }

      const cardX = MARGIN_LEFT;
      const cardY = currentY;

      // Draw Section Card White Box
      doc.setFillColor(255, 255, 255); // #ffffff
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.setLineWidth(0.35);
      doc.roundedRect(cardX, cardY, CONTENT_WIDTH, totalCardHeight, 3.5, 3.5, 'FD');

      let innerY = cardY + 4.5;

      // Section Header: Numbered badge + Title
      // Number Badge Box
      const badgeX = cardX + cardPadding;
      doc.setFillColor(255, 241, 242); // #fff1f2
      doc.setDrawColor(254, 205, 211); // #fecdd3
      doc.roundedRect(badgeX, innerY, 6, 6, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(225, 29, 72); // #e11d48
      doc.text(String(sIdx + 1), badgeX + 3, innerY + 4.2, { align: 'center' });

      // Title Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.text(secTitleLines, badgeX + 8.5, innerY + 4.2);

      innerY += secTitleHeight + 2;

      // Section Header Divider
      doc.setDrawColor(241, 245, 249); // #f1f5f9
      doc.setLineWidth(0.25);
      doc.line(cardX + cardPadding, innerY, cardX + CONTENT_WIDTH - cardPadding, innerY);

      innerY += 3.5;

      // Render Section Body Items
      for (const item of items) {
        if (item.type === 'h3') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // #0f172a
          const cleanH3 = sanitizeTextForPdf(item.text);
          const lines = doc.splitTextToSize(cleanH3, cardInnerWidth);
          doc.text(lines, cardX + cardPadding, innerY + 3.5);
          innerY += lines.length * 4.2 + 2;
        } else if (item.type === 'subheading') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42); // #0f172a
          const cleanSub = sanitizeTextForPdf(item.text);
          const lines = doc.splitTextToSize(cleanSub, cardInnerWidth);
          doc.text(lines, cardX + cardPadding, innerY + 3.2);
          innerY += lines.length * 4 + 2;
        } else if (item.type === 'numbered_list') {
          // Monospace bold indigo prefix
          doc.setFont('courier', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(79, 70, 229); // #4f46e5
          doc.text(item.prefix || '1.', cardX + cardPadding, innerY + 3.2);

          // Item text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59); // #1e293b
          const cleanText = sanitizeTextForPdf(item.text);
          const lines = doc.splitTextToSize(cleanText, cardInnerWidth - 7);
          doc.text(lines, cardX + cardPadding + 6.5, innerY + 3.2);
          innerY += lines.length * 3.8 + 1.8;
        } else if (item.type === 'bullet_list') {
          // Indigo bullet
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(79, 70, 229); // #4f46e5
          doc.text('*', cardX + cardPadding + 0.5, innerY + 3.2);

          // Item text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59); // #1e293b
          const cleanText = sanitizeTextForPdf(item.text);
          const lines = doc.splitTextToSize(cleanText, cardInnerWidth - 6);
          doc.text(lines, cardX + cardPadding + 5.5, innerY + 3.2);
          innerY += lines.length * 3.8 + 1.8;
        } else if (item.type === 'callout') {
          const cleanText = sanitizeTextForPdf(item.text);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          const lines = doc.splitTextToSize(cleanText, cardInnerWidth - 8);
          const calloutHeight = lines.length * 3.8 + 4.5;

          // Amber Callout Box
          const boxX = cardX + cardPadding;
          doc.setFillColor(255, 251, 235); // #fffbeb
          doc.setDrawColor(253, 230, 138); // #fde68a
          doc.setLineWidth(0.3);
          doc.roundedRect(boxX, innerY, cardInnerWidth, calloutHeight, 2, 2, 'FD');

          // Dark amber left accent bar
          doc.setFillColor(217, 119, 6); // #d97706
          doc.rect(boxX, innerY, 1.4, calloutHeight, 'F');

          // Text
          doc.setTextColor(120, 53, 15); // #78350f
          doc.text(lines, boxX + 4.5, innerY + 3.4);
          innerY += calloutHeight + 2.5;
        } else if (item.type === 'equation') {
          const cleanMath = sanitizeTextForPdf(item.text);
          doc.setFont('courier', 'bold');
          doc.setFontSize(8.5);
          const lines = doc.splitTextToSize(cleanMath, cardInnerWidth - 8);
          const eqHeight = lines.length * 4 + 4.5;

          // Equation Box
          const boxX = cardX + cardPadding;
          doc.setFillColor(248, 250, 252); // #f8fafc
          doc.setDrawColor(226, 232, 240); // #e2e8f0
          doc.setLineWidth(0.3);
          doc.roundedRect(boxX, innerY, cardInnerWidth, eqHeight, 2, 2, 'FD');

          // Centered Text
          doc.setTextColor(15, 23, 42); // #0f172a
          const midX = boxX + cardInnerWidth / 2;
          for (let lIdx = 0; lIdx < lines.length; lIdx++) {
            doc.text(lines[lIdx], midX, innerY + 3.4 + lIdx * 4, { align: 'center' });
          }
          innerY += eqHeight + 2.5;
        } else if (item.type === 'table' && item.tableData) {
          const grid = item.tableData;
          const numCols = grid[0]?.length || 1;
          const colWidth = cardInnerWidth / numCols;
          const rowHeight = 5.5;

          for (let rIdx = 0; rIdx < grid.length; rIdx++) {
            const isHeader = rIdx === 0;
            const rowY = innerY;

            // Row background
            if (isHeader) {
              doc.setFillColor(241, 245, 249); // #f1f5f9
            } else {
              doc.setFillColor(rIdx % 2 === 0 ? 248 : 255, rIdx % 2 === 0 ? 250 : 255, rIdx % 2 === 0 ? 252 : 255);
            }
            doc.rect(cardX + cardPadding, rowY, cardInnerWidth, rowHeight, 'F');

            // Cell borders and text
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);

            for (let cIdx = 0; cIdx < numCols; cIdx++) {
              const cellX = cardX + cardPadding + cIdx * colWidth;
              doc.rect(cellX, rowY, colWidth, rowHeight, 'S');

              const cellVal = sanitizeTextForPdf(grid[rIdx][cIdx] || '');
              doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(isHeader ? 15 : 51, isHeader ? 23 : 65, isHeader ? 42 : 85);
              doc.text(cellVal, cellX + 2, rowY + 3.8);
            }
            innerY += rowHeight;
          }
          innerY += 2;
        } else if (item.type === 'divider') {
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.25);
          doc.line(cardX + cardPadding, innerY + 1.5, cardX + CONTENT_WIDTH - cardPadding, innerY + 1.5);
          innerY += 3.5;
        } else {
          // Regular paragraph
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59); // #1e293b
          const cleanText = sanitizeTextForPdf(item.text);
          const lines = doc.splitTextToSize(cleanText, cardInnerWidth);
          doc.text(lines, cardX + cardPadding, innerY + 3.2);
          innerY += lines.length * 3.8 + 2;
        }
      }

      currentY = cardY + totalCardHeight + 4.5;
    }

    // ==========================================
    // 3. Document Completion Bar
    // ==========================================
    if (currentY + 10 > MAX_PAGE_Y) {
      doc.addPage();
      drawPageBackground();
      drawPageTopHeader();
      currentY = MARGIN_TOP + 2;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text('* Gramin Shiksha Smart Reader * You have reached the end of this study guide', PAGE_WIDTH / 2, currentY + 4, { align: 'center' });

    // ==========================================
    // 4. Stamping Consistent Page Number Footers
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Bottom footer divider
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.setLineWidth(0.3);
      doc.line(MARGIN_LEFT, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 12);

      // Left footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // #94a3b8
      doc.text(`Gramin Shiksha AI Smart Reader * ${sanitizeTextForPdf(subject || 'Study Guide')}`, MARGIN_LEFT, PAGE_HEIGHT - 7.5);

      // Right footer text "Page X of Y"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // #334155
      doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 7.5, { align: 'right' });
    }

    const outputDataUrl = doc.output('datauristring');
    pdfDataUrlMemoryCache.set(cacheKey, outputDataUrl);
    return outputDataUrl;
  })();

  pdfGenerationPromises.set(cacheKey, generationPromise);
  return await generationPromise;
};

/**
 * Directly downloads the Smart Reader section as a native vector PDF file
 */
export const downloadSmartReaderPdf = async (
  title: string,
  subject: string,
  std: string,
  language: string,
  fullBodyText: string,
  materialTypeHeaderLabel?: string
): Promise<void> => {
  const dataUrl = await generateSmartReaderPdfDataUrl(
    title,
    subject,
    std,
    language,
    fullBodyText,
    materialTypeHeaderLabel
  );

  const cleanFileName = title.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const downloadFileName = cleanFileName.toLowerCase().endsWith('.pdf')
    ? cleanFileName
    : `${cleanFileName}.pdf`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = downloadFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
