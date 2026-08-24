import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  isUser?: boolean;
  isDark?: boolean;
  className?: string;
}

/**
 * Extracts balanced curly braces `{ ... }` starting from `startIndex`.
 * Properly handles arbitrary depth of nested braces.
 */
function extractBalancedBraces(text: string, startIndex: number): { content: string; endIndex: number } | null {
  if (startIndex >= text.length || text[startIndex] !== '{') return null;
  let depth = 0;
  let i = startIndex;
  while (i < text.length) {
    if (text[i] === '{') {
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        return {
          content: text.slice(startIndex + 1, i),
          endIndex: i + 1,
        };
      }
    }
    i++;
  }
  return null;
}

/**
 * Normalizes all forms of LaTeX fractions (e.g. \frac{4 \text{ m} }{ \text{s} ^2}, \frac{2}3, \frac 2 3, \frac23, \frac{2}{3})
 * using balanced brace parsing to correctly handle nested LaTeX commands (like \text{...}, \sqrt{...}).
 */
export function normalizeFractions(text: string): string {
  if (!text || !text.includes('\\frac')) return text || '';

  let res = '';
  let i = 0;

  while (i < text.length) {
    const fracIdx = text.indexOf('\\frac', i);
    if (fracIdx === -1) {
      res += text.slice(i);
      break;
    }

    res += text.slice(i, fracIdx);
    let cur = fracIdx + 5; // skip '\frac'

    // Skip whitespace between \frac and first argument
    while (cur < text.length && /\s/.test(text[cur])) {
      cur++;
    }

    let numerator = '';
    let denominator = '';
    let validFraction = false;

    // Check numerator
    if (cur < text.length && text[cur] === '{') {
      const numResult = extractBalancedBraces(text, cur);
      if (numResult) {
        numerator = numResult.content;
        cur = numResult.endIndex;
      }
    } else if (cur < text.length && /[0-9a-zA-Z]/.test(text[cur])) {
      // Single token without braces e.g. \frac 2 3 or \frac23
      numerator = text[cur];
      cur++;
    }

    // Skip whitespace between numerator and denominator
    while (cur < text.length && /\s/.test(text[cur])) {
      cur++;
    }

    // Check denominator
    if (cur < text.length && text[cur] === '{') {
      const denResult = extractBalancedBraces(text, cur);
      if (denResult) {
        denominator = denResult.content;
        cur = denResult.endIndex;
        validFraction = true;
      }
    } else if (cur < text.length && /[0-9a-zA-Z]/.test(text[cur])) {
      // Single token without braces e.g. \frac{2}3 or \frac 2 3
      denominator = text[cur];
      cur++;
      validFraction = true;
    }

    if (validFraction) {
      // Clean up internal numerator & denominator
      const cleanNum = numerator.trim();
      const cleanDen = denominator.trim();
      res += `\\frac{${cleanNum}}{${cleanDen}}`;
      i = cur;
    } else if (numerator) {
      // Incomplete fraction e.g. \frac{x} without denominator
      res += `\\frac{${numerator.trim()}}{1}`;
      i = cur;
    } else {
      res += '\\frac';
      i = fracIdx + 5;
    }
  }

  return res;
}

/**
 * Normalizes unicode math characters like superscripts (², ³, etc.) and subscripts (₁, ₂, etc.)
 * into proper LaTeX syntax (^2, ^3, _1, _2).
 */
export function normalizeUnicodeMath(text: string): string {
  if (!text) return '';
  let res = text;

  const superscriptMap: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
    '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '^+', '⁻': '^-', '⁼': '^='
  };

  const subscriptMap: Record<string, string> = {
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4',
    '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9'
  };

  for (const [char, repl] of Object.entries(superscriptMap)) {
    res = res.replaceAll(char, repl);
  }
  for (const [char, repl] of Object.entries(subscriptMap)) {
    res = res.replaceAll(char, repl);
  }

  // Normalize common math arrows and operators
  res = res.replace(/➔|➝|➞|->|-->/g, ' \\rightarrow ');
  res = res.replace(/±/g, ' \\pm ');

  return res;
}

/**
 * Normalizes LaTeX text commands in plain language or math context:
 * - \text kg -> \text{kg}
 * - In plain conversational text outside math mode, removes unnecessary \text wrappers
 */
export function normalizeTextCommands(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Convert bare \text word -> \text{word} (e.g. \text kg -> \text{kg}, \text m -> \text{m}, \text s -> \text{s})
  res = res.replace(/\\text\s+([a-zA-Z0-9_\/]+)/g, '\\text{$1}');

  return res;
}

/**
 * Normalizes math delimiters, LaTeX syntax, and cleanly separates natural language text
 * from mathematical equations without merging words into math mode.
 */
export function normalizeMathText(rawText: string): string {
  if (!rawText) return '';
  let t = normalizeUnicodeMath(rawText);
  t = normalizeTextCommands(t);
  t = normalizeFractions(t);

  // 1. Clean up stray trailing backslashes and punctuation artifacts (e.g., "\..", "\.", trailing "\", "\\")
  t = t.replace(/\\+(\.{1,3})?\s*$/gm, '');
  t = t.replace(/\\+\s*$/gm, '');

  // 2. Convert display block delimiters \[ ... \] and $$ ... $$ to clean standalone $ ... $ lines
  t = t.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => {
    const cleanInner = normalizeFractions(inner.replace(/\\+(\.{1,3})?\s*$/, '').trim());
    return cleanInner ? `\n$${cleanInner}$\n` : '';
  });
  t = t.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    const cleanInner = normalizeFractions(inner.replace(/\\+(\.{1,3})?\s*$/, '').trim());
    return cleanInner ? `\n$${cleanInner}$\n` : '';
  });

  // 3. Convert \( ... \) delimiters to $ ... $
  t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => {
    const cleanInner = normalizeFractions(inner.replace(/\\+(\.{1,3})?\s*$/, '').trim());
    return cleanInner ? `$${cleanInner}$` : '';
  });

  // 4. Convert (( variable )) -> $variable$ e.g. ((x_1)) -> $x_1$, ((D)) -> $D$
  t = t.replace(/\(\(\s*([a-zA-Z0-9_\\^\{\}\+\-\*\/\s\.\,=±√≤≥≠÷×]+?)\s*\)\)/g, (_match, inner) => {
    const cleanInner = normalizeFractions(inner.trim());
    return `$${cleanInner}$`;
  });

  // 5. Clean up bracketed math formulas [ x = \frac{...}{...} ] -> $x = \frac{...}{...}$
  t = t.replace(/\[\s*([^\[\]\n]+?)\s*\](?!\()/g, (fullMatch, inner) => {
    const trimmed = inner.trim();
    if (!trimmed) return fullMatch;

    // Ignore non-math labels like [Step 1], [Note], [CBSE 2024]
    const isPureLabel = /^(step|note|fig|figure|page|cbse|ncert|icse|state|case|rule|method|level|section|chapter)\s*[0-9a-zA-Z\s]*$/i.test(trimmed);
    if (isPureLabel) return fullMatch;

    const hasLatex = /\\[a-zA-Z]+/.test(trimmed);
    const hasMathOps = /[=\^_\+\*\/<>≤≥≠≈±√∫∑%]/.test(trimmed);
    const isMathExpr = /^[a-zA-Z0-9_\^\s\+\-\*\/\.\,=±√\(\)\{\}\\]+$/.test(trimmed) && (/[0-9]/.test(trimmed) || hasMathOps);

    if (hasLatex || hasMathOps || isMathExpr) {
      const cleanInner = normalizeFractions(trimmed.replace(/\\+(\.{1,3})?\s*$/, '').trim());
      return `$${cleanInner}$`;
    }
    return fullMatch;
  });

  // 6. Strip trailing punctuation from inside $...$ so punctuation renders outside math mode
  // e.g. "$x = \frac{2}{3}.$" -> "$x = \frac{2}{3}$." and "$x = 1,$" -> "$x = 1$,"
  t = t.replace(/\$([^\$\n]+?)([\.\,\;\:\!\?])\$/g, '$$$1$$$2');

  // 7. Process line-by-line to cleanly isolate math expressions from surrounding natural text
  const lines = t.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Preserve markdown headers
    if (/^#{1,4}\s+/.test(trimmed)) {
      return line;
    }

    // Check if line starts with list bullet/number (e.g. "* ", "- ", "1. ")
    const listMatch = trimmed.match(/^([*\-•]|\d+[\.\)]|[a-zA-Z][\.\)])\s+(.*)$/);
    const prefix = listMatch ? trimmed.slice(0, trimmed.length - listMatch[2].length) : '';
    const coreText = listMatch ? listMatch[2].trim() : trimmed;

    // If the entire coreText is already enclosed in $...$, ensure internal fractions/artifacts are normalized
    if (coreText.startsWith('$') && coreText.endsWith('$') && coreText.length > 2 && !coreText.slice(1, -1).includes('$')) {
      let inner = coreText.slice(1, -1).trim();
      let trailingPunct = '';
      const punctMatch = inner.match(/([\.\,\;\:\!\?])$/);
      if (punctMatch) {
        trailingPunct = punctMatch[1];
        inner = inner.slice(0, -1).trim();
      }
      inner = normalizeFractions(inner.replace(/\\+(\.{1,3})?\s*$/, '').trim());
      return prefix ? `${prefix}$${inner}$${trailingPunct}` : `$${inner}$${trailingPunct}`;
    }

    let lineProcessed = coreText;

    // (A) Wrap raw unbracketed \frac{...}{...} using balanced brace matcher into $...$
    if (lineProcessed.includes('\\frac')) {
      let newLine = '';
      let idx = 0;
      while (idx < lineProcessed.length) {
        const fracPos = lineProcessed.indexOf('\\frac', idx);
        if (fracPos === -1) {
          newLine += lineProcessed.slice(idx);
          break;
        }

        // Check if already preceded by $ inside an existing math block
        const prevDollars = (lineProcessed.slice(0, fracPos).match(/\$/g) || []).length;
        if (prevDollars % 2 === 1) {
          // Already inside $...$
          newLine += lineProcessed.slice(idx, fracPos + 5);
          idx = fracPos + 5;
          continue;
        }

        newLine += lineProcessed.slice(idx, fracPos);
        let cur = fracPos + 5;
        while (cur < lineProcessed.length && /\s/.test(lineProcessed[cur])) cur++;

        let num = '';
        let den = '';
        let isComplete = false;

        if (cur < lineProcessed.length && lineProcessed[cur] === '{') {
          const numRes = extractBalancedBraces(lineProcessed, cur);
          if (numRes) {
            num = numRes.content;
            cur = numRes.endIndex;
          }
        }
        while (cur < lineProcessed.length && /\s/.test(lineProcessed[cur])) cur++;

        if (cur < lineProcessed.length && lineProcessed[cur] === '{') {
          const denRes = extractBalancedBraces(lineProcessed, cur);
          if (denRes) {
            den = denRes.content;
            cur = denRes.endIndex;
            isComplete = true;
          }
        }

        if (isComplete) {
          newLine += ` $\\frac{${num.trim()}}{${den.trim()}}$ `;
          idx = cur;
        } else {
          newLine += lineProcessed.slice(fracPos, fracPos + 5);
          idx = fracPos + 5;
        }
      }
      lineProcessed = newLine;
    }

    // (B) Wrap raw standalone numbers with units like 5 \text{kg} or 5 \text{ kg} in natural language:
    // Convert `5 \text{kg}` or `5 \text{ kg}` -> `5 kg` in natural language
    lineProcessed = lineProcessed.replace(/(?<!\$)([0-9]+(?:\.[0-9]+)?)\s*\\text\{([^\{\}]+)\}(?!\$)/g, (_m, num, unit) => {
      return `${num} ${unit.trim()}`;
    });

    // (C) Wrap standalone LaTeX commands with arguments (e.g. \sqrt{b^2-4ac}) into $...$
    lineProcessed = lineProcessed.replace(
      /(?<!\$)\\(sqrt|mathbf|mathrm|mathbf|Delta|alpha|beta|gamma|theta|sigma|omega|lambda|pi|pm|times|div|rightarrow)\s*(?:\{([^{}]+)\})?(?!\$)/g,
      (match) => {
        return ` $${match.trim()}$ `;
      }
    );

    // (D) Handle parenthesized single variables like "( F )" or "( m )" or "( a )" -> "($F$)", "($m$)"
    lineProcessed = lineProcessed.replace(/\(\s*([a-zA-Z])\s*\)/g, '($1)');

    // (E) Detect equation patterns (e.g. "3x^2 - 5x + 2 = 0", "a = 12", "F = ma", "V = IR", "D = b^2 - 4ac")
    // and cleanly wrap ONLY the equation in $...$, leaving surrounding words intact.
    lineProcessed = lineProcessed.replace(
      /(?<![\$a-zA-Z0-9_])([a-zA-Z0-9_\^\(\)\{\}\\\+\-\*\/\.\,±√]+\s*=\s*[a-zA-Z0-9_\^\(\)\{\}\\\+\-\*\/\.\,±√]+(?:\s*[=+\-*/^_]\s*[a-zA-Z0-9_\^\(\)\{\}\\\+\-\*\/\.\,±√]+)*)(?![\$a-zA-Z0-9_])/g,
      (match) => {
        const trimmedMatch = match.trim();
        // If it's already inside $...$ or contains pure text words, skip
        if (!trimmedMatch || trimmedMatch.includes('$')) return match;
        // Strip trailing punctuation if accidentally captured
        let cleanEq = trimmedMatch;
        let trailingPunct = '';
        const punctMatch = cleanEq.match(/([\.\,\;\:\!\?])$/);
        if (punctMatch) {
          trailingPunct = punctMatch[1];
          cleanEq = cleanEq.slice(0, -1).trim();
        }
        return ` $${cleanEq}$${trailingPunct} `;
      }
    );

    // Clean multiple consecutive spaces
    lineProcessed = lineProcessed.replace(/[ \t]{2,}/g, ' ').trim();

    return prefix ? `${prefix}${lineProcessed}` : lineProcessed;
  });

  return processedLines.join('\n');
}

/**
 * Clean Notebook Math Renderer component:
 * - Separates natural language text and math equations with clean spacing and typography.
 * - Renders mathematical fractions as genuine stacked horizontal-bar fractions.
 * - Never shows raw \frac syntax or merges text words into italic math font.
 * - Supports bold text (**...**), lists, headers, and multilingual scripts.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ 
  content, 
  isUser = false, 
  isDark = false, 
  className = '' 
}) => {
  if (!content) return null;

  // Determine if dark styling should be applied
  const isDarkMode = isDark || isUser || className.includes('text-slate-100') || className.includes('text-slate-200') || className.includes('text-white') || className.includes('prose-invert');

  const normalized = normalizeMathText(content);
  const lines = normalized.split('\n');

  return (
    <div className={`space-y-2 w-full max-w-full overflow-hidden break-words text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-slate-100' : 'text-slate-800'} ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return <div key={`empty-${lineIdx}`} className="h-1.5" />;
        }

        // Horizontal dividers: --- or *** or ___
        if (/^(\-{3,}|\*{3,}|\_{3,})$/.test(trimmedLine)) {
          return (
            <div
              key={`hr-${lineIdx}`}
              className={`my-3 border-t ${isDarkMode ? 'border-slate-700/80' : 'border-slate-200'}`}
            />
          );
        }

        // Check if the entire line is a standalone single-dollar equation: $...$
        const isStandaloneEquation = trimmedLine.startsWith('$') && trimmedLine.endsWith('$') && trimmedLine.length > 2 && !trimmedLine.slice(1, -1).includes('$');

        if (isStandaloneEquation) {
          let rawMath = trimmedLine.slice(1, -1);
          let trailingPunct = '';
          const punctMatch = rawMath.match(/([\.\,\;\:\!\?])$/);
          if (punctMatch) {
            trailingPunct = punctMatch[1];
            rawMath = rawMath.slice(0, -1);
          }
          const math = normalizeFractions(rawMath.replace(/\\+(\.{1,3})?\s*$/, '').trim());

          return (
            <div
              key={`standalone-${lineIdx}`}
              className={`my-2 py-1 overflow-x-auto text-left scrollbar-none font-normal tracking-wide flex items-baseline gap-1 ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              <InlineMath
                math={math}
                renderError={(_error) => (
                  <span className="font-serif italic text-base px-1">{math}</span>
                )}
              />
              {trailingPunct && <span className="opacity-90">{trailingPunct}</span>}
            </div>
          );
        }

        // Check markdown header structures
        const isHeading3 = trimmedLine.startsWith('### ');
        const isHeading2 = !isHeading3 && trimmedLine.startsWith('## ');
        const isHeading1 = !isHeading2 && !isHeading3 && trimmedLine.startsWith('# ');
        const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ');
        const isNumbered = /^[0-9]+[\.\)]\s+/.test(trimmedLine);

        let cleanLine = line;
        let prefixNode: React.ReactNode = null;

        if (isHeading3) {
          cleanLine = trimmedLine.substring(4);
        } else if (isHeading2) {
          cleanLine = trimmedLine.substring(3);
        } else if (isHeading1) {
          cleanLine = trimmedLine.substring(2);
        } else if (isBullet) {
          cleanLine = trimmedLine.substring(2);
          prefixNode = (
            <span className={`inline-block mr-2 font-bold ${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
              •
            </span>
          );
        } else if (isNumbered) {
          const numMatch = trimmedLine.match(/^([0-9]+[\.\)])\s+(.*)$/);
          if (numMatch) {
            cleanLine = numMatch[2];
            prefixNode = (
              <span className={`inline-block mr-2 font-bold font-mono ${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
                {numMatch[1]}
              </span>
            );
          }
        }

        // Parse inline math ($...$), bold markdown (**...**), and inline code (`...`) within the line
        // Regex splits on $...$ blocks first
        const mathTokens = cleanLine.split(/(\$[^\$\n]+?\$)/g);

        const renderedLineContent = mathTokens.map((token, tokenIdx) => {
          if (!token) return null;

          // Check if token is inline math: $...$
          if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
            let rawMath = token.slice(1, -1);
            let trailingPunct = '';
            const punctMatch = rawMath.match(/([\.\,\;\:\!\?])$/);
            if (punctMatch) {
              trailingPunct = punctMatch[1];
              rawMath = rawMath.slice(0, -1);
            }
            const math = normalizeFractions(rawMath.replace(/\\+(\.{1,3})?\s*$/, '').trim());

            return (
              <span
                key={`inline-math-${tokenIdx}`}
                className={`inline-flex items-baseline px-0.5 mx-0.5 align-baseline ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                <InlineMath
                  math={math}
                  renderError={(_error) => (
                    <span className="font-serif italic text-base px-0.5">{math}</span>
                  )}
                />
                {trailingPunct && <span className="opacity-90">{trailingPunct}</span>}
              </span>
            );
          }

          // Parse markdown inline code (`...`) and bold (**...**) in non-math text
          const codeAndBoldRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
          const textSegments: (string | React.ReactNode)[] = [];
          let lastIndex = 0;
          let match;

          while ((match = codeAndBoldRegex.exec(token)) !== null) {
            if (match.index > lastIndex) {
              textSegments.push(token.substring(lastIndex, match.index));
            }
            const matchedStr = match[0];
            if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
              textSegments.push(
                <code
                  key={`code-${tokenIdx}-${match.index}`}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    isDarkMode ? 'bg-slate-800 text-purple-300 border border-slate-700' : 'bg-slate-100 text-purple-700'
                  }`}
                >
                  {matchedStr.slice(1, -1)}
                </code>
              );
            } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
              textSegments.push(
                <strong
                  key={`bold-${tokenIdx}-${match.index}`}
                  className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'}`}
                >
                  {matchedStr.slice(2, -2)}
                </strong>
              );
            }
            lastIndex = codeAndBoldRegex.lastIndex;
          }
          if (lastIndex < token.length) {
            textSegments.push(token.substring(lastIndex));
          }

          return <React.Fragment key={`text-frag-${tokenIdx}`}>{textSegments}</React.Fragment>;
        });

        if (isHeading1) {
          return (
            <div
              key={`h1-${lineIdx}`}
              className={`font-black text-base sm:text-lg mt-3 mb-1 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {renderedLineContent}
            </div>
          );
        }

        if (isHeading2 || isHeading3) {
          return (
            <div
              key={`h2-${lineIdx}`}
              className={`font-bold text-sm sm:text-base mt-2.5 mb-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {renderedLineContent}
            </div>
          );
        }

        if (isBullet) {
          return (
            <div
              key={`bullet-${lineIdx}`}
              className={`flex items-start ml-1.5 sm:ml-2 text-sm sm:text-base leading-relaxed ${
                isDarkMode ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              <span className="shrink-0">{prefixNode}</span>
              <div className="flex-1">{renderedLineContent}</div>
            </div>
          );
        }

        if (isNumbered) {
          return (
            <div
              key={`num-${lineIdx}`}
              className={`flex items-start ml-1 sm:ml-1.5 text-sm sm:text-base leading-relaxed ${
                isDarkMode ? 'text-slate-100' : 'text-slate-800'
              }`}
            >
              <span className="shrink-0">{prefixNode}</span>
              <div className="flex-1">{renderedLineContent}</div>
            </div>
          );
        }

        return (
          <div
            key={`line-${lineIdx}`}
            className={`text-sm sm:text-base leading-relaxed ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            {renderedLineContent}
          </div>
        );
      })}
    </div>
  );
};

export default MathRenderer;
