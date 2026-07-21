/**
 * Generates a stable, locale-independent date string in YYYY-MM-DD format.
 */
export function getSafeDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses any date string format into a local Date object at noon.
 * Supports:
 * - YYYY-MM-DD
 * - DD/MM/YYYY
 * - MM/DD/YYYY
 */
export function parseDateString(dateStr: string): Date {
  const cleaned = dateStr.trim();
  
  // 1. Check YYYY-MM-DD format
  const dashParts = cleaned.split('-');
  if (dashParts.length === 3 && dashParts[0].length === 4) {
    const y = parseInt(dashParts[0], 10);
    const m = parseInt(dashParts[1], 10);
    const d = parseInt(dashParts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
  }

  // 2. Check slash-based formats (e.g. DD/MM/YYYY or MM/DD/YYYY)
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);
      const third = parseInt(parts[2], 10);

      // Verify the third part is a year (4 digits)
      if (parts[2].length === 4 && !isNaN(first) && !isNaN(second) && !isNaN(third)) {
        if (first > 12) {
          // Definitely DD/MM/YYYY (e.g. 18/07/2026)
          return new Date(third, second - 1, first, 12, 0, 0, 0);
        } else if (second > 12) {
          // Definitely MM/DD/YYYY (e.g. 07/18/2026)
          return new Date(third, first - 1, second, 12, 0, 0, 0);
        } else {
          // Ambiguous (both <= 12). Probe browser locale to see which is first.
          let isMonthFirst = true;
          try {
            const dummy = new Date(2026, 11, 25); // Dec 25, 2026
            if (dummy.toLocaleDateString().startsWith('25')) {
              isMonthFirst = false; // Day is first (e.g. en-IN, en-GB)
            }
          } catch (e) {}

          if (isMonthFirst) {
            return new Date(third, first - 1, second, 12, 0, 0, 0);
          } else {
            return new Date(third, second - 1, first, 12, 0, 0, 0);
          }
        }
      }
    }
  }

  const d = new Date(cleaned);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Calculates the calendar days difference between two date strings safely.
 * Gracefully parses both new stable YYYY-MM-DD strings and older locale-dependent strings.
 */
export function getDaysDifference(dateStr1?: string, dateStr2?: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  try {
    const d1 = parseDateString(dateStr1);
    const d2 = parseDateString(dateStr2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 999;
    }

    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 999 : diffDays;
  } catch (e) {
    return 999;
  }
}
