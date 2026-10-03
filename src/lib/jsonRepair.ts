/**
 * Robust JSON repair and safe-parsing utility for AI responses.
 * Handles markdown fences, invalid LaTeX escape sequences (e.g. \sqrt, \frac, \theta),
 * unescaped literal newlines in strings, trailing commas, and truncated responses.
 */

export function repairJsonString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '{}';

  let cleaned = raw.trim();

  // 1. Remove bracketed conversational/emotion markers like [excitedly], [whispers], etc.
  cleaned = cleaned.replace(/^\[\s*[a-zA-Z\s,]+\s*\]\s*/gi, '');

  // 2. Extract content from markdown code fences if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 3. Find outer starting bracket or brace if wrapped by AI preamble
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }

  // 4. Find the last closing brace or bracket
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  let endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx !== -1 && endIdx < cleaned.length - 1) {
    cleaned = cleaned.substring(0, endIdx + 1);
  }

  // 5. Replace actual unescaped newlines/tabs inside string literals
  let sanitized = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (esc) {
      sanitized += c;
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      sanitized += c;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      sanitized += c;
      continue;
    }
    if (inStr) {
      if (c === '\n') {
        sanitized += '\\n';
        continue;
      }
      if (c === '\r') {
        sanitized += '\\r';
        continue;
      }
      if (c === '\t') {
        sanitized += '\\t';
        continue;
      }
    }
    sanitized += c;
  }
  cleaned = sanitized;

  // 6. Fix invalid escape sequences.
  // In JSON, valid escapes are \", \\, \/, \b, \f, \n, \r, \t, and \uXXXX.
  // LaTeX formulas frequently produce \sqrt, \(, \), \text, \times, \alpha, \beta, \cdot, etc.
  cleaned = cleaned.replace(/\\(?:[^"\\/bfnrtu]|u(?![\da-fA-F]{4}))/g, (match) => {
    return '\\' + match;
  });

  // 7. Fix trailing commas before closing braces/brackets: `, }` -> `}` and `, ]` -> `]`
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 8. Fix truncated JSON if response was cut off
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (ch === '\\') {
      isEscaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces = Math.max(0, openBraces - 1);
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  // If ending inside a string, close it
  if (inString) {
    cleaned += '"';
  }

  // Remove any trailing commas at the very end
  cleaned = cleaned.replace(/,\s*$/, '');

  // Close unclosed arrays and objects
  while (openBrackets > 0 || openBraces > 0) {
    if (openBrackets > 0) {
      cleaned += ']';
      openBrackets--;
    }
    if (openBraces > 0) {
      cleaned += '}';
      openBraces--;
    }
  }

  return cleaned;
}

/**
 * Safely parses JSON with automatic repair and fallback handling.
 */
export function safeParseJson<T = any>(raw: string, fallback: T | null = null): T | null {
  if (!raw || typeof raw !== 'string') return fallback;

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(raw) as T;
  } catch {}

  // Attempt 2: Direct parse after basic trim & emotion strip
  const basicClean = raw.replace(/^\[\s*[a-zA-Z\s,]+\s*\]\s*/gi, '').trim();
  try {
    return JSON.parse(basicClean) as T;
  } catch {}

  // Attempt 3: Markdown fence extraction
  const codeBlockMatch = basicClean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {}
  }

  // Attempt 4: Full regex-based JSON repair
  try {
    const repaired = repairJsonString(raw);
    return JSON.parse(repaired) as T;
  } catch {}

  // Attempt 5: Candidate substring between outermost braces or brackets
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = raw.substring(firstBrace, lastBrace + 1);
      const repairedCand = repairJsonString(candidate);
      return JSON.parse(repairedCand) as T;
    } catch {}
  }

  return fallback;
}
