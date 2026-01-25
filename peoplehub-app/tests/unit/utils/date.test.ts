// @ai:ag - Created by Antigravity
// Unit tests for date utilities

import {
    formatDate,
    formatTime,
    formatDateTime,
    getRelativeTime,
    getDaysBetween,
    isToday,
    isWeekend,
    getStartOfDay,
    getEndOfDay,
    getMonthRange,
} from '@/utils/date';

describe('Date Utilities', () => {
    describe('formatDate', () => {
        it('should format date in Indonesian locale', () => {
            const date = new Date('2026-01-19T10:00:00');
            const result = formatDate(date);
            expect(result).toContain('Januari');
            expect(result).toContain('2026');
        });

        it('should handle string dates', () => {
            const result = formatDate('2026-01-19');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle null/undefined gracefully', () => {
            expect(formatDate(null as unknown as Date)).toBe('-');
            expect(formatDate(undefined as unknown as Date)).toBe('-');
        });
    });

    describe('formatTime', () => {
        it('should format time in 24-hour format', () => {
            const date = new Date('2026-01-19T14:30:00');
            const result = formatTime(date);
            expect(result).toMatch(/14[:.]+30/);
        });
    });

    describe('formatDateTime', () => {
        it('should format both date and time', () => {
            const date = new Date('2026-01-19T14:30:00');
            const result = formatDateTime(date);
            expect(result).toContain('Januari');
            expect(result).toMatch(/14[:.]+30/);
        });
    });

    describe('getRelativeTime', () => {
        it('should return "baru saja" for recent times', () => {
            const now = new Date();
            const result = getRelativeTime(now);
            expect(result.toLowerCase()).toContain('baru saja');
        });

        it('should return minutes ago for recent past', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const result = getRelativeTime(fiveMinutesAgo);
            expect(result.toLowerCase()).toContain('menit');
        });
    });

    describe('getDaysBetween', () => {
        it('should return correct number of days', () => {
            const start = new Date('2026-01-01');
            const end = new Date('2026-01-10');
            expect(getDaysBetween(start, end)).toBe(9);
        });

        it('should return 0 for same day', () => {
            const date = new Date('2026-01-19');
            expect(getDaysBetween(date, date)).toBe(0);
        });

        it('should handle dates in reverse order', () => {
            const start = new Date('2026-01-10');
            const end = new Date('2026-01-01');
            expect(getDaysBetween(start, end)).toBe(9);
        });
    });

    describe('isToday', () => {
        it('should return true for today', () => {
            expect(isToday(new Date())).toBe(true);
        });

        it('should return false for yesterday', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(isToday(yesterday)).toBe(false);
        });
    });

    describe('isWeekend', () => {
        it('should return true for Saturday', () => {
            const saturday = new Date('2026-01-17'); // A Saturday
            expect(isWeekend(saturday)).toBe(true);
        });

        it('should return true for Sunday', () => {
            const sunday = new Date('2026-01-18'); // A Sunday
            expect(isWeekend(sunday)).toBe(true);
        });

        it('should return false for weekdays', () => {
            const monday = new Date('2026-01-19'); // A Monday
            expect(isWeekend(monday)).toBe(false);
        });
    });

    describe('getStartOfDay', () => {
        it('should return date with time set to 00:00:00', () => {
            const date = new Date('2026-01-19T14:30:45');
            const result = getStartOfDay(date);
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });
    });

    describe('getEndOfDay', () => {
        it('should return date with time set to 23:59:59', () => {
            const date = new Date('2026-01-19T14:30:45');
            const result = getEndOfDay(date);
            expect(result.getHours()).toBe(23);
            expect(result.getMinutes()).toBe(59);
            expect(result.getSeconds()).toBe(59);
        });
    });

    describe('getMonthRange', () => {
        it('should return start and end of month', () => {
            const { start, end } = getMonthRange(2026, 1); // January 2026
            expect(start.getMonth()).toBe(0); // January is 0
            expect(start.getDate()).toBe(1);
            expect(end.getMonth()).toBe(0);
            expect(end.getDate()).toBe(31);
        });
    });
});
