import { describe, it, expect } from 'vitest';
// Date calculation functions are defined in this test file

// Date calculation functions
function calculateDuration(startDate: Date, endDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function formatDateForGantt(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseGanttDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function isDateInRange(date: Date, range: { start: Date; end: Date }): boolean {
  return date >= range.start && date <= range.end;
}

describe('Date Calculations', () => {
  describe('calculateDuration', () => {
    it('should calculate correct duration in days', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-10');
      expect(calculateDuration(start, end)).toBe(9);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2026-01-01');
      expect(calculateDuration(date, date)).toBe(0);
    });

    it('should handle negative duration', () => {
      const start = new Date('2026-01-10');
      const end = new Date('2026-01-01');
      expect(calculateDuration(start, end)).toBe(-9);
    });

    it('should handle跨越月份', () => {
      const start = new Date('2026-01-15');
      const end = new Date('2026-02-15');
      expect(calculateDuration(start, end)).toBe(31);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const start = new Date('2026-01-01');
      const result = addDays(start, 5);
      expect(result).toEqual(new Date('2026-01-06'));
    });

    it('should subtract days with negative value', () => {
      const start = new Date('2026-01-10');
      const result = addDays(start, -5);
      expect(result).toEqual(new Date('2026-01-05'));
    });

    it('should handle month boundary', () => {
      const start = new Date('2026-01-30');
      const result = addDays(start, 5);
      expect(result).toEqual(new Date('2026-02-04'));
    });

    it('should not mutate original date', () => {
      const start = new Date('2026-01-01');
      const original = new Date(start);
      addDays(start, 5);
      expect(start).toEqual(original);
    });
  });

  describe('startOfWeek', () => {
    it('should return Sunday for any date in week', () => {
      const wednesday = new Date('2026-01-07'); // Wednesday
      const result = startOfWeek(wednesday);
      expect(result.getDay()).toBe(0); // Sunday
    });

    it('should handle Sunday input', () => {
      const sunday = new Date('2026-01-04');
      const result = startOfWeek(sunday);
      expect(result).toEqual(new Date('2026-01-04'));
    });

    it('should reset time to midnight', () => {
      const date = new Date('2026-01-07T14:30:00');
      const result = startOfWeek(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('startOfMonth', () => {
    it('should return first day of month', () => {
      const date = new Date('2026-01-15');
      const result = startOfMonth(date);
      expect(result.getDate()).toBe(1);
    });

    it('should handle different months', () => {
      const feb = new Date('2026-02-15');
      const result = startOfMonth(feb);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(1);
    });
  });

  describe('isWeekend', () => {
    it('should return true for Sunday', () => {
      expect(isWeekend(new Date('2026-01-04'))).toBe(true);
    });

    it('should return true for Saturday', () => {
      expect(isWeekend(new Date('2026-01-03'))).toBe(true);
    });

    it('should return false for weekdays', () => {
      expect(isWeekend(new Date('2026-01-05'))).toBe(false); // Monday
      expect(isWeekend(new Date('2026-01-09'))).toBe(false); // Friday
    });
  });

  describe('getWorkingDays', () => {
    it('should count weekdays only', () => {
      const start = new Date('2026-01-05'); // Monday
      const end = new Date('2026-01-09'); // Friday
      expect(getWorkingDays(start, end)).toBe(5);
    });

    it('should exclude weekends', () => {
      const start = new Date('2026-01-05'); // Monday
      const end = new Date('2026-01-11'); // Sunday
      expect(getWorkingDays(start, end)).toBe(5); // Mon-Fri (excluding Sat-Sun)
    });

    it('should handle same day', () => {
      const date = new Date('2026-01-05');
      expect(getWorkingDays(date, date)).toBe(1);
    });

    it('should return 0 for weekend-only range', () => {
      const saturday = new Date('2026-01-03');
      const sunday = new Date('2026-01-04');
      expect(getWorkingDays(saturday, sunday)).toBe(0);
    });
  });

  describe('formatDateForGantt', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2026-01-15');
      expect(formatDateForGantt(date)).toBe('2026-01-15');
    });

    it('should pad single digit month and day', () => {
      const date = new Date('2026-01-05');
      expect(formatDateForGantt(date)).toBe('2026-01-05');
    });
  });

  describe('parseGanttDate', () => {
    it('should parse YYYY-MM-DD format', () => {
      const result = parseGanttDate('2026-01-15');
      expect(result).toEqual(new Date('2026-01-15'));
    });

    it('should handle padded values', () => {
      const result = parseGanttDate('2026-01-05');
      expect(result.getDate()).toBe(5);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('clampDate', () => {
    it('should return date when within range', () => {
      const date = new Date('2026-01-15');
      const min = new Date('2026-01-01');
      const max = new Date('2026-01-31');
      expect(clampDate(date, min, max)).toEqual(date);
    });

    it('should clamp to min when below range', () => {
      const date = new Date('2025-12-15');
      const min = new Date('2026-01-01');
      const max = new Date('2026-01-31');
      expect(clampDate(date, min, max)).toEqual(min);
    });

    it('should clamp to max when above range', () => {
      const date = new Date('2026-02-15');
      const min = new Date('2026-01-01');
      const max = new Date('2026-01-31');
      expect(clampDate(date, min, max)).toEqual(max);
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const date = new Date('2026-01-15');
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31')
      };
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('should return true for date at start boundary', () => {
      const date = new Date('2026-01-01');
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31')
      };
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('should return true for date at end boundary', () => {
      const date = new Date('2026-01-31');
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31')
      };
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const date = new Date('2026-02-15');
      const range = {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31')
      };
      expect(isDateInRange(date, range)).toBe(false);
    });
  });
});
