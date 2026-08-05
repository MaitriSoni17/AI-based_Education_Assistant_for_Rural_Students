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

/**
 * Returns 7 Date objects corresponding to Monday through Sunday of the current week.
 */
export function getCurrentWeekDates(refDate: Date = new Date()): Date[] {
  const date = new Date(refDate);
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  monday.setHours(12, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export interface FormattedDateInfo {
  dateStr: string; // "YYYY-MM-DD"
  dayName: string; // "Wed" or "बुध"
  monthDayStr: string; // "5 Aug" or "5 अग"
  displayLabel: string; // "Wed, 5 Aug" or "बुध, 5 अग"
  fullDisplayLabel: string; // "Wednesday, 5 August 2026"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Formats a Date object into detailed English or Hindi label metadata.
 */
export function formatDateInfo(date: Date, lang: string = 'en'): FormattedDateInfo {
  const dateStr = getSafeDateString(date);
  const todayStr = getSafeDateString(new Date());

  const dayIdx = date.getDay(); // 0 = Sun, 1 = Mon ...
  const monthIdx = date.getMonth(); // 0 = Jan ...
  const dayOfMonth = date.getDate();

  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  const fullDaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fullDaysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsHi = ['जन', 'फर', 'मार्च', 'अप्र', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];

  const fullMonthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fullMonthsHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const isHindi = lang === 'hi';

  const dayName = isHindi ? daysHi[dayIdx] : daysEn[dayIdx];
  const monthStr = isHindi ? monthsHi[monthIdx] : monthsEn[monthIdx];
  const fullDayName = isHindi ? fullDaysHi[dayIdx] : fullDaysEn[dayIdx];
  const fullMonthStr = isHindi ? fullMonthsHi[monthIdx] : fullMonthsEn[monthIdx];

  const monthDayStr = `${dayOfMonth} ${monthStr}`;
  const displayLabel = `${dayName}, ${monthDayStr}`;
  const fullDisplayLabel = `${fullDayName}, ${dayOfMonth} ${fullMonthStr} ${date.getFullYear()}`;

  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;
  const isFuture = dateStr > todayStr;

  return {
    dateStr,
    dayName,
    monthDayStr,
    displayLabel,
    fullDisplayLabel,
    isToday,
    isPast,
    isFuture
  };
}

