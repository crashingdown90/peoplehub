// @ai:ag - Created by Antigravity
// Date utility functions for Indonesian locale

/**
 * Format date to Indonesian locale
 */
export function formatDate(
    date: Date | string | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!date) return '-';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...options,
    }).format(parsed);
}

/**
 * Format time (HH:mm)
 */
export function formatTime(date: Date | string): string {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(date));
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
    return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time for input fields (HH:mm)
 */
export function formatTimeForInput(date: Date | string): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get number of days between two dates
 */
export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date | string): boolean {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

/**
 * Check if date is workday (Monday-Friday)
 */
export function isWorkday(date: Date | string): boolean {
    return !isWeekend(date);
}

/**
 * Get number of work days in a month
 */
export function getWorkDaysInMonth(year: number, month: number): number {
    const date = new Date(year, month, 1);
    let workDays = 0;

    while (date.getMonth() === month) {
        if (isWorkday(date)) {
            workDays++;
        }
        date.setDate(date.getDate() + 1);
    }

    return workDays;
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Get relative time string (e.g., "2 jam yang lalu")
 */
export function getRelativeTime(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'Baru saja';
    } else if (diffMin < 60) {
        return `${diffMin} menit yang lalu`;
    } else if (diffHour < 24) {
        return `${diffHour} jam yang lalu`;
    } else if (diffDay < 7) {
        return `${diffDay} hari yang lalu`;
    } else {
        return formatDate(date);
    }
}

/**
 * Parse time string (HH:mm) to minutes from midnight
 */
export function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Format minutes to time string (HH:mm)
 */
export function formatMinutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculate duration between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const startMinutes = parseTimeToMinutes(startTime);
    let endMinutes = parseTimeToMinutes(endTime);

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
}

/**
 * Get period string (YYYY-MM)
 */
export function getPeriodString(date: Date | string = new Date()): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Format period string to human readable
 */
export function formatPeriod(period: string): string {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(date);
}

// ==========================================
// WORKING DAYS & HOLIDAYS
// ==========================================

/**
 * Default Indonesian national holidays (format: MM-DD)
 * This should be updated annually or fetched from API
 */
export const DEFAULT_HOLIDAYS: string[] = [
    '01-01', // Tahun Baru
    '05-01', // Hari Buruh
    '06-01', // Hari Lahir Pancasila
    '08-17', // Hari Kemerdekaan
    '12-25', // Natal
];

/**
 * Check if date is a holiday
 */
export function isHoliday(
    date: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): boolean {
    const d = new Date(date);
    const monthDay = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
}

/**
 * Check if date is a working day (not weekend, not holiday)
 */
export function isWorkingDay(
    date: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): boolean {
    return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Get number of working days between two dates
 */
export function getWorkingDays(
    startDate: Date | string,
    endDate: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure start <= end
    if (start > end) {
        return getWorkingDays(end, start, holidays);
    }

    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
        if (isWorkingDay(current, holidays)) {
            workingDays++;
        }
        current.setDate(current.getDate() + 1);
    }

    return workingDays;
}

/**
 * Get next working day from given date
 */
export function getNextWorkingDay(
    date: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);

    while (!isWorkingDay(d, holidays)) {
        d.setDate(d.getDate() + 1);
    }

    return d;
}

/**
 * Get previous working day from given date
 */
export function getPreviousWorkingDay(
    date: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);

    while (!isWorkingDay(d, holidays)) {
        d.setDate(d.getDate() - 1);
    }

    return d;
}

/**
 * Add working days to a date
 */
export function addWorkingDays(
    date: Date | string,
    days: number,
    holidays: string[] = DEFAULT_HOLIDAYS
): Date {
    const d = new Date(date);
    let remaining = Math.abs(days);
    const direction = days >= 0 ? 1 : -1;

    while (remaining > 0) {
        d.setDate(d.getDate() + direction);
        if (isWorkingDay(d, holidays)) {
            remaining--;
        }
    }

    return d;
}

/**
 * Get all working days in a date range
 */
export function getWorkingDaysInRange(
    startDate: Date | string,
    endDate: Date | string,
    holidays: string[] = DEFAULT_HOLIDAYS
): Date[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workingDays: Date[] = [];

    const current = new Date(start);

    while (current <= end) {
        if (isWorkingDay(current, holidays)) {
            workingDays.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
    }

    return workingDays;
}

/**
 * Check if today is a working day
 */
export function isTodayWorkingDay(holidays: string[] = DEFAULT_HOLIDAYS): boolean {
    return isWorkingDay(new Date(), holidays);
}

// Aliases for test compatibility
export const getStartOfDay = startOfDay;
export const getEndOfDay = endOfDay;
export const getMonthRange = (year: number, month: number) => ({
    start: new Date(year, month - 1, 1),
    end: endOfMonth(new Date(year, month - 1, 1)),
});
export const isToday = (date: Date | string): boolean => {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
};
